import firebase_admin # type: ignore
from firebase_admin import credentials, firestore # type: ignore

cred = credentials.Certificate("path/to/seu-arquivo-firebase.json")  # Substitua aqui
firebase_admin.initialize_app(cred)

db = firestore.client()
