import { db } from './firebase-config.js';
import { ref, get, update, push } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

const btnCycle = document.getElementById('btn-cycle');
if(btnCycle) {
    btnCycle.onclick = async () => {
        if(!confirm("Girar ciclo?")) return;
        const snap = await get(ref(db, 'jogadores'));
        const plys = snap.val();
        const batch = {};
        for(let id in plys) {
            let nS = (plys[id].saldo || 0);
            if(plys[id].fixos) Object.values(plys[id].fixos).forEach(f => nS += f.valor);
            batch[`jogadores/${id}/saldo`] = nS;
        }
        await update(ref(db), batch);
        alert("Ciclo Concluído!");
    };
}
