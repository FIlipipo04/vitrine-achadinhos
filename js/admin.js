import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

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

// Referências do Banco
const produtosRef = collection(db, "produtos");
const categoriasRef = collection(db, "categorias");

let products = [];
let editingId = null;

window.showToast = (msg, type = 'success') => {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
};

// ==========================================
// 1. SISTEMA DE CATEGORIAS
// ==========================================
onSnapshot(query(categoriasRef, orderBy("nome", "asc")), (snapshot) => {
    const list = document.getElementById('categoryList');
    const select = document.getElementById('pCat');
    list.innerHTML = '';
    select.innerHTML = '';

    if(snapshot.empty) {
        list.innerHTML = '<li style="text-align: center; color: #bdaea3; padding: 10px;">Sem categorias.</li>';
        select.innerHTML = '<option value="">Crie uma categoria primeiro</option>';
        return;
    }

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const uid = docSnap.id;
        
        // Coloca no formulário de Nova Peça
        const opt = document.createElement('option');
        opt.value = data.nome;
        opt.innerText = data.nome;
        select.appendChild(opt);

        // Coloca na lista de gerenciamento
        const li = document.createElement('li');
        li.className = 'product-item';
        li.innerHTML = `
            <div class="item-info"><strong>${data.nome}</strong></div>
            <div class="action-buttons">
                <button class="btn-icon del" onclick="window.deleteCategory('${uid}')">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
});

window.addCategory = async () => {
    const nome = document.getElementById('catNome').value.trim();
    if(!nome) return window.showToast('Digite o nome da categoria.', 'error');
    try {
        await addDoc(categoriasRef, { nome });
        document.getElementById('catNome').value = '';
        window.showToast('Categoria adicionada!');
    } catch(e) { window.showToast('Erro: ' + e.message, 'error'); }
};

window.deleteCategory = async (uid) => {
    if(confirm('Apagar essa categoria? (Os produtos não sumirão, só ficarão sem categoria no filtro)')) {
        await deleteDoc(doc(db, "categorias", uid));
        window.showToast('Categoria apagada!');
    }
};

// ==========================================
// 2. SISTEMA DE PRODUTOS
// ==========================================
onSnapshot(query(produtosRef, orderBy("dataCriacao", "desc")), (snapshot) => {
    products = [];
    snapshot.forEach((doc) => { products.push({ ...doc.data(), uid: doc.id }); });
    renderAdminList();
});

window.saveProduct = async () => {
    const nome = document.getElementById('pNome').value;
    const id = document.getElementById('pId').value;
    const categoria = document.getElementById('pCat').value;
    const imagens = document.getElementById('pImagesUrls').value;
    const link = document.getElementById('pLink').value;

    if(!nome || !id || !link || !imagens || !categoria) { 
        window.showToast('Preencha Nome, ID, Categoria, Foto e Link.', 'error'); return; 
    }

    const btn = document.getElementById('submitBtn');
    btn.innerText = "Salvando..."; btn.disabled = true;

    try {
        if (editingId) {
            await updateDoc(doc(db, "produtos", editingId), { nome, id, categoria, images: imagens, link });
            window.showToast('Atualizado com sucesso!'); window.cancelEdit();
        } else {
            await addDoc(produtosRef, { nome, id, categoria, images: imagens, link, dataCriacao: serverTimestamp() });
            window.showToast('Peça publicada com sucesso!'); window.clearForm();
        }
    } catch (error) { window.showToast('Erro: ' + error.message, 'error'); }
    
    btn.innerText = "Publicar no Site"; btn.disabled = false;
};

window.deleteProduct = async (uid) => {
    if(confirm('Tem certeza que deseja apagar?')) {
        await deleteDoc(doc(db, "produtos", uid)); window.showToast('Peça removida!');
    }
};

window.editProduct = (uid) => {
    const p = products.find(p => p.uid === uid);
    if(!p) return;
    
    document.getElementById('pNome').value = p.nome || '';
    document.getElementById('pId').value = p.id;
    document.getElementById('pCat').value = p.categoria;
    document.getElementById('pLink').value = p.link;
    document.getElementById('pImagesUrls').value = Array.isArray(p.images) ? p.images.join(', ') : p.images;
    
    editingId = uid;
    document.getElementById('formTitle').innerText = "Editando Peça";
    document.getElementById('submitBtn').innerText = "Atualizar Peça";
    document.getElementById('cancelBtn').style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.cancelEdit = () => {
    editingId = null;
    document.getElementById('formTitle').innerText = "Nova Peça";
    document.getElementById('submitBtn').innerText = "Publicar no Site";
    document.getElementById('cancelBtn').style.display = "none";
    window.clearForm();
};

window.clearForm = () => {
    document.getElementById('pNome').value = '';
    document.getElementById('pId').value = '';
    document.getElementById('pLink').value = '';
    document.getElementById('pImagesUrls').value = '';
};

function renderAdminList() {
    const list = document.getElementById('adminList');
    list.innerHTML = '';
    if(products.length === 0) { list.innerHTML = '<li style="text-align: center; color: #bdaea3; padding: 20px;">Atelier vazio.</li>'; return; }

    products.forEach((p) => {
        const li = document.createElement('li');
        li.className = 'product-item';
        li.innerHTML = `
            <div class="item-info">
                <strong>${p.nome || 'Sem nome'}</strong> 
                <span class="item-badge">ID: #${p.id.toUpperCase()}</span>
                <span style="font-size: 0.7rem; color: #bdaea3; margin-left:10px;">${p.categoria}</span>
            </div>
            <div class="action-buttons">
                <button class="btn-icon" onclick="window.editProduct('${p.uid}')">✏️</button>
                <button class="btn-icon del" onclick="window.deleteProduct('${p.uid}')">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
}