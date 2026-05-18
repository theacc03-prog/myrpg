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

function isReitoria() {

    return (
        window.uLog &&
        window.uLog.role === 'reitora'
    );

}

function adminGuard() {

    if (!isReitoria()) {

        alert(
            'Acesso restrito à reitoria.'
        );

        return false;

    }

    return true;

}

function pushNotif(uid, msg) {

    return push(
        ref(
            db,
            `jogadores/${uid}/notificacoes`
        ),
        {

            msg,

            ts: Date.now()

        }
    );

}

function pushHistory(
    uid,
    tipo,
    valor,
    desc
) {

    return push(
        ref(
            db,
            `jogadores/${uid}/historico`
        ),
        {

            tipo,

            valor,

            desc,

            ts: Date.now()

        }
    );

}

/* =========================
   RENDER ADMIN
========================= */

function renderAdmin(players) {

    const box =
        document.getElementById('admin-panel');

    if (!box) return;

    box.innerHTML =
        Object.entries(players)
        .map(([uid, p]) => {

            return `

            <div class="card left">

                <h3>
                    ${esc(p.nome || '---')}
                </h3>

                <div class="subtle">

                    ${esc(
                        p.role || 'aluno'
                    )}

                </div>

                <div class="hr"></div>

                <strong>
                    Saldo:
                </strong>

                ${money(p.saldo || 0)}

                <br><br>

                <strong>
                    Dívida:
                </strong>

                ${money(p.divida || 0)}

                <br><br>

                <strong>
                    Status:
                </strong>

                ${
                    p.contaCongelada
                    ? 'Conta congelada'
                    : 'Ativa'
                }

                <div class="hr"></div>

                <!-- BONUS -->

                <input
                    type="number"
                    step="0.1"
                    id="mult-${uid}"
                    placeholder="Multiplicador">

                <button
                    class="btn-gold"
                    onclick="
                        reitoria.aplicarMultiplicador(
                            '${uid}'
                        )
                    ">

                    Aplicar Multiplicador

                </button>

                <!-- MULTA -->

                <input
                    type="number"
                    id="multa-${uid}"
                    placeholder="Valor da multa">

                <button
                    class="btn-red"
                    onclick="
                        reitoria.aplicarMulta(
                            '${uid}'
                        )
                    ">

                    Aplicar Multa

                </button>

                <!-- BONUS DIRETO -->

                <input
                    type="number"
                    id="bonus-${uid}"
                    placeholder="Bônus financeiro">

                <button
                    class="btn-sec"
                    onclick="
                        reitoria.bonusDireto(
                            '${uid}'
                        )
                    ">

                    Adicionar Saldo

                </button>

                <!-- CONTA -->

                <button
                    class="
                        ${
                            p.contaCongelada
                            ? 'btn-gold'
                            : 'btn-red'
                        }
                    "
                    onclick="
                        reitoria.toggleFreeze(
                            '${uid}',
                            ${p.contaCongelada}
                        )
                    ">

                    ${
                        p.contaCongelada
                        ? 'Descongelar Conta'
                        : 'Congelar Conta'
                    }

                </button>

            </div>

            `;

        })
        .join('');

}

/* =========================
   LISTENER
========================= */

onValue(
    ref(db, 'jogadores'),
    snap => {

        if (!isReitoria()) return;

        renderAdmin(
            snap.val() || {}
        );

    }
);

/* =========================
   REITORIA
========================= */

window.reitoria = {

    /* =========================
       MULTIPLICADOR
    ========================= */

    aplicarMultiplicador:
    async (uid) => {

        if (!adminGuard()) return;

        const valor =
            Number(
                document
                .getElementById(
                    `mult-${uid}`
                )
                ?.value || 1
            );

        await update(
            ref(db, `jogadores/${uid}`),
            {

                multiplicadorFinanceiro:
                    valor

            }
        );

        await pushNotif(
            uid,
            `Seu multiplicador financeiro foi alterado para ${valor}.`
        );

        alert(
            'Multiplicador atualizado.'
        );

    },

    /* =========================
       MULTA
    ========================= */

    aplicarMulta:
    async (uid) => {

        if (!adminGuard()) return;

        const valor =
            Number(
                document
                .getElementById(
                    `multa-${uid}`
                )
                ?.value || 0
            );

        if (valor <= 0) {

            alert(
                'Valor inválido.'
            );

            return;

        }

        const snap =
            await get(
                ref(
                    db,
                    `jogadores/${uid}`
                )
            );

        const player =
            snap.val();

        if (!player) return;

        const saldoAtual =
            Number(
                player.saldo || 0
            );

        const novaDivida =
            Number(
                player.divida || 0
            ) + valor;

        await update(
            ref(
                db,
                `jogadores/${uid}`
            ),
            {

                saldo:
                    Math.max(
                        0,
                        saldoAtual - valor
                    ),

                divida:
                    novaDivida

            }
        );

        await pushHistory(
            uid,
            'multa',
            valor,
            'Sanção aplicada pela reitoria'
        );

        await pushNotif(
            uid,
            `Você recebeu uma multa de ${money(valor)}.`
        );

        alert(
            'Multa aplicada.'
        );

    },

    /* =========================
       BONUS DIRETO
    ========================= */

    bonusDireto:
    async (uid) => {

        if (!adminGuard()) return;

        const valor =
            Number(
                document
                .getElementById(
                    `bonus-${uid}`
                )
                ?.value || 0
            );

        if (valor <= 0) {

            alert(
                'Valor inválido.'
            );

            return;

        }

        const snap =
            await get(
                ref(
                    db,
                    `jogadores/${uid}`
                )
            );

        const player =
            snap.val();

        if (!player) return;

        await update(
            ref(
                db,
                `jogadores/${uid}`
            ),
            {

                saldo:
                    Number(
                        player.saldo || 0
                    ) + valor

            }
        );

        await pushHistory(
            uid,
            'bonus_reitoria',
            valor,
            'Bônus financeiro acadêmico'
        );

        await pushNotif(
            uid,
            `A reitoria adicionou ${money(valor)} à sua conta.`
        );

        alert(
            'Bônus aplicado.'
        );

    },

    /* =========================
       FREEZE
    ========================= */

    toggleFreeze:
    async (
        uid,
        frozen
    ) => {

        if (!adminGuard()) return;

        await update(
            ref(
                db,
                `jogadores/${uid}`
            ),
            {

                contaCongelada:
                    !frozen

            }
        );

        await pushNotif(
            uid,
            !frozen
            ? 'Sua conta foi congelada pela reitoria.'
            : 'Sua conta foi desbloqueada pela reitoria.'
        );

        alert(
            !frozen
            ? 'Conta congelada.'
            : 'Conta desbloqueada.'
        );

    },

    /* =========================
       NOMEAR PRESIDENTE
    ========================= */

    nomearPresidente:
    async (
        fratId,
        uid
    ) => {

        if (!adminGuard()) return;

        const snap =
            await get(
                ref(
                    db,
                    `jogadores/${uid}`
                )
            );

        const player =
            snap.val();

        if (!player) {

            alert(
                'Jogador não encontrado.'
            );

            return;

        }

        await update(
            ref(
                db,
                `fraternidades/${fratId}`
            ),
            {

                presidente: uid,

                presidenteNome:
                    player.nome

            }
        );

        await pushNotif(
            uid,
            `Você foi nomeado presidente da fraternidade.`
        );

        alert(
            'Presidente definido.'
        );

    }

};

console.log(
    'Reitoria carregada.'
);
