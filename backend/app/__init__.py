from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

def create_app():
    app = Flask(__name__)
    load_dotenv()  # Carrega variáveis do .env
    CORS(app)

    from .routes import main
    app.register_blueprint(main)

    return app