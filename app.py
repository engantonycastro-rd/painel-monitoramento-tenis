from flask import Flask, render_template, jsonify
import requests
import os
from datetime import datetime

app = Flask(__name__)

# Configurações da API Ultimate Tennis
RAPIDAPI_KEY = os.environ.get('RAPIDAPI_KEY', 'a6a64b91b0mshf6c3de3afc4302dp1142e8jsnf6a4eea01df4')
RAPIDAPI_HOST = 'ultimate-tennis1.p.rapidapi.com'
BASE_URL = 'https://ultimate-tennis1.p.rapidapi.com'

# Headers para as requisições
HEADERS = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST
}

app.config['TEMPLATES_AUTO_RELOAD'] = True

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'Painel de Monitoramento de Tênis está online'})

@app.route('/api/live-matches')
def get_live_matches():
    """Buscar partidas ao vivo da Ultimate Tennis API"""
    try:
        # Endpoint para buscar partidas ao vivo
        url = f"{BASE_URL}/live_scores"
        
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Verifica se há erro interno (nenhuma partida ao vivo)
        if 'internal_error' in data:
            return jsonify({
                'success': True,
                'matches': [],
                'count': 0,
                'message': data.get('internal_error', 'Nenhuma partida ao vivo no momento')
            })
        
        # Processa as partidas
        processed_matches = []
        
        # A resposta pode ser um dicionário com matches ou uma lista
        if isinstance(data, dict):
            matches = data.get('matches', []) or data.get('data', [])
        elif isinstance(data, list):
            matches = data
        else:
            matches = []
        
        for match in matches[:20]:  # Limita a 20 partidas
            processed_match = process_match(match)
            if processed_match:
                processed_matches.append(processed_match)
        
        return jsonify({
            'success': True,
            'matches': processed_matches,
            'count': len(processed_matches)
        })
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar partidas: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao conectar com a API: {str(e)}'
        }), 500
    except Exception as e:
        print(f"Erro geral: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao processar dados: {str(e)}'
        }), 500

@app.route('/api/player-history/<player_id>')
def get_player_history(player_id):
    """Buscar histórico das últimas 15 partidas de um jogador"""
    try:
        # Endpoint para buscar histórico do jogador
        url = f"{BASE_URL}/player_matches"
        
        params = {
            'player_id': player_id,
            'limit': 15
        }
        
        response = requests.get(url, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Processa o histórico
        history = []
        if isinstance(data, dict):
            matches = data.get('matches', []) or data.get('data', [])
        elif isinstance(data, list):
            matches = data
        else:
            matches = []
        
        for match in matches[:15]:
            history.append({
                'date': match.get('date'),
                'opponent': match.get('opponent', {}).get('name') if isinstance(match.get('opponent'), dict) else match.get('opponent'),
                'result': match.get('result'),
                'score': match.get('score'),
                'surface': match.get('surface'),  # Tipo de piso
                'tournament': match.get('tournament', {}).get('name') if isinstance(match.get('tournament'), dict) else match.get('tournament')
            })
        
        return jsonify({
            'success': True,
            'player_id': player_id,
            'history': history
        })
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar histórico: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao buscar histórico: {str(e)}'
        }), 500

@app.route('/api/h2h/<player1_id>/<player2_id>')
def get_h2h(player1_id, player2_id):
    """Buscar confronto direto entre dois jogadores"""
    try:
        # Endpoint para buscar H2H
        url = f"{BASE_URL}/h2h"
        
        params = {
            'player1_id': player1_id,
            'player2_id': player2_id
        }
        
        response = requests.get(url, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        return jsonify({
            'success': True,
            'player1_id': player1_id,
            'player2_id': player2_id,
            'h2h': data
        })
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar H2H: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao buscar H2H: {str(e)}'
        }), 500

@app.route('/api/match-details/<match_id>')
def get_match_details(match_id):
    """Buscar detalhes de uma partida específica"""
    try:
        # Endpoint para buscar detalhes da partida
        url = f"{BASE_URL}/match_details"
        
        params = {
            'match_id': match_id
        }
        
        response = requests.get(url, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()
        
        match_data = response.json()
        
        return jsonify({
            'success': True,
            'match': match_data
        })
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar detalhes da partida: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao buscar detalhes: {str(e)}'
        }), 500

@app.route('/api/player-news/<player_name>')
def get_player_news(player_name):
    """Buscar notícias sobre um jogador (lesões, etc)"""
    try:
        # Endpoint para buscar notícias/highlights
        url = f"{BASE_URL}/player_news"
        
        params = {
            'player_name': player_name
        }
        
        response = requests.get(url, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Processa as notícias
        news = []
        if isinstance(data, dict):
            highlights = data.get('news', []) or data.get('data', [])
        elif isinstance(data, list):
            highlights = data
        else:
            highlights = []
        
        for item in highlights[:5]:  # Últimas 5 notícias
            news.append({
                'title': item.get('title'),
                'description': item.get('description'),
                'date': item.get('date'),
                'type': item.get('type')
            })
        
        return jsonify({
            'success': True,
            'player': player_name,
            'news': news
        })
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar notícias: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao buscar notícias: {str(e)}'
        }), 500

def process_match(match):
    """Processa dados de uma partida"""
    try:
        return {
            'id': match.get('id'),
            'player1': match.get('player1', {}).get('name') if isinstance(match.get('player1'), dict) else match.get('player1'),
            'player2': match.get('player2', {}).get('name') if isinstance(match.get('player2'), dict) else match.get('player2'),
            'player1_id': match.get('player1', {}).get('id') if isinstance(match.get('player1'), dict) else None,
            'player2_id': match.get('player2', {}).get('id') if isinstance(match.get('player2'), dict) else None,
            'score': match.get('score'),
            'status': match.get('status'),
            'tournament': match.get('tournament', {}).get('name') if isinstance(match.get('tournament'), dict) else match.get('tournament'),
            'tournament_type': match.get('tournament', {}).get('type') if isinstance(match.get('tournament'), dict) else None,
            'surface': match.get('surface'),
            'current_set': match.get('current_set'),
            'player1_stats': match.get('player1_stats', {}),
            'player2_stats': match.get('player2_stats', {}),
            'updated_at': datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Erro ao processar partida: {str(e)}")
        return None

if __name__ == '__main__':
    # Executar em 0.0.0.0 para aceitar conexões externas
    app.run(host='0.0.0.0', port=5000, debug=False)
