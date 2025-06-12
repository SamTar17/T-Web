from flask import Blueprint, request, jsonify
from app.controllers.MoviesController import MovieController

# Creiamo il blueprint per organizzare le route dei film
movies_bp = Blueprint('movies', __name__, url_prefix='/api/movies')

@movies_bp.route('/<int:movie_id>', methods=['GET'])
def get_movie_details(movie_id):
    """
    Endpoint per recuperare i dettagli di un film specifico.
    
    La route ora fa solo da ponte tra HTTP e controller.
    Tutta la logica è stata spostata nel controller.
    """
    
    # === DELEGAZIONE AL CONTROLLER ===
    response_data, status_code = MovieController.get_movie_details(movie_id)
    
    # Restituiamo la risposta HTTP
    return jsonify(response_data), status_code

@movies_bp.route('/suggestions', methods=['GET'])
def get_movie_suggestions():
    query = request.args.get('q', '').strip()
    response_data, status_code = MovieController.get_suggestions(query)
    return jsonify(response_data), status_code

@movies_bp.route('/search', methods=['GET'])
def search_movies():

    """
    Endpoint per la ricerca avanzata di film con filtri multipli.
    
    Anche questo endpoint è ora molto più pulito - estrae i parametri
    e delega la logica complessa al controller.
    """
    
    # === ESTRAZIONE PARAMETRI ===
    
    # Costruisco il dizionario dei filtri dalla request
    filters_raw = {}
    
    filters_raw['title'] = request.args.get('title', '')
    
    # Parametri numerici (rating)
    filters_raw['min_rating'] = request.args.get('min_rating', type=float)
    filters_raw['max_rating'] = request.args.get('max_rating', type=float)
    
    # Parametri anno
    filters_raw['year_from'] = request.args.get('year_from', type=int)
    filters_raw['year_to'] = request.args.get('year_to', type=int)
    
    # Parametri durata
    filters_raw['min_duration'] = request.args.get('min_duration', type=int)
    filters_raw['max_duration'] = request.args.get('max_duration', type=int)
    
    # Lista generi (può avere valori multipli)
    filters_raw['genre'] = request.args.getlist('genre')
    
    # Filtri booleani
    filters_raw['upcoming'] = request.args.get('upcoming', 'false')
    filters_raw['tvmovie'] = request.args.get('tvmovie', 'false')
    
    # Parametri ordinamento
    filters_raw['sort_by'] = request.args.get('sort_by', 'base')
    filters_raw['order_by'] = request.args.get('order_by', 'desc')
    
    # Parametri paginazione
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # === DELEGAZIONE AL CONTROLLER ===
    
    response_data, status_code = MovieController.search_movies(
        filters_raw=filters_raw,
        page=page,
        per_page=per_page
    )
    
    # === RISPOSTA HTTP ===
    
    return jsonify(response_data), status_code
