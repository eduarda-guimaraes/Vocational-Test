from flask import Blueprint
from app.controllers.test_controller import handle_test

test_bp = Blueprint('test', __name__)

@test_bp.route('/', methods=['POST'])
def test():
    return handle_test()