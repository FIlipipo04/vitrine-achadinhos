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
let deletingId = null;

window.showToast = (msg, type = 'success') => {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// Monitora Banco
onSnapshot(q, (snapshot) => {
    products = [];
    snapshot.forEach((doc) => {
        products.push({ ...doc.data(), uid: doc.id });
    });
    document.getElementById('countTotal').innerText = products.length;
    renderAdminList();
});

// Salvar / Editar
window.saveProduct = async () => {
    const id = document.getElementById('pId').value;
    const categoria = document.getElementById('pCat').value;
    const images = document.getElementById('pImages').value;
    const link = document.getElementById('pLink').value;

    if(!id || !images || !link) { 
        window.showToast('Preencha os campos obrigatórios.', 'error');
        return; 
    }

    const btn = document.getElementById('submitBtn');
    btn.innerText = "Processando...";

    try {
        if (editingId) {
            await updateDoc(doc(db, "produtos", editingId), { id, categoria, images, link });
            window.showToast('Atualizado com sucesso!');
            window.cancelEdit();
        } else {
            await addDoc(produtosRef, { id, categoria, images, link, dataCriacao: serverTimestamp() });
            window.showToast('Cadastrado com sucesso!');
            window.clearForm();
        }
    } catch (error) {
        window.showToast('Erro: ' + error.message, 'error');
    }
    btn.innerText = "Salvar no Banco";
};

// Deletar com Modal
window.openDeleteModal = (uid) => {
    deletingId = uid;
    document.getElementById('deleteModal').style.display = 'flex';
};

window.closeModal = () => {
    deletingId = null;
    document.getElementById('deleteModal').style.display = 'none';
};

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if(deletingId) {
        try {
            await deleteDoc(doc(db, "produtos", deletingId));
            window.showToast('Removido!');
        } catch(e) {
            window.showToast('Erro ao remover.', 'error');
        }
        window.closeModal();
    }
});

window.editProduct = (uid) => {
    const p = products.find(p => p.uid === uid);
    if(!p) return;
    document.getElementById('pId').value = p.id;
    document.getElementById('pCat').value = p.categoria || 'Roupas';
    document.getElementById('pImages').value = p.images;
    document.getElementById('pLink').value = p.link;

    editingId = uid;
    document.getElementById('formTitle').innerText = "Editando...";
    document.getElementById('submitBtn').innerText = "Atualizar";
    document.getElementById('cancelBtn').style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.cancelEdit = () => {
    editingId = null;
    document.getElementById('formTitle').innerText = "Cadastrar Novo Produto";
    document.getElementById('submitBtn').innerText = "Salvar no Banco";
    document.getElementById('cancelBtn').style.display = "none";
    window.clearForm();
};

window.clearForm = () => {
    document.getElementById('pId').value = '';
    document.getElementById('pImages').value = '';
    document.getElementById('pLink').value = '';
    document.getElementById('pCat').value = 'Roupas';
};

function renderAdminList() {
    const list = document.getElementById('adminList');
    list.innerHTML = '';
    if(products.length === 0) { list.innerHTML = '<li style="text-align: center; color: #555; padding: 20px;">Sem registros.</li>'; return; }

    products.forEach((p) => {
        const li = document.createElement('li');
        li.className = 'product-item';
        const cat = p.categoria || 'Geral';
        li.innerHTML = `
            <div class="item-info">
                <strong>${p.id.toUpperCase()}</strong> <span class="item-badge">${cat}</span>
                <br><small style="color:#666;">${p.images.split(',').length} foto(s)</small>
            </div>
            <div class="action-buttons">
                <button class="btn-icon" onclick="window.editProduct('${p.uid}')">✏️</button>
                <button class="btn-icon del" onclick="window.openDeleteModal('${p.uid}')">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
}