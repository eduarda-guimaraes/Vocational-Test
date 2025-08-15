import os
import openai
import random
import uuid
from firebase_admin import firestore
from flask import Blueprint, request, jsonify

# Blueprint
main = Blueprint('main', __name__)

# Perguntas curtas para o chat livre (mantidas)
perguntas_aleatorias = [
    "Você prefere trabalhar com tecnologia ou com pessoas?",
    "Você se vê em um trabalho criativo ou mais técnico?",
    "Você gosta de resolver problemas ou prefere realizar tarefas repetitivas?",
    "Você se imagina em um cargo de liderança ou prefere executar tarefas específicas?",
    "Você gostaria de trabalhar em um ambiente dinâmico ou em um local mais tranquilo?",
    "Você prefere trabalhar sozinho ou em equipe?",
    "Você gostaria de trabalhar em uma área mais voltada para vendas ou mais técnica?"
]

def gerar_pergunta_aleatoria():
    return random.choice(perguntas_aleatorias)

# Armazenamento temporário
chats_contagem_perguntas = {}

def gerar_chat_id():
    return str(uuid.uuid4())

def salvar_mensagem(chat_id, conteudo, tipo="resposta"):
    db = firestore.client()
    mensagens_ref = db.collection('chats').document(chat_id).collection('mensagens')
    mensagens_ref.add({
        'tipo': tipo,
        'conteudo': conteudo,
        'timestamp': firestore.SERVER_TIMESTAMP
    })

def salvar_resposta_firebase(chat_id, pergunta, resposta):
    db = firestore.client()
    respostas_ref = db.collection('chats').document(chat_id).collection('respostas')
    respostas_ref.add({
        'pergunta': pergunta,
        'resposta': resposta,
        'timestamp': firestore.SERVER_TIMESTAMP
    })
    salvar_mensagem(chat_id, pergunta, tipo="pergunta")
    salvar_mensagem(chat_id, resposta, tipo="resposta")

def salvar_resultado_analise(chat_id, analise_texto, fonte="analise-perfil"):
    db = firestore.client()
    resultados_ref = db.collection('chats').document(chat_id).collection('resultados')
    resultados_ref.add({
        'fonte': fonte,
        'resultado': analise_texto,
        'timestamp': firestore.SERVER_TIMESTAMP
    })
    salvar_mensagem(chat_id, analise_texto, tipo="resposta")

def revisar_resposta(resposta):
    if len(resposta.split()) < 5:
        return "Desculpe, não consegui entender sua resposta completamente. Pode reformular?"
    if not resposta.endswith('.'):
        resposta += '.'
    if 'não sei' in resposta.lower() or 'indeciso' in resposta.lower():
        resposta = "Que tipo de atividades você gosta de realizar no seu tempo livre?"
    return resposta

@main.route('/api/chat-vocacional', methods=['POST'])
def chat_vocacional():
    data = request.get_json() or {}
    pergunta = data.get('mensagem', '')
    chat_id = data.get('chat_id', gerar_chat_id())

    try:
        mensagens_completas = [
            {"role": "system", "content": "Você é um assistente vocacional objetivo e educado. Responda em português brasileiro, de forma clara e sem cortar frases."},
            {"role": "user", "content": pergunta}
        ]

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=mensagens_completas,
            max_tokens=140,
            temperature=0.7
        )

        conteudo = response.choices[0].message.content.strip()
        conteudo = revisar_resposta(conteudo)

        chats_contagem_perguntas[chat_id] = chats_contagem_perguntas.get(chat_id, 0) + 1
        salvar_resposta_firebase(chat_id, pergunta, conteudo)

        return jsonify({
            "resposta": conteudo,
            "pergunta_aleatoria": None  # não usamos mais pergunta_aleatoria
        })

    except Exception as e:
        print(f"Erro na IA (chat-vocacional): {e}")
        return jsonify({
            "resposta": "Desculpe, não consegui processar sua resposta agora. Tente novamente em alguns instantes."
        }), 500

@main.route('/api/analise-perfil', methods=['POST'])
def analise_perfil():
    """
    Espera:
    {
      "chat_id": "...",
      "respostas": [
        { "etapa": "ETAPA 1 – AUTOCONHECIMENTO", "pergunta": "...", "resposta": "..." },
        ...
      ]
    }
    Retorna:
    { "analise": "texto com perfis Holland, áreas, carreiras e caminhos de formação" }
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
        contexto = "\n\n".join(blocos)

        system_msg = (
            "Você é um orientador vocacional profissional. "
            "Com base nas respostas do questionário abaixo, produza uma análise objetiva, clara e encadeada, em PT-BR. "
            "Inclua, nesta ordem:\n"
            "1) Síntese do perfil (pontos fortes, preferências e estilo de trabalho)\n"
            "2) Perfis de Holland mais prováveis (realista, investigativo, artístico, social, empreendedor, convencional) e breve justificativa\n"
            "3) Áreas de atuação (humanas, exatas, biológicas, técnicas) mais compatíveis e por quê\n"
            "4) 6 a 10 carreiras recomendadas (em bullets), com uma justificativa curta para cada uma\n"
            "5) Caminhos de formação (faculdades, cursos técnicos/profissionalizantes, certificações) e primeiros passos práticos\n"
            "Regras: seja direto, não repita perguntas, não encerre com frases genéricas, e não corte frases."
        )

        user_msg = (
            "Respostas do questionário estruturado do usuário:\n\n"
            f"{contexto}\n\n"
            "Gere a análise seguindo exatamente a estrutura solicitada."
        )

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ],
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
