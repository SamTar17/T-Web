from flask import Blueprint, request, jsonify
from app.models.MoviesModels import Movie

# Creiamo il blueprint per organizzare le route dei film
movies_bp = Blueprint('movies', __name__, url_prefix='/api/movies')

@movies_bp.route('/suggestions', methods=['GET'])
def get_movie_suggestions():
    try:
        query = request.args.get('q', '').strip()
        
        if not query or len(query) < 2:
            return jsonify({
                'success': True,
                'suggestions': [],
                'message': 'Query vuota'
            }), 200
        
        # === CHIAMATA AL MODELLO ===
     
        suggestions = Movie.get_suggestions(query)

        return jsonify({
            'success': True,
            'suggestions': suggestions
        }), 200
        
    except Exception as e:
        print(f"Errore in get_movie_suggestions: {str(e)}")
        return jsonify({
            'success': False,
            'suggestions': [],
            'error': f'Errore interno del server {e}'
        }), 500

@movies_bp.route('/search', methods=['GET'])
def search_movies():
    # Parametro di ricerca testuale utile per il redirect dopo ricerca
    #costruisco i filtri e faccio controllo sopra 
    try:        
        
        filters = {} 
        
        #=== FILTRI WHERE == 
           
        title = request.args.get('title', '',type=str).strip()
        
        if title and len(title) >= 2:  
            filters['title'] = title[:100]
    
        min_rating = request.args.get('min_rating',type= float)
        if min_rating:
            filters['min_rating'] = min_rating
  
        max_rating = request.args.get('max_rating',type=float)
        if max_rating:
            filters['max_rating'] = max_rating
            
        year_from = request.args.get('year_from',type= int)
        if year_from:
            filters['year_from'] = year_from

        year_to = request.args.get('year_to',type= int)
        if year_to:
            filters['year_to'] = year_to

        min_duration = request.args.get('min_duration',type=int)
        if min_duration:
            filters['min_duration'] = min_duration

        max_duration = request.args.get('max_duration',type=int)
        if max_duration:
            filters['max_duration'] = max_duration

        genre = request.args.getlist('genre')
        if genre:
            genre_in_table = {
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
            
            filters['genre'] = []
            for gen in genre:
                try:
                    filters['genre'].append(genre_in_table[gen])
                except:
                    pass
                
        filters['upcoming'] = request.args.get('upcoming', 'false').lower()
        filters['tvmovie'] = request.args.get('tvmovie', 'false').lower()
        
        # ===PARAMETRI DI ORDINAMENTO ===

        sort_by = request.args.get('sort_by', 'base')
        valid_sort_options = ['base','rating', 'date', 'name', 'duration', 'random']
        
        if sort_by not in valid_sort_options:
            sort_by = 'date'  # Fallback sicuro
        
        order_by = request.args.get('order_by', 'desc')
        if order_by not in ['asc', 'desc']:
            order_by = 'desc'  # Fallback sicuro
        
        filters['sort_by'] = sort_by
        filters['order_by'] = order_by  
        
        # === PAGINAZIONE ===
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # === CHIAMATA AL MODELLO + QUERY===
    
        searched_movies, paginazione = Movie.search(
            filters=filters,
            page=page,
            per_page=per_page
        )
        
        # ===RISULTATO===

        return jsonify({
            'success': True,
            'movies': searched_movies,
            'pagination': paginazione,
            'filters_applied': {
                'title': filters.get('title'),
                'rating_range': [filters.get('min_rating'), filters.get('max_rating')],
                'year_range': [filters.get('year_from'), filters.get('year_to')],
                'duration_range': [filters.get('min_duration'), filters.get('max_duration')],
                'sort_by': sort_by,
                'order_by': order_by
            }
        }), 200
        
    except Exception as e:
        print(f"Errore in search_movies: {str(e)}")
        return jsonify({
            'success': False,
            'movies': [],
            'pagination': {
                'current_page': 1,
                'total_pages': 0,
                'total_results': 0,
                'has_next': False,
                'has_previous': False
            },
            'error': 'Errore interno del server'
        }), 500

@movies_bp.route('/<int:movie_id>', methods=['GET'])
def get_movie_details(movie_id):
    
    try:
        # === CHIAMATA AL MODELLO ===
        
        movie_id =int(movie_id)
        movie_details = Movie.get_movie_details(movie_id)
        
        # ===RISULTATI===

        if movie_details is None:
            return jsonify({
                'success': False,
                'error': 'Film non trovato',
                'movie_id': movie_id
            }), 404
            
        return jsonify({
            'success': True,
            'movie': movie_details
        }), 200
        
    except Exception as e:
        print(f"Errore in get_movie_details per ID {movie_id}: {str(e)}")
        
        return jsonify({
            'success': False,
            'error': 'Errore interno del server',
            'movie_id': movie_id
        }), 500