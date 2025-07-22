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
def gerar_prompt_interativo(pergunta, respostas_anteriores, chat_id):
    prompt_base = (
        "Você está ajudando um jovem a escolher uma carreira. Pergunte sobre seus interesses e habilidades, "
        "e direcione para áreas de carreira com base nas respostas. "
        "Mantenha a conversa fluida, utilizando as respostas anteriores para sugerir uma carreira que faça sentido."
    )

    if isinstance(respostas_anteriores, str):
        respostas_anteriores = [respostas_anteriores]
    
    contexto = (
        f"{prompt_base}\n\n"
        "Respostas anteriores:\n" +
        "\n".join(respostas_anteriores) +
        f"\nPergunta atual: {pergunta}"
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
        prompt_interativo, pergunta_aleatoria = gerar_prompt_interativo(
            pergunta, respostas_anteriores, chat_id
        )

        # Novo ponto de entrada para o SDK openai>=1.0.0
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[ 
                {"role": "system", "content": "Você é um assistente de teste vocacional."},
                {"role": "user", "content": prompt_interativo}
            ],
            max_tokens=120,  # Ajustando para respostas mais curtas
            temperature=0.7  # Temperatura ajustada para maior criatividade, mas sem respostas longas
        )

        conteudo = response.choices[0].message.content

        # Salvar a resposta no Firebase
        salvar_resposta_firebase(chat_id, pergunta, conteudo)

        # Se alcançou 20 perguntas, sugere áreas
        if chats_contagem_perguntas.get(chat_id, 0) >= 20:
            areas_interesse = gerar_areas_respostas(respostas_anteriores)
            if areas_interesse:
                conteudo += (
                    f"\n\nCom base nas suas respostas, sugerimos as seguintes áreas de interesse: "
                    + ", ".join(areas_interesse)
                )
            # Fechar a conversa
            conteudo += "\nEspero que essas sugestões ajudem na sua escolha de carreira. Você tem mais alguma dúvida?"

        return jsonify({
            "resposta": conteudo,
            "pergunta_aleatoria": pergunta_aleatoria
        })

    except Exception as e:
        print(f"Erro na IA: {e}")
        return jsonify({
            "resposta": "Desculpe, não consegui processar sua resposta agora. Tente novamente em alguns instantes."
        }), 500
