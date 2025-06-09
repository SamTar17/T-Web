import os
from dotenv import load_dotenv

# Carica le variabili d'ambiente dal file .env se presente
# Questo ci permette di tenere le credenziali separate dal codice
load_dotenv()

class DatabaseConfig:
    """
    Classe di configurazione per il database e l'applicazione Flask.
    
    Questa classe centralizza tutte le configurazioni necessarie per il
    server Flask.
    """
    
    POSTGRES_USER = os.getenv('POSTGRES_USER')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD')
    POSTGRES_HOST = os.getenv('POSTGRES_HOST')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT')
    POSTGRES_DB = os.getenv('POSTGRES_DB')
    
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@"
        f"{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    
    # === CONFIGURAZIONI FLASK E SQLALCHEMY ===
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv('FLASK_ENV') == 'development'
    
    # === CONFIGURAZIONI DELL'APPLICAZIONE ===
    
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY')
    DEBUG = os.getenv('FLASK_ENV') == 'development'
    
    # === CONFIGURAZIONI RETE ===
    PORT = int(os.getenv('PORT'))
    HOST = os.getenv('FLASK_HOST')
    
    # === CONFIGURAZIONI PER L'INTEGRAZIONE CON GLI ALTRI SERVER ===
    EXPRESS_SERVER_URL = os.getenv('EXPRESS_SERVER_URL')
    
