import os
import psycopg2
from pathlib import Path


class PostgreSQLSetup:
    def __init__(self):
        # Leggi configurazioni da environment
        self.host = os.getenv('POSTGRES_HOST')
        self.port = os.getenv('POSTGRES_PORT') 
        self.database = os.getenv('POSTGRES_DB')
        self.user = os.getenv('POSTGRES_USER')
        self.password = os.getenv('POSTGRES_PASSWORD')
        self.conn = None
        self.root_path = Path(__file__).resolve().parent.parent
        self.csv_path = self.root_path.parent / 'data_clean'
    def connect(self):
        """Crea connessione a PostgreSQL"""
        print('connessione al database postgress')
        try:
            self.conn = psycopg2.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.user,
                password=self.password
            )
            return True
        except psycopg2.Error as e:
            print('+++ ERRORE DI CONNESSIONE CON DB POSTGRES', e)
            return False
        
    def create_tables(self):
        """Crea tutte le tabelle necessarie"""
       
        try:
            with self.conn.cursor() as curr:
                print('creazione tabelle..')
                movies_table ="""CREATE TABLE IF NOT EXISTS movies (
                        id INTEGER PRIMARY KEY UNIQUE NOT NULL,
                        name TEXT,
                        date INTEGER,
                        tagline TEXT,
                        description TEXT,
                        minute REAL,
                        rating REAL
                    );"""
                actors_table= """CREATE TABLE IF NOT EXISTS actors (
                        id SERIAL PRIMARY KEY,
                        id_movies INTEGER,
                        actor TEXT,
                        role TEXT,
                        FOREIGN KEY (id_movies) REFERENCES movies(id)
                    );"""
                countries_table = """CREATE TABLE IF NOT EXISTS countries (
                        id SERIAL PRIMARY KEY,
                        id_movies INTEGER,
                        country TEXT,
                        FOREIGN KEY (id_movies) REFERENCES movies(id)
                    );"""
                crews_table = """CREATE TABLE IF NOT EXISTS crews (
                        id SERIAL PRIMARY KEY,
                        id_movies INTEGER,
                        role TEXT,
                        name TEXT,
                        FOREIGN KEY (id_movies) REFERENCES movies(id)
                    );"""         
                genres_table = """CREATE TABLE IF NOT EXISTS genres (
                        id SERIAL PRIMARY KEY,
                        id_movies INTEGER,
                        genre TEXT,
                        FOREIGN KEY (id_movies) REFERENCES movies(id)
                    );""" 
                    
                languages_table = """CREATE TABLE IF NOT EXISTS languages (
                        id SERIAL PRIMARY KEY,
                        id_movies INTEGER,
                        type TEXT,
                        language TEXT,
                        FOREIGN KEY (id_movies) REFERENCES movies(id)
                    );""" 
                    
                posters_table = """CREATE TABLE IF NOT EXISTS posters (
                        id SERIAL PRIMARY KEY,
                        id_movies INTEGER,
                        link TEXT,
                        FOREIGN KEY (id_movies) REFERENCES movies(id)
                    );""" 
                releases_table = """CREATE TABLE IF NOT EXISTS releases (
                        id SERIAL PRIMARY KEY,
                        id_movies INTEGER,
                        country TEXT,
                        date DATE,
                        type TEXT,
                        rating TEXT,
                        FOREIGN KEY (id_movies) REFERENCES movies(id)
                    );""" 
                    
                studios_table = """CREATE TABLE IF NOT EXISTS studios (
                        id SERIAL PRIMARY KEY,
                        id_movies INTEGER,
                        studio TEXT,
                        FOREIGN KEY (id_movies) REFERENCES movies(id)
                    );""" 
                themes_table = """CREATE TABLE IF NOT EXISTS themes (
                        id SERIAL PRIMARY KEY,
                        id_movies INTEGER,
                        theme TEXT,
                        FOREIGN KEY (id_movies) REFERENCES movies(id)
                    );"""
                
                oscar_table = """CREATE TABLE IF NOT EXISTS oscars (
                        id SERIAL PRIMARY KEY,
                        year_film INTEGER,
                        year_ceremony INTEGER,
                        ceremony INTEGER,
                        category TEXT,
                        name TEXT,
                        film TEXT,
                        winner BOOL,
                        id_movies INTEGER,
                        FOREIGN KEY (id_movies) REFERENCES movies(id)
                    );"""
                
                curr.execute(movies_table)
                curr.execute(actors_table)
                curr.execute(countries_table)
                curr.execute(crews_table)
                curr.execute(genres_table)
                curr.execute(languages_table)
                curr.execute(posters_table)
                curr.execute(releases_table)
                curr.execute(studios_table)
                curr.execute(themes_table)
                curr.execute(oscar_table)
                print('++++ TABELLE CREATE ++++')
        
        except psycopg2.Error as e:
            print(f"❌ Errore creazione tabelle: {e}")
            return False
       
       
    def load_csv_data(self):
        """Carica dati dai CSV nelle tabelle"""
        
        csv_files = [
            ('movies.csv', 'movies', '(id, name, date, tagline, description, minute, rating)'),
            ('actors.csv', 'actors', '(id_movies, actor, role)'),
            ('countries.csv', 'countries', '(id_movies, country)'),
            ('crew.csv', 'crews', '(id_movies, role, name)'),
            ('genres.csv', 'genres', '(id_movies, genre)'),
            ('languages.csv', 'languages', '(id_movies, type, language)'),
            ('posters.csv', 'posters', '(id_movies, link)'),
            ('releases.csv', 'releases', '(id_movies, country, date, type, rating)'),
            ('studios.csv', 'studios', '(id_movies, studio)'),
            ('themes.csv', 'themes', '(id_movies, theme)'),
            ('the_oscar_awards.csv', 'oscars', '(year_film,year_ceremony,ceremony,category,name,film,winner,id_movies)')
        ]
        
        try:
            with self.conn.cursor() as curr:
                print("🚀 Inizio caricamento dati CSV...")
                
                for csv_file, table_name, columns in csv_files:
                    print(f"📥 Caricando {csv_file}...")
                    
                    try:
                        with open(f"{self.csv_path}/{csv_file}", 'r', encoding='utf-8') as f:
                            next(f)  # Salta header
                            
                            curr.copy_expert(f"""
                                COPY {table_name} {columns}
                                FROM STDIN WITH CSV DELIMITER ','
                            """, f)
                            
                        print(f"✅ {csv_file} caricato con successo")
                        
                    except FileNotFoundError:
                        print(f"⚠️ File {csv_file} non trovato - salto")
                        continue
                    except Exception as e:
                        print(f"❌ Errore caricando {csv_file}: {e}")
                        raise
                
                # IMPORTANTE: Commit finale!
                self.conn.commit()
                print("🎉 Tutti i dati caricati e salvati!")
                
        except Exception as e:
            self.conn.rollback()
            print(f"❌ Errore durante caricamento, rollback effettuato: {e}")
            raise
    def create_indexes(self):
        """Crea indici per ottimizzare le query"""
        try:
            with self.conn.cursor() as curr:
                print("📊 Creazione indici PostgreSQL...")
                
                # INDICI PER QUERY FREQUENTI
                indexes = [
                    # Movies - ricerche frequenti
                    "CREATE INDEX IF NOT EXISTS idx_movies_id ON movies(id)",
                    "CREATE INDEX IF NOT EXISTS idx_movies_name ON movies(name)",
                    "CREATE INDEX IF NOT EXISTS idx_movies_date ON movies(date)", 
                    "CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating)",
                    "CREATE INDEX IF NOT EXISTS idx_posters_id_movies ON posters(id_movies)",

                    # Actors - relazioni e ricerche
                    "CREATE INDEX IF NOT EXISTS idx_actors_id_movies ON actors(id_movies)",
                    "CREATE INDEX IF NOT EXISTS idx_actors_actor ON actors(actor)",
                    "CREATE INDEX IF NOT EXISTS idx_actors_actor_lower ON actors(LOWER(actor))",
                    
                    # Countries - relazioni
                    "CREATE INDEX IF NOT EXISTS idx_countries_id_movies ON countries(id_movies)",
                    "CREATE INDEX IF NOT EXISTS idx_countries_country ON countries(country)",
                    
                    # Crews - ricerche registi/produttori
                    "CREATE INDEX IF NOT EXISTS idx_crews_id_movies ON crews(id_movies)",
                    "CREATE INDEX IF NOT EXISTS idx_crews_name ON crews(name)",
                    "CREATE INDEX IF NOT EXISTS idx_crews_role ON crews(role)",
                    "CREATE INDEX IF NOT EXISTS idx_crews_name_role ON crews(name, role)",
                    
                    # Releases - filtri geografici/temporali
                    "CREATE INDEX IF NOT EXISTS idx_releases_id_movies ON releases(id_movies)",
                    "CREATE INDEX IF NOT EXISTS idx_releases_country ON releases(country)",
                    "CREATE INDEX IF NOT EXISTS idx_releases_date ON releases(date)",
                    
                    # Oscar - ricerche premi
                    "CREATE INDEX IF NOT EXISTS idx_oscars_id_movies ON oscars(id_movies)",
                    "CREATE INDEX IF NOT EXISTS idx_oscars_film ON oscars(film)",
                    "CREATE INDEX IF NOT EXISTS idx_oscars_name ON oscars(name)",
                    "CREATE INDEX IF NOT EXISTS idx_oscars_category ON oscars(category)",
                    
                    # Genres, Studios, Themes - filtri comuni
                    "CREATE INDEX IF NOT EXISTS idx_genres_id_movies ON genres(id_movies)",
                    "CREATE INDEX IF NOT EXISTS idx_genres_genre ON genres(genre)",
                    "CREATE INDEX IF NOT EXISTS idx_studios_id_movies ON studios(id_movies)",
                    "CREATE INDEX IF NOT EXISTS idx_themes_id_movies ON themes(id_movies)",
                    
                    #tringrammi per la ricerca suggestion 
                    "CREATE EXTENSION IF NOT EXISTS pg_trgm",
                    "CREATE INDEX idx_movies_name_trigram ON movies USING gin(name gin_trgm_ops)"
                ]
                
                for index_sql in indexes:
                    curr.execute(index_sql)
                    print(f"✅ {index_sql.split('ON ')[1].split('(')[0]}")
                
                self.conn.commit()
                print("🚀 Tutti gli indici creati - query ultraveloci!")
                
        except psycopg2.Error as e:
            print(f"❌ Errore creazione indici: {e}")


    def run(self):
        """Esegue tutto il setup"""
        self.connect()
        self.create_tables()
        self.load_csv_data()
        self.create_indexes()