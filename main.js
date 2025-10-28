const ready = (callback) => {
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    }
};

ready(() => {
    document.body.classList.remove('container');

    const nav = document.querySelector('.site-nav');
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const navLinks = nav ? Array.from(nav.querySelectorAll('a')) : [];
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    const toggleNavigation = (forceOpen) => {
        if (!nav || !menuToggle) return;
        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !nav.classList.contains('is-open');
        nav.classList.toggle('is-open', shouldOpen);
        menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    };

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => toggleNavigation());

        document.addEventListener('click', (event) => {
            if (!nav.classList.contains('is-open')) return;
            const target = event.target;
            if (target instanceof Node && !nav.contains(target) && !menuToggle.contains(target)) {
                toggleNavigation(false);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && nav.classList.contains('is-open')) {
                toggleNavigation(false);
            }
        });

        mobileQuery.addEventListener('change', () => {
            if (!mobileQuery.matches) {
                toggleNavigation(false);
            }
        });
    }

    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            if (mobileQuery.matches) {
                toggleNavigation(false);
            }
        });
    });

    const productCards = Array.from(document.querySelectorAll('[data-product]'));
    const initialOrder = new Map(productCards.map((card, index) => [card, index]));
    const productGrid = document.querySelector('[data-product-grid]');
    const searchInput = document.querySelector('[data-search]');
    const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
    const sortSelect = document.querySelector('[data-sort]');
    const emptyState = document.querySelector('[data-empty-state]');

    const statProducts = document.querySelector('[data-stat="products"]');
    const statFarmers = document.querySelector('[data-stat="farmers"]');

    const updateStats = () => {
        if (statProducts) {
            statProducts.textContent = productCards.length.toString();
        }
        if (statFarmers) {
            const farms = new Set(productCards.map((card) => card.dataset.farm || ''));
            statFarmers.textContent = farms.size.toString();
        }
    };

    const applyFilters = () => {
        if (!productGrid) return;
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const activeButton = filterButtons.find((button) => button.classList.contains('is-active'));
        const activeCategory = activeButton ? activeButton.dataset.filter : 'all';
        const sortValue = sortSelect ? sortSelect.value : 'default';

        const filteredCards = productCards.filter((card) => {
            const category = card.dataset.category || 'all';
            const keywords = `${card.dataset.name || ''} ${card.dataset.keywords || ''}`.toLowerCase();
            const matchesCategory = activeCategory === 'all' || activeCategory === category;
            const matchesQuery = !query || keywords.includes(query);
            return matchesCategory && matchesQuery;
        });

        const sortedCards = [...filteredCards];
        if (sortValue === 'price-asc') {
            sortedCards.sort((a, b) => Number(a.dataset.price || 0) - Number(b.dataset.price || 0));
        } else if (sortValue === 'price-desc') {
            sortedCards.sort((a, b) => Number(b.dataset.price || 0) - Number(a.dataset.price || 0));
        } else {
            sortedCards.sort((a, b) => {
                const orderA = initialOrder.get(a) ?? 0;
                const orderB = initialOrder.get(b) ?? 0;
                return orderA - orderB;
            });
        }

        productCards.forEach((card) => {
            card.classList.toggle('is-hidden', !filteredCards.includes(card));
        });

        sortedCards.forEach((card) => productGrid.appendChild(card));

        if (emptyState) {
            emptyState.hidden = sortedCards.length > 0;
        }
    };

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            filterButtons.forEach((btn) => btn.classList.remove('is-active'));
            button.classList.add('is-active');
            applyFilters();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const previousTimer = Number(searchInput.dataset.timerId || 0);
            if (previousTimer) {
                window.clearTimeout(previousTimer);
            }
            const timerId = window.setTimeout(applyFilters, 140);
            searchInput.dataset.timerId = String(timerId);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }

    updateStats();
    applyFilters();

    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const button = newsletterForm.querySelector('button');
            if (button) {
                const original = button.textContent;
                button.textContent = 'Terdaftar!';
                button.disabled = true;
                window.setTimeout(() => {
                    button.textContent = original || 'Daftar';
                    button.disabled = false;
                }, 2200);
            }
            newsletterForm.reset();
        });
    }

    const copyrightYear = document.getElementById('copyright-year');
    if (copyrightYear) {
        copyrightYear.textContent = String(new Date().getFullYear());
    }
});
