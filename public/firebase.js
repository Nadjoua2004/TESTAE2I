// Firebase SDK v9 - Configuration et initialisation
// Import des modules Firebase nécessaires depuis le CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getStorage, 
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    uploadBytesResumable
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Configuration Firebase
// IMPORTANT: Remplacez ces valeurs par vos propres clés Firebase
// Vous pouvez les trouver dans la console Firebase > Project Settings > General
const firebaseConfig = {
    apiKey: "AIzaSyCm32jmky9Hth1muQ8gh58qqM63joqVJqU",
    authDomain: "ae2i-b6c7f.firebaseapp.com",
    projectId: "ae2i-b6c7f",
    storageBucket: "ae2i-b6c7f.firebasestorage.app",
    messagingSenderId: "952653537004",
    appId: "1:952653537004:web:7943230cdf74baa16a4fc9",
    measurementId: "G-WTYQ12916Z" // Optionnel
};
const R2_CONFIG = {
    accountId: '298ee83d49284d7cc8b8c2eac280bf44',
    bucketName: 'ae2i-cvs-algerie',
    workerUrl: 'https://upload-ae2i.ae2ialgerie2025.workers.dev' 
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services Firebase
const auth = getAuth(app);
// Enable persistence so Firebase Auth sessions persist across page reloads
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn('⚠️ Could not set auth persistence:', error);
});
const db = getFirestore(app);
const storage = getStorage(app);

// Exporter les services et fonctions Firebase pour utilisation dans script.js
// ==== VERSION CORRIGÉE DE window.firebaseServices (COMPATIBILITÉ V9 + ANCIEN CODE) ====
window.firebaseServices = {
    // Services Firebase
    auth,
    db,
    storage,

    // Alias compatibilité Firebase v8 → v9 (important !)
    firestore: db,

    // Auth functions (compatibilité ancienne syntaxe)
    signInWithEmailAndPassword: async (arg1, arg2, arg3) => {
        // Permet les 2 formes :
        //   signInWithEmailAndPassword(auth, email, pass)
        //   firebaseServices.signInWithEmailAndPassword(email, pass)
        if (typeof arg1 === "string") {
            return await signInWithEmailAndPassword(auth, arg1, arg2);
        }
        return await signInWithEmailAndPassword(arg1, arg2, arg3);
    },
    signOut: () => signOut(auth),
    createUserWithEmailAndPassword: (email, password) =>
        createUserWithEmailAndPassword(auth, email, password),
    onAuthStateChanged,

    // Firestore functions
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,

    // Storage functions
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    uploadBytesResumable
};

// Classe helper pour simplifier les opérations Firebase
class FirebaseHelper {
    constructor() {
        this.auth = auth;
        this.db = db;
        this.storage = storage;
    }

    // AUTH HELPERS
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await signOut(this.auth);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }

    onAuthChange(callback) {
        return onAuthStateChanged(this.auth, callback);
    }

    // FIRESTORE HELPERS
    async getDocument(collectionName, documentId) {
        try {
            const docRef = doc(this.db, collectionName, documentId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
            } else {
                return { success: false, error: 'Document not found' };
            }
        } catch (error) {
            console.error('Get document error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCollection(collectionName, queryConstraints = []) {
        try {
            const collectionRef = collection(this.db, collectionName);
            let q = collectionRef;

            if (queryConstraints.length > 0) {
                q = query(collectionRef, ...queryConstraints);
            }

            const querySnapshot = await getDocs(q);
            const documents = [];
            querySnapshot.forEach((doc) => {
                documents.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: documents };
        } catch (error) {
            console.error('Get collection error:', error);
            return { success: false, error: error.message };
        }
    }

    async setDocument(collectionName, documentId, data, merge = true) {
        try {
            const docRef = doc(this.db, collectionName, documentId);
            await setDoc(docRef, data, { merge });
            return { success: true };
        } catch (error) {
            console.error('Set document error:', error);
            return { success: false, error: error.message };
        }
    }

    async addDocument(collectionName, data) {
        try {
            const collectionRef = collection(this.db, collectionName);
            const docRef = await addDoc(collectionRef, {
                ...data,
                createdAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Add document error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateDocument(collectionName, documentId, data) {
        try {
            const docRef = doc(this.db, collectionName, documentId);
            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Update document error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteDocument(collectionName, documentId) {
        try {
            const docRef = doc(this.db, collectionName, documentId);
            await deleteDoc(docRef);
            return { success: true };
        } catch (error) {
            console.error('Delete document error:', error);
            return { success: false, error: error.message };
        }
    }

    listenToCollection(collectionName, callback, queryConstraints = []) {
        const collectionRef = collection(this.db, collectionName);
        let q = collectionRef;

        if (queryConstraints.length > 0) {
            q = query(collectionRef, ...queryConstraints);
        } else {
            // For cvDatabase, don't use orderBy if field might not exist on all documents
            // This ensures we get ALL documents, not just those with the field
            if (collectionName === 'cvDatabase') {
                // Use basic query without orderBy to get ALL documents
                // Firestore onSnapshot returns ALL matching documents regardless
                console.log(`📊 [LISTENER] ${collectionName}: Using basic query (no orderBy) to get ALL documents`);
                q = collectionRef;
            } else {
                // For other collections, try orderBy for consistent results
                try {
                    q = query(collectionRef, orderBy('createdAt', 'desc'));
                } catch (e) {
                    console.warn(`⚠️ [LISTENER] ${collectionName}: Could not apply orderBy, using basic query`);
                    q = collectionRef;
                }
            }
        }

        console.log(`🔔 [LISTENER] Setting up listener for ${collectionName} collection`);
        
        return onSnapshot(q, (snapshot) => {
            const documents = [];
            let docCount = 0;
            snapshot.forEach((doc) => {
                docCount++;
                documents.push({ id: doc.id, ...doc.data() });
            });
            console.log(`📊 [LISTENER] ${collectionName}: Received ${documents.length} documents from snapshot (forEach count: ${docCount})`);
            console.log(`📊 [LISTENER] ${collectionName}: Document IDs:`, documents.map(d => d.id));
            
            if (documents.length === 0 && collectionName === 'cvDatabase') {
                console.warn(`⚠️ [LISTENER] ${collectionName}: No documents received!`);
                console.warn(`⚠️ [LISTENER] This could mean:`);
                console.warn(`  1. No documents exist in the collection`);
                console.warn(`  2. Permission error (check Firestore rules)`);
                console.warn(`  3. User document missing or incorrect role`);
                console.warn(`💡 [LISTENER] Current user:`, window.currentUser);
                console.warn(`💡 [LISTENER] Firebase Auth:`, window.firebaseServices?.auth?.currentUser);
            }
            
            callback(documents);
        }, (error) => {
            console.error(`❌ [LISTENER] ${collectionName} error:`, error);
            console.error(`❌ [LISTENER] Error code:`, error.code);
            console.error(`❌ [LISTENER] Error message:`, error.message);
            
            if (error.code === 'permission-denied' && collectionName === 'cvDatabase') {
                console.error(`🔴 [LISTENER] PERMISSION DENIED for cvDatabase!`);
                console.error(`🔴 [LISTENER] Current user:`, window.currentUser);
                console.error(`🔴 [LISTENER] User UID:`, window.currentUser?.uid);
                console.error(`🔴 [LISTENER] User role:`, window.currentUser?.role);
                console.error(`🔴 [LISTENER] Firebase Auth user:`, window.firebaseServices?.auth?.currentUser);
                console.error(`💡 [LISTENER] Check:`);
                console.error(`  1. Firestore rules are deployed`);
                console.error(`  2. User document exists in /users/{uid} with correct role`);
                console.error(`  3. User role is 'recruiter', 'admin', or 'reader'`);
                console.error(`💡 [LISTENER] Try running: await fixUserPermissions()`);
            }
            
            callback([]);
        });
    }

// === CLOUDFLARE R2 CONFIGURATION ===


// STORAGE HELPERS - Cloudflare R2 Version
async uploadFile(path, file, onProgress = null) {
    try {
        // Utiliser un Worker Cloudflare comme proxy sécurisé
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);
        
        const response = await fetch(`${R2_CONFIG.workerUrl}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (onProgress) {
            onProgress(100); // Simuler progression
        }
        
        return { 
            success: true, 
            url: result.url,
            fileName: result.fileName
        };
    } catch (error) {
        console.error('Upload file error:', error);
        return { success: false, error: error.message };
    }
}

async getFileURL(path) {
    try {
        // URL publique R2
        const publicUrl = `https://pub-${R2_CONFIG.accountId}.r2.dev/${R2_CONFIG.bucketName}/${path}`;
        return { success: true, url: publicUrl };
    } catch (error) {
        console.error('Get file URL error:', error);
        return { success: false, error: error.message };
    }
}

async deleteFile(path) {
    try {
        const response = await fetch(`${R2_CONFIG.workerUrl}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
        
        if (!response.ok) {
            throw new Error(`Delete failed: ${response.status}`);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Delete file error:', error);
        return { success: false, error: error.message };
    }
}

// Modifier la fonction submitCV pour R2
async submitCV(cvData, cvFile) {
    // Upload CV to R2
    const timestamp = Date.now();
    const fileName = `cv_${timestamp}_${cvFile.name.replace(/\s+/g, '_')}`;
    const path = `cvs/${fileName}`;
    
    const uploadResult = await this.uploadFile(path, cvFile);
    
    if (!uploadResult.success) {
        return uploadResult;
    }
    
    // Save CV data to Firestore (toujours Firebase)
    const cvRecord = {
        ...cvData,
        cvUrl: uploadResult.url, // URL R2
        cvFileName: fileName,
        cvPath: path, // Chemin R2
        processed: false,
        submittedAt: serverTimestamp()
    };
    
    return await this.addDocument('cvDatabase', cvRecord);
}
    // SITE DATA HELPERS - Fonctions spécifiques pour le site AE2I
    async getSiteSettings() {
        return await this.getDocument('settings', 'main');
    }

    async updateSiteSettings(settings) {
        return await this.setDocument('settings', 'main', settings);
    }

    async getServices() {
        return await this.getCollection('services', [orderBy('id', 'asc')]);
    }

    async getActiveServices() {
        return await this.getCollection('services', [where('active', '==', true), orderBy('id', 'asc')]);
    }

    async getJobs(activeOnly = true) {
        if (activeOnly) {
            return await this.getCollection('jobs', [where('active', '==', true), orderBy('createdAt', 'desc')]);
        }
        return await this.getCollection('jobs', [orderBy('createdAt', 'desc')]);
    }

    

    async logConsent(consentData) {
        return await this.addDocument('consentLogs', {
            ...consentData,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            ip: 'auto-detected' // Firebase will log the IP automatically
        });
    }

    async logActivity(action, details = {}) {
        const user = this.getCurrentUser();
        return await this.addDocument('activityLog', {
            action,
            details,
            userId: user ? user.uid : 'anonymous',
            userEmail: user ? user.email : 'anonymous',
            timestamp: serverTimestamp()
        });
    }
}
// === COMPATIBILITÉ ANCIENNE (VERSION CORRIGÉE – SANS ÉCRASER firebaseServices) ===

// Exporter aussi en global pour compatibilité
if (typeof window !== 'undefined') {
    // Création d'une seule instance helper si pas déjà créée
    if (!window.firebaseHelper) {
        window.firebaseHelper = new FirebaseHelper();
    }

    // NE PAS recréer firebaseServices (déjà défini plus haut et corrigé)
    if (!window.firebaseServices) {
        window.firebaseServices = {
            auth,
            db,
            storage,
            firestore: db
        };
    }

    console.log('🔥 Compatibilité ancienne activée (helper + services uniques)');
}

// Exporter pour modules ES6
export { app, auth, db, storage, FirebaseHelper };

// Créer une instance globale du helper
window.firebaseHelper = new FirebaseHelper();

// Log Firebase initialization
console.log('🔥 Firebase SDK v9 initialized successfully');
console.log('📦 Firebase services available via window.firebaseServices');
console.log('🛠️ Firebase helper available via window.firebaseHelper');

// Export pour utilisation en tant que module

// === EXÉCUTION AUTOMATIQUE - AJOUTEZ CETTE SECTION À LA FIN ===

// Attendre que le DOM soit chargé pour s'assurer que window existe
if (typeof window !== 'undefined') {
    // Exécuter après un petit délai pour s'assurer que tout est prêt
    setTimeout(() => {
        try {
            // Créer et exposer l'instance
            const helperInstance = new FirebaseHelper();
            window.firebaseHelper = helperInstance;
            
            // Exposer aussi les services
            if (!window.firebaseServices) {
                window.firebaseServices = { auth, db, storage };
            }
            
            console.log('🎉 firebaseHelper créé et exposé avec succès!');
            console.log('✅ Méthodes disponibles:', Object.keys(helperInstance).filter(k => typeof helperInstance[k] === 'function'));
            console.log('✅ submitCV disponible:', typeof helperInstance.submitCV === 'function');
            
            // Déclencher un événement pour indiquer que Firebase est prêt
            const event = new CustomEvent('firebaseReady', { detail: { helper: helperInstance } });
            window.dispatchEvent(event);
            
        } catch (error) {
            console.error('❌ Erreur création firebaseHelper:', error);
        }
    }, 100);
}

console.log('✅ firebase.js terminé le chargement');