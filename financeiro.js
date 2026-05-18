export function aplicarBonus(valor, mult) {

    return Math.round(valor * mult);

}

export function aplicarPunicao(valor, mult) {

    return Math.round(valor * mult);

}

window.congelarConta = async (uid) => {

    console.log('Conta congelada:', uid);

};