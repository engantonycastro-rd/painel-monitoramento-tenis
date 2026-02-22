'use strict';

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
        
        // Buscar notícias para cada jogador
        for (let match of liveMatches) {
            await fetchPlayerNews(match.player1);
            await fetchPlayerNews(match.player2);
        }
        
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

// Buscar notícias de um jogador
async function fetchPlayerNews(playerName) {
    try {
        const response = await fetch(`/api/player-news/${encodeURIComponent(playerName)}`);
        const data = await response.json();
        
        if (data.has_injury_alert) {
            // Armazenar alerta para exibir no cartão
            localStorage.setItem(`injury_${playerName}`, 'true');
        }
    } catch (error) {
        console.error('Erro ao buscar notícias:', error);
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
    
    const hasInjury1 = localStorage.getItem(`injury_${match.player1}`) === 'true';
    const hasInjury2 = localStorage.getItem(`injury_${match.player2}`) === 'true';
    
    const injuryAlert1 = hasInjury1 ? '<div class="injury-alert">⚠️ Alerta</div>' : '';
    const injuryAlert2 = hasInjury2 ? '<div class="injury-alert">⚠️ Alerta</div>' : '';
    
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
                        ${injuryAlert1}
                    </div>
                    <div class="player-score">${match.score_player1 || 0}</div>
                </div>
                
                <div class="player-row">
                    <div class="player-info">
                        <div class="player-name">
                            ${match.player2 || 'Jogador 2'}
                        </div>
                        ${injuryAlert2}
                    </div>
                    <div class="player-score">${match.score_player2 || 0}</div>
                </div>
            </div>
            
            <div class="match-score">
                <div class="set-info">${match.status || 'Em progresso'}</div>
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
    await loadTabNews(match.player1, match.player2);
    
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
        
        if (data.h2h && Array.isArray(data.h2h) && data.h2h.length > 0) {
            const currentMatch = currentModalMatch;
            const player1Name = currentMatch.player1.toLowerCase();
            const player2Name = currentMatch.player2.toLowerCase();
            
            // Filtrar apenas os confrontos diretos entre os dois jogadores
            const directMatches = data.h2h.filter(match => {
                if (!match.home_team || !match.away_team) return false;
                
                const homeName = match.home_team.name.toLowerCase();
                const awayName = match.away_team.name.toLowerCase();
                
                // Verificar se é um confronto direto entre os dois jogadores
                const isDirectMatch = (
                    (homeName.includes(player1Name.split(' ')[0]) && awayName.includes(player2Name.split(' ')[0])) ||
                    (homeName.includes(player2Name.split(' ')[0]) && awayName.includes(player1Name.split(' ')[0]))
                );
                
                return isDirectMatch;
            });
            
            if (directMatches.length === 0) {
                h2hContent.innerHTML = '<p>Estes jogadores nunca se enfrentaram</p>';
                return;
            }
            
            // Calcular vitórias de cada jogador
            let player1Wins = 0;
            let player2Wins = 0;
            
            directMatches.forEach(match => {
                const homeName = match.home_team.name.toLowerCase();
                const isPlayer1Home = homeName.includes(player1Name.split(' ')[0]);
                
                if (match.scores) {
                    const homeScore = parseInt(match.scores.home) || 0;
                    const awayScore = parseInt(match.scores.away) || 0;
                    
                    if (homeScore > awayScore) {
                        if (isPlayer1Home) player1Wins++;
                        else player2Wins++;
                    } else if (awayScore > homeScore) {
                        if (isPlayer1Home) player2Wins++;
                        else player1Wins++;
                    }
                }
            });
            
            let html = `
                <div class="h2h-summary">
                    <div class="h2h-stats">
                        <div class="stat-box">
                            <div class="stat-label">Confrontos Diretos</div>
                            <div class="stat-value">${directMatches.length}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">${currentMatch.player1}</div>
                            <div class="stat-value wins">${player1Wins}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">${currentMatch.player2}</div>
                            <div class="stat-value">${player2Wins}</div>
                        </div>
                    </div>
                </div>
                
                <div class="h2h-history">
                    <h4>Histórico de Confrontos Diretos</h4>
            `;
            
            // Mostrar todos os confrontos diretos (ordenados do mais recente)
            directMatches.forEach(match => {
                const date = new Date(match.timestamp * 1000).toLocaleDateString('pt-BR');
                const score = `${match.scores.home} - ${match.scores.away}`;
                const homeScore = parseInt(match.scores.home) || 0;
                const awayScore = parseInt(match.scores.away) || 0;
                const resultClass = homeScore > awayScore ? 'home-win' : awayScore > homeScore ? 'away-win' : 'draw';
                
                html += `
                    <div class="h2h-match ${resultClass}">
                        <div class="h2h-tournament">${match.tournament_name}</div>
                        <div class="h2h-players">
                            <span class="h2h-player">${match.home_team.name}</span>
                            <span class="h2h-score">${score}</span>
                            <span class="h2h-player">${match.away_team.name}</span>
                        </div>
                        <div class="h2h-date">${date}</div>
                    </div>
                `;
            });
            
            html += '</div>';
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
            let html = '<div class="history-list">';
            
            data.history.forEach(item => {
                html += `<div class="history-item">
                    <span class="history-point">${item.point || '-'}</span>
                    <span class="history-time">${item.time || '-'}</span>
                </div>`;
            });
            
            html += '</div>';
            historyContent.innerHTML = html;
        } else {
            historyContent.innerHTML = '<p>Sem histórico disponível</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        historyLoading.style.display = 'none';
        historyContent.innerHTML = '<p>Erro ao carregar histórico</p>';
    }
}

// Carregar notícias
async function loadTabNews(player1, player2) {
    const newsContent = document.getElementById('news-content');
    const newsLoading = document.getElementById('news-loading');
    
    try {
        // Buscar notícias de ambos os jogadores
        const news1 = await fetch(`/api/player-news/${encodeURIComponent(player1)}`).then(r => r.json());
        const news2 = await fetch(`/api/player-news/${encodeURIComponent(player2)}`).then(r => r.json());
        
        newsLoading.style.display = 'none';
        
        let html = '<div class="news-container">';
        
        // Notícias do jogador 1
        if (news1.news && news1.news.length > 0) {
            html += `<div class="player-news">
                <h3>${player1}</h3>
                ${news1.has_injury_alert ? '<div class="injury-warning">⚠️ ALERTA DE LESÃO</div>' : ''}
                <div class="news-list">`;
            
            news1.news.forEach(article => {
                html += `<div class="news-item">
                    <h4>${article.title}</h4>
                    <p>${article.description || 'Sem descrição'}</p>
                    <small>${article.source || 'Fonte desconhecida'}</small>
                </div>`;
            });
            
            html += '</div></div>';
        }
        
        // Notícias do jogador 2
        if (news2.news && news2.news.length > 0) {
            html += `<div class="player-news">
                <h3>${player2}</h3>
                ${news2.has_injury_alert ? '<div class="injury-warning">⚠️ ALERTA DE LESÃO</div>' : ''}
                <div class="news-list">`;
            
            news2.news.forEach(article => {
                html += `<div class="news-item">
                    <h4>${article.title}</h4>
                    <p>${article.description || 'Sem descrição'}</p>
                    <small>${article.source || 'Fonte desconhecida'}</small>
                </div>`;
            });
            
            html += '</div></div>';
        }
        
        if ((news1.news && news1.news.length > 0) || (news2.news && news2.news.length > 0)) {
            html += '</div>';
            newsContent.innerHTML = html;
        } else {
            newsContent.innerHTML = '<p>Sem notícias recentes disponíveis</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
        newsLoading.style.display = 'none';
        newsContent.innerHTML = '<p>Erro ao carregar notícias</p>';
    }
}

// Filtrar partidas
function filterMatches() {
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    const searchTerm = searchInput.value.toLowerCase();
    
    const filtered = allMatches.filter(match => {
        const matchesFilter = activeFilter === 'all' || 
                            (activeFilter === 'atp' && match.tournament.toLowerCase().includes('atp')) ||
                            (activeFilter === 'challenger' && match.tournament.toLowerCase().includes('challenger')) ||
                            (activeFilter === 'grandslam' && (match.tournament.toLowerCase().includes('australian') || 
                                                             match.tournament.toLowerCase().includes('french') ||
                                                             match.tournament.toLowerCase().includes('wimbledon') ||
                                                             match.tournament.toLowerCase().includes('us open')));
        
        const matchesSearch = match.player1.toLowerCase().includes(searchTerm) ||
                            match.player2.toLowerCase().includes(searchTerm) ||
                            match.tournament.toLowerCase().includes(searchTerm);
        
        return matchesFilter && matchesSearch;
    });
    
    renderMatches(filtered);
}

// Mostrar/ocultar elementos
function showMatches() {
    loadingContainer.style.display = 'none';
    noMatchesContainer.style.display = 'none';
    liveMatchesContainer.style.display = 'grid';
}

function showNoMatches() {
    loadingContainer.style.display = 'none';
    liveMatchesContainer.style.display = 'none';
    noMatchesContainer.style.display = 'flex';
}

// Atualizar hora
function updateLastUpdateTime() {
    const now = new Date();
    lastUpdateTime.textContent = now.toLocaleTimeString('pt-BR');
}
