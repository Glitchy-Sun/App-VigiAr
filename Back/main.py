from fastapi import FastAPI  # type: ignore[import]
from contextlib import asynccontextmanager
from app.db.database import init_db

# Esta função roda automaticamente quando a API é iniciada
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando conexão com o MongoDB...")
    await init_db()
    print("Conectado com sucesso!")
    yield
    print("Desligando API...")

app = FastAPI(title="API APP-VIGIAR", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"status": "API rodando com MongoDB e Beanie!"}
