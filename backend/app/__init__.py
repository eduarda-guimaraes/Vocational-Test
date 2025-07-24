from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

def create_app():
    app = Flask(__name__)
    load_dotenv()  # Carrega variáveis de ambiente do arquivo .env
    CORS(app)  # Ativa CORS para permitir requisições de outros domínios

    from .routes import main  # Importa as rotas
    app.register_blueprint(main)  # Registra o blueprint com as rotas

    return app
