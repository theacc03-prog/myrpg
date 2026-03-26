import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { ref, onValue, update, push, get, remove } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

let uLog = null;

// Navegação entre abas
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.section, .nav-btn').forEach(el => el.classList.remove('active'));
        const target = btn.dataset.tab;
        document.getElementById(target).classList.add('active');
        btn.classList.add('active');
    };
});

// Autenticação
const btnAuth = document.getElementById('btn-auth-action');
if(btnAuth) {
    btnAuth.onclick = async () => {
        const e = document.getElementById('u-email').value;
        const p = document.getElementById('u-pass').value;
        const isReg = document.getElementById('reg-box').style.display === 'block';

        try {
            if(isReg) {
                const n = document.getElementById('reg-nome').value;
                const r = await createUserWithEmailAndPassword(auth, e, p);
                await set(ref(db, `jogadores/${r.user.uid}`), { nome: n, saldo: 2000, role: 'aluno', bio: '', foto: '' });
            } else {
                await signInWithEmailAndPassword(auth, e, p);
            }
        } catch(err) { alert("Erro de Acesso: " + err.message); }
    };
}

// Monitor de Usuário Logado
onAuthStateChanged(auth, user => {
    if (user) {
        onValue(ref(db, `jogadores/${user.uid}`), snap => {
            uLog = { id: user.uid, ...snap.val() };
            renderHome();
            if(uLog.role === 'admin') document.getElementById('adm-tab-btn').style.display = 'block';
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-nav').style.display = 'flex';
            document.getElementById('app-wrap').style.display = 'block';
        });
        syncGlobalData();
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-wrap').style.display = 'none';
    }
});

function renderHome() {
    const home = document.getElementById('home');
    home.innerHTML = `
        <div class="card" style="text-align:center">
            <img src="${uLog.foto || 'https://placehold.co/150'}" class="profile-img">
            <h2 class="title-font">${uLog.nome}</h2>
            <div style="font-size:2em; font-weight:700">$ ${uLog.saldo.toLocaleString()}</div>
            <p style="font-size:11px; opacity:0.7">${uLog.bio || 'Sem descrição.'}</p>
            <button onclick="logout()" style="width:auto; padding:5px 15px">Sair da Conta</button>
        </div>
    `;
}

window.logout = () => signOut(auth);

// Função global para sincronizar dados (Ranking, Notícias, etc)
function syncGlobalData() {
    // Sincronizar Ranking
    onValue(ref(db, 'jogadores'), snap => {
        const players = [];
        Object.entries(snap.val()).forEach(([id, p]) => players.push({id, ...p}));
        players.sort((a,b) => b.saldo - a.saldo);
        
        const rankDiv = document.getElementById('ranking');
        rankDiv.innerHTML = '<h2 class="title-font">Ranking de Elite</h2>';
        players.forEach((p, i) => {
            rankDiv.innerHTML += `
                <div class="card" style="display:flex; align-items:center; gap:15px">
                    <b>#${i+1}</b>
                    <img src="${p.foto || 'https://placehold.co/40'}" style="width:40px; border-radius:50%">
                    <div style="flex:1"><b>${p.nome}</b></div>
                    <div>$ ${p.saldo}</div>
                </div>`;
        });
    });
}
