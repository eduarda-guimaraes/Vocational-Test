import os
import openai
import random
import firebase_admin
import uuid
from firebase_admin import firestore
from flask import Blueprint, request, jsonify

# Blueprint
main = Blueprint('main', __name__)



# Lista de perguntas
perguntas = [
    "Você prefere atividades que exigem criatividade ou que são mais lógicas e organizadas?",
    "Como você se sente quando precisa trabalhar em grupo? Gosta ou prefere trabalhar sozinho?",
    # Adicione mais perguntas conforme necessário
]

# Armazenamento temporário em memória
chats_perguntas = {}
chats_contagem_perguntas = {}

def gerar_chat_id():
    return str(uuid.uuid4())

def salvar_resposta_firebase(chat_id, pergunta, resposta):
    db = firestore.client()
    respostas_ref = db.collection('chats').document(chat_id).collection('respostas')
    respostas_ref.add({
        'pergunta': pergunta,
        'resposta': resposta,
        'timestamp': firestore.SERVER_TIMESTAMP
    })

def gerar_prompt_interativo(pergunta, respostas_anteriores, chat_id):
    prompt_base = (
        "Você é um assistente vocacional interativo. Seu objetivo é descobrir os interesses e aptidões de um jovem "
        "para ajudá-lo a identificar áreas profissionais que combinem com seu perfil.\n"
        "A cada nova pergunta, leve em consideração o que ele já respondeu e formule questões mais específicas.\n"
        "As perguntas devem ser curtas, claras e diretas, como se fosse uma conversa natural."
    )

    if isinstance(respostas_anteriores, str):
        respostas_anteriores = [respostas_anteriores]

    contexto = (
        f"{prompt_base}\n\n"
        f"Histórico de respostas do usuário:\n" +
        "\n".join(respostas_anteriores) +
        f"\n\nMensagem mais recente do usuário: {pergunta}\n"
        f"Baseado nesse histórico, responda de forma coerente e em seguida faça uma nova pergunta vocacional."
    )

    if chat_id in chats_perguntas:
        perguntas_restantes = [p for p in perguntas if p not in chats_perguntas[chat_id]]
    else:
        perguntas_restantes = perguntas.copy()

    if perguntas_restantes:
        pergunta_aleatoria = random.choice(perguntas_restantes)
        chats_perguntas.setdefault(chat_id, []).append(pergunta_aleatoria)
        chats_contagem_perguntas[chat_id] = chats_contagem_perguntas.get(chat_id, 0) + 1
    else:
        pergunta_aleatoria = "Você já respondeu todas as perguntas. Podemos sugerir algumas áreas de interesse."

    return contexto, pergunta_aleatoria

def gerar_areas_respostas(respostas):
    areas = []
    text = " ".join(respostas).lower()

    if "trabalho em grupo" in text or "ajudar pessoas" in text:
        areas += ["Psicologia", "Educação", "Serviço Social"]
    if "arte" in text or "criatividade" in text:
        areas += ["Design Gráfico", "Artes Visuais", "Publicidade"]
    if "organização" in text or "estratégia" in text:
        areas += ["Administração de Empresas", "Gestão de Projetos", "Marketing"]
    if "tecnologia" in text or "programação" in text:
        areas += ["Engenharia", "Ciência da Computação", "TI"]
    if "finanças" in text or "números" in text:
        areas += ["Economia", "Administração", "Contabilidade"]

    return areas

@main.route('/api/chat-vocacional', methods=['POST'])
def chat_vocacional():
    data = request.get_json() or {}
    pergunta = data.get('mensagem', '')
    respostas_anteriores = data.get('respostas_anteriores', [])
    chat_id = data.get('chat_id', gerar_chat_id())

    try:
        if "encerrar teste" in pergunta.lower():
            resumo_prompt = (
                "Você é um orientador vocacional. Gere um resumo final com base nas respostas anteriores do usuário. "
                "Explique brevemente o perfil percebido e sugira áreas coerentes.\n\n"
                "Respostas anteriores:\n" + "\n".join(respostas_anteriores)
            )

            resumo = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Você é um orientador vocacional."},
                    {"role": "user", "content": resumo_prompt}
                ],
                max_tokens=200,
                temperature=0.8
            ).choices[0].message.content

            return jsonify({
                "resposta": resumo,
                "pergunta_aleatoria": None
            })

        prompt_interativo, pergunta_aleatoria = gerar_prompt_interativo(
            pergunta, respostas_anteriores, chat_id
        )

        mensagens_completas = [{"role": "system", "content": "Você é um assistente vocacional..."}]
        mensagens_completas += [{"role": "user", "content": r} for r in respostas_anteriores]
        mensagens_completas.append({"role": "user", "content": pergunta})

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=mensagens_completas,
            max_tokens=180,
            temperature=0.7
        )

        conteudo = response.choices[0].message.content

        salvar_resposta_firebase(chat_id, pergunta, conteudo)

        if chats_contagem_perguntas.get(chat_id, 0) >= 10:
            resumo_prompt = (
                "Você é um orientador vocacional. Gere um resumo final com base nas respostas anteriores.\n\n"
                "Respostas anteriores:\n" + "\n".join(respostas_anteriores)
            )
            resumo = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Você é um orientador vocacional."},
                    {"role": "user", "content": resumo_prompt}
                ],
                max_tokens=200,
                temperature=0.8
            ).choices[0].message.content

            return jsonify({
                "resposta": resumo,
                "pergunta_aleatoria": None
            })

        return jsonify({
            "resposta": conteudo,
            "pergunta_aleatoria": pergunta_aleatoria
        })

    except Exception as e:
        print(f"Erro na IA: {e}")
        return jsonify({
            "resposta": "Desculpe, não consegui processar sua resposta agora. Tente novamente em alguns instantes."
        }), 500

@main.route("/healthz", methods=["GET"])
def health_check():
    return "OK", 200
