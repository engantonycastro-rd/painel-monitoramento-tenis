// Estado da aplicação
let allMatches = [];
let updateInterval = null;
let currentModalMatch = null;

// Elementos do DOM
const liveMatchesContainer = document.getElementById('live-matches');
const loadingContainer = document.getElementById('loading');
const noMatchesContainer = document.getElementById('no-matches');
const statusText = document.getElementById('status-text');
const lastUpdateTime = document.getElementById('last-update-time');
const btnRefresh = document.getElementById('btn-refresh');
const detailsModal = document.getElementById('details-modal');
const modalClose = document.querySelector('.modal-close');
const modalOverlay = document.querySelector('.modal-overlay');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');

// Event listeners
btnRefresh.addEventListener('click', () => {
    fetchLiveMatches();
});

modalClose.addEventListener('click', () => {
    closeModal();
});

modalOverlay.addEventListener('click', () => {
    closeModal();
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterMatches();
    });
});

searchInput.addEventListener('input', filterMatches);

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    fetchLiveMatches();
    updateInterval = setInterval(fetchLiveMatches, 60000);
});

// Buscar partidas ao vivo
async function fetchLiveMatches() {
    try {
        statusText.textContent = 'Atualizando...';

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
        
        renderMatches(liveMatches);
        
        statusText.textContent = 'Online';
        updateLastUpdateTime();
        showMatches();

    } catch (error) {
        console.error('Erro ao buscar partidas:', error);
        statusText.textContent = 'Erro ao conectar';
        showNoMatches();
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
    `;
    
    card.addEventListener('click', () => {
        openModal(match);
    });
    
    return card;
}

// Abrir modal com detalhes
async function openModal(match) {
    currentModalMatch = match;
    
    document.getElementById('modal-title').textContent = `${match.player1} vs ${match.player2}`;
    document.getElementById('modal-tournament').textContent = match.tournament || 'Torneio';
    
    detailsModal.classList.add('active');
    
    // Carregar dados das abas
    await loadTabStats(match.id);
    await loadTabH2H(match.id);
    await loadTabHistory(match.id);
    
    // Ativar primeira aba
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.addEventListener('click', handleTabClick);
    });
    document.querySelector('.tab-btn').classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('stats-tab').classList.add('active');
}

// Fechar modal
function closeModal() {
    detailsModal.classList.remove('active');
    currentModalMatch = null;
}

// Handle tab click
function handleTabClick(e) {
    const tabName = e.target.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    e.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Carregar estatísticas
async function loadTabStats(matchId) {
    const statsContent = document.getElementById('stats-content');
    const statsLoading = document.getElementById('stats-loading');
    
    try {
        const response = await fetch(`/api/match-stats/${matchId}`);
        const data = await response.json();
        
        statsLoading.style.display = 'none';
        
        if (data.stats && data.stats.match) {
            let html = '<table class="stats-table"><thead><tr><th>Estatística</th><th>Jogador 1</th><th>Jogador 2</th></tr></thead><tbody>';
            
            data.stats.match.forEach(stat => {
                html += `<tr>
                    <td><strong>${stat.name || '-'}</strong></td>
                    <td>${stat.home_team || '-'}</td>
                    <td>${stat.away_team || '-'}</td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            statsContent.innerHTML = html;
        } else {
            statsContent.innerHTML = '<p>Sem dados de estatísticas disponíveis</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        statsLoading.style.display = 'none';
        statsContent.innerHTML = '<p>Erro ao carregar estatísticas</p>';
    }
}

// Carregar H2H
async function loadTabH2H(matchId) {
    const h2hContent = document.getElementById('h2h-content');
    const h2hLoading = document.getElementById('h2h-loading');
    
    try {
        const response = await fetch(`/api/match-h2h/${matchId}`);
        const data = await response.json();
        
        h2hLoading.style.display = 'none';
        
        if (data.h2h && data.h2h.length > 0) {
            let html = '<table class="stats-table"><thead><tr><th>Informação</th><th>Valor</th></tr></thead><tbody>';
            
            data.h2h.forEach(item => {
                html += `<tr><td>${item.name || '-'}</td><td>${item.value || '-'}</td></tr>`;
            });
            
            html += '</tbody></table>';
            h2hContent.innerHTML = html;
        } else {
            h2hContent.innerHTML = '<p>Sem dados de H2H disponíveis</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar H2H:', error);
        h2hLoading.style.display = 'none';
        h2hContent.innerHTML = '<p>Erro ao carregar H2H</p>';
    }
}

// Carregar histórico
async function loadTabHistory(matchId) {
    const historyContent = document.getElementById('history-content');
    const historyLoading = document.getElementById('history-loading');
    
    try {
        const response = await fetch(`/api/match-history/${matchId}`);
        const data = await response.json();
        
        historyLoading.style.display = 'none';
        
        if (data.history && data.history.length > 0) {
            let html = '<table class="stats-table"><thead><tr><th>Set</th><th>Descrição</th><th>Pontos</th></tr></thead><tbody>';
            
            data.history.forEach((set, idx) => {
                const pointsCount = set.points ? set.points.length : 0;
                html += `<tr>
                    <td>${set.name || `Set ${idx + 1}`}</td>
                    <td>${set.description || '-'}</td>
                    <td>${pointsCount} pontos</td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            historyContent.innerHTML = html;
        } else {
            historyContent.innerHTML = '<p>Sem dados de histórico disponíveis</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        historyLoading.style.display = 'none';
        historyContent.innerHTML = '<p>Erro ao carregar histórico</p>';
    }
}

// Filtrar partidas
function filterMatches() {
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    const searchTerm = searchInput.value.toLowerCase();
    
    let filtered = allMatches;
    
    if (activeFilter !== 'all') {
        filtered = filtered.filter(match => {
            const tournament = (match.tournament || '').toLowerCase();
            return tournament.includes(activeFilter);
        });
    }
    
    if (searchTerm) {
        filtered = filtered.filter(match => {
            const player1 = (match.player1 || '').toLowerCase();
            const player2 = (match.player2 || '').toLowerCase();
            const tournament = (match.tournament || '').toLowerCase();
            
            return player1.includes(searchTerm) || player2.includes(searchTerm) || tournament.includes(searchTerm);
        });
    }
    
    renderMatches(filtered);
}

// Mostrar/ocultar estados
function showMatches() {
    loadingContainer.style.display = 'none';
    liveMatchesContainer.style.display = 'grid';
    noMatchesContainer.style.display = 'none';
}

function showNoMatches() {
    loadingContainer.style.display = 'none';
    liveMatchesContainer.style.display = 'none';
    noMatchesContainer.style.display = 'flex';
}

// Atualizar hora
function updateLastUpdateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    lastUpdateTime.textContent = `${hours}:${minutes}`;
}

// Cleanup
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
