
// Configuration simplifiée sans modules ES6
const firebaseConfig = {
    apiKey: "AIzaSyCm32jmky9Hth1muQ8gh58qqM63joqVJqU",
    authDomain: "ae2i-b6c7f.firebaseapp.com",
    projectId: "ae2i-b6c7f",
    storageBucket: "ae2i-b6c7f.firebasestorage.app",
    messagingSenderId: "952653537004",
    appId: "1:952653537004:web:7943230cdf74baa16a4fc9",
    measurementId: "G-WTYQ12916Z"
};

// Charger Firebase SDK depuis CDN
const loadFirebase = () => {
    return new Promise((resolve) => {
        // Charger les scripts Firebase
        const script1 = document.createElement('script');
        script1.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        script1.onload = () => {
            const script2 = document.createElement('script');
            script2.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
            script2.onload = () => {
                const script3 = document.createElement('script');
                script3.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
                script3.onload = () => {
                    // Initialiser Firebase
                    const app = firebase.initializeApp(firebaseConfig);
                    const auth = firebase.getAuth(app);
                    const db = firebase.getFirestore(app);
                    
                    // Exposer globalement
                    window.firebaseApp = app;
                    window.firebaseAuth = auth;
                    window.firebaseDB = db;
                    
                    console.log('✅ Firebase chargé');
                    resolve({ app, auth, db });
                };
                document.head.appendChild(script3);
            };
            document.head.appendChild(script2);
        };
        document.head.appendChild(script1);
    });
};

// Démarrer le chargement
loadFirebase().then(() => {
    console.log('Firebase prêt à utiliser');
});
