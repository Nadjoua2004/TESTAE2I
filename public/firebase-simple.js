// Firebase SDK v9 - Version SIMPLE sans modules
// Chargement automatique depuis CDN

(function() {
    // Configuration Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyCm32jmky9Hth1muQ8gh58qqM63joqVJqU",
        authDomain: "ae2i-b6c7f.firebaseapp.com",
        projectId: "ae2i-b6c7f",
        storageBucket: "ae2i-b6c7f.firebasestorage.app",
        messagingSenderId: "952653537004",
        appId: "1:952653537004:web:7943230cdf74baa16a4fc9",
        measurementId: "G-WTYQ12916Z"
    };

    // Attendre que la page soit chargée
    window.addEventListener('DOMContentLoaded', function() {
        // Charger Firebase SDK depuis CDN
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
        script.onload = function() {
            // Charger les services nécessaires
            const script2 = document.createElement('script');
            script2.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js';
            script2.onload = function() {
                const script3 = document.createElement('script');
                script3.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js';
                script3.onload = function() {
                    // Initialiser Firebase (version compatibilité)
                    const app = firebase.initializeApp(firebaseConfig);
                    const auth = firebase.auth();
                    const db = firebase.firestore();
                    
                    // Exposer globalement
                    window.firebaseApp = app;
                    window.firebaseAuth = auth;
                    window.firebaseDB = db;
                    window.firebase = firebase;
                    
                    console.log('✅ Firebase chargé (version compatibilité)');
                    
                    // Démarrer l'écoute d'auth
                    auth.onAuthStateChanged(function(user) {
                        if (user) {
                            console.log('✅ Utilisateur connecté:', user.email);
                        } else {
                            console.log('❌ Utilisateur déconnecté');
                        }
                    });
                };
                document.head.appendChild(script3);
            };
            document.head.appendChild(script2);
        };
        document.head.appendChild(script);
    });
})();
