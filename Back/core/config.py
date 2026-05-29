import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "API APP-VIGIAR"
    # URL padrão do MongoDB local caso não ache no .env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "chave-super-secreta-mudar-depois")

settings = Settings()
