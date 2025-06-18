from app import create_app
from dotenv import load_dotenv
import os

load_dotenv()
app= create_app()
if __name__ == '__main__':
    host = os.getenv('FLASK_HOST', '127.0.0.1')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"🚀 Avvio Flask server su {host}:{port}")
    app.run(host=host, port=port, debug=debug)