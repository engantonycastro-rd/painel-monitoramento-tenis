// Variáveis globais
let currentModalMatch = null;

// Elementos do DOM
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const liveMatchesContainer = document.getElementById('live-matches');
const loadingContainer = document.getElementById('loading');
const noMatchesContainer = document.getElementById('no-matches');
const detailsModal = document.getElementById('details-modal');
const modalOverlay = document.querySelector('.modal-overlay');
const modalClose = document.querySelector('.modal-close');
const tabButtons = document.querySelectorAll('.tab-btn');

// Event listeners
searchInput.addEventListener('input', filterMatches);
filterButtons.forEach(btn => btn.addEventListener('click', handleFilterClick));
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
tabButtons.forEach(btn => btn.addEventListener('click', handleTabClick));

// Carregar partidas ao vivo
async function loadLiveMatches() {
    try {
        loadingContainer.style.display = 'flex';
        noMatchesContainer.style.display = 'none';
        liveMatchesContainer.innerHTML = '';
        
        const response = await fetch('/api/live-matches');
        const data = await response.json();
        
        loadingContainer.style.display = 'none';
        
        if (data.matches && data.matches.length > 0) {
            data.matches.forEach(match => {
                const card = createMatchCard(match);
                liveMatchesContainer.appendChild(card);
            });
            
            // Atualizar status
            updateStatus('Online', true);
        } else {
            noMatchesContainer.style.display = 'flex';
            updateStatus('Sem partidas ao vivo', false);
        }
        
        // Atualizar hora da última atualização
        updateLastUpdateTime();
    } catch (error) {
        console.error('Erro ao carregar partidas:', error);
        loadingContainer.style.display = 'none';
        noMatchesContainer.style.display = 'flex';
        updateStatus('Erro na conexão', false);
    }
}

// Criar card de partida
function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    
    const insightTags = match.insights ? match.insights.map(insight => 
        `<span class="insight-tag ${insight.type === 'danger' ? 'danger' : ''}">${insight.text}</span>`
    ).join('') : '';
    
    // Mapear nomes de propriedades do backend
    const tournament = match.tournament || 'Torneio';
    const player1 = match.player1 || 'Jogador 1';
    const player2 = match.player2 || 'Jogador 2';
    const score1 = match.score_player1 !== undefined ? match.score_player1 : 0;
    const score2 = match.score_player2 !== undefined ? match.score_player2 : 0;
    const status = match.status || 'Em progresso';
    
    card.innerHTML = `
        <div class="match-header">
            <span class="tournament-name">${tournament.substring(0, 40)}...</span>
            <span class="live-badge">🔴 AO VIVO</span>
        </div>
        <div class="match-body">
            <div class="players">
                <div class="player-row">
                    <span class="player-name">${player1}</span>
                    <span class="player-score">${score1}</span>
                </div>
                <div class="player-row">
                    <span class="player-name">${player2}</span>
                    <span class="player-score">${score2}</span>
                </div>
            </div>
            <div class="match-score">${status}</div>
            ${insightTags ? `<div class="insight-tags">${insightTags}</div>` : ''}
        </div>
    `;
    
    card.addEventListener('click', () => openModal(match));
    return card;
}

// Abrir modal
async function openModal(match) {
    currentModalMatch = match;
    detailsModal.classList.add('active');
    
    document.getElementById('modal-title').textContent = `${match.player1} vs ${match.player2}`;
    document.getElementById('modal-tournament').textContent = match.tournament || 'Torneio';
    
    // Carregar dados das abas
    const matchId = match.id || match.match_id;
    await loadTabStats(matchId);
    await loadTabH2H(matchId);
    await loadTabHistory(matchId);
    await loadTabNews(match.player1, match.player2);
}

// Fechar modal
function closeModal() {
    detailsModal.classList.remove('active');
    currentModalMatch = null;
}

// Lidar com clique em abas
function handleTabClick(e) {
    const tabName = e.target.dataset.tab;
    
    // Remover ativa de todos os botões e conteúdos
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Adicionar ativa ao botão e conteúdo clicado
    e.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Carregar Estatísticas
async function loadTabStats(matchId) {
    const statsContent = document.getElementById('stats-content');
    const statsLoading = document.getElementById('stats-loading');
    
    try {
        const response = await fetch(`/api/match-stats/${matchId}`);
        const data = await response.json();
        
        statsLoading.style.display = 'none';
        
        if (data.stats) {
            let html = '<table class="stats-table"><thead><tr><th>Estatística</th><th>Jogador 1</th><th>Jogador 2</th></tr></thead><tbody>';
            
            Object.entries(data.stats).forEach(([key, value]) => {
                const player1Val = value.player1 || 0;
                const player2Val = value.player2 || 0;
                html += `<tr><td>${key}</td><td>${player1Val}</td><td>${player2Val}</td></tr>`;
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

// Carregar Histórico
async function loadTabHistory(matchId) {
    const historyContent = document.getElementById('history-content');
    const historyLoading = document.getElementById('history-loading');
    
    try {
        const response = await fetch(`/api/match-history/${matchId}`);
        const data = await response.json();
        
        historyLoading.style.display = 'none';
        
        if (data.history && data.history.length > 0) {
            let html = '<div class="history-list">';
            
            data.history.forEach(match => {
                html += `<div class="history-item">
                    <div class="history-tournament">${match.tournament}</div>
                    <div class="history-result">${match.result}</div>
                    <div class="history-date">${match.date}</div>
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

// Carregar Notícias
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
                <div class="player-news-header">
                    <h3>${player1}</h3>
                    ${news1.has_injury_alert ? '<span class="injury-alert-badge">⚠️ ALERTA</span>' : ''}
                </div>
                ${news1.has_injury_alert ? '<div class="injury-warning">⚠️ ALERTA DE LESÃO - Fique atento a possíveis problemas físicos</div>' : ''}
                <div class="news-list">`;
            
            news1.news.forEach((article, index) => {
                const hasUrl = article.url && article.url.length > 0;
                const publishedDate = article.published_at ? new Date(article.published_at).toLocaleDateString('pt-BR') : 'Data desconhecida';
                
                html += `<div class="news-item" ${index === 0 ? 'style="border-top: none;"' : ''}>
                    <div class="news-header">
                        <h4>${article.title}</h4>
                        <span class="news-source">${article.source || 'Fonte'}</span>
                    </div>
                    <p class="news-description">${article.description || 'Sem descrição disponível'}</p>
                    <div class="news-footer">
                        <small class="news-date">📅 ${publishedDate}</small>
                        ${hasUrl ? `<a href="${article.url}" target="_blank" class="news-link">Ler mais →</a>` : ''}
                    </div>
                </div>`;
            });
            
            html += '</div></div>';
        }
        
        // Notícias do jogador 2
        if (news2.news && news2.news.length > 0) {
            html += `<div class="player-news">
                <div class="player-news-header">
                    <h3>${player2}</h3>
                    ${news2.has_injury_alert ? '<span class="injury-alert-badge">⚠️ ALERTA</span>' : ''}
                </div>
                ${news2.has_injury_alert ? '<div class="injury-warning">⚠️ ALERTA DE LESÃO - Fique atento a possíveis problemas físicos</div>' : ''}
                <div class="news-list">`;
            
            news2.news.forEach((article, index) => {
                const hasUrl = article.url && article.url.length > 0;
                const publishedDate = article.published_at ? new Date(article.published_at).toLocaleDateString('pt-BR') : 'Data desconhecida';
                
                html += `<div class="news-item" ${index === 0 ? 'style="border-top: none;"' : ''}>
                    <div class="news-header">
                        <h4>${article.title}</h4>
                        <span class="news-source">${article.source || 'Fonte'}</span>
                    </div>
                    <p class="news-description">${article.description || 'Sem descrição disponível'}</p>
                    <div class="news-footer">
                        <small class="news-date">📅 ${publishedDate}</small>
                        ${hasUrl ? `<a href="${article.url}" target="_blank" class="news-link">Ler mais →</a>` : ''}
                    </div>
                </div>`;
            });
            
            html += '</div></div>';
        }
        
        if ((news1.news && news1.news.length > 0) || (news2.news && news2.news.length > 0)) {
            html += '</div>';
            newsContent.innerHTML = html;
        } else {
            newsContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);"><p>📰 Sem notícias recentes disponíveis</p></div>';
        }
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
        newsLoading.style.display = 'none';
        newsContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);"><p>❌ Erro ao carregar notícias</p></div>';
    }
}

// Filtrar partidas
function filterMatches() {
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    const searchTerm = searchInput.value.toLowerCase();
    
    const cards = document.querySelectorAll('.match-card');
    cards.forEach(card => {
        const tournament = card.querySelector('.tournament-name').textContent.toLowerCase();
        const players = card.querySelector('.players').textContent.toLowerCase();
        
        let matchesFilter = true;
        if (activeFilter !== 'all') {
            matchesFilter = tournament.includes(activeFilter);
        }
        
        const matchesSearch = tournament.includes(searchTerm) || players.includes(searchTerm);
        
        card.style.display = (matchesFilter && matchesSearch) ? '' : 'none';
    });
}

// Lidar com clique em filtro
function handleFilterClick(e) {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    filterMatches();
}

// Atualizar status
function updateStatus(text, isOnline) {
    const statusText = document.getElementById('status-text');
    const statusDot = document.querySelector('.status-dot');
    
    statusText.textContent = text;
    statusDot.style.background = isOnline ? 'var(--success-color)' : 'var(--danger-color)';
}

// Atualizar hora da última atualização
function updateLastUpdateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('last-update-time').textContent = `${hours}:${minutes}`;
}

// Botão de atualizar
document.getElementById('btn-refresh').addEventListener('click', loadLiveMatches);

// Carregar partidas ao iniciar
loadLiveMatches();

// Atualizar a cada 30 segundos
setInterval(loadLiveMatches, 30000);
