from app import db
from sqlalchemy.orm import relationship

class Movie(db.Model):
    """
    Rappresentazioen della tabella 'movies'. 
    Vengono definite le relazioni con tutte le entità satellite attraverso foreign keys. 
    """
    
    __tablename__ = 'movies'
    
    # === CAMPI BASE (dati intrinseci del film) ===
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False) 
    date = db.Column(db.Integer)  
    tagline = db.Column(db.Text) 
    description = db.Column(db.Text) 
    minute = db.Column(db.Integer)  
    rating = db.Column(db.Float)  
    
    # === RELAZIONI CON TABELLE SATELLITE ===
    
    # lazy='select' = carica i generi solo quando accediamo a movie.xxx
    # back_populates crea la relazione bidirezionale
    #aggiunta anche l'opzione cascade per il comportamento delle operazioni di delete ma è in piu
    
    genres = relationship('Genre', 
                         back_populates='movie', 
                         lazy='select',
                         cascade='all, delete-orphan')
    
    actors = relationship('Actor', 
                         back_populates='movie', 
                         lazy='select',
                         cascade='all, delete-orphan')
    
    countries = relationship('Country', 
                           back_populates='movie', 
                           lazy='select',
                           cascade='all, delete-orphan')

    crews = relationship('Crew', 
                        back_populates='movie', 
                        lazy='select',
                        cascade='all, delete-orphan')

    languages = relationship('Language', 
                           back_populates='movie', 
                           lazy='select',
                           cascade='all, delete-orphan')
    
    posters = relationship('Poster', 
                          back_populates='movie', 
                          lazy='select',
                          cascade='all, delete-orphan')

    releases = relationship('Release', 
                           back_populates='movie', 
                           lazy='select',
                           cascade='all, delete-orphan')

    studios = relationship('Studio', 
                          back_populates='movie', 
                          lazy='select',
                          cascade='all, delete-orphan')

    themes = relationship('Theme', 
                         back_populates='movie', 
                         lazy='select',
                         cascade='all, delete-orphan')

    oscars = relationship('Oscar', 
                         back_populates='movie', 
                         lazy='select',
                         cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Movie {self.id}: {self.name} ({self.date})>'


    @classmethod
    def get_movie_details(cls, movie_id):
        """
       
        """
        try:
        
        #La differenza tra i due sta principalmente nel numero di correlati che ha un record
        # joinedload per quando ho pochi correlati : fa una sola query con un left join
        # selectinlod fa due o più query separate per poi ricostruire il record dopo 
            
            from sqlalchemy.orm import joinedload, selectinload
            
            movie_results = (
                cls.query
                .options(
                   
                    joinedload(cls.genres),           
                    joinedload(cls.posters),            
                    joinedload(cls.countries),        
                    joinedload(cls.languages),        
                    joinedload(cls.studios),          
                    joinedload(cls.themes),           
                    
                    # Relazioni potenzialmente grandi 
                    selectinload(cls.actors),         
                    selectinload(cls.crews),           
                    selectinload(cls.releases),       
                    selectinload(cls.oscars),        
                )
                .filter(
                    cls.id == movie_id,
                    cls.name.isnot(None), 
                    cls.name != ''
                )
                .first()
            )
                        
            if not movie_results:
                #fallback un po inutile perchè per forza troverà un film 
                print(f"Film con ID {movie_id} non trovato o ha dati invalidi")
                return None
            
            # === COSTRUZIONE DATI DEL FILM ===
  
          
            risultato = {
                'id': movie_results.id,
                'name': movie_results.name,
                'date': int(movie_results.date) if movie_results.date else None,
                'rating': float(movie_results.rating) if movie_results.rating else None,
                'minute': int(movie_results.minute) if movie_results.minute else None,
                'tagline': movie_results.tagline,
                'description': movie_results.description,
            }
            
            if movie_results.posters:
                risultato['poster'] = {
                    'url': movie_results.posters[0].link,  # Prendiamo il primo poster come principale anche se abbiamo visto che il rapporto è 1:1
                    'alt': f"Poster di {movie_results.name}"
                }
            else:
                risultato['poster'] = {
                    'url': None,
                    'alt': f"Poster di {movie_results.name}"
                }  
        
        
            actors= {}  

            for actor in movie_results.actors:
                actor_name = actor.actor
                role = actor.role if actor.role else ""

                if role in actors:
                    actors[role].append(actor_name)
                else:
                    actors[role] = [actor_name]
            
            crew = {}
            
            for membro_crew in movie_results.crews:
                
                ruolo = membro_crew.role if membro_crew.role else ""
                
                if ruolo not in crew:
                    crew[ruolo] = []
                crew[ruolo].append(membro_crew.name)
                        
            
            languages = {}
            
            for lang in movie_results.languages:
                
                type = lang.type
                language = lang.language
                
                if type not in languages:
                    
                    languages[type] = []
                languages[type].append(language)
            
            
            
            releases = {}
            
            for release in movie_results.releases:
                
                country = release.country
                date = release.date.isoformat()
                type= release.type if release.type else ''
                rating= release.rating if release.rating else ''
                
                if country not in releases:
                    releases[country] = {}
                    
                if date not in releases[country]:
                    releases[country][date] = {}
                
                releases[country][date]['rating'] = rating
                releases[country][date]['type'] = type
            
            
            
            #quando lui fa il join crea già lui un iterabile di oggetti Genre
            risultato['actors'] = actors
            risultato['crews'] = crew
            risultato['languages'] = languages
            risultato['releases'] =  releases
            risultato['genres'] = [genre.genre for genre in movie_results.genres]
            risultato['studios'] = [studio.studio for studio in movie_results.studios]
            risultato['themes'] = [theme.theme for theme in movie_results.themes]
            risultato['countries'] = [country.country for country in movie_results.countries]
            
        
            return risultato
            
        except Exception as e:
            
            print(f"Errore in get_movie_details per ID {movie_id}: {str(e)}")
            
            return { 'status': 'fallito',
                    'errore': e,
                    'funzione': 'get_movies_details', 
            }

    @classmethod
    def get_suggestions(cls, query, limit=5):
        """
        funzione per il suggerimento durante la ricerca di film.
        Ancora da ottimizzare , tempo di risposta troppo lento c.a. 400ms
        
        Il collo di bottiglia credo sia la parte dell ilike %query% non indicizzabile.
        utilizzato un indice basato sui trigrammi ottimizzato!
        
        """
        
        # === VALIDAZIONE E PULIZIA INPUT ===

        if not query or len(query) < 2:
            return []
            
        if len(query) > 50:
            query = query[:50]
                
        # === QUERY ===
        
        try:
            from sqlalchemy.orm import joinedload, load_only
            
            suggestions = (
                cls.query
                .options(
                    # joinedload carica generi e poster nella stessa query principale
                    #fa praticamente un left join diretto 
                    joinedload(cls.posters),
                    load_only(cls.id, cls.name, cls.date, cls.rating)
                )
                .filter(
                    cls.name.ilike(f'%{query}%'),
                    cls.name.isnot(None),
                    cls.name != ''
                )
                .order_by(
                    cls.rating.desc().nulls_last(),
                    cls.name.asc()
                )
                .limit(limit)
                .all()
            )
            
            # === RISULTATO ===
            
            result = []
            for movie in suggestions:
                poster_url = movie.posters[0].link if movie.posters else None
                
                suggestion = {
                    'id': movie.id,
                    'name': movie.name,
                    'date': int(movie.date) if movie.date else None,
                    'poster_url': poster_url,
                }
                result.append(suggestion)
            
            return result
            
        except Exception as e:
            print(f"Errore in get_suggestions per query '{query}': {str(e)}")
            return []
        
    @classmethod
    def search(cls, filters=None, page=1, per_page=20):

        # Calcola offset per paginazione
        offset = (page - 1) * per_page
        
        try:
            # === COSTRUZIONE QUERY  ===

            from sqlalchemy.orm import joinedload
            
            base_query = cls.query.filter(
                cls.name.isnot(None),
                cls.name != ''
            )

            if 'title' in filters:
                base_query = base_query.filter(
                    cls.name.ilike(f"%{filters['title']}%")
                )
            
            if 'min_rating' in filters:
                base_query = base_query.filter(cls.rating >= filters['min_rating'])
                
            if 'max_rating' in filters:
                base_query = base_query.filter(cls.rating <= filters['max_rating'])
            
            if 'year_from' in filters:
                base_query = base_query.filter(cls.date >= filters['year_from'])

            if 'year_to' in filters:
                base_query = base_query.filter(cls.date <= filters['year_to'])

            if 'min_duration' in filters:
                base_query = base_query.filter(cls.minute >= filters['min_duration'])
                
            if 'max_duration' in filters:
                base_query = base_query.filter(cls.minute <= filters['max_duration'])

            if 'genre' in filters:
                for gen in filters['genre']:
                    base_query = base_query.filter(cls.genres == gen)
            
            if filters['upcoming'] == 'true':
                base_query = base_query.filter(cls.date >= 2023)
            else:
                base_query = base_query.filter(cls.date <= 2023)
            
            if filters['tvmovie'] == 'true':
                base_query = base_query.filter(cls.minute  >= 200)
            else:
                base_query = base_query.filter(cls.minute <= 200)            
        
            #==== SORT AND ORDER ====
            
            if filters['sort_by'] == 'random':
                base_query = base_query.order_by(db.func.random())

            elif filters['sort_by'] == 'rating':
                base_query = base_query.order_by(
                    cls.rating.asc().nulls_last() if filters['order_by'] == 'asc' else cls.rating.desc().nulls_last()
                )

            elif filters['sort_by'] == 'date':
                base_query = base_query.order_by(
                    cls.date.asc().nulls_last() if filters['order_by'] == 'asc' else cls.date.desc().nulls_last()
                )

            elif filters['sort_by'] == 'name':
                base_query = base_query.order_by(
                    cls.name.asc().nulls_last() if filters['order_by'] == 'asc' else cls.name.desc().nulls_last()
                )

            elif filters['sort_by'] == 'duration':
                base_query = base_query.order_by(
                    cls.minute.asc().nulls_last() if filters['order_by'] == 'asc' else cls.minute.desc().nulls_last()
                )
            #è base
            else:
                base_query = base_query.order_by(cls.date.desc().nulls_last())
                base_query = base_query.order_by(cls.rating.desc().nulls_last())
            #== faccio calcoli della paginazione prima dei join ==
            
            count_query = base_query.statement.alias()
            total_count = db.session.query(count_query).count()
            
            #== eseguo i join === 
            
            load_options = []
            #questi li mettiamo dopo il calcolo della paginazione 
            
            load_options.append(joinedload(cls.genres))
            load_options.append(joinedload(cls.posters))
            
            base_query = base_query.options(*load_options)
            
            # ===ESECUZIONE QUERY CON PAGINAZIONE ===
            
            movies = base_query.offset(offset).limit(per_page).all()
            
            # ===TRASFORMAZIONE RISULTATI ===
            
            movies_list = []
            for movie in movies:
                # Grazie all'eager loading, accedere a genres e posters non causa query aggiuntive
                movie_data = {
                    'id': movie.id,
                    'name': movie.name,
                    'date': int(movie.date) if movie.date else None,
                    'rating': float(movie.rating) if movie.rating else None,
                    'minute': int(movie.minute) if movie.minute else None,
                    'poster_url': movie.posters[0].link if movie.posters else None,
                    'genres': [genre.genre for genre in movie.genres]
                }
                movies_list.append(movie_data)
            
            
            total_pages = (total_count + per_page - 1) // per_page
            
            pagination_info = {
                
                'current_page': page,
                'per_page': per_page,
                'total_results': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_previous': page > 1
            
            }
            
            return movies_list, pagination_info
            
        except Exception as e:
            print(f"Errore in search_movies: {str(e)}")
            #per adesso lascio un template di pagination
            return [], {
                'current_page': 1,
                'per_page': per_page,
                'total_results': 0,
                'total_pages': 0,
                'has_next': False,
                'has_previous': False
            }    

      
class Genre(db.Model):
    """
    Modello per i generi cinematografici.
    
    Relazione: One-to-Many con Movie (un film può avere più generi)
    Esempio: "The Dark Knight" può essere sia "Action" che "Crime" che "Drama"
    
    Questa è una classica tabella di normalizzazione che evita di duplicare
    i nomi dei generi nella tabella movies principale.
    """
    
    __tablename__ = 'genres'
    
    id = db.Column(db.Integer, primary_key=True)
    id_movies = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False, index=True)
    genre = db.Column(db.Text, nullable=False, index=True)  # Nome del genere (Action, Drama, etc.)
    
    # Relazione back-reference verso Movie
    movie = relationship('Movie', back_populates='genres')
    
    def __repr__(self):
        return f'<Genre {self.genre} for Movie {self.id_movies}>'

class Actor(db.Model):
    """
    Modello per gli attori e i loro ruoli nei film.
    
    Relazione: Many-to-Many con Movie attraverso ruoli
    Un attore può essere in più film, un film ha più attori.
    Inoltre, uno stesso attore può avere più ruoli nello stesso film!
    
    Esempio: "The Lord of the Rings" - Sean Bean interpreta "Boromir"
    Esempio speciale: Mike Myers in "Austin Powers" interpreta più personaggi
    """
    
    __tablename__ = 'actors'
    
    id = db.Column(db.Integer, primary_key=True)
    id_movies = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False, index=True)
    actor = db.Column(db.Text, nullable=False, index=True)  # Nome dell'attore
    role = db.Column(db.Text)  # Nome del personaggio interpretato
    
    # Relazione back-reference verso Movie
    movie = relationship('Movie', back_populates='actors')
    
    def __repr__(self):
        return f'<Actor {self.actor} as {self.role} in Movie {self.id_movies}>'

class Country(db.Model):
    """
    Modello per i paesi di origine/produzione dei film.
    
    Relazione: One-to-Many con Movie (un film può essere prodotto in più paesi)
    Esempio: "The Lord of the Rings" è prodotto sia in "New Zealand" che "USA"
    
    Importante per filtri geografici e analisi di mercato internazionale.
    """
    
    __tablename__ = 'countries'
    
    id = db.Column(db.Integer, primary_key=True)
    id_movies = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False, index=True)
    country = db.Column(db.Text, nullable=False, index=True)  # Nome del paese
    
    # Relazione back-reference verso Movie
    movie = relationship('Movie', back_populates='countries')
    
    def __repr__(self):
        return f'<Country {self.country} for Movie {self.id_movies}>'

class Crew(db.Model):
    """
    Modello per il team di produzione (registi, produttori, sceneggiatori, etc.).
    
    Relazione: Many-to-Many con Movie attraverso ruoli
    Una persona può avere più ruoli nello stesso film, e può lavorare su più film.
    
    Esempio: "Clint Eastwood" può essere sia "Director" che "Actor" nello stesso film
    Il campo 'role' specifica la funzione (Director, Producer, Writer, etc.)
    """
    
    __tablename__ = 'crews'
    
    id = db.Column(db.Integer, primary_key=True)
    id_movies = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False, index=True)
    role = db.Column(db.Text, nullable=False, index=True)  # Ruolo: Director, Producer, Writer, etc.
    name = db.Column(db.Text, nullable=False, index=True)  # Nome della persona
    
    # Relazione back-reference verso Movie
    movie = relationship('Movie', back_populates='crews')
    
    def __repr__(self):
        return f'<Crew {self.name} ({self.role}) for Movie {self.id_movies}>'

class Language(db.Model):
    """
    Modello per le lingue dei film.
    
    Il campo 'type' specifica se è lingua parlata, sottotitoli, etc.
    Utile per filtri di accessibilità e mercati internazionali.
    """
    
    __tablename__ = 'languages'
    
    id = db.Column(db.Integer, primary_key=True)
    id_movies = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False, index=True)
    type = db.Column(db.Text)  # Tipo: "Spoken", "Subtitle", etc.
    language = db.Column(db.Text, nullable=False, index=True)  # Nome della lingua
    
    # Relazione back-reference verso Movie
    movie = relationship('Movie', back_populates='languages')
    
    def __repr__(self):
        return f'<Language {self.language} ({self.type}) for Movie {self.id_movies}>'

class Poster(db.Model):
    """
    Modello per i poster dei film.
    
    Relazione: Tipicamente One-to-One con Movie (un poster principale per film)
    Anche se tecnicamente può essere One-to-Many se ci sono più varianti.
    
    Il campo 'link' contiene l'URL dell'immagine del poster.
    Fondamentale per l'interfaccia utente che mostra le card dei film.
    """
    
    __tablename__ = 'posters'
    
    id = db.Column(db.Integer, primary_key=True)
    id_movies = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False, index=True)
    link = db.Column(db.Text, nullable=False)  # URL dell'immagine del poster
    
    # Relazione back-reference verso Movie
    movie = relationship('Movie', back_populates='posters')
    
    def __repr__(self):
        return f'<Poster for Movie {self.id_movies}>'

class Release(db.Model):
    """
    Modello per le date e modalità di rilascio dei film.
    
    Relazione: One-to-Many con Movie (un film può avere rilasci diversi in paesi/date diverse)
    
    Esempio: "Avengers" può uscire il 25 Aprile in "Italy" tipo "Theatrical"
    e il 30 Aprile in "USA" tipo "IMAX". Il campo 'rating' indica la 
    classificazione locale (PG-13, R, etc.)
    
    Cruciale per logiche di geo-targeting e filtri temporali.
    """
    
    __tablename__ = 'releases'
    
    id = db.Column(db.Integer, primary_key=True)
    id_movies = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False, index=True)
    country = db.Column(db.Text, index=True)  # Paese di rilascio
    date = db.Column(db.Date, index=True)  # Data di rilascio (può essere diversa per paese)
    type = db.Column(db.Text)  # Tipo: "Theatrical", "Digital", "DVD", "IMAX", etc.
    rating = db.Column(db.Text)  # Rating locale: "PG", "PG-13", "R", "18+", etc.
    
    # Relazione back-reference verso Movie
    movie = relationship('Movie', back_populates='releases')
    
    def __repr__(self):
        return f'<Release {self.country} {self.date} ({self.type}) for Movie {self.id_movies}>'

class Studio(db.Model):
    """
    Modello per gli studi di produzione.
    
    Relazione: One-to-Many con Movie (un film può essere prodotto da più studi)
    Esempio: "Marvel Studios", "Warner Bros", "Universal Pictures"
    
    Importante per analisi di business e filtri per casa di produzione.
    """
    
    __tablename__ = 'studios'
    
    id = db.Column(db.Integer, primary_key=True)
    id_movies = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False, index=True)
    studio = db.Column(db.Text, nullable=False, index=True)  # Nome dello studio
    
    # Relazione back-reference verso Movie
    movie = relationship('Movie', back_populates='studios')
    
    def __repr__(self):
        return f'<Studio {self.studio} for Movie {self.id_movies}>'

class Theme(db.Model):
    """
    Modello per i temi/tag dei film.
    
    Diverso dai generi, i temi sono più specifici e descrivono contenuto/mood.
    Esempio: "coming-of-age", "superhero", "dystopian", "revenge"
    
    Utile per sistemi di raccomandazione e ricerche tematiche avanzate.
    """
    
    __tablename__ = 'themes'
    
    id = db.Column(db.Integer, primary_key=True)
    id_movies = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False, index=True)
    theme = db.Column(db.Text, nullable=False, index=True)  # Nome del tema
    
    # Relazione back-reference verso Movie
    movie = relationship('Movie', back_populates='themes')
    
    def __repr__(self):
        return f'<Theme {self.theme} for Movie {self.id_movies}>'
    
class Oscar(db.Model):
    """
    Modello per le nomination e vittorie agli Oscar.
    
    Questa tabella è speciale perché combina dati da due dataset diversi:
    - I dati base del film dal dataset principale
    - I dati degli Oscar da un dataset separato
    
    Il campo 'winner' indica se ha vinto (True) o solo nominato (False).
    Il matching con i film viene fatto tramite 'id_movies' che dovrebbe
    essere popolato durante il processo di data import.
    """
    
    __tablename__ = 'oscars'
    
    id = db.Column(db.Integer, primary_key=True)
    year_film = db.Column(db.Integer, index=True)  # Anno del film
    year_ceremony = db.Column(db.Integer, index=True)  # Anno della cerimonia
    ceremony = db.Column(db.Integer)  # Numero della cerimonia
    category = db.Column(db.Text, nullable=False, index=True)  # Categoria: "Best Picture", "Best Actor", etc.
    name = db.Column(db.Text, nullable=False)  # Nome della persona nominata
    film = db.Column(db.Text, nullable=False)  # Titolo del film (dal dataset Oscar)
    winner = db.Column(db.Boolean, nullable=False, index=True)  # True = vinto, False = solo nominato
    id_movies = db.Column(db.Integer, db.ForeignKey('movies.id'), index=True)  # Link al nostro dataset
    
    # Relazione back-reference verso Movie
    movie = relationship('Movie', back_populates='oscars')
    
    def __repr__(self):
        status = "Winner" if self.winner else "Nominee"
        return f'<Oscar {status} {self.name} ({self.category}) for {self.film}>'