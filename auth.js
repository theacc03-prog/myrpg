import {
    auth,
    db
} from './firebase.js';

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

import {
    ref,
    set,
    get,
    update,
    push,
    onValue
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

import {
    money,
    makeId,
    FRATERNIDADES,
    renderTags
} from './utils.js';

let currentUser = null;

/* =========================
   HELPERS
========================= */

function showApp() {

    document.getElementById('auth-screen')
        ?.classList.add('hidden');

    document.getElementById('app-screen')
        ?.classList.remove('hidden');

    document.getElementById('main-nav')
        .style.display = 'flex';

}

function showAuth() {

    document.getElementById('auth-screen')
        ?.classList.remove('hidden');

    document.getElementById('app-screen')
        ?.classList.add('hidden');

    document.getElementById('main-nav')
        .style.display = 'none';

}

function refreshUserUI(data) {

    const nome =
        document.getElementById('u-nome');

    const saldo =
        document.getElementById('u-saldo');

    const tags =
        document.getElementById('u-tags');

    const foto =
        document.getElementById('u-foto');

    const bio =
        document.getElementById('u-bio');

    if (nome) {
        nome.innerText = data.nome || '---';
    }

    if (saldo) {
        saldo.innerText = money(data.saldo || 0);
    }

    if (tags) {
        tags.innerHTML =
            renderTags(data.tags);
    }

    if (foto) {

        foto.src =
            data.foto ||
            'https://placehold.co/150/0A192F/C0C0C0?text=ERA';

    }

    if (bio) {

        bio.innerText =
            data.bio ||
            'Membro da ERA Academy.';

    }

}

/* =========================
   AUTH LISTENER
========================= */

onAuthStateChanged(auth, user => {

    if (!user) {

        currentUser = null;

        showAuth();

        return;

    }

    currentUser = user;

    showApp();

    onValue(
        ref(db, `jogadores/${user.uid}`),
        snap => {

            const data = snap.val();

            if (!data) return;

            window.uLog = {
                id: user.uid,
                ...data
            };

            refreshUserUI(data);

            /* ADMIN */

            if (
                data.role === 'reitora'
            ) {

                document
                    .getElementById('btn-adm')
                    .style.display =
                    'inline-block';

            } else {

                document
                    .getElementById('btn-adm')
                    .style.display =
                    'none';

            }

        }
    );

});

/* =========================
   AUTH SYSTEM
========================= */

window.authSystem = {

    /* =========================
       LOGIN
    ========================= */

    login: async () => {

        const email =
            document
            .getElementById('email')
            .value
            .trim();

        const pass =
            document
            .getElementById('pass')
            .value
            .trim();

        if (!email || !pass) {

            alert(
                'Preencha e-mail e senha.'
            );

            return;

        }

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                pass
            );

        } catch (err) {

            alert(
                'Erro ao entrar: ' +
                err.message
            );

        }

    },

    /* =========================
       REGISTER
    ========================= */

    register: async () => {

        const nome =
            document
            .getElementById('reg-name')
            .value
            .trim();

        const email =
            document
            .getElementById('reg-email')
            .value
            .trim();

        const pass =
            document
            .getElementById('reg-pass')
            .value
            .trim();

        const origem =
            document
            .getElementById('reg-origem')
            .value;

        const frat =
            document
            .getElementById('reg-frat')
            .value;

        if (
            !nome ||
            !email ||
            !pass ||
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
                    email,
                    pass
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

            /* FRATERNIDADE */

            tags[makeId()] = {

                texto:
                    FRATERNIDADES[frat]
                    .nome
                    .toUpperCase(),

                cor:
                    FRATERNIDADES[frat]
                    .cor

            };

            /* SAVE USER */

            await set(
                ref(
                    db,
                    `jogadores/${res.user.uid}`
                ),
                {

                    nome,

                    saldo: saldoInicial,

                    divida: 0,

                    role: 'aluno',

                    origem,

                    fraternidade: frat,

                    contaCongelada: false,

                    multiplicadorFinanceiro: 1,

                    foto: '',

                    bio: '',

                    title: 'Acadêmico',

                    tags,

                    mochila: {},

                    fixos: {},

                    variaveis: {},

                    notificacoes: {},

                    historico: {},

                    emprestimos: {}

                }
            );

            /* ADD FRAT MEMBER */

            await push(
                ref(
                    db,
                    `fraternidades/${frat}/membros`
                ),
                {

                    uid: res.user.uid,

                    nome,

                    cargo: 'membro'

                }
            );

            alert(
                'Matrícula realizada.'
            );

            document
                .getElementById('register-box')
                .classList.add('hidden');

            document
                .getElementById('login-box')
                .classList.remove('hidden');

        } catch (err) {

            alert(
                'Erro ao registrar: ' +
                err.message
            );

        }

    },

    /* =========================
       LOGOUT
    ========================= */

    logout: async () => {

        try {

            await signOut(auth);

        } catch (err) {

            alert(
                'Erro ao sair.'
            );

        }

    }

};

console.log(
    'Auth carregado.'
);
