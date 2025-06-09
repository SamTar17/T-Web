import pandas as pd
import html
import re
import codecs
import unidecode

def normalizza_descrizione(series):
    """Versione vettorizzata per massime performance"""
    
    # Gestisci NaN
    series = series.fillna("")
    
    # Converti tutto a stringa
    series = series.astype(str)
    
    series = series.apply(lambda x: html.unescape(x) if x else x)

    series = series.str.replace(r'[\x00-\x1f\x7f-\x9f]', '', regex=True)
    series = series.str.replace(r'[\r\n]+', ' ', regex=True)
    series = series.str.replace(r'\s+', ' ', regex=True)
    series = series.str.strip()
    
    return series

def normalizza_valutazioni(value):
    # Mappatura delle lettere
    mappa_lettere = {
        'A': 10,
        'A-': 9,
        'B+': 8.5,
        'B': 8,
        'B-': 7.5,
        'C+': 7,
        'C': 6,
        'C-': 5.5,
        'D+': 5,
        'D': 4,
        'D-': 3.5,
        'F': 1
    }
    if type(value) == int or type(value) == float:
        if value > 10 or value < 0:
            return None
        else:
            return value
    else:
        if '/' in value:
            num, denom = value.split('/')
            try:
                num = float(num)
                denom = float(denom)
                #check se il denominatore è pari a zero
                if denom == 0:
                    return None
                else:
                    normalized_score = (num / denom) * 10
                    if normalized_score > 10:
                        return None
                    else:
                        return round(normalized_score, 1)
            except ValueError:
                return None

        # Se è una valutazione alfanumerica
        elif value in mappa_lettere:
            return mappa_lettere[value]

        else:
            return None
        
def normalizza_titolo(titolo, parentesi = False):
    if pd.isna(titolo) or titolo is None:
        return ""
    
    risultato = titolo.lower()
    
    # Rimozione accenti e caratteri non-ASCII
    risultato = unidecode.unidecode(risultato)
    
    # Rimozione contenuti tra parentesi (se richiesto) - meglio farlo prima
    if parentesi:
        risultato = re.sub(r'[\(\[\{].*?[\)\]\}]', '', risultato)
    
    # Rimozione di punteggiatura e caratteri speciali (mantieni solo lettere, numeri, spazi)
    risultato = re.sub(r'[^a-zA-Z0-9\s]', '', risultato)
    
    # Rimozione di tutti gli spazi (ultimo passaggio per chiarezza)
    risultato = re.sub(r'\s+', '', risultato)
    
    return risultato.strip()