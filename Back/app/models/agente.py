from beanie import Document
from pydantic import Field

class Agente(Document):
    nome: str
    email: str
    senha_hash: str
    ativo: bool = True

    class Settings:
        name = "agentes"  # Nome da coleção no MongoDB
