def predict_career(data):
    hobby = data.get("hobby", "").lower()

    if "tecnologia" in hobby:
        return {"career": "Desenvolvedor de Software"}
    elif "arte" in hobby:
        return {"career": "Designer Gráfico"}
    elif "animais" in hobby:
        return {"career": "Veterinário"}
    else:
        return {"career": "Administrador"}

