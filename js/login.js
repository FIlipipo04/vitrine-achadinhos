import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

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
const auth = getAuth(app);

window.fazerLogin = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;
    const msg = document.getElementById('msg');

    try {
        await signInWithEmailAndPassword(auth, email, senha);
        window.location.href = "admin.html"; // Redireciona para o painel
    } catch (e) {
        msg.innerText = "Erro: E-mail ou senha incorretos.";
    }
};