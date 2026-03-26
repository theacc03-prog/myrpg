import { db } from './firebase-config.js';
import { ref, update, get, push, remove, onValue } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// Função de Giro de Ciclo
window.girarCiclo = async () => {
    if(!confirm("Reitora, deseja processar o Giro de Ciclo agora?")) return;
    
    const snap = await get(ref(db, 'jogadores'));
    const plys = snap.val();
    const batch = {};

    for(let id in plys) {
        let p = plys[id];
        let nSaldo = p.saldo || 0;

        // Processa fixos
        if(p.fixos) {
            Object.values(p.fixos).forEach(f => nSaldo += f.valor);
        }

        batch[`jogadores/${id}/saldo`] = nSaldo;
        // Notifica o aluno
        const notifRef = push(ref(db, `jogadores/${id}/notificacoes`));
        batch[`jogadores/${id}/notificacoes/${notifRef.key}`] = {
            msg: "🏛️ <b>Ciclo Concluído:</b> Seus salários e despesas foram processados."
        };
    }

    await update(ref(db), batch);
    alert("Ciclo finalizado com sucesso!");
};

// Carregar lista de auditoria
onValue(ref(db, 'auditoria'), snap => {
    const auditDiv = document.getElementById('adm-audit-feed');
    if(!auditDiv) return;
    let h = "";
    if(snap.val()) {
        Object.values(snap.val()).reverse().forEach(log => {
            h += `<div style="border-bottom:1px solid #111; padding:5px">${log.msg}</div>`;
        });
    }
    auditDiv.innerHTML = h || "Nenhuma movimentação suspeita.";
});
