import {
    db
} from './firebase.js';

import {
    ref,
    get,
    update,
    push,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

import {
    money,
    esc
} from './utils.js';

/* =========================
   HELPERS
========================= */

function pushHistory(uid, tipo, valor, desc) {

    return push(
        ref(db, `jogadores/${uid}/historico`),
        {
            tipo,
            valor: Number(valor || 0),
            desc: desc || '',
            ts: Date.now()
        }
    );

}

function pushNotif(uid, msg) {

    return push(
        ref(db, `jogadores/${uid}/notificacoes`),
        {
            msg,
            ts: Date.now()
        }
    );

}

function financialMood(user) {

    if (!user) return '---';

    const saldo =
        Number(user.saldo || 0);

    const divida =
        Number(user.divida || 0);

    if (saldo >= 10000) {
        return 'Magnata Acadêmico';
    }

    if (saldo >= 5000) {
        return 'Elite Financeira';
    }

    if (saldo >= 2000) {
        return 'Promessa do Campus';
    }

    if (saldo >= 0) {
        return 'Estabilidade moderada';
    }

    if (divida > 0) {
        return 'Risco financeiro';
    }

    return 'Falência acadêmica';

}

function updateFinanceHealth(user) {

    const box =
        document.getElementById('fin-health');

    if (!box) return;

    const saldo =
        Number(user.saldo || 0);

    const divida =
        Number(user.divida || 0);

    if (saldo >= 3000) {

        box.className =
            'inline-feedback loan-status-good';

        box.innerText =
            'Situação financeira excelente.';

        return;

    }

    if (divida > saldo) {

        box.className =
            'inline-feedback loan-status-danger';

        box.innerText =
            'A dívida ultrapassou o saldo disponível.';

        return;

    }

    box.className =
        'inline-feedback loan-status-warning';

    box.innerText =
        'Atenção às movimentações financeiras.';

}

/* =========================
   RENDER LOANS
========================= */

function renderLoans(loansObj) {

    if (
        !loansObj ||
        !Object.keys(loansObj).length
    ) {

        return `
            <div class="subtle">
                Nenhum empréstimo ativo.
            </div>
        `;

    }

    return Object.entries(loansObj)
    .map(([id, loan]) => {

        return `

        <div class="card left">

            <strong>
                ${money(loan.valor || 0)}
            </strong>

            <br><br>

            Parcelas:
            ${loan.parcelas || 1}

            <br>

            Restante:
            ${money(loan.restante || 0)}

            <br><br>

            <div class="subtle">
                ${esc(loan.status || 'ativo')}
            </div>

        </div>

        `;

    })
    .join('');

}

/* =========================
   LISTENER
========================= */

function bindFinance(uid) {

    onValue(
        ref(db, `jogadores/${uid}/emprestimos`),
        snap => {

            const box =
                document.getElementById('fin-loans');

            if (!box) return;

            box.innerHTML =
                renderLoans(snap.val());

        }
    );

}

/* =========================
   FINANCEIRO APP
========================= */

window.financeiro = {

    /* =========================
       TRANSFERÊNCIA
    ========================= */

    transferir: async () => {

        if (!window.uLog) return;

        if (window.uLog.contaCongelada) {

            alert(
                'Sua conta está congelada.'
            );

            return;

        }

        const uid =
            document.getElementById('transf-uid')
            ?.value
            ?.trim();

        const valor =
            Number(
                document.getElementById('transf-valor')
                ?.value || 0
            );

        if (!uid || valor <= 0) {

            alert(
                'Preencha corretamente.'
            );

            return;

        }

        if (
            Number(window.uLog.saldo || 0)
            < valor
        ) {

            alert(
                'Saldo insuficiente.'
            );

            return;

        }

        const targetSnap =
            await get(
                ref(db, `jogadores/${uid}`)
            );

        const alvo =
            targetSnap.val();

        if (!alvo) {

            alert(
                'Usuário não encontrado.'
            );

            return;

        }

        /* REMOVE */

        await update(
            ref(
                db,
                `jogadores/${window.uLog.id}`
            ),
            {
                saldo:
                    Number(window.uLog.saldo || 0)
                    - valor
            }
        );

        /* ADD */

        await update(
            ref(db, `jogadores/${uid}`),
            {
                saldo:
                    Number(alvo.saldo || 0)
                    + valor
            }
        );

        /* HISTÓRICO */

        await pushHistory(
            window.uLog.id,
            'transferencia_saida',
            valor,
            `Transferência enviada para ${alvo.nome}`
        );

        await pushHistory(
            uid,
            'transferencia_entrada',
            valor,
            `Transferência recebida de ${window.uLog.nome}`
        );

        /* NOTIF */

        await pushNotif(
            uid,
            `${window.uLog.nome} transferiu ${money(valor)} para você.`
        );

        alert(
            'Transferência realizada.'
        );

    },

    /* =========================
       PEDIR EMPRÉSTIMO
    ========================= */

    solicitarEmprestimo: async () => {

        if (!window.uLog) return;

        const valor =
            Number(
                document.getElementById('loan-valor')
                ?.value || 0
            );

        const parcelas =
            Number(
                document.getElementById('loan-parcelas')
                ?.value || 1
            );

        if (
            valor <= 0 ||
            parcelas <= 0
        ) {

            alert(
                'Valores inválidos.'
            );

            return;

        }

        await push(
            ref(db, 'emprestimos_pendentes'),
            {

                uid: window.uLog.id,

                nome: window.uLog.nome,

                valor,

                parcelas,

                status: 'pendente',

                ts: Date.now()

            }
        );

        await pushNotif(
            window.uLog.id,
            `Solicitação de empréstimo enviada para análise.`
        );

        alert(
            'Solicitação enviada.'
        );

    },

    /* =========================
       PAGAR DÍVIDA
    ========================= */

    pagarDivida: async () => {

        if (!window.uLog) return;

        const valor =
            Number(
                document.getElementById('pay-valor')
                ?.value || 0
            );

        if (valor <= 0) {

            alert(
                'Valor inválido.'
            );

            return;

        }

        const saldoAtual =
            Number(window.uLog.saldo || 0);

        const dividaAtual =
            Number(window.uLog.divida || 0);

        if (saldoAtual < valor) {

            alert(
                'Saldo insuficiente.'
            );

            return;

        }

        await update(
            ref(
                db,
                `jogadores/${window.uLog.id}`
            ),
            {

                saldo:
                    saldoAtual - valor,

                divida:
                    Math.max(
                        0,
                        dividaAtual - valor
                    )

            }
        );

        await pushHistory(
            window.uLog.id,
            'pagamento_divida',
            valor,
            'Pagamento parcial da dívida'
        );

        alert(
            'Pagamento realizado.'
        );

    },

    /* =========================
       QUITAR TUDO
    ========================= */

    quitarTudo: async () => {

        if (!window.uLog) return;

        const saldo =
            Number(window.uLog.saldo || 0);

        const divida =
            Number(window.uLog.divida || 0);

        if (saldo < divida) {

            alert(
                'Saldo insuficiente.'
            );

            return;

        }

        await update(
            ref(
                db,
                `jogadores/${window.uLog.id}`
            ),
            {

                saldo:
                    saldo - divida,

                divida: 0

            }
        );

        await pushHistory(
            window.uLog.id,
            'quitacao_total',
            divida,
            'Dívida quitada integralmente'
        );

        alert(
            'Dívida quitada.'
        );

    },

    /* =========================
       REITORIA
    ========================= */

    congelarConta: async (uid, estado) => {

        await update(
            ref(db, `jogadores/${uid}`),
            {
                contaCongelada: estado
            }
        );

    },

    aplicarMultiplicador: async (
        uid,
        multiplicador
    ) => {

        await update(
            ref(db, `jogadores/${uid}`),
            {
                multiplicadorFinanceiro:
                    multiplicador
            }
        );

    }

};

/* =========================
   GLOBAL
========================= */

window.bindFinance = bindFinance;

window.updateFinanceHealth =
    updateFinanceHealth;

window.financialMood =
    financialMood;

console.log(
    'Financeiro carregado.'
);
