import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB0sfEpbNf7t6ZkYX_TFPLgNA559D5pssM",
    authDomain: "conta-ttk.firebaseapp.com",
    projectId: "conta-ttk",
    storageBucket: "conta-ttk.firebasestorage.app",
    messagingSenderId: "418211942552",
    appId: "1:418211942552:web:99b86646d1f1195d7180ed",
    measurementId: "G-M45YMVGF10"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const q = query(collection(db, "produtos"), orderBy("dataCriacao", "desc"));

let allProducts = [];
let currentCategory = 'Tudo';
let currentSearch = '';

// Escuta em tempo real
onSnapshot(q, (snapshot) => {
    allProducts = [];
    snapshot.forEach((doc) => {
        allProducts.push({ ...doc.data(), uid: doc.id });
    });
    applyFilters();
});

// Filtro de Texto
document.getElementById('searchInput').addEventListener('keyup', (e) => {
    currentSearch = e.target.value.toUpperCase();
    applyFilters();
});

// Filtro de Categorias
window.filterByCategory = (cat, btnElement) => {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    applyFilters();
};

function applyFilters() {
    let filtered = allProducts;
    if(currentCategory !== 'Tudo') {
        filtered = filtered.filter(p => p.categoria === currentCategory);
    }
    if(currentSearch !== '') {
        filtered = filtered.filter(p => p.id.toUpperCase().includes(currentSearch));
    }
    renderFeed(filtered);
}

window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`Código ${text} copiado!`);
    });
};

function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Dots Carrossel
window.updateDots = (carouselElement, cardUid) => {
    const scrollPosition = carouselElement.scrollLeft;
    const width = carouselElement.offsetWidth;
    const index = Math.round(scrollPosition / width);
    const dots = document.querySelectorAll(`.dot-group-${cardUid} .dot`);
    dots.forEach((dot, idx) => {
        if(idx === index) dot.classList.add('active');
        else dot.classList.remove('active');
    });
};

function renderFeed(productsToRender) {
    const feed = document.getElementById('feedContainer');
    feed.innerHTML = '';

    if (productsToRender.length === 0) {
        feed.innerHTML = '<p class="empty-msg">Nenhum produto encontrado.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const images = product.images.split(',').map(img => img.trim());
        const cat = product.categoria || 'Moda';
        const cardUid = product.uid;
        
        let carouselHTML = '';
        let dotsHTML = '';
        
        images.forEach((img, idx) => {
            carouselHTML += `
                <div class="carousel-item">
                    <img src="${img}" alt="ID ${product.id}" loading="lazy">
                    <span class="cat-badge">${cat}</span>
                </div>`;
            dotsHTML += `<div class="dot ${idx === 0 ? 'active' : ''}"></div>`;
        });

        const card = `
            <div class="product-card">
                <div class="carousel-wrapper">
                    <div class="carousel-container" onscroll="updateDots(this, '${cardUid}')">
                        ${carouselHTML}
                    </div>
                    ${images.length > 1 ? `<div class="carousel-dots dot-group-${cardUid}">${dotsHTML}</div>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-id">
                        ID: ${product.id.toUpperCase()}
                        <button class="copy-btn" onclick="copyToClipboard('${product.id.toUpperCase()}')" title="Copiar código">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                    </div>
                </div>
                <a href="${product.link}" target="_blank" class="btn-buy">
                    <span>Ir para Loja</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </a>
            </div>
        `;
        feed.innerHTML += card;
    });
}