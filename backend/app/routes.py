import os
import openai
import random
import firebase_admin
import uuid
from firebase_admin import credentials, firestore
from flask import Blueprint, request, jsonify

# Configuração do Firebase Admin SDK
cred = credentials.Certificate("./config/firebase-credentials.json")  # Substitua pelo caminho correto do arquivo JSON
firebase_admin.initialize_app(cred)

# Acessando o Firestore
db = firestore.client()

# Configura a chave global da OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Lista de todas as perguntas possíveis
perguntas = [
    "Você prefere atividades que exigem criatividade ou que são mais lógicas e organizadas?",
    "Como você se sente quando precisa trabalhar em grupo? Gosta ou prefere trabalhar sozinho?",
    # Adicione as outras perguntas conforme necessário
]

# Dicionário para armazenar as perguntas feitas para cada chat
chats_perguntas = {}
chats_contagem_perguntas = {}

# Definindo o Blueprint 'main'
main = Blueprint('main', __name__)

# Função para gerar um chat_id único
def gerar_chat_id():
    return str(uuid.uuid4())

# Função para salvar respostas no Firebase
def salvar_resposta_firebase(chat_id, pergunta, resposta):
    # Salva a resposta no Firestore, dentro do chat_id correspondente
    respostas_ref = db.collection('chats').document(chat_id).collection('respostas')
    respostas_ref.add({
        'pergunta': pergunta,
        'resposta': resposta,
        'timestamp': firestore.SERVER_TIMESTAMP
    })

# Função para gerar o prompt interativo
# Função para gerar o prompt interativo
def gerar_prompt_interativo(pergunta, respostas_anteriores, chat_id):
    prompt_base = (
        "Você é um assistente vocacional interativo. Seu objetivo é descobrir os interesses e aptidões de um jovem "
        "para ajudá-lo a identificar áreas profissionais que combinem com seu perfil.\n"
        "A cada nova pergunta, leve em consideração o que ele já respondeu e formule questões mais específicas para avançar no diagnóstico.\n"
        "No fim do teste, será gerado um resumo vocacional com base nas respostas anteriores.\n"
        "As perguntas devem ser curtas, claras e diretas, como se fosse uma conversa natural."
    )

    if isinstance(respostas_anteriores, str):
        respostas_anteriores = [respostas_anteriores]

    # Gera o contexto para o modelo com o histórico
    contexto = (
        f"{prompt_base}\n\n"
        f"Histórico de respostas do usuário:\n" +
        "\n".join(respostas_anteriores) +
        f"\n\nMensagem mais recente do usuário: {pergunta}\n"
        f"Baseado nesse histórico, responda de forma coerente, guiando o usuário e em seguida faça uma nova pergunta vocacional para dar continuidade ao teste."
    )

    # Gerenciamento de contagem de perguntas
    if chat_id in chats_perguntas:
        perguntas_restantes = [p for p in perguntas if p not in chats_perguntas[chat_id]]
    else:
        perguntas_restantes = perguntas.copy()

    if perguntas_restantes:
        pergunta_aleatoria = random.choice(perguntas_restantes)
        chats_perguntas.setdefault(chat_id, []).append(pergunta_aleatoria)
        chats_contagem_perguntas[chat_id] = chats_contagem_perguntas.get(chat_id, 0) + 1
    else:
        pergunta_aleatoria = "Você já respondeu todas as perguntas. Com base nas suas respostas, podemos sugerir algumas áreas de interesse."

    return contexto, pergunta_aleatoria


# Função para gerar áreas de interesse com base nas respostas
def gerar_areas_respostas(respostas):
    areas = []
    text = " ".join(respostas).lower()
    
    # Reconhecimento de soft skills associadas a hobbies e interesses
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

# Endpoint de chat vocacional
@main.route('/api/chat-vocacional', methods=['POST'])
def chat_vocacional():
    data = request.get_json() or {}
    pergunta = data.get('mensagem', '')
    respostas_anteriores = data.get('respostas_anteriores', [])
    chat_id = data.get('chat_id', gerar_chat_id())  # Se não houver chat_id, gera um novo

    try:
        # Verifica se o usuário deseja encerrar manualmente
        if "encerrar teste" in pergunta.lower():
            resumo_prompt = (
                "Você é um orientador vocacional. Gere um resumo final com base nas respostas anteriores do usuário. "
                "Explique brevemente o perfil percebido e sugira áreas coerentes de forma empática e encorajadora.\n\n"
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

        # Continua normalmente
       # Gera prompt base
        prompt_interativo, pergunta_aleatoria = gerar_prompt_interativo(
            pergunta, respostas_anteriores, chat_id
        )

        # Prepara o histórico completo da conversa
        mensagens_completas = [
            {"role": "system", "content": "Você é um assistente vocacional que conduz uma conversa com base nas respostas anteriores, "
                                        "buscando entender o perfil do usuário. Você deve manter o contexto e ser natural."}
        ]

        # Adiciona todas as respostas anteriores como mensagens do usuário
        for r in respostas_anteriores:
            mensagens_completas.append({"role": "user", "content": r})

        # Adiciona a pergunta atual como a última interação
        mensagens_completas.append({"role": "user", "content": pergunta})

        # Chamada à API com histórico real
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=mensagens_completas,
            max_tokens=180,
            temperature=0.7
        )


        conteudo = response.choices[0].message.content

        salvar_resposta_firebase(chat_id, pergunta, conteudo)

        # Encerra automaticamente após 10 interações
        if chats_contagem_perguntas.get(chat_id, 0) >= 10:
            resumo_prompt = (
                "Você é um orientador vocacional. Gere um resumo final com base nas respostas anteriores do usuário. "
                "Explique brevemente o perfil percebido e sugira áreas coerentes de forma empática e encorajadora.\n\n"
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