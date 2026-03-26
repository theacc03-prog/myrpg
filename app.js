import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { ref, onValue, get, update, push, set } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

let uLog = null;

// --- SISTEMA DE ABAS (CORRIGIDO) ---
const navButtons = document.querySelectorAll('.nav-btn');
navButtons.forEach(btn => {
    btn.onclick = () => {
        const target = btn.getAttribute('data-tab');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        
        document.getElementById(target).classList.add('active');
        btn.classList.add('active');
    };
});

// --- AUTENTICAÇÃO ---
document.getElementById('toggle-auth').onclick = () => {
    const box = document.getElementById('reg-box');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
};

document.getElementById('btn-auth-action').onclick = async () => {
    const email = document.getElementById('u-email').value;
    const pass = document.getElementById('u-pass').value;
    const isReg = document.getElementById('reg-box').style.display === 'block';

    try {
        if(isReg) {
            const nome = document.getElementById('reg-nome').value;
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            await set(ref(db, `jogadores/${res.user.uid}`), { nome: nome, saldo: 1000, role: 'aluno', bio: '', divida: 0 });
        } else {
            await signInWithEmailAndPassword(auth, email, pass);
        }
    } catch(e) { alert("Acesso Negado: " + e.message); }
};

// --- MONITORAMENTO EM TEMPO REAL ---
onAuthStateChanged(auth, user => {
    if(user) {
        onValue(ref(db, `jogadores/${user.uid}`), snap => {
            uLog = { id: user.uid, ...snap.val() };
            renderUserHome();
            if(uLog.role === 'admin') {
                document.getElementById('adm-tab-btn').style.display = 'block';
                initAdminSystem();
            }
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-nav').style.display = 'flex';
            document.getElementById('app-wrap').style.display = 'block';
        });
        syncGlobalSystems();
    } else {
        document.getElementById('auth-screen').style.display = 'block';
        document.getElementById('main-nav').style.display = 'none';
        document.getElementById('app-wrap').style.display = 'none';
    }
});

function renderUserHome() {
    const area = document.getElementById('profile-render');
    area.innerHTML = `
        <div class="card" style="text-align:center">
            <img src="${uLog.foto || 'https://placehold.co/150'}" class="profile-img">
            <h2 class="title-font">${uLog.nome}</h2>
            <div style="font-size:2.2em; font-weight:700; color:var(--gold)">$ ${uLog.saldo.toLocaleString()}</div>
            <p style="font-size:11px; font-style:italic; opacity:0.8; margin: 10px 0;">${uLog.bio || 'Membro da ERA University'}</p>
            <button id="btn-logout" style="width:auto; padding:5px 20px; background:none; color:var(--alert); border:1px solid var(--alert); font-size:9px">Encerrar Sessão</button>
        </div>
    `;
    document.getElementById('btn-logout').onclick = () => signOut(auth);
}

// --- SISTEMA REITORIA (ADMIN) ---
function initAdminSystem() {
    const sel = document.getElementById('adm-p-sel');
    onValue(ref(db, 'jogadores'), snap => {
        let opts = '<option value="">Selecionar Aluno...</option>';
        Object.entries(snap.val()).forEach(([id, p]) => {
            if(id !== uLog.id) opts += `<option value="${id}">${p.nome}</option>`;
        });
        sel.innerHTML = opts;
    });

    sel.onchange = () => {
        document.getElementById('adm-p-controls').style.display = sel.value ? 'block' : 'none';
    };

    document.getElementById('btn-cycle').onclick = async () => {
        if(!confirm("Deseja girar o ciclo financeiro da Universidade?")) return;
        const s = await get(ref(db, 'jogadores'));
        const plys = s.val();
        const batch = {};
        for(let id in plys) {
            let saldo = plys[id].saldo || 0;
            if(plys[id].fixos) Object.values(plys[id].fixos).forEach(f => saldo += f.valor);
            batch[`jogadores/${id}/saldo`] = saldo;
        }
        await update(ref(db), batch);
        alert("Ciclo Acadêmico Processado!");
    };
}

function syncGlobalSystems() {
    // Ranking de Elite
    onValue(ref(db, 'jogadores'), snap => {
        let h = '<h3 class="title-font" style="margin-bottom:15px">Elite Financeira</h3>';
        let list = [];
        Object.entries(snap.val()).forEach(([id, p]) => list.push(p));
        list.sort((a,b) => b.saldo - a.saldo);
        list.slice(0, 10).forEach((p, i) => {
            h += `<div class="card" style="display:flex; justify-content:space-between; padding:12px">
                    <span><b>#${i+1}</b> ${p.nome}</span>
                    <span style="color:var(--gold)">$${p.saldo}</span>
                  </div>`;
        });
        document.getElementById('rank-list').innerHTML = h;
    });
}
