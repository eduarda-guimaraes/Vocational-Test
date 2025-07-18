import os
import openai
from flask import Blueprint, request, jsonify

main = Blueprint('main', __name__)

# Configura a chave global
openai.api_key = os.getenv("OPENAI_API_KEY")

@main.route('/api/chat-vocacional', methods=['POST'])
def chat_vocacional():
    data = request.json
    pergunta = data.get('mensagem')

    try:
        # Usando o formato correto com 'messages' para GPT-3.5-turbo
        resposta = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": pergunta}],  # Atualização para o modelo de chat
            max_tokens=150
        )

        # Acessando a resposta de forma correta
        conteudo = resposta['choices'][0]['message']['content']
        return jsonify({"resposta": conteudo})

    except Exception as e:
        print(f"Erro na IA: {e}")
        return jsonify({
            "resposta": "Desculpe, não consegui processar sua resposta agora. Tente novamente em alguns instantes."
        }), 500
