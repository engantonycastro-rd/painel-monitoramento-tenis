from flask import Flask, render_template, jsonify
import requests
import os
from datetime import datetime

app = Flask(__name__)

# Configurações da API Flashscore
RAPIDAPI_KEY = os.environ.get('RAPIDAPI_KEY', 'a6a64b91b0mshf6c3de3afc4302dp1142e8jsnf6a4eea01df4')
RAPIDAPI_HOST = 'flashscore4.p.rapidapi.com'
BASE_URL = 'https://flashscore4.p.rapidapi.com'

# Headers para as requisições
HEADERS = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST
}

app.config['TEMPLATES_AUTO_RELOAD'] = True

# Sport ID para Tênis na Flashscore
TENNIS_SPORT_ID = 2

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'Painel de Monitoramento de Tênis está online'})

@app.route('/api/live-matches')
def get_live_matches():
    """Buscar partidas de tênis ao vivo da Flashscore API"""
    try:
        # Endpoint para buscar partidas ao vivo
        url = f"{BASE_URL}/api/flashscore/v2/matches/live"
        
        params = {
            'sport_id': TENNIS_SPORT_ID,  # 2 = Tênis
            'timezone': 'America/Sao_Paulo'
        }
        
        response = requests.get(url, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Processa os torneios e partidas
        processed_matches = []
        
        if isinstance(data, list):
            for tournament in data:
                if isinstance(tournament, dict) and 'matches' in tournament:
                    tournament_name = tournament.get('name', 'Desconhecido')
                    tournament_id = tournament.get('tournament_id', '')
                    
                    for match in tournament['matches']:
                        processed_match = process_match(match, tournament_name, tournament_id)
                        if processed_match:
                            processed_matches.append(processed_match)
        
        return jsonify({
            'success': True,
            'matches': processed_matches[:20],  # Limita a 20 partidas
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

@app.route('/api/match-details/<match_id>')
def get_match_details(match_id):
    """Buscar detalhes de uma partida específica"""
    try:
        # Endpoint para buscar detalhes da partida
        url = f"{BASE_URL}/api/flashscore/v2/match/{match_id}"
        
        response = requests.get(url, headers=HEADERS, timeout=10)
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

@app.route('/api/match-stats/<match_id>')
def get_match_stats(match_id):
    """Buscar estatísticas ao vivo de uma partida"""
    try:
        # Endpoint para buscar estatísticas da partida
        url = f"{BASE_URL}/api/flashscore/v2/match/{match_id}/stats"
        
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        
        stats_data = response.json()
        
        return jsonify({
            'success': True,
            'stats': stats_data
        })
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar estatísticas: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao buscar estatísticas: {str(e)}'
        }), 500

@app.route('/api/h2h/<player1>/<player2>')
def get_h2h(player1, player2):
    """Buscar confronto direto entre dois jogadores"""
    try:
        # Endpoint para buscar H2H
        url = f"{BASE_URL}/api/flashscore/v2/h2h"
        
        params = {
            'player1': player1,
            'player2': player2
        }
        
        response = requests.get(url, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()
        
        h2h_data = response.json()
        
        return jsonify({
            'success': True,
            'h2h': h2h_data
        })
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar H2H: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao buscar H2H: {str(e)}'
        }), 500

@app.route('/api/player-history/<player_name>')
def get_player_history(player_name):
    """Buscar histórico de partidas de um jogador"""
    try:
        # Endpoint para buscar histórico do jogador
        url = f"{BASE_URL}/api/flashscore/v2/player/{player_name}/matches"
        
        params = {
            'limit': 15
        }
        
        response = requests.get(url, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()
        
        history_data = response.json()
        
        return jsonify({
            'success': True,
            'player': player_name,
            'history': history_data
        })
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar histórico: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao buscar histórico: {str(e)}'
        }), 500

def process_match(match, tournament_name, tournament_id):
    """Processa dados de uma partida"""
    try:
        # Extrair dados da partida
        home_team = match.get('home_team', {})
        away_team = match.get('away_team', {})
        match_status = match.get('match_status', {})
        scores = match.get('scores', {})
        
        # Verificar se a partida está ao vivo
        if not match_status.get('is_in_progress', False):
            return None
        
        return {
            'id': match.get('match_id'),
            'player1': home_team.get('name', 'Desconhecido'),
            'player2': away_team.get('name', 'Desconhecido'),
            'player1_id': home_team.get('team_id'),
            'player2_id': away_team.get('team_id'),
            'score_player1': scores.get('home', 0),
            'score_player2': scores.get('away', 0),
            'status': match_status.get('live_time', 'Em progresso'),
            'tournament': tournament_name,
            'tournament_id': tournament_id,
            'is_in_progress': match_status.get('is_in_progress', False),
            'is_started': match_status.get('is_started', False),
            'timestamp': match.get('timestamp'),
            'updated_at': datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Erro ao processar partida: {str(e)}")
        return None

if __name__ == '__main__':
    # Executar em 0.0.0.0 para aceitar conexões externas
    app.run(host='0.0.0.0', port=5000, debug=False)
