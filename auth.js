import {

    auth,
    db

} from './firebase.js';

import {

    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

import {

    ref,
    set,
    push,
    get

} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

import {

    FRATERNIDADES,
    makeId

} from './utils.js';

window.authSystem = {

    register: async () => {

        const nome = document.getElementById('reg-name').value;

        const email = document.getElementById('reg-email').value;

        const senha = document.getElementById('reg-password').value;

        const origem = document.getElementById('reg-origem').value;

        const frat = document.getElementById('reg-frat').value;

        const saldo = origem === 'herdeiro'
            ? 3000
            : 1500;

        const user = await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

        const tags = {};

        tags[makeId()] = {
            texto: origem.toUpperCase(),
            cor: origem === 'herdeiro'
                ? '#D4AF37'
                : '#C0C0C0'
        };

        tags[makeId()] = {
            texto: FRATERNIDADES[frat].nome.toUpperCase(),
            cor: FRATERNIDADES[frat].cor
        };

        await set(ref(db, `jogadores/${user.user.uid}`), {

            nome,

            saldo,

            fraternidade: frat,

            origem,

            tags,

            role: 'aluno',

            contaCongelada: false,

            multiplicadorFinanceiro: 1,

            bio: '',

            foto: ''

        });

    },

    login: async () => {

        const email = document.getElementById('email').value;

        const senha = document.getElementById('password').value;

        await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

    }

};

onAuthStateChanged(auth, async user => {

    if (!user) return;

    document.getElementById('auth-screen').classList.add('hidden');

    document.getElementById('app-screen').classList.remove('hidden');

    const snap = await get(ref(db, `jogadores/${user.uid}`));

    const data = snap.val();

    document.getElementById('player-name').innerText = data.nome;

    document.getElementById('player-balance').innerText = `${data.saldo} CR`;

});