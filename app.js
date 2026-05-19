import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    deleteUser
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {
    getDatabase,
    ref,
    set,
    get,
    update,
    onValue,
    push,
    remove
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBt7zjlI1P8lN4JxnxTe_erzNbfu1AHdfE",
    authDomain: "universityerarpg-6a29d.firebaseapp.com",
    databaseURL: "https://universityerarpg-6a29d-default-rtdb.firebaseio.com",
    projectId: "universityerarpg-6a29d",
    storageBucket: "universityerarpg-6a29d.firebasestorage.app",
    messagingSenderId: "912095174573",
    appId: "1:912095174573:web:e4591c65eeb9259ba9cb24"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getDatabase(fbApp);

const CURRENCY_SYMBOL = "SVR";

const SOCIAL_CLASSES = {
    herdeiro: {
        label: "Herdeiro",
        saldo: 3000,
        tagColor: "#D4AF37",
        tagText: "#111"
    },
    bolsista: {
        label: "Bolsista",
        saldo: 1500,
        tagColor: "#C0C0C0",
        tagText: "#111"
    }
};

const FRATERNITIES = {
    montriel: { nome: "Montriel", primary: "#050505", secondary: "#D4AF37", text: "#FFFFFF" },
    veridian: { nome: "Veridian", primary: "#F5A3C7", secondary: "#FFFFFF", text: "#111111" },
    novaire: { nome: "Novaire", primary: "#2A9D55", secondary: "#050505", text: "#FFFFFF" },
    echelon: { nome: "Echelon", primary: "#1D4ED8", secondary: "#C0C0C0", text: "#FFFFFF" },
    velmora: { nome: "Velmora", primary: "#6B3F2A", secondary: "#C46A2B", text: "#FFFFFF" },
    aurelis: { nome: "Aurelis", primary: "#FFFFFF", secondary: "#8B0000", text: "#111111" }
};

const subs = [];
let clockTimer = null;
let uLog = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const esc = (s = "") => String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const money = (n = 0) => `${CURRENCY_SYMBOL} ${Number(n || 0).toLocaleString("pt-BR")}`;
const nowClock = () => new Date().toLocaleTimeString("pt-BR");

function clearSubs() {
    while (subs.length) {
        const unsub = subs.pop();
        if (typeof unsub === "function") unsub();
    }
}

function listen(firebaseRef, callback) {
    const unsub = onValue(firebaseRef, callback);
    subs.push(unsub);
    return unsub;
}

function isAdmin(user = uLog) {
    return !!user && (user.role === "reitora" || user.isAdmin);
}

function getFraternityName(id) {
    return FRATERNITIES[id]?.nome || "Sem fraternidade";
}

function classTag(profile) {
    const data = SOCIAL_CLASSES[profile] || SOCIAL_CLASSES.bolsista;
    return {
        texto: data.label,
        cor: data.tagColor,
        textoCor: data.tagText,
        origem: "classe-social"
    };
}

function fraternityTag(fraternityId) {
    const frat = FRATERNITIES[fraternityId];
    return {
        texto: frat?.nome || "Sem fraternidade",
        cor: frat?.primary || "#C0C0C0",
        textoCor: frat?.text || "#000",
        origem: "fraternidade",
        fraternidade: fraternityId
    };
}

function tagMapWithIdentity(profile, fraternityId, existing = {}) {
    const kept = Object.fromEntries(
        Object.entries(existing || {}).filter(([, tag]) => tag.origem !== "classe-social" && tag.origem !== "fraternidade")
    );

    kept[`classe_${profile || "bolsista"}`] = classTag(profile || "bolsista");
    if (fraternityId) kept[`fraternidade_${fraternityId}`] = fraternityTag(fraternityId);

    return kept;
}

function renderFraternityOptions(selected = "", includeBlank = false) {
    const blank = includeBlank
        ? `<option value="">Sem fraternidade</option>`
        : `<option value="">Selecione a fraternidade</option>`;

    return blank + Object.entries(FRATERNITIES).map(([id, frat]) => (
        `<option value="${id}" ${selected === id ? "selected" : ""}>${esc(frat.nome)}</option>`
    )).join("");
}

function fillStaticFraternitySelects() {
    const reg = $("#reg-frat");
    if (reg) reg.innerHTML = renderFraternityOptions("", false);
}

function renderTags(tagsObj) {
    if (!tagsObj) return "";

    return Object.values(tagsObj)
        .map(tag => `<span class="tag" style="background:${esc(tag.cor || "#C0C0C0")}; color:${esc(tag.textoCor || "#000")}">${esc(tag.texto || tag.nome || "")}</span>`)
        .join("");
}

function renderInventory(invObj) {
    if (!invObj || !Object.keys(invObj).length) {
        return `<div class="subtle">Nenhum item.</div>`;
    }

    return Object.entries(invObj).map(([, item]) => `
        <div class="list-item">
            <strong>${esc(item.nome || "Item")}</strong><br>
            <span class="subtle">${esc(item.descricao || "")}</span>
        </div>
    `).join("");
}

function renderHistory(histObj) {
    if (!histObj || !Object.keys(histObj).length) return "Nenhuma ação registrada.";

    return Object.values(histObj).reverse().map(item => `
        <div class="list-item mini">
            <strong>${esc(item.tipo || "movimento")}</strong> · ${money(item.valor || 0)}<br>
            ${esc(item.desc || "")}<br>
            <span class="subtle">${new Date(item.ts || Date.now()).toLocaleString("pt-BR")}</span>
        </div>
    `).join("");
}

function renderRanking(playersObj) {
    if (!playersObj) return `<div class="subtle">Sem jogadores.</div>`;

    const players = Object.entries(playersObj)
        .map(([id, player]) => ({ id, ...player }))
        .sort((a, b) => Number(b.saldo || 0) - Number(a.saldo || 0));

    if (!players.length) return `<div class="subtle">Sem jogadores.</div>`;

    return players.map((player, index) => `
        <div class="card">
            <div class="rank-row">
                <strong>#${index + 1} ${esc(player.nome || "Sem nome")}</strong><br>
                <span class="subtle">${money(player.saldo || 0)}</span>
            </div>
        </div>
    `).join("");
}

function autoTitle(user) {
    if (!user) return "---";
    const saldo = Number(user.saldo || 0);
    const divida = Number(user.divida || 0);

    if (user.trancada) return "Conta Trancada";
    if (saldo >= 25000) return "Magnata de Laboratório";
    if (saldo >= 15000) return "Rei do Campus";
    if (saldo >= 8000) return "Elite de Prata";
    if (saldo >= 3000) return "Viciado em Sovereigns";
    if (saldo >= 1000) return "Acadêmico de Bolso Cheio";
    if (saldo >= 0) return "Sobrevivente da Cantina";
    if (divida > 0 && saldo < 0) return "Bolsista do Caos";
    return "Pobretão da ERA";
}

function financialMood(user) {
    if (!user) return "Status indisponível";
    const saldo = Number(user.saldo || 0);
    const divida = Number(user.divida || 0);

    if (user.trancada) return "conta trancada";
    if (saldo >= 10000) return "Magnata Acadêmico";
    if (saldo >= 5000) return "Nobre da Cátedra";
    if (saldo >= 2000) return "Promessa do Campus";
    if (saldo >= 500) return "Café, saldo e esperança";
    if (saldo >= 0) return "Sobrevivente da Cantina";
    if (divida > 0) return "Pobretão da ERA";
    return "Caso de Estudo";
}

function setStatusBanner(player) {
    const banner = $("#u-warning");
    const saldo = Number(player?.saldo || 0);
    const divida = Number(player?.divida || 0);

    if (!banner) return;

    if (player?.trancada) {
        banner.className = "status-banner danger";
        banner.textContent = "Conta trancada pela reitoria. Ações financeiras bloqueadas.";
        return;
    }

    if (saldo < 0) {
        banner.className = "status-banner danger";
        banner.textContent = "Pobretão da ERA em observação administrativa.";
        return;
    }

    if (divida > 0) {
        banner.className = "status-banner warning";
        banner.textContent = "Há dívida ativa no sistema financeiro.";
        return;
    }

    banner.className = "status-banner good";
    banner.textContent = "Conta saudável. O campus respeita sua presença financeira.";
}

async function ensureFraternitiesSeeded() {
    const snap = await get(ref(db, "fraternidades"));
    const existing = snap.val() || {};
    const updates = {};

    for (const [id, frat] of Object.entries(FRATERNITIES)) {
        if (!existing[id]) {
            updates[`fraternidades/${id}`] = {
                nome: frat.nome,
                primary: frat.primary,
                secondary: frat.secondary,
                text: frat.text,
                saldo: 0,
                mensalidade: 0,
                presidenteId: "",
                historico: {},
                compras: {}
            };
        }
    }

    if (Object.keys(updates).length) {
        await update(ref(db), updates);
    }
}

async function pushAudit(dados) {
    return push(ref(db, "auditoria"), {
        ...dados,
        ts: Date.now()
    });
}

async function pushHistory(uid, tipo, valor, desc) {
    return push(ref(db, `jogadores/${uid}/historico`), {
        tipo,
        valor: Number(valor || 0),
        desc: desc || "",
        ts: Date.now()
    });
}

function refreshMyProfileUI(player) {
    $("#u-nome").innerText = player.nome || "---";
    $("#u-saldo").innerText = money(player.saldo || 0);
    $("#u-foto").src = player.foto || "https://placehold.co/150/0A192F/C0C0C0?text=ERA";
    $("#u-bio").innerText = player.bio || "Membro da Sovereign Society.";
    $("#u-title").innerText = autoTitle(player);
    $("#u-tags").innerHTML = renderTags(player.tags);
    $("#fin-divida").innerText = money(player.divida || 0);
    $("#u-status-mini").innerText = financialMood(player);
    $("#u-divida-mini").innerText = money(player.divida || 0);
    $("#u-frat-mini").innerText = getFraternityName(player.fraternidade);
    $("#btn-adm").style.display = isAdmin({ ...player, id: auth.currentUser?.uid }) ? "inline-block" : "none";
    setStatusBanner(player);
}

function bindPlayerStreams(uid) {
    listen(ref(db, `jogadores/${uid}/notificacoes`), snap => {
        const notifs = snap.val() || {};
        const box = $("#notif-list");
        if (!box) return;

        box.innerHTML = Object.values(notifs).reverse().map(item => `
            <div class="comment-box">
                <div class="comment-meta">${new Date(item.ts || Date.now()).toLocaleString("pt-BR")}</div>
                ${esc(item.msg || "")}
            </div>
        `).join("") || `<div class="subtle">Nenhuma notificação.</div>`;
    });

    listen(ref(db, `jogadores/${uid}/historico`), snap => {
        const box = $("#u-history");
        if (box) box.innerHTML = renderHistory(snap.val());
    });

    listen(ref(db, `jogadores/${uid}/mochila`), snap => {
        const box = $("#u-inv");
        if (box) box.innerHTML = renderInventory(snap.val());
    });
}

function bindGlobalStreams() {
    listen(ref(db, "jogadores"), snap => {
        const players = snap.val() || {};
        const rankEl = $("#rank-list");
        const destSelect = $("#tr-dest");

        if (rankEl) rankEl.innerHTML = renderRanking(players);

        if (destSelect) {
            destSelect.innerHTML = "<option value=''>Selecionar destinatário...</option>" +
                Object.entries(players)
                    .filter(([uid]) => !uLog || uid !== uLog.id)
                    .map(([uid, player]) => `<option value="${uid}">${esc(player.nome || "Sem nome")}</option>`)
                    .join("");
        }
    });
}

function showTab(id, button) {
    $$(".tab-content").forEach(tab => tab.classList.add("hidden"));
    $$(".nav-btn").forEach(navButton => navButton.classList.remove("active"));
    $(`#${id}`)?.classList.remove("hidden");
    button?.classList.add("active");
}

async function handleLogin() {
    const email = $("#email").value.trim();
    const password = $("#pass").value.trim();

    if (!email || !password) {
        alert("Preencha e-mail e senha.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        alert("Acesso negado: " + err.message);
    }
}

async function handleRegister() {
    const nome = $("#reg-name").value.trim();
    const email = $("#reg-email").value.trim();
    const password = $("#reg-pass").value.trim();
    const socialClass = $("#reg-class").value;
    const fraternityId = $("#reg-frat").value;

    if (!nome || !email || !password || !socialClass || !fraternityId) {
        alert("Preencha nome, e-mail, senha, origem financeira e fraternidade.");
        return;
    }

    try {
        await ensureFraternitiesSeeded();

        const classData = SOCIAL_CLASSES[socialClass] || SOCIAL_CLASSES.bolsista;
        const res = await createUserWithEmailAndPassword(auth, email, password);

        await set(ref(db, `jogadores/${res.user.uid}`), {
            nome,
            saldo: classData.saldo,
            divida: 0,
            role: "aluno",
            foto: "",
            bio: "",
            origemFinanceira: socialClass,
            fraternidade: fraternityId,
            trancada: false,
            tags: tagMapWithIdentity(socialClass, fraternityId),
            mochila: {},
            fixos: {},
            variaveis: {},
            percentuais: {},
            academicos: {},
            punicoes: {},
            historico: {},
            notificacoes: {},
            emprestimos: {},
            title: "Estudante Financeiro",
            criadoEm: Date.now()
        });

        await update(ref(db), {
            [`fraternidades/${fraternityId}/membros/${res.user.uid}`]: true
        });

        await pushAudit({
            tipo: "registro",
            user: nome,
            msg: `Novo aluno registrado como ${classData.label} em ${getFraternityName(fraternityId)}`
        });
    } catch (err) {
        alert(err.message);
    }
}

async function handleLogout() {
    await signOut(auth);
    clearSubs();
    if (clockTimer) clearInterval(clockTimer);
    location.reload();
}

async function updateProfile() {
    if (!auth.currentUser) return;

    const up = {};
    const nome = $("#set-nome").value.trim();
    const fotoUrl = $("#set-foto").value.trim();
    const bio = $("#set-bio").value.trim();

    if (nome) up.nome = nome;
    if (fotoUrl) up.foto = fotoUrl;
    if (bio) up.bio = bio;

    await update(ref(db, `jogadores/${auth.currentUser.uid}`), up);
    await pushAudit({
        tipo: "perfil",
        user: uLog?.nome || auth.currentUser.email,
        msg: "Perfil atualizado"
    });

    alert("Perfil atualizado.");
}

async function deleteMe() {
    if (!auth.currentUser) return;
    if (!confirm("Tem certeza que deseja excluir sua conta?")) return;

    const uid = auth.currentUser.uid;

    try {
        await remove(ref(db, `jogadores/${uid}`));
        if (uLog?.fraternidade) {
            await remove(ref(db, `fraternidades/${uLog.fraternidade}/membros/${uid}`));
        }
        await pushAudit({
            tipo: "exclusao",
            user: uLog?.nome || auth.currentUser.email,
            msg: "Conta excluída pelo próprio usuário"
        });
        await deleteUser(auth.currentUser);
        clearSubs();
        location.reload();
    } catch {
        alert("Para excluir, talvez seja necessário entrar novamente e tentar de novo.");
    }
}

async function transferirDinheiro() {
    const destinationId = $("#tr-dest").value;
    const value = parseInt($("#tr-val").value, 10);
    const msg = $("#tr-msg").value.trim();

    if (!uLog || !destinationId || !value || value <= 0) {
        alert("Preencha destinatário e valor.");
        return;
    }

    if (destinationId === uLog.id) {
        alert("Não dá para transferir para si mesmo.");
        return;
    }

    if (value > Number(uLog.saldo || 0)) {
        alert("Saldo insuficiente.");
        return;
    }

    const destinationSnap = await get(ref(db, `jogadores/${destinationId}`));
    const destination = destinationSnap.val();

    if (!destination) {
        alert("Jogador inválido.");
        return;
    }

    await update(ref(db, `jogadores/${uLog.id}`), {
        saldo: Number(uLog.saldo || 0) - value
    });

    await update(ref(db, `jogadores/${destinationId}`), {
        saldo: Number(destination.saldo || 0) + value
    });

    await pushHistory(uLog.id, "transferência enviada", -value, `${msg || "Transferência"} para ${destination.nome}`);
    await pushHistory(destinationId, "transferência recebida", value, `${msg || "Transferência"} de ${uLog.nome}`);
    await pushAudit({
        tipo: "transferencia",
        de: uLog.nome,
        para: destination.nome,
        valor: value,
        msg: msg || "Transferência entre jogadores"
    });

    $("#tr-val").value = "";
    $("#tr-msg").value = "";
    $("#transfer-feedback").classList.remove("hidden");
    $("#transfer-feedback").textContent = "Transferência concluída com sucesso.";
}

function bindEvents() {
    $$(".nav-btn").forEach(button => {
        button.addEventListener("click", () => showTab(button.dataset.tab, button));
    });

    $("#login-button")?.addEventListener("click", handleLogin);
    $("#register-button")?.addEventListener("click", handleRegister);
    $("#settings-button")?.addEventListener("click", () => $("#settings-area").classList.toggle("hidden"));
    $("#save-profile-button")?.addEventListener("click", updateProfile);
    $("#logout-button")?.addEventListener("click", handleLogout);
    $("#delete-account-button")?.addEventListener("click", deleteMe);
    $("#transfer-money-button")?.addEventListener("click", transferirDinheiro);

    $("#show-register")?.addEventListener("click", () => {
        $("#register-box")?.scrollIntoView({ behavior: "smooth", block: "center" });
        $("#reg-name")?.focus();
    });

    $("#show-login")?.addEventListener("click", () => {
        $("#login-box")?.scrollIntoView({ behavior: "smooth", block: "center" });
        $("#email")?.focus();
    });

    $$("[data-close-modal]").forEach(button => {
        button.addEventListener("click", () => {
            $(`#${button.dataset.closeModal}`).style.display = "none";
        });
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            $("#profile-modal").style.display = "none";
            $("#image-modal").style.display = "none";
        }
    });
}

window.app = {
    showTab,
    handleLogin,
    handleRegister,
    handleLogout,
    updateProfile,
    deleteMe,
    transferirDinheiro,
    toggleSettings: () => $("#settings-area")?.classList.toggle("hidden"),
    closeModal: (id) => {
        const modal = $(`#${id}`);
        if (modal) modal.style.display = "none";
    },
    openImageModal: (src) => {
        $("#image-modal-img").src = src;
        $("#image-modal").style.display = "flex";
    }
};

onAuthStateChanged(auth, user => {
    clearSubs();

    if (clockTimer) {
        clearInterval(clockTimer);
        clockTimer = null;
    }

    if (user) {
        $("#auth-screen").classList.add("hidden");
        $("#app-screen").classList.remove("hidden");
        $("#main-nav").style.display = "flex";

        listen(ref(db, `jogadores/${user.uid}`), snap => {
            const player = snap.val();
            if (!player) return;

            uLog = { id: user.uid, ...player };
            refreshMyProfileUI(player);

            $("#set-nome").value = player.nome || "";
            $("#set-foto").value = player.foto || "";
            $("#set-bio").value = player.bio || "";
        });

        bindPlayerStreams(user.uid);
        bindGlobalStreams();

        clockTimer = setInterval(() => {
            const clock = $("#clock");
            if (clock) clock.innerText = nowClock();
        }, 1000);
    } else {
        uLog = null;
        $("#auth-screen").classList.remove("hidden");
        $("#app-screen").classList.add("hidden");
        $("#main-nav").style.display = "none";
    }
});

fillStaticFraternitySelects();
bindEvents();
