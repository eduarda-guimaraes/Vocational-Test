import os
import openai
import random
import firebase_admin
import uuid
from firebase_admin import firestore
from flask import Blueprint, request, jsonify

# Blueprint
main = Blueprint('main', __name__)

# Etapas e perguntas
etapas = {
    "autoconhecimento": [
        "Quais são as atividades que você mais gosta de fazer no dia a dia?",
        "Quais matérias da escola você mais gosta/gostava?",
        "Em que tarefas você se destaca?",
        "Você prefere trabalhar com pessoas, ideias ou máquinas?",
        "Você gosta de resolver problemas, criar ou seguir instruções?",
        "Prefere ambientes tranquilos ou agitados?",
        "O que você faz no tempo livre que te faz perder a noção do tempo?"
    ],
    "valores": [
        "O que é mais importante para você em uma carreira? (ex: estabilidade, propósito, status, ajudar, dinheiro, etc.)",
        "Onde você gostaria de trabalhar? Escritório? Ar livre? Público?",
        "Prefere rotina fixa ou flexível?",
        "Como você define sucesso pessoal/profissional?",
        "Gosta de trabalhar sozinho ou em equipe?"
    ],
    "objetivos": [
        "Onde você se imagina em 5 a 10 anos?",
        "Pretende cursar faculdade, técnico ou empreender?",
        "Aceita cursos longos ou prefere formações práticas?",
        "Gosta de liderar ou prefere áreas técnicas?",
        "Quanto espera ganhar em sua profissão ideal?"
    ],
    "limitações": [
        "Alguma limitação financeira, geográfica ou de tempo?",
        "Tem apoio da família ou depende de si mesmo?",
        "Trabalha ou pretende trabalhar durante os estudos?",
        "Já considerou ou descartou alguma carreira? Por quê?"
    ]
}

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

def gerar_prompt_interativo(pergunta, respostas_anteriores, chat_id):
    etapa_atual = "autoconhecimento"
    total_respondidas = len(respostas_anteriores)
    if total_respondidas >= len(etapas["autoconhecimento"]):
        etapa_atual = "valores"
    if total_respondidas >= len(etapas["autoconhecimento"]) + len(etapas["valores"]):
        etapa_atual = "objetivos"
    if total_respondidas >= len(etapas["autoconhecimento"]) + len(etapas["valores"]) + len(etapas["objetivos"]):
        etapa_atual = "limitações"

    perguntas_restantes = etapas[etapa_atual][total_respondidas % len(etapas[etapa_atual]):]
    if perguntas_restantes:
        pergunta_aleatoria = perguntas_restantes[0]
    else:
        pergunta_aleatoria = "Você já respondeu todas as perguntas. Podemos sugerir algumas áreas de interesse."

    prompt_base = (
        "Você é um assistente vocacional interativo e simpático. "
        "A cada nova mensagem, responda com no máximo 3 frases curtas e diretas. "
        "Evite repetir o que o usuário já disse ou o que você mesmo já comentou. "
        "Fale como se estivesse conversando com um adolescente no WhatsApp."
    )


    contexto = f"{prompt_base}\n\nHistórico de respostas do usuário:\n" + "\n".join(respostas_anteriores) + f"\n\nMensagem mais recente do usuário: {pergunta}"
    return contexto, pergunta_aleatoria

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
                messages=[{"role": "system", "content": "Você é um orientador vocacional."},
                          {"role": "user", "content": resumo_prompt}],
                max_tokens=80,
                temperature=0.8
            ).choices[0].message.content

            salvar_mensagem(chat_id, pergunta, tipo="pergunta")
            salvar_mensagem(chat_id, resumo, tipo="resumo_final")

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

        chats_contagem_perguntas[chat_id] = chats_contagem_perguntas.get(chat_id, 0) + 1
        salvar_resposta_firebase(chat_id, pergunta, conteudo)

        if chats_contagem_perguntas[chat_id] >= 10:
            resumo_prompt = (
                "Você é um orientador vocacional. Gere um resumo final com base nas respostas anteriores.\n\n"
                "Respostas anteriores:\n" + "\n".join(respostas_anteriores)
            )
            resumo = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": "Você é um orientador vocacional."},
                          {"role": "user", "content": resumo_prompt}],
                max_tokens=200,
                temperature=0.8
            ).choices[0].message.content

            salvar_mensagem(chat_id, resumo, tipo="resumo_final")

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