import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

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
const auth = getAuth(app);

// Proteção da página: se não estiver logado, redireciona para o login
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html"; 
    }
});

console.log("O script admin.js carregou!");

const produtosRef = collection(db, "produtos");
const categoriasRef = collection(db, "categorias");

let products = [];
let editingId = null;

// --- FUNÇÕES GERAIS ---
window.showToast = (msg, type = 'success') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
};

// --- SISTEMA DE CATEGORIAS ---
onSnapshot(query(categoriasRef, orderBy("nome", "asc")), (snapshot) => {
    const list = document.getElementById('categoryList');
    const containerCategorias = document.getElementById('pCat');
    if(!list || !containerCategorias) return;
    
    list.innerHTML = '';
    containerCategorias.innerHTML = ''; 

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const uid = docSnap.id;
        const safeName = data.nome.replace(/'/g, "\\'");
        
        const div = document.createElement('div');
        div.innerHTML = `
            <label style="color: white; cursor: pointer; display: flex; align-items: center; gap: 5px; margin-bottom: 5px;">
                <input type="checkbox" name="cat" value="${data.nome}" onchange="window.updatePreview()"> ${data.nome}
            </label>
        `;
        containerCategorias.appendChild(div);

        const li = document.createElement('li');
        li.className = 'product-item';
        li.innerHTML = `
            <div class="item-info"><strong>${data.nome}</strong></div>
            <div class="action-buttons">
                <button class="btn-icon" onclick="window.editCategory('${uid}', '${safeName}')">✏️</button>
                <button class="btn-icon del" onclick="window.deleteCategory('${uid}')">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
});

window.addCategory = async () => {
    const nome = document.getElementById('catNome').value.trim();
    if(!nome) return window.showToast('Digite o nome.', 'error');
    try { await addDoc(categoriasRef, { nome }); document.getElementById('catNome').value = ''; window.showToast('Adicionada!'); } 
    catch(e) { window.showToast('Erro: ' + e.message, 'error'); }
};

window.deleteCategory = async (uid) => {
    if(confirm('Apagar categoria?')) { await deleteDoc(doc(db, "categorias", uid)); window.showToast('Apagada!'); }
};

window.editCategory = async (uid, oldName) => {
    const newName = prompt("Digite o novo nome para a categoria:", oldName);
    if(newName && newName.trim() !== "" && newName !== oldName) {
        try {
            await updateDoc(doc(db, "categorias", uid), { nome: newName.trim() });
            window.showToast('Categoria atualizada!');
        } catch (e) {
            window.showToast('Erro ao editar: ' + e.message, 'error');
        }
    }
};

// --- SISTEMA DE PRODUTOS ---
onSnapshot(query(produtosRef, orderBy("dataCriacao", "desc")), (snapshot) => {
    products = [];
    snapshot.forEach((doc) => { products.push({ ...doc.data(), uid: doc.id }); });
    renderAdminList();
});

window.saveProduct = async () => {
    const nome = document.getElementById('pNome').value;
    const id = document.getElementById('pId').value;
    const link = document.getElementById('pLink').value;
    const imagensRaw = document.getElementById('pImagesUrls').value;

    const cats = Array.from(document.querySelectorAll('input[name="cat"]:checked')).map(cb => cb.value);
    
    const imagesArray = imagensRaw.split(',').map(s => {
        let clean = s.trim();
        const match = clean.match(/src=["'](.*?)["']/);
        return match ? match[1] : clean;
    }).filter(s => s !== "");

    if(!nome || !id || !link || cats.length === 0 || imagesArray.length === 0) { 
        window.showToast('Preencha Nome, ID, Link, Fotos e marque a Categoria.', 'error'); return; 
    }

    try {
        const dados = { nome, id, categorias: cats, images: imagesArray, link };
        if (editingId) {
            await updateDoc(doc(db, "produtos", editingId), dados);
            window.showToast('Atualizado!'); window.cancelEdit();
        } else {
            await addDoc(produtosRef, { ...dados, dataCriacao: serverTimestamp() });
            window.showToast('Publicado!'); window.clearForm();
        }
    } catch (e) { window.showToast('Erro: ' + e.message, 'error'); }
};

window.editProduct = (uid) => {
    const p = products.find(p => p.uid === uid);
    if(!p) return;
    document.getElementById('pNome').value = p.nome || '';
    document.getElementById('pId').value = p.id;
    document.getElementById('pLink').value = p.link;
    document.getElementById('pImagesUrls').value = Array.isArray(p.images) ? p.images.join(', ') : (p.images || '');
    document.querySelectorAll('input[name="cat"]').forEach(cb => {
        cb.checked = p.categorias ? p.categorias.includes(cb.value) : false;
    });
    editingId = uid;
    document.getElementById('formTitle').innerText = "Editando Peça";
    document.getElementById('submitBtn').innerText = "Atualizar Peça";
    document.getElementById('cancelBtn').style.display = "block";
    updatePreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.cancelEdit = () => {
    editingId = null;
    document.getElementById('formTitle').innerText = "Nova Peça";
    document.getElementById('submitBtn').innerText = "Publicar no Site";
    document.getElementById('cancelBtn').style.display = "none";
    window.clearForm();
};

window.deleteProduct = async (uid) => {
    if(confirm('Tem certeza que deseja apagar esta peça definitivamente?')) { 
        try {
            await deleteDoc(doc(db, "produtos", uid)); 
            window.showToast('Peça apagada com sucesso!'); 
            if (editingId === uid) window.cancelEdit();
        } catch (e) {
            window.showToast('Erro ao apagar: ' + e.message, 'error');
        }
    }
};

window.clearForm = () => {
    document.getElementById('pNome').value = '';
    document.getElementById('pId').value = '';
    document.getElementById('pLink').value = '';
    document.getElementById('pImagesUrls').value = '';
    document.querySelectorAll('input[name="cat"]').forEach(cb => cb.checked = false);
    updatePreview();
};

function renderAdminList() {
    const list = document.getElementById('adminList');
    if(!list) return;
    list.innerHTML = '';
    products.forEach((p) => {
        const li = document.createElement('li');
        li.className = 'product-item';
        li.innerHTML = `
            <div class="item-info">
                <strong>${p.nome || 'Sem nome'}</strong> 
                <span class="item-badge">ID: #${p.id ? p.id.toUpperCase() : ''}</span>
            </div>
            <div class="action-buttons">
                <button class="btn-icon" onclick="window.editProduct('${p.uid}')">✏️</button>
                <button class="btn-icon del" onclick="window.deleteProduct('${p.uid}')">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// --- FUNÇÕES DE NAVEGAÇÃO DO CARROSSEL E PREVIEW ---
window.scrollCarousel = (id, direction) => {
    const container = document.getElementById(id);
    if (!container) return;
    const scrollAmount = container.clientWidth;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
};

window.updateArrows = (el) => {
    const wrapper = el.parentElement;
    if(!wrapper) return;
    const prevBtn = wrapper.querySelector('.prev');
    const nextBtn = wrapper.querySelector('.next');
    if (prevBtn) prevBtn.disabled = (el.scrollLeft <= 0);
    if (nextBtn) nextBtn.disabled = (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
};

window.updatePreview = function() {
    const nomeInput = document.getElementById('pNome')?.value.trim() || 'Nome da Peça';
    const idInput = document.getElementById('pId')?.value.trim().toUpperCase() || 'ID';
    const imageInput = document.getElementById('pImagesUrls')?.value.trim() || '';
    const previewArea = document.getElementById('previewCardArea');

    const catsArray = Array.from(document.querySelectorAll('input[name="cat"]:checked')).map(cb => cb.value);
    const catsTexto = catsArray.length > 0 ? catsArray.join(', ') : 'Sem categoria';
    const catsHTML = `<div style="font-size: 0.75rem; color: #bdaea3; margin-top: 6px; font-weight: 500;">📁 ${catsTexto}</div>`;

    if (!previewArea) return;

    let carouselHTML = '';
    let arrowsHTML = '';
    const imagesArray = imageInput.split(',').map(s => {
        let clean = s.trim();
        const match = clean.match(/src=["'](.*?)["']/);
        return match ? match[1] : clean;
    }).filter(s => s !== "");

    if (imagesArray.length === 0) {
        previewArea.innerHTML = `
            <div style="background: rgba(0,0,0,0.3); border-radius: 20px; padding: 20px; text-align: center; color: #bdaea3; border: 1px dashed #555;">
                <h3 style="color: white; margin-bottom: 5px; font-family: 'Playfair Display', serif;">${nomeInput}</h3>
                <span style="font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 8px;">#${idInput}</span>
                ${catsHTML}
                <p style="margin-top: 15px; font-size: 0.9rem;">Cole um link de imagem para visualizar.</p>
            </div>
        `;
        return;
    }

    imagesArray.forEach((img) => {
        carouselHTML += `<div class="carousel-item" style="min-width: 100%; scroll-snap-align: center;"><img src="${img}" alt="Preview" style="width: 100%; height: 350px; object-fit: cover; display: block; border-radius: 12px;"></div>`;
    });

    if (imagesArray.length > 1) {
        arrowsHTML = `
            <button class="nav-btn prev" onclick="window.scrollCarousel('preview-carousel', -1)" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 50%; cursor: pointer; z-index: 10; backdrop-filter: blur(5px);">❮</button>
            <button class="nav-btn next" onclick="window.scrollCarousel('preview-carousel', 1)" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 50%; cursor: pointer; z-index: 10; backdrop-filter: blur(5px);">❯</button>
        `;
    }

    previewArea.innerHTML = `
        <div class="glass-card" style="background: rgba(45, 18, 18, 0.6); border: 1px solid rgba(242, 231, 220, 0.15); border-radius: 24px; padding: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.4);">
            <div class="carousel-wrapper" style="position: relative; width: 100%; overflow: hidden; border-radius: 12px; margin-bottom: 15px;">
                <div class="carousel-container" id="preview-carousel" onscroll="window.updateArrows(this)" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;">
                    ${carouselHTML}
                </div>
                ${arrowsHTML}
            </div>
            <div class="card-info" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div class="card-text">
                    <h3 style="font-family: 'Playfair Display', serif; font-size: 1.3rem; margin-bottom: 4px; color: #f2e7dc;">${nomeInput}</h3>
                    <span style="font-size: 0.8rem; background: rgba(242, 231, 220, 0.1); padding: 4px 10px; border-radius: 8px; color: #bdaea3; font-weight: 600;">#${idInput}</span>
                    ${catsHTML}
                </div>
                <button style="background: rgba(255,255,255,0.05); border: 1px solid rgba(242, 231, 220, 0.15); color: #f2e7dc; padding: 8px 12px; border-radius: 8px; cursor: not-allowed; opacity: 0.5;">Copiar</button>
            </div>
            <button style="display: block; width: 100%; padding: 14px; background: linear-gradient(135deg, #a33b3b, #7a2222); color: white; border: none; font-weight: 600; border-radius: 12px; cursor: not-allowed; opacity: 0.5;">EU QUERO</button>
        </div>
    `;

    const el = document.getElementById('preview-carousel');
    if (el) window.updateArrows(el);
};

// --- INICIALIZAÇÃO DIRETA ---
const inputs = ['pNome', 'pId', 'pImagesUrls'];
inputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('input', updatePreview);
    }
});
updatePreview();