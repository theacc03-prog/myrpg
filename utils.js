/* =========================
   FRATERNIDADES
========================= */

export const FRATERNIDADES = {

    montriel: {

        nome: 'Montriel',

        cor: '#D4AF37',

        fundo: '#000000',

        descricao:
            'Aristocracia, influência e tradição.'

    },

    veridian: {

        nome: 'Veridian',

        cor: '#FFC0CB',

        fundo: '#FFFFFF',

        descricao:
            'Prestígio social e glamour absoluto.'

    },

    novaire: {

        nome: 'Novaire',

        cor: '#1B5E20',

        fundo: '#000000',

        descricao:
            'Ambição silenciosa e inteligência estratégica.'

    },

    echelon: {

        nome: 'Echelon',

        cor: '#C0C0C0',

        fundo: '#0A192F',

        descricao:
            'Poder político e domínio institucional.'

    },

    velmora: {

        nome: 'Velmora',

        cor: '#FF6D00',

        fundo: '#5D4037',

        descricao:
            'Luxo extravagante e influência econômica.'

    },

    aurelis: {

        nome: 'Aurelis',

        cor: '#8B0000',

        fundo: '#FFFFFF',

        descricao:
            'Prestígio extremo e supremacia acadêmica.'

    }

};

/* =========================
   MONEY
========================= */

export function money(
    value = 0
) {

    return `${Number(
        value || 0
    ).toLocaleString(
        'pt-BR'
    )} CR`;

}

/* =========================
   ID
========================= */

export function makeId() {

    return (

        Date.now().toString(36) +

        Math.random()
        .toString(36)
        .substring(2, 9)

    );

}

/* =========================
   ESCAPE HTML
========================= */

export function esc(text = '') {

    return String(text)

    .replaceAll('&', '&amp;')

    .replaceAll('<', '&lt;')

    .replaceAll('>', '&gt;')

    .replaceAll('"', '&quot;')

    .replaceAll("'", '&#039;');

}

/* =========================
   FORMAT DATE
========================= */

export function formatDate(
    ts
) {

    if (!ts) return '---';

    const d =
        new Date(ts);

    return d.toLocaleDateString(
        'pt-BR',
        {

            day: '2-digit',

            month: '2-digit',

            year: 'numeric',

            hour: '2-digit',

            minute: '2-digit'

        }
    );

}

/* =========================
   RANDOM
========================= */

export function rand(
    min = 0,
    max = 100
) {

    return Math.floor(
        Math.random()
        * (max - min + 1)
    ) + min;

}

/* =========================
   CLAMP
========================= */

export function clamp(
    num,
    min,
    max
) {

    return Math.min(
        Math.max(num, min),
        max
    );

}

/* =========================
   STATUS PLAYER
========================= */

export function financialRank(
    saldo = 0
) {

    saldo =
        Number(saldo || 0);

    if (saldo >= 50000) {
        return 'Magnata';
    }

    if (saldo >= 20000) {
        return 'Elite';
    }

    if (saldo >= 7000) {
        return 'Influente';
    }

    if (saldo >= 2500) {
        return 'Estável';
    }

    if (saldo >= 0) {
        return 'Acadêmico';
    }

    return 'Endividado';

}

/* =========================
   TAGS
========================= */

export function renderTags(
    tags = {}
) {

    return Object.values(tags)

    .map(tag => {

        return `

        <span
            class="tag"
            style="
                background:${tag.cor};
            ">

            ${esc(
                tag.texto || ''
            )}

        </span>

        `;

    })

    .join('');

}

/* =========================
   DEFAULT FRATERNIDADES
========================= */

export const DEFAULT_FRATS = {

    montriel: {

        nome: 'Montriel',

        saldo: 0,

        mensalidade: 250,

        presidente: '',

        presidenteNome: '',

        descricao:
            FRATERNIDADES.montriel.descricao,

        membros: {}

    },

    veridian: {

        nome: 'Veridian',

        saldo: 0,

        mensalidade: 250,

        presidente: '',

        presidenteNome: '',

        descricao:
            FRATERNIDADES.veridian.descricao,

        membros: {}

    },

    novaire: {

        nome: 'Novaire',

        saldo: 0,

        mensalidade: 250,

        presidente: '',

        presidenteNome: '',

        descricao:
            FRATERNIDADES.novaire.descricao,

        membros: {}

    },

    echelon: {

        nome: 'Echelon',

        saldo: 0,

        mensalidade: 250,

        presidente: '',

        presidenteNome: '',

        descricao:
            FRATERNIDADES.echelon.descricao,

        membros: {}

    },

    velmora: {

        nome: 'Velmora',

        saldo: 0,

        mensalidade: 250,

        presidente: '',

        presidenteNome: '',

        descricao:
            FRATERNIDADES.velmora.descricao,

        membros: {}

    },

    aurelis: {

        nome: 'Aurelis',

        saldo: 0,

        mensalidade: 250,

        presidente: '',

        presidenteNome: '',

        descricao:
            FRATERNIDADES.aurelis.descricao,

        membros: {}

    }

};

/* =========================
   STARTUP
========================= */

console.log(
    'Utils carregado.'
);
