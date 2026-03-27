import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getDatabase, ref, onValue, get, update, push } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBt7zjlI1P8lN4JxnxTe_erzNbfu1AHdfE",
    authDomain: "universityerarpg-6a29d.firebaseapp.com",
    databaseURL: "https://universityerarpg-6a29d-default-rtdb.firebaseio.com",
    projectId: "universityerarpg-6a29d",
    storageBucket: "universityerarpg-6a29d.firebasestorage.app",
    messagingSenderId: "912095174573",
    appId: "1:912095174573:web:e4591c65eeb9259ba9cb24"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
let uLog = null;

// NAVEGAÇÃO
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
        const target = btn.getAttribute('data-tab');
        document.querySelectorAll('.section, .nav-btn').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
        document.getElementById(target).style.display = 'block';
        btn.classList.add('active');
    };
});

// MONITOR DE LOGIN
onAuthStateChanged(auth, user => {
    if(user) {
        onValue(ref(db, `jogadores/${user.uid}`), snap => {
            uLog = { id: user.uid, ...snap.val() };
            renderUser();
            if(uLog.role === 'admin') {
                document.getElementById('adm-tab-btn').style.display = 'block';
                inicializarReitoria();
            }
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-nav').style.display = 'flex';
            document.getElementById('app-wrap').style.display = 'block';
        });
        carregarSistemas();
    } else {
        document.getElementById('auth-screen').style.display = 'block';
        document.getElementById('main-nav').style.display = 'none';
        document.getElementById('app-wrap').style.display = 'none';
    }
});

function renderUser() {
    document.getElementById('profile-render').innerHTML = `
        <div class="card" style="text-align:center">
            <h2 class="title-font">${uLog.nome}</h2>
            <div style="font-size:2.5em; font-weight:700; color:var(--gold)">$ ${uLog.saldo.toLocaleString()}</div>
            <button id="logout" class="btn-red" style="width:auto; padding:5px 15px; margin-top:10px">Sair</button>
        </div>
    `;
    document.getElementById('logout').onclick = () => signOut(auth);
}

// LOGIN ACTION
document.getElementById('btn-auth-action').onclick = async () => {
    const e = document.getElementById('u-email').value;
    const p = document.getElementById('u-pass').value;
    try { await signInWithEmailAndPassword(auth, e, p); } catch(e) { alert("Erro de Acesso."); }
};

// FUNÇÕES DA REITORIA
function inicializarReitoria() {
    // Giro de Ciclo
    document.getElementById('btn-cycle').onclick = async () => {
        if(!confirm("Girar ciclo?")) return;
        const s = await get(ref(db, 'jogadores'));
        const plys = s.val();
        const batch = {};
        for(let id in plys) {
            let nS = (plys[id].saldo || 0);
            if(plys[id].fixos) Object.values(plys[id].fixos).forEach(f => nS += f.valor);
            batch[`jogadores/${id}/saldo`] = nS;
        }
        await update(ref(db), batch);
        alert("Ciclo Concluído!");
    };

    // Adicionar Item
    document.getElementById('btn-add-item').onclick = async () => {
        const n = document.getElementById('adm-item-n').value;
        const p = Number(document.getElementById('adm-item-p').value);
        if(n && p) {
            await push(ref(db, 'loja'), { nome: n, preco: p });
            alert("Item Publicado!");
        }
    };

    // Adicionar Aviso
    document.getElementById('btn-add-news').onclick = async () => {
        const t = document.getElementById('adm-news-t').value;
        const x = document.getElementById('adm-news-x').value;
        if(t && x) {
            await push(ref(db, 'avisos'), { titulo: t, texto: x });
            alert("Comunicado Enviado!");
        }
    };
}

// CARREGAR DADOS GLOBAIS
function carregarSistemas() {
    // Ranking
    onValue(ref(db, 'jogadores'), snap => {
        let h = '<h3 class="title-font">Elite de ERA</h3>';
        let list = [];
        Object.entries(snap.val()).forEach(([id, p]) => list.push(p));
        list.sort((a,b) => b.saldo - a.saldo).slice(0, 5).forEach((p, i) => {
            h += `<div class="card" style="display:flex; justify-content:space-between"><span>#${i+1} ${p.nome}</span><span>$${p.saldo}</span></div>`;
        });
        document.getElementById('rank-list').innerHTML = h;
    });

    // Editorial
    onValue(ref(db, 'avisos'), snap => {
        let h = '<h3 class="title-font">Editorial</h3>';
        if(snap.exists()) {
            Object.values(snap.val()).reverse().forEach(a => {
                h += `<div class="card"><h4>${a.titulo}</h4><p>${a.texto}</p></div>`;
            });
        }
        document.getElementById('news-feed').innerHTML = h;
    });

    // Mercado
    onValue(ref(db, 'loja'), snap => {
        let h = "";
        if(snap.exists()) {
            Object.entries(snap.val()).forEach(([id, item]) => {
                h += `<div class="card" style="text-align:center">
                        <b>${item.nome}</b><br><span style="color:var(--gold)">$${item.preco}</span><br>
                        <button onclick="comprar('${id}', ${item.preco})" style="margin-top:10px; font-size:10px">Comprar</button>
                      </div>`;
            });
        }
        document.getElementById('market-list').innerHTML = h || "Sem itens.";
    });
}

// COMPRA
window.comprar = async (id, preco) => {
    if(uLog.saldo < preco) return alert("Saldo insuficiente.");
    if(confirm("Deseja comprar?")) {
        await update(ref(db, `jogadores/${uLog.id}`), { saldo: uLog.saldo - preco });
        alert("Sucesso!");
    }
};
