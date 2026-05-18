import {
    money,
    esc
} from './utils.js';

/* =========================
   TOAST
========================= */

function toast(
    text = '',
    type = 'normal'
) {

    let box =
        document.getElementById('toast-box');

    if (!box) {

        box =
            document.createElement('div');

        box.id = 'toast-box';

        box.style.position = 'fixed';

        box.style.top = '20px';

        box.style.right = '20px';

        box.style.zIndex = '99999';

        box.style.display = 'flex';

        box.style.flexDirection = 'column';

        box.style.gap = '10px';

        document.body.appendChild(box);

    }

    const t =
        document.createElement('div');

    t.innerText = text;

    t.style.padding = '12px 15px';

    t.style.borderRadius = '10px';

    t.style.minWidth = '220px';

    t.style.fontSize = '13px';

    t.style.fontWeight = '600';

    t.style.backdropFilter = 'blur(10px)';

    t.style.boxShadow =
        '0 10px 30px rgba(0,0,0,.35)';

    t.style.animation =
        'fadeToast .25s ease';

    switch (type) {

        case 'good':

            t.style.background =
                '#1D4D42';

            t.style.color =
                '#B8FFEA';

            break;

        case 'danger':

            t.style.background =
                '#5B1616';

            t.style.color =
                '#FFD4D4';

            break;

        case 'warning':

            t.style.background =
                '#5A4311';

            t.style.color =
                '#FFE9B3';

            break;

        default:

            t.style.background =
                '#13294E';

            t.style.color =
                '#FFFFFF';

    }

    box.appendChild(t);

    setTimeout(() => {

        t.style.opacity = '0';

        t.style.transform =
            'translateY(-8px)';

        t.style.transition =
            '.25s';

    }, 2600);

    setTimeout(() => {

        t.remove();

    }, 3000);

}

/* =========================
   MODAL
========================= */

function openModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.style.display = 'flex';

}

function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.style.display = 'none';

}

/* =========================
   LOADING
========================= */

function loading(state = true) {

    let overlay =
        document.getElementById(
            'loading-overlay'
        );

    if (!overlay) {

        overlay =
            document.createElement('div');

        overlay.id =
            'loading-overlay';

        overlay.style.position =
            'fixed';

        overlay.style.inset = '0';

        overlay.style.background =
            'rgba(0,0,0,.72)';

        overlay.style.display =
            'flex';

        overlay.style.alignItems =
            'center';

        overlay.style.justifyContent =
            'center';

        overlay.style.zIndex =
            '999999';

        overlay.innerHTML = `

            <div style="
                background:#102038;
                padding:25px 35px;
                border-radius:14px;
                border:1px solid rgba(255,255,255,.1);
                font-family:Cinzel;
                letter-spacing:2px;
            ">
                ERA SYSTEM
            </div>

        `;

        document.body.appendChild(
            overlay
        );

    }

    overlay.style.display =
        state
        ? 'flex'
        : 'none';

}

/* =========================
   PROFILE CARD
========================= */

function profileCard(player = {}) {

    return `

    <div class="card">

        <img
            src="${
                esc(player.foto || '')
            }"
            class="profile-photo">

        <h2 class="tab-title">

            ${esc(player.nome || '---')}

        </h2>

        <div>

            ${
                renderTags(
                    player.tags || {}
                )
            }

        </div>

        <div class="balance">

            ${
                money(
                    player.saldo || 0
                )
            }

        </div>

        <div class="subtle">

            ${
                esc(
                    player.bio ||
                    ''
                )
            }

        </div>

    </div>

    `;

}

/* =========================
   RENDER TAGS
========================= */

function renderTags(tags = {}) {

    return Object.values(tags)
    .map(tag => {

        return `

        <span
            class="tag"
            style="
                background:${tag.cor};
            ">

            ${
                esc(tag.texto || '')
            }

        </span>

        `;

    })
    .join('');

}

/* =========================
   CONFIRM
========================= */

function confirmAction(
    text,
    callback
) {

    const ok =
        confirm(text);

    if (ok && callback) {
        callback();
    }

}

/* =========================
   EMPTY STATE
========================= */

function emptyState(
    text = 'Nada encontrado.'
) {

    return `

    <div class="subtle"
         style="
            padding:10px 0
         ">

        ${esc(text)}

    </div>

    `;

}

/* =========================
   MONEY BADGE
========================= */

function moneyBadge(v = 0) {

    return `

    <span style="
        display:inline-block;
        padding:5px 10px;
        border-radius:999px;
        background:rgba(212,175,55,.12);
        border:1px solid rgba(212,175,55,.3);
        color:#D4AF37;
        font-size:11px;
        font-weight:bold;
    ">

        ${money(v)}

    </span>

    `;

}

/* =========================
   TABLE
========================= */

function simpleTable(
    headers = [],
    rows = []
) {

    return `

    <div style="
        overflow:auto;
    ">

        <table style="
            width:100%;
            border-collapse:collapse;
        ">

            <thead>

                <tr>

                    ${headers.map(h => `

                        <th style="
                            text-align:left;
                            padding:10px;
                            border-bottom:1px solid rgba(255,255,255,.08);
                            font-size:12px;
                        ">

                            ${esc(h)}

                        </th>

                    `).join('')}

                </tr>

            </thead>

            <tbody>

                ${rows.map(r => `

                    <tr>

                        ${r.map(c => `

                            <td style="
                                padding:10px;
                                border-bottom:1px solid rgba(255,255,255,.05);
                                font-size:12px;
                            ">

                                ${c}

                            </td>

                        `).join('')}

                    </tr>

                `).join('')}

            </tbody>

        </table>

    </div>

    `;

}

/* =========================
   GLOBAL
========================= */

window.toast = toast;

window.openModal = openModal;

window.closeModal = closeModal;

window.loading = loading;

window.profileCard = profileCard;

window.renderTags = renderTags;

window.confirmAction =
    confirmAction;

window.emptyState =
    emptyState;

window.moneyBadge =
    moneyBadge;

window.simpleTable =
    simpleTable;

/* =========================
   STYLE
========================= */

const style =
document.createElement('style');

style.innerHTML = `

@keyframes fadeToast {

    from {

        opacity:0;

        transform:
            translateY(-10px);

    }

    to {

        opacity:1;

        transform:
            translateY(0);

    }

}

`;

document.head.appendChild(style);

console.log(
    'UI carregada.'
);
