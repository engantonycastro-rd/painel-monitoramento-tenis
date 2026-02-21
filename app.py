from flask import Flask, render_template, jsonify
import requests
import os
from datetime import datetime
import json

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
        url = f"{BASE_URL}/api/flashscore/v2/matches/details"
        
        params = {'match_id': match_id}
        
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

@app.route('/api/match-stats/<match_id>')
def get_match_stats(match_id):
    """Buscar estatísticas ao vivo de uma partida"""
    try:
        # Endpoint para buscar estatísticas da partida
        url = f"{BASE_URL}/api/flashscore/v2/matches/match/stats"
        
        params = {'match_id': match_id}
        
        response = requests.get(url, headers=HEADERS, params=params, timeout=10)
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

@app.route('/api/match-history/<match_id>')
def get_match_history(match_id):
    """Buscar histórico ponto a ponto de uma partida"""
    try:
        # Endpoint para buscar histórico da partida
        url = f"{BASE_URL}/api/flashscore/v2/matches/match/match-history"
        
        params = {'match_id': match_id}
        
        response = requests.get(url, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()
        
        history_data = response.json()
        
        return jsonify({
            'success': True,
            'history': history_data
        })
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar histórico: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao buscar histórico: {str(e)}'
        }), 500

@app.route('/api/match-h2h/<match_id>')
def get_match_h2h(match_id):
    """Buscar confronto direto entre dois jogadores"""
    try:
        # Endpoint para buscar H2H
        url = f"{BASE_URL}/api/flashscore/v2/matches/h2h"
        
        params = {'match_id': match_id}
        
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

@app.route('/api/player-news/<player_name>')
def get_player_news(player_name):
    """Buscar notícias sobre um jogador (lesões, problemas físicos)"""
    try:
        # Usar a API de notícias do Google News via RapidAPI
        url = "https://google-news-api.p.rapidapi.com/v1/search"
        
        # Buscar notícias sobre lesões do jogador
        query = f"{player_name} tennis injury lesão"
        
        headers = {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'google-news-api.p.rapidapi.com'
        }
        
        params = {
            'q': query,
            'lr': 'pt-BR'
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            articles = data.get('articles', [])
            
            # Filtrar apenas notícias relevantes (últimas 24 horas)
            news_items = []
            for article in articles[:5]:  # Pega os 5 primeiros
                news_items.append({
                    'title': article.get('title', ''),
                    'description': article.get('description', ''),
                    'url': article.get('url', ''),
                    'source': article.get('source', ''),
                    'published_at': article.get('published_at', '')
                })
            
            # Verificar se há menção a lesão
            has_injury_alert = any('injury' in str(item).lower() or 'lesão' in str(item).lower() or 'machucado' in str(item).lower() for item in news_items)
            
            return jsonify({
                'success': True,
                'player': player_name,
                'news': news_items,
                'has_injury_alert': has_injury_alert
            })
        else:
            return jsonify({
                'success': True,
                'player': player_name,
                'news': [],
                'has_injury_alert': False
            })
    
    except Exception as e:
        print(f"Erro ao buscar notícias: {str(e)}")
        return jsonify({
            'success': True,
            'player': player_name,
            'news': [],
            'has_injury_alert': False
        })

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
