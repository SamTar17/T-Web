import json
from app.models.MoviesModels import Movie

class MovieController:
    """
    Controller per la gestione dei film.
    
    Responsabilità:
    - Validazione dei parametri in input
    - Orchestrazione delle chiamate ai models
    - Gestione degli errori e delle eccezioni
    - Formattazione delle risposte HTTP
    - Logica di business (paginazione, filtri, etc.)
    """
    
    @staticmethod
    def get_movie_details(movie_id):
        """
        Recupera i dettagli completi di un film specifico.
        
        Args:
            movie_id: ID del film da recuperare
            
        Returns:
            tuple: (response_data, status_code)
        """
        try:
            # === VALIDAZIONE INPUT ===

            try:
                movie_id = int(movie_id)
            except (ValueError, TypeError):
                return {
                    'success': False,
                    'error': 'ID film deve essere un numero valido',
                    'movie_id': movie_id
                }, 400
            
            if movie_id <= 0:
                return {
                    'success': False,
                    'error': 'ID film deve essere un numero positivo',
                    'movie_id': movie_id
                }, 400
            
            # === CHIAMATA AL MODEL ===
            movie_data = Movie.get_movie_details(movie_id)
            
            # === CONTROLLO RISULTATO ===
            
            if movie_data is None:
                return {
                    'success': False,
                    'error': 'Film non trovato',
                    'movie_id': movie_id
                }, 404
            
            # === COSTRUZIONE RISPOSTA ===
            movie_data_formatted = MovieController._format_movie_data(movie_data)
            
            return {
                'success': True,
                'movie': movie_data_formatted
            }, 200
            
        except Exception as e:
            # === GESTIONE ERRORI ===
            print(f"❌ Errore in get_movie_details per ID {movie_id}: {str(e)}")
            
            return {
                'success': False,
                'error': 'Errore interno del server',
                'movie_id': movie_id
            }, 500
    
    @staticmethod
    def get_suggestions(query, limit=5):
        """
        Recupera suggerimenti di film basati su una query di ricerca.
        
        Args:
            query (str): Termine di ricerca inserito dall'utente
            limit (int): Numero massimo di suggerimenti da restituire
            
        Returns:
            tuple: (response_data, status_code)
        """
        try:
            # === VALIDAZIONE E PULIZIA INPUT ===
            if not query or len(query) < 2:
                return {
                    'success': True,
                    'suggestions': [],
                    'message': 'Query vuota o troppo corta'
                }, 200
            
            query = query.strip()            
            
            if len(query) > 50:
                query = query[:50]
                        
            # === CHIAMATA AL MODEL ===
            
            suggestions = Movie.get_suggestions(query, limit)
            
            # === FORMATTAZIONE RISPOSTA ===
            
            suggestions_formatted = MovieController._format_suggestions(suggestions)
            
            return {
                'success': True,
                'suggestions': suggestions_formatted
            }, 200
            
        except Exception as e:            
            print(f"❌ Errore in get_suggestions per query '{query}': {str(e)}")
            
            return {
                'success': False,
                'suggestions': [],
                'error': 'Errore interno del server'
            }, 500
    
    @staticmethod
    def search_movies(filters_raw, page=1, per_page=20):
        """
        Cerca film applicando filtri multipli con paginazione.
        
        Questo è il metodo più complesso perché gestisce molti tipi di filtri,
        ordinamento e paginazione. La separazione delle responsabilità qui
        è particolarmente importante.
        
        Args:
            filters_raw (dict): Filtri grezzi dalla request HTTP
            page (int): Numero di pagina per la paginazione
            per_page (int): Risultati per pagina
            
        Returns:
            tuple: (response_data, status_code)
        """
        try:
            # === VALIDAZIONE E PULIZIA FILTRI ===
            print('raw_filters', filters_raw)
            # Il controller si occupa di validare e pulire tutti i parametri
            clean_filters = MovieController._validate_and_clean_filters(filters_raw)
            print('clean_filters', clean_filters)
            # === VALIDAZIONE PAGINAZIONE ===
            
            # Controllo e normalizzazione parametri paginazione
            try:
                page = int(page)
                if page < 1:
                    page = 1
            except (ValueError, TypeError):
                page = 1
            
            try:
                per_page = int(per_page)
                if per_page < 1 or per_page > 50:  
                    per_page = 20
            except (ValueError, TypeError):
                per_page = 20
            
            # === CHIAMATA AL MODEL ===
            
            # Il model ora riceve solo filtri puliti e restituisce dati grezzi
            movies_data, total_count = Movie.search(
                filters=clean_filters, 
                page=page, 
                per_page=per_page
            )
            
            
            if movies_data is None:
                return {
                'success': False,
                'movies': [],
                'pagination': {
                    'current_page': 1,
                    'per_page': per_page,
                    'total_results': 0,
                    'total_pages': 0,
                    'has_next': False,
                    'has_previous': False
                },
                    'query dict': json.dumps(clean_filters)
                }, 404
            
            
            formatted_movies = MovieController._format_search_results(movies_data)
            
            # === CALCOLO METADATI PAGINAZIONE ===
            pagination_info = MovieController._calculate_pagination_metadata(
                page, per_page, total_count
            )
            
            return {
                'success': True,
                'movies': formatted_movies,
                'pagination': pagination_info,
                'query dict': json.dumps(clean_filters)
            }, 200
            
        except Exception as e:
            # === GESTIONE ERRORI ===
            
            print(f"❌ Errore in search_movies: {str(e)}")
            
            return {
                'success': False,
                'movies': [],
                'pagination': {
                    'current_page': 1,
                    'per_page': per_page,
                    'total_results': 0,
                    'total_pages': 0,
                    'has_next': False,
                    'has_previous': False
                },
                'error': 'Errore interno del server'
            }, 500
    
    @staticmethod
    def _validate_and_clean_filters(filters_raw):
        """
        Valida e pulisce i filtri ricevuti dalla request HTTP.

        Args:
            filters_raw (dict): Filtri grezzi dalla request
            
        Returns:
            dict: Filtri validati e puliti
        """
        clean_filters = {}
        
        # === FILTRI TESTUALI ===
        
        if 'title' in filters_raw and filters_raw['title']:
            title = str(filters_raw['title']).strip()
            if len(title) >= 2:  # Minimo 2 caratteri per performance
                clean_filters['title'] = title[:100]  # Tronco per sicurezza
        
        # === FILTRI NUMERICI (RATING) ===
        
        if 'min_rating' in filters_raw and filters_raw['min_rating'] is not None:
            try:
                min_rating = float(filters_raw['min_rating'])
                if 0 <= min_rating <= 5:  # Range ragionevole
                    clean_filters['min_rating'] = min_rating
            except (ValueError, TypeError):
                pass  # Ignoro valori non validi
        
        if 'max_rating' in filters_raw and filters_raw['max_rating'] is not None:
            try:
                max_rating = float(filters_raw['max_rating'])
                if 0 <= max_rating <= 5:
                    clean_filters['max_rating'] = max_rating
            except (ValueError, TypeError):
                pass
        
        # === FILTRI ANNO ===
        
        if 'year_from' in filters_raw and filters_raw['year_from'] is not None:
            try:
                year_from = int(filters_raw['year_from'])
                if 1800 <= year_from <= 2030:  # 
                    clean_filters['year_from'] = year_from
            except (ValueError, TypeError):
                pass
        
        if 'year_to' in filters_raw and filters_raw['year_to'] is not None:
            try:
                year_to = int(filters_raw['year_to'])
                if 1800 <= year_to <= 2030:
                    clean_filters['year_to'] = year_to
            except (ValueError, TypeError):
                pass
        
        # === FILTRI DURATA ===
        
        if 'min_duration' in filters_raw and filters_raw['min_duration'] is not None:
            try:
                min_duration = int(filters_raw['min_duration'])
                if min_duration > 0:
                    clean_filters['min_duration'] = min_duration
            except (ValueError, TypeError):
                pass
        
        if 'max_duration' in filters_raw and filters_raw['max_duration'] is not None:
            try:
                max_duration = int(filters_raw['max_duration'])
                if max_duration > 0:
                    clean_filters['max_duration'] = max_duration
            except (ValueError, TypeError):
                pass
        
        # === FILTRI GENERI ===
        
        if 'genre' in filters_raw and filters_raw['genre']:
            # Mappa per tradurre generi dall'italiano all'inglese del database
            genre_mapping = {
                'commedia': 'Comedy',
                'avventura': 'Adventure',
                'thriller': 'Thriller',
                'dramma': 'Drama',
                'fantascienza': 'Science Fiction',
                'azione': 'Action',
                'musica': 'Music',
                'romantico': 'Romance',
                'storico': 'History',
                'crimine': 'Crime',
                'animazione': 'Animation',
                'mistero': 'Mystery',
                'horror': 'Horror',
                'famiglia': 'Family',
                'fantasy': 'Fantasy',
                'guerra': 'War',
                'western': 'Western',
                'film tv': 'TV Movie',
                'documentario': 'Documentary',
            }
            
            valid_genres = []
            for genre in filters_raw['genre']:
                if genre.lower() in genre_mapping:
                    valid_genres.append(genre_mapping[genre.lower()])
            
            if valid_genres:
                clean_filters['genre'] = valid_genres
        
        # === FILTRI BOOLEANI ===
        
        
        if  'upcoming' in filters_raw and filters_raw['upcoming'] == 'true':
            clean_filters['upcoming'] = filters_raw['upcoming']
        elif filters_raw['upcoming'] == 'false': 
            clean_filters['upcoming'] = filters_raw['upcoming']
        else:
            pass
        
        if  'tvmovie' in filters_raw and filters_raw['tvmovie'] == 'true':
            clean_filters['tvmovie'] = filters_raw['tvmovie']
        elif filters_raw['tvmovie'] == 'false': 
            clean_filters['tvmovie'] = filters_raw['tvmovie']   
        else:
            pass
        
        # === ORDINAMENTO ===
        
        valid_sort_options = ['base', 'rating', 'date', 'name', 'duration', 'random']
        clean_filters['sort_by'] = filters_raw['sort_by'] if filters_raw['sort_by'] in valid_sort_options else 'base'
        
        clean_filters['order_by'] = filters_raw['order_by'] if filters_raw['order_by'] in ['asc', 'desc'] else 'desc'
        
        return clean_filters
    
    @staticmethod
    def _calculate_pagination_metadata(page, per_page, total_count):
        """
        Calcola i metadati per la paginazione.
        
        Args:
            page (int): Pagina corrente
            per_page (int): Risultati per pagina
            total_count (int): Totale risultati disponibili
            
        Returns:
            dict: Metadati di paginazione
        """
        total_pages = (total_count + per_page - 1) // per_page
        
        return {
            'current_page': page,
            'per_page': per_page,
            'total_results': total_count,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_previous': page > 1
        }
    
    @staticmethod
    def _format_search_results(movie_objects):
        """
        Formatta i risultati di ricerca per la risposta API.
        
        Args:
            movie_objects: Lista di oggetti Movie con relazioni caricate
            
        Returns:
            list: Lista di dizionari con dati formattati
        """
        movies_list = []
        
        for movie in movie_objects:
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
        
        return movies_list
    
    @staticmethod
    def _format_movie_data(movie_obj):
        """
        Formatta i dati di un film per la risposta HTTP.
                
        Args:
            movie_obj: Oggetto Movie di SQLAlchemy con tutte le relazioni caricate
            
        Returns:
            dict: Dati del film formattati per la risposta
        """
                
        result = {
            'id': movie_obj.id,
            'name': movie_obj.name,
            'date': int(movie_obj.date) if movie_obj.date else None,
            'rating': float(movie_obj.rating) if movie_obj.rating else None,
            'minute': int(movie_obj.minute) if movie_obj.minute else None,
            'tagline': movie_obj.tagline,
            'description': movie_obj.description,
        }
        
        # === FORMATTAZIONE POSTER ===
        
        if movie_obj.posters:
            result['poster'] = {
                'url': movie_obj.posters[0].link,
                'alt': f"Poster di {movie_obj.name}"
            }
        else:
            result['poster'] = {
                'url': None,
                'alt': f"Poster di {movie_obj.name}"
            }
        
        # === FORMATTAZIONI COMPLESSE ===
        
        actors = {}
        for actor in movie_obj.actors:
            actor_name = actor.actor
            role = actor.role if actor.role else ""

            if role in actors:
                actors[role].append(actor_name)
            else:
                actors[role] = [actor_name]
        
        result['actors'] = actors
                
        crew = {}
        for membro_crew in movie_obj.crews:
            ruolo = membro_crew.role if membro_crew.role else ""
            
            if ruolo not in crew:
                crew[ruolo] = []
            crew[ruolo].append(membro_crew.name)
        
        result['crews'] = crew
                
        languages = {}
        for lang in movie_obj.languages:
            lang_type = lang.type
            language = lang.language
            
            if lang_type not in languages:
                languages[lang_type] = []
            languages[lang_type].append(language)
        
        result['languages'] = languages
                
        releases = {}
        for release in movie_obj.releases:
            country = release.country
            date = release.date.isoformat()
            release_type = release.type if release.type else ''
            rating = release.rating if release.rating else ''
            
            if country not in releases:
                releases[country] = {}
                
            if date not in releases[country]:
                releases[country][date] = {}
            
            releases[country][date]['rating'] = rating
            releases[country][date]['type'] = release_type
        
        result['releases'] = releases
        
        # === LISTE SEMPLICI ===
        
        # Questi sono semplici liste di stringhe
        result['genres'] = [genre.genre for genre in movie_obj.genres]
        result['studios'] = [studio.studio for studio in movie_obj.studios]
        result['themes'] = [theme.theme for theme in movie_obj.themes]
        result['countries'] = [country.country for country in movie_obj.countries]
        
        return result
    
    @staticmethod
    def _format_suggestions(movie_objects):
        """
        Formatta una lista di oggetti Movie per i suggerimenti.
        
        Questo metodo privato separa la logica di formattazione,
        rendendola testabile e riutilizzabile.
        
        Args:
            movie_objects: Lista di oggetti Movie di SQLAlchemy
            
        Returns:
            list: Lista di dizionari con i dati formattati per i suggerimenti
        """
        suggestions = []
        
        for movie in movie_objects:
            # Per ogni film creo la struttura dati per il suggerimento
            poster_url = movie.posters[0].link if movie.posters else None
            
            suggestion = {
                'id': movie.id,
                'name': movie.name,
                'date': int(movie.date) if movie.date else None,
                'poster_url': poster_url,
            }
            suggestions.append(suggestion)
        
        return suggestions    
    
    
    
    
    
    
    
    
    
    
    
    
    
            
        