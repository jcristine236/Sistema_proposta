import uuid


def novo_id() -> str:
    """Id aleatório de 32 caracteres hex, usado como PK de todos os modelos."""
    return uuid.uuid4().hex
