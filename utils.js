export function money(valor = 0) {

    return `${Number(valor).toLocaleString('pt-BR')} CR`;

}

export function makeId() {

    return `${Date.now()}_${Math.random()}`;

}

export const FRATERNIDADES = {

    montriel: {
        nome: 'Montriel',
        cor: '#D4AF37'
    },

    veridian: {
        nome: 'Veridian',
        cor: '#FFC0CB'
    },

    novaire: {
        nome: 'Novaire',
        cor: '#1B5E20'
    },

    echelon: {
        nome: 'Echelon',
        cor: '#C0C0C0'
    },

    velmora: {
        nome: 'Velmora',
        cor: '#FF6D00'
    },

    aurelis: {
        nome: 'Aurelis',
        cor: '#8B0000'
    }

};