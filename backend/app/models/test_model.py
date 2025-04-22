from app.utils.firebase_config import db

class TestModel:

    @staticmethod
    def save_result(user_input, result):
        data_to_save = {
            'respostas': user_input,
            'resultado': result,
        }
        db.collection('vocational_tests').add(data_to_save)
