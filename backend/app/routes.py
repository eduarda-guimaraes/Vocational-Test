import os
import openai
import random
from flask import Blueprint, request, jsonify

main = Blueprint('main', __name__)

# Configura a chave global
openai.api_key = os.getenv("OPENAI_API_KEY")

# Lista de todas as perguntas possíveis
perguntas = [
    "Você prefere atividades que exigem criatividade ou que são mais lógicas e organizadas?",
    "Como você se sente quando precisa trabalhar em grupo? Gosta ou prefere trabalhar sozinho?",
    "Você se interessa mais por resolver problemas ou por ajudar as pessoas a encontrar soluções para os seus problemas?",
    "Quando alguém pede sua ajuda, você se sente confortável ou prefere não se envolver?",
    "Você gosta de planejar ou prefere agir de forma mais espontânea?",
    "Você se sente confortável em situações sociais, como eventos e festas, ou prefere ficar em ambientes mais tranquilos?",
    "Você se interessa por tecnologias como computadores, aplicativos ou gadgets?",
    "Você tem prazer em aprender novos idiomas ou se sente mais confortável em se comunicar na sua língua nativa?",
    "Quando você precisa organizar algo, você gosta de seguir um plano ou prefere improvisar?",
    "Você prefere trabalhar com números e dados ou com pessoas e interações sociais?",
    "Você se sente motivado a ajudar os outros a resolver problemas emocionais ou pessoais?",
    "Você gosta de atividades que envolvem cuidados com os outros, como cuidar de crianças ou de animais?",
    "Você se interessa por arte, como pintura, música ou dança?",
    "Você se sente atraído por entender como as coisas funcionam, como uma máquina ou um computador?",
    "Você gosta de experimentar novas receitas ou testar novas ideias na cozinha?",
    "Quando há um problema, você gosta de tentar resolver por conta própria ou prefere pedir ajuda?",
    "Você se interessa por ciências naturais, como biologia, física ou química?",
    "Você prefere atividades ao ar livre ou ficar em ambientes fechados?",
    "Quando vê uma pessoa triste, você tenta confortá-la ou prefere não se envolver?",
    "Você se interessa mais por atividades práticas, como jardinagem ou carpintaria, ou atividades mais teóricas?",
    "Você se sente confortável lidando com dinheiro e finanças ou prefere não se preocupar com isso?",
    "Você gosta de viajar e conhecer novos lugares ou prefere ficar em um lugar familiar?",
    "Quando há algo novo para aprender, você fica animado ou preferiria evitar esse desafio?",
    "Você gosta de ajudar as pessoas a se organizarem, seja em tarefas ou na vida cotidiana?",
    "Você se sente mais satisfeito resolvendo problemas complexos ou realizando tarefas simples e diretas?",
    "Você prefere ler livros e artigos sobre tópicos técnicos ou mais sobre questões humanas e sociais?",
    "Você gosta de desafios físicos, como esportes ou atividades ao ar livre, ou se interessa mais por questões intelectuais?",
    "Você gosta de conversar e entender as pessoas ou se interessa mais por dados e fatos objetivos?",
    "Você prefere trabalhar em ambientes que envolvem comunicação constante ou onde pode ficar mais focado e independente?",
    "Você gosta de fazer voluntariado ou se interessa por atividades de ajuda humanitária?",
    "Você se interessa mais por saúde mental e emocional ou por questões relacionadas à saúde física?",
    "Você tem interesse por temas como justiça, direito ou questões políticas?",
    "Você se sente motivado a realizar tarefas de forma rápida e eficaz ou valoriza mais a qualidade e detalhes?",
    "Você prefere trabalhar em um escritório ou em um ambiente mais dinâmico e sem rotina?",
    "Você se interessa por aprender a programar ou entende melhor os conceitos por trás dos sistemas?",
    "Você gosta de atividades como redesenho de espaços ou prefere ambientes mais simples e organizados?",
    "Você prefere tarefas que envolvem criatividade ou tarefas que exigem precisão e técnicas específicas?",
    "Você se sente bem em ensinar algo que sabe para outras pessoas?"
]

# Dicionário para armazenar as perguntas feitas para cada chat
chats_perguntas = {}
chats_contagem_perguntas = {}

def gerar_prompt_interativo(pergunta, respostas_anteriores, chat_id):
    prompt_base = "Você está ajudando um jovem a escolher uma carreira. Pergunte sobre seus interesses e habilidades, e direcione para áreas de carreira com base nas respostas."

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

def gerar_areas_respostas(respostas):
    areas = []
    text = " ".join(respostas).lower()
    
    if "criatividade" in text or "arte" in text:
        areas += ["Design Gráfico", "Artes Visuais"]
    if "ciências" in text or "tecnologia" in text:
        areas += ["Engenharia", "Programação"]
    if "ajudar pessoas" in text or "assistência" in text:
        areas += ["Psicologia", "Medicina"]
    if "finanças" in text:
        areas += ["Administração de Empresas", "Economia"]
    
    return areas

@main.route('/api/chat-vocacional', methods=['POST'])
def chat_vocacional():
    data = request.get_json() or {}
    pergunta = data.get('mensagem', '')
    respostas_anteriores = data.get('respostas_anteriores', [])
    chat_id = data.get('chat_id')

    try:
        prompt_interativo, pergunta_aleatoria = gerar_prompt_interativo(
            pergunta, respostas_anteriores, chat_id
        )

        # Novo ponto de entrada para o SDK openai>=1.0.0
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Você é um assistente de teste vocacional."},
                {"role": "user",   "content": prompt_interativo}
            ],
            max_tokens=150,
            temperature=0.7
        )

        conteudo = response.choices[0].message.content

        # Se alcançou 20 perguntas, sugere áreas
        if chats_contagem_perguntas.get(chat_id, 0) >= 20:
            areas_interesse = gerar_areas_respostas(respostas_anteriores)
            if areas_interesse:
                conteudo += (
                    f"\n\nCom base nas suas respostas, sugerimos as seguintes áreas de interesse: "
                    + ", ".join(areas_interesse)
                )

        return jsonify({
            "resposta": conteudo,
            "pergunta_aleatoria": pergunta_aleatoria
        })

    except Exception as e:
        print(f"Erro na IA: {e}")
        return jsonify({
            "resposta": "Desculpe, não consegui processar sua resposta agora. Tente novamente em alguns instantes."
        }), 500
