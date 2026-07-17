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

let allProducts = [];
let currentCategory = 'Tudo';
let currentSearch = '';

// Puxar as categorias Dinâmicas do Banco
onSnapshot(query(collection(db, "categorias"), orderBy("nome", "asc")), (snapshot) => {
    const filterContainer = document.getElementById('categoryFilters');
    // Reinicia deixando só o botão Tudo
    filterContainer.innerHTML = '<button class="cat-btn active" onclick="filterByCategory(\'Tudo\', this)">Tudo</button>';
    
    snapshot.forEach((docSnap) => {
        const catNome = docSnap.data().nome;
        const btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.innerText = catNome;
        btn.onclick = function() { window.filterByCategory(catNome, this); };
        filterContainer.appendChild(btn);
    });
});

// Puxar os produtos
onSnapshot(query(collection(db, "produtos"), orderBy("dataCriacao", "desc")), (snapshot) => {
    allProducts = [];
    snapshot.forEach((doc) => {
        allProducts.push({ ...doc.data(), uid: doc.id });
    });
    applyFilters();
});

document.getElementById('searchInput').addEventListener('keyup', (e) => {
    currentSearch = e.target.value.replace('#', '').toUpperCase();
    applyFilters();
});

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
        filtered = filtered.filter(p => p.id.toUpperCase().includes(currentSearch) || (p.nome && p.nome.toUpperCase().includes(currentSearch)));
    }
    renderFeed(filtered);
}

window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`${text} copiado!`);
    });
};

function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2500);
}

function renderFeed(productsToRender) {
    const feed = document.getElementById('feedContainer');
    feed.innerHTML = '';

    if (productsToRender.length === 0) {
        feed.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 50px; font-weight: 500;">Nenhuma peça encontrada.</p>';
        return;
    }

    productsToRender.forEach(product => {
        let images = typeof product.images === 'string' ? product.images.split(',').map(img => img.trim()) : product.images;
        const nomeProduto = product.nome || 'Peça Exclusiva';
        let carouselHTML = '';
        
        images.forEach((img) => {
            carouselHTML += `<div class="carousel-item"><img src="${img}" alt="${nomeProduto}" loading="lazy"></div>`;
        });

        const card = `
            <div class="glass-card">
                <div class="carousel-wrapper">
                    <div class="carousel-container">${carouselHTML}</div>
                </div>
                <div class="card-info">
                    <div class="card-text">
                        <h3>${nomeProduto}</h3>
                        <span>#${product.id.toUpperCase()}</span>
                    </div>
                    <button class="copy-btn" onclick="copyToClipboard('#${product.id.toUpperCase()}')" title="Copiar ID">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                </div>
                <a href="${product.link}" target="_blank" class="btn-buy">EU QUERO</a>
            </div>
        `;
        feed.innerHTML += card;
    });
}