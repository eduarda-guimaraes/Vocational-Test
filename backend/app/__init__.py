import os
import json
import base64
import firebase_admin
from firebase_admin import credentials
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)

    CORS(app, resources={r"/*": {"origins": "*"}})

    # Inicializa o Firebase apenas se ainda não foi iniciado
    if not firebase_admin._apps:
        cred_base64 = os.getenv("FIREBASE_CREDENTIALS_BASE64")
        if not cred_base64:
            raise Exception("FIREBASE_CREDENTIALS_BASE64 não encontrada no .env")

        cred_dict = json.loads(base64.b64decode(cred_base64).decode("utf-8"))
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)

    from .routes import main
    app.register_blueprint(main)

    return app
