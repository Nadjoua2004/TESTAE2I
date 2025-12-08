// Firebase SDK v9 - Configuration et initialisation
// Import des modules Firebase nécessaires depuis le CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword
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

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services Firebase
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Exporter les services et fonctions Firebase pour utilisation dans script.js
window.firebaseServices = {
    // Services
    auth,
    db,
    storage,

    // Auth functions
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,

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
        }

        return onSnapshot(q, (snapshot) => {
            const documents = [];
            snapshot.forEach((doc) => {
                documents.push({ id: doc.id, ...doc.data() });
            });
            callback(documents);
        });
    }

    // STORAGE HELPERS
    async uploadFile(path, file, onProgress = null) {
        try {
            const storageRef = ref(this.storage, path);

            if (onProgress) {
                const uploadTask = uploadBytesResumable(storageRef, file);

                return new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            onProgress(progress);
                        },
                        (error) => {
                            console.error('Upload error:', error);
                            reject({ success: false, error: error.message });
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve({ success: true, url: downloadURL });
                        }
                    );
                });
            } else {
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                return { success: true, url: downloadURL };
            }
        } catch (error) {
            console.error('Upload file error:', error);
            return { success: false, error: error.message };
        }
    }

    async getFileURL(path) {
        try {
            const storageRef = ref(this.storage, path);
            const url = await getDownloadURL(storageRef);
            return { success: true, url };
        } catch (error) {
            console.error('Get file URL error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteFile(path) {
        try {
            const storageRef = ref(this.storage, path);
            await deleteObject(storageRef);
            return { success: true };
        } catch (error) {
            console.error('Delete file error:', error);
            return { success: false, error: error.message };
        }
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

    async submitCV(cvData, cvFile) {
        // Upload CV file
        const timestamp = Date.now();
        const fileName = `cv_${timestamp}_${cvFile.name}`;
        const uploadResult = await this.uploadFile(`cvs/${fileName}`, cvFile);

        if (!uploadResult.success) {
            return uploadResult;
        }

        // Save CV data to Firestore
        const cvRecord = {
            ...cvData,
            cvUrl: uploadResult.url,
            cvFileName: fileName,
            processed: false,
            submittedAt: serverTimestamp()
        };

        return await this.addDocument('cvDatabase', cvRecord);
    }

    async submitContactMessage(messageData) {
        return await this.addDocument('contactMessages', {
            ...messageData,
            read: false,
            submittedAt: serverTimestamp()
        });
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

// Créer une instance globale du helper
window.firebaseHelper = new FirebaseHelper();

// Log Firebase initialization
console.log('🔥 Firebase SDK v9 initialized successfully');
console.log('📦 Firebase services available via window.firebaseServices');
console.log('🛠️ Firebase helper available via window.firebaseHelper');

// Export pour utilisation en tant que module
export { app, auth, db, storage, FirebaseHelper };
