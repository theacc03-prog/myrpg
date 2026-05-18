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
    FRATERNIDADES,
    money,
    esc
} from './utils.js';

/* =========================
   HELPERS
========================= */

function fratColor(id) {

    switch (id) {

        case 'montriel':
            return '#D4AF37';

        case 'veridian':
            return '#FFC0CB';

        case 'novaire':
            return '#1B5E20';

        case 'echelon':
            return '#C0C0C0';

        case 'velmora':
            return '#FF6D00';

        case 'aurelis':
            return '#8B0000';

        default:
            return '#C0C0C0';

    }

}

function canManageFrat(frat) {

    if (!window.uLog) return false;

    return (
        window.uLog.role === 'reitora' ||
        frat.presidente === window.uLog.id
    );

}

function renderMembers(membros) {

    if (!membros) {

        return `
            <div class="subtle">
                Nenhum membro registrado.
            </div>
        `;

    }

    return Object.values(membros)
    .map(m => {

        return `

        <div class="member-line">

            <strong>
                ${esc(m.nome || '---')}
            </strong>

            <div class="subtle">
                ${esc(m.cargo || 'membro')}
            </div>

        </div>

        `;

    })
    .join('');

}

/* =========================
   RENDER
========================= */

function renderFraternidades(data) {

    const box =
        document.getElementById('frat-list');

    if (!box) return;

    if (!Object.keys(data).length) {

        box.innerHTML = `
            <div class="subtle">
                Nenhuma fraternidade criada.
            </div>
        `;

        return;

    }

    box.innerHTML =
        Object.entries(data)
        .map(([id, f]) => {

            const color =
                fratColor(id);

            const manage =
                canManageFrat(f);

            return `

            <div class="card left frat-card"
                 style="
                    border-left:4px solid ${color}
                 ">

                <h2>
                    ${esc(f.nome || '---')}
                </h2>

                <div class="subtle">
                    ${esc(
                        f.descricao ||
                        ''
                    )}
                </div>

                <div class="hr"></div>

                <div class="frat-balance">

                    ${money(f.saldo || 0)}

                </div>

                <div class="subtle">

                    Mensalidade:
                    ${money(
                        f.mensalidade || 0
                    )}

                </div>

                <br>

                <strong>
                    Presidente:
                </strong>

                ${
                    esc(
                        f.presidenteNome ||
                        'Não definido'
                    )
                }

                <div class="hr"></div>

                <strong>
                    Membros
                </strong>

                <br><br>

                ${renderMembers(f.membros)}

                ${
                    manage
                    ? `
                        <div class="hr"></div>

                        <input
                            type="number"
                            id="mensalidade-${id}"
                            placeholder="Nova mensalidade">

                        <button
                            class="btn-gold"
                            onclick="
                                fraternidades.alterarMensalidade(
                                    '${id}'
                                )
                            ">

                            Alterar Mensalidade

                        </button>

                        <input
                            type="number"
                            id="frat-add-${id}"
                            placeholder="Adicionar saldo">

                        <button
                            class="btn-sec"
                            onclick="
                                fraternidades.addSaldo(
                                    '${id}'
                                )
                            ">

                            Adicionar Saldo

                        </button>

                        <input
                            type="number"
                            id="frat-remove-${id}"
                            placeholder="Remover saldo">

                        <button
                            class="btn-red"
                            onclick="
                                fraternidades.removeSaldo(
                                    '${id}'
                                )
                            ">

                            Remover Saldo

                        </button>
                    `
                    : ''
                }

            </div>

            `;

        })
        .join('');

}

/* =========================
   LISTENER
========================= */

onValue(
    ref(db, 'fraternidades'),
    snap => {

        renderFraternidades(
            snap.val() || {}
        );

    }
);

/* =========================
   SYSTEM
========================= */

window.fraternidades = {

    /* =========================
       ALTERAR MENSALIDADE
    ========================= */

    alterarMensalidade: async (
        fratId
    ) => {

        const valor =
            Number(
                document
                .getElementById(
                    `mensalidade-${fratId}`
                )
                ?.value || 0
            );

        if (valor < 0) {

            alert(
                'Valor inválido.'
            );

            return;

        }

        await update(
            ref(db, `fraternidades/${fratId}`),
            {
                mensalidade: valor
            }
        );

        alert(
            'Mensalidade alterada.'
        );

    },

    /* =========================
       ADICIONAR SALDO
    ========================= */

    addSaldo: async (fratId) => {

        const valor =
            Number(
                document
                .getElementById(
                    `frat-add-${fratId}`
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
                    `fraternidades/${fratId}`
                )
            );

        const frat =
            snap.val();

        if (!frat) return;

        await update(
            ref(
                db,
                `fraternidades/${fratId}`
            ),
            {

                saldo:
                    Number(
                        frat.saldo || 0
                    ) + valor

            }
        );

        alert(
            'Saldo adicionado.'
        );

    },

    /* =========================
       REMOVER SALDO
    ========================= */

    removeSaldo: async (
        fratId
    ) => {

        const valor =
            Number(
                document
                .getElementById(
                    `frat-remove-${fratId}`
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
                    `fraternidades/${fratId}`
                )
            );

        const frat =
            snap.val();

        if (!frat) return;

        const saldoAtual =
            Number(frat.saldo || 0);

        if (saldoAtual < valor) {

            alert(
                'Saldo insuficiente.'
            );

            return;

        }

        await update(
            ref(
                db,
                `fraternidades/${fratId}`
            ),
            {

                saldo:
                    saldoAtual - valor

            }
        );

        alert(
            'Saldo removido.'
        );

    },

    /* =========================
       NOMEAR PRESIDENTE
    ========================= */

    nomearPresidente: async (
        fratId,
        uid
    ) => {

        const snap =
            await get(
                ref(db, `jogadores/${uid}`)
            );

        const user =
            snap.val();

        if (!user) {

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
                    user.nome

            }
        );

        alert(
            'Presidente definido.'
        );

    },

    /* =========================
       PAGAMENTO MENSAL
    ========================= */

    cobrarMensalidades: async () => {

        const playersSnap =
            await get(
                ref(db, 'jogadores')
            );

        const fratsSnap =
            await get(
                ref(db, 'fraternidades')
            );

        const players =
            playersSnap.val() || {};

        const frats =
            fratsSnap.val() || {};

        for (
            const [uid, p]
            of Object.entries(players)
        ) {

            if (!p.fraternidade) {
                continue;
            }

            const frat =
                frats[p.fraternidade];

            if (!frat) {
                continue;
            }

            const mensalidade =
                Number(
                    frat.mensalidade || 0
                );

            const saldoAtual =
                Number(
                    p.saldo || 0
                );

            if (saldoAtual < mensalidade) {
                continue;
            }

            /* REMOVE PLAYER */

            await update(
                ref(db, `jogadores/${uid}`),
                {

                    saldo:
                        saldoAtual
                        - mensalidade

                }
            );

            /* ADD FRAT */

            await update(
                ref(
                    db,
                    `fraternidades/${p.fraternidade}`
                ),
                {

                    saldo:
                        Number(
                            frat.saldo || 0
                        ) + mensalidade

                }
            );

        }

        alert(
            'Mensalidades cobradas.'
        );

    }

};

console.log(
    'Fraternidades carregadas.'
);
