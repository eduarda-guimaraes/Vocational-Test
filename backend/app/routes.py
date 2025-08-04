import os
import openai
import random
import firebase_admin
import uuid
from firebase_admin import firestore
from flask import Blueprint, request, jsonify

# Blueprint
main = Blueprint('main', __name__)

# Conjunto de perguntas sobre carreiras e interesses profissionais
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
    # Última resposta
    respostas_ref = db.collection('chats').document(chat_id).collection('respostas')
    respostas_ref.add({
        'pergunta': pergunta,
        'resposta': resposta,
        'timestamp': firestore.SERVER_TIMESTAMP
    })
    # Histórico completo
    salvar_mensagem(chat_id, pergunta, tipo="pergunta")
    salvar_mensagem(chat_id, resposta, tipo="resposta")

def gerar_prompt_interativo(pergunta, respostas_anteriores, chat_id):
    prompt_base = (
        "Você é um assistente vocacional simpático. "
        "Faça perguntas curtas e objetivas sobre os interesses pessoais do usuário. "
        "Evite qualquer tipo de explicação ou justificativa. "
        "As perguntas devem ser diretas, sem introduções ou explicações. "
        "Ao responder, faça respostas concisas e completas, sem cortar frases no meio."
    )

    contexto = f"{prompt_base}\n\nMensagem mais recente do usuário: {pergunta}"
    return contexto, gerar_pergunta_aleatoria()

def revisar_resposta(resposta):
    # Função para revisar a resposta antes de enviá-la
    if len(resposta.split()) < 5:
        return "Desculpe, não consegui entender sua resposta completamente. Pode reformular?"
    
    # Garantir que a resposta termine com um ponto final
    if not resposta.endswith('.'):
        resposta += '.'

    # Garantir que a resposta seja coerente e objetiva
    if 'não sei' in resposta.lower() or 'indeciso' in resposta.lower():
        resposta = "Que tipo de atividades você gosta de realizar no seu tempo livre?"
    
    return resposta

@main.route('/api/chat-vocacional', methods=['POST'])
def chat_vocacional():
    data = request.get_json() or {}
    pergunta = data.get('mensagem', '')
    respostas_anteriores = data.get('respostas_anteriores', [])
    chat_id = data.get('chat_id', gerar_chat_id())

    try:
        prompt_interativo, pergunta_aleatoria = gerar_prompt_interativo(
            pergunta, respostas_anteriores, chat_id
        )

        mensagens_completas = [{"role": "system", "content": "Você é um assistente vocacional..."}]
        mensagens_completas.append({"role": "user", "content": pergunta})

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=mensagens_completas,
            max_tokens=100,  # Permitir um limite maior de tokens para perguntas mais completas
            temperature=0.7
        )

        conteudo = response.choices[0].message.content.strip()

        # Revisar a resposta antes de enviá-la
        conteudo = revisar_resposta(conteudo)

        chats_contagem_perguntas[chat_id] = chats_contagem_perguntas.get(chat_id, 0) + 1
        salvar_resposta_firebase(chat_id, pergunta, conteudo)

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
