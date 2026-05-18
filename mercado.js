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
   MERCADO PADRÃO
========================= */

const MARKET_ITEMS = {

    relogio_luxo: {

        nome: 'Relógio Luxo Imperial',

        preco: 1200,

        descricao:
            'Aumenta o prestígio social do estudante.',

        raridade: 'Raro'

    },

    carro_esportivo: {

        nome: 'Veículo Esportivo',

        preco: 8500,

        descricao:
            'Símbolo absoluto de influência acadêmica.',

        raridade: 'Lendário'

    },

    notebook_premium: {

        nome: 'Notebook Premium',

        preco: 2500,

        descricao:
            'Equipamento acadêmico de elite.',

        raridade: 'Comum'

    },

    convite_gala: {

        nome: 'Convite para Gala Privado',

        preco: 4000,

        descricao:
            'Permite acesso a eventos exclusivos.',

        raridade: 'Épico'

    },

    cobertura_luxo: {

        nome: 'Cobertura Luxuosa',

        preco: 25000,

        descricao:
            'Residência da elite universitária.',

        raridade: 'Mítico'

    }

};

/* =========================
   MERCADO ILEGAL
========================= */

const BLACK_MARKET = {

    identidade_falsa: {

        nome: 'Identidade Acadêmica Falsa',

        preco: 6000,

        descricao:
            'Altera registros universitários.',

        raridade: 'Restrito'

    },

    dados_sigilosos: {

        nome: 'Arquivos Sigilosos',

        preco: 10000,

        descricao:
            'Informações comprometedoras.',

        raridade: 'Ultra Restrito'

    },

    influencia_politica: {

        nome: 'Influência Política',

        preco: 20000,

        descricao:
            'Manipulação institucional avançada.',

        raridade: 'Lendário'

    }

};

/* =========================
   HELPERS
========================= */

function itemCard(id, item, ilegal = false) {

    return `

    <div class="card left">

        <h3>
            ${esc(item.nome)}
        </h3>

        <div class="subtle">

            ${esc(item.raridade)}

        </div>

        <div class="hr"></div>

        <div>

            ${esc(item.descricao)}

        </div>

        <br>

        <div class="balance"
             style="
                font-size:1.2rem
             ">

            ${money(item.preco)}

        </div>

        <button
            class="${
                ilegal
                ? 'btn-red'
                : 'btn-gold'
            }"
            onclick="
                mercado.comprar(
                    '${id}',
                    ${ilegal}
                )
            ">

            Comprar

        </button>

    </div>

    `;

}

function renderMarket() {

    const box =
        document.getElementById('market-list');

    if (!box) return;

    box.innerHTML = `

        <div class="grid-2">

            ${Object.entries(MARKET_ITEMS)
            .map(([id, item]) =>
                itemCard(id, item)
            )
            .join('')}

        </div>

        <div class="hr"></div>

        <h2 class="tab-title">
            Mercado Restrito
        </h2>

        <div class="grid-2">

            ${Object.entries(BLACK_MARKET)
            .map(([id, item]) =>
                itemCard(id, item, true)
            )
            .join('')}

        </div>

    `;

}

/* =========================
   INVENTÁRIO
========================= */

function addInventoryItem(
    uid,
    itemId,
    item
) {

    return push(
        ref(
            db,
            `jogadores/${uid}/mochila`
        ),
        {

            itemId,

            nome: item.nome,

            raridade:
                item.raridade || 'Comum',

            preco:
                item.preco || 0,

            ts: Date.now()

        }
    );

}

function pushHistory(
    uid,
    item
) {

    return push(
        ref(
            db,
            `jogadores/${uid}/historico`
        ),
        {

            tipo: 'compra',

            item: item.nome,

            valor: item.preco,

            ts: Date.now()

        }
    );

}

function pushNotif(
    uid,
    item
) {

    return push(
        ref(
            db,
            `jogadores/${uid}/notificacoes`
        ),
        {

            msg:
                `Compra realizada: ${item.nome}`,

            ts: Date.now()

        }
    );

}

/* =========================
   MERCADO
========================= */

window.mercado = {

    /* =========================
       COMPRAR
    ========================= */

    comprar: async (
        itemId,
        ilegal = false
    ) => {

        if (!window.uLog) return;

        if (
            window.uLog.contaCongelada
        ) {

            alert(
                'Sua conta está congelada.'
            );

            return;

        }

        const market =
            ilegal
            ? BLACK_MARKET
            : MARKET_ITEMS;

        const item =
            market[itemId];

        if (!item) {

            alert(
                'Item inválido.'
            );

            return;

        }

        const saldoAtual =
            Number(
                window.uLog.saldo || 0
            );

        if (
            saldoAtual < item.preco
        ) {

            alert(
                'Saldo insuficiente.'
            );

            return;

        }

        /* REMOVE MONEY */

        await update(
            ref(
                db,
                `jogadores/${window.uLog.id}`
            ),
            {

                saldo:
                    saldoAtual
                    - item.preco

            }
        );

        /* INVENTÁRIO */

        await addInventoryItem(
            window.uLog.id,
            itemId,
            item
        );

        /* HISTÓRICO */

        await pushHistory(
            window.uLog.id,
            item
        );

        /* NOTIF */

        await pushNotif(
            window.uLog.id,
            item
        );

        alert(
            'Compra realizada.'
        );

    },

    /* =========================
       VENDER ITEM
    ========================= */

    vender: async (
        invId,
        valor
    ) => {

        if (!window.uLog) return;

        const saldoAtual =
            Number(
                window.uLog.saldo || 0
            );

        await update(
            ref(
                db,
                `jogadores/${window.uLog.id}`
            ),
            {

                saldo:
                    saldoAtual
                    + Number(valor || 0)

            }
        );

        await remove(
            ref(
                db,
                `jogadores/${window.uLog.id}/mochila/${invId}`
            )
        );

        alert(
            'Item vendido.'
        );

    }

};

/* =========================
   LOAD
========================= */

renderMarket();

console.log(
    'Mercado carregado.'
);
