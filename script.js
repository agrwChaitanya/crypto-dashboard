class CryptoTracker {
    constructor() {
        this.cryptos = [];
        this.filteredCryptos = [];
        this.currentFilter = 'all';
        this.favorites = JSON.parse(localStorage.getItem('cryptoFavorites')) || [];
        
        this.initializeApp();
    }

    initializeApp() {
        this.bindEvents();
        this.loadData();
        // Auto-refresh every 2 minutes
        setInterval(() => this.loadData(), 120000);
    }

    bindEvents() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterCryptos(e.target.value);
        });

        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadData();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.applyFilter();
            });
        });
    }

    async loadData() {
        try {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('errorMessage').style.display = 'none';

            const response = await fetch(
                'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false'
            );
            
            if (!response.ok) throw new Error('API request failed');
            
            this.cryptos = await response.json();
            this.applyFilter();
            
        } catch (error) {
            console.error('Error fetching data:', error);
            document.getElementById('errorMessage').style.display = 'block';
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }

    filterCryptos(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredCryptos = this.cryptos.filter(crypto => 
            crypto.name.toLowerCase().includes(term) || 
            crypto.symbol.toLowerCase().includes(term)
        );
        this.renderCryptos();
    }

    applyFilter() {
        switch (this.currentFilter) {
            case 'favorites':
                this.filteredCryptos = this.cryptos.filter(crypto => 
                    this.favorites.includes(crypto.id)
                );
                break;
            case 'gainers':
                this.filteredCryptos = [...this.cryptos]
                    .filter(crypto => crypto.price_change_percentage_24h > 0)
                    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
                break;
            case 'losers':
                this.filteredCryptos = [...this.cryptos]
                    .filter(crypto => crypto.price_change_percentage_24h < 0)
                    .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
                break;
            default:
                this.filteredCryptos = [...this.cryptos];
        }
        this.renderCryptos();
    }

    toggleFavorite(cryptoId) {
        if (this.favorites.includes(cryptoId)) {
            this.favorites = this.favorites.filter(id => id !== cryptoId);
        } else {
            this.favorites.push(cryptoId);
        }
        localStorage.setItem('cryptoFavorites', JSON.stringify(this.favorites));
        
        if (this.currentFilter === 'favorites') {
            this.applyFilter();
        } else {
            this.renderCryptos();
        }
    }

    renderCryptos() {
        const container = document.getElementById('cryptoList');
        
        if (this.filteredCryptos.length === 0) {
            container.innerHTML = '<div class="error">No cryptocurrencies found matching your criteria.</div>';
            return;
        }

        container.innerHTML = this.filteredCryptos.map(crypto => `
            <div class="crypto-card">
                <div class="crypto-header">
                    <div class="crypto-name">
                        <img src="${crypto.image}" alt="${crypto.name}" width="24" height="24" style="margin-right: 10px;">
                        ${crypto.name} (${crypto.symbol.toUpperCase()})
                    </div>
                    <button class="favorite-btn" onclick="tracker.toggleFavorite('${crypto.id}')">
                        ${this.favorites.includes(crypto.id) ? '⭐' : '☆'}
                    </button>
                </div>
                <div class="price">$${crypto.current_price.toLocaleString()}</div>
                <div class="info">
                    <div>24h Change: <span class="${crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                        ${crypto.price_change_percentage_24h ? crypto.price_change_percentage_24h.toFixed(2) + '%' : 'N/A'}
                    </span></div>
                    <div>Market Cap: $${crypto.market_cap.toLocaleString()}</div>
                    <div>24h Volume: $${crypto.total_volume.toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.tracker = new CryptoTracker();
});
