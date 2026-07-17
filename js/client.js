import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

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

// --- SISTEMA DE FILTROS ---
const filterByCategory = (cat, btnElement) => {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
    applyFilters();
};
window.filterByCategory = filterByCategory;

// --- PUXAR DADOS DO FIREBASE ---
onSnapshot(query(collection(db, "categorias"), orderBy("nome", "asc")), (snapshot) => {
    const filterContainer = document.getElementById('categoryFilters');
    if(!filterContainer) return;
    filterContainer.innerHTML = '<button class="cat-btn active" onclick="window.filterByCategory(\'Tudo\', this)">Tudo</button>';
    snapshot.forEach((docSnap) => {
        const catNome = docSnap.data().nome;
        const btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.innerText = catNome;
        btn.onclick = function() { window.filterByCategory(catNome, this); };
        filterContainer.appendChild(btn);
    });
});

onSnapshot(query(collection(db, "produtos"), orderBy("dataCriacao", "desc")), (snapshot) => {
    allProducts = [];
    snapshot.forEach((doc) => { allProducts.push({ ...doc.data(), uid: doc.id }); });
    applyFilters();
});

// Monitorar o banner de promoção
onSnapshot(doc(db, "configuracoes", "promo"), (docSnap) => {
    const banner = document.getElementById('promoBanner');
    const texto = document.getElementById('promoTexto');
    if (!docSnap.exists()) return;

    const data = docSnap.data();
    if (data.ativo) {
        banner.classList.add('banner-ativo'); // Liga o visual bonito
        texto.innerText = data.texto;
        banner.onclick = () => window.open(data.link, '_blank');
    } else {
        banner.classList.remove('banner-ativo'); // Desliga o visual
    }
});

// --- FUNÇÕES AUXILIARES ---
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
        currentSearch = e.target.value.replace('#', '').toUpperCase();
        applyFilters();
    });
}

function applyFilters() {
    let filtered = allProducts;
    if(currentCategory !== 'Tudo') {
        filtered = filtered.filter(p => {
            const categoriasDoProduto = p.categorias || [p.categoria];
            return categoriasDoProduto.includes(currentCategory);
        });
    }
    if(currentSearch !== '') {
        filtered = filtered.filter(p => p.id.toUpperCase().includes(currentSearch) || (p.nome && p.nome.toUpperCase().includes(currentSearch)));
    }
    renderFeed(filtered);
}

window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => showToast(`${text} copiado!`));
};

function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2500);
}

// --- RENDERIZAR FEED ---
function renderFeed(productsToRender) {
    const feed = document.getElementById('feedContainer');
    if(!feed) return;
    feed.innerHTML = '';

    if (productsToRender.length === 0) {
        feed.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 50px;">Nenhuma peça encontrada.</p>';
        return;
    }

    productsToRender.forEach(product => {
        // Pega as imagens e aplica o filtro escudo para garantir que não vai quebrar
        let imagensOriginais = typeof product.images === 'string' ? product.images.split(',') : (product.images || []);
        let images = imagensOriginais.map(img => {
            let clean = typeof img === 'string' ? img.trim() : '';
            const match = clean.match(/src=["'](.*?)["']/);
            return match ? match[1] : clean;
        }).filter(img => img !== "");

        const nomeProduto = product.nome || 'Peça Exclusiva';
        let carouselHTML = '';
        images.forEach((img) => {
            carouselHTML += `<div class="carousel-item"><img src="${img}" alt="${nomeProduto}" loading="lazy"></div>`;
        });

        const showArrows = images.length > 1;
        const arrowsHTML = showArrows ? `
            <button class="nav-btn prev" onclick="window.scrollCarousel('carousel-${product.uid}', -1)">❮</button>
            <button class="nav-btn next" onclick="window.scrollCarousel('carousel-${product.uid}', 1)">❯</button>
        ` : '';

        const catsTexto = Array.isArray(product.categorias) ? product.categorias.join(', ') : (product.categoria || '');
        const catsHTML = catsTexto ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; font-weight: 500;">📁 ${catsTexto}</div>` : '';

        const card = `
            <div class="glass-card">
                <div class="carousel-wrapper">
                    <div class="carousel-container" id="carousel-${product.uid}" onscroll="window.updateArrows(this)">
                        ${carouselHTML}
                    </div>
                    ${arrowsHTML}
                </div>
                <div class="card-info">
                    <div class="card-text">
                        <h3>${nomeProduto}</h3>
                        <span>#${product.id ? product.id.toUpperCase() : ''}</span>
                        ${catsHTML}
                    </div>
                    <button class="copy-btn" onclick="window.copyToClipboard('#${product.id ? product.id.toUpperCase() : ''}')">Copiar</button>
                </div>
                <a href="${product.link}" target="_blank" class="btn-buy" onclick="window.registrarClique('${product.uid}')">EU QUERO</a>
            </div>
        `;
        feed.innerHTML += card;
        
        const el = document.getElementById(`carousel-${product.uid}`);
        if (el) window.updateArrows(el);
    });
}

// --- FUNÇÕES DE NAVEGAÇÃO (FORA DE TUDO!) ---
window.scrollCarousel = (id, direction) => {
    const container = document.getElementById(id);
    if (!container) return;
    const scrollAmount = container.clientWidth;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
};

window.updateArrows = (el) => {
    const wrapper = el.parentElement;
    const prevBtn = wrapper.querySelector('.prev');
    const nextBtn = wrapper.querySelector('.next');
    
    if (prevBtn) prevBtn.disabled = (el.scrollLeft <= 0);
    if (nextBtn) nextBtn.disabled = (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
};

window.registrarClique = async (productId) => {
    try {
        const docRef = doc(db, "produtos", productId);
        await updateDoc(docRef, {
            cliques: increment(1)
        });
    } catch (e) {
        console.error("Erro ao registrar clique:", e);
    }
};

// --- EFEITO DO CABEÇALHO DINÂMICO (COM ANTI-TREMOR) ---
let isHeaderScrolled = false; 

window.addEventListener('scroll', () => {
    const header = document.querySelector('.glass-header');
    if (!header) return;

    if (window.scrollY > 80 && !isHeaderScrolled) {
        header.classList.add('scrolled');
        isHeaderScrolled = true;
    } 
    else if (window.scrollY < 20 && isHeaderScrolled) {
        header.classList.remove('scrolled');
        isHeaderScrolled = false;
    }
});