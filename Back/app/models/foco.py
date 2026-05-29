from beanie import Document
from typing import Dict, Any

class Foco(Document):
    id_local_celular: str
    latitude: float
    longitude: float
    # O MongoDB aceita dicionários nativamente, perfeito para dados dinâmicos!
    dados_coletados: Dict[str, Any]
    timestamp: str

    class Settings:
        name = "focos"  # Nome da coleção no MongoDB
