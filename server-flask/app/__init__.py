from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from config.app_config import DatabaseConfig

db = SQLAlchemy()

def create_app(config_class=DatabaseConfig):
    """
    Factory function per creare e configurare l'applicazione Flask.
    
    Questo è il cuore del nostro server Flask. Questa funzione assembla
    tutti i componenti necessari (database, CORS, routes) in modo ordinato
    e restituisce un'applicazione Flask pronta all'uso.
    
    Args:
        config_class: Classe di configurazione da utilizzare (default: DatabaseConfig)
        
    Returns:
        app: Istanza configurata dell'applicazione Flask
    """
    
    # ===CREAZIONE ISTANZA FLASK ===
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # ===INIZIALIZZAZIONE DATABASE ===
    db.init_app(app)
    print("✅ SQLAlchemy inizializzato e collegato al database PostgreSQL")
    
    # ===CONFIGURAZIONE CORS ===

    CORS(app, origins=[
        "http://localhost:3000",    # React development server (porta standard)
        "http://127.0.0.1:3000",    # Alternativa per React
        "http://localhost:5000",    # Server Express centrale
        "http://127.0.0.1:5500",    # Frontend statico (se ne useremo uno)
    ])
    print("✅ CORS configurato per permettere comunicazione cross-origin")
    
    # === ROUTES ===

    from app.routes.healthRoute import health_bp
    from app.routes.moviesRoutes import movies_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(movies_bp)

    print("✅ Routes di health check registrate")
        
    # === LOGGING E DEBUG INFO ===
    
    if app.config.get('DEBUG'):        
        print("📍 ROUTES REGISTRATE:")
        for rule in app.url_map.iter_rules():
            print(f"   {rule.methods} {rule.rule}")
        print("")
    
    # ===RITORNO DELL'APP CONFIGURATA ===
    
    print("🚀 Flask app completamente configurata e pronta all'uso!")
    return app

def get_db():
    """Restituisce l'istanza del database SQLAlchemy"""
    return db