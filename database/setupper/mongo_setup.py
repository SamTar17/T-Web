import os
import pandas as pd
from pymongo import MongoClient
from pathlib import Path

class MongoDBSetup:
    def __init__(self):
        self.host = os.getenv('MONGO_HOST')
        self.port = int(os.getenv('MONGO_PORT'))
        self.database = os.getenv('MONGO_DB')
        
        self.client = None
        self.db = None
        
        self.root_path = Path(__file__).resolve().parent.parent
        self.csv_path = self.root_path.parent / 'data_clean'
    
    def connect(self):
        print(f"🍃 Connessione a MongoDB: {self.host}:{self.port}")
        try:
            self.client = MongoClient(host=self.host, port=self.port, serverSelectionTimeoutMS=5000)
            self.db = self.client[self.database]
            
            # Test connessione con ping
            self.client.admin.command('ping')
            print(f"✅ Connesso al database '{self.database}'")
            return True
            
        except Exception as e:
            print(f"❌ Errore connessione MongoDB: {e}")
            print("💡 Verifica che MongoDB sia avviato")
            return False
    
    def create_collections(self):
        try:
            print("📦 Creazione collezioni MongoDB...")
            # 1. Collezione per recensioni (sarà popolata da CSV)
            if 'reviews' not in self.db.list_collection_names():
                self.db.create_collection('reviews')
                print("✅ Collezione 'reviews' creata")
            else:
                print("✅ Collezione 'reviews' già esistente")
            # 2. Collezione per messaggi chat (vuota, per il futuro)
            if 'messages' not in self.db.list_collection_names():
                self.db.create_collection('messages')
                print("✅ Collezione 'messages' creata (vuota, pronta per chat)")
            else:
                print("✅ Collezione 'messages' già esistente")
            
            return True
            
        except Exception as e:
            print(f"❌ Errore creazione collezioni: {e}")
            return False
    
    def load_csv_data(self):
        """Carica dati dai CSV nelle collezioni"""
        try:
            print("🚀 Caricamento dati CSV in MongoDB...")
            print("🍅 Caricando rotten_tomatoes_reviews.csv...")
            try:
                reviews_df = pd.read_csv(f"{self.csv_path}/rotten_tomatoes_reviews.csv")
                
                # Converti DataFrame in lista di dizionari
                reviews_data = reviews_df.to_dict('records')
                
                # Cancella collezione esistente per ricaricare dati puliti
                self.db.reviews.delete_many({})
                
                # Inserimento batch (molto veloce)
                if reviews_data:
                    self.db.reviews.insert_many(reviews_data)
                    print(f"✅ {len(reviews_data):,} recensioni caricate in 'reviews'")
                else:
                    print("⚠️ Nessuna recensione da caricare")
                    
            except Exception as e:
                print(f"❌ Errore caricamento recensioni: {e}")
                raise
            
            print("🎉 Caricamento dati MongoDB completato!")
            return True
            
        except Exception as e:
            print(f"❌ Errore durante caricamento CSV: {e}")
            return False
    
    def create_indexes(self):
        """Crea indici per ottimizzare le performance"""
        try:
            print("📊 Creazione indici MongoDB...")
            
            # INDICI PER COLLEZIONE REVIEWS
            print("📝 Indici per recensioni...")
            
            self.db.reviews.create_index("movie_title")
            self.db.reviews.create_index("critic_name")
            self.db.reviews.create_index("review_date")
            self.db.reviews.create_index("review_type")
            self.db.reviews.create_index("review_score")
            self.db.reviews.create_index("publisher_name")
            self.db.reviews.create_index([("movie_title", 1), ("review_date", -1)])
            
            print("✅ Indici recensioni creati")

            print("💬 Indici per messaggi chat...")
            
            # ID messaggio univoco
            self.db.messages.create_index("messageId", unique=True)
            self.db.messages.create_index("roomName")
            self.db.messages.create_index("timestamp")
            self.db.messages.create_index([("roomName", 1), ("timestamp", -1)])
            self.db.messages.create_index("userName")
            
            print("✅ Indici messaggi creati")
            print("🚀 Tutti gli indici MongoDB creati - performance ottimizzate!")
            
            return True
            
        except Exception as e:
            print(f"❌ Errore creazione indici: {e}")
            return False
    
    def cleanup(self):
        if self.client:
            self.client.close()
            print("🔌 Connessione MongoDB chiusa")
    
    def run(self):
        """Esegue tutto il setup MongoDB"""
        
        self.connect()
        self.create_collections()
        self.load_csv_data()
        self.create_indexes()
        self.cleanup()

            