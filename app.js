import {
    auth,
    db
} from './firebase.js';

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    deleteUser,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

import {
    ref,
    set,
    get,
    update,
    onValue,
    push,
    remove
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

import {
    money,
    makeId,
    FRATERNIDADES,
    renderTags,
    esc
} from './utils.js';

let uLog = null;

const subs = [];

function clearSubs() {

    while (subs.length) {

        const u = subs.pop();

        if (typeof u === "function") {
            u();
        }

    }

}

function listen(r, cb) {

    const unsub = onValue(r, cb);

    subs.push(unsub);

    return unsub;

}

/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(auth, user => {

    clearSubs();

    if (user) {

        document.getElementById('auth-screen')
            .classList.add('hidden');

        document.getElementById('app-screen')
            .classList.remove('hidden');

        document.getElementById('main-nav')
            .style.display = 'flex';

        listen(ref(db, `jogadores/${user.uid}`), snap => {

            const d = snap.val();

            if (!d) return;

            uLog = {
                id: user.uid,
                ...d
            };

            refreshDashboard(d);

            renderFraternidades();

        });

    } else {

        uLog = null;

        document.getElementById('auth-screen')
            .classList.remove('hidden');

        document.getElementById('app-screen')
            .classList.add('hidden');

        document.getElementById('main-nav')
            .style.display = 'none';

    }

});

/* =========================
   DASHBOARD
========================= */

function refreshDashboard(d) {

    const nome = document.getElementById('u-nome');

    const saldo = document.getElementById('u-saldo');

    const bio = document.getElementById('u-bio');

    const foto = document.getElementById('u-foto');

    const tags = document.getElementById('u-tags');

    if (nome) {
        nome.innerText = d.nome || '---';
    }

    if (saldo) {
        saldo.innerText = money(d.saldo || 0);
    }

    if (bio) {
        bio.innerText =
            d.bio ||
            'Membro da Sovereign Society.';
    }

    if (foto) {

        foto.src =
            d.foto ||
            'https://placehold.co/150/0A192F/C0C0C0?text=ERA';

    }

    if (tags) {
        tags.innerHTML = renderTags(d.tags);
    }

}

/* =========================
   FRATERNIDADES
========================= */

function renderFraternidades() {

    listen(ref(db, 'fraternidades'), snap => {

        const data = snap.val() || {};

        const box =
            document.getElementById('frat-list');

        if (!box) return;

        if (!Object.keys(data).length) {

            box.innerHTML = `
                <div class="subtle">
                    Nenhuma fraternidade encontrada.
                </div>
            `;

            return;

        }

        box.innerHTML =
            Object.entries(data)
            .map(([id, f]) => {

                return `

                <div class="card left frat-card">

                    <h2>
                        ${esc(f.nome || '---')}
                    </h2>

                    <div class="subtle">
                        ${esc(f.descricao || '')}
                    </div>

                    <div class="hr"></div>

                    <div class="frat-balance">
                        ${money(f.saldo || 0)}
                    </div>

                    <div class="subtle">
                        Mensalidade:
                        ${money(f.mensalidade || 0)}
                    </div>

                    <br>

                    <strong>
                        Presidente:
                    </strong>

                    ${esc(
                        f.presidenteNome ||
                        'Não definido'
                    )}

                    <br><br>

                    <strong>
                        Membros:
                    </strong>

                    ${
                        f.membros
                        ? Object.keys(f.membros).length
                        : 0
                    }

                </div>

                `;

            })
            .join('');

    });

}

/* =========================
   APP
========================= */

window.app = {

    /* =========================
       UI
    ========================= */

    toggleAuth: () => {

        document.getElementById('login-box')
            .classList.toggle('hidden');

        document.getElementById('register-box')
            .classList.toggle('hidden');

    },

    showTab: (id, btn) => {

        document.querySelectorAll('.tab-content')
            .forEach(t => t.classList.add('hidden'));

        document.querySelectorAll('.nav-btn')
            .forEach(b => b.classList.remove('active'));

        document.getElementById(id)
            .classList.remove('hidden');

        if (btn) {
            btn.classList.add('active');
        }

    },

    /* =========================
       LOGIN
    ========================= */

    handleLogin: async () => {

        const e =
            document.getElementById('email')
            .value
            .trim();

        const p =
            document.getElementById('pass')
            .value
            .trim();

        if (!e || !p) {

            alert(
                'Preencha e-mail e senha.'
            );

            return;

        }

        try {

            await signInWithEmailAndPassword(
                auth,
                e,
                p
            );

        } catch (err) {

            alert(
                'Acesso negado: ' +
                err.message
            );

        }

    },

    /* =========================
       REGISTER
    ========================= */

    handleRegister: async () => {

        const n =
            document.getElementById('reg-name')
            .value
            .trim();

        const e =
            document.getElementById('reg-email')
            .value
            .trim();

        const p =
            document.getElementById('reg-pass')
            .value
            .trim();

        const origem =
            document.getElementById('reg-origem')
            .value;

        const frat =
            document.getElementById('reg-frat')
            .value;

        if (
            !n ||
            !e ||
            !p ||
            !origem ||
            !frat
        ) {

            alert(
                'Preencha todos os campos.'
            );

            return;

        }

        try {

            const saldoInicial =
                origem === 'herdeiro'
                ? 3000
                : 1500;

            const res =
                await createUserWithEmailAndPassword(
                    auth,
                    e,
                    p
                );

            const tags = {};

            /* HERDEIRO/BOLSISTA */

            tags[makeId()] = {

                texto:
                    origem === 'herdeiro'
                    ? 'HERDEIRO'
                    : 'BOLSISTA',

                cor:
                    origem === 'herdeiro'
                    ? '#D4AF37'
                    : '#C0C0C0'

            };

            /* FRAT */

            tags[makeId()] = {

                texto:
                    FRATERNIDADES[frat]
                    .nome
                    .toUpperCase(),

                cor:
                    FRATERNIDADES[frat]
                    .cor

            };

            await set(
                ref(
                    db,
                    `jogadores/${res.user.uid}`
                ),
                {

                    nome: n,

                    saldo: saldoInicial,

                    divida: 0,

                    role: 'aluno',

                    origem,

                    fraternidade: frat,

                    contaCongelada: false,

                    multiplicadorFinanceiro: 1,

                    foto: '',

                    bio: '',

                    tags,

                    mochila: {},

                    fixos: {},

                    variaveis: {},

                    historico: {},

                    notificacoes: {},

                    emprestimos: {},

                    title: 'Acadêmico'

                }
            );

            /* ADD MEMBRO */

            await push(
                ref(
                    db,
                    `fraternidades/${frat}/membros`
                ),
                {

                    uid: res.user.uid,

                    nome: n,

                    cargo: 'membro'

                }
            );

            alert(
                'Matrícula realizada.'
            );

        } catch (err) {

            alert(
                'Erro: ' +
                err.message
            );

        }

    },

    /* =========================
       PROFILE
    ========================= */

    updateProfile: async () => {

        if (!uLog) return;

        const nome =
            document.getElementById('set-nome')
            ?.value
            ?.trim();

        const foto =
            document.getElementById('set-foto')
            ?.value
            ?.trim();

        const bio =
            document.getElementById('set-bio')
            ?.value
            ?.trim();

        await update(
            ref(db, `jogadores/${uLog.id}`),
            {
                nome,
                foto,
                bio
            }
        );

        alert('Perfil atualizado.');

    },

    logout: async () => {

        await signOut(auth);

    }

};

console.log(
    'ERA Academy iniciado.'
);
