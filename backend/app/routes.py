import os
import openai
from flask import Blueprint, request, jsonify

main = Blueprint('main', __name__)

# Configura a chave global
openai.api_key=os.getenv("OPENAI_API_KEY")

@main.route('/api/chat-vocacional', methods=['POST'])
def chat_vocacional():
    data = request.json
    pergunta = data.get('mensagem')
    print("CHAVE DA API:", os.getenv("OPENAI_API_KEY"))
    try:
        resposta = openai.chat.completions.create(
            model="gpt-3.5-turbo",  # ou "gpt-3.5-turbo" se preferir
            messages=[
                {
                    "role": "system",
                    "content": "Você é um orientador vocacional que ajuda estudantes a escolherem suas profissões com base em interesses e habilidades."
                },
                {
                    "role": "user",
                    "content": pergunta
                }
            ]
        )

        conteudo = resposta.choices[0].message.content
        return jsonify({"resposta": conteudo})

    except Exception as e:
        print(f"Erro na IA: {e}")
        return jsonify({
            "resposta": "Desculpe, não consegui processar sua resposta agora. Tente novamente em alguns instantes."
        }), 500