from flask import Blueprint,jsonify
from datetime import datetime
from app import db 

health_bp = Blueprint('health', __name__, url_prefix='/api/health')

@health_bp.route('/', methods = ['GET'])
def health_check():
    try:
    # Proviamo a fare una query semplice al database per testare la connessione
    # db.session.execute('SELECT 1') è come dire "dimmi solo che ci sei"
        select=db.session.execute(db.text('SELECT 1'))
        select =select.fetchone()[0]
        print(select)
        database_status = "connected"
        return jsonify({
            'status': 'healthy',
            'message': 'Flask server is running',
            'database': database_status,
            'service': 'postgres-microservice',
            }), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'service': 'flask-film-server', 
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 503