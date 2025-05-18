from flask import Blueprint, jsonify, request

main = Blueprint('main', __name__)

@main.route('/')
def home():
    return jsonify({"mensagem": "Flask está rodando!"})

@main.route('/api/teste', methods=['POST'])
def teste():
    data = request.json
    return jsonify({"recebido": data})