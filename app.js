import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { ref, onValue, update, push, get } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// Lógica de Troca de Abas
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.section, .nav-btn').forEach(el => el.classList.remove('active'));
        document.getElementById(btn.dataset.tab).classList.add('active');
        btn.classList.add('active');
    };
});

// Monitor de Autenticação
onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-nav').style.display = 'flex';
        document.getElementById('app-wrap').style.display = 'block';
        carregarDadosUsuario(user.uid);
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
    }
});

function carregarDadosUsuario(uid) {
    onValue(ref(db, `jogadores/${uid}`), snapshot => {
        const data = snapshot.val();
        // Renderizar o perfil do aluno na tela HOME...
        // (Aqui entra a lógica de preencher saldo, nome, foto, etc)
    });
}
