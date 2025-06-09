import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import time

from setupper.postgres_setup import PostgreSQLSetup
from setupper.mongo_setup import MongoDBSetup

def main():
    print("🚀 Setup Database Film Project")
    print("=" * 40)
    
    # Carica configurazioni
    load_dotenv()
    
    print("\n📊 Setup PostgreSQL...")
    try:
        postgres = PostgreSQLSetup()
        postgres.run()
        print("✅ PostgreSQL completato!")
    except Exception as e:
        print(f"❌ Errore PostgreSQL: {e}")
    
    # Setup MongoDB
    print("\n🍃 Setup MongoDB...")
    try:
        mongo = MongoDBSetup()
        mongo.run()
        print("✅ MongoDB completato!")
    except Exception as e:
        print(f"❌ Errore MongoDB: {e}")
    
    print("\n🎉 Setup terminato!")

if __name__ == "__main__":
    main()