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

// Buscar estatísticas ao vivo de uma partida
async function fetchMatchStats(matchId) {
    try {
        const response = await fetch(`/api/match-stats/${matchId}`);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.stats || null;
    } catch (error) {
        console.warn('Erro ao buscar estatísticas:', error);
        return null;
    }
}

// Buscar H2H
async function fetchMatchH2H(matchId) {
    try {
        const response = await fetch(`/api/match-h2h/${matchId}`);

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.h2h || [];
    } catch (error) {
        console.warn('Erro ao buscar H2H:', error);
        return [];
    }
}

// Buscar histórico de partida
async function fetchMatchHistory(matchId) {
    try {
        const response = await fetch(`/api/match-history/${matchId}`);

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

// Buscar detalhes da partida
async function fetchMatchDetails(matchId) {
    try {
        const response = await fetch(`/api/match-details/${matchId}`);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.match || null;
    } catch (error) {
        console.warn('Erro ao buscar detalhes:', error);
        return null;
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
    
    const score = match.score || '0-0';
    
    card.innerHTML = `
        <div class="match-header">
            <div class="tournament-name">${match.tournament || 'Torneio'}</div>
            <div class="live-badge">🔴 AO VIVO</div>
        </div>
        
        <div class="match-body">
            <div class="players">
                <div class="player-row">
                    <div class="player-info">
                        <div class="player-name">
                            ${match.player1 || 'Jogador 1'}
                        </div>
                    </div>
                    <div class="player-score">${match.score_player1 || 0}</div>
                </div>
                
                <div class="player-row">
                    <div class="player-info">
                        <div class="player-name">
                            ${match.player2 || 'Jogador 2'}
                        </div>
                    </div>
                    <div class="player-score">${match.score_player2 || 0}</div>
                </div>
            </div>
            
            <div class="match-score">
                ${match.status || 'Em progresso'}
            </div>
            
            <div class="insight-tags">
                <span class="insight-tag">📊 Clique para detalhes</span>
            </div>
        </div>
        
        <div class="details" id="details-${index}">
            <div class="loading-details">Carregando detalhes...</div>
        </div>
    `;
    
    // Adicionar event listener para expandir detalhes
    card.addEventListener('click', async () => {
        const details = card.querySelector(`#details-${index}`);
        
        if (details.classList.contains('active')) {
            // Fechar
            details.classList.remove('active');
        } else {
            // Abrir e carregar dados
            details.classList.add('active');
            
            // Se já tem dados, não recarregar
            if (details.querySelector('.details-content')) {
                return;
            }
            
            // Carregar dados
            await loadMatchDetails(match.id, details);
        }
    });
    
    return card;
}

// Carregar detalhes da partida
async function loadMatchDetails(matchId, detailsElement) {
    try {
        // Buscar dados em paralelo
        const [stats, h2h, history, details] = await Promise.all([
            fetchMatchStats(matchId),
            fetchMatchH2H(matchId),
            fetchMatchHistory(matchId),
            fetchMatchDetails(matchId)
        ]);
        
        // Renderizar conteúdo
        let html = '<div class="details-content">';
        
        // Seção de Estatísticas
        if (stats && stats.match) {
            html += '<div class="details-section">';
            html += '<h4>⚡ Estatísticas Ao Vivo</h4>';
            html += '<table class="stats-table">';
            html += '<thead><tr><th>Estatística</th><th>Jogador 1</th><th>Jogador 2</th></tr></thead>';
            html += '<tbody>';
            
            stats.match.forEach(stat => {
                html += `<tr>
                    <td><strong>${stat.name}</strong></td>
                    <td>${stat.home_team || '-'}</td>
                    <td>${stat.away_team || '-'}</td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
        }
        
        // Seção de H2H
        if (h2h && h2h.length > 0) {
            html += '<div class="details-section">';
            html += '<h4>🤝 Confronto Direto (H2H)</h4>';
            html += '<table class="stats-table">';
            html += '<thead><tr><th>Informação</th><th>Valor</th></tr></thead>';
            html += '<tbody>';
            
            h2h.forEach(item => {
                html += `<tr><td>${item.name || '-'}</td><td>${item.value || '-'}</td></tr>`;
            });
            
            html += '</tbody></table></div>';
        } else {
            html += '<div class="details-section"><h4>🤝 Confronto Direto (H2H)</h4><p>Sem dados disponíveis</p></div>';
        }
        
        // Seção de Histórico
        if (history && history.length > 0) {
            html += '<div class="details-section">';
            html += '<h4>📋 Histórico da Partida (Ponto a Ponto)</h4>';
            html += '<table class="stats-table">';
            html += '<thead><tr><th>Set</th><th>Descrição</th><th>Pontos</th></tr></thead>';
            html += '<tbody>';
            
            history.forEach((set, idx) => {
                const pointsCount = set.points ? set.points.length : 0;
                html += `<tr>
                    <td>${set.name || `Set ${idx + 1}`}</td>
                    <td>${set.description || '-'}</td>
                    <td>${pointsCount} pontos</td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
        }
        
        html += '</div>';
        
        // Limpar e inserir novo conteúdo
        detailsElement.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        detailsElement.innerHTML = '<div class="error-message">Erro ao carregar detalhes</div>';
    }
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
