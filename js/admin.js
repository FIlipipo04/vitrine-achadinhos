import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
// IMPORTANTE: Adicionando o Storage para Uploads
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";

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
const storage = getStorage(app); // Inicializa o Armário
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

// Monitora Banco
onSnapshot(q, (snapshot) => {
    products = [];
    snapshot.forEach((doc) => { products.push({ ...doc.data(), uid: doc.id }); });
    renderAdminList();
});

// FUNÇÃO DE SALVAR COM UPLOAD REAL
window.saveProduct = async () => {
    const nome = document.getElementById('pNome').value;
    const id = document.getElementById('pId').value;
    const categoria = document.getElementById('pCat').value;
    const link = document.getElementById('pLink').value;
    const files = document.getElementById('pImagesFiles').files;
    const oldUrls = document.getElementById('pImagesUrlsOld').value;

    if(!nome || !id || !link) { 
        window.showToast('Preencha Nome, ID e Link.', 'error'); return; 
    }
    
    // Se não for edição e não tiver foto, avisa
    if(!editingId && files.length === 0) {
        window.showToast('Selecione pelo menos uma foto.', 'error'); return; 
    }

    const btn = document.getElementById('submitBtn');
    btn.innerText = "Fazendo Upload e Salvando...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    try {
        let finalImageUrls = [];

        // Se a pessoa selecionou fotos novas no PC/Celular, sobe pro Storage
        if(files.length > 0) {
            for(let i = 0; i < files.length; i++) {
                const file = files[i];
                // Cria um nome único pra foto
                const storageRef = ref(storage, 'produtos/' + Date.now() + '_' + file.name);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                finalImageUrls.push(downloadURL);
            }
        } else if (editingId) {
            // Se está editando e não escolheu foto nova, mantém as antigas
            finalImageUrls = JSON.parse(oldUrls);
        }

        // Salva tudo no Banco de Dados
        if (editingId) {
            await updateDoc(doc(db, "produtos", editingId), { nome, id, categoria, images: finalImageUrls, link });
            window.showToast('Atualizado com sucesso!');
            window.cancelEdit();
        } else {
            await addDoc(produtosRef, { nome, id, categoria, images: finalImageUrls, link, dataCriacao: serverTimestamp() });
            window.showToast('Peça publicada com sucesso!');
            window.clearForm();
        }
    } catch (error) {
        window.showToast('Erro: ' + error.message, 'error');
    }
    
    btn.innerText = "Publicar no Site";
    btn.style.opacity = "1";
    btn.disabled = false;
};

// Apagar
window.deleteProduct = async (uid) => {
    if(confirm('Tem certeza que deseja apagar?')) {
        await deleteDoc(doc(db, "produtos", uid));
        window.showToast('Peça removida!');
    }
};

// Editar
window.editProduct = (uid) => {
    const p = products.find(p => p.uid === uid);
    if(!p) return;
    
    document.getElementById('pNome').value = p.nome || '';
    document.getElementById('pId').value = p.id;
    document.getElementById('pCat').value = p.categoria || 'Dresses';
    document.getElementById('pLink').value = p.link;
    
    // Tratativa para salvar as fotos antigas caso ela não upe novas
    let imgs = Array.isArray(p.images) ? p.images : p.images.split(',').map(i=>i.trim());
    document.getElementById('pImagesUrlsOld').value = JSON.stringify(imgs);
    
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
    document.getElementById('pImagesFiles').value = '';
    document.getElementById('pImagesUrlsOld').value = '';
};

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