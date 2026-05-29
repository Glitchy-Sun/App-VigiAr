from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.agente import Agente
from app.models.foco import Foco

async def init_db():
    # Cria o cliente do MongoDB
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    
    # Define o nome do banco de dados (será criado automaticamente ao salvar o primeiro dado)
    database = client.app_vigiar_db
    
    # Inicializa o Beanie com os modelos que criamos
    await init_beanie(
        database=database,
        document_models=[Agente, Foco]
    )
