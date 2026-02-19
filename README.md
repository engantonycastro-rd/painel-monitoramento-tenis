# 🎾 Painel de Monitoramento de Tênis - Análise de Oportunidades

Um sistema inteligente de monitoramento de partidas de tênis ao vivo, desenvolvido para auxiliar na análise de apostas esportivas.

## 📋 Funcionalidades

✅ **Partidas Ao Vivo** - Monitora partidas de tênis acontecendo em tempo real

✅ **Alertas de Lesão** - Identifica possíveis problemas físicos dos jogadores

✅ **Análise Histórica** - Últimas 15 partidas de cada jogador com informação de piso

✅ **Confronto Direto (H2H)** - Histórico de vitórias e derrotas entre jogadores

✅ **Estatísticas Ao Vivo** - Dados detalhados da partida (aces, duplas faltas, etc.)

✅ **Atualização Automática** - Dados se atualizam a cada 60 segundos

✅ **Interface Responsiva** - Funciona em qualquer dispositivo

## 🛠️ Tecnologias Utilizadas

- **Backend:** Flask (Python)
- **Frontend:** HTML5, CSS3, JavaScript
- **API:** RapidAPI - Ultimate Tennis API
- **Hospedagem:** Railway.app

## 📦 Instalação Local

### Pré-requisitos
- Python 3.8+
- pip
- Git

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/engantonycastro-rd/painel-monitoramento-tenis.git
cd painel-monitoramento-tenis
```

2. Crie um ambiente virtual:
```bash
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto:
```
RAPIDAPI_KEY=sua_chave_aqui
RAPIDAPI_HOST=tennis-api5.p.rapidapi.com
```

5. Execute a aplicação:
```bash
python app.py
```

6. Acesse em seu navegador:
```
http://localhost:5000
```

## 🚀 Deploy no Railway.app

1. Faça login no [Railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub"
4. Conecte seu repositório GitHub
5. Railway detectará automaticamente que é uma aplicação Flask
6. Configure as variáveis de ambiente:
   - `RAPIDAPI_KEY`: Sua chave da RapidAPI
   - `RAPIDAPI_HOST`: tennis-api5.p.rapidapi.com

## 📊 Estrutura do Projeto

```
painel-monitoramento-tenis/
├── app.py                 # Servidor Flask com endpoints
├── requirements.txt       # Dependências Python
├── Procfile              # Configuração para Railway
├── templates/
│   └── index.html        # Página principal
└── static/
    ├── style.css         # Estilos
    └── script.js         # Lógica do frontend
```

## 🔑 Variáveis de Ambiente

- `RAPIDAPI_KEY`: Chave de autenticação da RapidAPI
- `RAPIDAPI_HOST`: Host da API de Tênis (tennis-api5.p.rapidapi.com)
- `PORT`: Porta para executar a aplicação (padrão: 5000)

## 📝 Endpoints da API

- `GET /` - Página principal
- `GET /api/health` - Status da aplicação
- `GET /api/live-matches` - Partidas ao vivo
- `GET /api/player-history/<player_name>` - Histórico de um jogador
- `GET /api/h2h/<player1>/<player2>` - Confronto direto
- `GET /api/match-stats/<match_id>` - Estatísticas da partida

## 🤝 Contribuições

Sugestões de melhorias são bem-vindas! Entre em contato para propostas.

## 📄 Licença

Este projeto é de uso pessoal e educacional.

## 👤 Autor

Desenvolvido por **Manus AI** em colaboração com **engantonycastro-rd**

---

**Versão:** 1.0.0  
**Última atualização:** Fevereiro de 2026
