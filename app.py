from flask import Flask, render_template, jsonify
import requests
import os

app = Flask(__name__)

# Configurar a pasta de templates
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Configuração da API
RAPIDAPI_KEY = 'a6a64b91b0mshf6c3de3afc4302dp1142e8jsnf6a4eea01df4'
RAPIDAPI_HOST = 'tennis-api5.p.rapidapi.com'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'Painel de Monitoramento de Tênis está online'})

@app.route('/api/live-matches')
def get_live_matches():
    """Buscar partidas ao vivo da API RapidAPI"""
    try:
        url = "https://tennis-api5.p.rapidapi.com/get-match-events"
        
        headers = {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Filtrar apenas partidas ao vivo
        live_matches = [match for match in data if match.get('status') in ['LIVE', 'IN_PROGRESS']]
        
        return jsonify({
            'success': True,
            'matches': live_matches,
            'count': len(live_matches)
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

@app.route('/api/player-history/<player_name>')
def get_player_history(player_name):
    """Buscar histórico de partidas de um jogador"""
    try:
        url = "https://tennis-api5.p.rapidapi.com/get-player-matches"
        
        headers = {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST
        }
        
        params = {
            "name": player_name,
            "limit": 15
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        return jsonify({
            'success': True,
            'player': player_name,
            'history': data[:15] if isinstance(data, list) else []
        })
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar histórico de {player_name}: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao buscar histórico: {str(e)}'
        }), 500

@app.route('/api/h2h/<player1>/<player2>')
def get_h2h(player1, player2):
    """Buscar confronto direto entre dois jogadores"""
    try:
        url = "https://tennis-api5.p.rapidapi.com/get-h2h"
        
        headers = {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST
        }
        
        params = {
            "player1": player1,
            "player2": player2
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        return jsonify({
            'success': True,
            'player1': player1,
            'player2': player2,
            'h2h': data
        })
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar H2H: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao buscar H2H: {str(e)}'
        }), 500

@app.route('/api/match-stats/<match_id>')
def get_match_stats(match_id):
    """Buscar estatísticas ao vivo de uma partida"""
    try:
        url = "https://tennis-api5.p.rapidapi.com/get-match-stats"
        
        headers = {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST
        }
        
        params = {
            "id": match_id
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        return jsonify({
            'success': True,
            'match_id': match_id,
            'stats': data
        })
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar estatísticas: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao buscar estatísticas: {str(e)}'
        }), 500

if __name__ == '__main__':
    # Executar em 0.0.0.0 para aceitar conexões externas
    app.run(host='0.0.0.0', port=5000, debug=False)
