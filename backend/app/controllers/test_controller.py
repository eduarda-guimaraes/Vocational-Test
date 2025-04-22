from flask import request, jsonify
from app.services.ai_service import predict_career
from app.models.test_model import TestModel

def handle_test():
    data = request.json
    result = predict_career(data)
    TestModel.save_result(data, result)
    return jsonify(result)