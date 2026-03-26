import { db, auth } from './firebase-config.js';
import { ref, update, get, push, remove } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// Função de Giro de Ciclo (O Coração da Reitoria)
export async function girarCicloAcademico() {
    const confirmacao = confirm("Deseja processar o Giro de Ciclo? Isso cobrará contas e pagará salários.");
    if (!confirmacao) return;

    const snapshot = await get(ref(db, 'jogadores'));
    const jogadores = snapshot.val();
    const updates = {};

    for (let id in jogadores) {
        let p = jogadores[id];
        let novoSaldo = p.saldo || 0;

        // Processar salários e despesas fixas
        if (p.fixos) {
            Object.values(p.fixos).forEach(f => {
                novoSaldo += f.valor;
            });
        }
        
        updates[`jogadores/${id}/saldo`] = novoSaldo;
    }

    await update(ref(db), updates);
    alert("Ciclo processado com sucesso, Reitora!");
}

// Lógica para Adicionar Vagas, Notícias e gerenciar Itens do Mercado...
