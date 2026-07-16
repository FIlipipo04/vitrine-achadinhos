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
const produtosRef = collection(db, "produtos");
const q = query(produtosRef, orderBy("dataCriacao", "desc"));

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

// Monitora Banco de Dados
onSnapshot(q, (snapshot) => {
    products = [];
    snapshot.forEach((doc) => { products.push({ ...doc.data(), uid: doc.id }); });
    renderAdminList();
});

// Salvar Peça (Com o LINK da imagem)
window.saveProduct = async () => {
    const nome = document.getElementById('pNome').value;
    const id = document.getElementById('pId').value;
    const categoria = document.getElementById('pCat').value;
    const imagens = document.getElementById('pImagesUrls').value;
    const link = document.getElementById('pLink').value;

    if(!nome || !id || !link || !imagens) { 
        window.showToast('Preencha Nome, ID, Foto e Link.', 'error'); return; 
    }

    const btn = document.getElementById('submitBtn');
    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        if (editingId) {
            await updateDoc(doc(db, "produtos", editingId), { nome, id, categoria, images: imagens, link });
            window.showToast('Atualizado com sucesso!');
            window.cancelEdit();
        } else {
            await addDoc(produtosRef, { nome, id, categoria, images: imagens, link, dataCriacao: serverTimestamp() });
            window.showToast('Peça publicada com sucesso!');
            window.clearForm();
        }
    } catch (error) {
        window.showToast('Erro: ' + error.message, 'error');
    }
    
    btn.innerText = "Publicar no Site";
    btn.disabled = false;
};

// Apagar Peça
window.deleteProduct = async (uid) => {
    if(confirm('Tem certeza que deseja apagar?')) {
        await deleteDoc(doc(db, "produtos", uid));
        window.showToast('Peça removida!');
    }
};

// Editar Peça
window.editProduct = (uid) => {
    const p = products.find(p => p.uid === uid);
    if(!p) return;
    
    document.getElementById('pNome').value = p.nome || '';
    document.getElementById('pId').value = p.id;
    document.getElementById('pCat').value = p.categoria || 'Dresses';
    document.getElementById('pLink').value = p.link;
    
    // Tratativa para os links das imagens
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
    document.getElementById('pCat').value = 'Dresses';
    document.getElementById('pImagesUrls').value = '';
};

// Renderizar Lista
function renderAdminList() {
    const list = document.getElementById('adminList');
    list.innerHTML = '';
    if(products.length === 0) { list.innerHTML = '<li style="text-align: center; color: #bdaea3; padding: 20px;">Atelier vazio.</li>'; return; }

    products.forEach((p) => {
        const li = document.createElement('li');
        li.className = 'product-item';
        const nome = p.nome || 'Sem nome';
        li.innerHTML = `
            <div class="item-info">
                <strong>${nome}</strong> 
                <span class="item-badge">ID: #${p.id.toUpperCase()}</span>
            </div>
            <div class="action-buttons">
                <button class="btn-icon" onclick="window.editProduct('${p.uid}')">✏️</button>
                <button class="btn-icon del" onclick="window.deleteProduct('${p.uid}')">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
}