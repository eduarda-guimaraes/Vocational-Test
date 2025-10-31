import os
import random
import uuid
import re
import unicodedata
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
    "hey", "hello", "hi", "iniciar", "começar", "start", "comecar",
    "opa", "eai", "e aí"
}

# Texto institucional para a FAQ "O que é o Vocational Test?"
ABOUT_VT_TEXT = (
    "O Vocational Test é uma plataforma que usa IA para ajudar jovens a descobrirem áreas e carreiras "
    "mais compatíveis com seus interesses, valores e objetivos. Funciona em duas frentes: "
    "(1) um **chat vocacional inteligente** que conduz perguntas curtas e contextuais para entender seu perfil; "
    "e (2) **análises estruturadas** com recomendações de áreas e carreiras, caminhos de formação e próximos passos. "
    "Você conversa, a IA aprende com suas respostas e gera um resumo final com indicações práticas. "
    "Quer começar me contando uma atividade que você gosta de fazer no dia a dia?"
)

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
        'tipo': tipo,  # 'pergunta' | 'resposta' | 'resumo_final'
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
    salvar_mensagem(chat_id, analise_texto, tipo="resumo_final" if "resumo" in (fonte or "") else "resposta")

# ---------- Utilidades ----------
def _strip_accents(s: str) -> str:
    if not s:
        return ""
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

def normalizar_texto(s: str) -> str:
    s = (s or "").strip().lower()
    s = _strip_accents(s)
    s = re.sub(r"\s+", " ", s)
    return s

def revisar_resposta(resposta: str) -> str:
    txt = (resposta or "").strip()
    if len(txt.split()) < 5:
        return "Desculpe, não consegui entender sua resposta completamente. Pode reformular em 1 ou 2 frases?"
    if not txt.endswith(('.', '!', '?')):
        txt += '.'
    if 'não sei' in txt.lower() or 'nao sei' in txt.lower() or 'indeciso' in txt.lower():
        txt = "Sem problemas! Qual atividade do seu dia a dia você curte fazer e que te dá energia?"
    return txt

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
    db = firestore.client()
    respostas_ref = db.collection('chats').document(chat_id).collection('respostas')
    snaps = list(respostas_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(max_pares).stream())
    pares = []
    for doc in reversed(snaps):
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
        contexto = contexto[-max_chars:]
    return contexto

def is_greeting(texto: str) -> bool:
    t = normalizar_texto(texto)
    return t in GREETINGS

def gerar_frase_saudacao(texto: str) -> str:
    t = normalizar_texto(texto)
    if "bom dia" in t:
        return "Bom dia! 😊"
    if "boa tarde" in t:
        return "Boa tarde! 😊"
    if "boa noite" in t:
        return "Boa noite! 😊"
    if "hello" in t or "hi" in t or "hey" in t:
        return "Hello! 👋"
    if "opa" in t or "eai" in t or "e aí" in t:
        return "Opa! 😄"
    return "Olá! 😊"

# ---------- Helpers de entendimento curto ----------
YES_SET = {"sim", "ja", "já", "aham", "uhum", "isso", "claro", "perfeito", "ok"}
NO_SET  = {"nao", "não", "nunca", "ainda nao", "ainda não"}

def eh_muito_curta(texto: str) -> bool:
    t = normalizar_texto(texto)
    return len(t.split()) <= 2 or len(t) <= 6

def classificar_curta(texto: str) -> str | None:
    t = normalizar_texto(texto)
    if t in YES_SET:
        return "yes"
    if t in NO_SET:
        return "no"
    # casos como "já sim", "não ainda"
    if any(w in t for w in ["ja", "já", "sim"]):
        return "yes"
    if any(w in t for w in ["nao", "não"]):
        return "no"
    return None

def extrair_ultima_pergunta_da_ia(chat_id: str) -> str | None:
    """Pega a última resposta da IA e extrai a ÚLTIMA frase interrogativa."""
    db = firestore.client()
    respostas_ref = db.collection('chats').document(chat_id).collection('respostas')
    snaps = list(respostas_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1).stream())
    if not snaps:
        return None
    ultimo = snaps[0].to_dict() or {}
    texto_ia = (ultimo.get('resposta') or '').strip()
    if not texto_ia:
        return None
    perguntas = re.findall(r'[^?]*\?', texto_ia)
    return perguntas[-1].strip() if perguntas else None

# ---------- Intentos/FAQs ----------
FAQ_TRIGGERS = [
    r"\bo que e\b",
    r"\bsobre\b",
    r"\bcomo funciona\b",
    r"\bquem sao voces\b",
    r"\bquem e voces\b"
]
VT_TRIGGERS = [
    r"\bvocational test\b",
    r"\bvt\b"
]

def eh_pergunta_sobre_vt(texto: str) -> bool:
    t = normalizar_texto(texto)
    return any(re.search(p, t) for p in FAQ_TRIGGERS) and any(re.search(v, t) for v in VT_TRIGGERS)

# ---------- Endpoints ----------
@main.route('/api/chat-vocacional', methods=['POST'])
def chat_vocacional():
    data = request.get_json() or {}
    pergunta = data.get('mensagem', '') or ''
    chat_id = data.get('chat_id', gerar_chat_id())

    ENCERRAR = 'encerrar teste' in normalizar_texto(pergunta)
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

        # FAQ: "o que é/sobre/como funciona + vocational test/vt"
        if eh_pergunta_sobre_vt(pergunta):
            salvar_resposta_firebase(chat_id, pergunta, ABOUT_VT_TEXT)
            return jsonify({"resposta": ABOUT_VT_TEXT, "pergunta_aleatoria": None})

        # --- INÍCIO DA CONVERSA: saudação + pergunta contextual ---
        if kickoff:
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
            pergunta_contextual = (response.choices[0].message.content or "").strip()
            saudacao = gerar_frase_saudacao(pergunta)
            resposta_final = f"{saudacao} {pergunta_contextual}"
            salvar_mensagem(chat_id, resposta_final, tipo="resposta")
            return jsonify({"resposta": resposta_final, "pergunta_aleatoria": None})

        # --- Tratamento de respostas muito curtas (sim/já | não/ainda não) ---
        if eh_muito_curta(pergunta):
            classe = classificar_curta(pergunta)
            ultima_pergunta = extrair_ultima_pergunta_da_ia(chat_id)
            if classe in {"yes", "no"} and ultima_pergunta:
                if classe == "yes":
                    # Aprofundar sem repetir a pergunta
                    msgs = [
                        {"role": "system", "content":
                            "Você é um orientador vocacional. O usuário respondeu de forma MUITO curta "
                            "('sim'/'já') à pergunta anterior. Gere UMA pergunta de aprofundamento específica, "
                            "sem repetir a pergunta anterior, conectando com o contexto. PT-BR. 1 frase. Termine com '?'."},
                        {"role": "user", "content":
                            f"Pergunta anterior da IA: {ultima_pergunta}\n"
                            f"Resposta curta do usuário: {pergunta}\n"
                            f"Gere uma pergunta de aprofundamento concreta (ex.: 'Qual foi?', 'O que chamou sua atenção?', 'Onde foi?', 'Por quê?')."}
                    ]
                else:  # "no"
                    msgs = [
                        {"role": "system", "content":
                            "Você é um orientador vocacional. O usuário respondeu de forma MUITO curta "
                            "('não'/'ainda não') à pergunta anterior. Gere UMA pergunta alternativa que destrave o assunto, "
                            "sem repetir a pergunta anterior, oferecendo um caminho prático. PT-BR. 1 frase. Termine com '?'."},
                        {"role": "user", "content":
                            f"Pergunta anterior da IA: {ultima_pergunta}\n"
                            f"Resposta curta do usuário: {pergunta}\n"
                            f"Gere uma pergunta que convide a detalhar obstáculos, preferências ou próximos passos práticos."}
                    ]
                r = client.chat.completions.create(
                    model=AI_MODEL,
                    messages=msgs,
                    max_tokens=60,
                    temperature=0.4
                )
                follow_up = (r.choices[0].message.content or "").strip()
                chats_contagem_perguntas[chat_id] = contagem_atual + 1
                salvar_resposta_firebase(chat_id, pergunta, follow_up)
                return jsonify({"resposta": follow_up, "pergunta_aleatoria": None})

        # --- Fluxo normal: COM CONTEXTO compacto e aderência ---
        contexto_compacto = montar_contexto_compacto(chat_id, max_pares=8, max_chars=3000)

        system_prompt = (
            "Você é um assistente vocacional objetivo e educado. Responda em PT-BR com 1–3 frases claras, "
            "SEM cumprimentos. Primeiro, espelhe 2–3 palavras do que a pessoa acabou de dizer (para mostrar entendimento), "
            "em seguida avance com a ideia principal. Se a nova mensagem estiver fora do tema do contexto, "
            "redirecione gentilmente para interesses, valores, objetivos ou limitações já citados. "
            "Evite repetir perguntas já feitas. Sempre finalize com UMA pergunta curta e específica para avançar a conversa."
        )

        user_prompt = (
            f"Contexto (últimas interações de pergunta e resposta):\n{contexto_compacto}\n\n"
            f"Nova mensagem do usuário: {pergunta}\n\n"
            "Regra: mantenha a conversa no mesmo assunto, conectando explicitamente a resposta ao contexto acima."
        )

        mensagens_completas = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=mensagens_completas,
            max_tokens=180,
            temperature=0.7
        )

        conteudo = (response.choices[0].message.content or "").strip()
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
            resumo = (r2.choices[0].message.content or "").strip()
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

        analise = (response.choices[0].message.content or "").strip()
        salvar_resultado_analise(chat_id, analise, fonte="analise-perfil")

        return jsonify({"analise": analise})

    except Exception as e:
        print(f"Erro na IA (analise-perfil): {e}")
        return jsonify({"analise": "Não foi possível gerar a análise agora. Tente novamente em alguns minutos."}), 500

@main.route("/healthz", methods=["GET"])
def health_check():
    return "OK", 200
