import os
import random
import uuid
from flask import Blueprint, request, jsonify
from firebase_admin import firestore 
from openai import OpenAI

# --- OpenAI ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
AI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
client = OpenAI(api_key=OPENAI_API_KEY)

# --- Flask BP ---
main = Blueprint('main', __name__)

# Perguntas curtas (fallback; não usamos no kickoff contextual)
perguntas_aleatorias = [
    "Você prefere trabalhar com tecnologia ou com pessoas?",
    "Você se vê em um trabalho criativo ou mais técnico?",
    "Você gosta de resolver problemas ou prefere realizar tarefas repetitivas?",
    "Você se imagina em um cargo de liderança ou prefere executar tarefas específicas?",
    "Você gostaria de trabalhar em um ambiente dinâmico ou em um local mais tranquilo?",
    "Você prefere trabalhar sozinho ou em equipe?",
    "Você gostaria de trabalhar em uma área mais voltada para vendas ou mais técnica?",
]

GREETINGS = {
    "oi", "ola", "olá", "bom dia", "boa tarde", "boa noite",
    "hey", "hello", "hi", "iniciar", "começar", "start", "comecar"
}

def gerar_pergunta_aleatoria():
    return random.choice(perguntas_aleatorias)

# Contagem por chat para encerramento automático
chats_contagem_perguntas = {}

def gerar_chat_id():
    return str(uuid.uuid4())

# ---------- Persistência ----------
def salvar_mensagem(chat_id: str, conteudo: str, tipo: str = "resposta"):
    db = firestore.client()
    mensagens_ref = db.collection('chats').document(chat_id).collection('mensagens')
    mensagens_ref.add({
        'tipo': tipo,  # 'pergunta' | 'resposta' | 'resumo_final' (no front vocês usam também)
        'conteudo': conteudo,
        'timestamp': firestore.SERVER_TIMESTAMP
    })

def salvar_resposta_firebase(chat_id: str, pergunta: str, resposta: str, etapa: str | None = None):
    db = firestore.client()
    respostas_ref = db.collection('chats').document(chat_id).collection('respostas')
    payload = {
        'pergunta': pergunta,
        'resposta': resposta,
        'timestamp': firestore.SERVER_TIMESTAMP
    }
    if etapa:
        payload['etapa'] = etapa
    respostas_ref.add(payload)
    salvar_mensagem(chat_id, pergunta, tipo="pergunta")
    salvar_mensagem(chat_id, resposta, tipo="resposta")

def salvar_resultado_analise(chat_id: str, analise_texto: str, fonte: str = "analise-perfil"):
    db = firestore.client()
    resultados_ref = db.collection('chats').document(chat_id).collection('resultados')
    resultados_ref.add({
        'fonte': fonte,
        'resultado': analise_texto,
        'timestamp': firestore.SERVER_TIMESTAMP
    })
    salvar_mensagem(chat_id, analise_texto, tipo="resposta")

# ---------- Utilidades ----------
def revisar_resposta(resposta: str) -> str:
    if len(resposta.split()) < 5:
        return "Desculpe, não consegui entender sua resposta completamente. Pode reformular?"
    if not resposta.endswith(('.', '!', '?')):
        resposta += '.'
    if 'não sei' in resposta.lower() or 'indeciso' in resposta.lower():
        resposta = "Sem problemas! Que tipo de atividades você gosta de fazer no seu tempo livre?"
    return resposta

def montar_contexto_do_chat(chat_id: str) -> str:
    db = firestore.client()
    respostas_ref = db.collection('chats').document(chat_id).collection('respostas')
    snaps = respostas_ref.order_by('timestamp').stream()

    blocos = []
    for doc in snaps:
        d = doc.to_dict() or {}
        pergunta = d.get('pergunta', '')
        resposta = d.get('resposta', '')
        etapa = d.get('etapa')
        if etapa:
            blocos.append(f"[{etapa}] Q: {pergunta}\nA: {resposta}")
        else:
            blocos.append(f"Q: {pergunta}\nA: {resposta}")

    return "\n\n".join(blocos) if blocos else "Sem histórico suficiente."

def montar_contexto_compacto(chat_id: str, max_pares: int = 8, max_chars: int = 3000) -> str:
    """
    Versão compacta do contexto: pega apenas os últimos N pares Q/A de 'respostas',
    preservando a ordem cronológica e limitando o tamanho total.
    """
    db = firestore.client()
    respostas_ref = db.collection('chats').document(chat_id).collection('respostas')

    # Buscar os últimos max_pares em ordem decrescente e depois inverter
    snaps = list(respostas_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(max_pares).stream())
    pares = []
    for doc in reversed(snaps):  # volta à ordem cronológica
        d = doc.to_dict() or {}
        pergunta = (d.get('pergunta') or '').strip()
        resposta = (d.get('resposta') or '').strip()
        etapa = d.get('etapa')
        if etapa:
            pares.append(f"[{etapa}] Q: {pergunta}\nA: {resposta}")
        else:
            pares.append(f"Q: {pergunta}\nA: {resposta}")

    contexto = "\n\n".join(pares).strip() or "Sem histórico suficiente."
    if len(contexto) > max_chars:
        contexto = contexto[-max_chars:]  # mantém o final (as interações mais recentes)
    return contexto

def is_greeting(texto: str) -> bool:
    t = (texto or "").strip().lower()
    return t in GREETINGS

# ---------- Endpoints ----------
@main.route('/api/chat-vocacional', methods=['POST'])
def chat_vocacional():
    data = request.get_json() or {}
    pergunta = data.get('mensagem', '') or ''
    chat_id = data.get('chat_id', gerar_chat_id())

    ENCERRAR = 'encerrar teste' in pergunta.strip().lower()
    contagem_atual = chats_contagem_perguntas.get(chat_id, 0)
    kickoff = (contagem_atual == 0) and (pergunta.strip() == '' or is_greeting(pergunta))

    try:
        # Encerramento explícito
        if ENCERRAR:
            contexto = montar_contexto_do_chat(chat_id)
            msgs = [
                {"role": "system", "content": "Você é um orientador vocacional. Resuma de forma clara e objetiva, em PT-BR."},
                {"role": "user", "content": f"Com base no histórico abaixo, gere um RESUMO FINAL curto (6–10 linhas) com: perfil, áreas aderentes e próximos passos.\n\n{contexto}"}
            ]
            response = client.chat.completions.create(
                model=AI_MODEL,
                messages=msgs,
                max_tokens=300,
                temperature=0.6
            )
            resumo = response.choices[0].message.content.strip()
            salvar_resultado_analise(chat_id, resumo, fonte="resumo-final-chat")
            return jsonify({"resposta": resumo, "finalizado": True, "pergunta_aleatoria": None})

        # --- INÍCIO DA CONVERSA LIVRE: gerar pergunta contextual (sem "Olá") ---
        if kickoff:
            # usa histórico completo do questionário + eventuais pares já salvos
            contexto = montar_contexto_do_chat(chat_id)
            msgs = [
                {"role": "system", "content":
                    "Você é um orientador vocacional. Gere UMA única pergunta curta e específica em PT-BR, "
                    "sem cumprimentos, baseada no histórico do questionário do usuário. "
                    "Foque em hábitos do dia a dia relacionados aos interesses citados. "
                    "Apenas 1 pergunta, terminando com '?'."},
                {"role": "user", "content": f"Histórico (perguntas e respostas):\n\n{contexto}\n\nGere UMA pergunta contextual única."}
            ]
            response = client.chat.completions.create(
                model=AI_MODEL,
                messages=msgs,
                max_tokens=60,
                temperature=0.6
            )
            pergunta_contextual = response.choices[0].message.content.strip()

            # Não incrementamos contagem aqui (ainda não houve resposta do usuário)
            salvar_mensagem(chat_id, pergunta_contextual, tipo="resposta")
            return jsonify({"resposta": pergunta_contextual, "pergunta_aleatoria": None})

        # --- Fluxo normal: agora COM CONTEXTO compacto ---
        contexto_compacto = montar_contexto_compacto(chat_id, max_pares=8, max_chars=3000)
        mensagens_completas = [
            {"role": "system", "content":
                "Você é um assistente vocacional objetivo e educado. Responda em PT-BR, com 1–3 frases claras, "
                "SEM cumprimentos do tipo 'Olá' ou 'Como posso ajudar'. "
                "Sempre finalize com UMA pergunta curta e específica para avançar a conversa."
            },
            {"role": "user", "content":
                f"Contexto (últimas interações de pergunta e resposta):\n{contexto_compacto}\n\n"
                f"Nova mensagem do usuário: {pergunta}\n\n"
                f"Considere o contexto para manter o assunto e evite repetir perguntas já feitas."}
        ]

        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=mensagens_completas,
            max_tokens=160,
            temperature=0.7
        )

        conteudo = response.choices[0].message.content.strip()
        conteudo = revisar_resposta(conteudo)

        # Persistência + contagem
        chats_contagem_perguntas[chat_id] = contagem_atual + 1
        salvar_resposta_firebase(chat_id, pergunta, conteudo)

        # Encerramento automático a partir da 10ª interação
        if chats_contagem_perguntas[chat_id] >= 10:
            contexto = montar_contexto_do_chat(chat_id)
            msgs = [
                {"role": "system", "content": "Você é um orientador vocacional. Resuma de forma clara e objetiva, em PT-BR."},
                {"role": "user", "content": f"Gere um RESUMO FINAL (6–10 linhas) com perfil, áreas indicadas e próximos passos, com base no histórico:\n\n{contexto}"}
            ]
            r2 = client.chat.completions.create(
                model=AI_MODEL,
                messages=msgs,
                max_tokens=320,
                temperature=0.6
            )
            resumo = r2.choices[0].message.content.strip()
            salvar_resultado_analise(chat_id, resumo, fonte="resumo-final-automatico")
            return jsonify({"resposta": resumo, "finalizado": True, "pergunta_aleatoria": None})

        return jsonify({"resposta": conteudo, "pergunta_aleatoria": None})

    except Exception as e:
        print(f"Erro na IA (chat-vocacional): {e}")
        return jsonify({
            "resposta": "Desculpe, não consegui processar sua resposta agora. Tente novamente em alguns instantes."
        }), 500

@main.route('/api/analise-perfil', methods=['POST'])
def analise_perfil():
    """
    Entrada: { "chat_id": "...", "respostas": [ { "etapa": "...", "pergunta": "...", "resposta": "..." }, ... ] }
    Saída:   { "analise": "..." }
    """
    data = request.get_json() or {}
    chat_id = data.get('chat_id', gerar_chat_id())
    respostas = data.get('respostas', [])

    if not respostas:
        return jsonify({"analise": "Não recebemos respostas do questionário."}), 400

    try:
        blocos = []
        for item in respostas:
            etapa = item.get('etapa', '')
            pergunta = item.get('pergunta', '')
            resposta = item.get('resposta', '')
            blocos.append(f"[{etapa}]\nPergunta: {pergunta}\nResposta: {resposta}")
            salvar_resposta_firebase(chat_id, pergunta, resposta, etapa=etapa)

        contexto = "\n\n".join(blocos)

        system_msg = (
            "Você é um orientador vocacional profissional. "
            "Baseado no questionário a seguir, produza uma análise clara, em PT-BR, com esta estrutura:"
            "\n1) Síntese do perfil"
            "\n2) Perfis Holland prováveis + justificativa"
            "\n3) Áreas de atuação compatíveis (humanas, exatas, biológicas, técnicas)"
            "\n4) 6–10 carreiras recomendadas (bullets, com justificativa curta)"
            "\n5) Caminhos de formação e primeiros passos práticos"
            "\nRegras: objetivo, sem repetir perguntas, sem frases cortadas."
        )

        user_msg = f"Respostas do questionário:\n\n{contexto}\n\nGere a análise seguindo exatamente a estrutura."

        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": user_msg}],
            max_tokens=900,
            temperature=0.6
        )

        analise = response.choices[0].message.content.strip()
        salvar_resultado_analise(chat_id, analise, fonte="analise-perfil")

        return jsonify({"analise": analise})

    except Exception as e:
        print(f"Erro na IA (analise-perfil): {e}")
        return jsonify({"analise": "Não foi possível gerar a análise agora. Tente novamente em alguns minutos."}), 500

@main.route("/healthz", methods=["GET"])
def health_check():
    return "OK", 200
