import importlib.util
import os

dotenv_spec = importlib.util.find_spec("dotenv")
if dotenv_spec is not None:
    load_dotenv = importlib.import_module("dotenv").load_dotenv
    load_dotenv()
else:
    def load_dotenv(*args, **kwargs):
        return False

class Settings:
    PROJECT_NAME: str = "API APP-VIGIAR"
    # URL padrão do MongoDB local caso não ache no .env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "chave-super-secreta-mudar-depois")

settings = Settings()
