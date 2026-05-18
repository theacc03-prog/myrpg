import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

/* =========================
   FIREBASE CONFIG
========================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyBt7zjlI1P8lN4JxnxTe_erzNbfu1AHdfE",

    authDomain:
        "universityerarpg-6a29d.firebaseapp.com",

    databaseURL:
        "https://universityerarpg-6a29d-default-rtdb.firebaseio.com",

    projectId:
        "universityerarpg-6a29d",

    storageBucket:
        "universityerarpg-6a29d.firebasestorage.app",

    messagingSenderId:
        "912095174573",

    appId:
        "1:912095174573:web:e4591c65eeb9259ba9cb24"

};

/* =========================
   INITIALIZE
========================= */

const fbApp =
    initializeApp(firebaseConfig);

/* =========================
   SERVICES
========================= */

const auth =
    getAuth(fbApp);

const db =
    getDatabase(fbApp);

/* =========================
   EXPORTS
========================= */

export {
    auth,
    db,
    fbApp
};

console.log(
    'Firebase conectado.'
);
