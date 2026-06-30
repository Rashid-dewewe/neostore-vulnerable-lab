const API_BASE = '/api';

const Auth = {
    getToken() {
        return localStorage.getItem('neostore_token');
    },
    setSession(token, user) {
        localStorage.setItem('neostore_token', token);
        localStorage.setItem('neostore_user', JSON.stringify(user));
        // Update cart count after login
        if (window.updateCartCount) {
            window.updateCartCount();
        }
    },
    getUser() {
        try {
            return JSON.parse(localStorage.getItem('neostore_user'));
        } catch {
            return null;
        }
    },
    logout() {
        localStorage.removeItem('neostore_token');
        localStorage.removeItem('neostore_user');
        window.location.href = '/index.html';
    },
    isLoggedIn() {
        return !!this.getToken() && !!this.getUser();
    },
    isAdmin() {
        const user = this.getUser();
        return user && (user.role === 'admin' || user.role === 'support');
    },
    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};

async function api(path, { method = 'GET', body, headers = {} } = {}) {
    const token = Auth.getToken();
    const finalHeaders = {
        'Content-Type': 'application/json',
        ...headers
    };
    
    if (token) {
        finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers: finalHeaders,
    };

    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }

    try {
        const res = await fetch(`${API_BASE}${path}`, options);
        const isJson = (res.headers.get('content-type') || '').includes('application/json');
        const data = isJson ? await res.json() : null;

        if (!res.ok) {
            throw new Error(data?.error || `HTTP ${res.status}: ${res.statusText}`);
        }
        return data;
    } catch (err) {
        if (err.message === 'Failed to fetch') {
            throw new Error('Network error - is the server running?');
        }
        throw err;
    }
}

// Cart API functions
const Cart = {
    async get() {
        return await api('/cart');
    },
    
    async add(productId, quantity = 1) {
        if (!Auth.isLoggedIn()) {
            throw new Error('Please log in first');
        }
        return await api('/cart/items', {
            method: 'POST',
            body: { product_id: productId, quantity }
        });
    },
    
    async update(itemId, quantity) {
        return await api(`/cart/items/${itemId}`, {
            method: 'PUT',
            body: { quantity }
        });
    },
    
    async remove(itemId) {
        return await api(`/cart/items/${itemId}`, {
            method: 'DELETE'
        });
    },
    
    async getCount() {
        try {
            const data = await this.get();
            return data.items ? data.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        } catch {
            return 0;
        }
    }
};

// Products API functions
const Products = {
    async getAll(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return await api(`/products${qs ? '?' + qs : ''}`);
    },
    
    async getById(id) {
        return await api(`/products/${id}`);
    },
    
    async getCategories() {
        return await api('/products/meta/categories');
    }
};

// Orders API functions
const Orders = {
    async getAll() {
        return await api('/orders');
    },
    
    async getById(id) {
        return await api(`/orders/${id}`);
    },
    
    async create(orderData) {
        return await api('/checkout', {
            method: 'POST',
            body: orderData
        });
    },
    
    async cancel(id) {
        return await api(`/orders/${id}/cancel`, {
            method: 'POST'
        });
    }
};

// Admin API functions
const Admin = {
    async getCustomers() {
        return await api('/admin/customers');
    },
    
    async getProducts() {
        return await api('/admin/products');
    },
    
    async updateProduct(id, data) {
        return await api(`/admin/products/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    
    async getOrders() {
        return await api('/admin/orders');
    },
    
    async getRevenue() {
        return await api('/admin/reports/revenue');
    },
    
    async promoteUser(id, role) {
        return await api(`/admin/users/${id}/promote`, {
            method: 'POST',
            body: { role }
        });
    }
};

// Utility functions
function money(num) {
    return '$' + Number(num).toFixed(2);
}

function toast(msg, type = 'success') {
    const existing = document.querySelector('.toast-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.className = 'toast-container fixed bottom-6 right-6 z-50';
    
    const t = document.createElement('div');
    t.className = `px-5 py-3 rounded-lg shadow-lg text-sm font-medium transition-all transform translate-y-0`;
    
    const colors = {
        success: 'bg-[#d4edda] text-[#155724] border border-[#c3e6cb]',
        error: 'bg-[#f8d7da] text-[#721c24] border border-[#f5c6cb]',
        warning: 'bg-[#fff3cd] text-[#856404] border border-[#ffc107]',
        info: 'bg-[#d1ecf1] text-[#0c5460] border border-[#bee5eb]'
    };
    
    t.className += ' ' + (colors[type] || colors.success);
    t.textContent = msg;
    
    container.appendChild(t);
    document.body.appendChild(container);
    
    setTimeout(() => {
        t.style.transform = 'translateY(100px)';
        t.style.opacity = '0';
        setTimeout(() => container.remove(), 300);
    }, 4000);
}

// Navigation render
function renderNav() {
    const navEl = document.getElementById('site-nav');
    if (!navEl) return;
    
    const user = Auth.getUser();
    const loggedIn = Auth.isLoggedIn();
    const isStaff = user && (user.role === 'admin' || user.role === 'support');

    let navHTML = `
        <div class="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
            <a href="/index.html" class="font-['Geist'] font-bold text-xl text-[#0041c8]">NeoStore</a>
            <div class="hidden md:flex items-center gap-6 text-sm font-medium">
                <a href="/index.html" class="text-[#0041c8] border-b-2 border-[#0041c8] pb-1">Shop</a>
                <a href="#" class="text-[#434656] hover:text-[#0041c8] transition-colors">Categories</a>
                <a href="#" class="text-[#434656] hover:text-[#0041c8] transition-colors">Deals</a>
                <a href="#" class="text-[#434656] hover:text-[#0041c8] transition-colors">Support</a>
            </div>
            <div class="flex items-center gap-4">
                <div class="hidden lg:flex items-center bg-[#f2f4f6] rounded-full px-4 py-1.5 border border-[#e0e3e5]">
                    <span class="material-symbols-outlined text-[#434656] text-sm">search</span>
                    <input id="search-input" class="bg-transparent border-none focus:ring-0 text-sm w-48" placeholder="Search products..."/>
                </div>
                <button class="p-2 hover:bg-[#f2f4f6] rounded-full transition-colors relative">
                    <span class="material-symbols-outlined text-[#434656]">favorite</span>
                </button>
                <a href="/cart.html" class="p-2 hover:bg-[#f2f4f6] rounded-full transition-colors relative">
                    <span class="material-symbols-outlined text-[#434656]">shopping_bag</span>
                    <span id="cart-count" class="absolute -top-0.5 -right-0.5 bg-[#0041c8] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">0</span>
                </a>
                ${loggedIn ? `
                    <div class="flex items-center gap-3">
                        <a href="/orders.html" class="text-sm text-[#434656] hover:text-[#0041c8] transition-colors">Orders</a>
                        <a href="/profile.html" class="text-sm text-[#434656] hover:text-[#0041c8] transition-colors">Profile</a>
                        ${isStaff ? `<a href="/admin/dashboard.html" class="text-xs bg-[#0041c8] text-white px-3 py-1 rounded-full hover:bg-[#0055ff] transition-colors">ADMIN</a>` : ''}
                        <button onclick="Auth.logout()" class="text-sm text-[#ba1a1a] hover:text-[#93000a] transition-colors">Logout</button>
                    </div>
                ` : `
                    <div class="flex items-center gap-2">
                        <a href="/login.html" class="px-4 py-1.5 bg-[#0041c8] text-white rounded-lg text-sm font-medium hover:bg-[#0055ff] transition-colors">Sign In</a>
                        <a href="/register.html" class="px-4 py-1.5 border border-[#e0e3e5] rounded-lg text-sm font-medium hover:bg-[#f2f4f6] transition-colors">Register</a>
                    </div>
                `}
            </div>
        </div>
    `;

    navEl.innerHTML = navHTML;

    // Add search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && window.loadProducts) {
                window.loadProducts({ q: searchInput.value });
            }
        });
    }

    // Update cart count
    if (loggedIn && window.updateCartCount) {
        window.updateCartCount();
    }
}

// Expose functions globally
window.Auth = Auth;
window.api = api;
window.Cart = Cart;
window.Products = Products;
window.Orders = Orders;
window.Admin = Admin;
window.money = money;
window.toast = toast;
window.renderNav = renderNav;

// Cart count updater
window.updateCartCount = async function() {
    if (!Auth.isLoggedIn()) return;
    try {
        const count = await Cart.getCount();
        const badge = document.getElementById('cart-count');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    } catch (e) {
        console.error('Failed to update cart count:', e);
    }
};

// Auto-update cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    if (Auth.isLoggedIn()) {
        window.updateCartCount();
    }
});
