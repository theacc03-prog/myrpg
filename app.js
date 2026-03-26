import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { ref, onValue, update, push, get, set } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

let uLog = null;

// --- NAVEGAÇÃO ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.section, .nav-btn').forEach(el => el.classList.remove('active'));
        document.getElementById(btn.dataset.tab).classList.add('active');
        btn.classList.add('active');
    };
});

// --- AUTH LOGIC ---
const toggle = document.getElementById('toggle-auth');
if(toggle) toggle.onclick = () => {
    const box = document.getElementById('reg-box');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
};

document.getElementById('btn-auth-action').onclick = async () => {
    const e = document.getElementById('u-email').value;
    const p = document.getElementById('u-pass').value;
    const isReg = document.getElementById('reg-box').style.display === 'block';

    try {
        if(isReg) {
            const n = document.getElementById('reg-nome').value;
            const res = await createUserWithEmailAndPassword(auth, e, p);
            await set(ref(db, `jogadores/${res.user.uid}`), { nome: n, saldo: 1500, role: 'aluno', divida: 0 });
        } else {
            await signInWithEmailAndPassword(auth, e, p);
        }
    } catch(err) { alert("Erro: " + err.message); }
};

// --- MONITOR DE DADOS ---
onAuthStateChanged(auth, user => {
    if (user) {
        onValue(ref(db, `jogadores/${user.uid}`), snap => {
            uLog = { id: user.uid, ...snap.val() };
            updateUserInterface();
            if(uLog.role === 'admin') document.getElementById('adm-tab-btn').style.display = 'block';
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-nav').style.display = 'flex';
            document.getElementById('app-wrap').style.display = 'block';
        });
        syncGlobal();
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('main-nav').style.display = 'none';
        document.getElementById('app-wrap').style.display = 'none';
    }
});

function updateUserInterface() {
    const home = document.getElementById('home');
    home.innerHTML = `
        <div class="card" style="text-align:center">
            <img src="${uLog.foto || 'https://placehold.co/100'}" class="profile-img">
            <h2 class="title-font">${uLog.nome}</h2>
            <div style="font-size:2.5em; font-weight:700">$ ${uLog.saldo.toLocaleString()}</div>
            <button id="btn-logout" class="btn-red" style="width:auto; padding:5px 15px">Sair</button>
        </div>
    `;
    document.getElementById('btn-logout').onclick = () => signOut(auth);
    document.getElementById('display-divida').innerText = `$ ${uLog.divida || 0}`;
}

function syncGlobal() {
    // Ranking
    onValue(ref(db, 'jogadores'), snap => {
        let h = ""; let list = [];
        Object.entries(snap.val()).forEach(([id, p]) => list.push({id, ...p}));
        list.sort((a,b) => b.saldo - a.saldo);
        list.forEach((p, i) => {
            h += `<div class="card">#${i+1} ${p.nome} - $${p.saldo}</div>`;
        });
        document.getElementById('rank-list').innerHTML = h;
    });

    // Mercado
    onValue(ref(db, 'loja'), snap => {
        let h = "";
        if(snap.val()) Object.entries(snap.val()).forEach(([id, i]) => {
            h += `<div class="card"><b>${i.nome}</b><br>$${i.preco}<br><button onclick="window.comprar('${id}', ${i.preco})">Comprar</button></div>`;
        });
        document.getElementById('market-grid').innerHTML = h || "Mercado Vazio";
    });
}

// Tornar funções acessíveis ao HTML
window.comprar = async (id, preco) => {
    if(uLog.saldo < preco) return alert("Sem saldo!");
    await update(ref(db, `jogadores/${uLog.id}`), { saldo: uLog.saldo - preco });
    alert("Comprado!");
};
