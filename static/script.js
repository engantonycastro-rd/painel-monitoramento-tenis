// Estado da aplicação
let allMatches = [];
let updateInterval = null;

// Elementos do DOM
const liveMatchesContainer = document.getElementById('live-matches');
const loadingContainer = document.getElementById('loading');
const noMatchesContainer = document.getElementById('no-matches');
const statusText = document.getElementById('status-text');
const lastUpdateTime = document.getElementById('last-update-time');
const btnRefresh = document.getElementById('btn-refresh');

// Event listeners
btnRefresh.addEventListener('click', () => {
    fetchLiveMatches();
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    fetchLiveMatches();
    // Atualizar a cada 60 segundos
    updateInterval = setInterval(fetchLiveMatches, 60000);
});

// Função principal para buscar partidas ao vivo
async function fetchLiveMatches() {
    try {
        showLoading(true);
        statusText.textContent = 'Buscando partidas ao vivo...';

        const response = await fetch('/api/live-matches');

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Erro desconhecido');
        }
        
        const liveMatches = data.matches || [];
        
        if (liveMatches.length === 0) {
            showNoMatches();
            statusText.textContent = 'Nenhuma partida ao vivo';
            return;
        }

        allMatches = liveMatches;
        
        // Enriquecer dados com notícias e histórico
        await enrichMatchesData(liveMatches);
        
        // Renderizar cartões
        renderMatches(liveMatches);
        
        statusText.textContent = 'Online';
        updateLastUpdateTime();
        showLoading(false);

    } catch (error) {
        console.error('Erro ao buscar partidas:', error);
        statusText.textContent = 'Erro ao conectar';
        showLoading(false);
        showNoMatches();
    }
}

// Enriquecer dados das partidas com notícias e histórico
async function enrichMatchesData(matches) {
    for (let match of matches) {
        try {
            // Buscar histórico para cada jogador
            match.player1_history = await fetchPlayerHistory(match.player1);
            match.player2_history = await fetchPlayerHistory(match.player2);
            
            // Buscar H2H
            match.h2h = await fetchH2H(match.player1, match.player2);
            
            // Buscar estatísticas ao vivo
            match.live_stats = await fetchLiveStats(match.id);
            
            // Simular alertas de lesão (em produção, seria baseado em notícias reais)
            match.player1_injury_alert = false;
            match.player2_injury_alert = false;
        } catch (error) {
            console.warn('Erro ao enriquecer dados da partida:', error);
        }
    }
}

// Buscar histórico de partidas
async function fetchPlayerHistory(playerName) {
    try {
        const response = await fetch(`/api/player-history/${encodeURIComponent(playerName)}`);

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.history || [];
    } catch (error) {
        console.warn('Erro ao buscar histórico:', error);
        return [];
    }
}

// Buscar H2H
async function fetchH2H(player1, player2) {
    try {
        const response = await fetch(`/api/h2h/${encodeURIComponent(player1)}/${encodeURIComponent(player2)}`);

        if (!response.ok) {
            return { player1_wins: 0, player2_wins: 0 };
        }

        const data = await response.json();
        return data.h2h || { player1_wins: 0, player2_wins: 0 };
    } catch (error) {
        console.warn('Erro ao buscar H2H:', error);
        return { player1_wins: 0, player2_wins: 0 };
    }
}

// Buscar estatísticas ao vivo
async function fetchLiveStats(matchId) {
    try {
        const response = await fetch(`/api/match-stats/${matchId}`);

        if (!response.ok) {
            return {};
        }

        const data = await response.json();
        return data.stats || {};
    } catch (error) {
        console.warn('Erro ao buscar estatísticas:', error);
        return {};
    }
}

// Renderizar cartões das partidas
function renderMatches(matches) {
    liveMatchesContainer.innerHTML = '';
    
    matches.forEach((match, index) => {
        const card = createMatchCard(match, index);
        liveMatchesContainer.appendChild(card);
    });
}

// Criar cartão de partida
function createMatchCard(match, index) {
    const card = document.createElement('div');
    card.className = 'match-card';
    
    const player1InjuryClass = match.player1_injury_alert ? 'injury-alert' : '';
    const player2InjuryClass = match.player2_injury_alert ? 'injury-alert' : '';
    
    const player1InjuryIcon = match.player1_injury_alert ? '❗ ' : '';
    const player2InjuryIcon = match.player2_injury_alert ? '❗ ' : '';
    
    const score = match.score || '0-0';
    const sets = match.sets || [];
    
    card.innerHTML = `
        <div class="match-header">
            <div class="tournament-name">${match.tournament || 'Torneio'}</div>
            <div class="live-badge">🔴 AO VIVO</div>
        </div>
        
        <div class="match-body">
            <div class="players">
                <div class="player-row">
                    <div class="player-info">
                        <div class="player-name ${player1InjuryClass}">
                            ${player1InjuryIcon}${match.player1 || 'Jogador 1'}
                        </div>
                    </div>
                    <div class="player-score">${sets[0] || 0}</div>
                </div>
                
                <div class="player-row">
                    <div class="player-info">
                        <div class="player-name ${player2InjuryClass}">
                            ${player2InjuryIcon}${match.player2 || 'Jogador 2'}
                        </div>
                    </div>
                    <div class="player-score">${sets[1] || 0}</div>
                </div>
            </div>
            
            <div class="match-score">
                Set ${match.current_set || 1} | Game ${match.current_game || 0}
            </div>
            
            <div class="insight-tags">
                ${match.player1_injury_alert ? '<span class="insight-tag danger">⚠️ Possível Lesão</span>' : ''}
                ${match.player2_injury_alert ? '<span class="insight-tag danger">⚠️ Possível Lesão</span>' : ''}
                <span class="insight-tag">📊 Clique para detalhes</span>
            </div>
        </div>
        
        <div class="details" id="details-${index}">
            <div class="details-section">
                <h4>📈 Últimas 15 Partidas - ${match.player1}</h4>
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Resultado</th>
                            <th>Adversário</th>
                            <th>Piso</th>
                            <th>Torneio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${match.player1_history && match.player1_history.length > 0 ? 
                            match.player1_history.slice(0, 5).map(h => `
                            <tr>
                                <td class="${h.result === 'W' ? 'win' : 'loss'}">
                                    ${h.result === 'W' ? '✓ Vitória' : '✗ Derrota'}
                                </td>
                                <td>${h.opponent || '-'}</td>
                                <td>${h.surface || '-'}</td>
                                <td>${h.tournament || '-'}</td>
                            </tr>
                        `).join('')
                        : '<tr><td colspan="4">Sem dados disponíveis</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
            
            <div class="details-section">
                <h4>📈 Últimas 15 Partidas - ${match.player2}</h4>
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Resultado</th>
                            <th>Adversário</th>
                            <th>Piso</th>
                            <th>Torneio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${match.player2_history && match.player2_history.length > 0 ? 
                            match.player2_history.slice(0, 5).map(h => `
                            <tr>
                                <td class="${h.result === 'W' ? 'win' : 'loss'}">
                                    ${h.result === 'W' ? '✓ Vitória' : '✗ Derrota'}
                                </td>
                                <td>${h.opponent || '-'}</td>
                                <td>${h.surface || '-'}</td>
                                <td>${h.tournament || '-'}</td>
                            </tr>
                        `).join('')
                        : '<tr><td colspan="4">Sem dados disponíveis</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
            
            <div class="details-section">
                <h4>🤝 Confronto Direto (H2H)</h4>
                <table class="stats-table">
                    <tr>
                        <td><strong>${match.player1}</strong></td>
                        <td class="win">${match.h2h?.player1_wins || 0} vitórias</td>
                    </tr>
                    <tr>
                        <td><strong>${match.player2}</strong></td>
                        <td class="win">${match.h2h?.player2_wins || 0} vitórias</td>
                    </tr>
                </table>
            </div>
            
            <div class="details-section">
                <h4>⚡ Estatísticas Ao Vivo</h4>
                <table class="stats-table">
                    <tr>
                        <td><strong>Aces</strong></td>
                        <td>${match.live_stats?.aces || '-'}</td>
                    </tr>
                    <tr>
                        <td><strong>Duplas Faltas</strong></td>
                        <td>${match.live_stats?.double_faults || '-'}</td>
                    </tr>
                    <tr>
                        <td><strong>1º Serviço %</strong></td>
                        <td>${match.live_stats?.first_serve_percentage || '-'}</td>
                    </tr>
                    <tr>
                        <td><strong>Break Points</strong></td>
                        <td>${match.live_stats?.break_points || '-'}</td>
                    </tr>
                </table>
            </div>
        </div>
    `;
    
    // Adicionar event listener para expandir detalhes
    card.addEventListener('click', () => {
        const details = card.querySelector(`#details-${index}`);
        details.classList.toggle('active');
    });
    
    return card;
}

// Mostrar/ocultar loading
function showLoading(show) {
    loadingContainer.style.display = show ? 'flex' : 'none';
    liveMatchesContainer.style.display = show ? 'none' : 'grid';
    noMatchesContainer.style.display = 'none';
}

// Mostrar mensagem de nenhuma partida
function showNoMatches() {
    loadingContainer.style.display = 'none';
    liveMatchesContainer.style.display = 'none';
    noMatchesContainer.style.display = 'block';
}

// Atualizar hora da última atualização
function updateLastUpdateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    lastUpdateTime.textContent = `${hours}:${minutes}`;
}

// Cleanup ao sair
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
