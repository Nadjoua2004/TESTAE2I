
/* SECTION: API/LOCAL MODE CONFIG */
const MODE = 'LOCAL'; // 'API' | 'LOCAL'
const API_BASE_URL = '................';
const API_KEY = '.................';
// === CONFIGURATION MODE ===
const APP_MODE = 'FIREBASE'; // 'LOCAL' ou 'FIREBASE'

// Configuration Cloudflare R2 (pour upload CV)
const R2_CONFIG = {
    workerUrl: 'https://upload-ae2i.ae2ialgerie2025.workers.dev',
    publicUrl: 'https://pub-f4fd5f0dedd24600b104dee9aec15539.r2.dev'
};

// Mapping explicite email -> rôle (secours si Firestore est indisponible/incomplet)
const EMAIL_ROLE_MAP = {
    'selmabdf@gmail.com': 'admin',
    'recruiter@ae2i-algerie.com': 'recruteur',
    'reader@ae2i-algerie.com': 'lecteur'
};

// Récupère le rôle utilisateur depuis Firestore (par UID puis par email)
async function hydrateUserFromFirestore(fbUser) {
    const helper = window.firebaseHelper;
    const svc = window.firebaseServices;
    // Fallback depuis la session sauvegardée (localStorage) pour conserver le rôle admin si Firestore ne le fournit pas
    let savedRole = 'lecteur';
    try {
        const saved = localStorage.getItem('ae2i_current_user');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.role) savedRole = parsed.role;
        }
    } catch (e) {
        console.warn('Fallback role read error:', e);
    }

    if (!helper || !svc) {
        return {
            username: fbUser.email,
            email: fbUser.email,
            role: EMAIL_ROLE_MAP[fbUser.email] || savedRole || 'lecteur',
            isLoggedIn: true,
            uid: fbUser.uid
        };
    }

    // 1) Essayer par UID
    let userDoc = await helper.getDocument('users', fbUser.uid);

    // 2) Sinon essayer par email (cas où les docs ne sont pas nommés par UID)
    if (!userDoc.success || !userDoc.data) {
        const whereEmail = svc.where ? svc.where('email', '==', fbUser.email) : null;
        const limiter = svc.limit ? svc.limit(1) : null;
        const constraints = [whereEmail, limiter].filter(Boolean);
        const byEmail = await helper.getCollection('users', constraints);
        if (byEmail.success && byEmail.data && byEmail.data.length > 0) {
            userDoc = { success: true, data: byEmail.data[0] };
        }
    }

    // 3) Fallback : tenter des documents nommés par rôle (admin/recruteur/lecteur)
    if (!userDoc.success || !userDoc.data) {
        const roleIds = ['admin', 'recruteur', 'lecteur'];
        for (const rid of roleIds) {
            const tryDoc = await helper.getDocument('users', rid);
            if (tryDoc.success && tryDoc.data) {
                // Vérifier email si disponible, sinon accepter le rôle direct
                if (!tryDoc.data.email || tryDoc.data.email === fbUser.email) {
                    userDoc = tryDoc;
                    break;
                }
            }
        }
    }

    const roleRaw = userDoc.success && userDoc.data
        ? (userDoc.data.role || EMAIL_ROLE_MAP[fbUser.email] || savedRole || 'lecteur')
        : (EMAIL_ROLE_MAP[fbUser.email] || savedRole || 'lecteur');
    const role = typeof roleRaw === 'string' ? roleRaw.toLowerCase() : (EMAIL_ROLE_MAP[fbUser.email] || savedRole || 'lecteur');
    return {
        username: fbUser.email,
        email: fbUser.email,
        role,
        isLoggedIn: true,
        uid: fbUser.uid
    };
}

// Ensure user document exists in Firestore with correct role (for security rules)
async function ensureUserDocumentInFirestore(uid, email, role) {
    if (!window.firebaseHelper || !uid) return;

    try {
        // Check if user document exists
        const userDoc = await window.firebaseHelper.getDocument('users', uid);

        if (!userDoc.success || !userDoc.data) {
            // Create user document if it doesn't exist
            console.log('📝 [USER DOC] Creating user document in Firestore:', { uid, email, role });
            const result = await window.firebaseHelper.setDocument('users', uid, {
                email: email,
                role: role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, false); // false = don't merge, create new

            if (result.success) {
                console.log('✅ [USER DOC] User document created successfully');
            } else {
                console.warn('⚠️ [USER DOC] Failed to create user document:', result.error);
            }
        } else {
            // Update role if it's different
            const currentRole = userDoc.data.role;
            if (currentRole !== role) {
                console.log('📝 [USER DOC] Updating user role:', { uid, oldRole: currentRole, newRole: role });
                const result = await window.firebaseHelper.updateDocument('users', uid, {
                    role: role,
                    updatedAt: new Date().toISOString()
                });

                if (result.success) {
                    console.log('✅ [USER DOC] User role updated successfully');
                } else {
                    console.warn('⚠️ [USER DOC] Failed to update user role:', result.error);
                }
            }
        }
    } catch (error) {
        console.error('❌ [USER DOC] Error ensuring user document:', error);
    }
}

// ====================================================
// FIREBASE FUNCTIONS - AJOUTER ICI (APRÈS R2_CONFIG)
// ====================================================

/* 🔥 FIX SUPRÊME : Utiliser Firebase Authentication comme source VRAIE de currentUser */

function listenFirebaseAuth() {
    if (APP_MODE !== "FIREBASE") return;

    const auth = window.firebaseServices?.auth;
    if (!auth) {
        console.error("❌ Firebase Auth introuvable !");
        return;
    }

    auth.onAuthStateChanged(async (fbUser) => {
        console.log("🔄 [AUTH] Firebase Auth changed:", fbUser);

        if (!fbUser) {
            console.log("👤 [AUTH] Aucun utilisateur connecté → currentUser = guest");
            window.currentUser = { username: "guest", role: "guest", isLoggedIn: false };
            updateLoginStatus();
            return;
        }

        console.log("🔐 [AUTH] Firebase user connecté:", fbUser.email);

        // Charger le rôle depuis Firestore (UID puis fallback email)
        window.currentUser = await hydrateUserFromFirestore(fbUser);

        console.log("🟩 [AUTH] currentUser mis à jour depuis Firestore:", window.currentUser);

        // mettre à jour l'UI
        updateLoginStatus();
        updateLoginButton();
    });
}

/* === INITIALISATION FIREBASE === */
function initializeFirebase() {
    console.log("🔥 VERSION SCRIPT = 7.1");
    console.log('🔥 === INITIALISATION FIREBASE ===');
    console.log('APP_MODE:', APP_MODE);
    console.log('Firebase helper disponible?', typeof window.firebaseHelper !== 'undefined');

    if (APP_MODE !== 'FIREBASE') {
        console.log('⚠️ Mode LOCAL - Firebase non initialisé');
        return;
    }

    if (typeof window.firebaseHelper === 'undefined') {
        console.error('❌ Firebase helper non trouvé!');
        console.log('Vérifiez que firebase.js est chargé avant script.js');
        return;
    }

    console.log('✅ Firebase helper disponible');
    console.log('🔥 Services Firebase:', window.firebaseServices ? 'disponibles' : 'indisponibles');

    // Test de connexion simple
    // testFirebaseConnection();

    listenFirebaseAuth();

}

/* === FONCTION DE TEST FIREBASE === */
async function testFirebaseConnection() {
    console.log('🧪 testFirebaseConnection DISABLED');
    return { success: true, message: "Disabled to prevent auto-uploads" };
}
/* 🔥 FIX GLOBAL : Restaurer la session AVANT TOUT */

(function restoreUserEarly() {
    try {
        // Vérifier le flag de logout AVANT de restaurer la session
        const loggedOutFlag = localStorage.getItem('ae2i_logged_out');
        if (loggedOutFlag === 'true') {
            console.log("⏸️ [EARLY RESTORE] Flag de logout détecté, skip restauration session");
            window.currentUser = { username: "guest", role: "guest", isLoggedIn: false };
            return;
        }

        const saved = localStorage.getItem("ae2i_current_user");
        console.log("🟦 EARLY RESTORE: saved session =", saved);

        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.isLoggedIn) {
                console.log("🟩 EARLY RESTORE: Session restaurée AVANT INITS:", parsed);
                window.currentUser = parsed;
            } else {
                console.log("🟨 EARLY RESTORE: Session trouvée mais user non-connecté");
            }
        } else {
            console.log("🟥 EARLY RESTORE: Aucun savedUser trouvé");
        }

    } catch (e) {
        console.error("❌ EARLY RESTORE ERROR:", e);
    }
})();

/* === FONCTION UPLOAD VERS R2 === */
async function uploadCVToR2(cvFile, applicantName, jobTitle) {
    console.log('📤 uploadCVToR2 appelée');

    try {
        const formData = new FormData();
        const timestamp = Date.now();
        const safeFileName = cvFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `cvs/${timestamp}_${safeFileName}`;

        formData.append('file', cvFile);
        formData.append('path', path);

        console.log('📤 Upload vers:', R2_CONFIG.workerUrl + '/upload');

        const response = await fetch(R2_CONFIG.workerUrl + '/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        console.log('✅ Upload R2 réussi:', result);
        return {
            success: true,
            url: result.url,
            path: result.path,
            fileName: cvFile.name
        };

    } catch (error) {
        console.error('❌ Upload R2 échoué:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/* === EXPOSITION GLOBALE IMMÉDIATE === */
// Exposer immédiatement au window
window.testFirebaseConnection = testFirebaseConnection;
window.initializeFirebase = initializeFirebase;
window.uploadCVToR2 = uploadCVToR2;

console.log('✅ Fonctions Firebase définies et exposées');
console.log('- testFirebaseConnection:', typeof testFirebaseConnection);
console.log('- window.testFirebaseConnection:', typeof window.testFirebaseConnection);

// Appeler l'initialisation au chargement
document.addEventListener('DOMContentLoaded', function () {
    console.log('📄 DOM chargé - Initialisation...');
    initializeFirebase();
});

/* SECTION: VARIABLES GLOBALES */
let currentPage = 'home';
let currentUser = { username: 'guest', role: 'guest', isLoggedIn: false };
console.log('🚀 [INIT] currentUser initial:', JSON.stringify(currentUser));
let consentStatus = { accepted: false, analytics: false, forms: false, timestamp: null };
let currentEditingIndex = -1;
let currentEditingType = '';
let currentTestimonialIndex = 0;
let testimonialAutoSlide = null;
let notificationQueue = [];
let currentJobsPage = 1;
let jobsPerPage = 12;
let saveInProgress = false;
let lastNotificationMessage = '';
let lastNotificationTime = 0;
let processingJobSave = false;

/* SECTION: DONNÉES DU SITE AVEC FALLBACK LOCAL */
let siteData = {
    settings: {
        title: 'AE2I Algérie – Des solutions pratiques, adaptées et accessibles à tous',
        slogan: 'Votre partenaire de confiance, vous accompagne avec une expertise technique, administrative et logistique sur-mesure.',
        description: 'AE2I Algérie - Votre partenaire de confiance, vous accompagne avec une expertise technique, administrative et logistique sur-mesure. et de la performance depuis 2009.',
        logo: 'backend/uploads/photos/logo_ae2i.png',
        favicon: 'backend/uploads/photos/logo_ae2i.png',
        defaultLanguage: 'fr',
        enableMultilingual: true,
        darkMode: false,
        primaryColor: '#008fb3',
        secondaryColor: '#e63946',
        maintenanceMode: false,
        maintenanceMessage: 'Nous effectuons actuellement une maintenance pour améliorer votre expérience.',
        sectionsEnabled: {
            home: true,
            about: true,
            services: true,
            qualite: true,
            carriere: true,
            contact: true,
            testimonials: true
        },
        contact: {
            addressAlger: '126 Coopérative ESSALEM 2 Birkhadem 16029 - Alger',
            addressOran: '06,07 zone de siéges usto Oran',
            phoneAlger: '0770 – 284- 828 / 0770 – 431- 516',
            phoneOran: '0770 - 177 - 776 / 046 - 821 - 393',
            email: 'ae2i.algerie@ae2i-aerh.com',
            hours: 'Dim-Jeu: 09h00 - 17h00',
            googleMapsUrl: '',
            socialLinks: {
                linkedin: 'https://www.linkedin.com/company/ae2i-algerie',
                facebook: 'https://www.facebook.com/ae2ialgerie',
                twitter: 'https://twitter.com/ae2i_algerie',
                instagram: 'https://www.instagram.com/ae2i.algerie',
                youtube: 'https://www.youtube.com/@ae2ialgerie',
                tiktok: 'https://www.tiktok.com/@ae2i.algerie'
            }
        },
        recruitmentEmails: ['recrutement@ae2i-aerh.com']
    },
    titleGradient: {
        start: '#008fb3',
        end: '#003d82',
        gradient: 'linear-gradient(135deg, #008fb3 0%, #003d82 100%)'
    },
    sloganGradient: {
        start: '#ffffff',
        end: '#e2e8f0',
        gradient: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)'
    },
    descriptionGradient: {
        start: '#64748b',
        end: '#94a3b8',
        gradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)'
    },
    services: [
        {
            id: 1,
            icon: '⚙️',
            title: { fr: 'Ingénierie de Projets', en: 'Project Engineering' },
            description: {
                fr: 'Nous vous accompagnons dans la réalisation de vos projets nationaux et internationaux. Nos missions s\'étendent à l\'ensemble des métiers de l\'ingénierie.',
                en: 'We support you in the implementation of your national and international projects. Our missions extend to all engineering professions.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 2,
            icon: '🏗️',
            title: { fr: 'Ingénierie d\'Installation', en: 'Installation Engineering' },
            description: {
                fr: 'Conception et supervision d\'installations électriques pour projets industriels complexes.',
                en: 'Design and supervision of electrical installations for complex industrial projects.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 3,
            icon: '⚡',
            title: { fr: 'Études Électriques', en: 'Electrical Studies' },
            description: {
                fr: 'Conception et dimensionnement d\'installations électriques industrielles selon les normes.',
                en: 'Design and sizing of industrial electrical installations according to standards.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 4,
            icon: '☀️',
            title: { fr: 'Installation, réparation et maintenance des équipements liés à l\'énergie solaire, électrique et aux énergies de diverses sources', en: 'Installation, repair and maintenance of equipment related to solar, electrical and various energy sources' },
            description: {
                fr: 'Services complets d\'installation, réparation et maintenance pour tous types d\'équipements énergétiques.',
                en: 'Complete installation, repair and maintenance services for all types of energy equipment.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 5,
            icon: '🔧',
            title: { fr: 'Installation et maintenance industrielle de tous appareils, moteurs et équipements', en: 'Industrial installation and maintenance of all devices, motors and equipment' },
            description: {
                fr: 'Expertise complète en installation et maintenance d\'équipements industriels de toute nature.',
                en: 'Complete expertise in installation and maintenance of all types of industrial equipment.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 6,
            icon: '✍️',
            title: { fr: 'Installation d\'écriture industrielle et maintenance', en: 'Industrial writing installation and maintenance' },
            description: {
                fr: 'Services spécialisés en signalétique et marquage industriel avec maintenance continue.',
                en: 'Specialized services in industrial signage and marking with continuous maintenance.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 7,
            icon: '🔥',
            title: { fr: 'Installation, réparation et maintenance des chaudières, appareils et équipements de chauffage', en: 'Installation, repair and maintenance of boilers, heating appliances and equipment' },
            description: {
                fr: 'Solutions complètes pour tous vos systèmes de chauffage industriel et commercial.',
                en: 'Complete solutions for all your industrial and commercial heating systems.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 8,
            icon: '📦',
            title: { fr: 'Stockage et entreposage de marchandises', en: 'Storage and warehousing of goods' },
            description: {
                fr: 'Solutions logistiques professionnelles pour le stockage et l\'entreposage sécurisé de vos marchandises.',
                en: 'Professional logistics solutions for secure storage and warehousing of your goods.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 9,
            icon: '💡',
            title: { fr: 'Commerce de détail de tous équipements et appareils liés à l\'électricité et à l\'électronique', en: 'Retail trade of all equipment and devices related to electricity and electronics' },
            description: {
                fr: 'Large gamme d\'équipements électriques et électroniques pour tous vos besoins professionnels.',
                en: 'Wide range of electrical and electronic equipment for all your professional needs.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 10,
            icon: '🏭',
            title: { fr: 'Commerce de détail d\'appareils et fournitures industrielles', en: 'Retail trade of industrial appliances and supplies' },
            description: {
                fr: 'Fourniture complète d\'appareils et matériel industriel de haute qualité.',
                en: 'Complete supply of high-quality industrial appliances and equipment.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 11,
            icon: '🔨',
            title: { fr: 'Commerce de détail de quincaillerie, ferronnerie, outils domestiques et articles de bricolage', en: 'Retail trade of hardware, ironmongery, household tools and DIY items' },
            description: {
                fr: 'Tous les outils et matériaux nécessaires pour vos projets de construction et bricolage.',
                en: 'All tools and materials needed for your construction and DIY projects.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 12,
            icon: '⚙️',
            title: { fr: 'Commerce de détail d\'équipements, matières premières, pièces détachées et accessoires destinés à la fabrication et transformation d\'équipements', en: 'Retail trade of equipment, raw materials, spare parts and accessories for manufacturing and processing equipment' },
            description: {
                fr: 'Tout le nécessaire pour la fabrication et transformation industrielle.',
                en: 'Everything needed for industrial manufacturing and processing.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 13,
            icon: '📐',
            title: { fr: 'Bureau d\'ingénierie et d\'études techniques', en: 'Engineering and technical studies office' },
            description: {
                fr: 'Études techniques approfondies et solutions d\'ingénierie sur mesure pour vos projets.',
                en: 'In-depth technical studies and custom engineering solutions for your projects.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 14,
            icon: '🤝',
            title: { fr: 'Conseil et assistance aux entreprises nationales et internationales dans les domaines de l\'industrie et de l\'énergie', en: 'Consulting and assistance to national and international companies in industry and energy sectors' },
            description: {
                fr: 'Accompagnement stratégique pour entreprises dans les secteurs industriel et énergétique.',
                en: 'Strategic support for companies in industrial and energy sectors.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 15,
            icon: '📋',
            title: { fr: 'Secrétariat et conseil administratif', en: 'Secretariat and administrative consulting' },
            description: {
                fr: 'Services administratifs professionnels et conseils pour optimiser votre gestion.',
                en: 'Professional administrative services and advice to optimize your management.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 16,
            icon: '💼',
            title: { fr: 'Conseil, études et assistance en investissement', en: 'Investment consulting, studies and assistance' },
            description: {
                fr: 'Expertise en conseil financier et études d\'investissement pour vos projets stratégiques.',
                en: 'Expertise in financial consulting and investment studies for your strategic projects.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 17,
            icon: '⚖️',
            title: { fr: 'Location de compteurs de pesage', en: 'Weighing scale rental' },
            description: {
                fr: 'Location de matériel de pesage professionnel certifié et calibré.',
                en: 'Rental of certified and calibrated professional weighing equipment.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 18,
            icon: '🏗️',
            title: { fr: 'Location de machines, appareils et équipements connexes', en: 'Rental of machines, devices and related equipment' },
            description: {
                fr: 'Large parc de machines et équipements industriels disponibles à la location.',
                en: 'Large fleet of industrial machines and equipment available for rental.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 19,
            icon: '🏗️',
            title: { fr: 'Location d\'équipements et d\'outils pour le bâtiment et les travaux publics', en: 'Rental of equipment and tools for construction and public works' },
            description: {
                fr: 'Tout l\'équipement nécessaire pour vos chantiers de construction et travaux publics.',
                en: 'All equipment needed for your construction and public works projects.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 20,
            icon: '🍽️',
            title: { fr: 'Services hôteliers et de restauration (Catering)', en: 'Hotel and catering services' },
            description: {
                fr: 'Services professionnels de restauration et d\'hébergement pour vos événements et projets.',
                en: 'Professional catering and accommodation services for your events and projects.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        },
        {
            id: 21,
            icon: '📊',
            title: { fr: 'Organisation d\'événements liés au secteur de l\'industrie', en: 'Organization of events related to the industry sector' },
            description: {
                fr: 'Organisation professionnelle d\'événements industriels et conférences techniques.',
                en: 'Professional organization of industrial events and technical conferences.'
            },
            image: 'backend/uploads/photos/footerBackground.png',
            active: true
        }
    ],
    clients: [
        { id: 1, name: 'Algesco', logo: 'backend/uploads/photos/clients/algesco.png', active: true },
        { id: 2, name: 'Alstom', logo: 'backend/uploads/photos/clients/alstom.png', active: true },
        { id: 3, name: 'Baker Hughes', logo: 'backend/uploads/photos/clients/baker_hughes.png', active: true },
        { id: 4, name: 'Celgec', logo: 'backend/uploads/photos/clients/celgec.png', active: true },
        { id: 5, name: 'Clarke Energy', logo: 'backend/uploads/photos/clients/clarke_energy.png', active: true },
        { id: 6, name: 'Fiat', logo: 'backend/uploads/photos/clients/fiat.png', active: true },
        { id: 7, name: 'GE General Electric', logo: 'backend/uploads/photos/clients/ge_general_electric.png', active: true },
        { id: 8, name: 'GE Healthcare', logo: 'backend/uploads/photos/clients/ge_healthcare.png', active: true },
        { id: 9, name: 'GE Vernova', logo: 'backend/uploads/photos/clients/ge_vernova.png', active: true },
        { id: 10, name: 'GEAT', logo: 'backend/uploads/photos/clients/geat.png', active: true },
        { id: 11, name: 'Jotun', logo: 'backend/uploads/photos/clients/jotun.png', active: true },
        { id: 12, name: 'Martur', logo: 'backend/uploads/photos/clients/martur.png', active: true },
        { id: 13, name: 'PCPA', logo: 'backend/uploads/photos/clients/pcpa.png', active: true },
        { id: 14, name: 'Stellantis', logo: 'backend/uploads/photos/clients/stellantis.png', active: true },
        { id: 15, name: 'Toyota', logo: 'backend/uploads/photos/clients/toyota.png', active: true }
    ],
    testimonials: [
        {
            id: 1,
            name: 'Jean Dupont',
            position: { fr: 'Directeur Technique, Sonatrach', en: 'Technical Director, Sonatrach' },
            avatar: 'backend/uploads/photos/logo_ae2i.png',
            rating: 5,
            text: {
                fr: 'L\'équipe AE2I a su s\'adapter à nos contraintes spécifiques et proposer des solutions innovantes.',
                en: 'The AE2I team adapted to our specific constraints and proposed innovative solutions.'
            },
            active: true
        },
        {
            id: 2,
            name: 'Marie Dubois',
            position: { fr: 'Responsable Projet, TotalEnergies', en: 'Project Manager, TotalEnergies' },
            avatar: 'backend/uploads/photos/logo_ae2i.png',
            rating: 5,
            text: {
                fr: 'Professionnalisme et expertise technique de premier plan. AE2I a livré notre projet dans les délais.',
                en: 'Top-tier professionalism and technical expertise. AE2I delivered our project on time.'
            },
            active: true
        },
        {
            id: 3,
            name: 'Ahmed Benali',
            position: { fr: 'Ingénieur Principal, Schneider Electric', en: 'Principal Engineer, Schneider Electric' },
            avatar: 'backend/uploads/photos/logo_ae2i.png',
            rating: 5,
            text: {
                fr: 'Une collaboration exceptionnelle avec des résultats dépassant nos attentes.',
                en: 'Exceptional collaboration with results exceeding our expectations.'
            },
            active: true
        }
    ],
    jobs: [
        {
            id: 1,
            type: 'cdi',
            title: { fr: 'Ingénieur Électrotechnique Senior', en: 'Senior Electrical Engineer' },
            location: 'Alger, Algérie',
            description: {
                fr: 'AE2I Algérie recrute, et si c\'était vous ? d\'experts pour concevoir et superviser des installations électriques pour des projets industriels d\'envergure. Vous travaillerez sur des projets innovants dans le secteur de l\'énergie et contribuerez à l\'excellence technique de nos réalisations.',
                en: 'Join our team of experts to design and supervise electrical installations for large-scale industrial projects. You will work on innovative projects in the energy sector and contribute to the technical excellence of our achievements.'
            },
            requirements: {
                fr: 'Diplôme d\'ingénieur en électrotechnique, 5+ années d\'expérience en projets industriels, maîtrise des logiciels CAO (AutoCAD, EPLAN), anglais technique requis, certification PMP appréciée.',
                en: 'Engineering degree in electrical engineering, 5+ years experience in industrial projects, CAD software proficiency (AutoCAD, EPLAN), technical English required, PMP certification appreciated.'
            },
            active: true,
            createdBy: 'admin',
            createdAt: new Date().toISOString(),
            isNew: true,
            premium: true,
            customQuestion: { fr: 'Décrivez votre expérience la plus significative en gestion de projets électriques industriels', en: 'Describe your most significant experience in industrial electrical project management' }
        },
        {
            id: 2,
            type: 'cdi',
            title: { fr: 'Chef de Projet Industriel', en: 'Industrial Project Manager' },
            location: 'Alger, Algérie',
            description: {
                fr: 'Pilotez des projets industriels complexes de A à Z. Coordonnez les équipes techniques multidisciplinaires et assurez le respect des délais, budgets et exigences qualité dans un environnement international.',
                en: 'Lead complex industrial projects from A to Z. Coordinate multidisciplinary technical teams and ensure compliance with deadlines, budgets and quality requirements in an international environment.'
            },
            requirements: {
                fr: 'Master en ingénierie industrielle, 7+ années d\'expérience en gestion de projet, certification PMP obligatoire, maîtrise de l\'anglais et de l\'arabe, expérience internationale souhaitée.',
                en: 'Master in industrial engineering, 7+ years of project management experience, PMP certification required, proficiency in English and Arabic, international experience desired.'
            },
            active: true,
            createdBy: 'admin',
            createdAt: new Date().toISOString(),
            isNew: true,
            premium: true
        },
        {
            id: 3,
            type: 'stage',
            title: { fr: 'Stage Ingénieur Automatisation', en: 'Automation Engineer Internship' },
            location: 'Alger, Algérie',
            description: {
                fr: 'Stage de 6 mois dans notre équipe automatisation. Participez à des projets réels de programmation d\'automates et de supervision industrielle. Développez vos compétences techniques dans un environnement professionnel stimulant.',
                en: '6-month internship in our automation team. Participate in real PLC programming and industrial supervision projects. Develop your technical skills in a stimulating professional environment.'
            },
            requirements: {
                fr: 'Étudiant en 5ème année ingénierie automatique/électronique, bases en programmation automates (Siemens, Schneider), motivation et curiosité technique, stage de fin d\'études.',
                en: 'Student in 5th year automation/electronics engineering, basics in PLC programming (Siemens, Schneider), motivation and technical curiosity, final year internship.'
            },
            active: true,
            createdBy: 'admin',
            createdAt: new Date().toISOString(),
            isNew: false
        }
    ],
    users: [
        { id: 1, username: 'admin', email: 'selmabdf@gmail.com', role: 'admin', password: 'Selma@2219', active: true },
        { id: 2, username: 'recruiter', email: 'recruiter@ae2i-algerie.com', role: 'recruiter', password: 'recruiter123', active: true },
        { id: 3, username: 'reader', email: 'reader@ae2i-algerie.com', role: 'reader', password: 'reader123', active: true }
    ],
    customPages: [],
    cvDatabase: [],
    contactMessages: [],
    consentLogs: [],
    gdprRequests: [],
    activityLog: [],
    trash: [],
    language: 'fr',
    theme: 'light',
    heroBackground: {
        type: 'video',
        url: 'backend/uploads/videos/hero.mp4'
    },
    footerBackground: {
        type: 'image',
        url: 'backend/uploads/photos/footerBackground.png'
    },
    brochure: {
        name: 'Brochure_AE2I.pdf',
        type: 'application/pdf',
        url: 'backend/uploads/brochures/Brochure_AE2I.pdf'
    }
};

/* SECTION: TRADUCTIONS COMPLÈTES FR/EN */
const translations = {
    fr: {
        home: 'Accueil',
        about: 'À propos',
        services: 'Services',
        qualite: 'Politique Qualité',
        carriere: 'Carrière',
        contact: 'Contact',
        searchPlaceholder: 'Rechercher par poste, compétences, région...',
        applyBtn: 'Postuler',
        allJobs: 'Tous',
        cdi: 'CDI',
        cdd: 'CDD',
        stage: 'Stage',
        connectLinkedIn: 'Se connecter avec LinkedIn et préremplir',
        submitApplication: 'Envoyer la candidature',
        newOffer: 'NOUVEAU',
        location: 'Localisation',
        requirements: 'Exigences',
        description: 'Description',
        newApplication: 'Nouvelle candidature reçue!',
        applicationReceived: 'Candidature reçue pour',
        viewApplication: 'Voir la candidature',
        downloadCV: 'Télécharger CV',
        contactCandidate: 'Contacter le candidat',
        markProcessed: 'Marquer comme traité',
        region: 'Région',
        skills: 'Compétences',
        experience: 'Expérience',
        noResults: 'Aucun résultat trouvé',
        searchResults: 'résultats trouvés'
    },
    en: {
        home: 'Home',
        about: 'About',
        services: 'Services',
        qualite: 'Quality Policy',
        carriere: 'Career',
        contact: 'Contact',
        searchPlaceholder: 'Search by position, skills, region...',
        applyBtn: 'Apply',
        allJobs: 'All',
        cdi: 'Permanent',
        cdd: 'Fixed-term',
        stage: 'Internship',
        connectLinkedIn: 'Connect with LinkedIn and prefill',
        submitApplication: 'Submit application',
        newOffer: 'NEW',
        location: 'Location',
        requirements: 'Requirements',
        description: 'Description',
        newApplication: 'New application received!',
        applicationReceived: 'Application received for',
        viewApplication: 'View application',
        downloadCV: 'Download CV',
        contactCandidate: 'Contact candidate',
        markProcessed: 'Mark as processed',
        region: 'Region',
        skills: 'Skills',
        experience: 'Experience',
        noResults: 'No results found',
        searchResults: 'results found'
    },
    ar: {
        home: 'الرئيسية',
        about: 'من نحن',
        services: 'خدماتنا',
        qualite: 'سياسة الجودة',
        carriere: 'الوظائف',
        contact: 'اتصل بنا',
        searchPlaceholder: 'البحث عن منصب، مهارات، منطقة...',
        applyBtn: 'تقديم الطلب',
        allJobs: 'الكل',
        cdi: 'عقد دائم',
        cdd: 'عقد محدد المدة',
        stage: 'تدريب',
        connectLinkedIn: 'الاتصال بـ LinkedIn والتعبئة التلقائية',
        submitApplication: 'إرسال الطلب',
        newOffer: 'جديد',
        location: 'الموقع',
        requirements: 'المتطلبات',
        description: 'الوصف',
        newApplication: 'تم استلام طلب جديد!',
        applicationReceived: 'تم استلام الطلب لـ',
        viewApplication: 'عرض الطلب',
        downloadCV: 'تحميل السيرة الذاتية',
        contactCandidate: 'الاتصال بالمرشح',
        markProcessed: 'وضع علامة كمعالج',
        region: 'المنطقة',
        skills: 'المهارات',
        experience: 'الخبرة',
        noResults: 'لا توجد نتائج',
        searchResults: 'نتائج العثور عليها'
    }
};

// Descriptions des rôles utilisateur avec nouveau rôle "lecteur"
const roleDescriptions = {
    fr: {
        admin: 'Accès complet : gestion de tous les contenus, utilisateurs, paramètres et maintenance du site.',
        recruiter: 'Accès recrutement : création/modification d\'offres d\'emploi, gestion des candidatures et CV.',
        reader: 'Accès lecture seule : consultation et téléchargement des CV uniquement, aucune modification possible.',
        editor: 'Accès éditorial : gestion des contenus (services, témoignages, pages) sans accès aux utilisateurs.'
    },
    en: {
        admin: 'Full access: management of all content, users, settings and site maintenance.',
        recruiter: 'Recruitment access: create/edit job offers, manage applications and CVs.',
        reader: 'Read-only access: view and download CVs only, no modifications allowed.',
        editor: 'Editorial access: manage content (services, testimonials, pages) without user access.'
    }
};

/* === FIREBASE/CLOUDFLARE R2 FUNCTIONS === */

// Fonction pour uploader le CV vers Cloudflare R2
async function uploadCVToR2(cvFile, applicantName, jobTitle) {
    try {
        console.log('📤 [R2] Uploading CV to Cloudflare R2...');

        const formData = new FormData();
        const timestamp = Date.now();
        const safeFileName = cvFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `cvs/${timestamp}_${safeFileName}`;

        formData.append('file', cvFile);
        formData.append('path', path);

        // Upload via Worker Cloudflare
        const response = await fetch(R2_CONFIG.workerUrl + '/upload', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        console.log('✅ [R2] CV uploaded successfully:', result.url);

        return {
            success: true,
            url: result.url,
            path: result.path,
            fileName: cvFile.name
        };

    } catch (error) {
        console.error('❌ [R2] Upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Fonction pour sauvegarder la candidature dans Firebase
async function saveApplicationToFirebase(applicationData, cvUrl = null) {
    try {
        if (typeof window.firebaseHelper === 'undefined') {
            throw new Error('Firebase not initialized');
        }

        console.log('🔥 [FIREBASE] Saving application...');
        console.log('🔥 [FIREBASE] Application data:', JSON.stringify(applicationData, null, 2));

        // Extraire les informations CV avant de modifier l'objet
        const cvFileName = applicationData.applicantCV?.name || applicationData.cvFileName || 'unknown.pdf';
        const cvFileSize = applicationData.applicantCV?.size || applicationData.cvFileSize || 0;
        const cvFileType = applicationData.applicantCV?.type || applicationData.cvFileType || 'application/pdf';

        // Préparer les données pour Firebase
        const firebaseApplication = {
            ...applicationData,
            cvUrl: cvUrl || null, // URL R2 si disponible
            cvFileName: cvFileName,
            cvFileSize: cvFileSize,
            cvFileType: cvFileType,
            status: applicationData.status || 'new',
            source: 'website_form',
            submittedAt: applicationData.submittedAt || new Date().toISOString()
        };

        // Supprimer le fichier CV de l'objet (ne pas stocker en base64)
        delete firebaseApplication.applicantCV;
        delete firebaseApplication.applicantCV?.content;

        // Sauvegarder dans Firestore (collection cvDatabase pour correspondre au listener)
        const result = await window.firebaseHelper.addDocument('cvDatabase', firebaseApplication);

        if (result.success) {
            console.log('✅ [FIREBASE] Application saved with ID:', result.id);
            
            // Send email notifications to recruitment emails
            try {
                console.log('📧 [EMAIL] Sending recruitment email notifications...');
                await sendRecruitmentEmailNotifications(firebaseApplication);
            } catch (emailError) {
                console.error('❌ [EMAIL] Error sending email notifications:', emailError);
                // Don't fail the application submission if email fails
            }
            
            return {
                success: true,
                firebaseId: result.id
            };
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        console.error('❌ [FIREBASE] Save error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Send email notifications to recruitment team when a new application is submitted
async function sendRecruitmentEmailNotifications(applicationData) {
    try {
        console.log('📧 [EMAIL] Starting email notification process...');
        console.log('📧 [EMAIL] Application data:', {
            applicantName: applicationData.applicantName,
            jobId: applicationData.jobId,
            jobTitle: applicationData.jobTitle
        });
        
        // Get recruitment emails from Firestore settings - try multiple sources
        let recruitmentEmails = [];
        
        // Priority 1: Try to get from Firebase settings
        if (typeof window.firebaseHelper !== 'undefined') {
            try {
                console.log('📧 [EMAIL] Fetching recruitment emails from Firestore...');
                const settingsResult = await window.firebaseHelper.getDocument('settings', 'main');
                console.log('📧 [EMAIL] Firestore settings result:', settingsResult);
                
                if (settingsResult && settingsResult.success && settingsResult.data) {
                    recruitmentEmails = settingsResult.data.recruitmentEmails || [];
                    console.log('✅ [EMAIL] Found recruitment emails in Firestore:', recruitmentEmails.length, recruitmentEmails);
                    
                    // Also update local siteData for consistency
                    if (!siteData.settings) siteData.settings = {};
                    siteData.settings.recruitmentEmails = recruitmentEmails;
                    
                } else {
                    console.warn('⚠️ [EMAIL] No recruitment emails in Firestore, trying local siteData...');
                    recruitmentEmails = siteData.settings?.recruitmentEmails || [];
                    console.log('📧 [EMAIL] Using local recruitment emails:', recruitmentEmails.length, recruitmentEmails);
                }
            } catch (err) {
                console.error('❌ [EMAIL] Error fetching from Firestore:', err);
                console.warn('⚠️ [EMAIL] Falling back to local siteData...');
                recruitmentEmails = siteData.settings?.recruitmentEmails || [];
                console.log('📧 [EMAIL] Using local recruitment emails:', recruitmentEmails.length, recruitmentEmails);
            }
        } else {
            console.warn('⚠️ [EMAIL] Firebase helper not available, using local siteData...');
            recruitmentEmails = siteData.settings?.recruitmentEmails || [];
            console.log('📧 [EMAIL] Using local recruitment emails:', recruitmentEmails.length, recruitmentEmails);
        }

        // Filter out empty or invalid emails
        recruitmentEmails = recruitmentEmails.filter(email => email && typeof email === 'string' && email.includes('@'));

        if (!recruitmentEmails || recruitmentEmails.length === 0) {
            console.warn('⚠️ [EMAIL] No valid recruitment emails configured!');
            console.warn('💡 [EMAIL] Please add recruitment emails in Settings > Email de recrutement');
            console.warn('💡 [EMAIL] Go to Admin Dashboard > Paramètres > Email de recrutement');
            // Don't show notification to user - this is a background process
            return;
        }

        // Check if email service is configured
        const hasEmailService = (typeof emailjs !== 'undefined' && window.EMAILJS_CONFIG) || 
                                window.EMAIL_API_ENDPOINT || 
                                (window.firebaseHelper && typeof window.firebaseHelper.sendEmail === 'function');
        
        if (!hasEmailService) {
            console.warn('⚠️ [EMAIL] No email service configured (EmailJS, EMAIL_API_ENDPOINT, or FirebaseHelper.sendEmail)');
            console.warn('💡 [EMAIL] Emails will use mailto fallback (opens email client)');
            console.warn('💡 [EMAIL] To enable automatic email sending, configure EmailJS or EMAIL_API_ENDPOINT');
        }

        console.log('📧 [EMAIL] Sending to', recruitmentEmails.length, 'valid email(s):', recruitmentEmails);

        // Get job details if jobId exists
        let jobTitle = applicationData.jobTitle || 'Poste non spécifié';
        if (applicationData.jobId && typeof window.firebaseHelper !== 'undefined') {
            try {
                const jobResult = await window.firebaseHelper.getDocument('jobs', applicationData.jobId.toString());
                if (jobResult && jobResult.success && jobResult.data) {
                    jobTitle = jobResult.data.title?.fr || jobResult.data.title || jobTitle;
                }
            } catch (err) {
                console.warn('⚠️ [EMAIL] Could not fetch job details:', err);
            }
        }

        const applicantName = applicationData.applicantName || 
            `${applicationData.applicantFirstName || ''} ${applicationData.applicantLastName || ''}`.trim() || 
            'Candidat';
        const applicantEmail = applicationData.applicantEmail || 'Non renseigné';
        const applicantPhone = applicationData.applicantPhone || 'Non renseigné';
        const cvUrl = applicationData.cvUrl || applicationData.cvR2Url || '';

        // Create email content
        const subject = `Nouvelle candidature - ${jobTitle}`;
        
        // Format email body with HTML for better display in EmailJS template
        const emailBody = `
Une nouvelle candidature a été soumise pour le poste : <strong>${jobTitle}</strong>

<strong>Informations du candidat :</strong>
• Nom : ${applicantName}
• Email : ${applicantEmail}
• Téléphone : ${applicantPhone}
${cvUrl ? `• CV : <a href="${cvUrl}">Télécharger le CV</a>` : ''}
${applicationData.expectedSalary ? `• Salaire souhaité : ${applicationData.expectedSalary} DA` : ''}
${applicationData.yearsExperience ? `• Années d'expérience : ${applicationData.yearsExperience}` : ''}

<strong>Date de candidature :</strong> ${new Date(applicationData.appliedAt || new Date()).toLocaleString('fr-FR')}
        `.trim();
        
        // Plain text version (fallback)
        const emailBodyText = `
Une nouvelle candidature a été soumise pour le poste : ${jobTitle}

Informations du candidat :
- Nom : ${applicantName}
- Email : ${applicantEmail}
- Téléphone : ${applicantPhone}
${cvUrl ? `- CV : ${cvUrl}` : ''}
${applicationData.expectedSalary ? `- Salaire souhaité : ${applicationData.expectedSalary} DA` : ''}
${applicationData.yearsExperience ? `- Années d'expérience : ${applicationData.yearsExperience}` : ''}

Date de candidature : ${new Date(applicationData.appliedAt || new Date()).toLocaleString('fr-FR')}
        `.trim();

        // Send email to all recruitment emails using FirebaseHelper.sendEmail if available
        const emailPromises = recruitmentEmails.map(async (email) => {
            try {
                console.log('📧 [EMAIL] Attempting to send to:', email);
                
                // Priority 1: Use FirebaseHelper.sendEmail if available (handles EmailJS, API, etc.)
                if (window.firebaseHelper && typeof window.firebaseHelper.sendEmail === 'function') {
                    try {
                        const result = await window.firebaseHelper.sendEmail(email, subject, emailBody);
                        if (result && result.success) {
                            console.log('✅ [EMAIL] Sent via FirebaseHelper.sendEmail to:', email);
                            return { success: true, email: email, method: 'firebaseHelper' };
                        } else {
                            console.warn('⚠️ [EMAIL] FirebaseHelper.sendEmail returned failure, trying other methods...');
                        }
                    } catch (err) {
                        console.warn('⚠️ [EMAIL] FirebaseHelper.sendEmail error, trying other methods:', err);
                    }
                }
                
                // Priority 2: Try EmailJS if available
                if (typeof emailjs !== 'undefined' && window.EMAILJS_CONFIG) {
                    try {
                        const { serviceId, templateId, publicKey } = window.EMAILJS_CONFIG;
                        const templateParams = {
                            to_email: email,
                            subject: subject,
                            message: emailBody, // HTML formatted message
                            message_text: emailBodyText, // Plain text fallback
                            to_name: 'Équipe de recrutement',
                            applicant_name: applicantName,
                            applicant_email: applicantEmail,
                            applicant_phone: applicantPhone,
                            job_title: jobTitle,
                            cv_url: cvUrl || '',
                            application_date: new Date(applicationData.appliedAt || new Date()).toLocaleString('fr-FR')
                        };
                        await emailjs.send(serviceId, templateId, templateParams, publicKey);
                        console.log('✅ [EMAIL] Sent via EmailJS to:', email);
                        return { success: true, email: email, method: 'emailjs' };
                    } catch (err) {
                        console.warn('⚠️ [EMAIL] EmailJS error:', err);
                    }
                }
                
                // Priority 3: Try backend API if available
                if (window.EMAIL_API_ENDPOINT) {
                    try {
                        const response = await fetch(window.EMAIL_API_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ to: email, subject: subject, body: emailBody })
                        });
                        if (response.ok) {
                            console.log('✅ [EMAIL] Sent via API to:', email);
                            return { success: true, email: email, method: 'api' };
                        } else {
                            console.warn('⚠️ [EMAIL] API returned status:', response.status);
                        }
                    } catch (err) {
                        console.warn('⚠️ [EMAIL] API error:', err);
                    }
                }
                
                // Fallback: Cannot use mailto automatically (browser blocks it without user gesture)
                // Instead, log the email details and show a notification
                console.warn('⚠️ [EMAIL] No email service configured for:', email);
                console.warn('💡 [EMAIL] To enable automatic email sending, configure EmailJS or EMAIL_API_ENDPOINT');
                console.warn('📧 [EMAIL] Email details that should be sent:');
                console.warn('   To:', email);
                console.warn('   Subject:', subject);
                console.warn('   Body:', emailBody);
                
                // Store email notification in a log/notification system instead
                // This way admins can see that an email should have been sent
                if (typeof logActivity === 'function') {
                    logActivity('system', `📧 Email notification should be sent to ${email} - No email service configured`);
                }
                
                // Return failure so we can track that emails weren't actually sent
                return { 
                    success: false, 
                    email: email, 
                    method: 'none',
                    error: 'No email service configured. Please configure EmailJS or EMAIL_API_ENDPOINT for automatic email sending.'
                };
            } catch (error) {
                console.error(`❌ [EMAIL] Error sending to ${email}:`, error);
                return { success: false, email: email, error: error.message };
            }
        });

        const results = await Promise.allSettled(emailPromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
        const failedCount = recruitmentEmails.length - successCount;
        
        console.log(`✅ [EMAIL] Email notifications sent: ${successCount}/${recruitmentEmails.length} successful`);
        
        // Log details about failures
        results.forEach((result, index) => {
            if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value?.success)) {
                const email = recruitmentEmails[index];
                const error = result.status === 'rejected' ? result.reason : result.value?.error;
                console.error(`❌ [EMAIL] Failed to send to ${email}:`, error);
            }
        });
        
        if (successCount > 0) {
            const method = results.find(r => r.status === 'fulfilled' && r.value?.success)?.value?.method || 'unknown';
            showNotification(`Notification envoyée à ${successCount} email(s) de recrutement`, 'success');
            console.log(`✅ [EMAIL] Successfully sent ${successCount} email(s) via ${method}`);
        } else if (failedCount > 0) {
            console.error(`❌ [EMAIL] Failed to send to all ${failedCount} email(s)`);
            console.error('💡 [EMAIL] Email notifications were NOT sent automatically');
            console.error('💡 [EMAIL] To enable automatic email sending:');
            console.error('   1. Configure EmailJS: Set window.EMAILJS_CONFIG with {serviceId, templateId, publicKey}');
            console.error('   2. Or configure EMAIL_API_ENDPOINT: Set window.EMAIL_API_ENDPOINT to your email API URL');
            console.error('   3. Or use Firebase Cloud Functions to send emails server-side');
            
            // Show a warning notification to admin users (only once, not for every email)
            if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'recruiter' || currentUser.role === 'recruteur')) {
                // Use a flag to prevent multiple notifications
                if (!window.emailServiceWarningShown) {
                    showNotification(
                        `⚠️ Aucun service d'email configuré. Les notifications n'ont pas été envoyées automatiquement. Configurez EmailJS ou une API email.`, 
                        'warning'
                    );
                    window.emailServiceWarningShown = true;
                    // Reset flag after 5 minutes
                    setTimeout(() => { window.emailServiceWarningShown = false; }, 5 * 60 * 1000);
                }
            }
        }
    } catch (error) {
        console.error('❌ [EMAIL] Error in sendRecruitmentEmailNotifications:', error);
        console.error('❌ [EMAIL] Error stack:', error.stack);
        // Don't throw - email failure shouldn't break application submission
    }
}

// Système de notifications ultra-amélioré OPÉRATIONNEL avec sauvegarde forcée
/* FIX: Add deduplication system to prevent multiple identical notifications */
const notificationHistory = new Map();

function showNotification(message, type = 'success', duration = 4000, actions = null) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    // FIX: Check if identical notification was shown recently (within 2 seconds)
    const notificationKey = `${type}-${message}`;
    const now = Date.now();
    if (notificationHistory.has(notificationKey)) {
        const lastShown = notificationHistory.get(notificationKey);
        if (now - lastShown < 2000) {
            console.log('Notification deduplicated:', message);
            return; // Skip duplicate
        }
    }
    notificationHistory.set(notificationKey, now);

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');

    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    else if (type === 'error') icon = 'times-circle';
    else if (type === 'warning') icon = 'exclamation-triangle';
    else if (type === 'candidate-alert') icon = 'user-plus';

    notification.innerHTML = `
        <i class="fas fa-${icon}"></i> 
        <div style="flex-grow: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">${message}</div>
            ${actions ? `<div style="display: flex; gap: 8px; margin-top: 8px;">${actions}</div>` : ''}
        </div>
        <button class="notification-close functional-btn" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, duration);

    const notifications = container.querySelectorAll('.notification');
    if (notifications.length > 5) {
        notifications[0].remove();
    }

    // Force save after notification si utilisateur connecté
    if (currentUser.isLoggedIn && type === 'success') {
        setTimeout(() => {
            forceSaveData();
        }, 100);
    }
}

function showCandidateNotification(candidateName, jobTitle, cvId) {
    const actions = `
        <button class="btn btn-sm btn-outline functional-btn" onclick="previewCV(${cvId})" style="background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.3); color: white; font-size: 11px; padding: 4px 8px;">
            ${translations[siteData.language].viewApplication}
        </button>
        <button class="btn btn-sm btn-outline functional-btn" onclick="contactApplicant('${candidateName}')" style="background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.3); color: white; font-size: 11px; padding: 4px 8px;">
            ${translations[siteData.language].contactCandidate}
        </button>
    `;

    showNotification(
        `${translations[siteData.language].newApplication}\n${translations[siteData.language].applicationReceived} ${jobTitle}`,
        'candidate-alert',
        10000,
        actions
    );
}

// Système de consentement Loi 18-07
function initConsentSystem() {
    const savedConsent = localStorage.getItem('ae2i_consent');

    if (savedConsent) {
        consentStatus = JSON.parse(savedConsent);
        if (consentStatus.accepted) {
            return;
        }
    }

    setTimeout(() => {
        document.getElementById('consentBanner').classList.add('show');
    }, 2000);
}

function handleConsentResponse(accepted) {
    consentStatus = {
        accepted: accepted,
        analytics: accepted,
        forms: accepted,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: 'masked-for-privacy'
    };

    localStorage.setItem('ae2i_consent', JSON.stringify(consentStatus));

    if (!siteData.consentLogs) siteData.consentLogs = [];
    siteData.consentLogs.push({
        id: Date.now(),
        action: accepted ? 'accepted' : 'declined',
        timestamp: consentStatus.timestamp,
        details: consentStatus
    });

    document.getElementById('consentBanner').classList.remove('show');

    const message = accepted ?
        (siteData.language === 'en' ? 'Consent recorded. Thank you for your trust.' : 'Consentement enregistré. Merci pour votre confiance.') :
        (siteData.language === 'en' ? 'Consent declined. Some features may be limited.' : 'Consentement refusé. Certaines fonctionnalités peuvent être limitées.');

    showNotification(message, accepted ? 'success' : 'info');
    logActivity('visitor', `Consentement ${accepted ? 'accepté' : 'refusé'}`);
    forceSaveData();
}

function checkConsentRequired(action) {
    if (!consentStatus.accepted || (action === 'forms' && !consentStatus.forms)) {
        document.getElementById('consentRequired').style.display = 'block';
        return false;
    }
    return true;
}
/* === FONCTION VIEWRECRUTEURAPPLICATIONS === */
function viewRecruteurApplications(jobId) {
    console.log('📋 [RECRUITER] Viewing applications for job ID:', jobId);

    if (!currentUser || (currentUser.role !== 'recruiter' && currentUser.role !== 'admin')) {
        showNotification('Accès non autorisé', 'error');
        return;
    }

    // Trouver le job
    const job = siteData.jobs.find(j => j.id == jobId);
    if (!job) {
        showNotification('Offre non trouvée', 'error');
        return;
    }

    // Filtrer les candidatures pour ce job
    const applications = siteData.cvDatabase.filter(cv => cv.jobId == jobId);

    console.log(`📊 ${applications.length} candidature(s) trouvée(s) pour "${job.title.fr}"`);

    // Si pas de candidatures
    if (applications.length === 0) {
        showNotification(`Aucune candidature pour "${job.title.fr}"`, 'info');
        return;
    }

    // Créer le HTML pour afficher les candidatures
    let modalHTML = `
<div class="applications-modal">
    <div class="modal-header" style="background: var(--primary); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
        <h3 style="margin: 0;">
            <i class="fas fa-users"></i> 
            Candidatures pour: ${job.title.fr}
        </h3>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">
            ${applications.length} candidature(s) - ${applications.filter(a => !a.processed).length} en attente
        </p>
    </div>
    
    <div class="modal-body" style="padding: 20px; max-height: 70vh; overflow-y: auto;">
        <div style="margin-bottom: 20px; display: flex; gap: 10px;">
            <button class="btn btn-sm btn-primary" onclick="exportApplicationsToCSV(${jobId})">
                <i class="fas fa-file-csv"></i> Exporter CSV
            </button>
            <button class="btn btn-sm btn-secondary" onclick="exportApplicationsToPDF(${jobId})">
                <i class="fas fa-file-pdf"></i> Exporter PDF
            </button>
            <div style="margin-left: auto;">
                <select id="applicationFilter" onchange="filterApplications(this.value)" class="form-control" style="width: 200px;">
                    <option value="all">Toutes les candidatures</option>
                    <option value="pending">En attente seulement</option>
                    <option value="processed">Traitées seulement</option>
                    <option value="recent">Moins de 7 jours</option>
                </select>
            </div>
        </div>
        
        <div id="applicationsList">
`;

    // Ajouter chaque candidature
    applications.forEach((app, index) => {
        const appliedDate = new Date(app.appliedAt).toLocaleDateString('fr-FR');
        const isProcessed = app.processed || false;
        const statusClass = isProcessed ? 'status-processed' : 'status-pending';
        const statusText = isProcessed ? 'Traité' : 'En attente';

        modalHTML += `
    <div class="application-card ${isProcessed ? 'processed' : 'pending'}" 
         style="border: 1px solid var(--border); border-radius: 8px; padding: 15px; margin-bottom: 15px; background: ${isProcessed ? 'var(--bg-alt)' : 'white'};">
        
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <div>
                <h4 style="margin: 0 0 5px 0; color: var(--primary);">
                    <i class="fas fa-user"></i> ${app.applicantName || 'Non spécifié'}
                </h4>
                <p style="margin: 0 0 5px 0; font-size: 14px;">
                    <i class="fas fa-envelope"></i> ${app.applicantEmail || 'Non spécifié'}
                    <span style="margin-left: 15px;">
                        <i class="fas fa-phone"></i> ${app.applicantPhone || 'Non spécifié'}
                    </span>
                </p>
            </div>
            
            <div style="text-align: right;">
                <span class="status-badge ${statusClass}" style="font-size: 12px;">
                    ${statusText}
                </span>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: var(--text-light);">
                    <i class="far fa-calendar"></i> ${appliedDate}
                </p>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 10px; font-size: 14px;">
            ${app.applicantPosition ? `<div><strong>Poste actuel:</strong> ${app.applicantPosition}</div>` : ''}
            ${app.applicantDiploma ? `<div><strong>Diplôme:</strong> ${app.applicantDiploma}</div>` : ''}
            ${app.expectedSalary ? `<div><strong>Salaire souhaité:</strong> ${app.expectedSalary} DA</div>` : ''}
            ${app.yearsExperience ? `<div><strong>Expérience:</strong> ${app.yearsExperience} ans</div>` : ''}
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button class="btn btn-sm btn-outline" onclick="previewCV('${app.id || app.firebaseId || ''}')">
                <i class="fas fa-eye"></i> Voir CV
            </button>
            <button class="btn btn-sm btn-outline" onclick="contactApplicant('${app.applicantEmail}')">
                <i class="fas fa-envelope"></i> Contacter
            </button>
            ${!isProcessed ? `
                <button class="btn btn-sm btn-success" onclick="markAsProcessed('${app.id || app.firebaseId || ''}')">
                    <i class="fas fa-check"></i> Marquer traité
                </button>
            ` : ''}
            <button class="btn btn-sm btn-danger" onclick="deleteApplication('${app.id || app.firebaseId || ''}')">
                <i class="fas fa-trash"></i> Supprimer
            </button>
        </div>
        
        ${app.pdfSummary ? `
            <div style="margin-top: 10px; padding: 10px; background: var(--bg-alt); border-radius: 5px; font-size: 13px;">
                <strong><i class="fas fa-file-pdf"></i> Résumé PDF généré:</strong>
                <div style="max-height: 100px; overflow: auto; margin-top: 5px;">
                    ${app.pdfSummary.substring(0, 200)}...
                </div>
            </div>
        ` : ''}
    </div>
`;
    });

    modalHTML += `
        </div>
    </div>
    
    <div class="modal-footer" style="padding: 15px 20px; background: var(--bg-alt); border-radius: 0 0 12px 12px; text-align: center;">
        <button class="btn btn-primary" onclick="closeModal('applicationsModal')">
            <i class="fas fa-times"></i> Fermer
        </button>
    </div>
</div>
`;

    // Créer et afficher la modal
    const modalId = 'applicationsModal';
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }

    const modalDiv = document.createElement('div');
    modalDiv.id = modalId;
    modalDiv.className = 'modal';
    modalDiv.style.cssText = `
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background: rgba(0,0,0,0.7);
display: flex;
align-items: center;
justify-content: center;
z-index: 10000;
`;

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
background: white;
width: 90%;
max-width: 1000px;
max-height: 90vh;
border-radius: 12px;
overflow: hidden;
box-shadow: 0 10px 30px rgba(0,0,0,0.3);
`;

    modalContent.innerHTML = modalHTML;
    modalDiv.appendChild(modalContent);
    document.body.appendChild(modalDiv);

    // Ajouter fonction de fermeture
    modalDiv.addEventListener('click', function (e) {
        if (e.target === modalDiv) {
            modalDiv.remove();
        }
    });

    // Log activity
    logActivity(currentUser.username, `Affiche candidatures pour ${job.title.fr} (${applications.length} candidatures)`);

    return applications;
}

/* === FONCTIONS AUXILIAIRES POUR LA MODAL === */

function filterApplications(filterType) {
    const applicationsList = document.getElementById('applicationsList');
    if (!applicationsList) return;

    const cards = applicationsList.querySelectorAll('.application-card');
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    cards.forEach(card => {
        let show = true;

        switch (filterType) {
            case 'pending':
                show = card.classList.contains('pending');
                break;
            case 'processed':
                show = card.classList.contains('processed');
                break;
            case 'recent':
                // Vérifier si la candidature date de moins de 7 jours
                const dateText = card.querySelector('.fa-calendar')?.parentElement?.textContent;
                if (dateText) {
                    const dateParts = dateText.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                    if (dateParts) {
                        const appDate = new Date(`${dateParts[3]}-${dateParts[2]}-${dateParts[1]}`);
                        show = appDate > sevenDaysAgo;
                    }
                }
                break;
            case 'all':
            default:
                show = true;
        }

        card.style.display = show ? 'block' : 'none';
    });
}

function exportApplicationsToCSV(jobId) {
    const applications = siteData.cvDatabase.filter(cv => cv.jobId == jobId);
    const job = siteData.jobs.find(j => j.id == jobId);

    if (applications.length === 0) {
        showNotification('Aucune candidature à exporter', 'warning');
        return;
    }

    let csv = 'Nom,Email,Téléphone,Poste actuel,Diplôme,Salaire souhaité,Expérience,Date,Statut\n';

    applications.forEach(app => {
        const row = [
            `"${app.applicantName || ''}"`,
            `"${app.applicantEmail || ''}"`,
            `"${app.applicantPhone || ''}"`,
            `"${app.applicantPosition || ''}"`,
            `"${app.applicantDiploma || ''}"`,
            `"${app.expectedSalary || ''}"`,
            `"${app.yearsExperience || ''}"`,
            `"${new Date(app.appliedAt).toLocaleDateString('fr-FR')}"`,
            `"${app.processed ? 'Traité' : 'En attente'}"`
        ].join(',');

        csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Candidatures_${job?.title.fr || 'Job'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification(`Export CSV réussi (${applications.length} candidatures)`, 'success');
    logActivity(currentUser.username, `Export CSV candidatures pour ${job?.title.fr || 'job'} (${applications.length} lignes)`);
}

function exportApplicationsToPDF(jobId) {
    const applications = siteData.cvDatabase.filter(cv => cv.jobId == jobId);
    const job = siteData.jobs.find(j => j.id == jobId);

    if (applications.length === 0) {
        showNotification('Aucune candidature à exporter', 'warning');
        return;
    }
    // Simple export texte pour l'instant (vous pourriez intégrer jsPDF plus tard)
    let content = `Candidatures pour: ${job?.title.fr || 'Offre non spécifiée'}\n`;
    content += `Date d'export: ${new Date().toLocaleDateString('fr-FR')}\n`;
    content += `Nombre de candidatures: ${applications.length}\n\n`;
    content += '='.repeat(80) + '\n\n';

    applications.forEach((app, index) => {
        content += `${index + 1}. ${app.applicantName || 'Non spécifié'}\n`;
        content += `   Email: ${app.applicantEmail || 'Non spécifié'}\n`;
        content += `   Téléphone: ${app.applicantPhone || 'Non spécifié'}\n`;
        content += `   Poste actuel: ${app.applicantPosition || 'Non spécifié'}\n`;
        content += `   Diplôme: ${app.applicantDiploma || 'Non spécifié'}\n`;
        content += `   Salaire souhaité: ${app.expectedSalary || 'Non spécifié'} DA\n`;
        content += `   Expérience: ${app.yearsExperience || 'Non spécifié'} ans\n`;
        content += `   Date: ${new Date(app.appliedAt).toLocaleDateString('fr-FR')}\n`;
        content += `   Statut: ${app.processed ? 'Traité' : 'En attente'}\n`;
        content += '-'.repeat(40) + '\n\n';
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Candidatures_${job?.title.fr || 'Job'}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();

    showNotification(`Export PDF réussi (${applications.length} candidatures)`, 'success');
    logActivity(currentUser.username, `Export PDF candidatures pour ${job?.title.fr || 'job'} (${applications.length} candidatures)`);
}


function saveConsentSettings() {
    const cookies = document.getElementById('cookiesConsent').checked;
    const analytics = document.getElementById('analyticsConsent').checked;
    const forms = document.getElementById('formsConsent').checked;

    consentStatus = {
        accepted: cookies,
        analytics: analytics,
        forms: forms,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('ae2i_consent', JSON.stringify(consentStatus));

    if (!siteData.consentLogs) siteData.consentLogs = [];
    siteData.consentLogs.push({
        id: Date.now(),
        action: 'settings_updated',
        timestamp: consentStatus.timestamp,
        details: consentStatus
    });

    closeModal('consentModal');
    showNotification(siteData.language === 'en' ? 'Privacy settings saved' : 'Paramètres de confidentialité sauvegardés', 'success');
    logActivity('visitor', 'Paramètres consentement modifiés');
    forceSaveData();
}

// Système de navigation multipage
function showPage(pageId, addToHistory = true) {
    console.log('🚀 [SHOW PAGE] START - pageId:', pageId, 'addToHistory:', addToHistory);

    // S'assurer que currentUser est à jour avant d'afficher la page
    const savedSession = localStorage.getItem('ae2i_current_user');
    if (savedSession && (!currentUser || !currentUser.isLoggedIn || currentUser.role === 'guest')) {
        try {
            const parsed = JSON.parse(savedSession);
            if (parsed && parsed.isLoggedIn && parsed.role && !justLoggedOut) {
                console.log('🔄 [SHOW PAGE] Mise à jour currentUser depuis localStorage:', parsed.role);
                currentUser = parsed;
            }
        } catch (e) {
            console.warn('⚠️ [SHOW PAGE] Erreur parsing session:', e);
        }
    }

    const roleLc = (currentUser?.role || '').toLowerCase();
    console.log('[PAGE] showPage called with', pageId, 'addToHistory=', addToHistory, 'role=', roleLc, 'currentUser:', JSON.stringify(currentUser));

    if (siteData.settings.maintenanceMode && roleLc !== 'admin' && pageId !== 'maintenance') {
        pageId = 'maintenance';
    }

    console.log('[PAGE] About to check access for', pageId);
    const hasAccess = checkPageAccess(pageId);
    console.log('[PAGE] Access check result for', pageId, ':', hasAccess);
    if (!hasAccess) {
        console.log('[PAGE] ❌ ACCESS DENIED for', pageId);
        return;
    }
    console.log('[PAGE] ✅ ACCESS GRANTED for', pageId);

    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active', 'fade-in');
    });

    const targetSection = document.getElementById(`${pageId}-page`);
    console.log('[PAGE] Looking for element:', `${pageId}-page`, 'Found:', !!targetSection);
    if (targetSection) {
        console.log('[PAGE] ✅ Element found, activating...');
        targetSection.classList.add('active', 'fade-in');
        // Ensure maintenance page is displayed correctly
        if (pageId === 'maintenance') {
            targetSection.style.display = 'flex';
        }
        currentPage = pageId;
        console.log('[PAGE] activated', `${pageId}-page`, 'active?', targetSection.classList.contains('active'));

        updateNavigation(pageId);
        console.log('[PAGE] Navigation updated');

        if (addToHistory) {
            window.history.pushState({ page: pageId }, '', `#${pageId}`);
            console.log('[PAGE] History updated');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log('[PAGE] Scrolled to top');

        triggerPageScript(pageId);
        console.log('[PAGE] Page script triggered');

        // Show logout button for dashboard pages
        if (pageId === 'admin' || pageId === 'recruteur' || pageId === 'lecteur') {
            const logoutBtn = targetSection.querySelector('.btn-logout');
            if (logoutBtn) {
                logoutBtn.style.display = 'flex';
                console.log('[PAGE] Logout button shown for', pageId);
            } else {
                console.warn('[PAGE] Logout button not found in', pageId);
            }
        }

        logActivity(currentUser.username || 'visitor', `Navigation vers page ${pageId}`);
        console.log('[PAGE] ✅ Page display completed for', pageId);
    } else {
        console.error('[PAGE] ❌ target section not found for', pageId, '- Element ID:', `${pageId}-page`);
        console.error('[PAGE] Available page sections:', Array.from(document.querySelectorAll('.page-section')).map(s => s.id));
    }
    console.log('🏁 [SHOW PAGE] END - pageId:', pageId);
}

function updateNavigation(activePageId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('current-page');
        if (link.getAttribute('data-page') === activePageId) {
            link.classList.add('current-page');
        }
    });
}

function triggerPageScript(pageId) {
    switch (pageId) {
        case 'home':
            executeHomeScript();
            break;
        case 'about':
            executeAboutScript();
            break;
        case 'services':
            executeServicesScript();
            break;
        case 'qualite':
            executeQualiteScript();
            break;
        case 'carriere':
            executeCarriereScript();
            break;
        case 'contact':
            executeContactScript();
            break;
        case 'admin':
            executeAdminScript();
            break;
        case 'recruteur':
            executeRecruteurScript();
            break;
        case 'lecteur':
            executeLecteurScript();
            break;
    }
}

/* FIX: Add missing translatePage function */
function translatePage(lang) {
    // Stub function to prevent errors - actual translations handled inline
    console.log('🌐 translatePage called with lang:', lang);
    // No-op for now as translations are handled via siteData.language checks
}

function checkPageAccess(pageId) {
    // S'assurer que currentUser est à jour avant de vérifier l'accès
    const savedSession = localStorage.getItem('ae2i_current_user');
    if (savedSession && (!currentUser || !currentUser.isLoggedIn || currentUser.role === 'guest')) {
        try {
            const parsed = JSON.parse(savedSession);
            if (parsed && parsed.isLoggedIn && parsed.role) {
                console.log('🔄 [ACCESS CHECK] Mise à jour currentUser depuis localStorage:', parsed.role);
                currentUser = parsed;
            }
        } catch (e) {
            console.warn('⚠️ [ACCESS CHECK] Erreur parsing session:', e);
        }
    }

    console.log('🔍 [ACCESS CHECK] Page:', pageId, 'currentUser:', JSON.stringify(currentUser));
    const roleLc = (currentUser?.role || '').toLowerCase();

    // FIX: Allow access to maintenance page and admin pages even in maintenance mode
    if (siteData.settings.maintenanceMode && currentUser.role !== 'admin') {
        if (pageId !== 'maintenance' && pageId !== 'admin') {
            console.log('❌ [ACCESS CHECK] Bloqué par mode maintenance');
            return false;
        }
        // Allow access to maintenance page for login
        if (pageId === 'maintenance') {
            return true;
        }
    }

    if (siteData.settings.sectionsEnabled && siteData.settings.sectionsEnabled[pageId] === false) {
        console.log('❌ [ACCESS CHECK] Section désactivée');
        showNotification(siteData.language === 'en' ? 'This section is temporarily disabled' : 'Cette section est temporairement désactivée', 'warning');
        return false;
    }

    /* FIX: Ajouter logs détaillés pour debug accès admin */
    console.log('🔍 [ACCESS CHECK] Vérification admin - pageId:', pageId, 'roleLc:', roleLc, 'roleLc === "admin":', roleLc === 'admin');
    if (pageId === 'admin') {
        if (roleLc === 'admin') {
            console.log('✅ [ACCESS CHECK] Accès admin autorisé - role:', roleLc);
            return true;
        } else {
            console.log('❌ [ACCESS CHECK] Pas admin - Role actuel:', currentUser?.role, 'roleLc:', roleLc, 'isLoggedIn:', currentUser?.isLoggedIn);
            console.log('❌ [ACCESS CHECK] currentUser complet:', JSON.stringify(currentUser));
            console.log('❌ [ACCESS CHECK] Session localStorage:', localStorage.getItem('ae2i_current_user'));
            showNotification(siteData.language === 'en' ? 'Administrator access required' : 'Accès administrateur requis', 'error');
            // Ne pas appeler showPage('home') ici pour éviter la récursion
            return false;
        }
    }

    if (pageId === 'recruteur' && roleLc !== 'recruiter' && roleLc !== 'recruteur' && roleLc !== 'admin') {
        showNotification(siteData.language === 'en' ? 'Recruiter access required' : 'Accès recruteur requis', 'error');
        showPage('home');
        return false;
    }

    if (pageId === 'lecteur' && roleLc !== 'reader' && roleLc !== 'lecteur' && roleLc !== 'admin') {
        showNotification(siteData.language === 'en' ? 'Reader access required' : 'Accès lecteur requis', 'error');
        showPage('home');
        return false;
    }

    return true;
}

// Setup navigation globale
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            if (pageId) {
                showPage(pageId);
            }
        });
    });

    window.addEventListener('popstate', function (e) {
        if (e.state && e.state.page) {
            showPage(e.state.page, false);
        } else {
            const hash = window.location.hash.substring(1);
            if (hash) {
                showPage(hash, false);
            }
        }
    });

    const initialHash = window.location.hash.substring(1);
    if (initialHash && document.getElementById(`${initialHash}-page`)) {
        showPage(initialHash, false);
    } else {
        showPage('home', false);
    }
}
// Helper: route to dashboard based on role
function routeToDashboard(role) {
    const r = (role || '').toLowerCase();
    console.log('[NAV] routeToDashboard role=', r, 'currentUser=', JSON.stringify(currentUser));
    try {
        if (r === 'admin') {
            console.log('[NAV] showPage(admin) - calling now...');
            showPage('admin');
            console.log('[NAV] showPage(admin) - call completed');
        } else if (r === 'recruteur' || r === 'recruiter') {
            console.log('[NAV] showPage(recruteur)');
            showPage('recruteur');
        } else if (r === 'lecteur' || r === 'reader') {
            console.log('[NAV] showPage(lecteur)');
            showPage('lecteur');
        } else {
            console.log('[NAV] showPage(home) fallback');
            showPage('home');
        }
    } catch (error) {
        console.error('[NAV] ❌ Error in routeToDashboard:', error);
        console.error('[NAV] Error stack:', error.stack);
    }
}

// 🔐 Login via Firebase Auth
async function loginFirebase(email, password) {
    try {
        const auth = window.firebaseServices?.auth || window.auth;
        if (!auth || !window.firebaseHelper?.login) {
            console.error('❌ Firebase Auth non disponible (firebaseServices/auth manquant)');
            showNotification('Firebase non initialisé, rechargez la page (Ctrl+Shift+R)', 'error');
            return null;
        }
        // Use the helper (wraps signInWithEmailAndPassword)
        const userCredential = await window.firebaseHelper.login(email, password);

        console.log("✅ Firebase Auth login réussi:", userCredential.user);
        // currentUser sera automatiquement mis à jour via onAuthStateChanged
        return userCredential.user;
    } catch (error) {
        console.error("❌ Firebase Auth login échoué:", error.message);
        showNotification(siteData.language === 'en' ? 'Incorrect credentials' : 'Identifiants incorrects', 'error');
        return null;
    }
}
// 🚪 Logout
async function logoutFirebase() {
    try {
        console.log('🔴 [LOGOUT FIREBASE] Déconnexion en cours...');

        // Log activity before logout
        if (currentUser && currentUser.username && currentUser.username !== 'guest') {
            logActivity(currentUser.username, 'Déconnexion');
        }

        // Sign out from Firebase
        const signOutFn = window.firebaseServices?.signOut;
        if (typeof signOutFn === 'function') {
            await signOutFn();
        } else if (window.firebaseServices?.auth?.signOut) {
            // Fallback compat
            await window.firebaseServices.auth.signOut();
        } else if (window.firebaseHelper?.logout) {
            // Use FirebaseHelper logout
            await window.firebaseHelper.logout();
        }

        // Clear user data
        window.currentUser = { username: "guest", role: "guest", isLoggedIn: false };
        localStorage.removeItem('ae2i_current_user');
        sessionStorage.clear();

        // Set persistent logout flag to prevent session restoration on page reload
        localStorage.setItem('ae2i_logged_out', 'true');
        justLoggedOut = true;

        // Clear the logout flag only when user successfully logs in again (not on timeout)

        // Reset initial auth check flag
        isInitialAuthCheck = true;

        // Close any open menus/dropdowns
        const userDropdown = document.getElementById('userDropdown');
        if (userDropdown) {
            userDropdown.classList.remove('show');
        }
        const mobileMenuPanel = document.getElementById('mobileMenuPanel');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        if (mobileMenuPanel) mobileMenuPanel.classList.remove('show');
        if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('show');

        // Update UI
        updateLoginButton();
        updateLoginStatus();

        // Route to home page
        showPage('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Show success notification
        const logoutMsg = siteData.language === 'en' ? 'Successfully logged out' : 'Déconnexion réussie';
        showNotification(logoutMsg, 'success');

        console.log("✅ [LOGOUT FIREBASE] Utilisateur déconnecté avec succès");
    } catch (error) {
        console.error("❌ [LOGOUT FIREBASE] Erreur déconnexion:", error);
        showNotification("Erreur logout: " + error.message, "error", 5000);

        // Even if Firebase logout fails, clear local state
        window.currentUser = { username: "guest", role: "guest", isLoggedIn: false };
        localStorage.removeItem('ae2i_current_user');
        updateLoginButton();
        updateLoginStatus();
        showPage('home');
    }
}
// 🔄 Sync automatique de currentUser depuis Firebase Auth
let isInitialAuthCheck = true; // Flag pour distinguer chargement initial vs login
let justLoggedOut = false; // Flag pour empêcher la restauration de session après logout
function listenFirebaseAuth() {
    if (APP_MODE !== "FIREBASE") return;

    const auth = window.firebaseServices.auth;
    auth.onAuthStateChanged(async (fbUser) => {
        console.log("🔄 [AUTH] Firebase Auth changed:", fbUser, "isInitialAuthCheck:", isInitialAuthCheck);

        if (!fbUser) {
            // Vérifier le flag de logout persistant AVANT de restaurer la session
            const loggedOutFlag = localStorage.getItem('ae2i_logged_out');
            if (loggedOutFlag === 'true' || justLoggedOut) {
                console.log("⏸️ [AUTH] Logout détecté (flag persistant ou récent), skip restauration session");
                currentUser = { username: "guest", role: "guest", isLoggedIn: false };
                localStorage.removeItem('ae2i_current_user');
                updateLoginStatus();
                updateLoginButton();
                isInitialAuthCheck = false;
                return;
            }

            // Si aucune session Firebase mais une session locale existe, 
            // NE PAS restaurer pour Firestore (car règles nécessitent Firebase Auth)
            // Mais on peut garder pour l'UI et suggérer de se reconnecter
            const saved = localStorage.getItem('ae2i_current_user');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const mapped = EMAIL_ROLE_MAP[parsed.email];
                    if (mapped) parsed.role = mapped;
                    // Keep for UI display but mark as not authenticated with Firebase
                    currentUser = { ...parsed, isLoggedIn: false, firebaseAuth: false };
                    console.log("⚠️ [AUTH] Firebase Auth null - localStorage user found but NOT authenticated with Firebase");
                    console.log("⚠️ [AUTH] Firestore operations will fail until Firebase Auth login");
                    console.log("💡 [AUTH] User should log in through Firebase Auth to access Firestore");
                    updateLoginStatus();
                    updateLoginButton();
                    // Clear localStorage user since Firebase Auth is required
                    // localStorage.removeItem('ae2i_current_user');
                    isInitialAuthCheck = false;
                    return;
                } catch (e) {
                    console.warn('Erreur lecture session locale:', e);
                }
            }
            console.log("👤 [AUTH] Aucun utilisateur connecté → currentUser = guest");
            currentUser = { username: "guest", role: "guest", isLoggedIn: false };
            updateLoginStatus();
            isInitialAuthCheck = false;
            return;
        }

        console.log("🔐 [AUTH] Firebase user connecté:", fbUser.email);

        // Vérifier le flag de logout AVANT de restaurer la session
        const loggedOutFlag = localStorage.getItem('ae2i_logged_out');
        if (loggedOutFlag === 'true') {
            console.log("⏸️ [AUTH] Logout flag détecté malgré Firebase Auth actif - forcer déconnexion");
            // Force sign out if logout flag is set
            try {
                if (window.firebaseServices?.auth?.signOut) {
                    await window.firebaseServices.auth.signOut();
                } else if (window.firebaseHelper?.logout) {
                    await window.firebaseHelper.logout();
                }
            } catch (e) {
                console.error('Erreur lors de la déconnexion forcée:', e);
            }
            currentUser = { username: "guest", role: "guest", isLoggedIn: false };
            localStorage.removeItem('ae2i_current_user');
            updateLoginStatus();
            updateLoginButton();
            return;
        }

        // Clear logout flag when user successfully logs in
        localStorage.removeItem('ae2i_logged_out');
        justLoggedOut = false;

        // Récupérer le rôle depuis Firestore (UID puis email)
        window.currentUser = await hydrateUserFromFirestore(fbUser);
        // Forcer mapping explicite si défini
        const mappedRole = EMAIL_ROLE_MAP[fbUser.email];
        if (mappedRole && window.currentUser.role !== mappedRole) {
            window.currentUser.role = mappedRole;
        }

        // Ensure user document exists in Firestore with correct role (for permissions)
        await ensureUserDocumentInFirestore(fbUser.uid, fbUser.email, window.currentUser.role);

        // Persister la session résolue
        localStorage.setItem('ae2i_current_user', JSON.stringify(window.currentUser));

        console.log("🟩 [AUTH] currentUser mis à jour depuis Firestore:", window.currentUser);
        updateLoginStatus();
        updateLoginButton();

        // Router vers le dashboard uniquement si ce n'est pas le chargement initial
        // (pour éviter de router automatiquement au refresh de page)
        if (!isInitialAuthCheck) {
            console.log("🚀 [AUTH] Routing to dashboard for role:", window.currentUser.role);
            routeToDashboard(window.currentUser.role);
        } else {
            console.log("⏸️ [AUTH] Initial auth check - skipping auto-routing");
        }
        isInitialAuthCheck = false;
    });
}
function initializeFirebase() {
    console.log("🔥 === INITIALISATION FIREBASE ===");
    console.log("APP_MODE:", APP_MODE);

    if (APP_MODE !== "FIREBASE") return;
    if (!window.firebaseHelper) return;

    console.log("✅ Firebase helper disponible");
    console.log("🔥 Services Firebase:", window.firebaseServices ? "disponibles" : "indisponibles");

    testFirebaseConnection();

    // ⚡ LANCER L'AUTH LISTENER
    listenFirebaseAuth();
}
// Setup login system avec nouveau rôle "lecteur"
function setupLoginSystem() {
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const loginClose = document.getElementById('loginClose');
    const loginForm = document.getElementById('loginForm');
    const userDropdown = document.getElementById('userDropdown');
    const adminPanelLink = document.getElementById('adminPanelLink');
    const logoutLink = document.getElementById('logoutLink');

    /* FIX: logout-system - Récupération des nouveaux boutons */
    const headerLogoutBtn = document.getElementById('headerLogoutBtn');
    const mobileDashboardBtn = document.getElementById('mobileDashboardBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

    loginBtn.addEventListener('click', function (e) {
        e.stopPropagation();

        // Vérifier l'état réel de connexion (vérifier aussi localStorage pour être sûr)
        const savedSession = localStorage.getItem('ae2i_current_user');
        let isActuallyLoggedIn = false;

        if (currentUser && currentUser.isLoggedIn) {
            isActuallyLoggedIn = true;
        } else if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                if (parsed && parsed.isLoggedIn) {
                    isActuallyLoggedIn = true;
                }
            } catch (e) {
                // Ignore parse errors
            }
        }

        // Vérifier aussi Firebase Auth
        const fbAuth = window.firebaseServices?.auth;
        const fbUser = fbAuth?.currentUser;
        if (fbUser) {
            isActuallyLoggedIn = true;
        }

        if (isActuallyLoggedIn && !justLoggedOut) {
            // Si connecté, rediriger vers le dashboard approprié (pas déconnecter!)
            // S'assurer que currentUser est à jour avant de router
            let userRole = currentUser?.role;

            // Si currentUser n'est pas à jour, essayer de le récupérer depuis localStorage ou Firebase
            if (!userRole || userRole === 'guest') {
                if (savedSession) {
                    try {
                        const parsed = JSON.parse(savedSession);
                        if (parsed && parsed.role) {
                            userRole = parsed.role;
                            currentUser = parsed;
                            console.log('🔄 [LOGIN BTN] currentUser mis à jour depuis localStorage:', currentUser);
                        }
                    } catch (e) {
                        console.warn('Erreur parsing session:', e);
                    }
                }

                // Si toujours pas de rôle, vérifier Firebase Auth
                if ((!userRole || userRole === 'guest') && fbUser) {
                    console.log('🔄 [LOGIN BTN] Tentative récupération rôle depuis Firebase...');
                    // Ne pas bloquer, utiliser routeToDashboard qui gère ça
                }
            }

            console.log('🔍 [LOGIN BTN CLICK] Utilisateur connecté, redirection vers dashboard. Role:', userRole, 'currentUser:', JSON.stringify(currentUser));

            // Utiliser routeToDashboard qui gère mieux la vérification du rôle
            if (userRole) {
                routeToDashboard(userRole);
            } else {
                // Fallback: essayer de router quand même
                console.warn('⚠️ [LOGIN BTN] Rôle non trouvé, tentative routing avec currentUser.role');
                routeToDashboard(currentUser?.role || 'guest');
            }
        } else {
            // Si non connecté, afficher la modale de connexion
            console.log('🔓 [LOGIN BTN CLICK] Utilisateur non connecté, affichage modale');
            if (loginModal) {
                loginModal.classList.add('show');
                setTimeout(() => {
                    const usernameInput = document.getElementById('loginUsername');
                    if (usernameInput) usernameInput.focus();
                }, 300);
            } else {
                console.error('❌ [LOGIN BTN CLICK] loginModal non trouvé');
            }
        }
    });

    loginClose.addEventListener('click', function () {
        loginModal.classList.remove('show');
    });

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('loginUsername').value; // email ou username
        const password = document.getElementById('loginPassword').value;

        console.log('🔍 Tentative connexion Firebase:', email);

        // 🔐 Login Firebase
        const fbUser = await loginFirebase(email, password);

        if (!fbUser) {
            // Login échoué → message déjà géré dans loginFirebase
            return;
        }

        // Attendre que currentUser soit mis à jour par listenFirebaseAuth
        // On attend un peu pour que hydrateUserFromFirestore se termine
        let attempts = 0;
        let user = window.currentUser;
        while ((!user || !user.role || user.role === 'guest') && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            user = window.currentUser;
            attempts++;
        }

        // Si toujours pas de rôle, utiliser hydrateUserFromFirestore directement
        if (!user || !user.role || user.role === 'guest') {
            console.log('⚠️ [LOGIN] currentUser pas encore hydraté, appel direct hydrateUserFromFirestore');
            user = await hydrateUserFromFirestore(fbUser);
            const mappedRole = EMAIL_ROLE_MAP[fbUser.email];
            if (mappedRole && user.role !== mappedRole) {
                user.role = mappedRole;
            }
            window.currentUser = user;
            localStorage.setItem('ae2i_current_user', JSON.stringify(window.currentUser));
        }

        console.log('✅ Utilisateur connecté via Firebase:', user);

        // Mettre à jour l'UI
        updateLoginButton();
        updateLoginStatus();

        loginModal.classList.remove('show');
        loginForm.reset();

        const welcomeMsg = siteData.language === 'en' ?
            `Welcome, ${user.username || user.email}!` :
            `Bienvenue, ${user.username || user.email}!`;

        showNotification(welcomeMsg, 'success');

        // Clear logout flag when user successfully logs in
        localStorage.removeItem('ae2i_logged_out');
        justLoggedOut = false;

        // Navigation directe vers le dashboard en fonction du rôle réellement résolu
        const role = (user?.role || 'lecteur').toLowerCase();
        logActivity(user.username || user.email, `Connexion réussie (rôle: ${role}) [modal submit]`);

        // Marquer que ce n'est plus le chargement initial pour permettre le routing
        isInitialAuthCheck = false;

        // Router vers le dashboard approprié
        console.log('🚀 [LOGIN SUBMIT] Routing to dashboard for role:', role);
        routeToDashboard(role);
        console.log('[LOGIN SUBMIT] After routing, currentUser=', JSON.stringify(window.currentUser));
    });


    adminPanelLink.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('🔍 [CLICK] adminPanelLink cliqué - currentUser:', JSON.stringify(currentUser));
        if (currentUser.role === 'admin') {
            console.log('✅ [CLICK] Admin détecté, showPage(admin)');
            showPage('admin');
        } else if (currentUser.role === 'recruiter' || currentUser.role === 'recruteur') {
            console.log('✅ [CLICK] Recruteur détecté, showPage(recruteur)');
            showPage('recruteur');
        } else if (currentUser.role === 'reader' || currentUser.role === 'lecteur') {
            console.log('✅ [CLICK] Lecteur détecté, showPage(lecteur)');
            showPage('lecteur');
        } else {
            console.log('❌ [CLICK] Rôle non reconnu:', currentUser.role);
        }
        userDropdown.classList.remove('show');
    });

    logoutLink.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
    });

    /* FIX: logout-system - Event listeners pour les nouveaux boutons */
    if (headerLogoutBtn) {
        headerLogoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            logoutUser();
        });
    }

    if (mobileDashboardBtn) {
        mobileDashboardBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('🔍 [MOBILE DASHBOARD] Clic détecté - currentUser:', JSON.stringify(currentUser));
            if (currentUser.role === 'admin') {
                showPage('admin');
            } else if (currentUser.role === 'recruiter' || currentUser.role === 'recruteur') {
                showPage('recruteur');
            } else if (currentUser.role === 'reader' || currentUser.role === 'lecteur') {
                showPage('lecteur');
            }
            // Fermer le menu mobile après navigation
            const mobileMenuPanel = document.getElementById('mobileMenuPanel');
            const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
            if (mobileMenuPanel) mobileMenuPanel.classList.remove('show');
            if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('show');
        });
    }

    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            logoutUser();
        });
    }

    document.addEventListener('click', function (e) {
        if (!loginBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('show');
        }
    });
}

// Fonction centralisée pour mettre à jour le bouton Login/Dashboard
function updateLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;

    if (currentUser.isLoggedIn) {
        loginBtn.classList.add('logged-in');

        // Adapter le texte selon le rôle
        let dashboardText = 'Mon tableau de bord';
        let dashboardTextEn = 'My Dashboard';
        let dashboardTextAr = 'لوحة التحكم';
        let iconClass = 'fa-tachometer-alt';

        if (currentUser.role === 'recruiter' || currentUser.role === 'recruteur') {
            dashboardText = 'Espace Recruteur';
            dashboardTextEn = 'Recruiter Dashboard';
            dashboardTextAr = 'لوحة المُوظّف';
            iconClass = 'fa-users';
        } else if (currentUser.role === 'reader' || currentUser.role === 'lecteur') {
            dashboardText = 'Espace Lecteur';
            dashboardTextEn = 'Reader Dashboard';
            dashboardTextAr = 'لوحة القارئ';
            iconClass = 'fa-eye';
        } else if (currentUser.role === 'admin') {
            dashboardText = 'Dashboard Admin';
            dashboardTextEn = 'Admin Dashboard';
            dashboardTextAr = 'لوحة الإدارة';
            iconClass = 'fa-cogs';
        }

        loginBtn.innerHTML = `<i class="fas ${iconClass}"></i><span data-fr="${dashboardText}" data-en="${dashboardTextEn}" data-ar="${dashboardTextAr}">${dashboardText}</span>`;
        loginBtn.setAttribute('aria-label', dashboardText);
        loginBtn.title = dashboardText;
    } else {
        loginBtn.classList.remove('logged-in');
        loginBtn.innerHTML = `<i class="fas fa-user"></i><span data-fr="Se connecter" data-en="Login" data-ar="تسجيل الدخول">Se connecter</span>`;
        loginBtn.setAttribute('aria-label', 'Se connecter');
        loginBtn.title = 'Se connecter';
    }

    console.log('🔄 [UPDATE BTN] Bouton mis à jour - isLoggedIn:', currentUser.isLoggedIn, 'Role:', currentUser.role);
}

function updateLoginStatus() {
    const user = window.currentUser || { username: "guest", role: "guest", isLoggedIn: false };
    const loginBtn = document.getElementById('loginButton');
    const userDisplay = document.getElementById('currentUser'); // élément qui montre le nom utilisateur
    const adminMenu = document.getElementById('adminMenu'); // menu admin
    const recruiterMenu = document.getElementById('recruiterMenu'); // menu recruteur

    // Certains éléments n'existent pas sur toutes les pages/versions : sécuriser
    const safeSetText = (el, value) => {
        if (el) el.textContent = value;
    };
    const safeShow = (el, shouldShow) => {
        if (el) el.style.display = shouldShow ? 'block' : 'none';
    };

    if (user.isLoggedIn) {
        // Affiche le nom et bouton logout
        safeSetText(userDisplay, user.username);
        if (loginBtn) {
            loginBtn.textContent = "Logout";
            loginBtn.onclick = logoutFirebase;
        }

        // Affiche menus selon le rôle
        safeShow(adminMenu, user.role === 'admin');
        safeShow(recruiterMenu, (user.role === 'recruiter' || user.role === 'recruteur'));
    } else {
        // Guest view
        safeSetText(userDisplay, "Guest");
        if (loginBtn) {
            loginBtn.textContent = "Login";
            loginBtn.onclick = () => loginModal.classList.add('show');
        }

        safeShow(adminMenu, false);
        safeShow(recruiterMenu, false);
    }
}

async function logout() {
    console.log('🔴 [LOGOUT] Fonction logout() appelée');
    if (currentUser && currentUser.username && currentUser.username !== 'guest') {
        logActivity(currentUser.username, 'Déconnexion');
    }

    // Sign out from Firebase first
    try {
        const signOutFn = window.firebaseServices?.signOut;
        if (typeof signOutFn === 'function') {
            await signOutFn();
        } else if (window.firebaseServices?.auth?.signOut) {
            await window.firebaseServices.auth.signOut();
        } else if (window.firebaseHelper?.logout) {
            await window.firebaseHelper.logout();
        }
        console.log('✅ [LOGOUT] Firebase sign out completed');
    } catch (error) {
        console.error('❌ [LOGOUT] Firebase sign out error:', error);
        // Continue with logout even if Firebase fails
    }

    // Set persistent logout flag
    localStorage.setItem('ae2i_logged_out', 'true');
    justLoggedOut = true;

    currentUser = { username: 'guest', role: 'guest', isLoggedIn: false };
    localStorage.removeItem('ae2i_current_user');
    sessionStorage.clear();

    // Reset initial auth check flag
    isInitialAuthCheck = true;

    updateLoginButton();
    updateLoginStatus();
    showPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    showNotification(siteData.language === 'en' ? 'Successfully logged out' : 'Déconnexion réussie', 'success');
    console.log('✅ [LOGOUT] Déconnexion réussie');
}

// Fonction globale pour déconnexion depuis les dashboards
async function logoutUser() {
    console.log('🔴 [LOGOUT USER] Déconnexion en cours...');

    if (currentUser && currentUser.username && currentUser.username !== 'guest') {
        logActivity(currentUser.username, 'Déconnexion');
    }

    // Sign out from Firebase first
    try {
        const signOutFn = window.firebaseServices?.signOut;
        if (typeof signOutFn === 'function') {
            await signOutFn();
        } else if (window.firebaseServices?.auth?.signOut) {
            await window.firebaseServices.auth.signOut();
        } else if (window.firebaseHelper?.logout) {
            await window.firebaseHelper.logout();
        }
        console.log('✅ [LOGOUT USER] Firebase sign out completed');
    } catch (error) {
        console.error('❌ [LOGOUT USER] Firebase sign out error:', error);
        // Continue with logout even if Firebase fails
    }

    // Set persistent logout flag
    localStorage.setItem('ae2i_logged_out', 'true');
    justLoggedOut = true;

    // Réinitialiser l'utilisateur courant
    currentUser = { username: 'guest', role: 'guest', isLoggedIn: false };

    // Nettoyer le stockage
    localStorage.removeItem('ae2i_current_user');
    sessionStorage.clear();

    /* FIX: logout-system - Fermer tous les menus et dropdowns */
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.remove('show');
    }

    // Fermer le menu mobile si ouvert
    const mobileMenuPanel = document.getElementById('mobileMenuPanel');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    if (mobileMenuPanel) {
        mobileMenuPanel.classList.remove('show');
    }
    if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove('show');
    }

    // Reset initial auth check flag
    isInitialAuthCheck = true;

    // Mettre à jour le bouton immédiatement
    updateLoginButton();
    updateLoginStatus();

    // Rediriger vers l'accueil
    showPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Notification de succès
    showNotification(siteData.language === 'en' ? 'Successfully logged out' : 'Déconnexion réussie', 'success');

    console.log('✅ [LOGOUT USER] Déconnexion réussie - currentUser:', JSON.stringify(currentUser));
}
// REMOVED: Duplicate showPage function - using the main one at line 1410 instead
// This duplicate was overriding the correct showPage function and causing routing issues

// Expose functions to window for onclick handlers and global access
window.logoutUser = logoutUser;
window.logoutFirebase = logoutFirebase;
window.logout = logout;
window.updateLoginButton = updateLoginButton;

// Setup consent system
function setupConsentSystem() {
    const consentAccept = document.getElementById('consentAccept');
    const consentDecline = document.getElementById('consentDecline');
    const consentSettings = document.getElementById('consentSettings');

    consentAccept.addEventListener('click', () => handleConsentResponse(true));
    consentDecline.addEventListener('click', () => handleConsentResponse(false));
    consentSettings.addEventListener('click', () => {
        openModal('consentModal');
        document.getElementById('consentBanner').classList.remove('show');
    });
}

// Theme toggle
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');

    themeToggle.addEventListener('click', function () {
        if (document.body.classList.contains('dark-mode')) {
            document.body.classList.remove('dark-mode');
            this.innerHTML = '<i class="fas fa-moon"></i>';
            siteData.theme = 'light';
        } else {
            document.body.classList.add('dark-mode');
            this.innerHTML = '<i class="fas fa-sun"></i>';
            siteData.theme = 'dark';
        }
        localStorage.setItem('ae2i_theme', siteData.theme);
        logActivity(currentUser.username || 'visitor', `Thème changé: ${siteData.theme}`);
        forceSaveData();
    });

    const savedTheme = localStorage.getItem('ae2i_theme');
    if (savedTheme === 'dark' || siteData.settings.darkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}
// Setup language switching (FR/EN/AR)
function setupLanguageSwitch() {
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const lang = this.getAttribute('data-lang');

            document.querySelectorAll('.language-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-pressed', 'true');

            // Set HTML lang and dir attributes
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

            siteData.language = lang;
            updateLanguageContent(lang);
            logActivity(currentUser.username || 'visitor', `Langue changée: ${lang}`);
            forceSaveData();
        });
    });
}

function updateLanguageContent(lang) {
    const notificationMsg = lang === 'en' ? 'Language changed: ' : lang === 'ar' ? 'تم تغيير اللغة: ' : 'Langue changée: ';
    showNotification(`${notificationMsg}${lang.toUpperCase()}`, 'info');

    // Update elements with data attributes (support ar)
    document.querySelectorAll('[data-fr][data-en]').forEach(element => {
        if (element) { // Safety check
            const text = element.getAttribute(`data-${lang}`);
            if (text) {
                element.textContent = text;
            }
        }
    });

    // Also support elements with data-ar attribute
    document.querySelectorAll('[data-ar]').forEach(element => {
        if (element) { // Safety check
            const text = element.getAttribute(`data-${lang}`);
            if (text) {
                element.textContent = text;
            }
        }
    });

    const searchInput = document.getElementById('jobSearchInput');
    if (searchInput && translations[lang]) {
        searchInput.placeholder = translations[lang].searchPlaceholder;
    }

    if (currentPage === 'home') executeHomeScript();
    if (currentPage === 'services') executeServicesScript();
    if (currentPage === 'carriere') executeCarriereScript();
}

// Arabic Translations Dictionary (comprehensive)
const arTranslations = {
    "About": "من نحن",
    "Access your administration area": "ادخل إلى لوحة التحكم",
    "Accueil": "الرئيسية",
    "Accédez à votre espace d'administration": "ادخل إلى لوحة التحكم",
    "Administration Panel": "لوحة التحكم",
    "All wilayas": "جميع الولايات",
    "Career": "الوظائف",
    "Carrière": "الوظائف",
    "Connexion Sécurisée": "تسجيل دخول آمن",
    "Contact": "اتصل بنا",
    "Contact Us": "اتصل بنا",
    "Contact the administrator if you have forgotten your credentials": "اتصل بالمسؤول إذا نسيت بيانات الدخول",
    "Contactez l'administrateur si vous avez oublié vos identifiants": "اتصل بالمسؤول إذا نسيت بيانات الدخول",
    "Contactez-nous": "اتصل بنا",
    "Création": "التأسيس",
    "Déconnexion": "تسجيل الخروج",
    "Email": "البريد الإلكتروني",
    "Espace Lecteur": "مساحة القارئ",
    "Espace Recruteur": "مساحة التوظيف",
    "Established": "التأسيس",
    "Home": "الرئيسية",
    "I accept": "أوافق",
    "I decline": "أرفض",
    "J'accepte": "أوافق",
    "Je refuse": "أرفض",
    "Login": "تسجيل الدخول",
    "Logout": "تسجيل الخروج",
    "Mon profil": "ملفي الشخصي",
    "Mot de passe": "كلمة المرور",
    "My Profile": "ملفي الشخصي",
    "National & International": "وطني ودولي",
    "Navigation": "التنقل",
    "Nom d'utilisateur": "اسم المستخدم",
    "Nos Adresses": "عناويننا",
    "Nos Services": "خدماتنا",
    "Nos Téléphones": "هواتفنا",
    "Our Addresses": "عناويننا",
    "Our Phones": "هواتفنا",
    "Our Services": "خدماتنا",
    "Panneau d'administration": "لوحة التحكم",
    "Paramètres": "الإعدادات",
    "Password": "كلمة المرور",
    "Politique Qualité": "سياسة الجودة",
    "Protection de vos données personnelles": "حماية بياناتكم الشخصية",
    "Protection of your personal data": "حماية بياناتكم الشخصية",
    "Quality Policy": "سياسة الجودة",
    "Reader Area": "مساحة القارئ",
    "Recruiter Area": "مساحة التوظيف",
    "Se connecter": "تسجيل الدخول",
    "Secure Login": "تسجيل دخول آمن",
    "Services": "خدماتنا",
    "Settings": "الإعدادات",
    "Sign in": "تسجيل الدخول",
    "Site Under Maintenance": "الموقع قيد الصيانة",
    "Site en Maintenance": "الموقع قيد الصيانة",
    "Site en maintenance - Fonctionnalités limitées": "الموقع قيد الصيانة - وظائف محدودة",
    "Site under maintenance - Limited functionality": "الموقع قيد الصيانة - وظائف محدودة",
    "Technical & Administrative": "تقنية وإدارية",
    "Technique & Administrative": "تقنية وإدارية",
    "Toutes les wilayas": "جميع الولايات",
    "Username": "اسم المستخدم",
    "À propos": "من نحن"
};

// Auto-add data-ar attributes based on FR/EN translations
function addArabicTranslations() {
    document.querySelectorAll('[data-fr][data-en]').forEach(element => {
        if (!element.hasAttribute('data-ar')) {
            const frText = element.getAttribute('data-fr');
            const enText = element.getAttribute('data-en');

            // Try to match from dictionary
            let arText = arTranslations[frText] || arTranslations[enText] || frText;
            element.setAttribute('data-ar', arText);
        }
    });
}

// Scroll to top
function setupScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    if (!scrollToTopBtn) {
        console.warn('scrollToTop button missing, skipping setup.');
        return;
    }

    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });

    scrollToTopBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        logActivity(currentUser.username || 'visitor', 'Scroll vers le haut');
    });
}

/* FIX: responsive-menu-toggle - Mobile menu with overlay and panel */
function setupMobileMenu() {
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileOverlay = document.getElementById('mobileMenuOverlay');
    const mobilePanel = document.getElementById('mobileMenuPanel');
    const mobileClose = document.getElementById('mobileMenuClose');

    if (!mobileToggle || !mobileOverlay || !mobilePanel) {
        console.warn('Mobile menu elements not found');
        return;
    }

    // Toggle menu open
    mobileToggle.addEventListener('click', function () {
        mobileOverlay.classList.add('show');
        mobilePanel.classList.add('show');
        this.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    });

    // Close menu via close button
    if (mobileClose) {
        mobileClose.addEventListener('click', closeMobileMenu);
    }

    // Close menu via overlay click
    mobileOverlay.addEventListener('click', closeMobileMenu);

    // Close menu when clicking navigation links
    const mobileNavLinks = document.querySelectorAll('#mobileNavigationLinks a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    function closeMobileMenu() {
        mobileOverlay.classList.remove('show');
        mobilePanel.classList.remove('show');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
}

// Modal management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');

        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');

        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

// Activity logging
function logActivity(username, action) {
    const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        username: username,
        action: action,
        userRole: currentUser.role || 'guest',
        page: currentPage,
        userAgent: navigator.userAgent.substring(0, 100)
    };

    if (!siteData.activityLog) siteData.activityLog = [];
    siteData.activityLog.unshift(logEntry);

    if (siteData.activityLog.length > 500) {
        siteData.activityLog = siteData.activityLog.slice(0, 500);
    }

    console.log(`[${new Date().toLocaleString()}] ${username}: ${action}`);
}

/* ADD: safeSerialize-implementation */
/* FIX: saveSiteData-optimization */
// Fonction de sérialisation sécurisée pour éviter les erreurs de stockage
function safeSerialize(data) {
    console.log('[QA] Starting safeSerialize...');
    try {
        const cleanedData = JSON.parse(JSON.stringify(data, (key, value) => {
            // Supprimer les DataURLs volumineuses (data:)
            if (typeof value === 'string' && value.startsWith('data:')) {
                const sizeKB = (value.length * 0.75) / 1024; // Estimation base64
                console.log(`[QA] Removed DataURL for key "${key}" (${sizeKB.toFixed(2)} KB)`);
                return {
                    type: 'file',
                    name: key,
                    size: sizeKB,
                    uploaded: false,
                    note: 'DataURL removed for storage optimization'
                };
            }
            return value;
        }));
        console.log('[QA] safeSerialize completed successfully');
        return cleanedData;
    } catch (error) {
        console.error('[QA] Error in safeSerialize:', error);
        throw error;
    }
}

// Helper function to get Firebase Auth user, waiting for auth state if needed
async function getFirebaseAuthUser(maxWaitMs = 2000) {
    const auth = window.firebaseServices?.auth;
    if (!auth) {
        console.warn('⚠️ [AUTH HELPER] Firebase Auth not available');
        return null;
    }

    let authUser = auth.currentUser;

    // If currentUser is null, wait for auth state to restore (Firebase Auth persistence)
    if (!authUser) {
        console.log('⏳ [AUTH HELPER] Waiting for Firebase Auth state to restore...');
        const startTime = Date.now();
        const checkInterval = 100;
        const maxChecks = Math.floor(maxWaitMs / checkInterval);

        for (let i = 0; i < maxChecks; i++) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            authUser = auth.currentUser;
            if (authUser) {
                console.log(`✅ [AUTH HELPER] Firebase Auth state restored after ${Date.now() - startTime}ms`);
                return authUser;
            }
        }

        console.warn(`⚠️ [AUTH HELPER] Firebase Auth state not restored after ${maxWaitMs}ms`);
        console.warn('⚠️ [AUTH HELPER] Auth state:', {
            hasAuth: !!auth,
            currentUser: auth?.currentUser?.email || 'null'
        });
    }

    return authUser;
}

// Helper function to save admin data to Firestore with debug logging and auto-authentication
async function saveAdminDataToFirestore(collectionName, documentId, data, description = '') {
    console.log(`🔥 [ADMIN FIREBASE SAVE] ${description || `Saving to ${collectionName}/${documentId}`}`);

    if (typeof APP_MODE !== 'undefined' && APP_MODE === 'FIREBASE' && typeof window.firebaseHelper !== 'undefined') {
        try {
            // Get Firebase Auth user, waiting for auth state if needed
            let authUser = await getFirebaseAuthUser(2000);

            // If still not authenticated but locally authenticated as admin, try to authenticate
            if (!authUser && currentUser && (currentUser.isLoggedIn || currentUser.role === 'admin' || currentUser.role === 'administrator')) {
                console.log('⚠️ [ADMIN FIREBASE SAVE] Not Firebase authenticated, attempting auto-login...');
                console.log('⚠️ [ADMIN FIREBASE SAVE] Current user info:', {
                    email: currentUser.email,
                    username: currentUser.username,
                    role: currentUser.role,
                    isLoggedIn: currentUser.isLoggedIn
                });
                const userEmail = currentUser.email || currentUser.username;

                // Try to find password from siteData.users
                if (userEmail && siteData.users) {
                    console.log(`🔍 [ADMIN FIREBASE SAVE] Looking for user in siteData.users...`);
                    const userData = siteData.users.find(u => (u.email === userEmail || u.username === userEmail) && u.password);
                    if (userData && userData.password) {
                        try {
                            console.log(`🔄 [ADMIN FIREBASE SAVE] Attempting Firebase Auth login for ${userEmail}...`);
                            const loginResult = await window.firebaseHelper.login(userEmail, userData.password);
                            if (loginResult && loginResult.success && loginResult.user) {
                                authUser = loginResult.user;
                                console.log(`✅ [ADMIN FIREBASE SAVE] Firebase Auth login successful`);
                                // Update currentUser to reflect Firebase Auth state
                                if (currentUser) {
                                    currentUser.isLoggedIn = true;
                                    currentUser.email = authUser.email;
                                }
                            } else {
                                console.warn(`⚠️ [ADMIN FIREBASE SAVE] Firebase Auth login failed:`, loginResult?.error);
                                console.warn(`💡 [ADMIN FIREBASE SAVE] Make sure the user exists in Firebase Authentication`);
                            }
                        } catch (loginError) {
                            console.error(`❌ [ADMIN FIREBASE SAVE] Firebase Auth login error:`, loginError);
                            console.error(`💡 [ADMIN FIREBASE SAVE] Error details:`, loginError.message);
                        }
                    } else {
                        console.warn(`⚠️ [ADMIN FIREBASE SAVE] Password not found for user ${userEmail} in siteData.users`);
                        console.warn(`💡 [ADMIN FIREBASE SAVE] Available users:`, siteData.users?.map(u => ({ email: u.email, username: u.username, hasPassword: !!u.password })));
                    }
                } else {
                    console.warn(`⚠️ [ADMIN FIREBASE SAVE] Cannot find user email or siteData.users is not available`);
                }
            }

            if (!authUser) {
                console.warn('⚠️ [ADMIN FIREBASE SAVE] Not authenticated with Firebase Auth - cannot save to Firestore');
                console.warn('⚠️ [ADMIN FIREBASE SAVE] Current auth state:', {
                    hasAuth: !!auth,
                    currentUser: auth?.currentUser?.email || 'null',
                    localUser: currentUser?.email || currentUser?.username || 'null',
                    localRole: currentUser?.role || 'null'
                });
                console.warn('⚠️ [ADMIN FIREBASE SAVE] User needs to log in through Firebase Auth to save');
                return { success: false, error: 'Not authenticated' };
            }

            const dataToSave = {
                ...data,
                lastUpdated: new Date().toISOString(),
                updatedBy: currentUser?.email || currentUser?.username || 'system',
                updatedByUid: authUser.uid
            };

            console.log(`🔥 [ADMIN FIREBASE SAVE] Collection: ${collectionName}, Document: ${documentId}`);
            console.log(`🔥 [ADMIN FIREBASE SAVE] Data keys:`, Object.keys(dataToSave));
            console.log(`🔥 [ADMIN FIREBASE SAVE] Data size:`, JSON.stringify(dataToSave).length, 'bytes');

            const result = await window.firebaseHelper.setDocument(collectionName, documentId, dataToSave, true);

            if (result && result.success) {
                console.log(`✅ [ADMIN FIREBASE SAVE] Successfully saved ${collectionName}/${documentId}`);
                return { success: true };
            } else {
                console.error(`❌ [ADMIN FIREBASE SAVE] Failed to save ${collectionName}/${documentId}:`, result?.error);
                return { success: false, error: result?.error || 'Unknown error' };
            }
        } catch (error) {
            console.error(`❌ [ADMIN FIREBASE SAVE] Error saving ${collectionName}/${documentId}:`, error);
            return { success: false, error: error.message };
        }
    } else {
        console.log(`ℹ️ [ADMIN FIREBASE SAVE] Firebase mode not active, skipping Firestore save`);
        return { success: false, error: 'Firebase mode not active' };
    }
}

async function forceSaveData() {
    console.log('[QA] Saving siteData...');
    if (saveInProgress) {
        console.log('⏳ Sauvegarde déjà en cours, attente...');
        return false;
    }

    saveInProgress = true;

    try {
        /* ---------------------------
           🔐 FIX : Protéger currentUser (mais respecter logout)
        ---------------------------- */
        // Ne pas restaurer la session si logout récent
        if (!justLoggedOut) {
            try {
                const savedSession = localStorage.getItem('ae2i_current_user');

                if (savedSession) {
                    const parsed = JSON.parse(savedSession);

                    // Si la session sauvée est connectée mais currentUser == guest → NE PAS ÉCRASER (sauf après logout)
                    if (parsed.isLoggedIn && (!currentUser || !currentUser.isLoggedIn) && !justLoggedOut) {
                        console.log("💾 [PATCH] Empêche écrasement — restauration utilisateur connecté.");
                        currentUser = parsed;
                    }
                }
            } catch (e) {
                console.warn("⚠️ Erreur analyse session:", e);
            }
        } else {
            console.log("⏸️ [SAVE] Logout récent détecté, skip restauration session");
        }

        // Sauvegarde sécurisée de currentUser (seulement si connecté ET pas de logout récent)
        if (currentUser && currentUser.isLoggedIn && !justLoggedOut) {
            localStorage.setItem("ae2i_current_user", JSON.stringify(currentUser));
            console.log("💾 [SAVE] Session préservée:", currentUser.username, currentUser.role);
        } else {
            // Si logout récent, s'assurer que la session est bien supprimée
            if (justLoggedOut) {
                localStorage.removeItem("ae2i_current_user");
                console.log("💾 [SAVE] Logout récent → session supprimée de localStorage");
            } else {
                console.log("💾 [SAVE] Aucun user connecté → pas de remplacement.");
            }
        }

        /* ---------------------------
           🧠 SAFE-SERIALIZE
        ---------------------------- */
        console.log('[QA] Applying safeSerialize to siteData...');
        const dataToSave = safeSerialize(siteData);

        // Nettoyage éventuel
        if (dataToSave.activityLog && dataToSave.activityLog.length > 1000) {
            dataToSave.activityLog = dataToSave.activityLog.slice(0, 500);
            console.log('🧹 Nettoyage automatique des logs anciens');
        }

        const serializedData = JSON.stringify(dataToSave);
        const dataSize = new Blob([serializedData]).size;
        const maxSize = 8 * 1024 * 1024;

        if (dataSize > maxSize) {
            console.warn('⚠️ Données volumineuses détectées, compression...');
            if (dataToSave.cvDatabase && dataToSave.cvDatabase.length > 100) {
                dataToSave.cvDatabase = dataToSave.cvDatabase.slice(0, 100);
                console.log('🗜️ Base CV compressée à 100 entrées');
            }

            if (dataToSave.activityLog && dataToSave.activityLog.length > 200) {
                dataToSave.activityLog = dataToSave.activityLog.slice(0, 200);
                console.log('🗜️ Logs compressés à 200 entrées');
            }
        }

        /* ---------------------------
           💾 SAUVEGARDE PRINCIPALE
        ---------------------------- */
        // Always save to localStorage first (for offline support)
        localStorage.setItem('ae2i_site_data', JSON.stringify(dataToSave));

        const savedData = localStorage.getItem('ae2i_site_data');
        if (!savedData) throw new Error('Échec de vérification de sauvegarde');

        const parsedData = JSON.parse(savedData);
        if (!parsedData || !parsedData.settings) throw new Error('Données corrompues');

        sessionStorage.setItem('ae2i_backup_data', JSON.stringify(dataToSave));
        localStorage.setItem('ae2i_last_save', new Date().toISOString());

        /* ---------------------------
           🔥 SAUVEGARDE FIREBASE (si mode Firebase activé)
        ---------------------------- */
        if (typeof APP_MODE !== 'undefined' && APP_MODE === 'FIREBASE' && typeof window.firebaseHelper !== 'undefined') {
            try {
                console.log('🔥 [FIREBASE SAVE] Saving siteData to Firestore...');
                console.log('🔥 [FIREBASE SAVE] Current user:', currentUser?.email || currentUser?.username || 'none');

                // Get Firebase Auth user, waiting for auth state if needed
                const auth = window.firebaseServices?.auth;
                let authUser = await getFirebaseAuthUser(2000);

                // If still not authenticated but locally authenticated as admin, try to authenticate
                if (!authUser && currentUser && (currentUser.isLoggedIn || currentUser.role === 'admin' || currentUser.role === 'administrator')) {
                    console.log('⚠️ [FIREBASE SAVE] Not Firebase authenticated, attempting auto-login...');
                    console.log('⚠️ [FIREBASE SAVE] Current user info:', {
                        email: currentUser.email,
                        username: currentUser.username,
                        role: currentUser.role,
                        isLoggedIn: currentUser.isLoggedIn
                    });
                    const userEmail = currentUser.email || currentUser.username;

                    // Try to find password from siteData.users
                    if (userEmail && siteData.users) {
                        console.log(`🔍 [FIREBASE SAVE] Looking for user in siteData.users...`);
                        const userData = siteData.users.find(u => (u.email === userEmail || u.username === userEmail) && u.password);
                        if (userData && userData.password) {
                            try {
                                console.log(`🔄 [FIREBASE SAVE] Attempting Firebase Auth login for ${userEmail}...`);
                                const loginResult = await window.firebaseHelper.login(userEmail, userData.password);
                                if (loginResult && loginResult.success && loginResult.user) {
                                    authUser = loginResult.user;
                                    console.log(`✅ [FIREBASE SAVE] Firebase Auth login successful`);
                                    // Update currentUser to reflect Firebase Auth state
                                    if (currentUser) {
                                        currentUser.isLoggedIn = true;
                                        currentUser.email = authUser.email;
                                    }
                                } else {
                                    console.warn(`⚠️ [FIREBASE SAVE] Firebase Auth login failed:`, loginResult?.error);
                                    console.warn(`💡 [FIREBASE SAVE] Make sure the user exists in Firebase Authentication`);
                                }
                            } catch (loginError) {
                                console.error(`❌ [FIREBASE SAVE] Firebase Auth login error:`, loginError);
                                console.error(`💡 [FIREBASE SAVE] Error details:`, loginError.message);
                            }
                        } else {
                            console.warn(`⚠️ [FIREBASE SAVE] Password not found for user ${userEmail} in siteData.users`);
                            console.warn(`💡 [FIREBASE SAVE] Available users:`, siteData.users?.map(u => ({ email: u.email, username: u.username, hasPassword: !!u.password })));
                        }
                    } else {
                        console.warn(`⚠️ [FIREBASE SAVE] Cannot find user email or siteData.users is not available`);
                    }
                }

                console.log('🔥 [FIREBASE SAVE] Is authenticated:', authUser ? 'yes' : 'no');

                if (!authUser) {
                    console.warn('⚠️ [FIREBASE SAVE] Not authenticated with Firebase Auth - cannot save to Firestore');
                    console.warn('⚠️ [FIREBASE SAVE] Current auth state:', {
                        hasAuth: !!auth,
                        currentUser: auth?.currentUser?.email || 'null',
                        localUser: currentUser?.email || currentUser?.username || 'null',
                        localRole: currentUser?.role || 'null'
                    });
                    console.warn('⚠️ [FIREBASE SAVE] User needs to log in through Firebase Auth to save');
                    throw new Error('Not authenticated with Firebase Auth');
                }

                // Save to Firestore in 'siteData' collection with document ID 'main'
                const dataToSaveToFirebase = {
                    ...dataToSave,
                    lastUpdated: new Date().toISOString(),
                    updatedBy: currentUser?.email || currentUser?.username || 'system',
                    updatedByUid: authUser.uid
                };

                console.log('🔥 [FIREBASE SAVE] Data size:', JSON.stringify(dataToSaveToFirebase).length, 'bytes');

                const firebaseResult = await window.firebaseHelper.setDocument('siteData', 'main', dataToSaveToFirebase, true); // true = merge, update existing

                console.log('🔥 [FIREBASE SAVE] Firebase result:', firebaseResult);

                if (firebaseResult && firebaseResult.success) {
                    console.log('✅ [FIREBASE SAVE] Site data saved to Firestore successfully');
                    console.log('✅ [FIREBASE SAVE] Document ID: siteData/main');
                } else {
                    console.error('❌ [FIREBASE SAVE] Firestore save failed:', firebaseResult);
                    if (firebaseResult && firebaseResult.error) {
                        console.error('❌ [FIREBASE SAVE] Error details:', firebaseResult.error);
                    }
                }
            } catch (firebaseError) {
                console.error('❌ [FIREBASE SAVE] Error saving to Firestore:', firebaseError);
                console.error('❌ [FIREBASE SAVE] Error stack:', firebaseError.stack);
                // Don't throw - localStorage save succeeded, Firebase is optional
                console.warn('⚠️ [FIREBASE SAVE] Continuing with localStorage save only');
            }
        } else {
            if (typeof APP_MODE === 'undefined' || APP_MODE !== 'FIREBASE') {
                console.log('ℹ️ [SAVE] APP_MODE is not FIREBASE, skipping Firestore save');
            } else if (typeof window.firebaseHelper === 'undefined') {
                console.warn('⚠️ [SAVE] Firebase helper not available, skipping Firestore save');
            }
        }

        /* ---------------------------
           🔐 Re-sauvegarde currentUser (sauf après logout)
        ---------------------------- */
        if (currentUser && currentUser.isLoggedIn && !justLoggedOut) {
            localStorage.setItem('ae2i_current_user', JSON.stringify(currentUser));
        } else if (justLoggedOut) {
            // S'assurer que la session est supprimée après logout
            localStorage.removeItem('ae2i_current_user');
        }

        console.log('✅ Données sauvegardées avec succès (vérifiées)');
        if (currentUser && currentUser.isLoggedIn && !justLoggedOut) {
            console.log('✅ Session préservée après sauvegarde:', currentUser.username, currentUser.role);
        } else {
            console.log('✅ Aucune session active après sauvegarde');
        }

        saveInProgress = false;
        return true;

    } catch (error) {
        console.error('❌ Erreur sauvegarde critique:', error);
        saveInProgress = false;

        try {
            const minimalData = {
                settings: siteData.settings,
                users: siteData.users,
                timestamp: new Date().toISOString()
            };
            sessionStorage.setItem('ae2i_emergency_backup', JSON.stringify(minimalData));
            console.log('🆘 Sauvegarde d\'urgence effectuée');
            showNotification('Sauvegarde d\'urgence effectuée - Données critiques préservées', 'warning', 6000);
            return false;
        } catch (backupError) {
            console.error('❌ Échec sauvegarde d\'urgence:', backupError);
            showNotification('ERREUR CRITIQUE: Impossible de sauvegarder les données', 'error', 10000);
            return false;
        }
    }
}

function saveSiteData() {
    return forceSaveData();
}


async function loadSiteData() {
    /* 🔥 FIX : restaurer la session depuis localStorage */
    try {
        // Vérifier le flag de logout persistant AVANT de restaurer la session
        const loggedOutFlag = localStorage.getItem('ae2i_logged_out');
        if (loggedOutFlag === 'true') {
            console.log("⏸️ [LOAD DATA] Flag de logout détecté, skip restauration session");
            currentUser = { username: "guest", role: "guest", isLoggedIn: false };
            // DON'T return here - we still need to load data from Firestore for public display
        }

        // Ne pas restaurer la session si l'utilisateur vient de se déconnecter
        if (justLoggedOut) {
            console.log("⏸️ [RESTORE] Logout récent détecté, skip restauration session");
            // DON'T return here - we still need to load data from Firestore for public display
        }

        const savedUser = localStorage.getItem('ae2i_current_user');

        if (savedUser) {
            const parsed = JSON.parse(savedUser);

            if (parsed && parsed.isLoggedIn && !justLoggedOut) {
                console.log("🔐 [RESTORE] Session restaurée depuis localStorage:", parsed);
                currentUser = parsed; // <<< FIX PRINCIPAL
            } else {
                console.log("ℹ️ [RESTORE] Session sauvegardée = guest ou invalide");
            }
        } else {
            console.log("ℹ️ [RESTORE] Aucun current_user trouvé");
        }
    } catch (e) {
        console.error("❌ [RESTORE] Erreur restauration session:", e);
    }
    try {
        // Try loading from Firebase first if in Firebase mode
        let loadedData = null;
        let loadedFromFirebase = false;

        if (typeof APP_MODE !== 'undefined' && APP_MODE === 'FIREBASE' && typeof window.firebaseHelper !== 'undefined') {
            try {
                console.log('🔥 [LOAD] Attempting to load siteData from Firestore...');
                console.log('🔥 [LOAD] Is authenticated:', window.firebaseServices?.auth?.currentUser ? 'yes' : 'no');

                // Try to load siteData (requires auth, but try anyway)
                const firebaseResult = await window.firebaseHelper.getDocument('siteData', 'main');
                console.log('🔥 [LOAD] Firebase result:', firebaseResult);

                if (firebaseResult && firebaseResult.success && firebaseResult.data) {
                    loadedData = firebaseResult.data;
                    loadedFromFirebase = true;
                    console.log('✅ [LOAD] Site data loaded from Firestore');
                    console.log('✅ [LOAD] Last updated:', loadedData.lastUpdated);
                    console.log('✅ [LOAD] Updated by:', loadedData.updatedBy);
                    console.log('✅ [LOAD] Data keys:', Object.keys(loadedData).slice(0, 10));
                } else {
                    console.log('ℹ️ [LOAD] No siteData found in Firestore (may require auth), will load public collections and use localStorage');
                    if (firebaseResult && firebaseResult.error) {
                        console.warn('⚠️ [LOAD] Firebase error (this is OK if not authenticated):', firebaseResult.error);
                    }
                    // Initialize loadedData even if siteData failed (for public collections)
                    if (!loadedData) {
                        loadedData = {};
                    }
                }

                // Also load site settings separately from Firebase (for title and slogan)
                try {
                    const settingsResult = await window.firebaseHelper.getDocument('settings', 'main');
                    if (settingsResult && settingsResult.success && settingsResult.data) {
                        const settingsData = settingsResult.data;
                        console.log('✅ [LOAD] Site settings loaded from Firestore');

                        // Merge settings into loadedData
                        if (!loadedData) {
                            loadedData = {};
                        }
                        if (!loadedData.settings) {
                            loadedData.settings = {};
                        }

                        // Merge site settings (especially title and slogan)
                        if (settingsData.title) loadedData.settings.title = settingsData.title;
                        if (settingsData.slogan) loadedData.settings.slogan = settingsData.slogan;
                        if (settingsData.description) loadedData.settings.description = settingsData.description;
                        // Merge other settings (including recruitmentEmails)
                        Object.keys(settingsData).forEach(key => {
                            if (key !== 'lastUpdated' && key !== 'updatedBy' && key !== 'updatedByUid') {
                                // For arrays like recruitmentEmails, always use Firebase version
                                if (Array.isArray(settingsData[key])) {
                                    loadedData.settings[key] = settingsData[key];
                                } else if (!loadedData.settings[key]) {
                                    loadedData.settings[key] = settingsData[key];
                                }
                            }
                        });
                        
                        // Ensure recruitmentEmails is loaded
                        if (settingsData.recruitmentEmails && Array.isArray(settingsData.recruitmentEmails)) {
                            loadedData.settings.recruitmentEmails = settingsData.recruitmentEmails;
                            console.log('✅ [LOAD] Recruitment emails loaded:', settingsData.recruitmentEmails.length);
                        }

                        // Ensure recruitmentEmails is loaded and preserved
                        if (settingsData.recruitmentEmails && Array.isArray(settingsData.recruitmentEmails)) {
                            loadedData.settings.recruitmentEmails = settingsData.recruitmentEmails;
                            console.log('✅ [LOAD] Recruitment emails loaded from Firestore:', settingsData.recruitmentEmails.length, settingsData.recruitmentEmails);
                        }
                        
                        console.log('✅ [LOAD] Site settings merged into siteData');
                    } else {
                        console.log('ℹ️ [LOAD] No settings found in Firestore');
                    }
                } catch (settingsError) {
                    console.warn('⚠️ [LOAD] Error loading settings from Firestore:', settingsError);
                }

                // Also load hero settings separately from Firebase
                try {
                    const heroSettingsResult = await window.firebaseHelper.getDocument('heroSettings', 'main');
                    if (heroSettingsResult && heroSettingsResult.success && heroSettingsResult.data) {
                        const heroData = heroSettingsResult.data;
                        console.log('✅ [LOAD] Hero settings loaded from Firestore');

                        // Merge hero settings into loadedData or siteData
                        if (!loadedData) {
                            loadedData = {};
                        }

                        // Merge hero settings
                        if (heroData.titleGradient) loadedData.titleGradient = heroData.titleGradient;
                        if (heroData.sloganGradient) loadedData.sloganGradient = heroData.sloganGradient;
                        if (heroData.descriptionGradient) loadedData.descriptionGradient = heroData.descriptionGradient;
                        if (heroData.heroBackground) loadedData.heroBackground = heroData.heroBackground;
                        if (heroData.heroSizes) loadedData.heroSizes = heroData.heroSizes;
                        if (heroData.titleFormatting) loadedData.titleFormatting = heroData.titleFormatting;
                        if (heroData.subtitleFormatting) loadedData.subtitleFormatting = heroData.subtitleFormatting;

                        console.log('✅ [LOAD] Hero settings merged into siteData');
                    } else {
                        console.log('ℹ️ [LOAD] No heroSettings found in Firestore');
                    }
                } catch (heroError) {
                    console.warn('⚠️ [LOAD] Error loading heroSettings from Firestore:', heroError);
                }

                // Also load clients separately from Firebase (from dedicated collection)
                try {
                    const clientsResult = await window.firebaseHelper.getCollection('clients');
                    if (clientsResult && clientsResult.success && clientsResult.data && Array.isArray(clientsResult.data)) {
                        const clientsData = clientsResult.data;
                        console.log(`✅ [LOAD] ${clientsData.length} clients loaded from Firestore`);

                        // Merge clients into loadedData
                        if (!loadedData) {
                            loadedData = {};
                        }
                        
                        // FIX: ALWAYS load from localStorage FIRST to preserve original clients
                        // Then merge with Firestore clients collection
                        let existingClients = [];
                        
                        // Priority 1: Load from localStorage (original source of truth)
                        try {
                            const savedData = localStorage.getItem('ae2i_site_data');
                            if (savedData) {
                                const localData = JSON.parse(savedData);
                                if (localData.clients && Array.isArray(localData.clients) && localData.clients.length > 0) {
                                    existingClients = localData.clients;
                                    console.log(`📦 [LOAD CLIENTS] Found ${existingClients.length} clients in localStorage (PRIORITY)`);
                                }
                            }
                        } catch (e) {
                            console.warn('⚠️ [LOAD CLIENTS] Error reading from localStorage:', e);
                        }
                        
                        // Priority 2: If no clients in localStorage, try loadedData (from Firestore siteData)
                        if (existingClients.length === 0 && loadedData && loadedData.clients && Array.isArray(loadedData.clients)) {
                            existingClients = loadedData.clients;
                            console.log(`📦 [LOAD CLIENTS] Found ${existingClients.length} clients in loadedData (from Firestore siteData)`);
                        }

                        if (!loadedData.clients) {
                            loadedData.clients = [];
                        }

                        // Process clients: ensure id field matches document ID
                        // Note: getCollection returns { id: doc.id, ...doc.data() }
                        // The doc.id is the Firestore document ID (which is client.id.toString())
                        const processedClients = clientsData.map((client, idx) => {
                            // The document ID from Firestore should be the client ID as a string
                            const docId = client.id; // This is doc.id from Firestore
                            
                            // Convert document ID to number (it's stored as string in Firestore)
                            let clientId;
                            if (typeof docId === 'string' && !isNaN(docId)) {
                                clientId = parseInt(docId);
                            } else if (typeof docId === 'number') {
                                clientId = docId;
                            } else {
                                // Fallback: use timestamp
                                clientId = Date.now() + idx;
                                console.warn(`⚠️ [LOAD CLIENTS] Invalid document ID for client ${idx}, using generated ID: ${clientId}`);
                            }
                            
                            // Ensure client has all required fields
                            const processedClient = {
                                ...client,
                                id: clientId,
                                name: client.name || `Client ${clientId}`,
                                logo: client.logo || 'backend/uploads/photos/logo_ae2i.png',
                                active: client.active !== undefined ? client.active : true
                            };
                            
                            return processedClient;
                        });

                        // FIX: Merge Firestore clients with existing clients instead of replacing
                        if (processedClients.length > 0) {
                            console.log(`✅ [LOAD] ${processedClients.length} clients loaded from Firestore collection`);
                            console.log('✅ [LOAD] Firestore Client IDs:', processedClients.map(c => c.id));
                            
                            // Create a map of Firestore clients by ID for quick lookup
                            const firestoreClientsMap = new Map();
                            processedClients.forEach(client => {
                                firestoreClientsMap.set(client.id, client);
                            });
                            
                            // Merge: Start with localStorage clients (preserve ALL originals), then update with Firestore
                            const mergedClients = [];
                            
                            // First, add ALL clients from localStorage (preserve originals - this is the key fix!)
                            existingClients.forEach(localClient => {
                                if (localClient && localClient.id) {
                                    mergedClients.push(localClient);
                                    console.log(`📦 [LOAD CLIENTS] Preserving original client: ${localClient.name} (ID: ${localClient.id})`);
                                }
                            });
                            
                            // Then, update/add clients from Firestore (overwrite if same ID, add if new)
                            processedClients.forEach(firestoreClient => {
                                const existingIndex = mergedClients.findIndex(c => c.id === firestoreClient.id);
                                if (existingIndex >= 0) {
                                    // Update existing client with Firestore data
                                    mergedClients[existingIndex] = firestoreClient;
                                    console.log(`🔄 [LOAD CLIENTS] Updated client from Firestore: ${firestoreClient.name} (ID: ${firestoreClient.id})`);
                                } else {
                                    // Add new client from Firestore
                                    mergedClients.push(firestoreClient);
                                    console.log(`➕ [LOAD CLIENTS] Added new client from Firestore: ${firestoreClient.name} (ID: ${firestoreClient.id})`);
                                }
                            });
                            
                            loadedData.clients = mergedClients;
                            console.log(`✅ [LOAD] Merged ${mergedClients.length} total clients (${existingClients.length} from localStorage + ${processedClients.length} from Firestore)`);
                            console.log('✅ [LOAD] Final Client Names & IDs:', mergedClients.map(c => `${c.name} (${c.id})`));
                        } else {
                            console.log('ℹ️ [LOAD] Clients collection exists but is empty - keeping localStorage clients');
                            // Keep existing clients from localStorage if Firestore is empty
                            if (existingClients.length > 0) {
                                loadedData.clients = existingClients;
                                console.log(`📦 [LOAD] Preserved ${existingClients.length} clients from localStorage`);
                            }
                        }
                    } else {
                        console.log('ℹ️ [LOAD] No clients found in Firestore collection (will use siteData.clients)');
                    }
                } catch (clientsError) {
                    console.warn('⚠️ [LOAD] Error loading clients from Firestore:', clientsError);
                }

                // Also load testimonials separately from Firebase (from dedicated collection)
                try {
                    const testimonialsResult = await window.firebaseHelper.getCollection('testimonials');
                    if (testimonialsResult && testimonialsResult.success && testimonialsResult.data && Array.isArray(testimonialsResult.data)) {
                        const testimonialsData = testimonialsResult.data;
                        console.log(`✅ [LOAD] ${testimonialsData.length} testimonials loaded from Firestore`);

                        // Merge testimonials into loadedData
                        if (!loadedData) {
                            loadedData = {};
                        }
                        if (!loadedData.testimonials) {
                            loadedData.testimonials = [];
                        }

                        // Process testimonials: ensure id field matches document ID
                        const processedTestimonials = testimonialsData.map(testimonial => {
                            const docId = testimonial.id;
                            if (typeof docId === 'string' && !isNaN(docId)) {
                                testimonial.id = parseInt(docId);
                            } else if (typeof docId === 'number') {
                                testimonial.id = docId;
                            }
                            if (!testimonial.id) {
                                testimonial.id = Date.now();
                            }
                            return testimonial;
                        });

                        // Merge testimonials (replace with Firestore data if available)
                        if (processedTestimonials.length > 0) {
                            loadedData.testimonials = processedTestimonials;
                            console.log('✅ [LOAD] Testimonials merged into siteData from Firestore collection');
                        }
                    } else {
                        console.log('ℹ️ [LOAD] No testimonials found in Firestore collection (will use siteData.testimonials)');
                    }
                } catch (testimonialsError) {
                    console.warn('⚠️ [LOAD] Error loading testimonials from Firestore:', testimonialsError);
                }

                // Also load custom pages separately from Firebase (from dedicated collection)
                try {
                    const customPagesResult = await window.firebaseHelper.getCollection('customPages');
                    if (customPagesResult && customPagesResult.success && customPagesResult.data && Array.isArray(customPagesResult.data)) {
                        const customPagesData = customPagesResult.data;
                        console.log(`✅ [LOAD] ${customPagesData.length} custom pages loaded from Firestore`);

                        // Merge custom pages into loadedData
                        if (!loadedData) {
                            loadedData = {};
                        }
                        if (!loadedData.customPages) {
                            loadedData.customPages = [];
                        }

                        // Process custom pages: ensure id field matches document ID
                        const processedCustomPages = customPagesData.map(page => {
                            const docId = page.id;
                            let pageId;
                            if (typeof docId === 'string' && !isNaN(docId)) {
                                pageId = parseInt(docId);
                            } else if (typeof docId === 'number') {
                                pageId = docId;
                            } else {
                                pageId = Date.now();
                            }
                            
                            return {
                                ...page,
                                id: pageId
                            };
                        });

                        // Merge custom pages (replace with Firestore data if available)
                        if (processedCustomPages.length > 0) {
                            loadedData.customPages = processedCustomPages;
                            console.log('✅ [LOAD] Custom pages merged into siteData from Firestore collection');
                        }
                    } else {
                        console.log('ℹ️ [LOAD] No custom pages found in Firestore collection (will use siteData.customPages)');
                    }
                } catch (customPagesError) {
                    console.warn('⚠️ [LOAD] Error loading custom pages from Firestore:', customPagesError);
                }

                // NOTE: ISO data (brochure, ISO cert, QR code) is loaded separately AFTER localStorage
                // to ensure it always overrides any old data from localStorage
                // See code after localStorage fallback below

                // Also load footer settings separately from Firebase
                try {
                    const footerResult = await window.firebaseHelper.getDocument('footerSettings', 'main');
                    if (footerResult && footerResult.success && footerResult.data) {
                        const footerData = footerResult.data;
                        console.log('✅ [LOAD] Footer settings loaded from Firestore');

                        // Merge footer settings into loadedData
                        if (!loadedData) {
                            loadedData = {};
                        }

                        if (footerData.footerBackground) {
                            loadedData.footerBackground = footerData.footerBackground;
                            console.log('✅ [LOAD] Footer background loaded from Firestore');
                        }
                    } else {
                        console.log('ℹ️ [LOAD] No footer settings found in Firestore');
                    }
                } catch (footerError) {
                    console.warn('⚠️ [LOAD] Error loading footer settings from Firestore:', footerError);
                }
            } catch (firebaseError) {
                console.warn('⚠️ [LOAD] Error loading from Firestore:', firebaseError);
                console.warn('⚠️ [LOAD] Error details:', firebaseError.message);
                console.log('ℹ️ [LOAD] Falling back to localStorage');
            }
        }

        // Fallback to localStorage if Firebase didn't work or not in Firebase mode
        if (!loadedData) {
            const savedData = localStorage.getItem('ae2i_site_data');
            if (savedData) {
                loadedData = JSON.parse(savedData);
                console.log('💾 [LOAD] Site data loaded from localStorage');
            }
        }

        // FIX: Always try to load ISO data and Footer settings separately AFTER localStorage (public read access, works even if not authenticated)
        // This ensures brochure, ISO cert, and footer background are always up-to-date and OVERRIDE any old data from localStorage
        let firestoreIsoData = null;
        let firestoreFooterData = null;
        if (typeof APP_MODE !== 'undefined' && APP_MODE === 'FIREBASE' && typeof window.firebaseHelper !== 'undefined') {
            try {
                const isoResult = await window.firebaseHelper.getDocument('iso', 'main');
                if (isoResult && isoResult.success && isoResult.data) {
                    firestoreIsoData = isoResult.data;
                    console.log('✅ [LOAD] ISO data loaded from Firestore (standalone, after localStorage)');
                    
                    // Initialize loadedData if it doesn't exist
                    if (!loadedData) {
                        loadedData = {};
                    }
                    
                    // Always override with Firestore ISO data (even if localStorage had old data)
                    if (firestoreIsoData.brochure) {
                        loadedData.brochure = firestoreIsoData.brochure;
                        console.log('✅ [LOAD] Brochure OVERRIDDEN from Firestore:', firestoreIsoData.brochure.name);
                        console.log('✅ [LOAD] Brochure URL:', firestoreIsoData.brochure.url);
                    }
                    if (firestoreIsoData.isoCert) {
                        loadedData.isoCert = firestoreIsoData.isoCert;
                        console.log('✅ [LOAD] ISO Certificate OVERRIDDEN from Firestore');
                    }
                    if (firestoreIsoData.isoQr) {
                        loadedData.isoQr = firestoreIsoData.isoQr;
                    }
                    if (firestoreIsoData.gallery) {
                        loadedData.gallery = firestoreIsoData.gallery;
                    }
                }
            } catch (isoError) {
                console.warn('⚠️ [LOAD] Error loading ISO data (standalone):', isoError);
            }
            
            // Also load footer settings separately
            try {
                const footerResult = await window.firebaseHelper.getDocument('footerSettings', 'main');
                if (footerResult && footerResult.success && footerResult.data) {
                    firestoreFooterData = footerResult.data;
                    console.log('✅ [LOAD] Footer settings loaded from Firestore (standalone, after localStorage)');
                    
                    // Initialize loadedData if it doesn't exist
                    if (!loadedData) {
                        loadedData = {};
                    }
                    
                    // Always override with Firestore footer data (even if localStorage had old data)
                    if (firestoreFooterData.footerBackground) {
                        loadedData.footerBackground = firestoreFooterData.footerBackground;
                        console.log('✅ [LOAD] Footer background OVERRIDDEN from Firestore:', firestoreFooterData.footerBackground.type || 'gradient');
                    }
                }
            } catch (footerError) {
                console.warn('⚠️ [LOAD] Error loading footer settings (standalone):', footerError);
            }
        }

        if (loadedData) {
            // Validation des données chargées
            if (loadedData && loadedData.settings) {
                // FIX: Save Firestore ISO data before merging (to prevent localStorage override)
                const firestoreBrochure = loadedData.brochure;
                const firestoreIsoCert = loadedData.isoCert;
                const firestoreIsoQr = loadedData.isoQr;
                const firestoreGallery = loadedData.gallery;
                
                siteData = { ...siteData, ...loadedData };
                
                // FIX: Always prioritize Firestore ISO data over localStorage (even if localStorage was loaded)
                // This ensures that the latest brochure from Firestore is always used
                if (firestoreBrochure) {
                    siteData.brochure = firestoreBrochure;
                    console.log('✅ [LOAD] Brochure from Firestore prioritized:', firestoreBrochure.name);
                    console.log('✅ [LOAD] Brochure URL:', firestoreBrochure.url);
                }
                if (firestoreIsoCert) {
                    siteData.isoCert = firestoreIsoCert;
                }
                if (firestoreIsoQr) {
                    siteData.isoQr = firestoreIsoQr;
                }
                if (firestoreGallery) {
                    siteData.gallery = firestoreGallery;
                }

                // Remove Firebase-specific fields before merging
                delete siteData.lastUpdated;
                delete siteData.updatedBy;

                // Garantir que les utilisateurs par défaut existent toujours
                const defaultUsers = [
                    { id: 1, username: 'admin', email: 'selmabdf@gmail.com', role: 'admin', password: 'Selma@2219', active: true },
                    { id: 2, username: 'recruiter', email: 'recruiter@ae2i-algerie.com', role: 'recruiter', password: 'recruiter123', active: true },
                    { id: 3, username: 'reader', email: 'reader@ae2i-algerie.com', role: 'reader', password: 'reader123', active: true }
                ];

                if (!siteData.users || siteData.users.length === 0) {
                    siteData.users = defaultUsers;
                    console.log('🔧 Utilisateurs par défaut restaurés (seront sauvegardés plus tard)');
                } else {
                    // Vérifier et corriger l'utilisateur admin si nécessaire
                    const adminUser = siteData.users.find(u => u.username === 'admin');
                    if (adminUser) {
                        // Mettre à jour le mot de passe admin si différent
                        if (adminUser.password !== 'Selma@2219') {
                            adminUser.password = 'Selma@2219';
                            adminUser.email = 'selmabdf@gmail.com';
                            adminUser.role = 'admin';
                            adminUser.active = true;
                            console.log('🔧 Mot de passe admin corrigé (sera sauvegardé plus tard)');
                        }
                    } else {
                        // Ajouter l'admin s'il n'existe pas
                        siteData.users.unshift(defaultUsers[0]);
                        console.log('🔧 Utilisateur admin ajouté (sera sauvegardé plus tard)');
                    }
                }

                // Restaurer la session utilisateur si elle existe (sauf après logout)
                const loggedOutFlag = localStorage.getItem('ae2i_logged_out');
                if (loggedOutFlag !== 'true' && !justLoggedOut) {
                    const savedSession = localStorage.getItem('ae2i_current_user');
                    if (savedSession) {
                        try {
                            const sessionData = JSON.parse(savedSession);
                            if (sessionData && sessionData.isLoggedIn) {
                                currentUser = sessionData;
                                console.log('✅ Session restaurée:', currentUser.username, 'Role:', currentUser.role);
                            }
                        } catch (e) {
                            console.error('❌ Erreur restauration session:', e);
                            localStorage.removeItem('ae2i_current_user');
                        }
                    }
                } else {
                    console.log('⏸️ [RESTORE] Logout détecté (flag ou récent), skip restauration session dans loadSiteData');
                }

                console.log('✅ Données chargées avec succès');

                /* FIX: Sauvegarder corrections sans déclencher boucle infinie */
                // Sauvegarder les corrections éventuelles après le chargement complet
                setTimeout(() => {
                    const needsFix = siteData.users.find(u => u.username === 'admin' && u.password === 'Selma@2219');
                    const alreadyFixed = localStorage.getItem('ae2i_admin_fixed');

                    if (needsFix && !alreadyFixed && currentUser.isLoggedIn) {
                        console.log('💾 [FIX] Sauvegarde corrections avec session active:', currentUser.username);
                        // Re-sauvegarder session avant forceSaveData
                        localStorage.setItem('ae2i_current_user', JSON.stringify(currentUser));
                        forceSaveData();
                        localStorage.setItem('ae2i_admin_fixed', 'true');
                        console.log('💾 Corrections sauvegardées');
                    }
                }, 100);

                return true;
            } else {
                throw new Error('Données corrompues détectées');
            }
        } else {
            // Tentative de récupération depuis la sauvegarde de secours
            const backupData = sessionStorage.getItem('ae2i_backup_data');
            if (backupData) {
                const parsed = JSON.parse(backupData);
                siteData = { ...siteData, ...parsed };
                console.log('✅ Données récupérées depuis la sauvegarde de secours');
                forceSaveData(); // Restaurer dans localStorage
                return true;
            }

            // Tentative de récupération d'urgence
            const emergencyData = sessionStorage.getItem('ae2i_emergency_backup');
            if (emergencyData) {
                const parsed = JSON.parse(emergencyData);
                siteData.settings = { ...siteData.settings, ...parsed.settings };
                siteData.users = parsed.users || siteData.users;
                console.log('🆘 Données d\'urgence récupérées');
                showNotification('Données d\'urgence récupérées - Veuillez vérifier vos paramètres', 'warning');
                return true;
            }
        }

        console.log('ℹ️ Aucune donnée sauvegardée trouvée - Utilisation des données par défaut');
        return false;
    } catch (error) {
        console.error('❌ Erreur chargement critique:', error);
        showNotification('Erreur de chargement des données - Utilisation des paramètres par défaut', 'error');
        return false;
    }
}

// Maintenance mode
async function toggleMaintenanceMode() {
    const enabled = document.getElementById('maintenanceMode').checked;
    const previousState = siteData.settings.maintenanceMode;
    siteData.settings.maintenanceMode = enabled;

    try {
        // Save to Firestore first (if Firebase mode is enabled)
        if (typeof APP_MODE !== 'undefined' && APP_MODE === 'FIREBASE' && typeof window.firebaseHelper !== 'undefined' && typeof saveAdminDataToFirestore === 'function') {
            await saveAdminDataToFirestore('settings', 'main', siteData.settings, `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
        }
        
        // Then save to localStorage
        if (forceSaveData()) {
            if (enabled) {
                // FIX: Déconnecter tous les utilisateurs (y compris l'admin) quand le mode maintenance est activé
                console.log('🔴 [MAINTENANCE] Mode maintenance activé - Déconnexion de tous les utilisateurs...');
                
                // Log activity before logout
                if (currentUser && currentUser.username && currentUser.username !== 'guest') {
                    logActivity(currentUser.username, 'Mode maintenance activé - Déconnexion automatique');
                }
                
                // Sign out from Firebase if available
                try {
                    const signOutFn = window.firebaseServices?.signOut;
                    if (typeof signOutFn === 'function') {
                        await signOutFn();
                    } else if (window.firebaseServices?.auth?.signOut) {
                        await window.firebaseServices.auth.signOut();
                    } else if (window.firebaseHelper && typeof window.firebaseHelper.logout === 'function') {
                        await window.firebaseHelper.logout();
                    }
                    console.log('✅ [MAINTENANCE] Firebase sign out completed');
                } catch (error) {
                    console.error('❌ [MAINTENANCE] Firebase sign out error:', error);
                    // Continue with logout even if Firebase fails
                }
                
                // Clear user data
                currentUser = { username: "guest", role: "guest", isLoggedIn: false };
                window.currentUser = currentUser;
                localStorage.removeItem('ae2i_current_user');
                localStorage.setItem('ae2i_logged_out', 'true');
                justLoggedOut = true;
                
                // Update UI
                updateLoginStatus();
                updateLoginButton();
                
                // Apply maintenance mode UI
                document.body.classList.add('maintenance-mode');
                const maintenanceNotice = document.getElementById('maintenanceNotice');
                if (maintenanceNotice) {
                    maintenanceNotice.style.display = 'block';
                }
                
                // Show maintenance page
                updateMaintenanceStatus();
                
                showNotification(siteData.language === 'en' ? 'Maintenance mode enabled - All users logged out' : 'Mode maintenance activé - Tous les utilisateurs déconnectés', 'warning');
            } else {
                document.body.classList.remove('maintenance-mode');
                const maintenanceNotice = document.getElementById('maintenanceNotice');
                if (maintenanceNotice) {
                    maintenanceNotice.style.display = 'none';
                }
                showNotification(siteData.language === 'en' ? 'Maintenance mode disabled' : 'Mode maintenance désactivé', 'success');
                
                // Log activity (admin is still logged in when disabling)
                if (currentUser && currentUser.username && currentUser.username !== 'guest') {
                    logActivity(currentUser.username, 'Mode maintenance désactivé');
                }
            }
        } else {
            // Revert if save failed
            siteData.settings.maintenanceMode = previousState;
            showNotification('Échec de sauvegarde du mode maintenance', 'error');
            document.getElementById('maintenanceMode').checked = !enabled; // Revert checkbox
        }
    } catch (error) {
        console.error('❌ [MAINTENANCE] Error toggling maintenance mode:', error);
        // Revert on error
        siteData.settings.maintenanceMode = previousState;
        showNotification('Erreur lors de la modification du mode maintenance', 'error');
        document.getElementById('maintenanceMode').checked = !enabled; // Revert checkbox
    }
}

/* FIX: remove-loading-screen */

// LinkedIn Integration
/* FIX: linkedin-auth-redirect */
/* ADD: linkedin-form-autofill */
/* FIX: linkedin-token-session */
/* ADD: linkedin-profile-redirect */

const LINKEDIN_CONFIG = {
    clientId: null,
    redirectUri: window.location.origin + window.location.pathname, // Include pathname for proper redirect
    scope: 'openid profile email',
    state: Math.random().toString(36).substring(7)
};

async function connectLinkedIn() {
    // Check if already connected
    const linkedInToken = sessionStorage.getItem('linkedin_access_token');
    if (linkedInToken) {
        showNotification(siteData.language === 'en' ? 'Already connected to LinkedIn' : 'Déjà connecté à LinkedIn', 'info');
        return;
    }

    try {
        // FIX: linkedin-backend-auth - Fetch client ID securely from backend (Cloudflare Worker)
        const configResponse = await fetch(`${R2_CONFIG.workerUrl}/linkedin/key`);
        const config = await configResponse.json();

        if (!config.client_id) {
            showNotification(siteData.language === 'en' ? 'LinkedIn configuration error' : 'Erreur de configuration LinkedIn', 'error');
            return;
        }

        LINKEDIN_CONFIG.clientId = config.client_id;
        // ALWAYS use the current page URL, NOT the worker's URL
        // The worker might return its own URL, but we need the frontend URL
        // IMPORTANT: Your LinkedIn app has: https://ae2i-b6c7f.web.app/carriere/
        // So we need to ensure trailing slash matches
        let pathname = window.location.pathname;
        // If we're on /carriere page, ensure trailing slash to match LinkedIn settings
        if (pathname === '/carriere') {
            pathname = '/carriere/'; // Add trailing slash to match LinkedIn app
        } else if (!pathname.endsWith('/') && pathname !== '/') {
            // For other pages, keep as-is unless it's root
            pathname = pathname;
        }
        LINKEDIN_CONFIG.redirectUri = window.location.origin + pathname;

        // Only use worker's redirect_uri if it's explicitly set as a secret AND matches our origin
        // This prevents using the worker's URL by mistake
        if (config.redirect_uri && config.redirect_uri.startsWith(window.location.origin)) {
            LINKEDIN_CONFIG.redirectUri = config.redirect_uri;
            console.log('🔗 [LINKEDIN] Using redirect URI from worker config:', LINKEDIN_CONFIG.redirectUri);
        } else {
            console.log('🔗 [LINKEDIN] Using frontend URL (ignoring worker URL):', LINKEDIN_CONFIG.redirectUri);
            if (config.redirect_uri) {
                console.warn('⚠️ [LINKEDIN] Worker returned redirect URI:', config.redirect_uri, '- but it doesn\'t match frontend origin, so ignoring it');
            }
        }

        // Log redirect URI for debugging
        console.log('🔗 [LINKEDIN] Using redirect URI:', LINKEDIN_CONFIG.redirectUri);
        console.log('⚠️ [LINKEDIN] IMPORTANT: This redirect URI must match EXACTLY in your LinkedIn app settings!');
        console.log('⚠️ [LINKEDIN] Go to: https://www.linkedin.com/developers/apps → Your App → Auth tab');
        console.log('⚠️ [LINKEDIN] Your LinkedIn app should have:', LINKEDIN_CONFIG.redirectUri);

        // Save redirect URI to localStorage so it persists after redirect
        localStorage.setItem('linkedin_debug_redirect_uri', LINKEDIN_CONFIG.redirectUri);
        localStorage.setItem('linkedin_debug_timestamp', new Date().toISOString());

        // Also display it on the page so user can see it
        const debugInfo = document.createElement('div');
        debugInfo.id = 'linkedin-debug-info';
        debugInfo.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #ff6b6b; color: white; padding: 15px; border-radius: 8px; z-index: 99999; font-family: monospace; font-size: 12px; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
        debugInfo.innerHTML = `
            <strong>🔗 LinkedIn Redirect URI:</strong><br>
            <code style="background: rgba(0,0,0,0.3); padding: 5px; display: block; margin: 5px 0; word-break: break-all;">${LINKEDIN_CONFIG.redirectUri}</code>
            <small>This must match EXACTLY in your LinkedIn app settings!</small>
        `;
        document.body.appendChild(debugInfo);

        // Remove debug info after 10 seconds
        setTimeout(() => {
            const info = document.getElementById('linkedin-debug-info');
            if (info) info.remove();
        }, 10000);

        // Build OAuth2 authorization URL
        const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', LINKEDIN_CONFIG.clientId);
        authUrl.searchParams.append('redirect_uri', LINKEDIN_CONFIG.redirectUri);
        authUrl.searchParams.append('scope', LINKEDIN_CONFIG.scope);
        authUrl.searchParams.append('state', LINKEDIN_CONFIG.state);

        // Log for debugging - check browser console to see what redirect URI is being used
        console.log('🔗 [LINKEDIN] Redirect URI being sent:', LINKEDIN_CONFIG.redirectUri);
        console.log('🔗 [LINKEDIN] Full auth URL:', authUrl.toString());
        console.log('💾 [LINKEDIN] Saved redirect URI to localStorage. After redirect, check: localStorage.getItem("linkedin_debug_redirect_uri")');

        sessionStorage.setItem('linkedin_oauth_state', LINKEDIN_CONFIG.state);
        sessionStorage.setItem('linkedin_redirect_origin', 'application_form');
        
        // Save current page state (hash, scroll position, jobId, etc.) to restore after LinkedIn callback
        const currentHash = window.location.hash;
        const currentScrollY = window.scrollY;
        if (currentHash) {
            sessionStorage.setItem('linkedin_saved_hash', currentHash);
            console.log('💾 [LINKEDIN] Saved hash for restoration:', currentHash);
        }
        sessionStorage.setItem('linkedin_saved_scroll', currentScrollY.toString());
        
        // Save jobId if application form is open
        const applicationForm = document.getElementById('applicationForm');
        if (applicationForm && applicationForm.dataset.jobId) {
            sessionStorage.setItem('linkedin_saved_jobId', applicationForm.dataset.jobId);
            console.log('💾 [LINKEDIN] Saved jobId for restoration:', applicationForm.dataset.jobId);
        }

        // Small delay to ensure logs are visible before redirect
        setTimeout(() => {
            // Redirect to LinkedIn OAuth
            window.location.href = authUrl.toString();
        }, 500);
    } catch (error) {
        console.error('LinkedIn connection error:', error);
        showNotification(siteData.language === 'en' ? 'Failed to connect to LinkedIn' : 'Échec de connexion à LinkedIn', 'error');
    }
}

function disconnectLinkedIn() {
    sessionStorage.removeItem('linkedin_access_token');
    sessionStorage.removeItem('linkedin_profile_data');
    sessionStorage.removeItem('linkedin_oauth_state');
    sessionStorage.removeItem('linkedin_redirect_origin');

    // Clear form fields
    clearApplicationForm();

    // Update UI
    updateLinkedInButtonState(false);

    showNotification(siteData.language === 'en' ? 'Disconnected from LinkedIn' : 'Déconnecté de LinkedIn', 'success');
    logActivity(currentUser.username || 'visitor', 'Déconnexion LinkedIn');
}
async function handleLinkedInCallback() {
    console.log('🔗 [LINKEDIN CALLBACK] Starting callback handler...');

    // Display saved redirect URI from localStorage
    const savedRedirectUri = localStorage.getItem('linkedin_debug_redirect_uri');
    const savedTimestamp = localStorage.getItem('linkedin_debug_timestamp');
    if (savedRedirectUri) {
        console.log('🔗 [LINKEDIN CALLBACK] Redirect URI used (from localStorage):', savedRedirectUri);
        console.log('🔗 [LINKEDIN CALLBACK] Saved at:', savedTimestamp);

        // Display on page
        const debugInfo = document.createElement('div');
        debugInfo.id = 'linkedin-callback-debug-info';
        debugInfo.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #4ecdc4; color: white; padding: 15px; border-radius: 8px; z-index: 99999; font-family: monospace; font-size: 12px; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
        debugInfo.innerHTML = `
            <strong>🔗 LinkedIn Redirect URI Used:</strong><br>
            <code style="background: rgba(0,0,0,0.3); padding: 5px; display: block; margin: 5px 0; word-break: break-all;">${savedRedirectUri}</code>
            <small>Check console for full details</small>
        `;
        document.body.appendChild(debugInfo);

        // Remove after 15 seconds
        setTimeout(() => {
            const info = document.getElementById('linkedin-callback-debug-info');
            if (info) info.remove();
        }, 15000);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const savedState = sessionStorage.getItem('linkedin_oauth_state');

    console.log('🔗 [LINKEDIN CALLBACK] Code:', code ? 'present' : 'missing');
    console.log('🔗 [LINKEDIN CALLBACK] State:', state);
    console.log('🔗 [LINKEDIN CALLBACK] Saved state:', savedState);
    console.log('🔗 [LINKEDIN CALLBACK] Current URL:', window.location.href);

    if (!code) {
        console.error('❌ [LINKEDIN CALLBACK] No authorization code in URL');
        console.error('❌ [LINKEDIN CALLBACK] URL params:', {
            code: code,
            state: state,
            error: urlParams.get('error'),
            error_description: urlParams.get('error_description'),
            full_url: window.location.href
        });
        showNotification(siteData.language === 'en' ? 'LinkedIn authentication failed: No authorization code' : 'Échec de l\'authentification LinkedIn: Aucun code d\'autorisation', 'error');
        // Clean up URL without reloading
        if (window.history && window.history.replaceState) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            console.log('🔗 [LINKEDIN CALLBACK] Cleaned URL:', cleanUrl);
        }
        // Clean up saved state on error
        sessionStorage.removeItem('linkedin_saved_hash');
        sessionStorage.removeItem('linkedin_saved_scroll');
        sessionStorage.removeItem('linkedin_saved_jobId');
        return;
    }

    if (!state || !savedState || state !== savedState) {
        console.error('❌ [LINKEDIN CALLBACK] State mismatch!');
        console.error('❌ [LINKEDIN CALLBACK] State from URL:', state);
        console.error('❌ [LINKEDIN CALLBACK] Saved state:', savedState);
        console.error('❌ [LINKEDIN CALLBACK] States match:', state === savedState);
        showNotification(siteData.language === 'en' ? 'LinkedIn authentication failed: Security check failed' : 'Échec de l\'authentification LinkedIn: Échec de la vérification de sécurité', 'error');
        // Clean up URL without reloading
        if (window.history && window.history.replaceState) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            console.log('🔗 [LINKEDIN CALLBACK] Cleaned URL:', cleanUrl);
        }
        // Clean up saved state on error
        sessionStorage.removeItem('linkedin_saved_hash');
        sessionStorage.removeItem('linkedin_saved_scroll');
        sessionStorage.removeItem('linkedin_saved_jobId');
        return;
    }

    console.log('✅ [LINKEDIN CALLBACK] Code and state validated successfully');

    try {
        console.log('🔗 [LINKEDIN CALLBACK] Processing authentication...');
        showNotification(siteData.language === 'en' ? 'LinkedIn connection in progress...' : 'Connexion LinkedIn en cours...', 'info');

        // FIX: linkedin-backend-auth - Exchange code for token via backend
        const profileData = await fetchLinkedInProfile(code);
        console.log('🔗 [LINKEDIN CALLBACK] Profile data received:', profileData ? 'success' : 'failed');

        if (profileData) {
            sessionStorage.setItem('linkedin_profile_data', JSON.stringify(profileData));
            sessionStorage.setItem('linkedin_access_token', profileData.accessToken);
            console.log('✅ [LINKEDIN CALLBACK] Profile saved to sessionStorage');

            // Prefill form with LinkedIn data
            prefillFormWithLinkedInData(profileData);
            console.log('✅ [LINKEDIN CALLBACK] Form prefilled');

            // Update UI
            updateLinkedInButtonState(true, profileData);
            console.log('✅ [LINKEDIN CALLBACK] UI updated');

            // Restore saved page state (hash, scroll position, jobId) before cleaning URL
            const savedHash = sessionStorage.getItem('linkedin_saved_hash');
            const savedScroll = sessionStorage.getItem('linkedin_saved_scroll');
            const savedJobId = sessionStorage.getItem('linkedin_saved_jobId');
            
            // Clean up URL parameters WITHOUT reloading
            if (window.history && window.history.replaceState) {
                let cleanUrl = window.location.pathname;
                // Restore hash if it was saved (e.g., #job-123)
                if (savedHash) {
                    cleanUrl += savedHash;
                    console.log('🔄 [LINKEDIN CALLBACK] Restoring hash:', savedHash);
                }
                window.history.replaceState({}, document.title, cleanUrl);
                console.log('🔗 [LINKEDIN CALLBACK] Cleaned URL (no reload):', cleanUrl);
                
                // Restore scroll position if saved
                if (savedScroll) {
                    setTimeout(() => {
                        window.scrollTo(0, parseInt(savedScroll, 10));
                    }, 100);
                }
                
                // Reopen application form if jobId was saved
                if (savedJobId && typeof openApplicationForm === 'function') {
                    setTimeout(() => {
                        console.log('🔄 [LINKEDIN CALLBACK] Reopening application form for jobId:', savedJobId);
                        openApplicationForm(parseInt(savedJobId, 10));
                    }, 300);
                }
                
                // Clean up saved state
                sessionStorage.removeItem('linkedin_saved_hash');
                sessionStorage.removeItem('linkedin_saved_scroll');
                sessionStorage.removeItem('linkedin_saved_jobId');
            }

            // MODIFIED: Auto-redirect to LinkedIn profile in new tab after successful connection
            if (profileData.publicProfileUrl) {
                setTimeout(() => {
                    window.open(profileData.publicProfileUrl, '_blank', 'noopener,noreferrer');
                }, 500);
            }

            showNotification(siteData.language === 'en' ? 'Successfully connected to LinkedIn! Profile opened in new tab.' : 'Connecté à LinkedIn avec succès ! Profil ouvert dans un nouvel onglet.', 'success');
            logActivity(currentUser.username || 'visitor', 'Connexion LinkedIn réussie - Redirection automatique vers profil');
        }
    } catch (error) {
        console.error('❌ [LINKEDIN CALLBACK] LinkedIn authentication error:', error);
        console.error('❌ [LINKEDIN CALLBACK] Error details:', {
            message: error.message,
            stack: error.stack,
            code: urlParams.get('code'),
            state: urlParams.get('state'),
            error_param: urlParams.get('error'),
            error_description: urlParams.get('error_description')
        });
        
        // Clean up saved state on error
        sessionStorage.removeItem('linkedin_saved_hash');
        sessionStorage.removeItem('linkedin_saved_scroll');
        sessionStorage.removeItem('linkedin_saved_jobId');

        // Check for LinkedIn error parameters
        const linkedInError = urlParams.get('error');
        const linkedInErrorDesc = urlParams.get('error_description');

        if (linkedInError) {
            console.error('❌ [LINKEDIN CALLBACK] LinkedIn returned error:', linkedInError, linkedInErrorDesc);
            showNotification(
                siteData.language === 'en'
                    ? `LinkedIn error: ${linkedInErrorDesc || linkedInError}`
                    : `Erreur LinkedIn: ${linkedInErrorDesc || linkedInError}`,
                'error'
            );
        } else {
            showNotification(
                siteData.language === 'en'
                    ? `LinkedIn connection error: ${error.message}`
                    : `Erreur de connexion LinkedIn: ${error.message}`,
                'error'
            );
        }

        // Clean up URL on error too
        if (window.history && window.history.replaceState) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            console.log('🔗 [LINKEDIN CALLBACK] Cleaned URL after error:', cleanUrl);
        }
    }
}

async function fetchLinkedInProfile(code) {
    // FIX: linkedin-token-exchange - Call backend API to exchange code for token (Cloudflare Worker)
    // ADD: linkedin-user-profile-fetch - Backend fetches user profile data
    try {
        // Get the redirect URI that was used in the authorization request
        // Try multiple sources in order of preference
        let redirectUri = LINKEDIN_CONFIG.redirectUri;
        if (!redirectUri) {
            // Try localStorage (saved before redirect)
            redirectUri = localStorage.getItem('linkedin_debug_redirect_uri');
        }
        if (!redirectUri) {
            // Fallback to current URL
            let pathname = window.location.pathname;
            if (pathname === '/carriere') {
                pathname = '/carriere/';
            }
            redirectUri = window.location.origin + pathname;
        }

        console.log('🔗 [LINKEDIN FETCH] Using redirect URI:', redirectUri);
        console.log('🔗 [LINKEDIN FETCH] Code received:', code ? 'yes' : 'no');
        console.log('🔗 [LINKEDIN FETCH] Worker URL:', R2_CONFIG.workerUrl);

        const response = await fetch(`${R2_CONFIG.workerUrl}/linkedin/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                redirect_uri: redirectUri  // Pass the same redirect URI used in authorization
            })
        });

        console.log('🔗 [LINKEDIN FETCH] Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ [LINKEDIN FETCH] Error response:', errorData);
            throw new Error(errorData.error || `Failed to authenticate with LinkedIn: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        return {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            profilePicture: data.profilePicture,
            publicProfileUrl: `https://www.linkedin.com/in/${data.sub}`,
            accessToken: data.access_token
        };
    } catch (error) {
        console.error('LinkedIn profile fetch error:', error);
        throw error;
    }
}

function prefillFormWithLinkedInData(profileData) {
    /* ADD: linkedin-form-autofill */
    if (profileData.lastName) {
        document.getElementById('applicantLastName').value = profileData.lastName;
    }
    if (profileData.firstName) {
        document.getElementById('applicantFirstName').value = profileData.firstName;
    }
    if (profileData.email) {
        document.getElementById('applicantEmail').value = profileData.email;
    }
    if (profileData.headline) {
        document.getElementById('applicantPosition').value = profileData.headline;
    }

    // Trigger any conditional field displays
    const employedRadio = document.querySelector('input[name="currentlyEmployed"][value="yes"]');
    if (employedRadio) {
        employedRadio.checked = true;
        toggleNoticeField('yes');
    }
}

function updateLinkedInButtonState(isConnected, profileData = null) {
    const linkedInBtn = document.querySelector('.linkedin-btn');
    if (!linkedInBtn) return;

    if (isConnected && profileData) {
        linkedInBtn.innerHTML = `
            <i class="fab fa-linkedin" aria-hidden="true"></i>
            <span data-fr="✓ ${profileData.firstName} ${profileData.lastName} - Voir mon profil" data-en="✓ ${profileData.firstName} ${profileData.lastName} - View profile" data-ar="✓ ${profileData.firstName} ${profileData.lastName} - عرض الملف الشخصي">
                ✓ ${profileData.firstName} ${profileData.lastName} - Voir mon profil
            </span>
        `;
        linkedInBtn.onclick = () => window.open(profileData.publicProfileUrl, '_blank', 'noopener,noreferrer');
        linkedInBtn.style.background = '#00a000';
        linkedInBtn.title = 'Cliquez pour ouvrir votre profil LinkedIn';

        // Add disconnect button
        const disconnectBtn = document.createElement('button');
        disconnectBtn.className = 'btn btn-outline functional-btn';
        disconnectBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> <span data-fr="Se déconnecter de LinkedIn" data-en="Disconnect from LinkedIn" data-ar="Se déconnecter de LinkedIn">Se déconnecter de LinkedIn</span>`;
        disconnectBtn.onclick = disconnectLinkedIn;
        disconnectBtn.style.width = '100%';
        disconnectBtn.style.marginBottom = 'var(--spacing-lg)';

        if (!document.getElementById('linkedin-disconnect-btn')) {
            disconnectBtn.id = 'linkedin-disconnect-btn';
            linkedInBtn.parentNode.insertBefore(disconnectBtn, linkedInBtn.nextSibling);
        }
    } else {
        linkedInBtn.innerHTML = `
            <i class="fab fa-linkedin" aria-hidden="true"></i>
            <span data-fr="Se connecter avec LinkedIn (auto-remplissage + profil)" data-en="Connect with LinkedIn (auto-fill + profile)" data-ar="الاتصال بـ LinkedIn (الملء التلقائي + الملف الشخصي)">
                Se connecter avec LinkedIn (auto-remplissage + profil)
            </span>
        `;
        linkedInBtn.onclick = connectLinkedIn;
        linkedInBtn.style.background = 'var(--gradient-primary)';

        // Remove disconnect button if exists
        const disconnectBtn = document.getElementById('linkedin-disconnect-btn');
        if (disconnectBtn) {
            disconnectBtn.remove();
        }
    }
}

function clearApplicationForm() {
    document.getElementById('applicantLastName').value = '';
    document.getElementById('applicantFirstName').value = '';
    document.getElementById('applicantEmail').value = '';
    document.getElementById('applicantPhone').value = '';
    document.getElementById('applicantPosition').value = '';
}

// Check for LinkedIn callback on page load
console.log('🔍 [LINKEDIN INIT] Checking for callback...');
console.log('🔍 [LINKEDIN INIT] Current URL:', window.location.href);
console.log('🔍 [LINKEDIN INIT] Search params:', window.location.search);
console.log('🔍 [LINKEDIN INIT] Has code param:', window.location.search.includes('code='));
console.log('🔍 [LINKEDIN INIT] Has error param:', window.location.search.includes('error='));

if (window.location.search.includes('code=')) {
    console.log('✅ [LINKEDIN INIT] LinkedIn callback detected - calling handleLinkedInCallback()');
    handleLinkedInCallback().catch(error => {
        console.error('❌ [LINKEDIN INIT] Callback handler failed:', error);
    });
} else if (window.location.search.includes('error=')) {
    // LinkedIn returned an error
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    console.error('❌ [LINKEDIN INIT] LinkedIn returned error:', error, errorDescription);
    showNotification(
        siteData.language === 'en'
            ? `LinkedIn error: ${errorDescription || error}`
            : `Erreur LinkedIn: ${errorDescription || error}`,
        'error'
    );
    // Clean URL
    if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
} else {
    console.log('ℹ️ [LINKEDIN INIT] No callback detected - checking for saved profile...');
    // Check if already connected and update UI
    const savedProfile = sessionStorage.getItem('linkedin_profile_data');
    if (savedProfile) {
        try {
            const profileData = JSON.parse(savedProfile);
            console.log('✅ [LINKEDIN INIT] Found saved profile, updating UI...');
            updateLinkedInButtonState(true, profileData);
            prefillFormWithLinkedInData(profileData);
        } catch (e) {
            console.error('❌ [LINKEDIN INIT] Error parsing LinkedIn profile data:', e);
        }
    } else {
        console.log('ℹ️ [LINKEDIN INIT] No saved profile found');
    }
}

// NOUVELLES FONCTIONS POUR LES CHAMPS CONDITIONNELS
function toggleNoticeField(value) {
    const noticeField = document.getElementById('noticeField');
    if (value === 'yes') {
        noticeField.classList.add('show');
    } else {
        noticeField.classList.remove('show');
        // Reset les champs si on cache la section
        document.getElementById('inNotice').checked = false;
        toggleNoticeDaysField(false);
    }
}

function toggleNoticeDaysField(checked) {
    const noticeDaysField = document.getElementById('noticeDaysField');
    if (checked) {
        noticeDaysField.classList.add('show');
        document.getElementById('noticeDays').required = true;
    } else {
        noticeDaysField.classList.remove('show');
        document.getElementById('noticeDays').required = false;
        document.getElementById('noticeDays').value = '';
        // Reset negotiable checkbox
        document.getElementById('noticeDaysNegotiable').checked = false;
        toggleNoticeDaysNegotiable(false);
    }
}

/* ADD: preavis-negociable-visual - Toggle visual state for negotiable notice */
function toggleNoticeDaysNegotiable(checked) {
    const noticeDaysInput = document.getElementById('noticeDays');
    if (checked) {
        noticeDaysInput.classList.add('negotiable');
        noticeDaysInput.setAttribute('data-negotiable-text', siteData.language === 'en' ? 'Negotiable' : 'Préavis flexible');
        noticeDaysInput.placeholder = siteData.language === 'en' ? 'Negotiable period' : 'Préavis flexible';
    } else {
        noticeDaysInput.classList.remove('negotiable');
        noticeDaysInput.placeholder = 'Ex: 30';
    }
}

/* Driver license toggle - SAME STRUCTURE AS PRÉAVIS */
function toggleDriverLicenseField(value) {
    const driverLicenseFields = document.getElementById('driverLicenseFields');
    if (value === 'yes') {
        driverLicenseFields.classList.add('show');
    } else {
        driverLicenseFields.classList.remove('show');
        // Reset fields when hiding
        document.querySelectorAll('input[name="licenseTypes"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('input[name="hasVehicle"]').forEach(radio => radio.checked = false);
    }
}

// Job Search Functionality ultra-améliorée avec filtres avancés
function setupJobSearch() {
    const searchInput = document.getElementById('jobSearchInput');
    const searchBtn = document.getElementById('jobSearchBtn');
    const searchResults = document.getElementById('jobSearchResults');
    const regionFilter = document.getElementById('regionFilter');
    const experienceFilter = document.getElementById('experienceFilter');
    const fieldFilter = document.getElementById('fieldFilter');
    const educationFilter = document.getElementById('educationFilter');

    if (searchInput && searchBtn && searchResults) {
        function performAdvancedSearch() {
            const query = searchInput.value.toLowerCase().trim();
            const selectedRegion = regionFilter ? regionFilter.value : '';
            const selectedExperience = experienceFilter ? experienceFilter.value : '';
            const selectedField = fieldFilter ? fieldFilter.value : '';
            const selectedEducation = educationFilter ? educationFilter.value : '';

            if (query.length < 2 && !selectedRegion && !selectedExperience && !selectedField && !selectedEducation) {
                searchResults.classList.remove('show');
                return;
            }

            const filteredJobs = siteData.jobs.filter(job => {
                if (!job.active) return false;

                let matchesQuery = true;
                if (query.length >= 2) {
                    matchesQuery =
                        job.title.fr.toLowerCase().includes(query) ||
                        job.title.en.toLowerCase().includes(query) ||
                        job.description.fr.toLowerCase().includes(query) ||
                        job.description.en.toLowerCase().includes(query) ||
                        job.requirements.fr.toLowerCase().includes(query) ||
                        job.requirements.en.toLowerCase().includes(query) ||
                        job.type.toLowerCase().includes(query) ||
                        job.location.toLowerCase().includes(query);
                }

                // Filtres avancés
                let matchesFilters = true;

                if (selectedRegion) {
                    matchesFilters = matchesFilters && job.location.toLowerCase().includes(selectedRegion.toLowerCase());
                }

                if (selectedExperience) {
                    matchesFilters = matchesFilters && (
                        job.requirements.fr.toLowerCase().includes(selectedExperience.toLowerCase()) ||
                        job.requirements.en.toLowerCase().includes(selectedExperience.toLowerCase())
                    );
                }

                if (selectedField) {
                    matchesFilters = matchesFilters && (
                        job.title.fr.toLowerCase().includes(selectedField.toLowerCase()) ||
                        job.title.en.toLowerCase().includes(selectedField.toLowerCase()) ||
                        job.description.fr.toLowerCase().includes(selectedField.toLowerCase()) ||
                        job.description.en.toLowerCase().includes(selectedField.toLowerCase())
                    );
                }

                return matchesQuery && matchesFilters;
            });

            searchResults.innerHTML = '';

            if (filteredJobs.length > 0) {
                const resultsHeader = document.createElement('div');
                resultsHeader.style.cssText = 'padding: 20px 28px; background: var(--primary); color: white; font-weight: 700; font-size: var(--font-size-base);';
                resultsHeader.innerHTML = `<i class="fas fa-search"></i> ${filteredJobs.length} ${translations[siteData.language].searchResults}`;
                searchResults.appendChild(resultsHeader);

                filteredJobs.forEach(job => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'search-result-item';
                    resultItem.innerHTML = `
                        <i class="fas fa-briefcase" style="color: var(--primary); font-size: var(--font-size-xl);"></i>
                        <div style="flex-grow: 1;">
                            /* FIX: Removed Premium and New badges from search results */
                            <div style="font-weight: 700; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; font-size: var(--font-size-lg);">
                                ${job.title[siteData.language] || job.title.fr}
                            </div>
                            <div style="font-size: var(--font-size-sm); color: var(--text-light); margin: 8px 0; display: flex; align-items: center; gap: 16px;">
                                <span style="background: var(--primary); color: white; padding: 4px 12px; border-radius: var(--border-radius-sm); font-size: 11px; font-weight: 700;">${job.type.toUpperCase()}</span>
                                <span><i class="fas fa-map-marker-alt" style="margin-right: 6px;"></i>${job.location}</span>
                            </div>
                            <div style="font-size: var(--font-size-sm); color: var(--text-lighter); line-height: 1.4;">
                                ${(job.description[siteData.language] || job.description.fr).substring(0, 150)}...
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <button class="btn btn-sm btn-primary functional-btn" onclick="openApplicationForm(${job.id}); document.getElementById('jobSearchResults').classList.remove('show');" style="font-size: 12px; padding: 6px 12px;">
                                ${translations[siteData.language].applyBtn}
                            </button>
                        </div>
                    `;
                    resultItem.addEventListener('click', () => {
                        openApplicationForm(job.id);
                        searchResults.classList.remove('show');
                        searchInput.value = '';
                    });
                    searchResults.appendChild(resultItem);
                });
                searchResults.classList.add('show');
            } else {
                searchResults.innerHTML = `<div class="search-result-item" style="text-align: center; color: var(--text-light);"><i class="fas fa-search" style="margin-right: 8px;"></i>${translations[siteData.language].noResults}</div>`;
                searchResults.classList.add('show');
            }

            logActivity(currentUser.username || 'visitor', `Recherche emploi: ${query} (${filteredJobs.length} résultats)`);
        }

        searchInput.addEventListener('input', performAdvancedSearch);
        searchBtn.addEventListener('click', performAdvancedSearch);

        // Setup advanced filters
        [regionFilter, experienceFilter, fieldFilter, educationFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', performAdvancedSearch);
            }
        });

        document.addEventListener('click', function (e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target) && !searchBtn.contains(e.target)) {
                searchResults.classList.remove('show');
            }
        });
    }
}

// Global initialization
/* FIX: Function to update ISO images dynamically */
function updateIsoImages() {
    // Update public page ISO QR code
    const aboutIsoQrImg = document.querySelector('#aboutIsoQr img');
    if (aboutIsoQrImg && siteData.isoQr) {
        aboutIsoQrImg.src = siteData.isoQr;
    }

    // Update public page ISO certificate
    const aboutIsoPreviewImg = document.querySelector('#aboutIsoPreview img');
    if (aboutIsoPreviewImg && siteData.isoCert) {
        aboutIsoPreviewImg.src = siteData.isoCert;
    }

    // Update admin preview ISO QR
    const adminIsoQrPreview = document.getElementById('adminIsoQrPreview');
    if (adminIsoQrPreview && siteData.isoQr) {
        adminIsoQrPreview.src = siteData.isoQr;
    }

    // Update admin preview ISO certificate
    const adminIsoCertPreview = document.getElementById('adminIsoCertPreview');
    if (adminIsoCertPreview && siteData.isoCert) {
        adminIsoCertPreview.src = siteData.isoCert;
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 [INIT] DOMContentLoaded - currentUser avant loadSiteData:', JSON.stringify(currentUser));
    await loadSiteData().catch(err => console.error('Error loading site data:', err));
    console.log('🚀 [INIT] Après loadSiteData - currentUser:', JSON.stringify(currentUser));

    // Load EmailJS configuration from settings
    loadEmailJSConfig();

    // Apply hero settings after data is loaded (with delay to ensure DOM is ready)
    // Also called in executeHomeScript when home page is shown
    setTimeout(() => {
        applyAllHeroSettings();
    }, 100);

    updateIsoImages(); // FIX: Update ISO images after loading data
    setupNavigation();
    setupLoginSystem();
    updateLoginButton(); // Mettre à jour le bouton login immédiatement
    updateLoginStatus(); // Restore login status after loading session
    console.log('🚀 [INIT] Après updateLoginStatus - currentUser:', JSON.stringify(currentUser));
    
    // FIX: Update maintenance status after login status is restored
    setTimeout(() => {
        updateMaintenanceStatus();
    }, 150);
    setupConsentSystem();
    setupThemeToggle();
    setupLanguageSwitch();
    addArabicTranslations();
    loadSocialNetworkStates(); // Add Arabic translations automatically
    setupScrollToTop();
    setupMobileMenu();
    setupJobSearch();
    initConsentSystem();
    initializeSocialsState(); // FIX: Initialize social networks visibility on load
    
    // FIX: Apply all settings after data is loaded (footer, ISO, clients, socials, custom pages)
    setTimeout(() => {
        applyCustomSettings(); // Apply footer background and other settings
        updateIsoImages(); // Ensure ISO images are updated
        renderAdminClients(); // Ensure clients are displayed
        const socialsEnabled = siteData.settings?.socialNetworksEnabled !== false;
        applySocialsVisibility(socialsEnabled); // Apply social networks visibility
        
        // FIX: Create custom page sections and update navigation
        if (siteData.customPages && Array.isArray(siteData.customPages) && siteData.customPages.length > 0) {
            console.log('📄 [INIT] Creating', siteData.customPages.length, 'custom page sections');
            siteData.customPages.forEach(page => {
                if (page && page.slug) {
                    createCustomPageSection(page);
                }
            });
            updateCustomPagesNavigation();
            console.log('✅ [INIT] Custom pages initialized');
        } else {
            console.log('ℹ️ [INIT] No custom pages to initialize');
        }
        
        // FIX: Update maintenance status after all data is loaded and DOM is ready
        updateMaintenanceStatus();
        
        console.log('✅ [INIT] All settings applied after data load');
    }, 300); // Increased delay to ensure DOM is fully ready
    
    // Also call updateMaintenanceStatus after a longer delay to ensure elements exist
    setTimeout(() => {
        updateMaintenanceStatus();
    }, 500);
    /* FIX: remove-loading-screen */

    logActivity('system', 'Site chargé');

    /* FIX: event-delegation */
    /* ADD: qa-debug-logs */
    // Délégation d'événements globale pour optimiser les performances
    setupGlobalEventDelegation();
});

/* FIX: event-delegation - Centralisation des event listeners */
function setupGlobalEventDelegation() {
    console.log('[QA] Setting up global event delegation...');

    // Délégation pour les effets hover sur les éléments dynamiques
    document.addEventListener('mouseenter', function (e) {
        const target = e.target;
        if (!target || typeof target.closest !== 'function') return;

        // Gestion des cartes et éléments avec effet hover
        if (target.closest('.service-item, .client-item, .testimonial-item, .job-item, .user-item, .log-item, .page-item, .cv-item, .message-item')) {
            const element = target.closest('.service-item, .client-item, .testimonial-item, .job-item, .user-item, .log-item, .page-item, .cv-item, .message-item');
            element.style.transform = 'translateY(-5px)';
            element.style.boxShadow = 'var(--shadow-lg)';
            element.style.borderColor = 'var(--primary)';
        }
    }, true);

    document.addEventListener('mouseleave', function (e) {
        const target = e.target;
        if (!target || typeof target.closest !== 'function') return;

        // Restauration du style par défaut
        if (target.closest('.service-item, .client-item, .testimonial-item, .job-item, .user-item, .log-item, .page-item, .cv-item, .message-item')) {
            const element = target.closest('.service-item, .client-item, .testimonial-item, .job-item, .user-item, .log-item, .page-item, .cv-item, .message-item');
            element.style.transform = 'translateY(0)';
            element.style.boxShadow = 'var(--shadow-md)';
            element.style.borderColor = 'var(--border)';
        }
    }, true);

    console.log('[QA] Global event delegation setup completed');
}

function updateMaintenanceStatus() {
    console.log('🔄 [MAINTENANCE] updateMaintenanceStatus called, mode:', siteData.settings?.maintenanceMode, 'user role:', currentUser?.role);
    
    if (siteData.settings && siteData.settings.maintenanceMode) {
        document.body.classList.add('maintenance-mode');
        const maintenanceNotice = document.getElementById('maintenanceNotice');
        if (maintenanceNotice) {
            maintenanceNotice.style.display = 'block';
        }

        // FIX: Check if user is admin (with better role checking)
        const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'Admin');
        console.log('🔄 [MAINTENANCE] Is admin?', isAdmin, 'currentUser:', JSON.stringify(currentUser));

        if (!isAdmin) {
            // Not admin - show maintenance page with login form
            showPage('maintenance');
            
            // Wait a bit for DOM to be ready
            setTimeout(() => {
                const loginForm = document.getElementById('maintenanceAdminLogin');
                const adminPanel = document.getElementById('maintenanceAdminPanel');
                const maintenancePage = document.getElementById('maintenance-page');
                
                // Ensure maintenance page is visible
                if (maintenancePage) {
                    maintenancePage.style.display = 'flex';
                }
                
                if (loginForm) {
                    loginForm.style.display = 'block';
                    loginForm.style.visibility = 'visible';
                    loginForm.style.opacity = '1';
                    loginForm.style.position = 'relative';
                    loginForm.style.zIndex = '1000';
                    console.log('✅ [MAINTENANCE] Login form shown');
                } else {
                    console.warn('⚠️ [MAINTENANCE] Login form not found');
                }
                
                if (adminPanel) {
                    adminPanel.style.display = 'none';
                    adminPanel.style.visibility = 'hidden';
                }
            }, 300);
        } else {
            // Admin - show admin panel
            showPage('maintenance');
            
            // Wait a bit for DOM to be ready
            setTimeout(() => {
                const loginForm = document.getElementById('maintenanceAdminLogin');
                const adminPanel = document.getElementById('maintenanceAdminPanel');
                
                if (loginForm) {
                    loginForm.style.display = 'none';
                    loginForm.style.visibility = 'hidden';
                }
                
                if (adminPanel) {
                    adminPanel.style.display = 'block';
                    adminPanel.style.visibility = 'visible';
                    adminPanel.style.opacity = '1';
                    console.log('✅ [MAINTENANCE] Admin panel shown');
                } else {
                    console.warn('⚠️ [MAINTENANCE] Admin panel not found');
                }
            }, 200);
        }
    } else {
        document.body.classList.remove('maintenance-mode');
        const maintenanceNotice = document.getElementById('maintenanceNotice');
        if (maintenanceNotice) {
            maintenanceNotice.style.display = 'none';
        }
        
        // Hide maintenance page elements
        const loginForm = document.getElementById('maintenanceAdminLogin');
        const adminPanel = document.getElementById('maintenanceAdminPanel');
        if (loginForm) loginForm.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'none';
    }
}

// FIX: Handle login from maintenance page (uses same logic as main login form)
async function handleMaintenanceLogin(event) {
    event.preventDefault();
    const email = document.getElementById('maintenanceEmail').value;
    const password = document.getElementById('maintenancePassword').value;
    const errorDiv = document.getElementById('maintenanceLoginError');
    
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    try {
        // Use the same login logic as the main login form
        console.log('🔍 [MAINTENANCE LOGIN] Tentative connexion:', email);
        
        // Try Firebase login first if available (same as main login)
        if (typeof APP_MODE !== 'undefined' && APP_MODE === 'FIREBASE' && typeof window.firebaseHelper !== 'undefined') {
            const fbUser = await loginFirebase(email, password);
            
            if (!fbUser) {
                if (errorDiv) {
                    errorDiv.textContent = siteData.language === 'en' ? 'Invalid credentials' : 'Identifiants invalides';
                    errorDiv.style.display = 'block';
                }
                return;
            }
            
            // Wait for user hydration (same as main login)
            let attempts = 0;
            let user = window.currentUser;
            while ((!user || !user.role || user.role === 'guest') && attempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 100));
                user = window.currentUser;
                attempts++;
            }
            
            // If still no role, use hydrateUserFromFirestore directly
            if (!user || !user.role || user.role === 'guest') {
                console.log('⚠️ [MAINTENANCE LOGIN] currentUser pas encore hydraté, appel direct hydrateUserFromFirestore');
                user = await hydrateUserFromFirestore(fbUser);
                const mappedRole = EMAIL_ROLE_MAP && EMAIL_ROLE_MAP[fbUser.email];
                if (mappedRole && user.role !== mappedRole) {
                    user.role = mappedRole;
                }
                window.currentUser = user;
                localStorage.setItem('ae2i_current_user', JSON.stringify(window.currentUser));
            }
            
            // Check if user is admin
            if (user && user.role === 'admin') {
                currentUser = user;
                window.currentUser = user;
                localStorage.setItem('ae2i_current_user', JSON.stringify(currentUser));
                localStorage.removeItem('ae2i_logged_out'); // Clear logout flag
                updateMaintenanceStatus();
                showNotification('Connexion réussie', 'success');
                console.log('✅ [MAINTENANCE LOGIN] Admin connecté:', user.username);
            } else {
                if (errorDiv) {
                    errorDiv.textContent = siteData.language === 'en' ? 'Administrator access required' : 'Accès administrateur requis';
                    errorDiv.style.display = 'block';
                }
                // Logout if not admin
                if (window.firebaseHelper && window.firebaseHelper.logout) {
                    await window.firebaseHelper.logout();
                }
            }
        } else {
            // Fallback to local authentication
            const user = siteData.users.find(u => 
                (u.email === email || u.username === email) && 
                u.password === password && 
                u.role === 'admin' && 
                u.active !== false
            );
            
            if (user) {
                currentUser = {
                    username: user.username,
                    email: user.email,
                    role: 'admin',
                    isLoggedIn: true
                };
                window.currentUser = currentUser;
                localStorage.setItem('ae2i_current_user', JSON.stringify(currentUser));
                localStorage.removeItem('ae2i_logged_out'); // Clear logout flag
                updateMaintenanceStatus();
                showNotification('Connexion réussie', 'success');
                console.log('✅ [MAINTENANCE LOGIN] Admin connecté (local):', user.username);
            } else {
                if (errorDiv) {
                    errorDiv.textContent = siteData.language === 'en' ? 'Invalid credentials or not an administrator' : 'Identifiants invalides ou non administrateur';
                    errorDiv.style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.error('❌ [MAINTENANCE LOGIN] Login error:', error);
        if (errorDiv) {
            errorDiv.textContent = siteData.language === 'en' ? 'Login error' : 'Erreur de connexion';
            errorDiv.style.display = 'block';
        }
    }
}

// FIX: Disable maintenance mode from maintenance page
async function disableMaintenanceMode() {
    if (currentUser.role !== 'admin') {
        showNotification('Accès administrateur requis', 'error');
        return;
    }
    
    siteData.settings.maintenanceMode = false;
    
    // Save to Firestore
    await saveAdminDataToFirestore('settings', 'main', siteData.settings, 'Maintenance mode disabled')
        .then(() => forceSaveData())
        .then(() => {
            updateMaintenanceStatus();
            showPage('home');
            showNotification(siteData.language === 'en' ? 'Maintenance mode disabled' : 'Mode maintenance désactivé', 'success');
            logActivity(currentUser.username, 'Mode maintenance désactivé');
        })
        .catch(err => {
            console.error('Error disabling maintenance mode:', err);
            showNotification('Erreur lors de la désactivation', 'error');
        });
}

// FIX: Logout from maintenance page
function logoutFromMaintenance() {
    currentUser = { username: "guest", role: "guest", isLoggedIn: false };
    localStorage.removeItem('ae2i_current_user');
    localStorage.setItem('ae2i_logged_out', 'true');
    
    if (typeof APP_MODE !== 'undefined' && APP_MODE === 'FIREBASE' && typeof window.firebaseHelper !== 'undefined') {
        window.firebaseHelper.logout();
    }
    
    updateMaintenanceStatus();
    showNotification('Déconnexion réussie', 'info');
}

window.addEventListener('error', function (e) {
    console.error('Erreur JavaScript:', e.error);
    logActivity('system', `Erreur: ${e.message}`);
});

window.addEventListener('load', function () {
    const loadTime = performance.now();
    logActivity('system', `Site chargé en ${loadTime.toFixed(2)}ms`);

    if (document.getElementById('loadTime')) {
        document.getElementById('loadTime').textContent = `${loadTime.toFixed(2)}ms`;
    }
});

// Auto-save avec sauvegarde forcée toutes les 30 secondes OPÉRATIONNEL
setInterval(function () {
    if (currentUser.isLoggedIn && !saveInProgress) {
        if (forceSaveData()) {
            console.log('🔄 Auto-sauvegarde réussie');
        } else {
            console.error('❌ Échec auto-sauvegarde');
            showNotification('Échec de sauvegarde automatique', 'error', 2000);
        }
    }
}, 30000);

// Sauvegarde avant fermeture de page
window.addEventListener('beforeunload', function (e) {
    if (currentUser.isLoggedIn && !saveInProgress) {
        forceSaveData();
    }
});

document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                showPage('home');
                break;
            case '2':
                e.preventDefault();
                showPage('about');
                break;
            case '3':
                e.preventDefault();
                showPage('services');
                break;
            case '4':
                e.preventDefault();
                showPage('qualite');
                break;
            case '5':
                e.preventDefault();
                showPage('carriere');
                break;
            case '6':
                e.preventDefault();
                showPage('contact');
                break;
            case 's':
                if (currentUser.isLoggedIn) {
                    e.preventDefault();
                    if (forceSaveData()) {
                        showNotification('✅ Données sauvegardées manuellement', 'success');
                    }
                }
                break;
        }
    }

    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show, .login-modal.show, .admin-modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }
});

console.log('🚀 AE2I Enhanced Ultra-Professional Site - Multi-role System with Backend API Initialized');

function executeHomeScript() {
    console.log('🏠 Executing home page script');
    renderHomeContent();
    setupHomeInteractions();
    startTestimonialAutoSlide();
    applyCustomGradients();
    // FIX: Apply hero settings when home page is shown (elements exist now)
    applyAllHeroSettings();
}

function applyCustomGradients() {
    // Appliquer les dégradés personnalisés
    if (siteData.titleGradient) {
        const heroTitle = document.getElementById('heroTitle');
        if (heroTitle) {
            heroTitle.style.background = siteData.titleGradient.gradient;
            heroTitle.style.webkitBackgroundClip = 'text';
            heroTitle.style.webkitTextFillColor = 'transparent';
            heroTitle.style.backgroundClip = 'text';
        }
    }

    if (siteData.sloganGradient) {
        const heroSubtitle = document.getElementById('heroSubtitle');
        if (heroSubtitle) {
            heroSubtitle.style.background = siteData.sloganGradient.gradient;
            heroSubtitle.style.webkitBackgroundClip = 'text';
            heroSubtitle.style.webkitTextFillColor = 'transparent';
            heroSubtitle.style.backgroundClip = 'text';
        }
    }
}

// Apply all hero settings to DOM elements (called after loading data from Firebase)
function applyAllHeroSettings() {
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const heroBackground = document.getElementById('heroBackground');

    // Restore title text
    if (siteData.settings && siteData.settings.title && heroTitle) {
        heroTitle.textContent = siteData.settings.title;
        // Also update page title
        document.title = siteData.settings.title;
    }

    // Restore slogan text
    if (siteData.settings && siteData.settings.slogan && heroSubtitle) {
        heroSubtitle.textContent = siteData.settings.slogan;
    }

    // Apply title gradient
    if (siteData.titleGradient && heroTitle) {
        heroTitle.style.background = siteData.titleGradient.gradient;
        heroTitle.style.webkitBackgroundClip = 'text';
        heroTitle.style.webkitTextFillColor = 'transparent';
        heroTitle.style.backgroundClip = 'text';
    }

    // Apply slogan gradient
    if (siteData.sloganGradient && heroSubtitle) {
        heroSubtitle.style.background = siteData.sloganGradient.gradient;
        heroSubtitle.style.webkitBackgroundClip = 'text';
        heroSubtitle.style.webkitTextFillColor = 'transparent';
        heroSubtitle.style.backgroundClip = 'text';
    }

    // Apply description gradient
    if (siteData.descriptionGradient) {
        const heroDescription = document.getElementById('heroDescription');
        if (heroDescription) {
            heroDescription.style.background = siteData.descriptionGradient.gradient;
            heroDescription.style.webkitBackgroundClip = 'text';
            heroDescription.style.webkitTextFillColor = 'transparent';
            heroDescription.style.backgroundClip = 'text';
        }
    }

    // Apply hero background (gradient, image, or video)
    if (siteData.heroBackground && heroBackground) {
        if (siteData.heroBackground.type === 'gradient' && siteData.heroBackground.gradient) {
            heroBackground.style.background = siteData.heroBackground.gradient;
            heroBackground.classList.remove('has-image', 'has-video');
        } else if (siteData.heroBackground.type === 'image' && siteData.heroBackground.url) {
            heroBackground.style.backgroundImage = `url(${siteData.heroBackground.url})`;
            heroBackground.classList.add('has-image');
            heroBackground.classList.remove('has-video');
            const heroVideo = document.getElementById('heroVideo');
            if (heroVideo) heroVideo.style.display = 'none';
        } else if (siteData.heroBackground.type === 'video' && siteData.heroBackground.url) {
            const heroVideo = document.getElementById('heroVideo');
            const heroVideoSource = document.getElementById('heroVideoSource');
            if (heroVideo && heroVideoSource) {
                heroVideoSource.src = siteData.heroBackground.url;
                heroVideo.load();
                heroVideo.style.display = 'block';
                heroBackground.classList.add('has-video');
                heroBackground.classList.remove('has-image');
            }
        }
    }

    // Apply hero title size
    if (siteData.heroSizes && siteData.heroSizes.title && heroTitle) {
        heroTitle.style.fontSize = siteData.heroSizes.title + 'px';
    }

    // Apply hero subtitle size
    if (siteData.heroSizes && siteData.heroSizes.subtitle && heroSubtitle) {
        heroSubtitle.style.fontSize = siteData.heroSizes.subtitle + 'px';
    }

    // Apply title formatting
    if (siteData.titleFormatting && heroTitle) {
        heroTitle.style.fontWeight = siteData.titleFormatting.bold ? '900' : '800';
        heroTitle.style.fontStyle = siteData.titleFormatting.italic ? 'italic' : 'normal';
        heroTitle.style.textDecoration = siteData.titleFormatting.underline ? 'underline' : 'none';
    }

    // Apply subtitle formatting
    if (siteData.subtitleFormatting && heroSubtitle) {
        heroSubtitle.style.fontWeight = siteData.subtitleFormatting.bold ? '700' : '400';
        heroSubtitle.style.fontStyle = siteData.subtitleFormatting.italic ? 'italic' : 'normal';
        heroSubtitle.style.textDecoration = siteData.subtitleFormatting.underline ? 'underline' : 'none';
    }

    console.log('✅ Hero settings applied to DOM');
}
function renderHomeContent() {
    const homeServicesGrid = document.getElementById('homeServicesGrid');
    if (homeServicesGrid) {
        homeServicesGrid.innerHTML = '';
        const activeServices = siteData.services.filter(s => s.active).slice(0, 3);

        activeServices.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'home-presentation-card';
            serviceCard.innerHTML = `
                <div class="home-presentation-icon">${service.icon}</div>
                <h3 style="font-size: var(--font-size-xl); color: var(--text-dark); margin-bottom: var(--spacing-sm);">${service.title[siteData.language] || service.title.fr}</h3>
                <p style="color: var(--text-light); line-height: var(--line-height-loose);">${service.description[siteData.language] || service.description.fr}</p>
            `;
            homeServicesGrid.appendChild(serviceCard);
        });
    }

    const homeJobsGrid = document.getElementById('homeJobsGrid');
    if (homeJobsGrid) {
        homeJobsGrid.innerHTML = '';
        const activeJobs = siteData.jobs.filter(j => j.active).slice(0, 3);

        activeJobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'home-presentation-card';
            jobCard.innerHTML = `
                <div class="home-presentation-icon">
                    <i class="fas fa-briefcase"></i>
                </div>
                <h3 style="font-size: var(--font-size-xl); color: var(--text-dark); margin-bottom: var(--spacing-sm);">${job.title[siteData.language] || job.title.fr}</h3>
                <p style="color: var(--text-light); line-height: var(--line-height-loose);">${(job.description[siteData.language] || job.description.fr).substring(0, 120)}...</p>
                <div style="margin-top: var(--spacing-md);">
                    <span style="background: var(--primary); color: white; padding: 4px 12px; border-radius: var(--border-radius-full); font-size: var(--font-size-xs);">
                        ${job.type.toUpperCase()}
                    </span>
                </div>
            `;
            homeJobsGrid.appendChild(jobCard);
        });
    }

    renderHomeClients();
    renderHomeTestimonials();
}

function renderHomeClients() {
    const homeClientsTrack = document.getElementById('homeClientsTrack');
    if (homeClientsTrack) {
        homeClientsTrack.innerHTML = '';
        const activeClients = siteData.clients.filter(c => c.active);
        const clientsToRender = [...activeClients, ...activeClients];

        clientsToRender.forEach(client => {
            const clientLogo = document.createElement('div');
            clientLogo.className = 'client-logo-item';
            clientLogo.innerHTML = `<img src="${client.logo}" alt="${client.name}" style="max-height: 100px; max-width: 180px; filter: none;" loading="lazy">`;
            homeClientsTrack.appendChild(clientLogo);
        });
    }
}
function renderHomeTestimonials() {
    const homeTestimonialsTrack = document.getElementById('homeTestimonialsTrack');
    const testimonialsDots = document.getElementById('testimonialsDots');

    if (homeTestimonialsTrack) {
        homeTestimonialsTrack.innerHTML = '';
        const activeTestimonials = siteData.testimonials.filter(t => t.active);

        activeTestimonials.forEach((testimonial, index) => {
            const testimonialSlide = document.createElement('div');
            testimonialSlide.className = 'testimonial-slide';
            testimonialSlide.innerHTML = `
                <div class="testimonial-card">
                    <div class="testimonial-avatar">
                        <img src="${testimonial.avatar}" alt="${testimonial.name}" loading="lazy">
                    </div>
                    <div class="testimonial-rating">
                        ${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}
                    </div>
                    <p class="testimonial-text">
                        "${testimonial.text[siteData.language] || testimonial.text.fr}"
                    </p>
                    <div class="testimonial-name">${testimonial.name}</div>
                    <div class="testimonial-position">${testimonial.position[siteData.language] || testimonial.position.fr}</div>
                </div>
            `;
            homeTestimonialsTrack.appendChild(testimonialSlide);
        });

        // Créer les dots de navigation
        if (testimonialsDots) {
            testimonialsDots.innerHTML = '';
            activeTestimonials.forEach((_, index) => {
                const dot = document.createElement('div');
                dot.className = `testimonial-dot ${index === 0 ? 'active' : ''}`;
                dot.addEventListener('click', () => {
                    currentTestimonialIndex = index;
                    updateTestimonialCarousel();
                    updateTestimonialDots();
                    startTestimonialAutoSlide();
                });
                testimonialsDots.appendChild(dot);
            });
        }

        updateTestimonialCarousel();
    }
}

function updateTestimonialCarousel() {
    const track = document.getElementById('homeTestimonialsTrack');
    const activeTestimonials = siteData.testimonials.filter(t => t.active);

    if (track && activeTestimonials.length > 0) {
        const translateX = -(currentTestimonialIndex * 100);
        track.style.transform = `translateX(${translateX}%)`;
    }
}

function updateTestimonialDots() {
    const dots = document.querySelectorAll('.testimonial-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentTestimonialIndex);
    });
}

function startTestimonialAutoSlide() {
    if (testimonialAutoSlide) {
        clearInterval(testimonialAutoSlide);
    }

    testimonialAutoSlide = setInterval(() => {
        const activeTestimonials = siteData.testimonials.filter(t => t.active);
        if (activeTestimonials.length > 1) {
            currentTestimonialIndex = (currentTestimonialIndex + 1) % activeTestimonials.length;
            updateTestimonialCarousel();
            updateTestimonialDots();
        }
    }, 5000);
}

function setupHomeInteractions() {
    const homeBrochureDownload = document.getElementById('homeBrochureDownload');
    if (homeBrochureDownload) {
        homeBrochureDownload.addEventListener('click', async function (e) {
            e.preventDefault();

            if (siteData.brochure && siteData.brochure.url) {
                const brochureUrl = siteData.brochure.url;
                const brochureName = siteData.brochure.name || 'Brochure_AE2I.pdf';
                
                try {
                    // FIX: Always use fetch for external URLs to ensure proper download
                    // For HTTP/HTTPS URLs (R2), fetch the blob first
                    if (brochureUrl.startsWith('http://') || brochureUrl.startsWith('https://')) {
                        console.log('📥 [BROCHURE] Fetching from R2 URL:', brochureUrl);
                        const response = await fetch(brochureUrl);
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = brochureName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                        
                        console.log('✅ [BROCHURE] Downloaded from R2 URL successfully');
                    } else if (brochureUrl.startsWith('data:')) {
                        // Base64 data URL - download directly
                        const link = document.createElement('a');
                        link.href = brochureUrl;
                        link.download = brochureName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        console.log('📥 [BROCHURE] Downloaded from base64 data URL');
                    } else {
                        // Relative path or other - try to fetch
                        console.log('📥 [BROCHURE] Fetching relative path:', brochureUrl);
                        const response = await fetch(brochureUrl);
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = brochureName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                        
                        console.log('✅ [BROCHURE] Downloaded via fetch');
                    }
                } catch (error) {
                    console.error('❌ [BROCHURE] Download error:', error);
                    showNotification('Erreur lors du téléchargement de la brochure', 'error');
                    return;
                }

                showNotification(siteData.language === 'en' ? 'AE2I 2025 brochure download started' : 'Téléchargement de la brochure AE2I 2025 démarré', 'success');
                logActivity(currentUser.username || 'visitor', 'Brochure téléchargée depuis accueil');
            } else {
                console.warn('⚠️ [BROCHURE] No brochure URL found in siteData.brochure:', siteData.brochure);
                showNotification(siteData.language === 'en' ? 'Brochure not available' : 'Brochure non disponible', 'warning');
            }
        });
    }

    const homePrevTestimonial = document.getElementById('homePrevTestimonial');
    const homeNextTestimonial = document.getElementById('homeNextTestimonial');

    if (homePrevTestimonial) {
        homePrevTestimonial.addEventListener('click', function () {
            const activeTestimonials = siteData.testimonials.filter(t => t.active);
            if (activeTestimonials.length > 0) {
                currentTestimonialIndex = (currentTestimonialIndex - 1 + activeTestimonials.length) % activeTestimonials.length;
                updateTestimonialCarousel();
                updateTestimonialDots();
                startTestimonialAutoSlide();
            }
        });
    }

    if (homeNextTestimonial) {
        homeNextTestimonial.addEventListener('click', function () {
            const activeTestimonials = siteData.testimonials.filter(t => t.active);
            if (activeTestimonials.length > 0) {
                currentTestimonialIndex = (currentTestimonialIndex + 1) % activeTestimonials.length;
                updateTestimonialCarousel();
                updateTestimonialDots();
                startTestimonialAutoSlide();
            }
        });
    }
}

function executeAboutScript() {
    console.log('📖 Executing about page script');
    setupAboutInteractions();
}

function setupAboutInteractions() {
    /* FIX: iso-hover-visibility + responsive-iso-hover + iso-touch-compatibility */
    window.showIsoPreview = function () {
        const preview = document.getElementById('aboutIsoPreview');
        if (preview) {
            preview.classList.add('show');
        }
    };

    window.hideIsoPreview = function () {
        const preview = document.getElementById('aboutIsoPreview');
        if (preview) {
            preview.classList.remove('show');
        }
    };

    /* ADD: iso-touch-compatibility - Support tap/clic mobile et tablette */
    const isoQr = document.getElementById('aboutIsoQr');
    const isoPreview = document.getElementById('aboutIsoPreview');

    if (isoQr && isoPreview) {
        let isPreviewOpen = false;

        // Clic/tap toggle pour mobile et tablette
        isoQr.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (isPreviewOpen) {
                hideIsoPreview();
                isPreviewOpen = false;
                isoQr.classList.remove('active');
            } else {
                showIsoPreview();
                isPreviewOpen = true;
                isoQr.classList.add('active');
            }
        });

        // Fermer au clic en dehors
        document.addEventListener('click', function (e) {
            if (isPreviewOpen && !isoQr.contains(e.target) && !isoPreview.contains(e.target)) {
                hideIsoPreview();
                isPreviewOpen = false;
                isoQr.classList.remove('active');
            }
        });

        // Sur PC: hover fonctionne normalement
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            isoQr.addEventListener('mouseenter', function () {
                if (!isPreviewOpen) {
                    showIsoPreview();
                }
            });

            isoQr.addEventListener('mouseleave', function () {
                if (!isPreviewOpen) {
                    hideIsoPreview();
                }
            });

            // Hover sur le preview lui-m\u00eame
            isoPreview.addEventListener('mouseenter', function () {
                if (!isPreviewOpen) {
                    showIsoPreview();
                }
            });

            isoPreview.addEventListener('mouseleave', function () {
                if (!isPreviewOpen) {
                    hideIsoPreview();
                }
            });
        }
    }

    const statItems = document.querySelectorAll('.about-stat-item');
    statItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
        item.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-8px) scale(1.05)';
        });
        item.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

function executeServicesScript() {
    console.log('🔧 Executing services page script');
    renderServicesPage();
    setupServicesInteractions();
}

function renderServicesPage() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid) {
        servicesGrid.innerHTML = '';
        const activeServices = siteData.services.filter(s => s.active);

        activeServices.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card';
            serviceCard.innerHTML = `
                <div class="service-icon">${service.icon}</div>
                <img src="${service.image}" alt="${service.title[siteData.language] || service.title.fr}" class="service-image" loading="lazy">
                <div style="flex-grow: 1; display: flex; flex-direction: column;">
                    <h3 class="service-title">${service.title[siteData.language] || service.title.fr}</h3>
                    <p class="service-description">${service.description[siteData.language] || service.description.fr}</p>
                    <a href="#contact" class="service-link functional-btn nav-link" data-page="contact">
                        <i class="fas fa-arrow-right"></i>
                        ${siteData.language === 'en' ? 'Learn more' : 'En savoir plus'}
                    </a>
                </div>
            `;
            servicesGrid.appendChild(serviceCard);
        });
    }

}

function setupServicesInteractions() {
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-12px) scale(1.02)';
            this.style.boxShadow = 'var(--shadow-2xl)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = 'var(--shadow-lg)';
        });
    });

    document.querySelectorAll('.service-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            showPage('contact');
            showNotification(siteData.language === 'en' ? 'Contact us to learn more about this service!' : 'Contactez-nous pour en savoir plus sur ce service!', 'info');
        });
    });
}

function executeQualiteScript() {
    console.log('🏆 Executing qualite page script');
    setupQualiteInteractions();
    initializePrismEffect();
}

function initializePrismEffect() {
    const qualiteSections = document.querySelectorAll('.qualite-section');

    qualiteSections.forEach((section, index) => {
        section.addEventListener('mouseenter', function () {
            const prism = document.querySelector('.prism');
            if (prism) {
                prism.style.animationDuration = '10s';
            }
        });

        section.addEventListener('mouseleave', function () {
            const prism = document.querySelector('.prism');
            if (prism) {
                prism.style.animationDuration = '20s';
            }
        });
    });
}

function setupQualiteInteractions() {
    document.querySelectorAll('.qualite-engagement-item').forEach((item, index) => {
        item.style.animationDelay = `${index * 0.2}s`;

        item.addEventListener('click', function () {
            const title = this.querySelector('.qualite-engagement-title').textContent;
            showNotification(`${siteData.language === 'en' ? 'Commitment:' : 'Engagement:'} ${title}`, 'info');
            logActivity(currentUser.username || 'visitor', `Engagement qualité consulté: ${title}`);
        });
    });
}

function executeCarriereScript() {
    console.log('💼 Executing carriere page script');
    renderCarriereJobs();
    setupCarriereFilters();
    setupCarriereInteractions();
    setupAdvancedJobSearch();
    setupJobsPagination();
}

/* ADD: Multi-select filter functions */
function toggleMultiFilter(filterId) {
    const dropdown = document.getElementById(filterId + 'Dropdown');
    const button = dropdown.previousElementSibling;
    const container = dropdown.closest('.filter-multiselect-container');
    const filterGroup = dropdown.closest('.search-filter-group');

    // Close all other dropdowns and remove active classes
    document.querySelectorAll('.filter-multiselect-dropdown').forEach(d => {
        if (d.id !== filterId + 'Dropdown') {
            d.style.display = 'none';
            d.previousElementSibling.classList.remove('active');
            const parentContainer = d.closest('.filter-multiselect-container');
            if (parentContainer) parentContainer.classList.remove('active');
            const parentGroup = d.closest('.search-filter-group');
            if (parentGroup) parentGroup.classList.remove('filter-active');
        }
    });

    // Toggle current dropdown
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
        button.classList.add('active');
        if (container) container.classList.add('active');
        if (filterGroup) filterGroup.classList.add('filter-active');
    } else {
        dropdown.style.display = 'none';
        button.classList.remove('active');
        if (container) container.classList.remove('active');
        if (filterGroup) filterGroup.classList.remove('filter-active');
    }
}

function updateMultiFilterDisplay(filterId) {
    const dropdown = document.getElementById(filterId + 'Dropdown');
    const button = dropdown.previousElementSibling;
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');
    const buttonText = button.querySelector('span');

    if (checkboxes.length === 0) {
        // Show default text
        const filterLabels = {
            'regionFilter': { fr: 'Toutes les wilayas', en: 'All wilayas' },
            'experienceFilter': { fr: 'Toute expérience', en: 'Any experience' },
            'fieldFilter': { fr: 'Tous les domaines', en: 'All fields' },
            'educationFilter': { fr: 'Tous niveaux', en: 'All levels' }
        };
        buttonText.textContent = filterLabels[filterId][siteData.language];
    } else if (checkboxes.length === 1) {
        buttonText.textContent = checkboxes[0].nextElementSibling.textContent;
    } else {
        buttonText.textContent = `${checkboxes.length} sélectionné(s)`;
    }
}

function getSelectedFilterValues(filterName) {
    const checkboxes = document.querySelectorAll(`input[name="${filterName}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function applyMultiFilters() {
    const selectedRegions = getSelectedFilterValues('region');
    const selectedExperience = getSelectedFilterValues('experience');
    const selectedFields = getSelectedFilterValues('field');
    const selectedEducation = getSelectedFilterValues('education');

    const jobsGrid = document.getElementById('carriereJobsGrid');
    if (!jobsGrid) return;

    let filteredJobs = siteData.jobs.filter(j => j.active);

    // Filter by regions (wilayas)
    if (selectedRegions.length > 0) {
        filteredJobs = filteredJobs.filter(job => {
            return selectedRegions.some(region =>
                job.location.toLowerCase().includes(region.toLowerCase().split('-')[1])
            );
        });
    }

    // Filter by experience (placeholder - would need job.experience field)
    if (selectedExperience.length > 0) {
        filteredJobs = filteredJobs.filter(job => {
            if (!job.experience) return false;
            return selectedExperience.includes(job.experience);
        });
    }

    // Filter by field/domain (placeholder - would need job.field)
    if (selectedFields.length > 0) {
        filteredJobs = filteredJobs.filter(job => {
            if (!job.field) return false;
            return selectedFields.includes(job.field);
        });
    }

    // Filter by education (placeholder - would need job.education)
    if (selectedEducation.length > 0) {
        filteredJobs = filteredJobs.filter(job => {
            if (!job.education) return false;
            return selectedEducation.includes(job.education);
        });
    }

    // Display results
    jobsGrid.innerHTML = '';
    if (filteredJobs.length === 0) {
        jobsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-light);">${siteData.language === 'fr' ? 'Aucune offre ne correspond à vos critères' : 'No offers match your criteria'}</p>`;
    } else {
        filteredJobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'carriere-job-card';
            jobCard.setAttribute('data-type', job.type);

            jobCard.innerHTML = `
                <div class="carriere-job-content">
                    <h3 class="carriere-job-title" style="font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: var(--spacing-md);">${job.title[siteData.language] || job.title.fr}</h3>
                    <div class="carriere-job-location" style="margin-bottom: var(--spacing-md);">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${job.location}</span>
                    </div>
                    <div class="carriere-job-details">
                        <div class="carriere-job-detail-section">
                            <h4><i class="fas fa-info-circle"></i> ${translations[siteData.language].description}:</h4>
                            <p>${job.description[siteData.language] || job.description.fr}</p>
                        </div>
                        <div class="carriere-job-detail-section requirements">
                            <h4><i class="fas fa-list-check"></i> ${translations[siteData.language].requirements}:</h4>
                            <p>${job.requirements[siteData.language] || job.requirements.fr}</p>
                        </div>
                    </div>
                    <div class="carriere-job-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--spacing-lg); padding-top: var(--spacing-md); border-top: 2px solid var(--border);">
                        <div class="carriere-job-type" style="background: var(--primary); color: white; padding: 8px 20px; border-radius: var(--border-radius); font-weight: 700; font-size: var(--font-size-sm);">${job.type.toUpperCase()}</div>
                        <button class="carriere-btn-apply functional-btn" data-job-id="${job.id}" onclick="openApplicationForm(${job.id})" style="background: linear-gradient(135deg, #008fb3 0%, #003d82 100%); color: white; padding: 14px 32px; border-radius: var(--border-radius-lg); font-weight: 700; font-size: var(--font-size-base); box-shadow: 0 4px 15px rgba(0, 86, 179, 0.3); transition: all 0.3s ease; border: none;">
                            <i class="fas fa-paper-plane" style="margin-right: 8px;"></i>
                            ${translations[siteData.language].applyBtn}
                        </button>
                    </div>
                </div>
            `;
            jobsGrid.appendChild(jobCard);
        });
    }

    showNotification(
        `${filteredJobs.length} ${siteData.language === 'fr' ? 'offre(s) trouvée(s)' : 'offer(s) found'}`,
        'success'
    );
}

function resetMultiFilters() {
    // Uncheck all checkboxes
    document.querySelectorAll('.filter-multiselect-dropdown input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    // Reset all button texts
    ['regionFilter', 'experienceFilter', 'fieldFilter', 'educationFilter'].forEach(filterId => {
        updateMultiFilterDisplay(filterId);
    });

    // Show all jobs
    renderCarriereJobs();

    showNotification(
        siteData.language === 'fr' ? 'Filtres réinitialisés' : 'Filters reset',
        'success'
    );
}

// Close dropdowns when clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.filter-multiselect-container')) {
        document.querySelectorAll('.filter-multiselect-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
            dropdown.previousElementSibling.classList.remove('active');
        });
    }
});

function renderCarriereJobs() {
    const jobsGrid = document.getElementById('carriereJobsGrid');
    if (jobsGrid) {
        jobsGrid.innerHTML = '';
        const activeJobs = siteData.jobs.filter(j => j.active);

        // Pagination pour 20+ offres
        const startIndex = (currentJobsPage - 1) * jobsPerPage;
        const endIndex = startIndex + jobsPerPage;
        const jobsToShow = activeJobs.slice(startIndex, endIndex);

        jobsToShow.forEach(job => {
            const jobCard = document.createElement('div');
            /* FIX: Removed premium class */
            jobCard.className = 'carriere-job-card';
            jobCard.setAttribute('data-type', job.type);
            if (job.isNew) jobCard.setAttribute('data-new', 'true');

            /* FIX: Restructured card - large title at top, job type badge at bottom, redesigned apply button */
            jobCard.innerHTML = `
                <div class="carriere-job-content">
                    <h3 class="carriere-job-title" style="font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: var(--spacing-md);">${job.title[siteData.language] || job.title.fr}</h3>
                    <div class="carriere-job-location" style="margin-bottom: var(--spacing-md);">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${job.location}</span>
                    </div>
                    <div class="carriere-job-details">
                        <div class="carriere-job-detail-section">
                            <h4><i class="fas fa-info-circle"></i> ${translations[siteData.language].description}:</h4>
                            <p>${job.description[siteData.language] || job.description.fr}</p>
                        </div>
                        <div class="carriere-job-detail-section requirements">
                            <h4><i class="fas fa-list-check"></i> ${translations[siteData.language].requirements}:</h4>
                            <p>${job.requirements[siteData.language] || job.requirements.fr}</p>
                        </div>
                    </div>
                    <div class="carriere-job-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--spacing-lg); padding-top: var(--spacing-md); border-top: 2px solid var(--border);">
                        <div class="carriere-job-type" style="background: var(--primary); color: white; padding: 8px 20px; border-radius: var(--border-radius); font-weight: 700; font-size: var(--font-size-sm);">${job.type.toUpperCase()}</div>
                        <button class="carriere-btn-apply functional-btn" data-job-id="${job.id}" onclick="openApplicationForm(${job.id})" style="background: linear-gradient(135deg, #008fb3 0%, #003d82 100%); color: white; padding: 14px 32px; border-radius: var(--border-radius-lg); font-weight: 700; font-size: var(--font-size-base); box-shadow: 0 4px 15px rgba(0, 86, 179, 0.3); transition: all 0.3s ease; border: none;">
                            <i class="fas fa-paper-plane" style="margin-right: 8px;"></i>
                            ${translations[siteData.language].applyBtn}
                        </button>
                    </div>
                </div>
            `;
            jobsGrid.appendChild(jobCard);
        });

        // Afficher la pagination si nécessaire
        updatePagination(activeJobs.length);
    }
}

function setupJobsPagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            if (currentJobsPage > 1) {
                currentJobsPage--;
                renderCarriereJobs();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            const totalJobs = siteData.jobs.filter(j => j.active).length;
            const totalPages = Math.ceil(totalJobs / jobsPerPage);

            if (currentJobsPage < totalPages) {
                currentJobsPage++;
                renderCarriereJobs();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
}

function updatePagination(totalJobs) {
    const pagination = document.getElementById('carrierePagination');
    const paginationInfo = document.getElementById('paginationInfo');
    const totalPages = Math.ceil(totalJobs / jobsPerPage);

    if (totalPages > 1) {
        pagination.style.display = 'flex';
        paginationInfo.textContent = `Page ${currentJobsPage} sur ${totalPages}`;

        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (prevBtn) {
            prevBtn.disabled = currentJobsPage === 1;
            prevBtn.style.opacity = currentJobsPage === 1 ? '0.5' : '1';
        }

        if (nextBtn) {
            nextBtn.disabled = currentJobsPage === totalPages;
            nextBtn.style.opacity = currentJobsPage === totalPages ? '0.5' : '1';
        }
    } else {
        pagination.style.display = 'none';
    }
}

function setupAdvancedJobSearch() {
    const searchInput = document.getElementById('jobSearchInput');
    const regionFilter = document.getElementById('regionFilter');
    const experienceFilter = document.getElementById('experienceFilter');
    const fieldFilter = document.getElementById('fieldFilter');
    const educationFilter = document.getElementById('educationFilter');

    // Setup advanced search with all filters
    [regionFilter, experienceFilter, fieldFilter, educationFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', function () {
                // Reset pagination when filtering
                currentJobsPage = 1;

                // Trigger search if there's a query or any filter is selected
                const hasQuery = searchInput && searchInput.value.trim().length >= 2;
                const hasFilters = [regionFilter, experienceFilter, fieldFilter, educationFilter].some(f => f && f.value);

                if (hasQuery || hasFilters) {
                    // Trigger the search function from global script
                    if (window.performAdvancedSearch) {
                        window.performAdvancedSearch();
                    }
                }
            });
        }
    });
}
function setupCarriereFilters() {
    document.querySelectorAll('.carriere-filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.carriere-filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');
            currentJobsPage = 1; // Reset pagination

            const jobCards = document.querySelectorAll('.carriere-job-card');

            jobCards.forEach((card, index) => {
                if (filter === 'all' || card.getAttribute('data-type') === filter) {
                    card.style.display = 'flex';
                    card.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`;
                } else {
                    card.style.display = 'none';
                }
            });

            // Recalculer la pagination
            const visibleJobs = siteData.jobs.filter(j => j.active && (filter === 'all' || j.type === filter));
            updatePagination(visibleJobs.length);

            logActivity(currentUser.username || 'visitor', `Filtrage emplois: ${filter}`);
        });
    });
}

function setupCarriereInteractions() {
    document.querySelectorAll('.carriere-job-card').forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-4px) scale(1.01)';
            this.style.boxShadow = 'var(--shadow-xl)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = 'var(--shadow-lg)';
        });
    });
}

function openApplicationForm(jobId) {
    if (!checkConsentRequired('forms')) {
        return;
    }

    const job = siteData.jobs.find(j => j.id == jobId);
    if (job) {
        document.getElementById('applicationTitle').textContent = `${siteData.language === 'en' ? 'Application for' : 'Candidature pour'} ${job.title[siteData.language] || job.title.fr}`;
        document.getElementById('applicationForm').dataset.jobId = jobId;

        // Show custom question if exists
        const customQuestionField = document.getElementById('customQuestionField');
        const customQuestionLabel = document.getElementById('customQuestionLabel');
        const customQuestionAnswer = document.getElementById('customQuestionAnswer');

        if (job.customQuestion && job.customQuestion[siteData.language]) {
            customQuestionLabel.textContent = job.customQuestion[siteData.language];
            customQuestionAnswer.value = '';
            customQuestionField.style.display = 'block';
        } else {
            customQuestionField.style.display = 'none';
            customQuestionAnswer.value = '';
        }

        openModal('applicationModal');
        logActivity(currentUser.username || 'visitor', `Formulaire candidature ouvert: ${job.title.fr}`);

        /* FIX: Setup driver license event listeners when modal opens */
        setTimeout(function () {
            const licenseRadios = document.querySelectorAll('input[name="hasDriverLicense"]');
            console.log('Modal opened - setting up license radios, found:', licenseRadios.length);

            licenseRadios.forEach(radio => {
                // Remove old listeners first
                radio.removeEventListener('change', handleLicenseChange);
                // Add new listener
                radio.addEventListener('change', handleLicenseChange);
            });
        }, 100);
    }
}

/* FIX: Handler function for license change */
function handleLicenseChange() {
    console.log('License radio changed, value:', this.value);
    if (window.toggleDriverLicenseFields) {
        window.toggleDriverLicenseFields(this.value);
    } else {
        console.error('toggleDriverLicenseFields function not found!');
    }
}
const fadeInUpKeyframes = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const style = document.createElement('style');
style.textContent = fadeInUpKeyframes;
document.head.appendChild(style);

function executeContactScript() {
    console.log('📞 Executing contact page script');
    setupContactForm();
    setupContactInteractions();
    updateContactPageInfo();
}

function updateContactPageInfo() {
    if (siteData.settings.contact) {
        const addressEl = document.getElementById('contactPageAddress');
        const phoneEl = document.getElementById('contactPagePhone');
        const emailEl = document.getElementById('contactPageEmail');

        if (addressEl) addressEl.textContent = siteData.settings.contact.address;
        if (phoneEl) phoneEl.textContent = siteData.settings.contact.phone;
        if (emailEl) {
            emailEl.textContent = siteData.settings.contact.email;
            emailEl.href = `mailto:${siteData.settings.contact.email}`;
        }

        if (siteData.settings.contact.googleMapsUrl) {
            const iframe = document.querySelector('.google-maps iframe');
            if (iframe) {
                iframe.src = siteData.settings.contact.googleMapsUrl;
            }
        }
    }
}

function setupContactForm() {
    const contactForm = document.getElementById('contactPageForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!checkConsentRequired('forms')) {
                showNotification(siteData.language === 'en' ? 'Consent required to send a message' : 'Consentement requis pour envoyer un message', 'warning');
                return;
            }

            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            const phone = formData.get('phone');

            if (!name || !email || !subject || !message) {
                showNotification(siteData.language === 'en' ? 'Please fill in all required fields' : 'Veuillez remplir tous les champs obligatoires', 'error');
                return;
            }

            const contactMessage = {
                id: Date.now(),
                name: name,
                email: email,
                phone: phone,
                subject: subject,
                message: message,
                timestamp: new Date().toISOString(),
                status: 'unread',
                consentGiven: consentStatus.accepted
            };

            if (!siteData.contactMessages) siteData.contactMessages = [];
            siteData.contactMessages.unshift(contactMessage);

            if (forceSaveData()) {
                const successMsg = siteData.language === 'en' ?
                    `Thank you ${name}! Your message has been sent successfully.` :
                    `Merci ${name}! Votre message a été envoyé avec succès.`;

                showNotification(successMsg, 'success');
                this.reset();

                logActivity(currentUser.username || 'visitor', `Message de contact envoyé: ${subject}`);
            } else {
                showNotification('Échec d\'envoi du message', 'error');
            }
        });
    }
}

function setupContactInteractions() {
    document.querySelectorAll('.contact-item').forEach(item => {
        item.addEventListener('mouseenter', function () {
            this.style.transform = 'translateX(8px)';
            this.style.boxShadow = 'var(--shadow-md)';
            this.style.borderLeft = '4px solid var(--primary)';

            const icon = this.querySelector('.contact-icon');
            if (icon) {
                icon.style.background = 'var(--primary-light)';
                icon.style.transform = 'scale(1.1)';
                icon.style.boxShadow = 'var(--shadow-lg)';
            }
        });

        item.addEventListener('mouseleave', function () {
            this.style.transform = 'translateX(0)';
            this.style.boxShadow = '';
            this.style.borderLeft = '';

            const icon = this.querySelector('.contact-icon');
            if (icon) {
                icon.style.background = 'var(--primary)';
                icon.style.transform = 'scale(1)';
                icon.style.boxShadow = '';
            }
        });
    });

    const contactEmail = document.getElementById('contactPageEmail');
    if (contactEmail) {
        contactEmail.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = `mailto:${siteData.settings.contact.email}?subject=${siteData.language === 'en' ? 'AE2I Information Request' : 'Demande d\'information AE2I'}`;
            logActivity(currentUser.username || 'visitor', 'Email de contact cliqué');
        });
    }
}

function executeAdminScript() {
    console.log('⚙️ Executing admin dashboard script');

    // Ensure logout button is visible
    const logoutBtn = document.querySelector('#admin-page .btn-logout');
    if (logoutBtn) {
        logoutBtn.style.display = 'flex';
        console.log('✅ [ADMIN SCRIPT] Logout button shown');
    } else {
        console.warn('⚠️ [ADMIN SCRIPT] Logout button not found');
    }

    // Load candidatures from Firebase if in Firebase mode
    if (APP_MODE === 'FIREBASE' && window.firebaseHelper) {
        loadCandidaturesFromFirebase().then(() => {
            setupAdminTabs();
            renderAdminContent();
            setupAdminForms();
            setupTinyMCE();
            updateAnalytics();
            setupAdminFileUploads();
            initializeAdminSettings();
            setupAdminInteractions(); // Setup filter interactions
        }).catch(err => {
            console.error('Error loading candidatures:', err);
            setupAdminTabs();
            renderAdminContent();
            setupAdminForms();
            setupTinyMCE();
            updateAnalytics();
            setupAdminFileUploads();
            initializeAdminSettings();
            setupAdminInteractions(); // Setup filter interactions
        });
    } else {
        setupAdminTabs();
        renderAdminContent();
        setupAdminForms();
        setupTinyMCE();
        updateAnalytics();
        setupAdminFileUploads();
        initializeAdminSettings();
        setupAdminInteractions(); // Setup filter interactions
    }
}

function setupAdminTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');
            showAdminTab(tabId);
        });
    });
}

function showAdminTab(tabId) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });

    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const selectedTab = document.querySelector(`.admin-tab[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(`admin-tab-${tabId}`);

    if (selectedTab && selectedContent) {
        selectedTab.classList.add('active');
        selectedTab.setAttribute('aria-selected', 'true');
        selectedContent.classList.add('active');

        if (tabId === 'analytics') {
            updateAnalytics();
        } else if (tabId === 'recruitment') {
            // Setup filter interactions when recruitment tab is shown
            setupAdminInteractions();
            if (typeof renderAdminCvDatabase === 'function') {
                renderAdminCvDatabase();
            }
            populateCVJobFilter();
        } else if (tabId === 'contact') {
            renderContactMessages();
            updateContactStats();
        } else if (tabId === 'hero') {
            initializeHeroSettings();
        } else if (tabId === 'users') {
            if (typeof renderAdminUsers === 'function') {
                renderAdminUsers();
            }
            if (typeof renderAuditLog === 'function') {
                renderAuditLog();
            }
        } else if (tabId === 'roles') {
            renderRolesManagement();
        } else if (tabId === 'audit') {
            renderAuditLog();
        } else if (tabId === 'theme') {
            initializeThemeCustomization();
        } else if (tabId === 'images') {
            initializeImageManagement();
        }
    }
}
window.showAdminTab = showAdminTab;

function initializeHeroSettings() {
    // Initialiser les valeurs des gradients
    if (siteData.titleGradient) {
        const titleGradientStart = document.getElementById('titleGradientStart');
        const titleGradientEnd = document.getElementById('titleGradientEnd');
        if (titleGradientStart) titleGradientStart.value = siteData.titleGradient.start;
        if (titleGradientEnd) titleGradientEnd.value = siteData.titleGradient.end;
    }
    if (siteData.sloganGradient) {
        const sloganGradientStart = document.getElementById('sloganGradientStart');
        const sloganGradientEnd = document.getElementById('sloganGradientEnd');
        if (sloganGradientStart) sloganGradientStart.value = siteData.sloganGradient.start;
        if (sloganGradientEnd) sloganGradientEnd.value = siteData.sloganGradient.end;
    }
    if (siteData.descriptionGradient) {
        const descriptionGradientStart = document.getElementById('descriptionGradientStart');
        const descriptionGradientEnd = document.getElementById('descriptionGradientEnd');
        if (descriptionGradientStart) descriptionGradientStart.value = siteData.descriptionGradient.start;
        if (descriptionGradientEnd) descriptionGradientEnd.value = siteData.descriptionGradient.end;
    }

    // Restore hero title size
    if (siteData.heroSizes && siteData.heroSizes.title) {
        const titleSize = siteData.heroSizes.title;
        const heroTitleSizeSlider = document.getElementById('heroTitleSize');
        const heroTitleSizeValue = document.getElementById('heroTitleSizeValue');
        const heroTitle = document.getElementById('heroTitle');

        if (heroTitleSizeSlider) {
            heroTitleSizeSlider.value = titleSize;
        }
        if (heroTitleSizeValue) {
            heroTitleSizeValue.textContent = titleSize + 'px';
        }
        if (heroTitle) {
            heroTitle.style.fontSize = titleSize + 'px';
        }
    }

    // Restore hero subtitle size
    if (siteData.heroSizes && siteData.heroSizes.subtitle) {
        const subtitleSize = siteData.heroSizes.subtitle;
        const heroSubtitleSizeSlider = document.getElementById('heroSubtitleSize');
        const heroSubtitleSizeValue = document.getElementById('heroSubtitleSizeValue');
        const heroSubtitle = document.getElementById('heroSubtitle');

        if (heroSubtitleSizeSlider) {
            heroSubtitleSizeSlider.value = subtitleSize;
        }
        if (heroSubtitleSizeValue) {
            heroSubtitleSizeValue.textContent = subtitleSize + 'px';
        }
        if (heroSubtitle) {
            heroSubtitle.style.fontSize = subtitleSize + 'px';
        }
    }

    // Restore subtitle formatting
    if (siteData.subtitleFormatting) {
        const heroSubtitle = document.getElementById('heroSubtitle');
        if (heroSubtitle) {
            heroSubtitle.style.fontWeight = siteData.subtitleFormatting.bold ? '700' : '400';
            heroSubtitle.style.fontStyle = siteData.subtitleFormatting.italic ? 'italic' : 'normal';
            heroSubtitle.style.textDecoration = siteData.subtitleFormatting.underline ? 'underline' : 'none';
        }
    }

    // Restore title formatting
    if (siteData.titleFormatting) {
        const heroTitle = document.getElementById('heroTitle');
        if (heroTitle) {
            heroTitle.style.fontWeight = siteData.titleFormatting.bold ? '700' : '400';
            heroTitle.style.fontStyle = siteData.titleFormatting.italic ? 'italic' : 'normal';
            heroTitle.style.textDecoration = siteData.titleFormatting.underline ? 'underline' : 'none';
        }
    }

    // Apply all hero settings to DOM (in case they weren't applied on page load)
    applyAllHeroSettings();

    updateGradientPreviews();
}

function initializeAdminSettings() {
    renderSectionsManager();
    renderRecruitmentEmails();
    renderContactSettings();
    renderSocialLinksManager();
    updateGradientPreviews();
    setupColorPickers();
}

function setupColorPickers() {
    // Setup color pickers avec affichage des valeurs
    const primaryColorPicker = document.getElementById('primaryColor');
    const secondaryColorPicker = document.getElementById('secondaryColor');

    if (primaryColorPicker) {
        primaryColorPicker.addEventListener('change', function () {
            const value = this.value;
            document.getElementById('primaryColorValue').textContent = value;
            document.documentElement.style.setProperty('--primary', value);
            siteData.settings.primaryColor = value;
            forceSaveData();
        });
    }

    if (secondaryColorPicker) {
        secondaryColorPicker.addEventListener('change', function () {
            const value = this.value;
            document.getElementById('secondaryColorValue').textContent = value;
            document.documentElement.style.setProperty('--secondary', value);
            siteData.settings.secondaryColor = value;
            forceSaveData();
        });
    }

    // Setup gradient color pickers
    ['titleGradientStart', 'titleGradientEnd', 'sloganGradientStart', 'sloganGradientEnd', 'descriptionGradientStart', 'descriptionGradientEnd', 'heroGradientStart', 'heroGradientEnd', 'footerGradientStart', 'footerGradientEnd'].forEach(id => {
        const picker = document.getElementById(id);
        if (picker) {
            picker.addEventListener('change', updateGradientPreviews);
        }
    });
}

function renderSectionsManager() {
    Object.keys(siteData.settings.sectionsEnabled).forEach(section => {
        const toggle = document.querySelector(`.section-toggle[data-section="${section}"] .toggle-switch`);
        const container = document.querySelector(`.section-toggle[data-section="${section}"]`);

        if (toggle && container) {
            const isEnabled = siteData.settings.sectionsEnabled[section];
            toggle.classList.toggle('active', isEnabled);
            container.classList.toggle('active', isEnabled);

            if (section === 'testimonials') {
                const testimonialsSection = document.getElementById('testimonials-section');
                if (testimonialsSection) {
                    testimonialsSection.style.display = isEnabled ? 'block' : 'none';
                }
            }
        }
    });
}

async function toggleSection(sectionName, toggleElement) {
    const isCurrentlyActive = toggleElement.classList.contains('active');
    const newState = !isCurrentlyActive;

    // Initialize sectionsEnabled if not exists
    if (!siteData.settings.sectionsEnabled) {
        siteData.settings.sectionsEnabled = {};
    }

    siteData.settings.sectionsEnabled[sectionName] = newState;

    toggleElement.classList.toggle('active', newState);
    toggleElement.parentElement.classList.toggle('active', newState);

    if (sectionName === 'testimonials') {
        const testimonialsSection = document.getElementById('testimonials-section');
        if (testimonialsSection) {
            testimonialsSection.style.display = newState ? 'block' : 'none';
        }
    }

    // Save to Firestore immediately
    await saveAdminDataToFirestore('settings', 'main', siteData.settings, `Section ${sectionName} ${newState ? 'enabled' : 'disabled'}`)
        .then(() => forceSaveData())
        .then(() => {
            const message = siteData.language === 'en' ?
                `Section ${sectionName} ${newState ? 'enabled' : 'disabled'}` :
                `Section ${sectionName} ${newState ? 'activée' : 'désactivée'}`;
            showNotification(message, 'success');
            logActivity(currentUser.username, `Section ${sectionName} ${newState ? 'activée' : 'désactivée'}`);
        })
        .catch(err => {
            console.error('Error saving section toggle:', err);
            showNotification('Échec de sauvegarde de la section', 'error');
            // Revert toggle state
            toggleElement.classList.toggle('active', !newState);
            toggleElement.parentElement.classList.toggle('active', !newState);
        });
}

function renderRecruitmentEmails() {
    const container = document.getElementById('recruitmentEmailsList');
    if (container && siteData.settings.recruitmentEmails) {
        container.innerHTML = '';
        siteData.settings.recruitmentEmails.forEach((email, index) => {
            const emailItem = document.createElement('div');
            emailItem.className = 'email-item';
            emailItem.innerHTML = `
                <span>${email}</span>
                <button class="btn btn-sm btn-danger functional-btn" onclick="removeRecruitmentEmail(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(emailItem);
        });
    }
}

async function addRecruitmentEmail() {
    const emailInput = document.getElementById('recruitmentEmail');
    const email = emailInput.value.trim().toLowerCase(); // Normalize to lowercase

    if (email && email.includes('@') && email.includes('.')) {
        // Initialize if not exists
        if (!siteData.settings) {
            siteData.settings = {};
        }
        if (!siteData.settings.recruitmentEmails) {
            siteData.settings.recruitmentEmails = [];
        }

        // Check if email already exists (case-insensitive)
        const emailExists = siteData.settings.recruitmentEmails.some(e => e.toLowerCase() === email);
        
        if (!emailExists) {
            siteData.settings.recruitmentEmails.push(email);
            emailInput.value = '';
            renderRecruitmentEmails();
            
            console.log('📧 [SETTINGS] Adding recruitment email:', email);
            console.log('📧 [SETTINGS] All recruitment emails:', siteData.settings.recruitmentEmails);
            
            // Save to Firestore
            try {
                const saveResult = await saveAdminDataToFirestore('settings', 'main', siteData.settings, 'Recruitment email added');
                console.log('📧 [SETTINGS] Save result:', saveResult);
                
                if (saveResult && saveResult.success) {
                    await forceSaveData();
                    showNotification(siteData.language === 'en' ? 'Email added and saved' : 'Email ajouté et sauvegardé', 'success');
                    logActivity(currentUser.username, `Email de recrutement ajouté: ${email}`);
                } else {
                    console.error('❌ [SETTINGS] Failed to save to Firestore:', saveResult?.error);
                    showNotification('Email ajouté localement mais erreur de sauvegarde Firebase', 'warning');
                }
            } catch (err) {
                console.error('❌ [SETTINGS] Error saving recruitment email:', err);
                showNotification('Erreur lors de la sauvegarde de l\'email', 'error');
            }
        } else {
            showNotification(siteData.language === 'en' ? 'Email already exists' : 'Email déjà présent', 'warning');
        }
    } else {
        showNotification(siteData.language === 'en' ? 'Invalid email format' : 'Format d\'email invalide', 'error');
    }
}

async function removeRecruitmentEmail(index) {
    if (confirm(siteData.language === 'en' ? 'Delete this email?' : 'Supprimer cet email?')) {
        siteData.settings.recruitmentEmails.splice(index, 1);
        renderRecruitmentEmails();
        
        // Save to Firestore
        await saveAdminDataToFirestore('settings', 'main', siteData.settings, 'Recruitment email removed')
            .then(() => forceSaveData())
            .then(() => {
                showNotification(siteData.language === 'en' ? 'Email deleted' : 'Email supprimé', 'success');
            });
    }
}

async function saveRecruitmentEmails() {
    // Save to Firestore
    await saveAdminDataToFirestore('settings', 'main', siteData.settings, 'Recruitment emails updated')
        .then(() => forceSaveData())
        .then(() => {
            showNotification(siteData.language === 'en' ? 'Recruitment emails saved' : 'Emails de recrutement sauvegardés', 'success');
            logActivity(currentUser.username, 'Emails de recrutement mis à jour');
        });
}

// EmailJS Configuration - Simplified (no admin interface)
// Configuration is done directly in index.html via window.EMAILJS_CONFIG
// This function just ensures EmailJS is initialized if config exists
function loadEmailJSConfig() {
    // Check if EMAILJS_CONFIG is set and valid
    if (window.EMAILJS_CONFIG && 
        window.EMAILJS_CONFIG.serviceId && 
        window.EMAILJS_CONFIG.serviceId !== 'YOUR_SERVICE_ID' &&
        typeof emailjs !== 'undefined') {
        
        try {
            // Initialize EmailJS if not already initialized
            if (window.EMAILJS_CONFIG.publicKey) {
                emailjs.init(window.EMAILJS_CONFIG.publicKey);
                console.log('✅ [EMAILJS] Initialized successfully');
            }
        } catch (err) {
            console.error('❌ [EMAILJS] Initialization error:', err);
        }
    } else {
        console.warn('⚠️ [EMAILJS] Not configured. Configure EMAILJS_CONFIG in index.html');
    }
}

function renderContactSettings() {
    if (siteData.settings.contact) {
        document.getElementById('contactAddressAlger').value = siteData.settings.contact.addressAlger || '126 Coopérative ESSALEM 2 Birkhadem 16029 - Alger';
        document.getElementById('contactAddressOran').value = siteData.settings.contact.addressOran || '06,07 zone de siéges usto Oran';
        document.getElementById('contactPhoneAlger').value = siteData.settings.contact.phoneAlger || '0770 – 284- 828 / 0770 – 431- 516';
        document.getElementById('contactPhoneOran').value = siteData.settings.contact.phoneOran || '0770 - 177 - 776 / 046 - 821 - 393';
        document.getElementById('contactEmailAdmin').value = siteData.settings.contact.email;
        document.getElementById('googleMapsUrl').value = siteData.settings.contact.googleMapsUrl || '';
        document.getElementById('contactHours').value = siteData.settings.contact.hours || 'Dim-Jeu: 09h00 - 17h00';
    }
}

function renderSocialLinksManager() {
    // Les réseaux sociaux sont maintenant gérés dans le HTML avec les détails API
    if (siteData.settings.contact && siteData.settings.contact.socialLinks) {
        document.getElementById('linkedinUrl').value = siteData.settings.contact.socialLinks.linkedin || '';
        document.getElementById('facebookUrl').value = siteData.settings.contact.socialLinks.facebook || '';
        document.getElementById('twitterUrl').value = siteData.settings.contact.socialLinks.twitter || '';
        document.getElementById('instagramUrl').value = siteData.settings.contact.socialLinks.instagram || '';
        document.getElementById('youtubeUrl').value = siteData.settings.contact.socialLinks.youtube || '';
        document.getElementById('tiktokUrl').value = siteData.settings.contact.socialLinks.tiktok || '';
    }
}

function toggleSocialNetworks(toggleElement) {
    if (!toggleElement) {
        console.error('❌ [SOCIALS] toggleElement is null');
        return;
    }

    const isCurrentlyActive = toggleElement.classList.contains('active');
    const newState = !isCurrentlyActive;

    console.log('🔄 [SOCIALS] Toggling social networks:', { isCurrentlyActive, newState });

    // Initialize settings if not exists
    if (!siteData.settings) {
        siteData.settings = {};
    }

    // Initialize social networks enabled state if not exists
    if (siteData.settings.socialNetworksEnabled === undefined) {
        siteData.settings.socialNetworksEnabled = true;
    }

    siteData.settings.socialNetworksEnabled = newState;
    
    // FIX: Update toggle visual state immediately
    if (newState) {
        toggleElement.classList.add('active');
    } else {
        toggleElement.classList.remove('active');
    }

    console.log('✅ [SOCIALS] State updated:', siteData.settings.socialNetworksEnabled);
    console.log('✅ [SOCIALS] Toggle element classes:', toggleElement.classList.toString());

    // FIX: Apply visibility immediately to all social network elements (with small delay to ensure DOM is ready)
    setTimeout(() => {
        applySocialsVisibility(newState);
        console.log('✅ [SOCIALS] Visibility applied:', newState);
    }, 50);

    // Save to Firestore immediately
    saveAdminDataToFirestore('settings', 'main', siteData.settings, `Social networks ${newState ? 'enabled' : 'disabled'}`)
        .then(() => {
            console.log('✅ [SOCIALS] Saved to Firestore');
            return forceSaveData();
        })
        .then(() => {
            const message = siteData.language === 'en' ?
                `Social networks ${newState ? 'enabled' : 'disabled'}` :
                `Réseaux sociaux ${newState ? 'activés' : 'désactivés'}`;
            showNotification(message, 'success');
            logActivity(currentUser.username, `Réseaux sociaux ${newState ? 'activés' : 'désactivés'}`);
            console.log('✅ [SOCIALS] All done');
        })
        .catch(err => {
            console.error('❌ [SOCIALS] Error saving:', err);
            showNotification('Erreur lors de la sauvegarde', 'error');
        });
}

async function applySocialsSettings() {
    if (!siteData.settings.contact.socialLinks) {
        siteData.settings.contact.socialLinks = {};
    }

    siteData.settings.contact.socialLinks.linkedin = document.getElementById('linkedinUrl').value;
    siteData.settings.contact.socialLinks.facebook = document.getElementById('facebookUrl').value;
    siteData.settings.contact.socialLinks.twitter = document.getElementById('twitterUrl').value;
    siteData.settings.contact.socialLinks.instagram = document.getElementById('instagramUrl').value;
    siteData.settings.contact.socialLinks.youtube = document.getElementById('youtubeUrl').value;
    siteData.settings.contact.socialLinks.tiktok = document.getElementById('tiktokUrl').value;

    // Mettre à jour les liens dans le footer
    updateFooterSocialLinks();

    // Save to Firestore
    await saveAdminDataToFirestore('settings', 'main', siteData.settings, 'Social networks URLs updated')
        .then(() => forceSaveData())
        .then(() => {
            showNotification(siteData.language === 'en' ? 'Social networks saved' : 'Réseaux sociaux sauvegardés', 'success');
            logActivity(currentUser.username, 'Réseaux sociaux mis à jour');
        });
}

function saveSocialNetworks() {
    // Redirect to applySocialsSettings for consistency
    applySocialsSettings();
}

function updateFooterSocialLinks() {
    const footerSocialLinks = document.getElementById('footerSocialLinks');
    if (footerSocialLinks && siteData.settings.contact.socialLinks) {
        const socialButtons = footerSocialLinks.querySelectorAll('.social-btn');
        socialButtons.forEach(btn => {
            const network = btn.getAttribute('data-network');
            if (network && siteData.settings.contact.socialLinks[network]) {
                btn.href = siteData.settings.contact.socialLinks[network];
            }
        });
    }
}

function renderContactMessages() {
    const container = document.getElementById('contactMessagesList');
    if (container) {
        container.innerHTML = '';

        if (siteData.contactMessages && siteData.contactMessages.length > 0) {
            siteData.contactMessages.slice(0, 10).forEach((msg, index) => {
                const messageItem = document.createElement('div');
                messageItem.style.cssText = `
                    padding: 24px; 
                    border: 3px solid var(--border); 
                    border-radius: var(--border-radius-lg); 
                    margin-bottom: 20px;
                    background: ${msg.status === 'unread' ? 'linear-gradient(135deg, rgba(0, 86, 179, 0.12) 0%, rgba(0, 168, 150, 0.08) 100%)' : 'var(--bg-alt)'};
                    transition: var(--transition);
                    backdrop-filter: blur(10px);
                    box-shadow: var(--shadow-md);
                `;
                messageItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div style="font-weight: 800; color: var(--primary); font-size: var(--font-size-xl);">${msg.name}</div>
                        <span class="status-badge ${msg.status === 'unread' ? 'status-pending' : 'status-processed'}">
                            <i class="fas fa-${msg.status === 'unread' ? 'envelope' : 'envelope-open'}"></i>
                            ${msg.status === 'unread' ? (siteData.language === 'en' ? 'Unread' : 'Non lu') : (siteData.language === 'en' ? 'Read' : 'Lu')}
                        </span>
                    </div>
                    <div style="font-size: var(--font-size-base); color: var(--text-light); margin-bottom: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                        <div><strong>${siteData.language === 'en' ? 'Subject:' : 'Sujet:'}</strong> ${msg.subject}</div>
                        <div><strong>Email:</strong> ${msg.email}</div>
                        <div><strong>${siteData.language === 'en' ? 'Date:' : 'Date:'}</strong> ${new Date(msg.timestamp).toLocaleDateString()}</div>
                        ${msg.phone ? `<div><strong>${siteData.language === 'en' ? 'Phone:' : 'Téléphone:'}</strong> ${msg.phone}</div>` : ''}
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.9); padding: 20px; border-radius: var(--border-radius); margin-bottom: 20px; border-left: 6px solid var(--primary); box-shadow: inset var(--shadow-sm);">
                        <p style="color: var(--text-light); font-size: var(--font-size-base); line-height: var(--line-height-loose);">
                            ${msg.message.length > 200 ? msg.message.substring(0, 200) + '...' : msg.message}
                        </p>
                    </div>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                        <button class="btn btn-sm btn-primary functional-btn" onclick="replyToMessage('${msg.email}', '${msg.subject}')">
                            <i class="fas fa-reply"></i> ${siteData.language === 'en' ? 'Reply' : 'Répondre'}
                        </button>
                        <button class="btn btn-sm btn-outline functional-btn" onclick="markAsRead(${index})">
                            <i class="fas fa-${msg.status === 'unread' ? 'check' : 'undo'}"></i> ${msg.status === 'unread' ? (siteData.language === 'en' ? 'Mark as read' : 'Marquer lu') : (siteData.language === 'en' ? 'Mark as unread' : 'Marquer non lu')}
                        </button>
                        <button class="btn btn-sm btn-danger functional-btn" onclick="deleteMessage(${index})">
                            <i class="fas fa-trash"></i> ${siteData.language === 'en' ? 'Delete' : 'Supprimer'}
                        </button>
                    </div>
                `;

                messageItem.addEventListener('mouseenter', function () {
                    this.style.transform = 'translateY(-5px)';
                    this.style.boxShadow = 'var(--shadow-lg)';
                    this.style.borderColor = 'var(--primary)';
                });

                messageItem.addEventListener('mouseleave', function () {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = 'var(--shadow-md)';
                    this.style.borderColor = 'var(--border)';
                });

                container.appendChild(messageItem);
            });
        } else {
            container.innerHTML = `<p style="text-align: center; color: var(--text-light); padding: 40px; background: var(--bg-alt); border-radius: var(--border-radius-lg);">${siteData.language === 'en' ? 'No messages received' : 'Aucun message reçu'}</p>`;
        }
    }
}

function updateContactStats() {
    if (siteData.contactMessages) {
        const total = siteData.contactMessages.length;
        const unread = siteData.contactMessages.filter(msg => msg.status === 'unread').length;

        document.getElementById('totalMessages').textContent = total;
        document.getElementById('unreadMessages').textContent = unread;
    }
}

function replyToMessage(email, subject) {
    const replySubject = `Re: ${subject}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(replySubject)}`;
    logActivity(currentUser.username, `Réponse à message: ${email}`);
}

function markAsRead(index) {
    if (siteData.contactMessages[index]) {
        siteData.contactMessages[index].status = siteData.contactMessages[index].status === 'unread' ? 'read' : 'unread';
        if (forceSaveData()) {
            renderContactMessages();
            updateContactStats();
        } else {
            showNotification('Échec de sauvegarde du statut', 'error');
        }
    }
}

function deleteMessage(index) {
    if (confirm(siteData.language === 'en' ? 'Delete this message?' : 'Supprimer ce message?')) {
        siteData.contactMessages.splice(index, 1);
        if (forceSaveData()) {
            renderContactMessages();
            updateContactStats();
            showNotification(siteData.language === 'en' ? 'Message deleted' : 'Message supprimé', 'success');
        } else {
            showNotification('Échec de suppression du message', 'error');
        }
    }
}
function saveContactSettings() {
    siteData.settings.contact.addressAlger = document.getElementById('contactAddressAlger').value;
    siteData.settings.contact.addressOran = document.getElementById('contactAddressOran').value;
    siteData.settings.contact.phoneAlger = document.getElementById('contactPhoneAlger').value;
    siteData.settings.contact.phoneOran = document.getElementById('contactPhoneOran').value;
    siteData.settings.contact.email = document.getElementById('contactEmailAdmin').value;
    siteData.settings.contact.hours = document.getElementById('contactHours').value;
    siteData.settings.contact.googleMapsUrl = document.getElementById('googleMapsUrl').value;

    if (forceSaveData()) {
        showNotification(siteData.language === 'en' ? 'Contact settings saved' : 'Paramètres de contact sauvegardés', 'success');
        logActivity(currentUser.username, 'Paramètres de contact mis à jour');

        if (currentPage === 'contact') {
            executeContactScript();
        }
    } else {
        showNotification('Échec de sauvegarde des paramètres de contact', 'error');
    }
}

function updateGradientPreviews() {
    const titlePreview = document.getElementById('titleGradientPreview');
    const sloganPreview = document.getElementById('sloganGradientPreview');
    const descriptionPreview = document.getElementById('descriptionGradientPreview');
    const heroPreview = document.getElementById('heroGradientPreview');
    const footerPreview = document.getElementById('footerGradientPreview');

    if (titlePreview) {
        const start = document.getElementById('titleGradientStart').value;
        const end = document.getElementById('titleGradientEnd').value;
        titlePreview.style.background = `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
    }

    if (sloganPreview) {
        const start = document.getElementById('sloganGradientStart').value;
        const end = document.getElementById('sloganGradientEnd').value;
        sloganPreview.style.background = `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
    }

    if (descriptionPreview) {
        const start = document.getElementById('descriptionGradientStart').value;
        const end = document.getElementById('descriptionGradientEnd').value;
        descriptionPreview.style.background = `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
    }

    if (heroPreview) {
        const start = document.getElementById('heroGradientStart').value;
        const end = document.getElementById('heroGradientEnd').value;
        heroPreview.style.background = `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
    }

    if (footerPreview) {
        const start = document.getElementById('footerGradientStart').value;
        const end = document.getElementById('footerGradientEnd').value;
        footerPreview.style.background = `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
    }
}

// NOUVELLES FONCTIONS POUR LA SECTION HERO
/* ADD: Function to toggle text formatting for Hero title */
async function toggleTitleFormatting(type) {
    if (!siteData.titleFormatting) {
        siteData.titleFormatting = { bold: false, italic: false, underline: false };
    }

    siteData.titleFormatting[type] = !siteData.titleFormatting[type];

    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) {
        heroTitle.style.fontWeight = siteData.titleFormatting.bold ? '900' : '800';
        heroTitle.style.fontStyle = siteData.titleFormatting.italic ? 'italic' : 'normal';
        heroTitle.style.textDecoration = siteData.titleFormatting.underline ? 'underline' : 'none';
    }

    // Save to Firebase immediately using helper function
    const heroSettings = {
        titleGradient: siteData.titleGradient,
        sloganGradient: siteData.sloganGradient,
        descriptionGradient: siteData.descriptionGradient,
        heroBackground: siteData.heroBackground,
        heroSizes: siteData.heroSizes,
        titleFormatting: siteData.titleFormatting,
        subtitleFormatting: siteData.subtitleFormatting
    };
    await saveAdminDataToFirestore('heroSettings', 'main', heroSettings, `Hero title formatting: ${type}`);

    if (forceSaveData()) {
        showNotification(`Formatage ${type} ${siteData.titleFormatting[type] ? 'activé' : 'désactivé'}`, 'success');
    }
}

/* ADD: hero-title-size-control - Function to update Hero title size */
async function updateHeroTitleSize(size) {
    const heroTitle = document.getElementById('heroTitle');
    const sizeValue = document.getElementById('heroTitleSizeValue');

    if (heroTitle) {
        heroTitle.style.fontSize = size + 'px';
    }

    if (sizeValue) {
        sizeValue.textContent = size + 'px';
    }

    if (!siteData.heroSizes) {
        siteData.heroSizes = {};
    }
    siteData.heroSizes.title = size;

    // Save to Firebase immediately using helper function
    const heroSettings = {
        titleGradient: siteData.titleGradient,
        sloganGradient: siteData.sloganGradient,
        descriptionGradient: siteData.descriptionGradient,
        heroBackground: siteData.heroBackground,
        heroSizes: siteData.heroSizes,
        titleFormatting: siteData.titleFormatting,
        subtitleFormatting: siteData.subtitleFormatting
    };
    await saveAdminDataToFirestore('heroSettings', 'main', heroSettings, 'Hero title size');

    forceSaveData();
}

/* ADD: hero-subtitle-style - Function to toggle text formatting for Hero subtitle */
async function toggleSubtitleFormatting(type) {
    if (!siteData.subtitleFormatting) {
        siteData.subtitleFormatting = { bold: false, italic: false, underline: false };
    }

    siteData.subtitleFormatting[type] = !siteData.subtitleFormatting[type];

    const heroSubtitle = document.getElementById('heroSubtitle');
    if (heroSubtitle) {
        heroSubtitle.style.fontWeight = siteData.subtitleFormatting.bold ? '700' : '400';
        heroSubtitle.style.fontStyle = siteData.subtitleFormatting.italic ? 'italic' : 'normal';
        heroSubtitle.style.textDecoration = siteData.subtitleFormatting.underline ? 'underline' : 'none';
    }

    // Save to Firebase immediately using helper function
    const heroSettings = {
        titleGradient: siteData.titleGradient,
        sloganGradient: siteData.sloganGradient,
        descriptionGradient: siteData.descriptionGradient,
        heroBackground: siteData.heroBackground,
        heroSizes: siteData.heroSizes,
        titleFormatting: siteData.titleFormatting,
        subtitleFormatting: siteData.subtitleFormatting
    };
    await saveAdminDataToFirestore('heroSettings', 'main', heroSettings, `Hero subtitle formatting: ${type}`);

    if (forceSaveData()) {
        showNotification(`Formatage sous-titre ${type} ${siteData.subtitleFormatting[type] ? 'activé' : 'désactivé'}`, 'success');
    }
}

/* ADD: hero-subtitle-size-control - Function to update Hero subtitle size */
async function updateHeroSubtitleSize(size) {
    const heroSubtitle = document.getElementById('heroSubtitle');
    const sizeValue = document.getElementById('heroSubtitleSizeValue');

    if (heroSubtitle) {
        heroSubtitle.style.fontSize = size + 'px';
    }

    if (sizeValue) {
        sizeValue.textContent = size + 'px';
    }

    if (!siteData.heroSizes) {
        siteData.heroSizes = {};
    }
    siteData.heroSizes.subtitle = size;

    // Save to Firebase immediately using helper function
    const heroSettings = {
        titleGradient: siteData.titleGradient,
        sloganGradient: siteData.sloganGradient,
        descriptionGradient: siteData.descriptionGradient,
        heroBackground: siteData.heroBackground,
        heroSizes: siteData.heroSizes,
        titleFormatting: siteData.titleFormatting,
        subtitleFormatting: siteData.subtitleFormatting
    };
    await saveAdminDataToFirestore('heroSettings', 'main', heroSettings, 'Hero subtitle size');

    forceSaveData();
}

async function updateSiteTitle() {
    const title = document.getElementById('siteTitle').value;
    siteData.settings.title = title;

    // Mettre à jour le titre de la page
    document.title = title;

    // Mettre à jour les éléments de la page
    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) {
        heroTitle.textContent = title;
        // Réappliquer le gradient si défini
        if (siteData.titleGradient) {
            heroTitle.style.background = siteData.titleGradient.gradient;
            heroTitle.style.webkitBackgroundClip = 'text';
            heroTitle.style.webkitTextFillColor = 'transparent';
            heroTitle.style.backgroundClip = 'text';
        }
        // Réappliquer le formatage si défini
        if (siteData.titleFormatting) {
            heroTitle.style.fontWeight = siteData.titleFormatting.bold ? '900' : '800';
            heroTitle.style.fontStyle = siteData.titleFormatting.italic ? 'italic' : 'normal';
            heroTitle.style.textDecoration = siteData.titleFormatting.underline ? 'underline' : 'none';
        }
        // Réappliquer la taille si définie
        if (siteData.heroSizes && siteData.heroSizes.title) {
            heroTitle.style.fontSize = siteData.heroSizes.title + 'px';
        }
    }

    // Save to Firebase immediately using helper function
    await saveAdminDataToFirestore('settings', 'main', siteData.settings, 'Site title');

    if (forceSaveData()) {
        showNotification('Titre du site mis à jour', 'success');
        logActivity(currentUser.username, 'Titre du site modifié');
    } else {
        showNotification('Échec de sauvegarde du titre', 'error');
    }
}

async function updateSiteSlogan() {
    const slogan = document.getElementById('siteSlogan').value;
    siteData.settings.slogan = slogan;

    // Mettre à jour les éléments de la page
    const heroSubtitle = document.getElementById('heroSubtitle');
    if (heroSubtitle) {
        heroSubtitle.textContent = slogan;
        // Réappliquer le gradient si défini
        if (siteData.sloganGradient) {
            heroSubtitle.style.background = siteData.sloganGradient.gradient;
            heroSubtitle.style.webkitBackgroundClip = 'text';
            heroSubtitle.style.webkitTextFillColor = 'transparent';
            heroSubtitle.style.backgroundClip = 'text';
        }
        // Réappliquer le formatage si défini
        if (siteData.subtitleFormatting) {
            heroSubtitle.style.fontWeight = siteData.subtitleFormatting.bold ? '700' : '400';
            heroSubtitle.style.fontStyle = siteData.subtitleFormatting.italic ? 'italic' : 'normal';
            heroSubtitle.style.textDecoration = siteData.subtitleFormatting.underline ? 'underline' : 'none';
        }
        // Réappliquer la taille si définie
        if (siteData.heroSizes && siteData.heroSizes.subtitle) {
            heroSubtitle.style.fontSize = siteData.heroSizes.subtitle + 'px';
        }
    }

    // Save to Firebase immediately using helper function
    await saveAdminDataToFirestore('settings', 'main', siteData.settings, 'Site slogan');

    if (forceSaveData()) {
        showNotification('Slogan du site mis à jour', 'success');
        logActivity(currentUser.username, 'Slogan du site modifié');
    } else {
        showNotification('Échec de sauvegarde du slogan', 'error');
    }
}

async function updateSiteDescription() {
    const description = document.getElementById('siteDescription').value;
    siteData.settings.description = description;

    // Save to Firestore
    await saveAdminDataToFirestore('settings', 'main', siteData.settings, 'Site description');

    if (forceSaveData()) {
        showNotification('Description du site mise à jour', 'success');
        logActivity(currentUser.username, 'Description du site modifiée');
    } else {
        showNotification('Échec de sauvegarde de la description', 'error');
    }
}

async function applyTitleGradient() {
    const start = document.getElementById('titleGradientStart').value;
    const end = document.getElementById('titleGradientEnd').value;

    siteData.titleGradient = {
        start: start,
        end: end,
        gradient: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`
    };

    // Appliquer le gradient au titre hero
    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) {
        heroTitle.style.background = siteData.titleGradient.gradient;
        heroTitle.style.webkitBackgroundClip = 'text';
        heroTitle.style.webkitTextFillColor = 'transparent';
        heroTitle.style.backgroundClip = 'text';
    }

    // Save to Firebase immediately using helper function
    const heroSettings = {
        titleGradient: siteData.titleGradient,
        sloganGradient: siteData.sloganGradient,
        descriptionGradient: siteData.descriptionGradient,
        heroBackground: siteData.heroBackground,
        heroSizes: siteData.heroSizes,
        titleFormatting: siteData.titleFormatting,
        subtitleFormatting: siteData.subtitleFormatting
    };
    await saveAdminDataToFirestore('heroSettings', 'main', heroSettings, 'Hero title gradient');

    if (forceSaveData()) {
        showNotification('Dégradé titre appliqué', 'success');
        logActivity(currentUser.username, 'Dégradé titre modifié');
    } else {
        showNotification('Échec d\'application du dégradé titre', 'error');
    }
}
async function applySloganGradient() {
    const start = document.getElementById('sloganGradientStart').value;
    const end = document.getElementById('sloganGradientEnd').value;

    siteData.sloganGradient = {
        start: start,
        end: end,
        gradient: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`
    };

    // Appliquer le gradient au slogan hero
    const heroSubtitle = document.getElementById('heroSubtitle');
    if (heroSubtitle) {
        heroSubtitle.style.background = siteData.sloganGradient.gradient;
        heroSubtitle.style.webkitBackgroundClip = 'text';
        heroSubtitle.style.webkitTextFillColor = 'transparent';
        heroSubtitle.style.backgroundClip = 'text';
    }

    // Save to Firebase immediately using helper function
    const heroSettings = {
        titleGradient: siteData.titleGradient,
        sloganGradient: siteData.sloganGradient,
        descriptionGradient: siteData.descriptionGradient,
        heroBackground: siteData.heroBackground,
        heroSizes: siteData.heroSizes,
        titleFormatting: siteData.titleFormatting,
        subtitleFormatting: siteData.subtitleFormatting
    };
    await saveAdminDataToFirestore('heroSettings', 'main', heroSettings, 'Hero slogan gradient');

    if (forceSaveData()) {
        showNotification('Dégradé slogan appliqué', 'success');
        logActivity(currentUser.username, 'Dégradé slogan modifié');
    } else {
        showNotification('Échec d\'application du dégradé slogan', 'error');
    }
}
async function applyDescriptionGradient() {
    const start = document.getElementById('descriptionGradientStart').value;
    const end = document.getElementById('descriptionGradientEnd').value;

    siteData.descriptionGradient = {
        start: start,
        end: end,
        gradient: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`
    };

    // Save to Firebase immediately using helper function
    const heroSettings = {
        titleGradient: siteData.titleGradient,
        sloganGradient: siteData.sloganGradient,
        descriptionGradient: siteData.descriptionGradient,
        heroBackground: siteData.heroBackground,
        heroSizes: siteData.heroSizes,
        titleFormatting: siteData.titleFormatting,
        subtitleFormatting: siteData.subtitleFormatting
    };
    await saveAdminDataToFirestore('heroSettings', 'main', heroSettings, 'Hero description gradient');

    if (forceSaveData()) {
        showNotification('Dégradé description appliqué', 'success');
        logActivity(currentUser.username, 'Dégradé description modifié');
    } else {
        showNotification('Échec d\'application du dégradé description', 'error');
    }
}

async function applyHeroGradient() {
    const start = document.getElementById('heroGradientStart').value;
    const end = document.getElementById('heroGradientEnd').value;

    siteData.heroBackground = {
        type: 'gradient',
        gradient: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`
    };

    const heroBackground = document.getElementById('heroBackground');
    if (heroBackground) {
        heroBackground.style.background = siteData.heroBackground.gradient;
        heroBackground.classList.remove('has-image', 'has-video');
    }

    // Save to Firebase immediately using helper function
    const heroSettings = {
        titleGradient: siteData.titleGradient,
        sloganGradient: siteData.sloganGradient,
        descriptionGradient: siteData.descriptionGradient,
        heroBackground: siteData.heroBackground,
        heroSizes: siteData.heroSizes,
        titleFormatting: siteData.titleFormatting,
        subtitleFormatting: siteData.subtitleFormatting
    };
    await saveAdminDataToFirestore('heroSettings', 'main', heroSettings, 'Hero background gradient');

    if (forceSaveData()) {
        showNotification('Dégradé hero appliqué', 'success');
        logActivity(currentUser.username, 'Dégradé hero modifié');
    } else {
        showNotification('Échec d\'application du dégradé hero', 'error');
    }
}

async function applyFooterGradient() {
    const start = document.getElementById('footerGradientStart').value;
    const end = document.getElementById('footerGradientEnd').value;

    siteData.footerBackground = {
        type: 'gradient',
        gradient: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`
    };

    const footerBackground = document.getElementById('footerBackground');
    if (footerBackground) {
        footerBackground.style.background = siteData.footerBackground.gradient;
        footerBackground.classList.remove('has-image', 'has-video');
    }

    // Save to Firestore
    await saveAdminDataToFirestore('settings', 'main', siteData.settings, 'Footer gradient updated')
        .then(() => {
            // Also save footerBackground separately
            const footerData = { footerBackground: siteData.footerBackground };
            return saveAdminDataToFirestore('footerSettings', 'main', footerData, 'Footer gradient');
        })
        .then(() => forceSaveData())
        .then(() => {
            showNotification('Dégradé footer appliqué', 'success');
            logActivity(currentUser.username, 'Dégradé footer modifié');
        });
}

function setHeroBackground(type) {
    if (type === 'gradient') {
        applyHeroGradient();
    }
}

function setFooterBackground(type) {
    if (type === 'gradient') {
        applyFooterGradient();
    }
}

function removeHeroBackground() {
    if (confirm(siteData.language === 'en' ? 'Remove hero background?' : 'Supprimer le fond hero?')) {
        delete siteData.heroBackground;

        const heroBackground = document.getElementById('heroBackground');
        if (heroBackground) {
            heroBackground.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
            heroBackground.classList.remove('has-image', 'has-video');
        }

        const heroVideo = document.getElementById('heroVideo');
        if (heroVideo) {
            heroVideo.style.display = 'none';
        }

        if (forceSaveData()) {
            showNotification('Fond hero supprimé', 'success');
            logActivity(currentUser.username, 'Fond hero supprimé');
        } else {
            showNotification('Échec de suppression du fond hero', 'error');
        }
    }
}

async function removeFooterBackground() {
    if (confirm(siteData.language === 'en' ? 'Remove footer background?' : 'Supprimer le fond footer?')) {
        delete siteData.footerBackground;

        const footerBackground = document.getElementById('footerBackground');
        if (footerBackground) {
            footerBackground.style.background = 'linear-gradient(135deg, #1e293b 0%, #0f1419 100%)';
            footerBackground.classList.remove('has-image', 'has-video');
        }

        const footerVideo = document.getElementById('footerVideo');
        if (footerVideo) {
            footerVideo.style.display = 'none';
        }

        // Save to Firestore
        await saveAdminDataToFirestore('settings', 'main', siteData.settings, 'Footer background removed')
            .then(() => {
                // Also save footerBackground separately
                const footerData = { footerBackground: null };
                return saveAdminDataToFirestore('footerSettings', 'main', footerData, 'Footer background removed');
            })
            .then(() => forceSaveData())
            .then(() => {
                showNotification('Fond footer supprimé', 'success');
                logActivity(currentUser.username, 'Fond footer supprimé');
            });
    }
}

function setupTinyMCE() {
    if (typeof tinymce !== 'undefined') {
        tinymce.init({
            selector: '#pageContentTinyMCE',
            height: 400,
            menubar: false,
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
            content_style: 'body { font-family: Inter, sans-serif; font-size: 14px; }',
            skin: document.body.classList.contains('dark-mode') ? 'oxide-dark' : 'oxide',
            content_css: document.body.classList.contains('dark-mode') ? 'dark' : 'default'
        });
    }
}

function renderAdminContent() {
    // Mettre à jour le nom d'utilisateur affiché
    const currentUserElement = document.getElementById('currentUser');
    if (currentUserElement) {
        currentUserElement.textContent = currentUser.username;
    }

    renderAdminServices();
    renderAdminClients();
    renderAdminTestimonials();
    renderAdminJobs();
    renderAdminUsers();
    renderAdminPages();
    renderAdminCvDatabase();
    populateCVJobFilter();
    updateAdminSettings();
    renderServicesConfiguration(); /* ADD: service-admin-ui */
}

function updateAdminSettings() {
    document.getElementById('siteTitle').value = siteData.settings.title;
    document.getElementById('siteSlogan').value = siteData.settings.slogan;
    document.getElementById('siteDescription').value = siteData.settings.description;
    document.getElementById('defaultLanguage').value = siteData.settings.defaultLanguage;
    document.getElementById('enableMultilingual').checked = siteData.settings.enableMultilingual;
    document.getElementById('enableDarkMode').checked = siteData.settings.darkMode;
    document.getElementById('primaryColor').value = siteData.settings.primaryColor;
    document.getElementById('secondaryColor').value = siteData.settings.secondaryColor;
    document.getElementById('maintenanceMode').checked = siteData.settings.maintenanceMode;
    document.getElementById('maintenanceMessage').value = siteData.settings.maintenanceMessage;

    document.getElementById('adminLogoPreview').src = siteData.settings.logo;

    // Mettre à jour les valeurs des couleurs
    document.getElementById('primaryColorValue').textContent = siteData.settings.primaryColor;
    document.getElementById('secondaryColorValue').textContent = siteData.settings.secondaryColor;

    if (siteData.brochure) {
        document.getElementById('adminBrochureInfo').innerHTML = `<i class="fas fa-file-pdf"></i> ${siteData.brochure.name}`;
    }
}

function updateAnalytics() {
    document.getElementById('totalServices').textContent = siteData.services.filter(s => s.active).length;
    document.getElementById('totalClients').textContent = siteData.clients.filter(c => c.active).length;
    document.getElementById('totalJobs').textContent = siteData.jobs.filter(j => j.active).length;
    document.getElementById('totalApplications').textContent = siteData.cvDatabase ? siteData.cvDatabase.length : 0;

    if (siteData.consentLogs) {
        const accepted = siteData.consentLogs.filter(log => log.action === 'accepted').length;
        const declined = siteData.consentLogs.filter(log => log.action === 'declined').length;
        const pending = Math.max(0, 10 - accepted - declined);

        document.getElementById('consentAccepted').textContent = accepted;
        document.getElementById('consentDeclined').textContent = declined;
        document.getElementById('consentPending').textContent = pending;
    }

    drawSimpleChart('applicationsChart', 'bar');
    drawSimpleChart('jobTypesChart', 'pie');
}

function drawSimpleChart(canvasId, type) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (type === 'bar') {
        const data = [5, 8, 12, 7, 15, 10];
        const maxValue = Math.max(...data);
        const barWidth = canvas.width / data.length - 10;

        data.forEach((value, index) => {
            const barHeight = (value / maxValue) * (canvas.height - 40);
            const x = index * (barWidth + 10) + 5;
            const y = canvas.height - barHeight - 20;

            ctx.fillStyle = '#008fb3';
            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.fillStyle = '#64748b';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(value, x + barWidth / 2, y - 5);
        });
    } else if (type === 'pie') {
        const data = [
            { label: 'CDI', value: 60, color: '#008fb3' },
            { label: 'CDD', value: 25, color: '#e63946' },
            { label: 'Stage', value: 15, color: '#00a896' }
        ];

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        let currentAngle = 0;
        data.forEach(segment => {
            const sliceAngle = (segment.value / 100) * 2 * Math.PI;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();

            currentAngle += sliceAngle;
        });
    }
}

function renderAdminServices() {
    const container = document.getElementById('adminServicesList');
    if (container) {
        container.innerHTML = '';
        siteData.services.forEach((service, index) => {
            const serviceItem = document.createElement('div');
            serviceItem.style.cssText = `
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%); 
                border: 2px solid var(--border); 
                border-radius: var(--border-radius-lg); 
                padding: 25px;
                margin-bottom: 20px;
                transition: var(--transition);
                box-shadow: var(--shadow-md);
                backdrop-filter: blur(5px);
            `;
            serviceItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                    <h4 style="display: flex; align-items: center; gap: 12px; font-size: var(--font-size-xl); font-weight: 800;">${service.icon} ${service.title.fr}</h4>
                    <span class="status-badge ${service.active ? 'status-active' : 'status-inactive'}">
                        <i class="fas fa-${service.active ? 'check' : 'times'}"></i>
                        ${service.active ? (siteData.language === 'en' ? 'Active' : 'Actif') : (siteData.language === 'en' ? 'Inactive' : 'Inactif')}
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 20px; margin-bottom: 20px;">
                    <img src="${service.image}" alt="${service.title.fr}" style="width: 140px; height: 90px; object-fit: cover; border-radius: var(--border-radius); box-shadow: var(--shadow-sm);" loading="lazy">
                    <div>
                        <p style="color: var(--text-light); margin-bottom: 12px; line-height: var(--line-height-loose); font-weight: 500;">${service.description.fr}</p>
                        ${service.description.en ? `<p style="color: var(--text-lighter); font-size: var(--font-size-sm); font-style: italic; border-left: 3px solid var(--primary); padding-left: 12px;">EN: ${service.description.en}</p>` : ''}
                    </div>
                </div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                    <button class="btn btn-sm btn-outline functional-btn" onclick="editService(${index})">
                        <i class="fas fa-edit"></i> ${siteData.language === 'en' ? 'Edit' : 'Modifier'}
                    </button>
                    <button class="btn btn-sm btn-warning functional-btn" onclick="toggleService(${index})">
                        <i class="fas fa-toggle-${service.active ? 'on' : 'off'}"></i> ${service.active ? (siteData.language === 'en' ? 'Disable' : 'Désactiver') : (siteData.language === 'en' ? 'Enable' : 'Activer')}
                    </button>
                    <button class="btn btn-sm btn-danger functional-btn" onclick="deleteService(${index})">
                        <i class="fas fa-trash"></i> ${siteData.language === 'en' ? 'Delete' : 'Supprimer'}
                    </button>
                </div>
            `;

            serviceItem.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = 'var(--shadow-lg)';
                this.style.borderColor = 'var(--primary)';
            });

            serviceItem.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'var(--shadow-md)';
                this.style.borderColor = 'var(--border)';
            });

            container.appendChild(serviceItem);
        });
    }
}

function renderAdminClients() {
    const container = document.getElementById('adminClientsList');
    if (container) {
        container.innerHTML = '';
        
        // FIX: Ensure clients array exists and is valid
        if (!siteData.clients || !Array.isArray(siteData.clients)) {
            console.warn('⚠️ [RENDER CLIENTS] siteData.clients is not an array:', siteData.clients);
            siteData.clients = [];
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">Aucun client trouvé</p>';
            return;
        }
        
        console.log(`📋 [RENDER CLIENTS] Rendering ${siteData.clients.length} clients`);
        
        if (siteData.clients.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">Aucun client trouvé. Ajoutez votre premier client.</p>';
            return;
        }
        
        siteData.clients.forEach((client, index) => {
            // FIX: Validate client data
            if (!client || !client.name) {
                console.warn(`⚠️ [RENDER CLIENTS] Invalid client at index ${index}:`, client);
                return; // Skip invalid clients
            }
            
            const clientItem = document.createElement('div');
            /* FIX: event-delegation - Ajout de classe pour délégation */
            clientItem.className = 'client-item';
            clientItem.style.cssText = `
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%);
                border: 2px solid var(--border);
                border-radius: var(--border-radius-lg);
                padding: 25px;
                margin-bottom: 20px;
                transition: var(--transition);
                box-shadow: var(--shadow-md);
                backdrop-filter: blur(5px);
            `;
            clientItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                    <h4 style="font-size: var(--font-size-xl); font-weight: 800;">${client.name || 'Sans nom'}</h4>
                    <span class="status-badge ${client.active !== false ? 'status-active' : 'status-inactive'}">
                        <i class="fas fa-${client.active !== false ? 'check' : 'times'}"></i>
                        ${client.active !== false ? (siteData.language === 'en' ? 'Active' : 'Actif') : (siteData.language === 'en' ? 'Inactive' : 'Inactif')}
                    </span>
                </div>
                <div style="text-align: center; margin: 20px 0;">
                    <img src="${client.logo || 'backend/uploads/photos/logo_ae2i.png'}" alt="${client.name || 'Client'}" style="max-width: 200px; max-height: 100px; object-fit: contain; border-radius: var(--border-radius); box-shadow: var(--shadow-sm);" loading="lazy" onerror="this.src='backend/uploads/photos/logo_ae2i.png'">
                </div>
                <div style="display: flex; gap: 12px; margin-top: 16px; justify-content: center;">
                    <button class="btn btn-sm btn-outline functional-btn" onclick="editClient(${index})">
                        <i class="fas fa-edit"></i> ${siteData.language === 'en' ? 'Edit' : 'Modifier'}
                    </button>
                    <button class="btn btn-sm btn-warning functional-btn" onclick="toggleClient(${index})">
                        <i class="fas fa-toggle-${client.active !== false ? 'on' : 'off'}"></i> ${client.active !== false ? (siteData.language === 'en' ? 'Disable' : 'Désactiver') : (siteData.language === 'en' ? 'Enable' : 'Activer')}
                    </button>
                    <button class="btn btn-sm btn-danger functional-btn" onclick="deleteClient(${index})">
                        <i class="fas fa-trash"></i> ${siteData.language === 'en' ? 'Delete' : 'Supprimer'}
                    </button>
                </div>
            `;
            /* FIX: event-delegation - Suppression des listeners individuels, gérés globalement */

            container.appendChild(clientItem);
        });
        
        console.log(`✅ [RENDER CLIENTS] Successfully rendered ${container.children.length} client items`);
    } else {
        console.error('❌ [RENDER CLIENTS] Container adminClientsList not found');
    }
}
function renderAdminTestimonials() {
    const container = document.getElementById('adminTestimonialsList');
    if (container) {
        container.innerHTML = '';
        siteData.testimonials.forEach((testimonial, index) => {
            const testimonialItem = document.createElement('div');
            /* FIX: event-delegation - Ajout de classe pour délégation */
            testimonialItem.className = 'testimonial-item';
            testimonialItem.style.cssText = `
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%);
                border: 2px solid var(--border);
                border-radius: var(--border-radius-lg);
                padding: 25px;
                margin-bottom: 20px;
                transition: var(--transition);
                box-shadow: var(--shadow-md);
                backdrop-filter: blur(5px);
            `;
            testimonialItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                    <h4 style="font-size: var(--font-size-xl); font-weight: 800;">${testimonial.name}</h4>
                    <span class="status-badge ${testimonial.active ? 'status-active' : 'status-inactive'}">
                        <i class="fas fa-${testimonial.active ? 'check' : 'times'}"></i>
                        ${testimonial.active ? (siteData.language === 'en' ? 'Active' : 'Actif') : (siteData.language === 'en' ? 'Inactive' : 'Inactif')}
                    </span>
                </div>
                <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 16px;">
                    <img src="${testimonial.avatar}" alt="${testimonial.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary);" loading="lazy">
                    <div style="flex-grow: 1;">
                        <p style="font-weight: 600; margin-bottom: 8px; color: var(--text-dark);">${testimonial.position.fr}</p>
                        ${testimonial.position.en ? `<p style="font-size: var(--font-size-sm); color: var(--text-lighter); margin-bottom: 8px; font-style: italic;">EN: ${testimonial.position.en}</p>` : ''}
                        <div style="color: var(--warning); font-size: var(--font-size-lg);">
                            ${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}
                        </div>
                    </div>
                </div>
                <div style="background: var(--bg-alt); padding: 16px; border-radius: var(--border-radius); margin-bottom: 16px; border-left: 4px solid var(--primary);">
                    <p style="font-style: italic; color: var(--text-light); margin-bottom: 8px; line-height: var(--line-height-loose);">"${testimonial.text.fr}"</p>
                    ${testimonial.text.en ? `<p style="font-style: italic; color: var(--text-lighter); font-size: var(--font-size-sm); border-left: 2px solid var(--accent); padding-left: 12px;">EN: "${testimonial.text.en}"</p>` : ''}
                </div>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn btn-sm btn-outline functional-btn" onclick="editTestimonial(${index})">
                        <i class="fas fa-edit"></i> ${siteData.language === 'en' ? 'Edit' : 'Modifier'}
                    </button>
                    <button class="btn btn-sm btn-warning functional-btn" onclick="toggleTestimonial(${index})">
                        <i class="fas fa-toggle-${testimonial.active ? 'on' : 'off'}"></i> ${testimonial.active ? (siteData.language === 'en' ? 'Disable' : 'Désactiver') : (siteData.language === 'en' ? 'Enable' : 'Activer')}
                    </button>
                    <button class="btn btn-sm btn-danger functional-btn" onclick="deleteTestimonial(${index})">
                        <i class="fas fa-trash"></i> ${siteData.language === 'en' ? 'Delete' : 'Supprimer'}
                    </button>
                </div>
            `;
            /* FIX: event-delegation - Suppression des listeners individuels, gérés globalement */

            container.appendChild(testimonialItem);
        });
    }
}

function renderAdminJobs() {
    const container = document.getElementById('adminJobsList');
    if (container) {
        container.innerHTML = '';
        siteData.jobs.forEach((job, index) => {
            const jobItem = document.createElement('div');
            jobItem.style.cssText = `
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%); 
                border: 2px solid var(--border); 
                border-radius: var(--border-radius-lg); 
                padding: 25px; 
                margin-bottom: 20px;
                transition: var(--transition);
                box-shadow: var(--shadow-md);
                backdrop-filter: blur(5px);
            `;
            jobItem.innerHTML = `
                /* FIX: Removed Premium and New badges from dashboard job list */
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                    <h4 style="font-size: var(--font-size-xl); font-weight: 800; display: flex; align-items: center; gap: 12px;">
                        ${job.title.fr}
                    </h4>
                    <span class="status-badge ${job.active ? 'status-active' : 'status-inactive'}">
                        <i class="fas fa-${job.active ? 'check' : 'times'}"></i>
                        ${job.active ? (siteData.language === 'en' ? 'Active' : 'Actif') : (siteData.language === 'en' ? 'Inactive' : 'Inactif')}
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px;">
                    <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius); text-align: center;">
                        <strong>Type:</strong><br>
                        <span style="background: var(--primary); color: white; padding: 4px 12px; border-radius: var(--border-radius-full); font-size: var(--font-size-xs); margin-top: 4px; display: inline-block; font-weight: 700;">${job.type.toUpperCase()}</span>
                    </div>
                    <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius); text-align: center;">
                        <strong>${siteData.language === 'en' ? 'Location:' : 'Localisation:'}</strong><br>
                        <span style="color: var(--text-light);">${job.location}</span>
                    </div>
                    <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius); text-align: center;">
                        <strong>${siteData.language === 'en' ? 'Created by:' : 'Créé par:'}</strong><br>
                        <span style="color: var(--primary); font-weight: 600;">${job.createdBy || 'admin'}</span>
                    </div>
                    <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius); text-align: center;">
                        <strong>${siteData.language === 'en' ? 'Date:' : 'Date:'}</strong><br>
                        <span style="color: var(--text-light);">${new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div style="background: rgba(0, 86, 179, 0.05); padding: 16px; border-radius: var(--border-radius); margin-bottom: 16px; border-left: 4px solid var(--primary);">
                    <p style="color: var(--text-light); margin-bottom: 8px; line-height: var(--line-height-loose);">${job.description.fr}</p>
                    ${job.description.en ? `<p style="color: var(--text-lighter); font-size: var(--font-size-sm); font-style: italic; border-left: 2px solid var(--accent); padding-left: 12px; margin-top: 8px;">EN: ${job.description.en}</p>` : ''}
                </div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                    <button class="btn btn-sm btn-outline functional-btn" onclick="editJob(${index})">
                        <i class="fas fa-edit"></i> ${siteData.language === 'en' ? 'Edit' : 'Modifier'}
                    </button>
                    <button class="btn btn-sm btn-warning functional-btn" onclick="toggleJob(${index})">
                        <i class="fas fa-toggle-${job.active ? 'on' : 'off'}"></i> ${job.active ? (siteData.language === 'en' ? 'Disable' : 'Désactiver') : (siteData.language === 'en' ? 'Enable' : 'Activer')}
                    </button>
                    <button class="btn btn-sm btn-danger functional-btn" onclick="deleteJob(${index})">
                        <i class="fas fa-trash"></i> ${siteData.language === 'en' ? 'Delete' : 'Supprimer'}
                    </button>
                    <button class="btn btn-sm btn-success functional-btn" onclick="viewJobApplications(${job.id})">
                        <i class="fas fa-users"></i> ${siteData.language === 'en' ? 'Applications' : 'Candidatures'} (${siteData.cvDatabase ? siteData.cvDatabase.filter(cv => cv.jobId === job.id).length : 0})
                    </button>
                </div>
            `;

            jobItem.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = 'var(--shadow-lg)';
                this.style.borderColor = 'var(--primary)';
            });

            jobItem.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'var(--shadow-md)';
                this.style.borderColor = 'var(--border)';
            });

            container.appendChild(jobItem);
        });
    }
}

function renderAdminUsers() {
    const container = document.getElementById('adminUsersList');
    if (container) {
        container.innerHTML = '';

        // Ensure users array exists
        if (!siteData.users || !Array.isArray(siteData.users)) {
            siteData.users = [];
            console.log('⚠️ [RENDER USERS] Users array not found, initializing empty array');
        }

        // Show message if no users
        if (siteData.users.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: var(--bg-alt); border-radius: var(--border-radius-lg); color: var(--text-light);">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p style="font-size: var(--font-size-lg);">${siteData.language === 'en' ? 'No users found. Click "Add User" to create one.' : 'Aucun utilisateur trouvé. Cliquez sur "Ajouter un utilisateur" pour en créer un.'}</p>
                </div>
            `;
            renderAuditLog();
            return;
        }

        siteData.users.forEach((user, index) => {
            // Show all users except the main admin account (but show other admins if any)
            // Filter by checking if it's the default admin user
            const isDefaultAdmin = user.email === 'selmabdf@gmail.com' && user.role === 'admin';
            if (!isDefaultAdmin) { // Show all users except the default admin
                const userItem = document.createElement('div');
                userItem.style.cssText = `
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%); 
                    border: 2px solid var(--border); 
                    border-radius: var(--border-radius-lg); 
                    padding: 25px; 
                    margin-bottom: 20px;
                    transition: var(--transition);
                    box-shadow: var(--shadow-md);
                    backdrop-filter: blur(5px);
                `;
                userItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <h4 style="font-size: var(--font-size-xl); font-weight: 800; display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-user-circle" style="color: var(--primary);"></i>
                            ${user.username} 
                            <span style="background: ${user.role === 'recruteur' || user.role === 'recruiter' ? 'var(--accent)' : user.role === 'lecteur' || user.role === 'reader' ? 'var(--warning)' : user.role === 'editor' ? 'var(--info)' : 'var(--primary)'}; color: white; padding: 4px 12px; border-radius: var(--border-radius-full); font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase;">${user.role === 'recruteur' ? 'Recruteur' : user.role === 'lecteur' ? 'Lecteur' : user.role === 'recruiter' ? 'Recruteur' : user.role === 'reader' ? 'Lecteur' : user.role === 'admin' ? 'Admin' : user.role === 'editor' ? 'Éditeur' : user.role}</span>
                        </h4>
                        <span class="status-badge ${user.active ? 'status-active' : 'status-inactive'}">
                            <i class="fas fa-${user.active ? 'check' : 'times'}"></i>
                            ${user.active ? (siteData.language === 'en' ? 'Active' : 'Actif') : (siteData.language === 'en' ? 'Inactive' : 'Inactif')}
                        </span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>Email:</strong><br>
                            <span style="color: var(--text-light);">${user.email}</span>
                        </div>
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>${siteData.language === 'en' ? 'Last login:' : 'Dernière connexion:'}</strong><br>
                            <span style="color: var(--text-light);">${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : (siteData.language === 'en' ? 'Never' : 'Jamais')}</span>
                        </div>
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>${siteData.language === 'en' ? 'Created on:' : 'Créé le:'}</strong><br>
                            <span style="color: var(--text-light);">${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>${siteData.language === 'en' ? 'Created offers:' : 'Offres créées:'}</strong><br>
                            <span style="color: var(--primary); font-weight: 600;">${siteData.jobs.filter(j => j.createdBy === user.username).length}</span>
                        </div>
                    </div>
                    <div style="background: rgba(0, 86, 179, 0.05); padding: 16px; border-radius: var(--border-radius); margin-bottom: 16px; border-left: 4px solid var(--primary);">
                        <strong style="color: var(--primary);">Permissions:</strong>
                        <p style="color: var(--text-light); margin-top: 8px; font-size: var(--font-size-sm);">
                            ${roleDescriptions[siteData.language][user.role] || roleDescriptions[siteData.language][user.role === 'recruteur' ? 'recruiter' : user.role === 'lecteur' ? 'reader' : user.role] || 'Aucune description disponible'}
                        </p>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                        <button class="btn btn-sm btn-outline functional-btn" onclick="editUser(${index})">
                            <i class="fas fa-edit"></i> ${siteData.language === 'en' ? 'Edit' : 'Modifier'}
                        </button>
                        <button class="btn btn-sm btn-warning functional-btn" onclick="toggleUser(${index})">
                            <i class="fas fa-toggle-${user.active ? 'on' : 'off'}"></i> ${user.active ? (siteData.language === 'en' ? 'Disable' : 'Désactiver') : (siteData.language === 'en' ? 'Enable' : 'Activer')}
                        </button>
                        <button class="btn btn-sm btn-outline functional-btn" onclick="resetUserPassword(${index})">
                            <i class="fas fa-key"></i> ${siteData.language === 'en' ? 'Reset Password' : 'Reset Mot de Passe'}
                        </button>
                        <button class="btn btn-sm btn-danger functional-btn" onclick="deleteUser(${index})">
                            <i class="fas fa-trash"></i> ${siteData.language === 'en' ? 'Delete' : 'Supprimer'}
                        </button>
                        <button class="btn btn-sm btn-success functional-btn" onclick="viewUserActivity('${user.username}')">
                            <i class="fas fa-history"></i> ${siteData.language === 'en' ? 'Activity' : 'Activité'}
                        </button>
                    </div>
                `;

                userItem.addEventListener('mouseenter', function () {
                    this.style.transform = 'translateY(-5px)';
                    this.style.boxShadow = 'var(--shadow-lg)';
                    this.style.borderColor = 'var(--primary)';
                });

                userItem.addEventListener('mouseleave', function () {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = 'var(--shadow-md)';
                    this.style.borderColor = 'var(--border)';
                });

                container.appendChild(userItem);
            }
        });
    }

    // Render audit log
    renderAuditLog();
}

function renderAuditLog() {
    const auditContainer = document.getElementById('adminAuditLog');
    if (auditContainer) {
        auditContainer.innerHTML = '';

        if (siteData.activityLog && siteData.activityLog.length > 0) {
            // Filtrer selon le filtre sélectionné
            const filter = document.getElementById('auditFilter') ? document.getElementById('auditFilter').value : 'all';
            let filteredLogs = siteData.activityLog;

            if (filter !== 'all') {
                filteredLogs = siteData.activityLog.filter(log =>
                    log.action.toLowerCase().includes(filter.toLowerCase())
                );
            }

            filteredLogs.slice(0, 50).forEach(log => {
                const logItem = document.createElement('div');
                logItem.style.cssText = `
                    padding: 20px; 
                    border-bottom: 1px solid var(--border); 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    transition: var(--transition);
                    border-radius: var(--border-radius);
                    margin-bottom: 8px;
                    background: linear-gradient(135deg, rgba(0, 86, 179, 0.03) 0%, rgba(0, 168, 150, 0.02) 100%);
                    backdrop-filter: blur(2px);
                `;
                logItem.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--gradient-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: var(--font-size-lg); box-shadow: var(--shadow-sm);">
                            ${log.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 700; color: var(--primary); margin-bottom: 4px; font-size: var(--font-size-base);">${log.username}</div>
                            <div style="color: var(--text-light); font-weight: 500;">${log.action}</div>
                            ${log.page ? `<span style="background: var(--bg-alt); padding: 3px 10px; border-radius: var(--border-radius-sm); font-size: var(--font-size-xs); color: var(--text-lighter); margin-top: 4px; display: inline-block;">${log.page}</span>` : ''}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: var(--text-light); font-size: var(--font-size-sm); font-weight: 600;">${new Date(log.timestamp).toLocaleDateString()}</div>
                        <div style="color: var(--text-lighter); font-size: var(--font-size-xs);">${new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                `;

                logItem.addEventListener('mouseenter', function () {
                    this.style.background = 'linear-gradient(135deg, rgba(0, 86, 179, 0.08) 0%, rgba(0, 168, 150, 0.05) 100%)';
                    this.style.transform = 'translateX(5px)';
                    this.style.boxShadow = 'var(--shadow-sm)';
                });

                logItem.addEventListener('mouseleave', function () {
                    this.style.background = 'linear-gradient(135deg, rgba(0, 86, 179, 0.03) 0%, rgba(0, 168, 150, 0.02) 100%)';
                    this.style.transform = 'translateX(0)';
                    this.style.boxShadow = 'none';
                });

                auditContainer.appendChild(logItem);
            });
        } else {
            auditContainer.innerHTML = `<p style="text-align: center; color: var(--text-light); padding: 40px; background: var(--bg-alt); border-radius: var(--border-radius-lg);">${siteData.language === 'en' ? 'No activity recorded' : 'Aucune activité enregistrée'}</p>`;
        }
    }
}

// FIX: Function to create custom page section in HTML
function createCustomPageSection(page) {
    if (!page || !page.slug) return;
    
    const sectionsContainer = document.getElementById('customPagesSections');
    if (!sectionsContainer) {
        console.warn('⚠️ [PAGE] customPagesSections container not found');
        return;
    }
    
    // Check if section already exists
    const existingSection = document.getElementById(`${page.slug}-page`);
    if (existingSection) {
        // Update existing section
        existingSection.innerHTML = `
            <div class="container">
                <div class="section-content">
                    <h1>${page.title}</h1>
                    <div class="page-content">${page.content || ''}</div>
                </div>
            </div>
        `;
        console.log('✅ [PAGE] Updated existing page section:', page.slug);
        return;
    }
    
    // Create new section
    const pageSection = document.createElement('section');
    pageSection.className = 'page-section';
    pageSection.id = `${page.slug}-page`;
    pageSection.setAttribute('data-page', page.slug);
    pageSection.style.display = 'none';
    pageSection.innerHTML = `
        <div class="container">
            <div class="section-content">
                <h1>${page.title}</h1>
                <div class="page-content">${page.content || ''}</div>
            </div>
        </div>
    `;
    
    sectionsContainer.appendChild(pageSection);
    console.log('✅ [PAGE] Created page section:', page.slug);
}

// FIX: Function to update navigation with custom pages
function updateCustomPagesNavigation() {
    const navContainer = document.getElementById('customPagesNavigation');
    if (!navContainer) {
        console.warn('⚠️ [PAGE] customPagesNavigation container not found');
        return;
    }
    
    // Clear existing custom pages links
    navContainer.innerHTML = '';
    
    if (!siteData.customPages || !Array.isArray(siteData.customPages) || siteData.customPages.length === 0) {
        return;
    }
    
    // Group pages by location
    const pagesByLocation = {
        main: [],
        footer: [],
        services: [],
        about: []
    };
    
    siteData.customPages.forEach(page => {
        const location = page.location || 'main';
        if (pagesByLocation[location]) {
            pagesByLocation[location].push(page);
        } else {
            pagesByLocation.main.push(page);
        }
    });
    
    // Add pages to main navigation (main location)
    pagesByLocation.main.forEach(page => {
        const navItem = document.createElement('li');
        const navLink = document.createElement('a');
        navLink.href = `#${page.slug}`;
        navLink.className = 'nav-link functional-btn';
        navLink.setAttribute('data-page', page.slug);
        navLink.textContent = page.title;
        navItem.appendChild(navLink);
        navContainer.appendChild(navItem);
    });
    
    console.log('✅ [PAGE] Navigation updated with', pagesByLocation.main.length, 'custom pages');
}

function renderAdminPages() {
    const container = document.getElementById('adminPagesList');
    if (container) {
        container.innerHTML = '';
        if (siteData.customPages && siteData.customPages.length > 0) {
            siteData.customPages.forEach((page, index) => {
                const pageItem = document.createElement('div');
                pageItem.style.cssText = `
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%); 
                    border: 2px solid var(--border); 
                    border-radius: var(--border-radius-lg); 
                    padding: 25px; 
                    margin-bottom: 20px;
                    transition: var(--transition);
                    box-shadow: var(--shadow-md);
                    backdrop-filter: blur(5px);
                `;
                pageItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <h4 style="font-size: var(--font-size-xl); font-weight: 800;">${page.title}</h4>
                        <span class="status-badge status-active">
                            <i class="fas fa-check"></i>
                            ${page.status || (siteData.language === 'en' ? 'Published' : 'Publié')}
                        </span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>URL:</strong><br>
                            <span style="color: var(--primary); font-weight: 600;">/${page.slug}</span>
                        </div>
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>Menu:</strong><br>
                            <span style="color: var(--text-light);">${page.location || (siteData.language === 'en' ? 'Main' : 'Principal')}</span>
                        </div>
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>${siteData.language === 'en' ? 'Author:' : 'Auteur:'}</strong><br>
                            <span style="color: var(--text-light);">${page.author || 'admin'}</span>
                        </div>
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>${siteData.language === 'en' ? 'Created on:' : 'Créé le:'}</strong><br>
                            <span style="color: var(--text-light);">${new Date(page.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                        <button class="btn btn-sm btn-outline functional-btn" onclick="editPage(${index})">
                            <i class="fas fa-edit"></i> ${siteData.language === 'en' ? 'Edit' : 'Modifier'}
                        </button>
                        <button class="btn btn-sm btn-success functional-btn" onclick="viewPage(${index})">
                            <i class="fas fa-eye"></i> ${siteData.language === 'en' ? 'View' : 'Voir'}
                        </button>
                        <button class="btn btn-sm btn-primary functional-btn" onclick="duplicatePage(${index})">
                            <i class="fas fa-copy"></i> ${siteData.language === 'en' ? 'Duplicate' : 'Dupliquer'}
                        </button>
                        <button class="btn btn-sm btn-danger functional-btn" onclick="deletePage(${index})">
                            <i class="fas fa-trash"></i> ${siteData.language === 'en' ? 'Delete' : 'Supprimer'}
                        </button>
                    </div>
                `;

                pageItem.addEventListener('mouseenter', function () {
                    this.style.transform = 'translateY(-5px)';
                    this.style.boxShadow = 'var(--shadow-lg)';
                    this.style.borderColor = 'var(--primary)';
                });

                pageItem.addEventListener('mouseleave', function () {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = 'var(--shadow-md)';
                    this.style.borderColor = 'var(--border)';
                });

                container.appendChild(pageItem);
            });
        } else {
            container.innerHTML = `<p style="text-align: center; color: var(--text-light); padding: 40px; background: var(--bg-alt); border-radius: var(--border-radius-lg);">${siteData.language === 'en' ? 'No custom pages' : 'Aucune page personnalisée'}</p>`;
        }
    }
}

/* FIX: uniformize-filter-keys */
/* ADD: apply-admin-filters */
function applyAdminFilters() {
    renderAdminCvDatabase();
}
function getAdminFilteredCandidates() {
    let candidates = siteData.cvDatabase || [];

    // Barre de recherche - recherche dans plusieurs champs
    const searchTerm = document.getElementById('adminSearchBar')?.value.toLowerCase() || '';
    if (searchTerm) {
        candidates = candidates.filter(cv =>
            cv.applicantName?.toLowerCase().includes(searchTerm) ||
            cv.applicantFirstName?.toLowerCase().includes(searchTerm) ||
            cv.applicantLastName?.toLowerCase().includes(searchTerm) ||
            cv.applicantEmail?.toLowerCase().includes(searchTerm) ||
            cv.applicantPhone?.toLowerCase().includes(searchTerm) ||
            cv.jobTitle?.toLowerCase().includes(searchTerm) ||
            cv.diplome?.toLowerCase().includes(searchTerm) ||
            cv.domaine?.toLowerCase().includes(searchTerm) ||
            cv.applicantDiploma?.toLowerCase().includes(searchTerm) ||
            cv.wilaya?.toLowerCase().includes(searchTerm)
        );
    }

    // Filtre par Offre d'emploi
    const offreId = document.getElementById('adminOffreFilter')?.value || 'all';
    if (offreId !== 'all') {
        candidates = candidates.filter(cv => cv.jobId == offreId);
    }

    // Filtre Statut
    const status = document.getElementById('adminStatusFilter')?.value || 'all';
    if (status === 'pending') candidates = candidates.filter(cv => !cv.processed);
    else if (status === 'processed') candidates = candidates.filter(cv => cv.processed);

    // Filtre Domaine (multi-sélection)
    const domaines = Array.from(document.getElementById('adminDomaineFilter')?.selectedOptions || []).map(o => o.value);
    if (domaines.length > 0) {
        candidates = candidates.filter(cv => cv.domaine && domaines.some(d => cv.domaine.toLowerCase().includes(d.toLowerCase())));
    }

    // Filtre Diplôme (multi-sélection)
    const diplomes = Array.from(document.getElementById('adminDiplomeFilter')?.selectedOptions || []).map(o => o.value);
    if (diplomes.length > 0) {
        candidates = candidates.filter(cv => cv.applicantDiploma && diplomes.some(d => cv.applicantDiploma.toLowerCase().includes(d.toLowerCase())));
    }

    // Filtre Permis (multi-sélection)
    const permis = Array.from(document.getElementById('adminPermisFilter')?.selectedOptions || []).map(o => o.value);
    if (permis.length > 0) {
        candidates = candidates.filter(cv => cv.licenseTypes && cv.licenseTypes.some(lt => permis.includes(lt)));
    }

    // Filtre Wilaya (multi-sélection)
    const wilayas = Array.from(document.getElementById('adminWilayaFilter')?.selectedOptions || []).map(o => o.value);
    if (wilayas.length > 0) {
        candidates = candidates.filter(cv => cv.wilaya && wilayas.includes(cv.wilaya));
    }

    // Filtre Âge
    const ageMin = parseInt(document.getElementById('adminAgeMin')?.value) || 0;
    const ageMax = parseInt(document.getElementById('adminAgeMax')?.value) || 999;
    if (ageMin > 0 || ageMax < 999) {
        candidates = candidates.filter(cv => {
            const age = parseInt(cv.applicantAge) || 0;
            return age >= ageMin && age <= ageMax;
        });
    }

    // Filtre Préavis
    const preavis = document.getElementById('adminPreavisFilter')?.value || 'all';
    if (preavis !== 'all') {
        candidates = candidates.filter(cv => cv.preavis === preavis);
    }

    // Filtre Expérience
    const expMin = parseInt(document.getElementById('adminExperienceMin')?.value) || 0;
    const expMax = parseInt(document.getElementById('adminExperienceMax')?.value) || 999;
    if (expMin > 0 || expMax < 999) {
        candidates = candidates.filter(cv => {
            const exp = parseInt(cv.yearsExperience) || 0;
            return exp >= expMin && exp <= expMax;
        });
    }

    // Update count
    const countElement = document.getElementById('adminFilterCountNumber');
    if (countElement) countElement.textContent = candidates.length;

    return candidates;
}

function resetAdminFilters() {
    document.getElementById('adminSearchBar').value = '';
    document.getElementById('adminOffreFilter').value = 'all';
    document.getElementById('adminStatusFilter').value = 'all';
    document.getElementById('adminDomaineFilter').selectedIndex = -1;
    document.getElementById('adminDiplomeFilter').selectedIndex = -1;
    document.getElementById('adminPermisFilter').selectedIndex = -1;
    document.getElementById('adminWilayaFilter').selectedIndex = -1;
    document.getElementById('adminAgeMin').value = '';
    document.getElementById('adminAgeMax').value = '';
    document.getElementById('adminPreavisFilter').value = 'all';
    document.getElementById('adminExperienceMin').value = '';
    document.getElementById('adminExperienceMax').value = '';
    applyAdminFilters();
}

function exportAdminFilteredCandidates(format) {
    const filtered = getAdminFilteredCandidates();
    if (filtered.length === 0) {
        showNotification('Aucune candidature à exporter', 'warning');
        return;
    }

    if (format === 'pdf') {
        exportCandidatesPDF(filtered, 'Admin');
    } else if (format === 'excel') {
        exportCandidatesExcel(filtered, 'Admin');
    }
}

// DEPRECATED: Renamed to avoid conflict with new implementation
function renderAdminCvDatabase_LEGACY(filterJobId = null) {
    const container = document.getElementById('adminCvDatabase');
    if (container) {
        container.innerHTML = '';

        // Use filtered candidates from getAdminFilteredCandidates()
        let cvsToDisplay = getAdminFilteredCandidates();
        if (filterJobId && filterJobId !== 'all') {
            cvsToDisplay = cvsToDisplay.filter(cv => cv.jobId == filterJobId);
        }

        if (cvsToDisplay.length > 0) {
            cvsToDisplay.forEach((cv, index) => {
                const cvItem = document.createElement('div');
                cvItem.style.cssText = `
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%); 
                    border: 2px solid var(--border); 
                    border-radius: var(--border-radius-lg); 
                    padding: 25px; 
                    margin-bottom: 20px;
                    transition: var(--transition);
                    box-shadow: var(--shadow-md);
                    backdrop-filter: blur(5px);
                `;
                cvItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <h4 style="font-size: var(--font-size-xl); font-weight: 800; display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-user-tie" style="color: var(--primary);"></i>
                            ${cv.applicantName}
                        </h4>
                        <span class="status-badge ${cv.processed ? 'status-processed' : 'status-pending'}">
                            <i class="fas fa-${cv.processed ? 'check' : 'clock'}"></i>
                            ${cv.processed ? (siteData.language === 'en' ? 'Processed' : 'Traité') : (siteData.language === 'en' ? 'Pending' : 'En attente')}
                        </span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>${siteData.language === 'en' ? 'Position:' : 'Poste:'}</strong><br>
                            <span style="color: var(--primary); font-weight: 600;">${cv.jobTitle}</span>
                        </div>
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>Email:</strong><br>
                            <span style="color: var(--text-light);">${cv.applicantEmail}</span>
                        </div>
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>${siteData.language === 'en' ? 'Phone:' : 'Téléphone:'}</strong><br>
                            <span style="color: var(--text-light);">${cv.applicantPhone || (siteData.language === 'en' ? 'Not provided' : 'Non renseigné')}</span>
                        </div>
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>${siteData.language === 'en' ? 'Date:' : 'Date:'}</strong><br>
                            <span style="color: var(--text-light);">${new Date(cv.appliedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    ${cv.expectedSalary ? `
                        <div style="background: rgba(0, 168, 150, 0.08); padding: 16px; border-radius: var(--border-radius); margin-bottom: 16px; border-left: 4px solid var(--accent);">
                            <strong style="color: var(--accent);">Informations supplémentaires:</strong>
                            <div style="margin-top: 8px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                                <div><strong>Salaire souhaité:</strong> ${cv.expectedSalary} DA</div>
                                <div><strong>En poste:</strong> ${cv.currentlyEmployed === 'yes' ? 'Oui' : 'Non'}</div>
                                <div><strong>Dernier poste:</strong> ${cv.lastJobDate}</div>
                                <div><strong>Type contrat:</strong> ${cv.lastContractType}</div>
                            </div>
                        </div>
                    ` : ''}
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                        <!-- ADD: auto-generate-pdf - PDF Summary download button (appears first) -->
                        <button class="btn btn-sm btn-accent functional-btn" onclick="downloadApplicationPdfSummary(siteData.cvDatabase.find(c => c.id === '${cv.id || cv.firebaseId || ''}' || c.firebaseId === '${cv.id || cv.firebaseId || ''}'))" style="background: linear-gradient(135deg, #00a896 0%, #028090 100%); color: white; border: none;">
                            <i class="fas fa-file-pdf"></i> ${siteData.language === 'en' ? 'Summary PDF' : 'Résumé PDF'}
                        </button>
                        <button class="btn btn-sm btn-outline functional-btn" onclick="previewCV('${cv.id || cv.firebaseId || ''}')">
                            <i class="fas fa-eye"></i> ${siteData.language === 'en' ? 'View CV' : 'Voir CV'}
                        </button>
                        <button class="btn btn-sm btn-primary functional-btn" onclick="contactApplicant('${cv.applicantEmail}')">
                            <i class="fas fa-envelope"></i> ${siteData.language === 'en' ? 'Contact' : 'Contacter'}
                        </button>
                        <button class="btn btn-sm btn-success functional-btn" onclick="markAsProcessed('${cv.id || cv.firebaseId || ''}')">
                            <i class="fas fa-check"></i> ${siteData.language === 'en' ? 'Mark processed' : 'Marquer traité'}
                        </button>
                        <button class="btn btn-sm btn-warning functional-btn" onclick="downloadCV('${cv.id || cv.firebaseId || ''}')">
                            <i class="fas fa-download"></i> ${siteData.language === 'en' ? 'Download CV' : 'Télécharger CV'}
                        </button>
                        <button class="btn btn-sm btn-danger functional-btn" onclick="deleteApplication('${cv.id || cv.firebaseId || ''}')">
                            <i class="fas fa-trash"></i> ${siteData.language === 'en' ? 'Delete' : 'Supprimer'}
                        </button>
                    </div>
                `;

                cvItem.addEventListener('mouseenter', function () {
                    this.style.transform = 'translateY(-5px)';
                    this.style.boxShadow = 'var(--shadow-lg)';
                    this.style.borderColor = 'var(--primary)';
                });

                cvItem.addEventListener('mouseleave', function () {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = 'var(--shadow-md)';
                    this.style.borderColor = 'var(--border)';
                });

                container.appendChild(cvItem);
            });
        } else {
            container.innerHTML = `<p style="text-align: center; color: var(--text-light); padding: 40px; background: var(--bg-alt); border-radius: var(--border-radius-lg);">${siteData.language === 'en' ? 'No applications received' : 'Aucune candidature reçue'}</p>`;
        }
    }
}

// Populate job filter dropdown
function populateCVJobFilter() {
    const filterSelect = document.getElementById('cvJobFilter');
    if (!filterSelect) return;

    // Keep "All offers" option
    filterSelect.innerHTML = '<option value="all" data-fr="Toutes les offres" data-en="All offers" data-ar="Toutes les offres">Toutes les offres</option>';

    // Add each job that has applications
    const jobsWithApplications = new Set();
    if (siteData.cvDatabase) {
        siteData.cvDatabase.forEach(cv => {
            if (cv.jobId) jobsWithApplications.add(cv.jobId);
        });
    }

    // Add job options
    jobsWithApplications.forEach(jobId => {
        const job = siteData.jobs.find(j => j.id == jobId);
        if (job) {
            const option = document.createElement('option');
            option.value = jobId;
            option.textContent = `${job.title.fr} (${siteData.cvDatabase.filter(cv => cv.jobId == jobId).length})`;
            filterSelect.appendChild(option);
        }
    });

    translatePage(siteData.language);
}

// Filter CVs by selected job
function filterCVsByJob() {
    const filterSelect = document.getElementById('cvJobFilter');
    const selectedJobId = filterSelect ? filterSelect.value : 'all';
    renderAdminCvDatabase(selectedJobId === 'all' ? null : selectedJobId);
}
/* FIX: Prevent duplicate form setup */
let adminFormsSetup = false;
let adminFileUploadsSetup = false;

function setupAdminForms() {
    if (adminFormsSetup) return;
    adminFormsSetup = true;

    // Service form avec support bilingue
    /* FIX: Use onsubmit instead of addEventListener to prevent duplicate submissions */
    const serviceForm = document.getElementById('serviceForm');
    if (serviceForm) {
        serviceForm.onsubmit = function (e) {
            e.preventDefault();
            const title = document.getElementById('serviceTitle').value;
            const titleEn = document.getElementById('serviceTitleEn').value || title;
            const icon = document.getElementById('serviceIcon').value || '⚙️';
            const description = document.getElementById('serviceDescription').value;
            const descriptionEn = document.getElementById('serviceDescriptionEn').value || description;
            /* FIX: service-image-upload-preview */
            const imageInput = document.getElementById('serviceImage');

            /* FIX: service-image-display-after-save */
            const processServiceData = (imageDataUrl) => {
                const serviceData = {
                    id: currentEditingIndex >= 0 ? siteData.services[currentEditingIndex].id : Date.now(),
                    icon: icon,
                    title: { fr: title, en: titleEn },
                    description: { fr: description, en: descriptionEn },
                    image: imageDataUrl || 'backend/uploads/photos/footerBackground.png',
                    active: true
                };

                if (currentEditingIndex >= 0) {
                    siteData.services[currentEditingIndex] = { ...siteData.services[currentEditingIndex], ...serviceData };
                    logActivity(currentUser.username, `Service modifié: ${title}`);
                } else {
                    siteData.services.push(serviceData);
                    logActivity(currentUser.username, `Service créé: ${title}`);
                }

                // Save to Firestore immediately
                saveAdminDataToFirestore('services', serviceData.id.toString(), serviceData, `Service ${currentEditingIndex >= 0 ? 'updated' : 'added'}: ${title}`)
                    .then(() => forceSaveData())
                    .then(() => {
                        renderAdminServices();
                        closeModal('serviceModal');
                        showNotification(currentEditingIndex >= 0 ?
                            (siteData.language === 'en' ? 'Service updated successfully!' : 'Service modifié avec succès!') :
                            (siteData.language === 'en' ? 'Service added successfully!' : 'Service ajouté avec succès!'), 'success');
                        currentEditingIndex = -1;
                    })
                    .catch(err => {
                        console.error('Error saving service:', err);
                        showNotification('Échec de sauvegarde du service', 'error');
                    });
            };

            // Check if user uploaded a new image
            if (imageInput.files && imageInput.files[0]) {
                const file = imageInput.files[0];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        processServiceData(e.target.result);
                    };
                    reader.readAsDataURL(file);
                } else {
                    showNotification('Veuillez sélectionner une image valide', 'error');
                }
            } else {
                // No new image uploaded, keep existing or use default
                const existingImage = currentEditingIndex >= 0 ? siteData.services[currentEditingIndex].image : null;
                processServiceData(existingImage);
            }
        };
    }

    // Testimonial form avec support bilingue
    /* FIX: Use onsubmit instead of addEventListener to prevent duplicate submissions */
    const testimonialForm = document.getElementById('testimonialForm');
    if (testimonialForm) {
        testimonialForm.onsubmit = function (e) {
            e.preventDefault();
            const name = document.getElementById('testimonialName').value;
            const position = document.getElementById('testimonialPosition').value;
            const positionEn = document.getElementById('testimonialPositionEn').value || position;
            const text = document.getElementById('testimonialText').value;
            const textEn = document.getElementById('testimonialTextEn').value || text;
            const rating = document.getElementById('testimonialRating').value;

            const testimonialData = {
                id: currentEditingIndex >= 0 ? siteData.testimonials[currentEditingIndex].id : Date.now(),
                name: name,
                position: { fr: position, en: positionEn },
                text: { fr: text, en: textEn },
                rating: parseInt(rating),
                avatar: 'backend/uploads/photos/logo_ae2i.png',
                active: true
            };

            if (currentEditingIndex >= 0) {
                siteData.testimonials[currentEditingIndex] = { ...siteData.testimonials[currentEditingIndex], ...testimonialData };
                logActivity(currentUser.username, `Témoignage modifié: ${name}`);
            } else {
                siteData.testimonials.push(testimonialData);
                logActivity(currentUser.username, `Témoignage créé: ${name}`);
            }

            // Save to Firestore immediately (like clients)
            saveAdminDataToFirestore('testimonials', testimonialData.id.toString(), testimonialData, `Testimonial ${currentEditingIndex >= 0 ? 'updated' : 'added'}: ${name}`)
                .then(() => forceSaveData())
                .then(() => {
                    renderAdminTestimonials();
                    closeModal('testimonialModal');
                    showNotification(currentEditingIndex >= 0 ?
                        (siteData.language === 'en' ? 'Testimonial updated successfully!' : 'Témoignage modifié avec succès!') :
                        (siteData.language === 'en' ? 'Testimonial added successfully!' : 'Témoignage ajouté avec succès!'), 'success');
                    currentEditingIndex = -1;

                    // Redémarrer le carrousel automatique
                    if (currentPage === 'home') {
                        executeHomeScript();
                    }
                })
                .catch(err => {
                    console.error('Error saving testimonial:', err);
                    showNotification('Échec de sauvegarde du témoignage', 'error');
                });
        };
    }

    // Job form avec support bilingue
    /* FIX: Use onsubmit instead of addEventListener to prevent duplicate submissions */
    const jobForm = document.getElementById('jobForm');
    if (jobForm) {
        jobForm.onsubmit = function (e) {
            e.preventDefault();
            const title = document.getElementById('jobTitle').value;
            const titleEn = document.getElementById('jobTitleEn').value || title;
            const type = document.getElementById('jobType').value;
            const location = document.getElementById('jobLocation').value;
            const description = document.getElementById('jobDescription').value;
            const descriptionEn = document.getElementById('jobDescriptionEn').value || description;
            const requirements = document.getElementById('jobRequirements').value;
            const requirementsEn = document.getElementById('jobRequirementsEn').value || requirements;
            const customQuestion = document.getElementById('jobCustomQuestion').value.trim();
            const customQuestionEn = document.getElementById('jobCustomQuestionEn').value.trim();

            /* FIX: Removed auto-assignment of premium and isNew badges */
            const jobData = {
                id: currentEditingIndex >= 0 ? siteData.jobs[currentEditingIndex].id : Date.now(),
                type: type,
                title: { fr: title, en: titleEn },
                location: location,
                description: { fr: description, en: descriptionEn },
                requirements: { fr: requirements, en: requirementsEn },
                active: true,
                createdBy: currentUser.username,
                createdAt: currentEditingIndex >= 0 ? siteData.jobs[currentEditingIndex].createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Add custom question if provided
            if (customQuestion || customQuestionEn) {
                jobData.customQuestion = {
                    fr: customQuestion || customQuestionEn,
                    en: customQuestionEn || customQuestion
                };
            }

            /* FIX: Removed duplicate notification - only show one notification per action */
            if (currentEditingIndex >= 0) {
                siteData.jobs[currentEditingIndex] = { ...siteData.jobs[currentEditingIndex], ...jobData };
                logActivity(currentUser.username, `Offre modifiée: ${title}`);
            } else {
                siteData.jobs.push(jobData);
                logActivity(currentUser.username, `Offre créée: ${title}`);
            }

            // Save to Firestore immediately
            saveAdminDataToFirestore('jobs', jobData.id.toString(), jobData, `Job ${currentEditingIndex >= 0 ? 'updated' : 'added'}: ${title}`)
                .then(() => forceSaveData())
                .then(() => {
                    renderAdminJobs();
                    if (currentUser.role === 'recruiter' || currentUser.role === 'recruteur') {
                        renderRecruteurContent();
                    }
                    closeModal('jobModal');
                    showNotification(currentEditingIndex >= 0 ?
                        (siteData.language === 'en' ? 'Job offer updated successfully!' : 'Offre modifiée avec succès!') :
                        (siteData.language === 'en' ? 'Job offer created successfully!' : 'Offre créée avec succès!'), 'success');
                    currentEditingIndex = -1;
                })
                .catch(err => {
                    console.error('Error saving job:', err);
                    showNotification('Échec de sauvegarde de l\'offre', 'error');
                });
        };
    }

    // Client form
    /* FIX: Use onsubmit instead of addEventListener to prevent duplicate submissions */
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.onsubmit = function (e) {
            e.preventDefault();
            const name = document.getElementById('clientName').value;
            const logoInput = document.getElementById('clientLogo');

            /* FIX: Properly handle client logo upload */
            const processClientData = (logoDataUrl) => {
                const clientData = {
                    id: currentEditingIndex >= 0 ? siteData.clients[currentEditingIndex].id : Date.now(),
                    name: name,
                    logo: logoDataUrl || 'backend/uploads/photos/logo_ae2i.png',
                    active: true
                };

                // FIX: Ensure clients array exists
                if (!siteData.clients || !Array.isArray(siteData.clients)) {
                    siteData.clients = [];
                }

                if (currentEditingIndex >= 0) {
                    siteData.clients[currentEditingIndex] = { ...siteData.clients[currentEditingIndex], ...clientData };
                    logActivity(currentUser.username, `Client modifié: ${name}`);
                } else {
                    siteData.clients.push(clientData);
                    logActivity(currentUser.username, `Client créé: ${name}`);
                    console.log('✅ [CLIENT] Client ajouté à siteData.clients:', clientData);
                }

                // FIX: Render immediately before saving to show the client right away
                renderAdminClients();
                console.log('✅ [CLIENT] Clients rendus immédiatement, nombre:', siteData.clients.length);

                // Save to Firestore immediately
                saveAdminDataToFirestore('clients', clientData.id.toString(), clientData, `Client ${currentEditingIndex >= 0 ? 'updated' : 'added'}: ${name}`)
                    .then(() => {
                        console.log('✅ [CLIENT] Client sauvegardé dans Firestore');
                        return forceSaveData();
                    })
                    .then(() => {
                        // FIX: Reload clients from Firestore to ensure sync, but keep current client if reload fails
                        return window.firebaseHelper.getCollection('clients').then(clientsResult => {
                            if (clientsResult && clientsResult.success && clientsResult.data && clientsResult.data.length > 0) {
                                // Update siteData.clients with all clients from Firestore
                                const reloadedClients = clientsResult.data.map(client => ({
                                    ...client,
                                    id: typeof client.id === 'string' && !isNaN(client.id) ? parseInt(client.id) : client.id
                                }));
                                siteData.clients = reloadedClients;
                                console.log('✅ [CLIENT] Clients rechargés depuis Firestore:', reloadedClients.length);
                                renderAdminClients(); // Re-render after reload
                            } else {
                                console.log('ℹ️ [CLIENT] Aucun client dans Firestore, garde les clients locaux');
                            }
                        }).catch(err => {
                            console.warn('⚠️ [CLIENT] Could not reload clients from Firestore, keeping local:', err);
                            // Keep the client we just added locally
                        });
                    })
                    .then(() => {
                        closeModal('clientModal');
                        showNotification(currentEditingIndex >= 0 ?
                            (siteData.language === 'en' ? 'Client updated successfully!' : 'Client modifié avec succès!') :
                            (siteData.language === 'en' ? 'Client added successfully!' : 'Client ajouté avec succès!'), 'success');
                        currentEditingIndex = -1;
                    })
                    .catch(err => {
                        console.error('❌ [CLIENT] Error saving client:', err);
                        showNotification('Échec de sauvegarde du client', 'error');
                        // Still render the client even if save failed
                        renderAdminClients();
                    });
            };

            // Check if user uploaded a new logo
            if (logoInput.files && logoInput.files[0]) {
                const file = logoInput.files[0];
                if (file.type.startsWith('image/')) {
                    // FIX: Upload to R2 for persistence (like hero backgrounds)
                    showNotification('Téléversement du logo en cours...', 'info');

                    // Upload using firebaseHelper
                    const timestamp = Date.now();
                    const fileName = `client_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
                    const path = `images/clients/${fileName}`;

                    window.firebaseHelper.uploadFile(path, file, (progress) => {
                        console.log(`Upload progress: ${progress}%`);
                    }).then(result => {
                        if (result.success) {
                            const r2Url = result.url;
                            processClientData(r2Url);
                        } else {
                            showNotification('Erreur lors du téléversement: ' + result.error, 'error');
                        }
                    }).catch(err => {
                        console.error('Upload error:', err);
                        showNotification('Erreur critique lors du téléversement', 'error');
                    });
                } else {
                    showNotification('Veuillez sélectionner une image valide', 'error');
                }
            } else {
                // No new logo uploaded, keep existing or use default
                const existingLogo = currentEditingIndex >= 0 ? siteData.clients[currentEditingIndex].logo : null;
                processClientData(existingLogo);
            }
        };
    }

    // Page form
    /* FIX: Use onsubmit instead of addEventListener to prevent duplicate submissions */
    const pageForm = document.getElementById('pageForm');
    if (pageForm) {
        pageForm.onsubmit = function (e) {
            e.preventDefault();
            const title = document.getElementById('pageTitle').value;
            const slug = document.getElementById('pageSlug').value;
            const location = document.getElementById('pageLocation').value;

            let content = '';
            if (typeof tinymce !== 'undefined' && tinymce.get('pageContentTinyMCE')) {
                content = tinymce.get('pageContentTinyMCE').getContent();
            }

            const pageData = {
                id: currentEditingIndex >= 0 ? siteData.customPages[currentEditingIndex].id : Date.now(),
                title: title,
                slug: slug,
                content: content,
                location: location,
                status: 'published',
                createdAt: currentEditingIndex >= 0 ? siteData.customPages[currentEditingIndex].createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                author: currentUser.username
            };

            // FIX: Ensure customPages array exists
            if (!siteData.customPages || !Array.isArray(siteData.customPages)) {
                siteData.customPages = [];
            }

            if (currentEditingIndex >= 0) {
                siteData.customPages[currentEditingIndex] = { ...siteData.customPages[currentEditingIndex], ...pageData };
                logActivity(currentUser.username, `Page modifiée: ${title}`);
            } else {
                siteData.customPages.push(pageData);
                logActivity(currentUser.username, `Page créée: ${title}`);
                console.log('✅ [PAGE] Page ajoutée à siteData.customPages:', pageData);
            }

            // FIX: Save to Firestore immediately (like clients and jobs)
            saveAdminDataToFirestore('customPages', pageData.id.toString(), pageData, `Page ${currentEditingIndex >= 0 ? 'updated' : 'added'}: ${title}`)
                .then(() => {
                    console.log('✅ [PAGE] Page sauvegardée dans Firestore');
                    return forceSaveData();
                })
                .then(() => {
                    // FIX: Create page section in HTML if it doesn't exist
                    createCustomPageSection(pageData);
                    
                    // FIX: Update navigation with custom pages
                    updateCustomPagesNavigation();
                    
                    renderAdminPages();
                    closeModal('pageModal');
                    showNotification(currentEditingIndex >= 0 ?
                        (siteData.language === 'en' ? 'Page updated successfully!' : 'Page modifiée avec succès!') :
                        (siteData.language === 'en' ? 'Page created successfully!' : 'Page créée avec succès!'), 'success');
                    currentEditingIndex = -1;
                })
                .catch(err => {
                    console.error('❌ [PAGE] Error saving page:', err);
                    showNotification('Échec de sauvegarde de la page', 'error');
                    // Still render the page even if save failed
                    createCustomPageSection(pageData);
                    updateCustomPagesNavigation();
                    renderAdminPages();
                });
        };
    }

    // User form avec nouveau rôle "lecteur"
    /* FIX: Use onsubmit instead of addEventListener to prevent duplicate submissions */
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.onsubmit = async function (e) {
            e.preventDefault();

            const submitBtn = userForm.querySelector('button[type="submit"]');
            const originalText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Création en cours...';
            }

            try {
                console.log('🔍 [CREATE USER] Début création utilisateur');

                const username = document.getElementById('userName').value.trim();
                const email = document.getElementById('userEmail').value.trim().toLowerCase();
                const roleInput = document.getElementById('userRole').value;
                const password = document.getElementById('userPassword').value;

                // Map role: recruiter -> recruteur, reader -> lecteur
                const roleMap = {
                    'recruiter': 'recruteur',
                    'reader': 'lecteur',
                    'admin': 'admin',
                    'editor': 'editor'
                };
                const role = roleMap[roleInput] || roleInput;
                const isEditing = currentEditingIndex >= 0;
                const existingUser = isEditing ? siteData.users[currentEditingIndex] : null;

                if (!username || !email || !role) {
                    showNotification('Veuillez remplir tous les champs obligatoires', 'error');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                    return;
                }

                // Password is required only when creating new user
                if (!isEditing && !password) {
                    showNotification('Le mot de passe est requis pour créer un nouvel utilisateur', 'error');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                    return;
                }

                // Validate password length if provided
                if (password && password.length < 6) {
                    showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                    return;
                }

                let firebaseUid = existingUser?.uid || null;

                // If Firebase mode, create or update Firebase Auth user and Firestore document
                if (APP_MODE === 'FIREBASE' && window.firebaseServices && window.firebaseHelper) {
                    if (isEditing && firebaseUid) {
                        // Update existing user in Firestore
                        console.log('📝 [UPDATE USER] Updating Firestore user document:', firebaseUid);
                        try {
                            const firestoreResult = await window.firebaseHelper.updateDocument('users', firebaseUid, {
                                email: email,
                                username: username,
                                role: role,
                                updatedAt: new Date().toISOString()
                            });

                            if (firestoreResult.success) {
                                console.log('✅ [UPDATE USER] Firestore user document updated');
                            } else {
                                console.warn('⚠️ [UPDATE USER] Firestore document update failed:', firestoreResult.error);
                                showNotification('Erreur lors de la mise à jour Firestore: ' + firestoreResult.error, 'warning');
                            }
                        } catch (error) {
                            console.error('❌ [UPDATE USER] Firestore update error:', error);
                            showNotification('Erreur lors de la mise à jour: ' + error.message, 'error');
                        }
                    } else if (!isEditing) {
                        // Create new Firebase Auth user
                        console.log('🔥 [CREATE USER] Creating Firebase Auth user:', email);
                        try {
                            const userCredential = await window.firebaseServices.createUserWithEmailAndPassword(email, password);
                            firebaseUid = userCredential.user.uid;
                            console.log('✅ [CREATE USER] Firebase Auth user created:', firebaseUid);

                            // Create Firestore user document
                            console.log('📝 [CREATE USER] Creating Firestore user document:', firebaseUid);
                            const firestoreResult = await window.firebaseHelper.setDocument('users', firebaseUid, {
                                email: email,
                                username: username,
                                role: role,
                                active: true,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            }, false); // false = don't merge, create new

                            if (firestoreResult.success) {
                                console.log('✅ [CREATE USER] Firestore user document created');
                            } else {
                                console.warn('⚠️ [CREATE USER] Firestore document creation failed:', firestoreResult.error);
                                showNotification('Utilisateur créé mais erreur Firestore: ' + firestoreResult.error, 'warning');
                            }
                        } catch (error) {
                            console.error('❌ [CREATE USER] Firebase Auth creation error:', error);

                            // Handle specific errors
                            if (error.code === 'auth/email-already-in-use') {
                                showNotification('Cet email est déjà utilisé. Veuillez utiliser un autre email.', 'error');
                            } else if (error.code === 'auth/invalid-email') {
                                showNotification('Email invalide. Veuillez vérifier l\'adresse email.', 'error');
                            } else if (error.code === 'auth/weak-password') {
                                showNotification('Mot de passe trop faible. Utilisez au moins 6 caractères.', 'error');
                            } else {
                                showNotification(`Erreur lors de la création: ${error.message}`, 'error');
                            }

                            if (submitBtn) {
                                submitBtn.disabled = false;
                                submitBtn.textContent = originalText;
                            }
                            return;
                        }
                    }
                }

                // Prepare user data for local storage
                const userData = {
                    id: isEditing ? siteData.users[currentEditingIndex].id : Date.now(),
                    username: username,
                    email: email,
                    role: role,
                    active: isEditing ? (siteData.users[currentEditingIndex].active !== undefined ? siteData.users[currentEditingIndex].active : true) : true,
                    createdAt: isEditing ? siteData.users[currentEditingIndex].createdAt : new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // Keep password only if provided (for local mode compatibility)
                if (password) {
                    userData.password = password;
                } else if (isEditing && existingUser?.password) {
                    // Keep existing password if not changed
                    userData.password = existingUser.password;
                }

                // Add Firebase UID if available
                if (firebaseUid) {
                    userData.uid = firebaseUid;
                }

                // Update or add to local storage
                if (isEditing) {
                    siteData.users[currentEditingIndex] = { ...siteData.users[currentEditingIndex], ...userData };
                    logActivity(currentUser.username, `Utilisateur modifié: ${username} (${role})`);
                } else {
                    if (!siteData.users) siteData.users = [];
                    siteData.users.push(userData);
                    logActivity(currentUser.username, `Utilisateur créé: ${username} (${role})`);
                }

                // Save to local storage
                if (forceSaveData()) {
                    renderAdminUsers();
                    closeModal('userModal');
                    showNotification(currentEditingIndex >= 0 ?
                        (siteData.language === 'en' ? 'User updated successfully!' : 'Utilisateur modifié avec succès!') :
                        (siteData.language === 'en' ? 'User created successfully!' : 'Utilisateur créé avec succès!'), 'success');

                    // Reset form
                    currentEditingIndex = -1;
                    userForm.reset();

                    // Reset password field requirement
                    const passwordField = document.getElementById('userPassword');
                    if (passwordField) {
                        passwordField.required = true;
                    }

                    // Reset submit button text
                    const submitBtn = userForm.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.textContent = siteData.language === 'en' ? 'Save' : 'Sauvegarder';
                    }
                } else {
                    showNotification('Échec de sauvegarde locale de l\'utilisateur', 'error');
                }
            } catch (error) {
                console.error('❌ [CREATE USER] Unexpected error:', error);
                showNotification(`Erreur inattendue: ${error.message}`, 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        };
    }
}
function setupAdminFileUploads() {
    if (adminFileUploadsSetup) return;
    adminFileUploadsSetup = true;

    // Logo upload avec redimensionnement automatique
    const adminLogoInput = document.getElementById('adminLogoInput');
    if (adminLogoInput) {
        adminLogoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    // Redimensionner l'image pour optimiser l'affichage
                    const img = new Image();
                    img.onload = function () {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // Calculer les dimensions optimales (max 150x50 pour le header)
                        const maxWidth = 150;
                        const maxHeight = 50;
                        let { width, height } = img;

                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);

                        const optimizedDataUrl = canvas.toDataURL('image/png', 0.9);

                        siteData.settings.logo = optimizedDataUrl;
                        document.getElementById('adminLogoPreview').src = optimizedDataUrl;
                        document.getElementById('headerLogo').src = optimizedDataUrl;
                        document.getElementById('footerLogo').src = optimizedDataUrl;

                        if (forceSaveData()) {
                            showNotification('Logo mis à jour et optimisé', 'success');
                            logActivity(currentUser.username, 'Logo modifié');
                        } else {
                            showNotification('Échec de sauvegarde du logo', 'error');
                        }
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    /* FIX: Hero background upload using createObjectURL for videos to avoid heavy DataURL and multiple notifications */
    const heroBackgroundInput = document.getElementById('heroBackgroundInput');
    if (heroBackgroundInput) {
        heroBackgroundInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const heroBackground = document.getElementById('heroBackground');

                if (file.type.startsWith('video/')) {
                    // FIX: Upload to R2 for persistence
                    showNotification('Téléversement de la vidéo en cours...', 'info');

                    // Upload using firebaseHelper
                    const timestamp = Date.now();
                    const fileName = `hero_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
                    const path = `videos/${fileName}`;

                    window.firebaseHelper.uploadFile(path, file, (progress) => {
                        console.log(`Upload progress: ${progress}%`);
                    }).then(result => {
                        if (result.success) {
                            const r2Url = result.url;

                            siteData.heroBackground = {
                                type: 'video',
                                url: r2Url,
                                name: file.name,
                                isObjectURL: false
                            };

                            const heroVideo = document.getElementById('heroVideo');
                            const heroVideoSource = document.getElementById('heroVideoSource');
                            if (heroVideo && heroVideoSource) {
                                heroVideoSource.src = r2Url;
                                heroVideo.load();
                                heroVideo.style.display = 'block';
                                heroBackground.classList.add('has-video');
                                heroBackground.classList.remove('has-image');
                            }

                            // Save immediately to Firestore - save heroBackground to heroSettings
                            const heroSettings = {
                                titleGradient: siteData.titleGradient,
                                sloganGradient: siteData.sloganGradient,
                                descriptionGradient: siteData.descriptionGradient,
                                heroBackground: siteData.heroBackground,
                                heroSizes: siteData.heroSizes,
                                titleFormatting: siteData.titleFormatting,
                                subtitleFormatting: siteData.subtitleFormatting
                            };
                            saveAdminDataToFirestore('heroSettings', 'main', heroSettings, 'Hero Video Update')
                                .then(() => forceSaveData())
                                .then(() => {
                                    showNotification('Vidéo hero sauvegardée avec succès', 'success');
                                    logActivity(currentUser.username, 'Vidéo hero mise à jour (R2)');
                                });
                        } else {
                            showNotification('Erreur lors du téléversement: ' + result.error, 'error');
                        }
                    }).catch(err => {
                        console.error('Upload error:', err);
                        showNotification('Erreur critique lors du téléversement', 'error');
                    });

                } else if (file.type.startsWith('image/')) {
                    // FIX: Upload to R2 for persistence (like videos)
                    showNotification('Téléversement de l\'image en cours...', 'info');

                    // Optimize image before upload
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const img = new Image();
                        img.onload = function () {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');

                            // Redimensionner pour une largeur max de 1920px
                            const maxWidth = 1920;
                            let { width, height } = img;

                            if (width > maxWidth) {
                                height = (height * maxWidth) / width;
                                width = maxWidth;
                            }

                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);

                            // Convert canvas to blob for R2 upload
                            canvas.toBlob(function (blob) {
                                if (!blob) {
                                    showNotification('Erreur lors de l\'optimisation de l\'image', 'error');
                                    return;
                                }

                                // Upload using firebaseHelper
                                const timestamp = Date.now();
                                const fileName = `hero_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
                                const path = `images/${fileName}`;

                                window.firebaseHelper.uploadFile(path, blob, (progress) => {
                                    console.log(`Upload progress: ${progress}%`);
                                }).then(result => {
                                    if (result.success) {
                                        const r2Url = result.url;

                                        siteData.heroBackground = {
                                            type: 'image',
                                            url: r2Url,
                                            name: file.name,
                                            isObjectURL: false
                                        };

                                        heroBackground.style.backgroundImage = `url(${r2Url})`;
                                        heroBackground.classList.add('has-image');
                                        heroBackground.classList.remove('has-video');

                                        const heroVideo = document.getElementById('heroVideo');
                                        if (heroVideo) heroVideo.style.display = 'none';

                                        // Save immediately to Firestore - save heroBackground to heroSettings
                                        const heroSettings = {
                                            titleGradient: siteData.titleGradient,
                                            sloganGradient: siteData.sloganGradient,
                                            descriptionGradient: siteData.descriptionGradient,
                                            heroBackground: siteData.heroBackground,
                                            heroSizes: siteData.heroSizes,
                                            titleFormatting: siteData.titleFormatting,
                                            subtitleFormatting: siteData.subtitleFormatting
                                        };
                                        saveAdminDataToFirestore('heroSettings', 'main', heroSettings, 'Hero background image updated')
                                            .then(() => forceSaveData())
                                            .then(() => {
                                                showNotification(siteData.language === 'en' ? 'Hero background image saved successfully' : 'Image hero sauvegardée avec succès', 'success');
                                                logActivity(currentUser.username, 'Image hero mise à jour (R2)');
                                            });
                                    } else {
                                        showNotification('Erreur lors du téléversement: ' + result.error, 'error');
                                    }
                                }).catch(err => {
                                    console.error('Upload error:', err);
                                    showNotification('Erreur critique lors du téléversement', 'error');
                                });
                            }, 'image/jpeg', 0.8);
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
    }

    // Footer background upload avec redimensionnement - FIX: Upload to R2 and save to Firestore
    const footerBackgroundInput = document.getElementById('footerBackgroundInput');
    if (footerBackgroundInput) {
        footerBackgroundInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const footerBackground = document.getElementById('footerBackground');

                if (file.type.startsWith('video/')) {
                    // FIX: Upload to R2 for persistence
                    showNotification('Téléversement de la vidéo footer en cours...', 'info');

                    const timestamp = Date.now();
                    const fileName = `footer_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
                    const path = `videos/${fileName}`;

                    window.firebaseHelper.uploadFile(path, file, (progress) => {
                        console.log(`Upload progress: ${progress}%`);
                    }).then(async result => {
                        if (result.success) {
                            const r2Url = result.url;

                            siteData.footerBackground = {
                                type: 'video',
                                url: r2Url,
                                name: file.name,
                                isObjectURL: false
                            };

                            const footerVideo = document.getElementById('footerVideo');
                            const footerVideoSource = document.getElementById('footerVideoSource');
                            if (footerVideo && footerVideoSource) {
                                footerVideoSource.src = r2Url;
                                footerVideo.load();
                                footerVideo.style.display = 'block';
                                footerBackground.classList.add('has-video');
                                footerBackground.classList.remove('has-image');
                            }

                            // Save to Firestore
                            await saveAdminDataToFirestore('settings', 'main', siteData.settings, 'Footer background video updated')
                                .then(() => {
                                    // Also save footerBackground separately
                                    const footerData = { footerBackground: siteData.footerBackground };
                                    return saveAdminDataToFirestore('footerSettings', 'main', footerData, 'Footer background video');
                                })
                                .then(() => forceSaveData())
                                .then(() => {
                                    showNotification('Vidéo footer sauvegardée avec succès', 'success');
                                    logActivity(currentUser.username, 'Vidéo footer mise à jour (R2)');
                                });
                        } else {
                            showNotification('Erreur lors du téléversement: ' + result.error, 'error');
                        }
                    }).catch(err => {
                        console.error('Upload error:', err);
                        showNotification('Erreur critique lors du téléversement', 'error');
                    });
                } else if (file.type.startsWith('image/')) {
                    // FIX: Upload to R2 for persistence (like hero backgrounds)
                    showNotification('Téléversement de l\'image footer en cours...', 'info');

                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const img = new Image();
                        img.onload = function () {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');

                            const maxWidth = 1920;
                            let { width, height } = img;

                            if (width > maxWidth) {
                                height = (height * maxWidth) / width;
                                width = maxWidth;
                            }

                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);

                            // Convert canvas to blob for R2 upload
                            canvas.toBlob(function (blob) {
                                if (!blob) {
                                    showNotification('Erreur lors de l\'optimisation de l\'image', 'error');
                                    return;
                                }

                                // Upload using firebaseHelper
                                const timestamp = Date.now();
                                const fileName = `footer_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
                                const path = `images/${fileName}`;

                                window.firebaseHelper.uploadFile(path, blob, (progress) => {
                                    console.log(`Upload progress: ${progress}%`);
                                }).then(async result => {
                                    if (result.success) {
                                        const r2Url = result.url;

                                        siteData.footerBackground = {
                                            type: 'image',
                                            url: r2Url,
                                            name: file.name,
                                            isObjectURL: false
                                        };

                                        footerBackground.style.backgroundImage = `url(${r2Url})`;
                                        footerBackground.classList.add('has-image');
                                        footerBackground.classList.remove('has-video');

                                        const footerVideo = document.getElementById('footerVideo');
                                        if (footerVideo) footerVideo.style.display = 'none';

                                        // Save to Firestore
                                        await saveAdminDataToFirestore('settings', 'main', siteData.settings, 'Footer background image updated')
                                            .then(() => {
                                                // Also save footerBackground separately
                                                const footerData = { footerBackground: siteData.footerBackground };
                                                return saveAdminDataToFirestore('footerSettings', 'main', footerData, 'Footer background image');
                                            })
                                            .then(() => forceSaveData())
                                            .then(() => {
                                                showNotification('Image footer sauvegardée avec succès', 'success');
                                                logActivity(currentUser.username, 'Image footer mise à jour (R2)');
                                            });
                                    } else {
                                        showNotification('Erreur lors du téléversement: ' + result.error, 'error');
                                    }
                                }).catch(err => {
                                    console.error('Upload error:', err);
                                    showNotification('Erreur critique lors du téléversement', 'error');
                                });
                            }, 'image/jpeg', 0.8);
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
    }

    // Autres uploads (favicon, ISO, brochure, galerie)
    const adminFaviconInput = document.getElementById('adminFaviconInput');
    if (adminFaviconInput) {
        adminFaviconInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    // Créer une image pour redimensionner automatiquement
                    const img = new Image();
                    img.onload = function () {
                        // Créer un canvas pour redimensionner l'image
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // Définir la taille du favicon (32x32 ou 64x64 pour la qualité)
                        const size = 64;
                        canvas.width = size;
                        canvas.height = size;

                        // Dessiner l'image redimensionnée
                        ctx.drawImage(img, 0, 0, size, size);

                        // Convertir en base64
                        const resizedFavicon = canvas.toDataURL('image/png');

                        siteData.settings.favicon = resizedFavicon;

                        // Mettre à jour le favicon dans le DOM
                        const favicon = document.querySelector('link[rel="icon"]');
                        if (favicon) favicon.href = resizedFavicon;

                        const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
                        if (appleTouchIcon) appleTouchIcon.href = resizedFavicon;

                        if (saveSiteData()) {
                            showNotification(siteData.language === 'en' ? 'Favicon updated and resized automatically' : 'Favicon mis à jour et redimensionné automatiquement', 'success');
                            logActivity(currentUser.username, 'Favicon modifié et redimensionné');
                        }
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const adminIsoQrInput = document.getElementById('adminIsoQrInput');
    if (adminIsoQrInput) {
        adminIsoQrInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                // FIX: Upload to R2 for persistence
                showNotification('Téléversement du QR Code ISO en cours...', 'info');

                const timestamp = Date.now();
                const fileName = `iso_qr_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
                const path = `images/${fileName}`;

                window.firebaseHelper.uploadFile(path, file, (progress) => {
                    console.log(`Upload progress: ${progress}%`);
                }).then(async result => {
                    if (result.success) {
                        const r2Url = result.url;
                        siteData.isoQr = r2Url;

                        /* FIX: Update all ISO QR displays */
                        updateIsoImages();

                        // Save to Firestore
                        const isoData = {
                            isoQr: siteData.isoQr,
                            isoCert: siteData.isoCert,
                            brochure: siteData.brochure,
                            gallery: siteData.gallery
                        };
                        await saveAdminDataToFirestore('iso', 'main', isoData, 'ISO QR Code updated')
                            .then(() => forceSaveData())
                            .then(() => {
                                showNotification(siteData.language === 'en' ? 'ISO QR Code updated' : 'QR Code ISO mis à jour', 'success');
                                logActivity(currentUser.username, 'QR Code ISO modifié (R2)');
                            });
                    } else {
                        showNotification('Erreur lors du téléversement: ' + result.error, 'error');
                    }
                }).catch(err => {
                    console.error('Upload error:', err);
                    showNotification('Erreur critique lors du téléversement', 'error');
                });
            } else {
                showNotification('Veuillez sélectionner une image valide', 'error');
            }
        });
    }

    const adminIsoCertInput = document.getElementById('adminIsoCertInput');
    if (adminIsoCertInput) {
        adminIsoCertInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                // FIX: Upload to R2 for persistence
                showNotification('Téléversement du Certificat ISO en cours...', 'info');

                const timestamp = Date.now();
                const fileName = `iso_cert_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
                const path = `images/${fileName}`;

                window.firebaseHelper.uploadFile(path, file, (progress) => {
                    console.log(`Upload progress: ${progress}%`);
                }).then(async result => {
                    if (result.success) {
                        const r2Url = result.url;
                        siteData.isoCert = r2Url;

                        /* FIX: Update all ISO certificate displays */
                        updateIsoImages();

                        // Save to Firestore
                        const isoData = {
                            isoQr: siteData.isoQr,
                            isoCert: siteData.isoCert,
                            brochure: siteData.brochure,
                            gallery: siteData.gallery
                        };
                        await saveAdminDataToFirestore('iso', 'main', isoData, 'ISO Certificate updated')
                            .then(() => forceSaveData())
                            .then(() => {
                                // FIX: Update ISO images immediately after save
                                updateIsoImages();
                                showNotification(siteData.language === 'en' ? 'ISO Certificate updated' : 'Certificat ISO mis à jour', 'success');
                                logActivity(currentUser.username, 'Certificat ISO modifié (R2)');
                            });
                    } else {
                        showNotification('Erreur lors du téléversement: ' + result.error, 'error');
                    }
                }).catch(err => {
                    console.error('Upload error:', err);
                    showNotification('Erreur critique lors du téléversement', 'error');
                });
            } else {
                showNotification('Veuillez sélectionner une image valide', 'error');
            }
        });
    }

    const adminBrochureInput = document.getElementById('adminBrochureInput');
    if (adminBrochureInput) {
        adminBrochureInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                // FIX: Upload to R2 for persistence (like hero backgrounds and client logos)
                showNotification('Téléversement de la brochure en cours...', 'info');

                // Upload using firebaseHelper
                const timestamp = Date.now();
                const fileName = `brochure_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
                const path = `brochures/${fileName}`;

                window.firebaseHelper.uploadFile(path, file, (progress) => {
                    console.log(`Upload progress: ${progress}%`);
                }).then(async result => {
                    if (result.success) {
                        const r2Url = result.url;

                        siteData.brochure = {
                            name: file.name,
                            type: file.type,
                            url: r2Url,
                            uploadedAt: new Date().toISOString(),
                            isObjectURL: false
                        };

                        const brochureInfo = document.getElementById('adminBrochureInfo');
                        if (brochureInfo) {
                            brochureInfo.innerHTML = `<i class="fas fa-file-pdf"></i> ${file.name}`;
                        }

                        // Save to Firestore
                        const isoData = {
                            isoQr: siteData.isoQr,
                            isoCert: siteData.isoCert,
                            brochure: siteData.brochure,
                            gallery: siteData.gallery
                        };
                        await saveAdminDataToFirestore('iso', 'main', isoData, 'Brochure updated')
                            .then(() => forceSaveData())
                            .then(() => {
                                showNotification('Brochure mise à jour et sauvegardée', 'success');
                                logActivity(currentUser.username, 'Brochure mise à jour (R2)');
                            });
                    } else {
                        showNotification('Erreur lors du téléversement: ' + result.error, 'error');
                    }
                }).catch(err => {
                    console.error('Upload error:', err);
                    showNotification('Erreur critique lors du téléversement', 'error');
                });
            }
        });
    }

    const adminGalleryInput = document.getElementById('adminGalleryInput');
    if (adminGalleryInput) {
        adminGalleryInput.addEventListener('change', function (e) {
            const files = Array.from(e.target.files);
            if (!siteData.gallery) siteData.gallery = [];

            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        siteData.gallery.push({
                            id: Date.now() + Math.random(),
                            name: file.name,
                            url: e.target.result,
                            uploadedAt: new Date().toISOString()
                        });
                        saveSiteData();
                    };
                    reader.readAsDataURL(file);
                }
            });

            showNotification(`${files.length} image(s) ajoutée(s) à la galerie`, 'success');
            logActivity(currentUser.username, `${files.length} images ajoutées à la galerie`);
        });
    }

    // Restore backup
    const restoreInput = document.getElementById('restoreInput');
    if (restoreInput) {
        restoreInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file && file.type === 'application/json') {
                const reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        const backupData = JSON.parse(e.target.result);
                        siteData = { ...siteData, ...backupData };

                        if (saveSiteData()) {
                            showNotification('Sauvegarde restaurée avec succès', 'success');
                            logActivity(currentUser.username, 'Sauvegarde restaurée');
                            setTimeout(() => location.reload(), 1000);
                        }
                    } catch (error) {
                        showNotification('Erreur lors de la restauration', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    // Setup gradient color pickers
    ['titleGradientStart', 'titleGradientEnd', 'heroGradientStart', 'heroGradientEnd', 'footerGradientStart', 'footerGradientEnd'].forEach(id => {
        const picker = document.getElementById(id);
        if (picker) {
            picker.addEventListener('change', updateGradientPreviews);
        }
    });
}

// CRUD Functions OPÉRATIONNELLES
function openServiceModal() {
    currentEditingIndex = -1;
    currentEditingType = 'service';
    openModal('serviceModal');
}

function openClientModal() {
    currentEditingIndex = -1;
    currentEditingType = 'client';
    openModal('clientModal');
}

function openTestimonialModal() {
    currentEditingIndex = -1;
    currentEditingType = 'testimonial';
    openModal('testimonialModal');
}

function openJobModal() {
    currentEditingIndex = -1;
    currentEditingType = 'job';
    // Clear custom question fields for new job
    document.getElementById('jobCustomQuestion').value = '';
    document.getElementById('jobCustomQuestionEn').value = '';
    openModal('jobModal');
}

function openPageModal() {
    currentEditingIndex = -1;
    currentEditingType = 'page';
    openModal('pageModal');

    // Réinitialiser TinyMCE
    if (typeof tinymce !== 'undefined' && tinymce.get('pageContentTinyMCE')) {
        tinymce.get('pageContentTinyMCE').setContent('<h1>Nouvelle Page</h1><p>Contenu de votre nouvelle page...</p>');
    }
}

function openUserModal() {
    currentEditingIndex = -1;
    currentEditingType = 'user';
    openModal('userModal');
}

function updateRoleDescription() {
    const roleSelect = document.getElementById('userRole');
    const descriptionDiv = document.getElementById('roleDescription');

    if (roleSelect && descriptionDiv) {
        const selectedRole = roleSelect.value;
        if (selectedRole && roleDescriptions[siteData.language][selectedRole]) {
            descriptionDiv.innerHTML = `
                <i class="fas fa-info-circle" style="color: var(--primary); margin-right: 8px;"></i>
                <strong>Description du rôle:</strong><br>
                ${roleDescriptions[siteData.language][selectedRole]}
            `;
            descriptionDiv.style.display = 'block';
        } else {
            descriptionDiv.style.display = 'none';
        }
    }
}

function editService(index) {
    const service = siteData.services[index];
    currentEditingIndex = index;
    currentEditingType = 'service';
    document.getElementById('serviceTitle').value = service.title.fr;
    document.getElementById('serviceTitleEn').value = service.title.en || '';
    document.getElementById('serviceIcon').value = service.icon;
    document.getElementById('serviceDescription').value = service.description.fr;
    document.getElementById('serviceDescriptionEn').value = service.description.en || '';
    openModal('serviceModal');
}

async function toggleService(index) {
    siteData.services[index].active = !siteData.services[index].active;
    const service = siteData.services[index];
    
    // Save to Firestore immediately
    await saveAdminDataToFirestore('services', service.id.toString(), service, `Service ${service.active ? 'activated' : 'deactivated'}: ${service.title.fr}`)
        .then(() => forceSaveData())
        .then(() => {
            renderAdminServices();
            showNotification('Service mis à jour', 'success');
            logActivity(currentUser.username, `Service ${service.active ? 'activé' : 'désactivé'}: ${service.title.fr}`);
        })
        .catch(err => {
            console.error('Error updating service:', err);
            showNotification('Erreur lors de la mise à jour', 'error');
        });
}

async function deleteService(index) {
    if (confirm('Supprimer ce service? Cette action est irréversible.')) {
        const service = siteData.services[index];
        const serviceId = service.id.toString();
        
        // Delete from Firestore first
        if (typeof window.firebaseHelper !== 'undefined' && APP_MODE === 'FIREBASE') {
            try {
                await window.firebaseHelper.deleteDocument('services', serviceId);
                console.log(`✅ Service deleted from Firestore: ${serviceId}`);
            } catch (err) {
                console.error('Error deleting service from Firestore:', err);
            }
        }
        
        // Remove from local array
        siteData.services.splice(index, 1);
        
        // Save to Firestore (update main siteData)
        if (forceSaveData()) {
            renderAdminServices();
            showNotification('Service supprimé', 'success');
            logActivity(currentUser.username, `Service supprimé: ${service.title.fr}`);
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}

/* ADD: service-admin-ui - Fonctions de configuration des services (activation/ordre) */
/* NOTE: L'état des services est stocké dans siteData.services
 * Chaque service a une propriété 'active' (boolean) qui contrôle sa visibilité
 * L'ordre dans le tableau siteData.services détermine l'ordre d'affichage public
 * Pour déboguer: console.log(siteData.services) */

function renderServicesConfiguration() {
    const container = document.getElementById('servicesConfigList');
    if (!container) return;

    container.innerHTML = '';

    siteData.services.forEach((service, index) => {
        const item = document.createElement('div');
        item.className = 'service-config-item';
        item.dataset.index = index;
        item.draggable = true;

        item.innerHTML = `
            <div class="service-config-info">
                <div class="service-config-icon">${service.icon}</div>
                <div class="service-config-details">
                    <div class="service-config-title">${service.title.fr}</div>
                    <div class="service-config-id">ID: ${service.id}</div>
                </div>
            </div>
            <div class="service-config-controls">
                <label class="service-config-toggle">
                    <input type="checkbox" ${service.active ? 'checked' : ''} onchange="toggleServiceConfig(${index})">
                    <span class="service-config-slider"></span>
                </label>
                <div class="service-config-order-btns">
                    <button class="service-config-order-btn" onclick="moveServiceUp(${index})" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <button class="service-config-order-btn" onclick="moveServiceDown(${index})" ${index === siteData.services.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="service-config-drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
            </div>
        `;

        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);

        container.appendChild(item);
    });
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';

    const afterElement = getDragAfterElement(this.parentElement, e.clientY);
    if (afterElement == null) {
        this.parentElement.appendChild(draggedItem);
    } else {
        this.parentElement.insertBefore(draggedItem, afterElement);
    }

    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedItem !== this) {
        const container = this.parentElement;
        const allItems = Array.from(container.children);
        const draggedIndex = parseInt(draggedItem.dataset.index);
        const targetIndex = parseInt(this.dataset.index);

        const movedService = siteData.services.splice(draggedIndex, 1)[0];
        siteData.services.splice(targetIndex, 0, movedService);

        renderServicesConfiguration();
    }

    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedItem = null;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.service-config-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function toggleServiceConfig(index) {
    siteData.services[index].active = !siteData.services[index].active;
    
    // Save to Firestore
    const service = siteData.services[index];
    await saveAdminDataToFirestore('services', service.id || `service_${index}`, service, `Service ${service.active ? 'activated' : 'deactivated'}`);
    
    if (forceSaveData()) {
        renderServicesConfiguration();
        showNotification(`Service ${service.active ? 'activé' : 'désactivé'}`, 'success');
        logActivity(currentUser.username, `Service ${service.active ? 'activé' : 'désactivé'}: ${service.title?.fr || service.title}`);
    }
}

function moveServiceUp(index) {
    if (index > 0) {
        const temp = siteData.services[index];
        siteData.services[index] = siteData.services[index - 1];
        siteData.services[index - 1] = temp;
        renderServicesConfiguration();
    }
}

function moveServiceDown(index) {
    if (index < siteData.services.length - 1) {
        const temp = siteData.services[index];
        siteData.services[index] = siteData.services[index + 1];
        siteData.services[index + 1] = temp;
        renderServicesConfiguration();
    }
}
function saveServicesConfiguration() {
    if (saveSiteData()) {
        renderAdminServices();
        renderServices();
        showNotification(
            siteData.language === 'en' ?
                'Services configuration saved successfully!' :
                'Configuration des services sauvegardée avec succès!',
            'success'
        );
        logActivity(currentUser.username, 'Configuration des services mise à jour');
    } else {
        showNotification(
            siteData.language === 'en' ?
                'Error saving configuration' :
                'Erreur lors de la sauvegarde',
            'error'
        );
    }
}

function editClient(index) {
    const client = siteData.clients[index];
    currentEditingIndex = index;
    currentEditingType = 'client';
    document.getElementById('clientName').value = client.name;
    openModal('clientModal');
}

async function toggleClient(index) {
    siteData.clients[index].active = !siteData.clients[index].active;
    const client = siteData.clients[index];
    
    // Save to Firestore immediately
    await saveAdminDataToFirestore('clients', client.id.toString(), client, `Client ${client.active ? 'activated' : 'deactivated'}: ${client.name}`)
        .then(() => forceSaveData())
        .then(() => {
            renderAdminClients();
            showNotification('Client mis à jour', 'success');
            logActivity(currentUser.username, `Client ${client.active ? 'activé' : 'désactivé'}: ${client.name}`);
        })
        .catch(err => {
            console.error('Error updating client:', err);
            showNotification('Erreur lors de la mise à jour', 'error');
        });
}

async function deleteClient(index) {
    if (confirm('Supprimer ce client? Cette action est irréversible.')) {
        const client = siteData.clients[index];
        const clientId = client.id.toString();
        
        // Delete from Firestore first
        if (typeof window.firebaseHelper !== 'undefined' && APP_MODE === 'FIREBASE') {
            try {
                await window.firebaseHelper.deleteDocument('clients', clientId);
                console.log(`✅ Client deleted from Firestore: ${clientId}`);
            } catch (err) {
                console.error('Error deleting client from Firestore:', err);
                // Continue with local deletion even if Firestore delete fails
            }
        }
        
        // Remove from local array
        siteData.clients.splice(index, 1);
        
        // Save to Firestore (update main siteData)
        if (forceSaveData()) {
            renderAdminClients();
            showNotification('Client supprimé', 'success');
            logActivity(currentUser.username, `Client supprimé: ${client.name}`);
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}

function editTestimonial(index) {
    const testimonial = siteData.testimonials[index];
    currentEditingIndex = index;
    currentEditingType = 'testimonial';
    document.getElementById('testimonialName').value = testimonial.name;
    document.getElementById('testimonialPosition').value = testimonial.position.fr;
    document.getElementById('testimonialPositionEn').value = testimonial.position.en || '';
    document.getElementById('testimonialText').value = testimonial.text.fr;
    document.getElementById('testimonialTextEn').value = testimonial.text.en || '';
    document.getElementById('testimonialRating').value = testimonial.rating;
    openModal('testimonialModal');
}

async function toggleTestimonial(index) {
    siteData.testimonials[index].active = !siteData.testimonials[index].active;
    const testimonial = siteData.testimonials[index];
    
    // Save to Firestore immediately
    await saveAdminDataToFirestore('testimonials', testimonial.id.toString(), testimonial, `Testimonial ${testimonial.active ? 'activated' : 'deactivated'}: ${testimonial.name}`)
        .then(() => forceSaveData())
        .then(() => {
            renderAdminTestimonials();
            showNotification('Témoignage mis à jour', 'success');
            logActivity(currentUser.username, `Témoignage ${testimonial.active ? 'activé' : 'désactivé'}: ${testimonial.name}`);

            // Redémarrer le carrousel automatique
            if (currentPage === 'home') {
                executeHomeScript();
            }
        })
        .catch(err => {
            console.error('Error updating testimonial:', err);
            showNotification('Erreur lors de la mise à jour', 'error');
        });
}

async function deleteTestimonial(index) {
    if (confirm('Supprimer ce témoignage? Cette action est irréversible.')) {
        const testimonial = siteData.testimonials[index];
        const testimonialId = testimonial.id.toString();
        siteData.testimonials.splice(index, 1);

        // Delete from Firestore
        if (typeof APP_MODE !== 'undefined' && APP_MODE === 'FIREBASE' && typeof window.firebaseHelper !== 'undefined') {
            try {
                await window.firebaseHelper.deleteDocument('testimonials', testimonialId);
                console.log(`✅ [ADMIN FIREBASE DELETE] Deleted testimonial ${testimonialId}`);
            } catch (error) {
                console.error(`❌ [ADMIN FIREBASE DELETE] Error deleting testimonial ${testimonialId}:`, error);
            }
        }

        if (saveSiteData()) {
            renderAdminTestimonials();
            showNotification('Témoignage supprimé', 'success');
            logActivity(currentUser.username, `Témoignage supprimé: ${testimonial.name}`);

            // Redémarrer le carrousel automatique
            if (currentPage === 'home') {
                executeHomeScript();
            }
        }
    }
}

function editJob(index) {
    const job = siteData.jobs[index];
    currentEditingIndex = index;
    currentEditingType = 'job';
    document.getElementById('jobTitle').value = job.title.fr;
    document.getElementById('jobTitleEn').value = job.title.en || '';
    document.getElementById('jobType').value = job.type;
    document.getElementById('jobLocation').value = job.location;
    document.getElementById('jobDescription').value = job.description.fr;
    document.getElementById('jobDescriptionEn').value = job.description.en || '';
    document.getElementById('jobRequirements').value = job.requirements.fr;
    document.getElementById('jobRequirementsEn').value = job.requirements.en || '';
    // Load custom question if exists
    document.getElementById('jobCustomQuestion').value = job.customQuestion ? job.customQuestion.fr : '';
    document.getElementById('jobCustomQuestionEn').value = job.customQuestion ? job.customQuestion.en : '';
    openModal('jobModal');
}

async function toggleJob(index) {
    siteData.jobs[index].active = !siteData.jobs[index].active;
    const job = siteData.jobs[index];
    
    // Save to Firestore immediately
    await saveAdminDataToFirestore('jobs', job.id.toString(), job, `Job ${job.active ? 'activated' : 'deactivated'}: ${job.title.fr}`)
        .then(() => forceSaveData())
        .then(() => {
            renderAdminJobs();
            showNotification('Offre mise à jour', 'success');
            logActivity(currentUser.username, `Offre ${job.active ? 'activée' : 'désactivée'}: ${job.title.fr}`);
        })
        .catch(err => {
            console.error('Error updating job:', err);
            showNotification('Erreur lors de la mise à jour', 'error');
        });
}

async function deleteJob(index) {
    if (confirm('Supprimer cette offre? Cette action est irréversible.')) {
        const job = siteData.jobs[index];
        const jobId = job.id.toString();
        
        // Delete from Firestore first
        if (typeof window.firebaseHelper !== 'undefined' && APP_MODE === 'FIREBASE') {
            try {
                await window.firebaseHelper.deleteDocument('jobs', jobId);
                console.log(`✅ Job deleted from Firestore: ${jobId}`);
            } catch (err) {
                console.error('Error deleting job from Firestore:', err);
            }
        }
        
        // Remove from local array
        siteData.jobs.splice(index, 1);
        
        // Save to Firestore (update main siteData)
        if (forceSaveData()) {
            renderAdminJobs();
            showNotification('Offre supprimée', 'success');
            logActivity(currentUser.username, `Offre supprimée: ${job.title.fr}`);
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}

function editUser(index) {
    const user = siteData.users[index];
    currentEditingIndex = index;
    currentEditingType = 'user';
    document.getElementById('userName').value = user.username || '';
    document.getElementById('userEmail').value = user.email || '';

    // Map role back for form display: recruteur -> recruiter, lecteur -> reader
    const roleMap = {
        'recruteur': 'recruiter',
        'lecteur': 'reader',
        'admin': 'admin',
        'editor': 'editor'
    };
    const formRole = roleMap[user.role] || user.role || '';
    document.getElementById('userRole').value = formRole;

    document.getElementById('userPassword').value = ''; // Ne pas pré-remplir le mot de passe
    document.getElementById('userPassword').required = false; // Make password optional when editing

    // Update submit button text
    const submitBtn = document.querySelector('#userForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = siteData.language === 'en' ? 'Update User' : 'Modifier l\'utilisateur';
    }

    updateRoleDescription();
    openModal('userModal');
}

function toggleUser(index) {
    siteData.users[index].active = !siteData.users[index].active;
    if (saveSiteData()) {
        renderAdminUsers();
        showNotification('Utilisateur mis à jour', 'success');
        logActivity(currentUser.username, `Utilisateur ${siteData.users[index].active ? 'activé' : 'désactivé'}: ${siteData.users[index].username}`);
    }
}
function resetUserPassword(index) {
    const newPassword = Math.random().toString(36).slice(-8);
    siteData.users[index].password = newPassword;
    if (saveSiteData()) {
        showNotification(`Nouveau mot de passe pour ${siteData.users[index].username}: ${newPassword}`, 'info', 10000);
        logActivity(currentUser.username, `Mot de passe réinitialisé pour ${siteData.users[index].username}`);
    }
}

function deleteUser(index) {
    if (confirm('Supprimer cet utilisateur? Cette action est irréversible.')) {
        const user = siteData.users[index];
        siteData.users.splice(index, 1);
        if (saveSiteData()) {
            renderAdminUsers();
            showNotification('Utilisateur supprimé', 'success');
            logActivity(currentUser.username, `Utilisateur supprimé: ${user.username}`);
        }
    }
}

function editPage(index) {
    const page = siteData.customPages[index];
    currentEditingIndex = index;
    currentEditingType = 'page';
    document.getElementById('pageTitle').value = page.title;
    document.getElementById('pageSlug').value = page.slug;
    document.getElementById('pageLocation').value = page.location || 'main';

    // Charger le contenu dans TinyMCE
    if (typeof tinymce !== 'undefined' && tinymce.get('pageContentTinyMCE')) {
        tinymce.get('pageContentTinyMCE').setContent(page.content);
    }

    openModal('pageModal');
}

function viewPage(index) {
    const page = siteData.customPages[index];
    showNotification(`Affichage de la page: ${page.title}`, 'info');
    // Ici on pourrait ouvrir la page dans un nouvel onglet
}

function duplicatePage(index) {
    const page = siteData.customPages[index];
    const duplicatedPage = {
        ...page,
        id: Date.now(),
        title: `${page.title} (Copie)`,
        slug: `${page.slug}-copy`,
        createdAt: new Date().toISOString(),
        author: currentUser.username
    };

    siteData.customPages.push(duplicatedPage);
    if (saveSiteData()) {
        renderAdminPages();
        showNotification('Page dupliquée avec succès', 'success');
        logActivity(currentUser.username, `Page dupliquée: ${page.title}`);
    }
}

async function deletePage(index) {
    if (confirm('Supprimer cette page? Cette action est irréversible.')) {
        const page = siteData.customPages[index];
        const pageId = page.id.toString();
        siteData.customPages.splice(index, 1);

        // Delete from Firestore
        if (typeof APP_MODE !== 'undefined' && APP_MODE === 'FIREBASE' && typeof window.firebaseHelper !== 'undefined') {
            try {
                await window.firebaseHelper.deleteDocument('customPages', pageId);
                console.log(`✅ [ADMIN FIREBASE DELETE] Deleted page ${pageId}`);
            } catch (error) {
                console.error(`❌ [ADMIN FIREBASE DELETE] Error deleting page ${pageId}:`, error);
            }
        }

        if (saveSiteData()) {
            renderAdminPages();
            showNotification('Page supprimée', 'success');
            logActivity(currentUser.username, `Page supprimée: ${page.title}`);
        }
    }
}

function printCV(cvId) {
    const cv = siteData.cvDatabase.find(c => c.id === cvId);
    if (!cv) return;

    // Prioritize R2 URL now that bucket is public
    const fileContent = cv.cvR2Url || cv.cvUrl || cv.applicantCV?.content;
    if (!fileContent) {
        showNotification('Impossible d\'imprimer : fichier non trouvé', 'error');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head><title>Imprimer CV - ${cv.applicantName}</title></head>
            <body style="margin:0; padding:0; overflow:hidden;">
                <iframe src="${fileContent}" style="width:100vw; height:100vh; border:none;" onload="setTimeout(() => { window.print(); }, 1000);"></iframe>
            </body>
        </html>
    `);
    printWindow.document.close();
}

function previewCV(cvId) {
    console.log('🔍 [previewCV] Requested CV ID:', cvId);

    // Debug current database
    if (siteData.cvDatabase && siteData.cvDatabase.length > 0) {
        console.log('🔍 [previewCV] Database sample (first 2):', siteData.cvDatabase.slice(0, 2).map(c => ({ id: c.id, name: c.applicantName, r2: c.cvR2Url, url: c.cvUrl })));
    } else {
        console.warn('⚠️ [previewCV] Database is empty!');
    }

    const cv = siteData.cvDatabase.find(c => c.id == cvId);
    if (!cv) {
        console.error('❌ [previewCV] CV not found for ID:', cvId);
        showNotification('CV non trouvé', 'error');
        return;
    }

    console.log('✅ [previewCV] Found CV:', cv.applicantName, cv.id);

    // Priorité: URL R2 > cvUrl > applicantCV content (R2 is now public)
    const cvUrl = cv.cvR2Url || cv.cvUrl || null;
    console.log('🔗 [previewCV] Using URL:', cvUrl);

    // Force-Fix: Ensure we are using the CORRECT public R2 domain provided by USER
    // User verified: https://pub-f4fd5f0dedd24600b104dee9aec15539.r2.dev
    const PUBLIC_R2_DOMAIN = 'https://pub-f4fd5f0dedd24600b104dee9aec15539.r2.dev';

    // Helper to fix URL
    const fixR2Url = (url) => {
        if (!url || typeof url !== 'string') return url;

        // If it's not an R2 URL, return as is (unless we want to force all CVs to R2?)
        if (!url.includes('r2.dev') && !url.includes('workers.dev')) return url;

        try {
            const urlObj = new URL(url);

            // 1. Force correct Domain
            let newUrl = PUBLIC_R2_DOMAIN;

            // 2. Clean Path: Remove bucket name if present (R2 public bucket URLs don't need bucket name in path)
            let cleanPath = urlObj.pathname;
            if (cleanPath.startsWith('/ae2i-cvs-algerie')) {
                cleanPath = cleanPath.replace('/ae2i-cvs-algerie', '');
            }

            // Ensure path starts with /
            if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

            newUrl += cleanPath;

            if (newUrl !== url) {
                console.warn(`⚠️ [previewCV] Fixed URL: ${url} -> ${newUrl}`);
            }
            return newUrl;
        } catch (e) { console.error('Error parsing URL:', e); }
        return url;
    };



    let finalCvUrl = fixR2Url(cvUrl);

    // Also fix applicantCV.content if it's an R2 URL
    let cvContent = finalCvUrl || fixR2Url(cv.applicantCV?.content);

    console.log('✅ [previewCV] Final Content URL:', cvContent);
    const cvFileName = cv.cvFileName || cv.applicantCV?.name || 'CV.pdf';
    const cvFileSize = cv.cvFileSize || cv.applicantCV?.size || 0;

    let cvPreviewSection = '';

    if (cvContent) {
        cvPreviewSection = `
            <div style="margin-top: 24px;">
                <h4 style="color: var(--primary); font-weight: 700; margin-bottom: 16px;">
                    <i class="fas fa-file-pdf"></i> CV: ${cvFileName}
                    ${cvFileSize ? `<span style="font-size: var(--font-size-sm); color: var(--text-light); font-weight: normal;">(${(cvFileSize / 1024).toFixed(1)} KB)</span>` : ''}
                </h4>
                <div style="background: var(--bg-alt); padding: 16px; border-radius: var(--border-radius-lg); margin-top: 12px; border: 2px solid var(--border);">
                    <div style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                        <button class="btn btn-sm btn-primary functional-btn" onclick="openCVViewer('${cvContent}', '${cv.applicantName.replace(/'/g, "\\'")}')">
                            <i class="fas fa-expand"></i> Ouvrir en plein écran
                        </button>
                        <button class="btn btn-sm btn-success functional-btn" onclick="downloadCV(${cv.id})">
                            <i class="fas fa-download"></i> Télécharger
                        </button>
                        <button class="btn btn-sm btn-accent functional-btn" onclick="printCV(${cv.id})">
                            <i class="fas fa-print"></i> Imprimer
                        </button>
                         <a href="${cvContent}" target="_blank" class="btn btn-sm btn-outline functional-btn">
                            <i class="fas fa-external-link-alt"></i> Lien Direct
                        </a>
                    </div>
                    <iframe src="${cvContent}" style="width: 100%; height: 600px; border: 1px solid var(--border); border-radius: var(--border-radius);" onerror="console.error('Iframe error loading:', '${cvContent}')"></iframe>
                </div>
            </div>
        `;
    } else {
        cvPreviewSection = `
            <div style="margin-top: 24px;">
                <h4 style="color: var(--primary); font-weight: 700; margin-bottom: 16px;">CV:</h4>
                <div style="background: var(--bg-alt); padding: 24px; border-radius: var(--border-radius-lg); margin-top: 12px; text-align: center; border: 3px dashed var(--border);">
                    <i class="fas fa-file-pdf" style="font-size: 60px; color: var(--danger); margin-bottom: 12px;"></i>
                    <p style="font-weight: 600; margin-bottom: 8px;">CV non disponible</p>
                </div>
            </div>
        `;
    }

    document.getElementById('cvPreviewContent').innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
            <div>
            <h3 style="color: var(--primary); font-weight: 800; margin-bottom: 20px; font-size: var(--font-size-2xl);">${cv.applicantName || (cv.applicantFirstName + ' ' + cv.applicantLastName) || 'Candidat'}</h3>
            <p><strong>Email:</strong> ${cv.applicantEmail || cv.email || 'Non renseigné'}</p>
            <p><strong>Téléphone:</strong> ${cv.applicantPhone || cv.phone || 'Non renseigné'}</p>
                ${cv.applicantPosition ? `<p><strong>Poste actuel:</strong> ${cv.applicantPosition}</p>` : ''}
                ${cv.expectedSalary ? `<p><strong>Salaire souhaité:</strong> ${cv.expectedSalary} DA</p>` : ''}
            </div>
            <div>
                <p><strong>Poste:</strong> <span style="color: var(--primary); font-weight: 600;">${cv.jobTitle}</span></p>
            <p><strong>Date:</strong> ${new Date(cv.appliedAt || cv.submittedAt).toLocaleDateString()}</p>
                <p><strong>Statut:</strong> <span class="status-badge ${cv.processed ? 'status-processed' : 'status-pending'}">${cv.processed ? 'Traité' : 'En attente'}</span></p>
                ${cv.processedBy ? `<p><strong>Traité par:</strong> ${cv.processedBy}</p>` : ''}
                ${cv.currentlyEmployed ? `<p><strong>En poste:</strong> ${cv.currentlyEmployed === 'yes' ? 'Oui' : 'Non'}</p>` : ''}
                ${cv.lastJobDate ? `<p><strong>Dernier poste:</strong> ${cv.lastJobDate}</p>` : ''}
                ${cv.lastContractType ? `<p><strong>Type contrat:</strong> ${cv.lastContractType}</p>` : ''}
            </div>
        </div>
        ${cvPreviewSection}
    `;
    openModal('cvPreviewModal');
}

function contactApplicant(email) {
    window.location.href = `mailto:${email}?subject=Votre candidature chez AE2I Algérie`;
    logActivity(currentUser.username, `Contact candidat: ${email}`);
}

async function markAsProcessed(cvId) {
    console.log('✅ [MARK PROCESSED] Starting, received ID:', cvId, 'Type:', typeof cvId);
    
    // Try to find by id (number or string match) or firebaseId
    let cv = siteData.cvDatabase.find(c => 
        c.id === cvId || 
        c.id == cvId || 
        String(c.id) === String(cvId) ||
        c.firebaseId === cvId ||
        String(c.firebaseId) === String(cvId)
    );

    // If not found, try to find by applicantEmail as fallback
    if (!cv && typeof cvId === 'string') {
        cv = siteData.cvDatabase.find(c => c.applicantEmail === cvId);
    }

    if (!cv) {
        showNotification('Candidature non trouvée', 'error');
        console.error('❌ [MARK PROCESSED] CV not found, ID:', cvId);
        return;
    }

    console.log('✅ [MARK PROCESSED] Found CV:', {
        id: cv.id,
        firebaseId: cv.firebaseId,
        name: cv.applicantName
    });

    const cvName = cv.applicantName || 'Candidat';
    
    // Update local data
    cv.processed = true;
    cv.processedAt = new Date().toISOString();
    cv.processedBy = currentUser.username;

    // Update Firebase if in Firebase mode
    if (APP_MODE === 'FIREBASE' && window.firebaseHelper && cv.firebaseId) {
        try {
            const firebaseIdString = String(cv.firebaseId);
            console.log('🔥 [MARK PROCESSED] Updating Firebase document:', firebaseIdString);
            
            const updateData = {
                processed: true,
                processedAt: new Date().toISOString(),
                processedBy: currentUser.username
            };
            
            const result = await window.firebaseHelper.updateDocument('cvDatabase', firebaseIdString, updateData);
            
            if (result.success) {
                console.log('✅ [MARK PROCESSED] Updated Firebase successfully');
                // The listener will automatically update siteData.cvDatabase and trigger re-render
                showNotification('Candidature marquée comme traitée', 'success');
                logActivity(currentUser.username, `Candidature traitée: ${cvName}`);
                // Force re-render to update UI
                if (typeof renderAdminCvDatabase === 'function') renderAdminCvDatabase();
                if (typeof renderRecruteurApplications === 'function') renderRecruteurApplications();
                if (typeof renderLecteurCvDatabase === 'function') renderLecteurCvDatabase();
                if (typeof populateCVJobFilter === 'function') populateCVJobFilter();
                return;
            } else {
                console.error('❌ [MARK PROCESSED] Firebase update failed:', result.error);
                showNotification(`Erreur lors de la mise à jour: ${result.error}`, 'error');
                // Revert local change
                cv.processed = false;
                delete cv.processedAt;
                delete cv.processedBy;
                return;
            }
        } catch (error) {
            console.error('❌ [MARK PROCESSED] Firebase update error:', error);
            showNotification(`Erreur lors de la mise à jour: ${error.message}`, 'error');
            // Revert local change
            cv.processed = false;
            delete cv.processedAt;
            delete cv.processedBy;
            return;
        }
    }

    // Only save locally if NOT in Firebase mode (localStorage mode)
    if (saveSiteData()) {
        renderAdminCvDatabase();
        if (typeof renderRecruteurApplications === 'function') renderRecruteurApplications();
        if (typeof renderLecteurCvDatabase === 'function') renderLecteurCvDatabase();
        if (typeof populateCVJobFilter === 'function') populateCVJobFilter();
        showNotification('Candidature marquée comme traitée', 'success');
        logActivity(currentUser.username, `Candidature traitée: ${cvName}`);
    }
}

function downloadCV(cvId) {
    // Try to find by id (number or string match)
    let cv = siteData.cvDatabase.find(c => c.id === cvId || c.id == cvId || String(c.id) === String(cvId));

    // If not found, try to find by applicantEmail as fallback
    if (!cv && typeof cvId === 'string') {
        cv = siteData.cvDatabase.find(c => c.applicantEmail === cvId);
    }

    if (!cv) {
        showNotification('CV non trouvé', 'error');
        return;
    }

    // Priorité: URL R2 > cvUrl > applicantCV content (R2 is now public)
    const cvUrl = cv.cvR2Url || cv.cvUrl || null;

    if (cvUrl) {
        // Télécharger depuis R2 ou URL directe
        const link = document.createElement('a');
        link.href = cvUrl;
        link.download = cv.cvFileName || cv.applicantCV?.name || `${cv.applicantName}_CV.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification(`Téléchargement du CV de ${cv.applicantName}`, 'success');
        logActivity(currentUser.username, `CV téléchargé: ${cv.applicantName}`);
    } else if (cv.applicantCV && cv.applicantCV.content) {
        // Fallback: télécharger depuis base64
        const link = document.createElement('a');
        link.href = cv.applicantCV.content;
        link.download = cv.cvFileName || cv.applicantCV?.name || `${cv.applicantName}_CV.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification(`Téléchargement du CV de ${cv.applicantName}`, 'success');
        logActivity(currentUser.username, `CV téléchargé: ${cv.applicantName}`);
    } else {
        showNotification('CV non disponible', 'warning');
    }
}

async function deleteApplication(cvId) {
    if (!confirm('Supprimer cette candidature? Cette action est irréversible.')) {
        return;
    }

    console.log('🗑️ [DELETE] Starting deletion, received ID:', cvId, 'Type:', typeof cvId);
    console.log('🗑️ [DELETE] Current cvDatabase count:', siteData.cvDatabase?.length || 0);
    console.log('🗑️ [DELETE] Sample IDs in database:', siteData.cvDatabase?.slice(0, 3).map(c => ({ id: c.id, firebaseId: c.firebaseId })) || []);

    // Try to find by id (number or string match) or firebaseId
    let cv = siteData.cvDatabase.find(c => 
        c.id === cvId || 
        c.id == cvId || 
        String(c.id) === String(cvId) ||
        c.firebaseId === cvId ||
        String(c.firebaseId) === String(cvId)
    );

    // If not found, try to find by applicantEmail as fallback
    if (!cv && typeof cvId === 'string') {
        cv = siteData.cvDatabase.find(c => c.applicantEmail === cvId);
    }

    if (!cv) {
        showNotification('Candidature non trouvée', 'error');
        console.error('❌ [DELETE] CV not found, ID:', cvId);
        console.error('❌ [DELETE] Available IDs:', siteData.cvDatabase?.map(c => ({ id: c.id, firebaseId: c.firebaseId, email: c.applicantEmail })) || []);
        return;
    }

    console.log('✅ [DELETE] Found CV:', {
        id: cv.id,
        firebaseId: cv.firebaseId,
        name: cv.applicantName,
        email: cv.applicantEmail
    });

    const cvName = cv.applicantName || 'Candidat';
    
    // After the listener normalization fix, both cv.id and cv.firebaseId should ALWAYS be the Firebase document ID
    // The listener in firebase.js now ensures: { ...docData, id: doc.id }
    // And the normalizer ensures: d.firebaseId = firebaseDocId and d.id = firebaseDocId
    // So we can safely use either cv.id or cv.firebaseId - they should be the same
    
    // Use firebaseId if available, otherwise use id
    // Both should be the Firebase document ID after listener normalization
    const firebaseId = cv.firebaseId || cv.id;
    
    if (!firebaseId) {
        console.error('❌ [DELETE] No Firebase ID found!');
        console.error('❌ [DELETE] CV data:', {
            id: cv.id,
            firebaseId: cv.firebaseId,
            email: cv.applicantEmail,
            name: cv.applicantName
        });
        showNotification('Erreur: ID de candidature introuvable', 'error');
        return;
    }
    
    // Convert to string - Firebase requires string IDs
    const firebaseIdString = String(firebaseId);
    console.log('🗑️ [DELETE] Using Firebase ID:', firebaseIdString);
    
    // Log warning if ID looks like a timestamp (shouldn't happen after listener fix)
    if (/^\d{10,}$/.test(firebaseIdString)) {
        console.warn('⚠️ [DELETE] WARNING: Firebase ID looks like a timestamp:', firebaseIdString);
        console.warn('⚠️ [DELETE] This should not happen after listener normalization fix');
        console.warn('⚠️ [DELETE] The document may not exist in Firebase with this ID');
        console.warn('💡 [DELETE] Try reloading the page to sync with Firebase');
    }

    // Delete from Firebase if in Firebase mode
    if (APP_MODE === 'FIREBASE' && window.firebaseHelper && firebaseIdString) {
        try {
            console.log('🗑️ [DELETE] Attempting Firebase delete, collection: cvDatabase, documentId:', firebaseIdString);
            console.log('🗑️ [DELETE] Current user:', currentUser?.username, 'Role:', currentUser?.role);
            
            // Check Firebase Auth authentication
            const authUser = window.firebaseServices?.auth?.currentUser;
            if (!authUser) {
                console.error('❌ [DELETE] Not authenticated with Firebase Auth!');
                console.error('❌ [DELETE] You must log in through Firebase Auth to delete candidatures.');
                showNotification('Erreur: Vous devez être connecté avec Firebase Auth pour supprimer. Utilisez le bouton de connexion.', 'error');
                return;
            }
            
            console.log('✅ [DELETE] Firebase Auth user:', authUser.email, 'UID:', authUser.uid);
            
            // Check if user has the right role in Firestore
            // We'll try to delete directly - if permissions fail, we'll get a clear error
            
            // Perform deletion directly (skip verification to avoid permission issues)
            console.log('🗑️ [DELETE] Attempting to delete document:', firebaseIdString);
            const result = await window.firebaseHelper.deleteDocument('cvDatabase', firebaseIdString);
            console.log('🗑️ [DELETE] Firebase delete result:', result);
            
            if (result.success) {
                console.log('✅ [DELETE] Deleted from Firebase successfully');
                
                // Remove from local array immediately for better UX
                const cvIndex = siteData.cvDatabase.findIndex(c =>
                    c.id === cv.id || 
                    c.firebaseId === cv.firebaseId ||
                    String(c.firebaseId) === String(firebaseIdString) ||
                    String(c.id) === String(cvId)
                );
                if (cvIndex >= 0) {
                    siteData.cvDatabase.splice(cvIndex, 1);
                    console.log('✅ [DELETE] Removed from local array at index:', cvIndex);
                } else {
                    console.warn('⚠️ [DELETE] CV not found in local array to remove');
                }
                
                // Force re-render immediately
                if (typeof renderAdminCvDatabase === 'function') renderAdminCvDatabase();
                if (typeof renderRecruteurApplications === 'function') renderRecruteurApplications();
                if (typeof renderLecteurCvDatabase === 'function') renderLecteurCvDatabase();
                if (typeof populateCVJobFilter === 'function') populateCVJobFilter();
                
                showNotification('Candidature supprimée définitivement', 'success');
                logActivity(currentUser.username, `Candidature supprimée: ${cvName}`);
                
                // The listener will automatically update siteData.cvDatabase when it receives the Firebase update
                // This ensures consistency even if page is reloaded - the document will be gone from Firebase
                return;
            } else {
                console.error('❌ [DELETE] Firebase delete failed:', result.error);
                console.error('❌ [DELETE] Error details:', {
                    collection: 'cvDatabase',
                    documentId: firebaseIdString,
                    error: result.error,
                    userRole: currentUser?.role,
                    userEmail: authUser?.email,
                    userUID: authUser?.uid,
                    isAuthenticated: !!authUser
                });
                
                // Check if it's a permission error
                if (result.error && (result.error.includes('permission') || result.error.includes('Permission') || result.error.includes('insufficient'))) {
                    console.error('❌ [DELETE] Permission denied!');
                    console.error('💡 [DELETE] Troubleshooting:');
                    console.error('  1. Make sure you are logged in with Firebase Auth');
                    console.error('  2. Check that your user document exists in /users/{uid}');
                    console.error('  3. Verify your role is "admin", "recruiter", or "recruteur"');
                    console.error('  4. Run: await fixUserPermissions() to fix your permissions');
                    showNotification('Erreur de permissions: Vérifiez que vous êtes connecté et avez le rôle requis (admin/recruteur). Ouvrez la console pour plus de détails.', 'error');
                } else {
                    showNotification(`Erreur lors de la suppression: ${result.error}`, 'error');
                }
                return; // Don't delete locally if Firebase delete failed
            }
        } catch (error) {
            console.error('❌ [DELETE] Firebase delete error:', error);
            console.error('❌ [DELETE] Error stack:', error.stack);
            console.error('❌ [DELETE] Error code:', error.code);
            console.error('❌ [DELETE] Error message:', error.message);
            
            const authUser = window.firebaseServices?.auth?.currentUser;
            console.error('❌ [DELETE] Auth state:', {
                isAuthenticated: !!authUser,
                userEmail: authUser?.email,
                userUID: authUser?.uid,
                currentUserRole: currentUser?.role
            });
            
            // Check if it's a permission error
            if (error.code === 'permission-denied' || error.message?.includes('permission') || error.message?.includes('insufficient')) {
                console.error('❌ [DELETE] Permission denied!');
                console.error('💡 [DELETE] Troubleshooting steps:');
                console.error('  1. Make sure you are logged in with Firebase Auth');
                console.error('  2. Check that your user document exists in /users/{uid} with correct role');
                console.error('  3. Verify your role is "admin", "recruiter", or "recruteur"');
                console.error('  4. Run in console: await fixUserPermissions()');
                console.error('  5. Or run: await quickLogin() to log in with password');
                showNotification('Erreur de permissions: Vérifiez votre authentification Firebase. Ouvrez la console (F12) pour plus de détails.', 'error');
            } else {
                showNotification(`Erreur lors de la suppression: ${error.message}`, 'error');
            }
            return; // Don't delete locally if Firebase delete failed
        }
    }

    // Only delete locally if NOT in Firebase mode (localStorage mode)
    // firebaseId is already declared above
    const cvIndex = siteData.cvDatabase.findIndex(c =>
        c.id === cvId || 
        c.id == cvId || 
        String(c.id) === String(cvId) || 
        c.firebaseId === firebaseId ||
        String(c.firebaseId) === String(firebaseId) ||
        c.firebaseId === cvId ||
        String(c.firebaseId) === String(cvId)
    );

    if (cvIndex >= 0) {
        siteData.cvDatabase.splice(cvIndex, 1);
        if (saveSiteData()) {
            renderAdminCvDatabase();
            if (typeof renderRecruteurApplications === 'function') renderRecruteurApplications();
            if (typeof renderLecteurCvDatabase === 'function') renderLecteurCvDatabase();
            if (typeof populateCVJobFilter === 'function') populateCVJobFilter();
            showNotification('Candidature supprimée', 'success');
            logActivity(currentUser.username, `Candidature supprimée: ${cvName}`);
        }
    }
}

function viewJobApplications(jobId) {
    const applications = siteData.cvDatabase.filter(cv => cv.jobId === jobId);
    showNotification(`${applications.length} candidature(s) pour cette offre`, 'info');
}

function viewUserActivity(username) {
    const userLogs = siteData.activityLog.filter(log => log.username === username);
    showNotification(`${userLogs.length} action(s) enregistrée(s) pour ${username}`, 'info');
}

// Export functions pour CV
function exportAllCVs() {
    if (!siteData.cvDatabase || siteData.cvDatabase.length === 0) {
        showNotification('Aucun CV à exporter', 'warning');
        return;
    }

    showNotification(`Préparation de l'export de ${siteData.cvDatabase.length} CV...`, 'info');
    logActivity(currentUser.username, `Export de ${siteData.cvDatabase.length} CV`);
}

function exportCVDatabase(format) {
    if (!siteData.cvDatabase || siteData.cvDatabase.length === 0) {
        showNotification('Aucune donnée à exporter', 'warning');
        return;
    }

    if (format === 'csv') {
        let csv = 'Nom,Email,Téléphone,Poste,Date candidature,Statut,Traité par,Salaire souhaité,En poste,Dernier poste,Type contrat\n';
        siteData.cvDatabase.forEach(cv => {
            csv += `"${cv.applicantName}","${cv.applicantEmail}","${cv.applicantPhone || ''}","${cv.jobTitle}","${new Date(cv.appliedAt).toLocaleDateString()}","${cv.processed ? 'Traité' : 'En attente'}","${cv.processedBy || ''}","${cv.expectedSalary || ''}","${cv.currentlyEmployed || ''}","${cv.lastJobDate || ''}","${cv.lastContractType || ''}"\n`;
        });

        const csvBlob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(csvBlob);
        link.download = `ae2i_cv_database_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    } else {
        const dataStr = JSON.stringify(siteData.cvDatabase, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ae2i_cv_database_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    showNotification(`Base de données CV exportée (${format.toUpperCase()})`, 'success');
    logActivity(currentUser.username, `Base de données CV exportée (${format})`);
}

// ============================================
// CV DATABASE RENDERING FUNCTIONS
// ============================================

/**
 * Generic function to render CV database table
 * @param {Array} cvs - Array of CV objects
 * @param {string} containerId - Target div ID
 * @param {string} userRole - User role ('admin', 'lecteur', 'recruteur')
 */
function renderCVDatabaseTable(cvs, containerId, userRole) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }

    if (!cvs || cvs.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-xl); background: var(--bg-alt); border-radius: var(--border-radius-lg); border: 2px dashed var(--border);">
                <i class="fas fa-inbox" style="font-size: 60px; color: var(--text-light); margin-bottom: 16px;"></i>
                <p style="font-size: var(--font-size-lg); font-weight: 600; color: var(--text-light);">Aucune candidature trouvée</p>
                <p style="color: var(--text-light); font-size: var(--font-size-sm);">Les candidatures apparaîtront ici une fois soumises</p>
            </div>
        `;
        return;
    }

    const isReadOnly = userRole === 'lecteur';

    // Use Card Design (Same as Lecteur/Recruteur)
    let html = isReadOnly ? '' : `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px;">`;

    // If not read only, use grid. If generic table needed, use table.
    // User requested "Same design as Recruteur/Lecteur"
    // Lecteur uses cards (seen in code at 10370)

    if (userRole === 'admin') {
        // Render as Cards for Admin too to match "Recruteur" style
        html = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px;">`;

        cvs.forEach(cv => {
            const statusClass = cv.processed ? 'status-processed' : 'status-pending';
            html += `
                <div style="background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%); 
                    border: 2px solid var(--border); 
                    border-radius: var(--border-radius-lg); 
                    padding: 24px; 
                    transition: var(--transition);
                    box-shadow: var(--shadow-md);
                    display: flex; flex-direction: column; justify-content: space-between;">
                    
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                             <h4 style="font-weight: 800; font-size: var(--font-size-lg); display: flex; align-items: center; gap: 12px; margin: 0;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">
                                    ${(cv.applicantName || 'C').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    ${cv.applicantName}
                                    <div style="font-size: 12px; color: var(--text-light); font-weight: normal;">${new Date(cv.appliedAt || Date.now()).toLocaleDateString()}</div>
                                </div>
                            </h4>
                            <span class="status-badge ${statusClass}">
                                <i class="fas fa-${cv.processed ? 'check' : 'clock'}"></i>
                            </span>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <div style="margin-bottom: 8px;">
                                <span style="background: var(--bg-alt); padding: 4px 8px; border-radius: 4px; font-weight: 600; color: var(--primary); font-size: 14px;">
                                    ${cv.jobTitle}
                                </span>
                            </div>
                            <div style="font-size: 14px; color: var(--text-light); margin-bottom: 4px;">
                                <i class="fas fa-envelope" style="width: 20px; text-align: center;"></i> ${cv.applicantEmail}
                            </div>
                            <div style="font-size: 14px; color: var(--text-light);">
                                <i class="fas fa-phone" style="width: 20px; text-align: center;"></i> ${cv.applicantPhone || 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 16px;">
                        <button class="btn btn-sm btn-primary functional-btn" onclick="previewCV('${cv.id || cv.firebaseId || ''}')" style="flex: 1;">
                            <i class="fas fa-eye"></i> Voir
                        </button>
                        <button class="btn btn-sm btn-outline functional-btn" onclick="downloadCV('${cv.id || cv.firebaseId || ''}')" title="Télécharger">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline functional-btn" onclick="printCV('${cv.id || cv.firebaseId || ''}')" title="Imprimer">
                            <i class="fas fa-print"></i>
                        </button>
                         ${!cv.processed ? `
                            <button class="btn btn-sm btn-success functional-btn" onclick="markAsProcessed('${cv.id || cv.firebaseId || ''}')" title="Traiter">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger functional-btn" onclick="deleteApplication('${cv.firebaseId || cv.id || ''}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
        return;
    }

    // Default Table Render (kept for reference or other roles if needed)
    html = `
        <div style="overflow-x: auto; border-radius: var(--border-radius-lg); box-shadow: var(--shadow-md);">
            <table style="width: 100%; border-collapse: collapse; background: var(--bg); border-radius: var(--border-radius-lg); overflow: hidden;">
                <thead>
                    <tr style="background: var(--gradient-primary); color: white;">
                        <th style="padding: 16px; text-align: left; font-weight: 700; font-size: var(--font-size-sm);">Candidat</th>
                        <th style="padding: 16px; text-align: left; font-weight: 700; font-size: var(--font-size-sm);">Contact</th>
                        <th style="padding: 16px; text-align: left; font-weight: 700; font-size: var(--font-size-sm);">Poste</th>
                        <th style="padding: 16px; text-align: left; font-weight: 700; font-size: var(--font-size-sm);">Date</th>
                        <th style="padding: 16px; text-align: center; font-weight: 700; font-size: var(--font-size-sm);">Statut</th>
                        <th style="padding: 16px; text-align: center; font-weight: 700; font-size: var(--font-size-sm);">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    cvs.forEach((cv, index) => {
        const rowBg = index % 2 === 0 ? 'var(--bg)' : 'var(--bg-alt)';
        const statusClass = cv.processed ? 'status-processed' : 'status-pending';
        const statusText = cv.processed ? 'Traité' : 'En attente';
        const statusColor = cv.processed ? 'var(--success)' : 'var(--warning)';

        const applicantName = cv.applicantName || `${cv.applicantFirstName || ''} ${cv.applicantLastName || ''}`.trim() || 'Candidat';
        const applicantEmail = cv.applicantEmail || cv.email || 'Non renseigné';
        const applicantPhone = cv.applicantPhone || cv.phone || 'Non renseigné';
        const jobTitle = cv.jobTitle || 'Poste non spécifié';
        const appliedDate = cv.appliedAt || cv.submittedAt || cv.createdAt || Date.now();
        const formattedDate = new Date(appliedDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        html += `
            <tr style="background: ${rowBg}; border-bottom: 1px solid var(--border); transition: background 0.2s;" 
                onmouseover="this.style.background='var(--primary-light)'; this.style.transform='scale(1.01)'" 
                onmouseout="this.style.background='${rowBg}'; this.style.transform='scale(1)'">
                <td style="padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--gradient-accent); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: var(--font-size-lg);">
                            ${applicantName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text);">${applicantName}</div>
                        </div>
                    </div>
                </td>
                <td style="padding: 16px;">
                    <div style="font-size: var(--font-size-sm);">
                        <div style="margin-bottom: 4px;"><i class="fas fa-envelope" style="color: var(--primary); margin-right: 6px;"></i>${applicantEmail}</div>
                        <div><i class="fas fa-phone" style="color: var(--primary); margin-right: 6px;"></i>${applicantPhone}</div>
                    </div>
                </td>
                <td style="padding: 16px;">
                    <span style="color: var(--primary); font-weight: 600;">${jobTitle}</span>
                </td>
                <td style="padding: 16px;">
                    <span style="color: var(--text-light); font-size: var(--font-size-sm);">${formattedDate}</span>
                </td>
                <td style="padding: 16px; text-align: center;">
                    <span style="padding: 6px 12px; border-radius: var(--border-radius); background: ${statusColor}20; color: ${statusColor}; font-weight: 600; font-size: var(--font-size-xs); display: inline-block;">
                        ${statusText}
                    </span>
                </td>
                <td style="padding: 16px; text-align: center;">
                    <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn btn-sm btn-primary functional-btn" onclick="previewCV('${cv.id || cv.firebaseId || ''}')" title="Voir le CV">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-success functional-btn" onclick="downloadCV('${cv.id || cv.firebaseId || ''}')" title="Télécharger">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-accent functional-btn" onclick="printCV('${cv.id || cv.firebaseId || ''}')" title="Imprimer">
                            <i class="fas fa-print"></i>
                        </button>
                        ${!isReadOnly && !cv.processed ? `
                            <button class="btn btn-sm btn-info functional-btn" onclick="markAsProcessed('${cv.id || cv.firebaseId || ''}')" title="Marquer comme traité">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${!isReadOnly ? `
                            <button class="btn btn-sm btn-danger functional-btn" onclick="deleteApplication('${cv.firebaseId || cv.id || ''}')" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Render admin CV database
 */
function renderAdminCvDatabase() {
    console.log('📊 Rendering admin CV database...');

    if (!siteData.cvDatabase) {
        siteData.cvDatabase = [];
    }

    // Apply filters using getAdminFilteredCandidates
    const filteredCvs = typeof getAdminFilteredCandidates === 'function' 
        ? getAdminFilteredCandidates() 
        : siteData.cvDatabase;
    
    renderCVDatabaseTable(filteredCvs, 'adminCvDatabase', 'admin');

    // Update counter with filtered count
    const counterElement = document.getElementById('adminFilterCountNumber');
    if (counterElement) {
        counterElement.textContent = filteredCvs.length;
    }

    console.log(`✅ Rendered ${filteredCvs.length} filtered CVs out of ${siteData.cvDatabase.length} total for admin`);
}

/**
 * Render lecteur CV database
 */
function renderLecteurCvDatabase() {
    console.log('📊 Rendering lecteur CV database...');

    if (!siteData.cvDatabase) {
        siteData.cvDatabase = [];
    }

    // Apply filters using getLecteurFilteredCandidates
    const filteredCvs = typeof getLecteurFilteredCandidates === 'function' 
        ? getLecteurFilteredCandidates() 
        : siteData.cvDatabase;
    
    renderCVDatabaseTable(filteredCvs, 'lecteurCvDatabase', 'lecteur');

    // Update counter with filtered count (already updated in getLecteurFilteredCandidates)
    const counterElement = document.getElementById('lecteurFilterCountNumber');
    if (counterElement && typeof getLecteurFilteredCandidates !== 'function') {
        counterElement.textContent = filteredCvs.length;
    }

    console.log(`✅ Rendered ${filteredCvs.length} filtered CVs out of ${siteData.cvDatabase.length} total for lecteur`);
}

/**
 * Render recruteur applications (if needed)
 * This is a fallback function - the main renderRecruteurApplications() at line 10768 uses filters
 */
function renderRecruteurApplications() {
    console.log('📊 Rendering recruteur applications...');

    if (!siteData.cvDatabase) {
        siteData.cvDatabase = [];
    }

    // Apply filters using getRecruteurFilteredCandidates
    const filteredCvs = typeof getRecruteurFilteredCandidates === 'function' 
        ? getRecruteurFilteredCandidates() 
        : siteData.cvDatabase;
    
    const container = document.getElementById('recruteurCandidatures');

    if (container) {
        renderCVDatabaseTable(filteredCvs, 'recruteurCandidatures', 'recruteur');
        
        // Update filter count display
        const filterCountEl = document.getElementById('recruteurFilterCountNumber');
        if (filterCountEl) {
            filterCountEl.textContent = filteredCvs.length;
        }
    }

    console.log(`✅ Rendered ${filteredCvs.length} filtered applications out of ${siteData.cvDatabase.length} total for recruteur`);
}

// Expose functions globally
window.renderAdminCvDatabase = renderAdminCvDatabase;
window.renderLecteurCvDatabase = renderLecteurCvDatabase;
window.renderRecruteurApplications = renderRecruteurApplications;
window.renderCVDatabaseTable = renderCVDatabaseTable;

// ============================================
// END CV DATABASE RENDERING FUNCTIONS
// ============================================

// Settings functions OPÉRATIONNELLES
function updateSiteInfo() {
    siteData.settings.title = document.getElementById('siteTitle').value;
    siteData.settings.slogan = document.getElementById('siteSlogan').value;
    siteData.settings.description = document.getElementById('siteDescription').value;

    // Mettre à jour le titre de la page
    document.title = siteData.settings.title;

    // Mettre à jour les éléments de la page
    document.getElementById('heroTitle').textContent = siteData.settings.title;
    document.getElementById('heroSubtitle').textContent = siteData.settings.slogan;

    if (saveSiteData()) {
        showNotification('Informations du site mises à jour', 'success');
        logActivity(currentUser.username, 'Informations du site modifiées');
    }
}

function updateLanguageSettings() {
    siteData.settings.defaultLanguage = document.getElementById('defaultLanguage').value;
    siteData.settings.enableMultilingual = document.getElementById('enableMultilingual').checked;

    if (saveSiteData()) {
        showNotification('Paramètres de langue mis à jour', 'success');
        logActivity(currentUser.username, 'Paramètres de langue modifiés');
    }
}

function updateThemeSettings() {
    siteData.settings.darkMode = document.getElementById('enableDarkMode').checked;
    siteData.settings.primaryColor = document.getElementById('primaryColor').value;
    siteData.settings.secondaryColor = document.getElementById('secondaryColor').value;

    // Appliquer les couleurs et générer les variations
    const primary = siteData.settings.primaryColor;
    const secondary = siteData.settings.secondaryColor;

    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--primary-light', lightenColor(primary, 10));
    document.documentElement.style.setProperty('--primary-dark', darkenColor(primary, 10));
    document.documentElement.style.setProperty('--secondary', secondary);
    document.documentElement.style.setProperty('--secondary-light', lightenColor(secondary, 10));
    document.documentElement.style.setProperty('--secondary-dark', darkenColor(secondary, 10));
    document.documentElement.style.setProperty('--accent', lightenColor(primary, 15));
    document.documentElement.style.setProperty('--accent-light', lightenColor(primary, 25));
    document.documentElement.style.setProperty('--accent-dark', darkenColor(primary, 5));

    // Mettre à jour les gradients
    document.documentElement.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${primary} 0%, ${darkenColor(primary, 10)} 100%)`);
    document.documentElement.style.setProperty('--gradient-secondary', `linear-gradient(135deg, ${secondary} 0%, ${darkenColor(secondary, 10)} 100%)`);
    document.documentElement.style.setProperty('--gradient-accent', `linear-gradient(135deg, ${lightenColor(primary, 15)} 0%, ${darkenColor(primary, 5)} 100%)`);

    if (saveSiteData()) {
        showNotification('Thème mis à jour', 'success');
        logActivity(currentUser.username, 'Thème modifié');
    }
}

function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * percent / 100));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent / 100));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * percent / 100));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * percent / 100));
    const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * percent / 100));
    const b = Math.max(0, (num & 0xff) - Math.round(255 * percent / 100));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

async function updateAdminProfile() {
    const adminUser = siteData.users.find(u => u.role === 'admin');
    if (!adminUser) {
        showNotification('Utilisateur administrateur non trouvé', 'error');
        return;
    }

    const newName = document.getElementById('adminName').value;
    const newEmail = document.getElementById('adminEmail').value;
    const newPassword = document.getElementById('adminPassword').value;

    // Update name and email immediately (no confirmation needed)
    adminUser.username = newName;
    adminUser.email = newEmail;

    // If password is provided, send confirmation email instead of changing directly
    if (newPassword && newPassword.trim() !== '') {
        await requestPasswordChangeConfirmation(adminUser.email, newPassword);
        // Clear password field
        document.getElementById('adminPassword').value = '';
    } else {
        // No password change, just update name/email
        if (saveSiteData()) {
            showNotification('Profil administrateur mis à jour', 'success');
            logActivity(currentUser.username, 'Profil administrateur modifié');
        }
    }
}

// Request password change confirmation via email
async function requestPasswordChangeConfirmation(adminEmail, newPassword) {
    try {
        console.log('🔐 [PASSWORD] Requesting password change confirmation...');
        
        // Generate unique confirmation token
        const token = generateSecureToken();
        const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes validity
        
        // Store token and new password in Firebase (secure storage)
        const confirmationData = {
            token: token,
            newPassword: newPassword,
            adminEmail: adminEmail,
            requestedAt: new Date().toISOString(),
            expiresAt: expiresAt,
            status: 'pending'
        };
        
        // Save to Firebase
        if (window.firebaseHelper && typeof window.firebaseHelper.addDocument === 'function') {
            const result = await window.firebaseHelper.addDocument('passwordChangeConfirmations', confirmationData);
            
            if (result && result.success) {
                console.log('✅ [PASSWORD] Confirmation token saved:', result.id);
                
                // Generate confirmation URL
                const confirmationUrl = `${window.location.origin}${window.location.pathname}?confirmPasswordChange=${token}`;
                
                // Send confirmation email via EmailJS
                await sendPasswordChangeConfirmationEmail(adminEmail, confirmationUrl, token);
                
                showNotification('Un email de confirmation a été envoyé. Vérifiez votre boîte mail.', 'info');
                logActivity(currentUser.username, 'Demande de changement de mot de passe envoyée');
            } else {
                throw new Error('Failed to save confirmation token');
            }
        } else {
            // Fallback: store in localStorage (less secure but works)
            localStorage.setItem(`passwordChange_${token}`, JSON.stringify({
                newPassword: newPassword,
                adminEmail: adminEmail,
                expiresAt: expiresAt
            }));
            
            const confirmationUrl = `${window.location.origin}${window.location.pathname}?confirmPasswordChange=${token}`;
            await sendPasswordChangeConfirmationEmail(adminEmail, confirmationUrl, token);
            
            showNotification('Un email de confirmation a été envoyé. Vérifiez votre boîte mail.', 'info');
        }
    } catch (error) {
        console.error('❌ [PASSWORD] Error requesting password change:', error);
        showNotification('Erreur lors de l\'envoi de l\'email de confirmation', 'error');
    }
}

// Generate secure token
function generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Send password change confirmation email via EmailJS
async function sendPasswordChangeConfirmationEmail(adminEmail, confirmationUrl, token) {
    try {
        if (typeof emailjs === 'undefined' || !window.EMAILJS_CONFIG) {
            throw new Error('EmailJS not configured');
        }

        const { serviceId, publicKey } = window.EMAILJS_CONFIG;
        
        // Use password change template if available, otherwise fallback to main template
        const passwordTemplateId = window.EMAILJS_CONFIG.passwordChangeTemplateId || window.EMAILJS_CONFIG.templateId;
        
        console.log('🔐 [PASSWORD EMAIL] Using template ID:', passwordTemplateId);
        console.log('🔐 [PASSWORD EMAIL] Password template configured:', !!window.EMAILJS_CONFIG.passwordChangeTemplateId);
        console.log('🔐 [PASSWORD EMAIL] Main template ID:', window.EMAILJS_CONFIG.templateId);
        
        const subject = 'Confirmation de changement de mot de passe - AE2I';
        
        // Create URLs for confirm and cancel actions
        const confirmUrl = `${window.location.origin}${window.location.pathname}?confirmPasswordChange=${token}&action=confirm`;
        const cancelUrl = `${window.location.origin}${window.location.pathname}?confirmPasswordChange=${token}&action=cancel`;
        
        // EmailJS template parameters for HTML template
        // The HTML template in EmailJS will use these variables:
        // - {{to_name}} or {{to_email}} - Name/Email of recipient
        // - {{confirmation_url}} - Link for "Yes" button
        // - {{cancel_url}} - Link for "No" button
        // - {{subject}} - Email subject (set in template)
        // - {{email}} or {{to_email}} - Recipient email (for "To Email" field)
        const templateParams = {
            to_email: adminEmail,
            email: adminEmail, // Alternative field name for EmailJS "To Email"
            subject: subject,
            to_name: 'Administrateur',
            confirmation_url: confirmUrl,
            cancel_url: cancelUrl
        };

        console.log('🔐 [PASSWORD EMAIL] Sending with params:', {
            serviceId: serviceId,
            templateId: passwordTemplateId,
            to_email: adminEmail,
            has_confirmation_url: !!confirmUrl,
            has_cancel_url: !!cancelUrl
        });

        // Use password change template ID if configured, otherwise use main template
        await emailjs.send(serviceId, passwordTemplateId, templateParams, publicKey);
        console.log('✅ [PASSWORD] Confirmation email sent to:', adminEmail);
    } catch (error) {
        console.error('❌ [PASSWORD] Error sending confirmation email:', error);
        throw error;
    }
}

// Confirm password change (called when user clicks confirmation link)
async function confirmPasswordChange(token) {
    try {
        console.log('🔐 [PASSWORD] Confirming password change with token:', token);
        
        let confirmationData = null;
        
        // Try to get from Firebase first
        if (window.firebaseHelper && typeof window.firebaseHelper.queryCollection === 'function') {
            // Query passwordChangeConfirmations collection by token
            const queryResult = await window.firebaseHelper.queryCollection('passwordChangeConfirmations', [
                ['token', '==', token],
                ['status', '==', 'pending']
            ]);
            
            if (queryResult && queryResult.success && queryResult.data && queryResult.data.length > 0) {
                confirmationData = queryResult.data[0];
                confirmationData.id = confirmationData.id; // Keep the document ID for update
            }
        }
        
        // Fallback: try localStorage
        if (!confirmationData) {
            const stored = localStorage.getItem(`passwordChange_${token}`);
            if (stored) {
                confirmationData = JSON.parse(stored);
            }
        }
        
        if (!confirmationData) {
            showNotification('Token de confirmation invalide ou expiré', 'error');
            return false;
        }
        
        // Check if token expired
        if (confirmationData.expiresAt && Date.now() > confirmationData.expiresAt) {
            showNotification('Le lien de confirmation a expiré. Veuillez refaire une demande.', 'error');
            return false;
        }
        
        // Update admin password
        const adminUser = siteData.users.find(u => u.role === 'admin');
        if (!adminUser) {
            showNotification('Utilisateur administrateur non trouvé', 'error');
            return false;
        }
        
        adminUser.password = confirmationData.newPassword;
        
        // Save to Firebase and local storage
        if (saveSiteData()) {
            // Mark confirmation as used in Firebase
            if (confirmationData.id && window.firebaseHelper && typeof window.firebaseHelper.updateDocument === 'function') {
                await window.firebaseHelper.updateDocument('passwordChangeConfirmations', confirmationData.id, {
                    status: 'confirmed',
                    confirmedAt: new Date().toISOString()
                });
            }
            
            // Remove from localStorage
            localStorage.removeItem(`passwordChange_${token}`);
            
            showNotification('Mot de passe modifié avec succès !', 'success');
            logActivity(adminUser.username, 'Mot de passe modifié via confirmation email');
            
            // Clear URL parameter
            window.history.replaceState({}, document.title, window.location.pathname);
            
            return true;
        } else {
            showNotification('Erreur lors de la sauvegarde du nouveau mot de passe', 'error');
            return false;
        }
    } catch (error) {
        console.error('❌ [PASSWORD] Error confirming password change:', error);
        showNotification('Erreur lors de la confirmation du changement de mot de passe', 'error');
        return false;
    }
}

// Check for password change confirmation on page load
function checkPasswordChangeConfirmation() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('confirmPasswordChange');
    const action = urlParams.get('action'); // 'confirm' or 'cancel'
    
    if (token) {
        console.log('🔐 [PASSWORD] Password change confirmation token detected, action:', action);
        
        if (action === 'confirm') {
            confirmPasswordChange(token);
        } else if (action === 'cancel') {
            cancelPasswordChange(token);
        } else {
            // Show confirmation page with buttons if no action specified
            showPasswordChangeConfirmationPage(token);
        }
    }
}

// Show confirmation page with Yes/No buttons
function showPasswordChangeConfirmationPage(token) {
    // Create modal/overlay for confirmation
    const overlay = document.createElement('div');
    overlay.id = 'passwordChangeConfirmationOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    
    modal.innerHTML = `
        <div style="margin-bottom: 30px;">
            <i class="fas fa-key" style="font-size: 48px; color: #667eea; margin-bottom: 20px;"></i>
            <h2 style="margin: 0 0 15px 0; color: #333;">Confirmation de changement de mot de passe</h2>
            <p style="color: #666; line-height: 1.6;">
                Une demande de changement de mot de passe a été effectuée pour votre compte administrateur.
            </p>
            <p style="color: #666; line-height: 1.6; margin-top: 15px;">
                Voulez-vous confirmer ce changement ?
            </p>
        </div>
        <div style="display: flex; gap: 15px; justify-content: center;">
            <button id="confirmPasswordBtn" style="
                padding: 14px 32px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            " onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
                <i class="fas fa-check"></i> Oui, confirmer
            </button>
            <button id="cancelPasswordBtn" style="
                padding: 14px 32px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            " onmouseover="this.style.background='#c82333'" onmouseout="this.style.background='#dc3545'">
                <i class="fas fa-times"></i> Non, annuler
            </button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add event listeners
    document.getElementById('confirmPasswordBtn').addEventListener('click', () => {
        overlay.remove();
        confirmPasswordChange(token);
    });
    
    document.getElementById('cancelPasswordBtn').addEventListener('click', () => {
        overlay.remove();
        cancelPasswordChange(token);
    });
    
    // Close on overlay click (outside modal)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            cancelPasswordChange(token);
        }
    });
}

// Cancel password change request
async function cancelPasswordChange(token) {
    try {
        console.log('🔐 [PASSWORD] Cancelling password change request, token:', token);
        
        // Mark confirmation as cancelled in Firebase
        if (window.firebaseHelper && typeof window.firebaseHelper.queryCollection === 'function') {
            const queryResult = await window.firebaseHelper.queryCollection('passwordChangeConfirmations', [
                ['token', '==', token],
                ['status', '==', 'pending']
            ]);
            
            if (queryResult && queryResult.success && queryResult.data && queryResult.data.length > 0) {
                const confirmationData = queryResult.data[0];
                
                if (confirmationData.id && window.firebaseHelper && typeof window.firebaseHelper.updateDocument === 'function') {
                    await window.firebaseHelper.updateDocument('passwordChangeConfirmations', confirmationData.id, {
                        status: 'cancelled',
                        cancelledAt: new Date().toISOString()
                    });
                }
            }
        }
        
        // Remove from localStorage
        localStorage.removeItem(`passwordChange_${token}`);
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        showNotification('Demande de changement de mot de passe annulée', 'info');
        console.log('✅ [PASSWORD] Password change request cancelled');
    } catch (error) {
        console.error('❌ [PASSWORD] Error cancelling password change:', error);
        showNotification('Erreur lors de l\'annulation', 'error');
    }
}

function updateMaintenanceMessage() {
    siteData.settings.maintenanceMessage = document.getElementById('maintenanceMessage').value;
    if (saveSiteData()) {
        showNotification('Message de maintenance mis à jour', 'success');
        logActivity(currentUser.username, 'Message de maintenance modifié');
    }
}

// Maintenance functions
function createBackup() {
    const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: siteData
    };

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ae2i_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    showNotification('Sauvegarde créée et téléchargée', 'success');
    logActivity(currentUser.username, 'Sauvegarde créée');
}

function clearCache() {
    if (confirm('Vider le cache local? Cette action rechargera la page.')) {
        localStorage.clear();
        sessionStorage.clear();
        showNotification('Cache vidé', 'success');
        logActivity(currentUser.username, 'Cache vidé');
        setTimeout(() => location.reload(), 1000);
    }
}

function runPerformanceCheck() {
    const startTime = performance.now();

    // Simuler une analyse de performance
    setTimeout(() => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;

        document.getElementById('loadTime').textContent = `${loadTime.toFixed(2)}ms`;

        // Simuler l'utilisation mémoire
        if (performance.memory) {
            const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
            document.getElementById('memoryUsage').textContent = `${memoryMB} MB`;
        }

        showNotification('Analyse de performance terminée', 'success');
        logActivity(currentUser.username, 'Analyse de performance effectuée');
    }, 500);
}

// Analytics functions
function generateGlobalReport() {
    const report = {
        timestamp: new Date().toISOString(),
        services: {
            total: siteData.services.length,
            active: siteData.services.filter(s => s.active).length
        },
        clients: {
            total: siteData.clients.length,
            active: siteData.clients.filter(c => c.active).length
        },
        jobs: {
            total: siteData.jobs.length,
            active: siteData.jobs.filter(j => j.active).length,
            byType: {
                cdi: siteData.jobs.filter(j => j.type === 'cdi').length,
                cdd: siteData.jobs.filter(j => j.type === 'cdd').length,
                stage: siteData.jobs.filter(j => j.type === 'stage').length
            }
        },
        applications: {
            total: siteData.cvDatabase ? siteData.cvDatabase.length : 0,
            processed: siteData.cvDatabase ? siteData.cvDatabase.filter(cv => cv.processed).length : 0
        },
        consent: {
            accepted: siteData.consentLogs ? siteData.consentLogs.filter(log => log.action === 'accepted').length : 0,
            declined: siteData.consentLogs ? siteData.consentLogs.filter(log => log.action === 'declined').length : 0
        }
    };

    const reportStr = JSON.stringify(report, null, 2);
    const reportBlob = new Blob([reportStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(reportBlob);
    link.download = `ae2i_rapport_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    showNotification('Rapport global généré', 'success');
    logActivity(currentUser.username, 'Rapport global généré');
}

function exportAnalytics(format) {
    const data = {
        services: siteData.services,
        clients: siteData.clients,
        jobs: siteData.jobs,
        applications: siteData.cvDatabase,
        activityLog: siteData.activityLog
    };

    if (format === 'csv') {
        // Conversion simple en CSV pour les candidatures
        let csv = 'Nom,Email,Poste,Date,Statut,Salaire souhaité,En poste,Dernier poste,Type contrat\n';
        if (siteData.cvDatabase) {
            siteData.cvDatabase.forEach(cv => {
                csv += `"${cv.applicantName}","${cv.applicantEmail}","${cv.jobTitle}","${new Date(cv.appliedAt).toLocaleDateString()}","${cv.processed ? 'Traité' : 'En attente'}","${cv.expectedSalary || ''}","${cv.currentlyEmployed || ''}","${cv.lastJobDate || ''}","${cv.lastContractType || ''}"\n`;
            });
        }

        const csvBlob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(csvBlob);
        link.download = `ae2i_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    } else {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ae2i_analytics_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    showNotification(`Analytics exportées (${format.toUpperCase()})`, 'success');
    logActivity(currentUser.username, `Analytics exportées (${format})`);
}

function exportConsentData(format) {
    const consentData = siteData.consentLogs || [];

    if (format === 'csv') {
        let csv = 'Action,Date,Détails\n';
        consentData.forEach(log => {
            csv += `"${log.action}","${new Date(log.timestamp).toLocaleDateString()}","${JSON.stringify(log.details).replace(/"/g, '""')}"\n`;
        });

        const csvBlob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(csvBlob);
        link.download = `ae2i_consent_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    } else {
        const dataStr = JSON.stringify(consentData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ae2i_consent_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    showNotification(`Données de consentement exportées (${format.toUpperCase()})`, 'success');
    logActivity(currentUser.username, `Données de consentement exportées (${format})`);
}

function exportAuditLog() {
    const auditData = siteData.activityLog || [];

    let csv = 'Utilisateur,Action,Page,Date,Rôle\n';
    auditData.forEach(log => {
        csv += `"${log.username}","${log.action}","${log.page || ''}","${new Date(log.timestamp).toLocaleDateString()}","${log.userRole}"\n`;
    });

    const csvBlob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(csvBlob);
    link.download = `ae2i_audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification('Journal d\'audit exporté', 'success');
    logActivity(currentUser.username, 'Journal d\'audit exporté');
}
function anonymizeOldData() {
    if (confirm('Anonymiser les données de plus de 2 ans? Cette action est irréversible.')) {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        let anonymizedCount = 0;

        // Anonymiser les candidatures anciennes
        if (siteData.cvDatabase) {
            siteData.cvDatabase.forEach(cv => {
                if (new Date(cv.appliedAt) < twoYearsAgo) {
                    cv.applicantName = 'Anonymisé';
                    cv.applicantEmail = 'anonyme@anonyme.com';
                    cv.applicantPhone = 'Anonymisé';
                    cv.anonymized = true;
                    cv.anonymizedAt = new Date().toISOString();
                    anonymizedCount++;
                }
            });
        }

        // Anonymiser les logs anciens
        if (siteData.activityLog) {
            siteData.activityLog.forEach(log => {
                if (new Date(log.timestamp) < twoYearsAgo) {
                    log.username = 'Anonymisé';
                    log.userAgent = 'Anonymisé';
                    anonymizedCount++;
                }
            });
        }

        if (saveSiteData()) {
            showNotification(`${anonymizedCount} entrée(s) anonymisée(s)`, 'success');
            logActivity(currentUser.username, `${anonymizedCount} données anonymisées (conformité Loi 18-07)`);
        }
    }
}

function executeRecruteurScript() {
    console.log('👥 Executing recruteur dashboard script');

    // Load candidatures from Firebase if in Firebase mode
    if (APP_MODE === 'FIREBASE' && window.firebaseHelper) {
        loadCandidaturesFromFirebase().then(() => {
            renderRecruteurContent();
            setupRecruteurInteractions();
        }).catch(err => {
            console.error('Error loading candidatures:', err);
            renderRecruteurContent();
            setupRecruteurInteractions();
        });
    } else {
        renderRecruteurContent();
        setupRecruteurInteractions();
    }
}

// Load candidatures from Firebase
async function loadCandidaturesFromFirebase() {
    if (!window.firebaseHelper) return;

    try {
        console.log('📡 Loading candidatures from Firebase...');
        const result = await window.firebaseHelper.getCollection('cvDatabase');

        if (result.success && result.data) {
            const normalized = result.data.map(doc => {
                const d = { id: doc.id, ...doc };

                // Normalize timestamps
                if (d.submittedAt && d.submittedAt.toDate) {
                    try { d.appliedAt = d.submittedAt.toDate().toISOString(); } catch (e) { }
                } else if (d.submittedAt) {
                    d.appliedAt = (new Date(d.submittedAt)).toISOString();
                } else if (!d.appliedAt) {
                    d.appliedAt = new Date().toISOString();
                }

                // Normalize field names
                if (!d.applicantName) {
                    d.applicantName = d.fullName || d.cvData?.fullName || d.applicantFullName ||
                        ((d.applicantFirstName || '') + ' ' + (d.applicantLastName || '')).trim() || 'Candidat';
                }
                if (!d.jobTitle) {
                    d.jobTitle = d.position || d.job || d.cvData?.position || d.jobTitle || 'Poste';
                }

                // Ensure all required fields exist
                if (!d.applicantEmail && d.email) {
                    d.applicantEmail = d.email;
                }
                if (!d.applicantPhone && d.phone) {
                    d.applicantPhone = d.phone;
                }
                if (!d.applicantFirstName && d.firstName) {
                    d.applicantFirstName = d.firstName;
                }
                if (!d.applicantLastName && d.lastName) {
                    d.applicantLastName = d.lastName;
                }
                if (!d.jobId && d.job_id) {
                    d.jobId = d.job_id;
                }

                // Map CV URLs
                if (!d.cvR2Url && d.cvUrl) {
                    d.cvR2Url = d.cvUrl;
                }
                if (!d.cvUrl && d.cvR2Url) {
                    d.cvUrl = d.cvR2Url;
                }

                d.processed = !!d.processed;
                return d;
            });

            siteData.cvDatabase = normalized;
            console.log('✅ Loaded', normalized.length, 'candidatures from Firebase');
            console.log('📋 Candidatures:', normalized.map(c => ({ id: c.id, name: c.applicantName, jobId: c.jobId, jobTitle: c.jobTitle })));
        }
    } catch (error) {
        console.error('❌ Error loading candidatures from Firebase:', error);
    }
}

function renderRecruteurContent() {
    // Filter applications: Only show CVs for jobs created by this recruiter
    const myJobIds = myJobs.map(j => j.id);
    const allApplications = (siteData.cvDatabase || []).filter(cv => myJobIds.includes(cv.jobId));

    // Debug
    console.log('📊 [RECRUTEUR] My Jobs IDs:', myJobIds);
    console.log('📊 [RECRUTEUR] Filtered applications:', allApplications.length);

    console.log('📊 [RECRUTEUR] My jobs:', myJobs.length, myJobs.map(j => ({ id: j.id, title: j.title.fr })));
    console.log('📊 [RECRUTEUR] All candidatures:', allApplications.length);
    console.log('📊 [RECRUTEUR] All candidatures details:', allApplications.map(c => ({ id: c.id, name: c.applicantName, jobId: c.jobId, jobTitle: c.jobTitle })));

    document.getElementById('recruteurMyJobs').textContent = myJobs.length;
    document.getElementById('recruteurApplications').textContent = allApplications.length;
    document.getElementById('recruteurProcessed').textContent = allApplications.filter(cv => cv.processed).length;
    document.getElementById('recruteurPending').textContent = allApplications.filter(cv => !cv.processed).length;

    // Render recruiter jobs
    const jobsList = document.getElementById('recruteurJobsList');
    if (jobsList) {
        jobsList.innerHTML = '';
        myJobs.forEach((job, index) => {
            const jobItem = document.createElement('div');
            jobItem.style.cssText = `
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%); 
                border: 2px solid var(--border); 
                border-radius: var(--border-radius-lg); 
                padding: 20px; 
                margin-bottom: 16px;
                transition: var(--transition);
                backdrop-filter: blur(5px);
                box-shadow: var(--shadow-md);
            `;
            jobItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <h4 style="font-weight: 800; font-size: var(--font-size-lg);">${job.title.fr}</h4>
                    <span class="status-badge ${job.active ? 'status-active' : 'status-inactive'}">
                        <i class="fas fa-${job.active ? 'check' : 'times'}"></i>
                        ${job.active ? 'Actif' : 'Inactif'}
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px;">
                    <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius); text-align: center;">
                        <strong>Type:</strong><br>
                        <span style="background: var(--accent); color: white; padding: 2px 8px; border-radius: var(--border-radius-sm); font-size: var(--font-size-xs); font-weight: 700;">${job.type.toUpperCase()}</span>
                    </div>
                    <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius); text-align: center;">
                        <strong>Localisation:</strong><br>
                        <span style="color: var(--text-light);">${job.location}</span>
                    </div>
                    <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius); text-align: center;">
                        <strong>Créé le:</strong><br>
                        <span style="color: var(--text-light);">${new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius); text-align: center;">
                        <strong>Candidatures:</strong><br>
                        <span style="color: var(--primary); font-weight: 700;">${myApplications.filter(cv => cv.jobId === job.id).length}</span>
                    </div>
                </div>
                <p style="color: var(--text-light); margin-bottom: 16px; line-height: var(--line-height-loose);">${job.description.fr}</p>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                    <button class="btn btn-sm btn-outline functional-btn" onclick="editRecruteurJob(${job.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-warning functional-btn" onclick="toggleRecruteurJob(${job.id})">
                        <i class="fas fa-toggle-${job.active ? 'on' : 'off'}"></i> ${job.active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button class="btn btn-sm btn-danger functional-btn" onclick="deleteRecruteurJob(${job.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            `;

            jobItem.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-3px)';
                this.style.boxShadow = 'var(--shadow-lg)';
                this.style.borderColor = 'var(--accent)';
            });

            jobItem.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'var(--shadow-md)';
                this.style.borderColor = 'var(--border)';
            });

            jobsList.appendChild(jobItem);
        });

        if (myJobs.length === 0) {
            jobsList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px; background: var(--bg-alt); border-radius: var(--border-radius-lg);">Aucune offre créée</p>';
        }
    }

    // Render applications
    renderRecruteurApplications();
}

function renderRecruteurApplications() {
    const candidatures = document.getElementById('recruteurCandidatures');

    if (candidatures) {
        candidatures.innerHTML = '';

        // Use new advanced filtering function
        const allFiltered = getRecruteurFilteredCandidates();

        // Update filter count display
        const filterCountEl = document.getElementById('recruteurFilterCountNumber');
        if (filterCountEl) {
            filterCountEl.textContent = allFiltered.length;
        }

        // Get items per page from dropdown or default to 10
        const itemsPerPageSelect = document.getElementById('recruteurItemsPerPage');
        const itemsPerPageValue = itemsPerPageSelect?.value || '10';
        const itemsPerPage = itemsPerPageValue === 'all' ? allFiltered.length : parseInt(itemsPerPageValue, 10);

        // Pagination
        const currentPage = window.recruteurCurrentPage || 1;
        const totalPages = itemsPerPage === allFiltered.length ? 1 : Math.ceil(allFiltered.length / itemsPerPage);
        const startIdx = itemsPerPage === allFiltered.length ? 0 : (currentPage - 1) * itemsPerPage;
        const endIdx = itemsPerPage === allFiltered.length ? allFiltered.length : startIdx + itemsPerPage;
        const filteredApplications = allFiltered.slice(startIdx, endIdx);

        console.log('📄 [PAGINATION]', {
            total: allFiltered.length,
            itemsPerPage: itemsPerPage,
            currentPage: currentPage,
            totalPages: totalPages,
            showing: `${startIdx + 1}-${Math.min(endIdx, allFiltered.length)} of ${allFiltered.length}`
        });

        // Boutons d'export au-dessus
        const exportSection = document.createElement('div');
        exportSection.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end; margin-bottom: var(--spacing-md);';
        exportSection.innerHTML = `
            <button class="btn btn-success functional-btn" onclick="exportRecruteurCSV()">
                <i class="fas fa-file-csv"></i> Export CSV
            </button>
            <button class="btn btn-primary functional-btn" onclick="exportRecruteurPDF()">
                <i class="fas fa-file-pdf"></i> Export PDF
            </button>
        `;
        candidatures.appendChild(exportSection);

        filteredApplications.forEach(cv => {
            const cvId = cv.id || cv.applicantEmail;
            const savedNote = getCandidateNote(cvId);

            // Déterminer le statut avancé
            let statusInfo = { label: 'En attente', icon: 'clock', color: '#f39c12', class: 'status-pending' };
            if (cv.status === 'nouveau') statusInfo = { label: '🆕 Nouveau', icon: 'star', color: '#3498db', class: 'status-new' };
            else if (cv.status === 'en_cours') statusInfo = { label: '🔄 En cours', icon: 'spinner', color: '#f39c12', class: 'status-progress' };
            else if (cv.status === 'selectionne') statusInfo = { label: '✅ Sélectionné', icon: 'check-circle', color: '#27ae60', class: 'status-selected' };
            else if (cv.status === 'rejete') statusInfo = { label: '❌ Rejeté', icon: 'times-circle', color: '#e74c3c', class: 'status-rejected' };
            else if (cv.processed) statusInfo = { label: 'Traité', icon: 'check', color: '#27ae60', class: 'status-processed' };

            const cvItem = document.createElement('div');
            cvItem.style.cssText = `
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%); 
                border: 2px solid var(--border); 
                border-radius: var(--border-radius-lg); 
                padding: 20px; 
                margin-bottom: 16px;
                transition: var(--transition);
                backdrop-filter: blur(5px);
                box-shadow: var(--shadow-md);
            `;
            cvItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <h4 style="font-weight: 800; font-size: var(--font-size-lg);">${cv.applicantName || (cv.applicantFirstName + ' ' + cv.applicantLastName) || 'Candidat'}</h4>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <select onchange="updateCandidateStatus('${cvId}', this.value)" class="form-control" style="padding: 6px 12px; font-size: var(--font-size-sm);">
                            <option value="nouveau" ${cv.status === 'nouveau' ? 'selected' : ''}>🆕 Nouveau</option>
                            <option value="en_cours" ${cv.status === 'en_cours' ? 'selected' : ''}>🔄 En cours</option>
                            <option value="selectionne" ${cv.status === 'selectionne' ? 'selected' : ''}>✅ Sélectionné</option>
                            <option value="rejete" ${cv.status === 'rejete' ? 'selected' : ''}>❌ Rejeté</option>
                        </select>
                        <span class="status-badge ${statusInfo.class}" style="background: ${statusInfo.color};">
                            <i class="fas fa-${statusInfo.icon}"></i>
                            ${statusInfo.label}
                        </span>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
                    <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                        <strong>Poste:</strong><br>
                        <span style="color: var(--primary); font-weight: 600;">${cv.jobTitle}</span>
                    </div>
                    <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                        <strong>Email:</strong><br>
                        <span style="color: var(--text-light);">${cv.applicantEmail || cv.email || 'Non renseigné'}</span>
                    </div>
                    <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                        <strong>Téléphone:</strong><br>
                        <span style="color: var(--text-light);">${cv.applicantPhone || cv.phone || 'Non renseigné'}</span>
                    </div>
                    <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                        <strong>Date:</strong><br>
                        <span style="color: var(--text-light);">${new Date(cv.appliedAt).toLocaleDateString()}</span>
                    </div>
                </div>
                ${cv.expectedSalary ? `
                    <div style="background: rgba(0, 168, 150, 0.08); padding: 16px; border-radius: var(--border-radius-lg); margin-bottom: 16px; border-left: 4px solid var(--accent);">
                        <strong style="color: var(--accent);">Informations supplémentaires:</strong>
                        <div style="margin-top: 8px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; font-size: var(--font-size-sm);">
                            <div><strong>Salaire:</strong> ${cv.expectedSalary} DA</div>
                            <div><strong>En poste:</strong> ${cv.currentlyEmployed === 'yes' ? 'Oui' : 'Non'}</div>
                            <div><strong>Dernier poste:</strong> ${cv.lastJobDate}</div>
                            <div><strong>Type contrat:</strong> ${cv.lastContractType}</div>
                        </div>
                    </div>
                ` : ''}
                <!-- Notes Internes -->
                <div style="background: rgba(255, 193, 7, 0.08); padding: 16px; border-radius: var(--border-radius-lg); margin-bottom: 16px; border-left: 4px solid #ffc107;">
                    <strong style="color: #f57c00;"><i class="fas fa-sticky-note"></i> Notes internes (privées):</strong>
                    <textarea id="note-${cvId}" class="form-control" rows="3" placeholder="Ajouter des notes privées sur ce candidat..." style="margin-top: 8px;">${savedNote}</textarea>
                    <small style="color: var(--text-light); font-size: var(--font-size-xs); margin-top: 4px; display: block;">Auto-sauvegarde activée</small>
                </div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                    <button class="btn btn-sm btn-accent functional-btn" onclick="downloadApplicationPdfSummary(siteData.cvDatabase.find(c => (c.id || c.applicantEmail) === '${cvId}'))" style="background: linear-gradient(135deg, #00a896 0%, #028090 100%); color: white; border: none;">
                        <i class="fas fa-file-pdf"></i> Résumé PDF
                    </button>
                    <button class="btn btn-sm btn-outline functional-btn" onclick="openCVViewer('${cv.cvR2Url || cv.cvUrl || ''}', '${cv.applicantName || (cv.applicantFirstName + ' ' + cv.applicantLastName) || 'Candidat'}')">
                        <i class="fas fa-expand"></i> Visionneuse CV
                    </button>
                    <button class="btn btn-sm btn-outline functional-btn" onclick="previewCV('${cvId}')">
                        <i class="fas fa-eye"></i> Voir détails
                    </button>
                    <button class="btn btn-sm btn-primary functional-btn" onclick="contactApplicant('${cv.applicantEmail || cv.email || ''}')">
                        <i class="fas fa-envelope"></i> Contacter
                    </button>
                    <button class="btn btn-sm btn-success functional-btn" onclick="markAsProcessed('${cvId}')">
                        <i class="fas fa-check"></i> Marquer traité
                    </button>
                    <button class="btn btn-sm btn-warning functional-btn" onclick="downloadCV('${cvId}')">
                        <i class="fas fa-download"></i> Télécharger CV
                    </button>
                </div>
            `;

            cvItem.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-3px)';
                this.style.boxShadow = 'var(--shadow-lg)';
                this.style.borderColor = 'var(--accent)';
            });

            cvItem.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'var(--shadow-md)';
                this.style.borderColor = 'var(--border)';
            });

            candidatures.appendChild(cvItem);

            // Setup auto-save for notes
            const noteTextarea = document.getElementById(`note-${cvId}`);
            if (noteTextarea) {
                noteTextarea.addEventListener('input', debounce(function () {
                    saveCandidateNote(cvId, this.value);
                }, 1000));
            }
        });

        // Pagination UI at bottom (use existing element)
        const paginationBottom = document.getElementById('recruteurPaginationBottom');
        if (paginationBottom) {
            if (totalPages > 1 && itemsPerPage !== allFiltered.length) {
                paginationBottom.innerHTML = `
                    <button class="btn btn-sm btn-outline functional-btn" onclick="changeRecruteurPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    <i class="fas fa-chevron-left"></i> Précédent
                </button>
                    <span style="margin: 0 16px; font-weight: 600; color: var(--text);">
                        Page ${currentPage} / ${totalPages} 
                        <span style="color: var(--text-light); font-size: var(--font-size-sm);">
                            (${startIdx + 1}-${Math.min(endIdx, allFiltered.length)} sur ${allFiltered.length})
                        </span>
                    </span>
                    <button class="btn btn-sm btn-outline functional-btn" onclick="changeRecruteurPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    Suivant <i class="fas fa-chevron-right"></i>
                </button>
            `;
                paginationBottom.style.display = 'flex';
            } else {
                paginationBottom.innerHTML = `
                    <span style="color: var(--text-light); font-size: var(--font-size-sm);">
                        ${allFiltered.length} candidature(s) affichée(s)
                    </span>
                `;
                paginationBottom.style.display = 'flex';
            }
        }

        // Show empty message if no results (but don't overwrite if we already added content)
        if (filteredApplications.length === 0 && candidatures.children.length === 1) {
            // Only if we only have the export section, show empty message
            const emptyMsg = document.createElement('p');
            emptyMsg.style.cssText = 'text-align: center; color: var(--text-light); padding: 40px; background: var(--bg-alt); border-radius: var(--border-radius-lg); margin-top: var(--spacing-md);';
            emptyMsg.textContent = 'Aucune candidature trouvée';
            candidatures.appendChild(emptyMsg);
        }
    }
}

// Update pagination when items per page changes
window.updateRecruteurPagination = function () {
    // Reset to page 1 when changing items per page
    window.recruteurCurrentPage = 1;
    renderRecruteurApplications();
    // Scroll to top of candidatures section
    const candidaturesEl = document.getElementById('recruteurCandidatures');
    if (candidaturesEl) {
        candidaturesEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};
// Fonction helper pour debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function changeRecruteurPage(page) {
    window.recruteurCurrentPage = page;
    renderRecruteurApplications();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateCandidateStatus(cvId, newStatus) {
    const cv = siteData.cvDatabase.find(c => (c.id || c.applicantEmail) === cvId);
    if (cv) {
        cv.status = newStatus;
        saveSiteData();
        showNotification(`Statut mis à jour: ${newStatus}`, 'success');
        renderRecruteurApplications();
    }
}

/* ADD: candidate-filter-by-response - JavaScript pour filtrage multi-critères RECRUTEUR */
function setupRecruteurInteractions() {
    // Update user info
    document.getElementById('recruteurCurrentUser').textContent = currentUser.username;

    // Setup all filters with instant filtering
    const searchBar = document.getElementById('recruteurSearchBar');
    const statusFilter = document.getElementById('recruteurStatusFilter');
    const domaineFilter = document.getElementById('recruteurDomaineFilter');
    const diplomeFilter = document.getElementById('recruteurDiplomeFilter');
    const permisFilter = document.getElementById('recruteurPermisFilter');
    const wilayaFilter = document.getElementById('recruteurWilayaFilter');
    const ageMin = document.getElementById('recruteurAgeMin');
    const ageMax = document.getElementById('recruteurAgeMax');
    const preavisFilter = document.getElementById('recruteurPreavisFilter');
    const experienceMin = document.getElementById('recruteurExperienceMin');
    const experienceMax = document.getElementById('recruteurExperienceMax');

    // Attach event listeners for instant filtering
    if (searchBar) searchBar.addEventListener('input', applyRecruteurFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyRecruteurFilters);
    if (domaineFilter) domaineFilter.addEventListener('change', applyRecruteurFilters);
    if (diplomeFilter) diplomeFilter.addEventListener('change', applyRecruteurFilters);
    if (permisFilter) permisFilter.addEventListener('change', applyRecruteurFilters);
    if (wilayaFilter) wilayaFilter.addEventListener('change', applyRecruteurFilters);
    if (ageMin) ageMin.addEventListener('input', applyRecruteurFilters);
    if (ageMax) ageMax.addEventListener('input', applyRecruteurFilters);
    if (preavisFilter) preavisFilter.addEventListener('change', applyRecruteurFilters);
    if (experienceMin) experienceMin.addEventListener('input', applyRecruteurFilters);
    if (experienceMax) experienceMax.addEventListener('input', applyRecruteurFilters);
}

function applyRecruteurFilters() {
    renderRecruteurApplications();
}

function getRecruteurFilteredCandidates() {
    // Show ALL candidatures, not just recruiter's jobs
    let candidates = siteData.cvDatabase || [];

    // Barre de recherche - recherche dans plusieurs champs
    const searchTerm = document.getElementById('recruteurSearchBar')?.value.toLowerCase() || '';
    if (searchTerm) {
        candidates = candidates.filter(cv =>
            cv.applicantName?.toLowerCase().includes(searchTerm) ||
            cv.applicantFirstName?.toLowerCase().includes(searchTerm) ||
            cv.applicantLastName?.toLowerCase().includes(searchTerm) ||
            cv.applicantEmail?.toLowerCase().includes(searchTerm) ||
            cv.applicantPhone?.toLowerCase().includes(searchTerm) ||
            cv.jobTitle?.toLowerCase().includes(searchTerm) ||
            cv.diplome?.toLowerCase().includes(searchTerm) ||
            cv.domaine?.toLowerCase().includes(searchTerm) ||
            cv.applicantDiploma?.toLowerCase().includes(searchTerm) ||
            cv.wilaya?.toLowerCase().includes(searchTerm)
        );
    }

    // Filtre Statut
    const status = document.getElementById('recruteurStatusFilter')?.value || 'all';
    if (status === 'pending') candidates = candidates.filter(cv => !cv.processed);
    else if (status === 'processed') candidates = candidates.filter(cv => cv.processed);

    // Filtre Domaine (multi-sélection)
    const domaines = Array.from(document.getElementById('recruteurDomaineFilter')?.selectedOptions || []).map(o => o.value);
    if (domaines.length > 0) {
        candidates = candidates.filter(cv => cv.domaine && domaines.includes(cv.domaine.toLowerCase()));
    }

    // Filtre Diplôme (multi-sélection)
    const diplomes = Array.from(document.getElementById('recruteurDiplomeFilter')?.selectedOptions || []).map(o => o.value);
    if (diplomes.length > 0) {
        candidates = candidates.filter(cv => cv.applicantDiploma && diplomes.some(d => cv.applicantDiploma.toLowerCase().includes(d.toLowerCase())));
    }

    // Filtre Permis (multi-sélection)
    const permis = Array.from(document.getElementById('recruteurPermisFilter')?.selectedOptions || []).map(o => o.value);
    if (permis.length > 0) {
        candidates = candidates.filter(cv => cv.licenseTypes && cv.licenseTypes.some(lt => permis.includes(lt)));
    }

    // Filtre Wilaya (multi-sélection)
    const wilayas = Array.from(document.getElementById('recruteurWilayaFilter')?.selectedOptions || []).map(o => o.value);
    if (wilayas.length > 0) {
        candidates = candidates.filter(cv => cv.wilaya && wilayas.includes(cv.wilaya));
    }

    // Filtre Âge
    const ageMin = parseInt(document.getElementById('recruteurAgeMin')?.value) || 0;
    const ageMax = parseInt(document.getElementById('recruteurAgeMax')?.value) || 999;
    if (ageMin > 0 || ageMax < 999) {
        candidates = candidates.filter(cv => {
            const age = parseInt(cv.applicantAge) || 0;
            return age >= ageMin && age <= ageMax;
        });
    }

    // Filtre Préavis
    const preavis = document.getElementById('recruteurPreavisFilter')?.value || 'all';
    if (preavis !== 'all') {
        candidates = candidates.filter(cv => cv.preavis === preavis);
    }

    // Filtre Expérience
    const expMin = parseInt(document.getElementById('recruteurExperienceMin')?.value) || 0;
    const expMax = parseInt(document.getElementById('recruteurExperienceMax')?.value) || 999;
    if (expMin > 0 || expMax < 999) {
        candidates = candidates.filter(cv => {
            const exp = parseInt(cv.yearsExperience) || 0;
            return exp >= expMin && exp <= expMax;
        });
    }

    // Filtre Date (NOUVEAU) - Show only recent candidatures
    const dateFilter = document.getElementById('recruteurDateFilter')?.value || 'all';
    if (dateFilter !== 'all') {
        const now = new Date();
        let cutoffDate = new Date();

        switch (dateFilter) {
            case 'today':
                cutoffDate.setHours(0, 0, 0, 0);
                break;
            case '7days':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case '30days':
                cutoffDate.setDate(now.getDate() - 30);
                break;
            case '90days':
                cutoffDate.setDate(now.getDate() - 90);
                break;
        }

        candidates = candidates.filter(cv => {
            const appliedDate = cv.appliedAt ? new Date(cv.appliedAt) : (cv.submittedAt ? new Date(cv.submittedAt) : new Date(cv.createdAt || 0));
            return appliedDate >= cutoffDate;
        });
    }

    // Sort by date (newest first) by default
    candidates.sort((a, b) => {
        const dateA = a.appliedAt ? new Date(a.appliedAt) : (a.submittedAt ? new Date(a.submittedAt) : new Date(a.createdAt || 0));
        const dateB = b.appliedAt ? new Date(b.appliedAt) : (b.submittedAt ? new Date(b.submittedAt) : new Date(b.createdAt || 0));
        return dateB - dateA; // Newest first
    });

    // Update count
    const countElement = document.getElementById('recruteurFilterCountNumber');
    if (countElement) countElement.textContent = candidates.length;

    return candidates;
}

function resetRecruteurFilters() {
    document.getElementById('recruteurSearchBar').value = '';
    document.getElementById('recruteurStatusFilter').value = 'all';
    const dateFilter = document.getElementById('recruteurDateFilter');
    if (dateFilter) dateFilter.value = '30days'; // Default to last 30 days
    document.getElementById('recruteurDomaineFilter').selectedIndex = -1;
    document.getElementById('recruteurDiplomeFilter').selectedIndex = -1;
    document.getElementById('recruteurPermisFilter').selectedIndex = -1;
    document.getElementById('recruteurWilayaFilter').selectedIndex = -1;
    document.getElementById('recruteurAgeMin').value = '';
    document.getElementById('recruteurAgeMax').value = '';
    document.getElementById('recruteurPreavisFilter').value = 'all';
    document.getElementById('recruteurExperienceMin').value = '';
    document.getElementById('recruteurExperienceMax').value = '';
    applyRecruteurFilters();
}

function exportRecruteurFilteredCandidates(format) {
    const filtered = getRecruteurFilteredCandidates();
    if (filtered.length === 0) {
        showNotification('Aucune candidature à exporter', 'warning');
        return;
    }

    if (format === 'pdf') {
        exportCandidatesPDF(filtered, 'Recruteur');
    } else if (format === 'excel') {
        exportCandidatesExcel(filtered, 'Recruteur');
    }
}

function exportCandidatesPDF(candidates, dashboard) {
    let content = `AE2I - Export Candidatures ${dashboard}\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n`;
    content += `Total: ${candidates.length} candidature(s)\n\n`;
    content += '='.repeat(80) + '\n\n';

    candidates.forEach((cv, idx) => {
        content += `${idx + 1}. ${cv.applicantName}\n`;
        content += `   Poste: ${cv.jobTitle}\n`;
        content += `   Email: ${cv.applicantEmail}\n`;
        content += `   Téléphone: ${cv.applicantPhone || 'N/A'}\n`;
        content += `   Domaine: ${cv.domaine || 'N/A'}\n`;
        content += `   Diplôme: ${cv.diplome || 'N/A'}\n`;
        content += `   Expérience: ${cv.experience || 'N/A'} ans\n`;
        content += `   Statut: ${cv.processed ? 'Traité' : 'En attente'}\n`;
        content += `   Date: ${new Date(cv.appliedAt).toLocaleDateString()}\n`;
        content += '-'.repeat(80) + '\n\n';
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `AE2I_Candidatures_${dashboard}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();

    showNotification(`Export PDF (${candidates.length} candidatures) réussi`, 'success');
    logActivity(currentUser.username, `Export PDF ${dashboard}: ${candidates.length} candidatures`);
}

function exportCandidatesExcel(candidates, dashboard) {
    let csv = 'Nom,Email,Téléphone,Poste,Domaine,Diplôme,Permis,Wilaya,Âge,Expérience,Préavis,Statut,Date\n';
    candidates.forEach(cv => {
        csv += `"${cv.applicantName}","${cv.applicantEmail}","${cv.applicantPhone || ''}","${cv.jobTitle}",`;
        csv += `"${cv.domaine || ''}","${cv.diplome || ''}","${cv.permis || ''}","${cv.wilaya || ''}",`;
        csv += `"${cv.age || ''}","${cv.experience || ''}","${cv.preavis || ''}",`;
        csv += `"${cv.processed ? 'Traité' : 'En attente'}","${new Date(cv.appliedAt).toLocaleDateString()}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `AE2I_Candidatures_${dashboard}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification(`Export Excel (${candidates.length} candidatures) réussi`, 'success');
    logActivity(currentUser.username, `Export Excel ${dashboard}: ${candidates.length} candidatures`);
}
/* ADD: auto-generate-pdf - Automatic PDF summary generation for each application */
function generateApplicationPdfSummary(application, job) {
    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            console.error('jsPDF library not loaded');
            return null;
        }

        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPos = 20;
        const lineHeight = 7;
        const margin = 15;
        const maxWidth = pageWidth - (margin * 2);

        // Header with company name
        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 86, 179); // Primary color
        pdf.text('AE2I ALGÉRIE', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        pdf.setFontSize(14);
        pdf.text('RÉSUMÉ DE CANDIDATURE', pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;

        // Separator line
        pdf.setDrawColor(0, 86, 179);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;

        // Date and time of submission
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(100, 100, 100);
        const submissionDate = new Date(application.appliedAt);
        const formattedDate = submissionDate.toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const formattedTime = submissionDate.toLocaleTimeString('fr-FR');
        pdf.text(`Date de soumission: ${formattedDate} à ${formattedTime}`, margin, yPos);
        yPos += 8;
        pdf.text(`ID: ${application.id}`, margin, yPos);
        yPos += 12;

        // Function to add a section
        const addSection = (title, content) => {
            if (yPos > pageHeight - 30) {
                pdf.addPage();
                yPos = 20;
            }

            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(0, 86, 179);
            pdf.text(title, margin, yPos);
            yPos += lineHeight;

            pdf.setFontSize(10);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(50, 50, 50);

            if (Array.isArray(content)) {
                content.forEach(line => {
                    if (yPos > pageHeight - 20) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    pdf.text(line, margin + 3, yPos);
                    yPos += lineHeight;
                });
            } else {
                const lines = pdf.splitTextToSize(content, maxWidth - 5);
                lines.forEach(line => {
                    if (yPos > pageHeight - 20) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    pdf.text(line, margin + 3, yPos);
                    yPos += lineHeight;
                });
            }
            yPos += 3;
        };

        // Application details
        addSection('POSTE VISÉ', job.title.fr);
        addSection('INFORMATIONS PERSONNELLES', [
            `Nom complet: ${application.applicantName}`,
            `Prénom: ${application.applicantFirstName}`,
            `Nom: ${application.applicantLastName}`,
            `Email: ${application.applicantEmail}`,
            `Téléphone: ${application.applicantPhone}`,
            `Âge: ${application.applicantAge} ans`,
            `Genre: ${application.gender === 'male' ? 'Homme' : application.gender === 'female' ? 'Femme' : 'Autre'}`
        ]);

        addSection('FORMATION', [
            `Diplôme principal: ${application.applicantDiploma}`,
            application.applicantDiploma2 ? `Diplôme secondaire: ${application.applicantDiploma2}` : ''
        ].filter(Boolean));

        addSection('EXPÉRIENCE PROFESSIONNELLE', [
            `Années d\'expérience: ${application.yearsExperience} ans`,
            `Actuellement en poste: ${application.currentlyEmployed === 'yes' ? 'Oui' : 'Non'}`,
            `Date de dernier emploi: ${application.lastJobDate}`,
            `Type de dernier contrat: ${application.lastContractType === 'cdi' ? 'CDI' : application.lastContractType === 'cdd' ? 'CDD' : 'Autre'}`
        ]);

        addSection('DISPONIBILITÉ', [
            `En préavis: ${application.inNotice ? 'Oui' : 'Non'}`,
            application.inNotice && application.noticeDays ? `Durée du préavis: ${application.noticeDays} jours` : '',
            application.inNotice && application.noticeDaysNegotiable ? `Préavis négociable: Oui` : ''
        ].filter(Boolean));

        addSection('PERMIS DE CONDUIRE & VÉHICULE', [
            `Permis de conduire: ${application.hasDriverLicense === 'yes' ? 'Oui' : 'Non'}`,
            application.hasDriverLicense === 'yes' && application.licenseTypes.length > 0 ?
                `Types de permis: ${application.licenseTypes.join(', ')}` : '',
            application.hasVehicle ? `Véhicule personnel: ${application.hasVehicle === 'yes' ? 'Oui' : 'Non'}` : ''
        ].filter(Boolean));

        addSection('SALAIRE SOUHAITÉ', `${application.expectedSalary} DA`);

        addSection('POSTE SOUHAITÉ', application.applicantPosition || 'Non spécifié');

        // Footer
        yPos = pageHeight - 15;
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Document généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, yPos, { align: 'center' });
        pdf.text('AE2I Algérie - Confidentiel', pageWidth / 2, yPos + 5, { align: 'center' });

        // Convert to base64
        const pdfBase64 = pdf.output('dataurlstring');

        return {
            content: pdfBase64,
            filename: `Resume_${application.applicantLastName}_${application.id}.pdf`,
            generatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error generating PDF summary:', error);
        return null;
    }
}

/* ADD: pdf-link-with-cv - Function to download PDF summary */
function downloadPdfSummary(applicationId) {
    const application = siteData.cvDatabase.find(cv => cv.id === applicationId);
    if (!application || !application.pdfSummary) {
        showNotification('PDF résumé non disponible', 'error');
        return;
    }

    try {
        const link = document.createElement('a');
        link.href = application.pdfSummary.content;
        link.download = application.pdfSummary.filename;
        link.click();

        showNotification('Téléchargement du PDF résumé...', 'success');
        logActivity(currentUser.username, `Téléchargement PDF résumé: ${application.applicantName}`);
    } catch (error) {
        console.error('Error downloading PDF summary:', error);
        showNotification('Erreur lors du téléchargement', 'error');
    }
}

function openRecruteurJobModal() {
    currentEditingIndex = -1;
    currentEditingType = 'job';
    openModal('jobModal');
}

function editRecruteurJob(jobId) {
    const jobIndex = siteData.jobs.findIndex(j => j.id === jobId && j.createdBy === currentUser.username);
    if (jobIndex !== -1) {
        editJob(jobIndex);
    }
}

function toggleRecruteurJob(jobId) {
    const jobIndex = siteData.jobs.findIndex(j => j.id === jobId && j.createdBy === currentUser.username);
    if (jobIndex !== -1) {
        toggleJob(jobIndex);
        renderRecruteurContent();
    }
}

function deleteRecruteurJob(jobId) {
    const jobIndex = siteData.jobs.findIndex(j => j.id === jobId && j.createdBy === currentUser.username);
    if (jobIndex !== -1) {
        deleteJob(jobIndex);
        renderRecruteurContent();
    }
}

function executeLecteurScript() {
    console.log('👁️ Executing lecteur dashboard script');

    // Load candidatures from Firebase if in Firebase mode
    if (APP_MODE === 'FIREBASE' && window.firebaseHelper) {
        loadCandidaturesFromFirebase().then(() => {
            renderLecteurContent();
            setupLecteurInteractions(); // Setup filter interactions
        }).catch(err => {
            console.error('Error loading candidatures:', err);
            renderLecteurContent();
            setupLecteurInteractions(); // Setup filter interactions
        });
    } else {
        renderLecteurContent();
        setupLecteurInteractions(); // Setup filter interactions
    }
}

function renderLecteurContent() {
    // Update lecteur stats (lecture seule)
    const totalJobs = siteData.jobs.filter(j => j.active).length;
    const totalApplications = siteData.cvDatabase ? siteData.cvDatabase.length : 0;
    const processedApplications = siteData.cvDatabase ? siteData.cvDatabase.filter(cv => cv.processed).length : 0;
    const pendingApplications = totalApplications - processedApplications;

    document.getElementById('lecteurTotalJobs').textContent = totalJobs;
    document.getElementById('lecteurTotalApplications').textContent = totalApplications;
    document.getElementById('lecteurProcessed').textContent = processedApplications;
    document.getElementById('lecteurPending').textContent = pendingApplications;

    // Render CV database (read-only)
    renderLecteurCvDatabase();

    // Render advanced stats
    renderLecteurAdvancedStats();

    // Initialize alerts (function removed, keeping for compatibility)
    // initializeLecteurAlerts();
}

/* FIX: uniformize-filter-keys */
/* ADD: apply-lecteur-filters */
function applyLecteurFilters() {
    renderLecteurCvDatabase();
}

function getLecteurFilteredCandidates() {
    let candidates = siteData.cvDatabase || [];

    // Barre de recherche - recherche dans plusieurs champs
    const searchTerm = document.getElementById('lecteurSearchBar')?.value.toLowerCase() || '';
    if (searchTerm) {
        candidates = candidates.filter(cv =>
            cv.applicantName?.toLowerCase().includes(searchTerm) ||
            cv.applicantFirstName?.toLowerCase().includes(searchTerm) ||
            cv.applicantLastName?.toLowerCase().includes(searchTerm) ||
            cv.applicantEmail?.toLowerCase().includes(searchTerm) ||
            cv.applicantPhone?.toLowerCase().includes(searchTerm) ||
            cv.jobTitle?.toLowerCase().includes(searchTerm) ||
            cv.diplome?.toLowerCase().includes(searchTerm) ||
            cv.domaine?.toLowerCase().includes(searchTerm) ||
            cv.applicantDiploma?.toLowerCase().includes(searchTerm) ||
            cv.wilaya?.toLowerCase().includes(searchTerm)
        );
    }

    // Filtre Statut
    const status = document.getElementById('lecteurStatusFilter')?.value || 'all';
    if (status === 'pending') candidates = candidates.filter(cv => !cv.processed);
    else if (status === 'processed') candidates = candidates.filter(cv => cv.processed);

    // Filtre Domaine (multi-sélection)
    const domaines = Array.from(document.getElementById('lecteurDomaineFilter')?.selectedOptions || []).map(o => o.value);
    if (domaines.length > 0) {
        candidates = candidates.filter(cv => cv.domaine && domaines.some(d => cv.domaine.toLowerCase().includes(d.toLowerCase())));
    }

    // Filtre Diplôme (multi-sélection)
    const diplomes = Array.from(document.getElementById('lecteurDiplomeFilter')?.selectedOptions || []).map(o => o.value);
    if (diplomes.length > 0) {
        candidates = candidates.filter(cv => cv.applicantDiploma && diplomes.some(d => cv.applicantDiploma.toLowerCase().includes(d.toLowerCase())));
    }

    // Filtre Permis (multi-sélection)
    const permis = Array.from(document.getElementById('lecteurPermisFilter')?.selectedOptions || []).map(o => o.value);
    if (permis.length > 0) {
        candidates = candidates.filter(cv => cv.licenseTypes && cv.licenseTypes.some(lt => permis.includes(lt)));
    }

    // Filtre Wilaya (multi-sélection)
    const wilayas = Array.from(document.getElementById('lecteurWilayaFilter')?.selectedOptions || []).map(o => o.value);
    if (wilayas.length > 0) {
        candidates = candidates.filter(cv => cv.wilaya && wilayas.includes(cv.wilaya));
    }

    // Filtre Âge
    const ageMin = parseInt(document.getElementById('lecteurAgeMin')?.value) || 0;
    const ageMax = parseInt(document.getElementById('lecteurAgeMax')?.value) || 999;
    if (ageMin > 0 || ageMax < 999) {
        candidates = candidates.filter(cv => {
            const age = parseInt(cv.applicantAge) || 0;
            return age >= ageMin && age <= ageMax;
        });
    }

    // Filtre Préavis
    const preavis = document.getElementById('lecteurPreavisFilter')?.value || 'all';
    if (preavis !== 'all') {
        candidates = candidates.filter(cv => cv.preavis === preavis);
    }

    // Filtre Expérience
    const expMin = parseInt(document.getElementById('lecteurExperienceMin')?.value) || 0;
    const expMax = parseInt(document.getElementById('lecteurExperienceMax')?.value) || 999;
    if (expMin > 0 || expMax < 999) {
        candidates = candidates.filter(cv => {
            const exp = parseInt(cv.yearsExperience) || 0;
            return exp >= expMin && exp <= expMax;
        });
    }

    // Update count
    const countElement = document.getElementById('lecteurFilterCountNumber');
    if (countElement) countElement.textContent = candidates.length;

    return candidates;
}

function resetLecteurFilters() {
    document.getElementById('lecteurSearchBar').value = '';
    document.getElementById('lecteurStatusFilter').value = 'all';
    document.getElementById('lecteurDomaineFilter').selectedIndex = -1;
    document.getElementById('lecteurDiplomeFilter').selectedIndex = -1;
    document.getElementById('lecteurPermisFilter').selectedIndex = -1;
    document.getElementById('lecteurWilayaFilter').selectedIndex = -1;
    document.getElementById('lecteurAgeMin').value = '';
    document.getElementById('lecteurAgeMax').value = '';
    document.getElementById('lecteurPreavisFilter').value = 'all';
    document.getElementById('lecteurExperienceMin').value = '';
    document.getElementById('lecteurExperienceMax').value = '';
    applyLecteurFilters();
}

function exportLecteurFilteredCandidates(format) {
    const filtered = getLecteurFilteredCandidates();
    if (filtered.length === 0) {
        showNotification('Aucune candidature à exporter', 'warning');
        return;
    }

    if (format === 'pdf') {
        exportCandidatesPDF(filtered, 'Lecteur');
    } else if (format === 'excel') {
        exportCandidatesExcel(filtered, 'Lecteur');
    }
}

function renderLecteurCvDatabase() {
    const container = document.getElementById('lecteurCvDatabase');
    if (container) {
        container.innerHTML = '';

        // Use filtered candidates from getLecteurFilteredCandidates()
        const filteredApplications = getLecteurFilteredCandidates();

        if (filteredApplications && filteredApplications.length > 0) {
            filteredApplications.forEach(cv => {
                const cvItem = document.createElement('div');
                cvItem.style.cssText = `
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%); 
                    border: 2px solid var(--border); 
                    border-radius: var(--border-radius-lg); 
                    padding: 20px; 
                    margin-bottom: 16px;
                    transition: var(--transition);
                    backdrop-filter: blur(5px);
                    box-shadow: var(--shadow-md);
                `;
                cvItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <h4 style="font-weight: 800; font-size: var(--font-size-lg); display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-user-tie" style="color: var(--info);"></i>
                            ${cv.applicantName}
                        </h4>
                        <span class="status-badge ${cv.processed ? 'status-processed' : 'status-pending'}">
                            <i class="fas fa-${cv.processed ? 'check' : 'clock'}"></i>
                            ${cv.processed ? 'Traité' : 'En attente'}
                        </span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(800px, 1fr)); gap: 12px; margin-bottom: 16px;">
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>Poste:</strong><br>
                            <span style="color: var(--primary); font-weight: 600;">${cv.jobTitle}</span>
                        </div>
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>Email:</strong><br>
                            <span style="color: var(--text-light);">${cv.applicantEmail}</span>
                        </div>
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>Téléphone:</strong><br>
                            <span style="color: var(--text-light);">${cv.applicantPhone || 'Non renseigné'}</span>
                        </div>
                        <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--border-radius);">
                            <strong>Date:</strong><br>
                            <span style="color: var(--text-light);">${new Date(cv.appliedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    ${cv.expectedSalary ? `
                        <div style="background: rgba(29, 53, 87, 0.08); padding: 16px; border-radius: var(--border-radius-lg); margin-bottom: 16px; border-left: 4px solid var(--info);">
                            <strong style="color: var(--info);">Informations candidat:</strong>
                            <div style="margin-top: 8px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; font-size: var(--font-size-sm);">
                                <div><strong>Salaire souhaité:</strong> ${cv.expectedSalary} DA</div>
                                <div><strong>En poste:</strong> ${cv.currentlyEmployed === 'yes' ? 'Oui' : 'Non'}</div>
                                <div><strong>Dernier poste:</strong> ${cv.lastJobDate}</div>
                                <div><strong>Type contrat:</strong> ${cv.lastContractType}</div>
                            </div>
                        </div>
                    ` : ''}
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                        <!-- ADD: auto-generate-pdf - PDF Summary download button for Lecteur dashboard -->
                        <button class="btn btn-sm btn-accent functional-btn" onclick="downloadApplicationPdfSummary(siteData.cvDatabase.find(c => c.id === ${cv.id}))" style="background: linear-gradient(135deg, #00a896 0%, #028090 100%); color: white; border: none;">
                            <i class="fas fa-file-pdf"></i> Résumé PDF
                        </button>
                        <button class="btn btn-sm btn-outline functional-btn" onclick="previewCV(${cv.id})">
                            <i class="fas fa-eye"></i> Consulter CV
                        </button>
                        <button class="btn btn-sm btn-warning functional-btn" onclick="downloadCV(${cv.id})">
                            <i class="fas fa-download"></i> Télécharger CV
                        </button>
                        <div style="background: rgba(233, 196, 106, 0.1); padding: 8px 12px; border-radius: var(--border-radius-sm); font-size: var(--font-size-xs); color: var(--warning); font-weight: 600;">
                            <i class="fas fa-lock"></i> Accès lecture seule
                        </div>
                    </div>
                `;

                cvItem.addEventListener('mouseenter', function () {
                    this.style.transform = 'translateY(-3px)';
                    this.style.boxShadow = 'var(--shadow-lg)';
                    this.style.borderColor = 'var(--info)';
                });

                cvItem.addEventListener('mouseleave', function () {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = 'var(--shadow-md)';
                    this.style.borderColor = 'var(--border)';
                });

                container.appendChild(cvItem);
            });

            if (filteredApplications.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px; background: var(--bg-alt); border-radius: var(--border-radius-lg);">Aucun CV trouvé</p>';
            }
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px; background: var(--bg-alt); border-radius: var(--border-radius-lg);">Aucun CV disponible</p>';
        }
    }
}

function setupLecteurInteractions() {
    // Update user info
    document.getElementById('lecteurCurrentUser').textContent = currentUser.username;

    // Setup candidature filter
    const candidatureFilter = document.getElementById('lecteurCandidatureFilter');
    if (candidatureFilter) {
        candidatureFilter.addEventListener('change', function () {
            renderLecteurCvDatabase();
        });
    }
}

function exportLecteurCVs() {
    const filter = document.getElementById('lecteurCandidatureFilter') ? document.getElementById('lecteurCandidatureFilter').value : 'all';
    let filteredApplications = siteData.cvDatabase || [];

    if (filter === 'pending') {
        filteredApplications = filteredApplications.filter(cv => !cv.processed);
    } else if (filter === 'processed') {
        filteredApplications = filteredApplications.filter(cv => cv.processed);
    }

    if (filteredApplications.length === 0) {
        showNotification('Aucun CV à exporter', 'warning');
        return;
    }

    let csv = 'Nom,Email,Téléphone,Poste,Date candidature,Statut,Salaire souhaité,En poste,Dernier poste,Type contrat\n';
    filteredApplications.forEach(cv => {
        csv += `"${cv.applicantName}","${cv.applicantEmail}","${cv.applicantPhone || ''}","${cv.jobTitle}","${new Date(cv.appliedAt).toLocaleDateString()}","${cv.processed ? 'Traité' : 'En attente'}","${cv.expectedSalary || ''}","${cv.currentlyEmployed || ''}","${cv.lastJobDate || ''}","${cv.lastContractType || ''}"\n`;
    });

    const csvBlob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(csvBlob);
    link.download = `ae2i_cv_lecteur_${filter}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification(`${filteredApplications.length} CV exportés (${filter})`, 'success');
    logActivity(currentUser.username, `Export CV lecteur: ${filteredApplications.length} CV (${filter})`);
}

/* ADD: auto-generate-pdf - Generate a text-based PDF summary of application data */
function generateApplicationPdfSummary(application, job) {
    const lang = siteData.language || 'fr';
    const title = lang === 'en' ? 'Application Summary' : 'Résumé de Candidature';
    const date = new Date(application.appliedAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Build PDF content as structured data
    const pdfContent = {
        title: title,
        generatedAt: date,
        sections: [
            {
                heading: lang === 'en' ? 'Personal Information' : 'Informations Personnelles',
                fields: [
                    { label: lang === 'en' ? 'Last Name' : 'Nom', value: application.applicantLastName },
                    { label: lang === 'en' ? 'First Name' : 'Prénom', value: application.applicantFirstName },
                    { label: 'Email', value: application.applicantEmail },
                    { label: lang === 'en' ? 'Phone' : 'Téléphone', value: application.applicantPhone },
                    { label: lang === 'en' ? 'Age' : 'Âge', value: application.applicantAge },
                    { label: lang === 'en' ? 'Gender' : 'Genre', value: application.gender === 'male' ? (lang === 'en' ? 'Male' : 'Homme') : (lang === 'en' ? 'Female' : 'Femme') }
                ]
            },
            {
                heading: lang === 'en' ? 'Education & Experience' : 'Formation & Expérience',
                fields: [
                    { label: lang === 'en' ? 'Diploma' : 'Diplôme', value: application.applicantDiploma },
                    { label: lang === 'en' ? 'Specialization' : 'Spécialité', value: application.applicantDiploma2 || (lang === 'en' ? 'N/A' : 'N/D') },
                    { label: lang === 'en' ? 'Years of Experience' : 'Années d\'expérience', value: application.yearsExperience },
                    { label: lang === 'en' ? 'Current Position' : 'Poste actuel', value: application.applicantPosition || (lang === 'en' ? 'N/A' : 'N/D') }
                ]
            },
            {
                heading: lang === 'en' ? 'Employment Status' : 'Statut Professionnel',
                fields: [
                    { label: lang === 'en' ? 'Currently Employed' : 'Actuellement en poste', value: application.currentlyEmployed === 'yes' ? (lang === 'en' ? 'Yes' : 'Oui') : 'Non' },
                    { label: lang === 'en' ? 'Last Job Date' : 'Dernier poste', value: application.lastJobDate },
                    { label: lang === 'en' ? 'Last Contract Type' : 'Type de dernier contrat', value: application.lastContractType.toUpperCase() },
                    { label: lang === 'en' ? 'In Notice Period' : 'En préavis', value: application.inNotice ? (lang === 'en' ? 'Yes' : 'Oui') : 'Non' }
                ]
            }
        ]
    };

    // Add notice period details if applicable
    if (application.inNotice && application.noticeDays) {
        pdfContent.sections[2].fields.push({
            label: lang === 'en' ? 'Notice Period (days)' : 'Préavis (jours)',
            value: application.noticeDaysNegotiable ?
                `${application.noticeDays} (${lang === 'en' ? 'Negotiable' : 'Négociable'})` :
                application.noticeDays
        });
    }

    // Add driver license section
    pdfContent.sections.push({
        heading: lang === 'en' ? 'Driver License & Vehicle' : 'Permis de Conduire & Véhicule',
        fields: [
            { label: lang === 'en' ? 'Has Driver License' : 'Possède un permis', value: application.hasDriverLicense === 'yes' ? (lang === 'en' ? 'Yes' : 'Oui') : 'Non' }
        ]
    });

    if (application.hasDriverLicense === 'yes') {
        pdfContent.sections[3].fields.push(
            { label: lang === 'en' ? 'License Types' : 'Types de permis', value: application.licenseTypes && application.licenseTypes.length > 0 ? application.licenseTypes.join(', ') : (lang === 'en' ? 'N/A' : 'N/D') },
            { label: lang === 'en' ? 'Has Vehicle' : 'Possède un véhicule', value: application.hasVehicle === 'yes' ? (lang === 'en' ? 'Yes' : 'Oui') : application.hasVehicle === 'no' ? 'Non' : (lang === 'en' ? 'N/A' : 'N/D') }
        );
    }

    // Add salary expectation
    pdfContent.sections.push({
        heading: lang === 'en' ? 'Compensation' : 'Rémunération',
        fields: [
            { label: lang === 'en' ? 'Expected Salary (DA)' : 'Salaire souhaité (DA)', value: Number(application.expectedSalary).toLocaleString() }
        ]
    });

    // Add job information
    pdfContent.sections.push({
        heading: lang === 'en' ? 'Position Applied' : 'Poste Visé',
        fields: [
            { label: lang === 'en' ? 'Job Title' : 'Titre du poste', value: job.title[lang] || job.title.fr },
            { label: lang === 'en' ? 'Contract Type' : 'Type de contrat', value: job.type.toUpperCase() },
            { label: lang === 'en' ? 'Location' : 'Localisation', value: job.location }
        ]
    });

    return pdfContent;
}
/* ADD: auto-generate-pdf - Download PDF summary as formatted text file */
function downloadApplicationPdfSummary(application) {
    if (!application.pdfSummary) {
        showNotification('PDF résumé non disponible', 'warning');
        return;
    }

    const pdf = application.pdfSummary;
    const lang = siteData.language || 'fr';
    let textContent = `${pdf.title}\n`;
    textContent += `${'='.repeat(pdf.title.length)}\n\n`;
    textContent += `${lang === 'en' ? 'Generated on' : 'Généré le'}: ${pdf.generatedAt}\n`;
    textContent += `${lang === 'en' ? 'Candidate' : 'Candidat'}: ${application.applicantName}\n\n`;

    pdf.sections.forEach(section => {
        textContent += `\n${section.heading}\n`;
        textContent += `${'-'.repeat(section.heading.length)}\n`;
        section.fields.forEach(field => {
            textContent += `${field.label}: ${field.value}\n`;
        });
    });

    textContent += `\n\n${lang === 'en' ? 'CV File' : 'Fichier CV'}: ${application.applicantCV.name}\n`;
    textContent += `\n${lang === 'en' ? 'Document generated by AE2I Recruitment System' : 'Document généré par le Système de Recrutement AE2I'}`;

    /* FIX: pdf-link-with-cv - Use real PDF instead of TXT */
    if (application.pdfSummary.content) {
        const link = document.createElement('a');
        link.href = application.pdfSummary.content;
        link.download = application.pdfSummary.filename;
        link.click();
        showNotification('Téléchargement du PDF résumé...', 'success');
    } else {
        // Fallback to TXT if PDF not available
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Resume_${application.applicantLastName}_${application.applicantFirstName}_${application.id}.txt`;
        link.click();
        showNotification('PDF non disponible, téléchargement TXT', 'warning');
    }

    logActivity(currentUser.username, `Téléchargement PDF résumé: ${application.applicantName}`);
}
// Setup application form avec nouvelles questions obligatoires
document.addEventListener('DOMContentLoaded', function () {
    const applicationForm = document.getElementById('applicationForm');
    const closeApplicationModal = document.getElementById('closeApplicationModal');

    /* FIX: Setup driver license radio buttons event listeners */
    const licenseRadios = document.querySelectorAll('input[name="hasDriverLicense"]');
    console.log('Setting up driver license radio buttons, found:', licenseRadios.length);

    licenseRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            console.log('Radio changed, value:', this.value);
            if (window.toggleDriverLicenseFields) {
                window.toggleDriverLicenseFields(this.value);
            } else {
                console.error('toggleDriverLicenseFields function not found!');
            }
        });
    });

    if (closeApplicationModal) {
        closeApplicationModal.addEventListener('click', function () {
            closeModal('applicationModal');
        });
    }

    /* FIX: prevent-double-submit - Enhanced form submission handler with double-submit prevention */
    let isSubmittingApplication = false;

    if (applicationForm) {
        applicationForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent any bubbling that might cause navigation

            console.log('📝 [FORM SUBMIT] Application form submitted');
            console.log('📝 [FORM SUBMIT] Current URL:', window.location.href);

            /* FIX: prevent-double-submit - Check if already processing */
            if (isSubmittingApplication) {
                console.log('⚠️ [FORM SUBMIT] Form submission already in progress...');
                return;
            }

            // Vérifier le consentement
            if (!checkConsentRequired('forms')) {
                document.getElementById('consentRequired').style.display = 'block';
                showNotification('Consentement requis pour soumettre une candidature', 'warning');
                return;
            }

            const jobId = parseInt(this.dataset.jobId);
            const job = siteData.jobs.find(j => j.id == jobId);

            if (!job) {
                showNotification('Erreur: Offre non trouvée', 'error');
                return;
            }

            /* ADD: candidature-validation - Collect all required fields including new ones */
            const applicantLastName = document.getElementById('applicantLastName').value;
            const applicantFirstName = document.getElementById('applicantFirstName').value;
            const applicantName = `${applicantFirstName} ${applicantLastName}`;
            const applicantEmail = document.getElementById('applicantEmail').value;
            const applicantPhone = document.getElementById('applicantPhone').value;
            const applicantPosition = document.getElementById('applicantPosition').value;
            const applicantCV = document.getElementById('applicantCV').files[0];
            const applicantDiploma = document.getElementById('applicantDiploma').value;
            const applicantAge = document.getElementById('applicantAge').value;
            const applicantDiploma2 = document.getElementById('applicantDiploma2').value;
            const expectedSalary = document.getElementById('expectedSalary').value;
            const yearsExperience = document.getElementById('yearsExperience').value;
            const currentlyEmployed = document.querySelector('input[name="currentlyEmployed"]:checked')?.value;
            const lastJobDate = document.getElementById('lastJobDate').value;
            const lastContractType = document.querySelector('input[name="lastContractType"]:checked')?.value;
            const hasDriverLicense = document.querySelector('input[name="hasDriverLicense"]:checked')?.value;
            const gender = document.querySelector('input[name="gender"]:checked')?.value;

            /* ADD: preavis-negociable-visual - Collect notice period data */
            const inNotice = document.getElementById('inNotice').checked;
            const noticeDays = document.getElementById('noticeDays').value;
            const noticeDaysNegotiable = document.getElementById('noticeDaysNegotiable').checked;

            /* ADD: candidature-validation - Collect driver license details */
            let licenseTypes = [];
            if (hasDriverLicense === 'yes') {
                document.querySelectorAll('input[name="licenseTypes"]:checked').forEach(cb => {
                    licenseTypes.push(cb.value);
                });
            }
            const hasVehicle = document.querySelector('input[name="hasVehicle"]:checked')?.value;

            // ADD: candidature-validation - Comprehensive validation of all required fields
            if (!applicantFirstName || !applicantLastName || !applicantEmail || !applicantPhone || !applicantCV ||
                !applicantDiploma || !applicantAge || !expectedSalary || !yearsExperience ||
                !currentlyEmployed || !lastJobDate || !lastContractType || !hasDriverLicense || !gender) {
                showNotification('Veuillez remplir tous les champs obligatoires (*)', 'error');
                return;
            }

            /* FIX: prevent-double-submit - Set processing flag and show loading message */
            isSubmittingApplication = true;
            const submitBtn = applicationForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span data-fr="Envoi en cours..." data-en="Submitting..." data-ar="Envoi en cours...">Envoi en cours...</span>';

            try {
                // Créer l'objet application
                const application = {
                    id: Date.now(),
                    jobId: jobId,
                    jobTitle: job.title.fr,
                    applicantName: applicantName,
                    applicantFirstName: applicantFirstName,
                    applicantLastName: applicantLastName,
                    applicantEmail: applicantEmail,
                    applicantPhone: applicantPhone,
                    applicantPosition: applicantPosition,
                    applicantDiploma: applicantDiploma,
                    applicantDiploma2: applicantDiploma2,
                    applicantAge: applicantAge,
                    gender: gender,
                    applicantCV: {
                        name: applicantCV.name,
                        size: applicantCV.size,
                        type: applicantCV.type,
                        // Ne pas inclure content ici pour le moment
                    },
                    expectedSalary: expectedSalary,
                    yearsExperience: yearsExperience,
                    currentlyEmployed: currentlyEmployed,
                    inNotice: inNotice,
                    noticeDays: noticeDays || null,
                    noticeDaysNegotiable: noticeDaysNegotiable,
                    lastJobDate: lastJobDate,
                    lastContractType: lastContractType,
                    hasDriverLicense: hasDriverLicense,
                    licenseTypes: licenseTypes,
                    hasVehicle: hasVehicle || null,
                    appliedAt: new Date().toISOString(),
                    processed: false,
                    consentGiven: consentStatus.accepted,
                    pdfSummary: null
                };

                // Lire le fichier CV en base64 pour le stockage local
                const reader = new FileReader();

                reader.onload = async function (e) {
                    console.log('📄 [FORM SUBMIT] CV file read successfully');
                    console.log('📄 [FORM SUBMIT] File size:', applicantCV.size, 'bytes');
                    console.log('📄 [FORM SUBMIT] Current URL:', window.location.href);
                    try {
                        // Ajouter le contenu base64 pour le stockage local
                        application.applicantCV.content = e.target.result;
                        application.pdfSummary = generateApplicationPdfSummary(application, job);
                        console.log('📄 [FORM SUBMIT] PDF summary generated');

                        let r2Result = null;
                        let firebaseResult = null;

                        // ========== MODE FIREBASE ==========
                        if (APP_MODE === 'FIREBASE' && typeof window.firebaseHelper !== 'undefined') {
                            console.log('☁️ [FORM SUBMIT] Firebase mode detected - starting R2 upload...');
                            // 1. Upload le CV vers Cloudflare R2
                            showNotification('Upload du CV vers le cloud...', 'info');
                            r2Result = await uploadCVToR2(applicantCV, applicantName, job.title.fr);
                            console.log('☁️ [FORM SUBMIT] R2 upload completed:', r2Result.success ? '✅ SUCCESS' : '❌ FAILED');
                            if (r2Result.success) {
                                console.log('☁️ [FORM SUBMIT] R2 URL:', r2Result.url);
                            } else {
                                console.error('☁️ [FORM SUBMIT] R2 upload error:', r2Result.error);
                            }

                            if (r2Result.success) {
                                console.log('🔥 [FORM SUBMIT] Saving application to Firebase...');
                                // 2. Sauvegarder les métadonnées dans Firebase
                                showNotification('Sauvegarde des données...', 'info');
                                firebaseResult = await saveApplicationToFirebase(application, r2Result.url);
                                console.log('🔥 [FORM SUBMIT] Firebase save completed:', firebaseResult.success ? '✅ SUCCESS' : '❌ FAILED');
                                if (firebaseResult.success) {
                                    console.log('🔥 [FORM SUBMIT] Firebase ID:', firebaseResult.firebaseId);
                                } else {
                                    console.error('🔥 [FORM SUBMIT] Firebase save error:', firebaseResult.error);
                                }
                            }
                        } else {
                            console.log('💾 [FORM SUBMIT] Local mode - skipping R2/Firebase');
                        }

                        // ========== MODE LOCAL (toujours sauvegarder localement) ==========
                        // Sauvegarder localement même en mode Firebase pour backup
                        if (!siteData.cvDatabase) siteData.cvDatabase = [];

                        // Ajouter l'URL R2 si upload réussi
                        if (r2Result && r2Result.success) {
                            // FIX: Reconstruct correct R2 URL from path
                            // The worker might return wrong URL, so we build it ourselves
                            if (r2Result.path) {
                                application.cvR2Url = `${R2_CONFIG.publicUrl}/${r2Result.path}`;
                                application.cvR2Path = r2Result.path;
                                console.log('🔧 [FIX] Reconstructed R2 URL:', application.cvR2Url);
                            } else {
                                // Fallback to worker's URL if no path
                                application.cvR2Url = r2Result.url;
                                application.cvR2Path = r2Result.path;
                            }
                        }

                        // Ajouter l'ID Firebase si sauvegarde réussie
                        if (firebaseResult && firebaseResult.success) {
                            application.firebaseId = firebaseResult.firebaseId;
                        }

                        siteData.cvDatabase.push(application);

                        // Sauvegarder localement
                        if (saveSiteData()) {
                            let successMessage = '';

                            if (APP_MODE === 'FIREBASE' && r2Result && r2Result.success && firebaseResult && firebaseResult.success) {
                                successMessage = siteData.language === 'en' ?
                                    `✅ Thank you ${applicantName}! Your application has been submitted and saved in the cloud.` :
                                    `✅ Merci ${applicantName}! Votre candidature a été soumise et sauvegardée dans le cloud.`;
                            } else {
                                successMessage = siteData.language === 'en' ?
                                    `✅ Thank you ${applicantName}! Your application has been submitted successfully.` :
                                    `✅ Merci ${applicantName}! Votre candidature a été soumise avec succès.`;
                            }

                            console.log('✅ [FORM SUBMIT] Application saved successfully!');
                            console.log('✅ [FORM SUBMIT] Application ID:', application.id);
                            console.log('✅ [FORM SUBMIT] Final URL:', window.location.href);
                            showNotification(successMessage, 'success');

                            // Notification pour admin et recruteurs connectés
                            if (currentUser.role === 'admin' || currentUser.role === 'recruiter') {
                                setTimeout(() => {
                                    showCandidateNotification(applicantName, job.title.fr, application.id);
                                }, 2000);
                            }

                            console.log('🔄 [FORM SUBMIT] Resetting form and closing modal...');
                            applicationForm.reset();
                            closeModal('applicationModal');
                            console.log('✅ [FORM SUBMIT] Form reset and modal closed - NO PAGE RELOAD');
                            console.log('📊 [FORM SUBMIT] All logs above should still be visible');
                            logActivity('applicant', `Candidature soumise pour ${job.title.fr} par ${applicantName}`);

                        } else {
                            throw new Error('Erreur lors de la sauvegarde locale');
                        }

                    } catch (error) {
                        console.error('❌ Error in submission process:', error);

                        // Afficher un message d'erreur approprié
                        if (APP_MODE === 'FIREBASE' && error.message.includes('Firebase') || error.message.includes('R2')) {
                            showNotification('Erreur de connexion au cloud - Sauvegarde locale effectuée', 'warning');
                            // Forcer la sauvegarde locale
                            if (saveSiteData()) {
                                showNotification('Candidature sauvegardée localement', 'info');
                            }
                        } else {
                            showNotification('Erreur: ' + error.message, 'error');
                        }

                    } finally {
                        // Réinitialiser le bouton dans tous les cas
                        isSubmittingApplication = false;
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                    }
                };

                reader.onerror = function () {
                    console.error('File read error');
                    showNotification('Erreur lors de la lecture du fichier CV', 'error');
                    isSubmittingApplication = false;
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                };

                reader.readAsDataURL(applicantCV);

            } catch (error) {
                console.error('❌ General submission error:', error);
                showNotification('Erreur lors de la soumission: ' + error.message, 'error');
                isSubmittingApplication = false;
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});
/* === UTILITY FUNCTIONS FOR FIREBASE COMPATIBILITY === */

// Fonction pour vérifier si Firebase est disponible
function isFirebaseAvailable() {
    return typeof window.firebaseHelper !== 'undefined' && APP_MODE === 'FIREBASE';
}

// Fonction pour basculer entre les modes
function toggleAppMode(mode) {
    if (mode === 'LOCAL' || mode === 'FIREBASE') {
        // Vous pouvez stocker cette préférence dans localStorage
        localStorage.setItem('ae2i_app_mode', mode);
        showNotification(`Mode ${mode} activé`, 'info');
        // Recharger la page pour appliquer les changements
        setTimeout(() => location.reload(), 1500);
    }
}

// Fonction pour initialiser Firebase si disponible
function initializeFirebaseIfAvailable() {
    if (typeof window.firebaseHelper !== 'undefined') {
        console.log('🔥 Firebase helper disponible');

        // Écouter les changements d'authentification
        window.firebaseHelper.onAuthChange((user) => {
            if (user) {
                console.log('Utilisateur Firebase connecté:', user.email);
                // Synchroniser le rôle réel depuis Firestore
                hydrateUserFromFirestore(user).then((hydrated) => {
                    currentUser = hydrated;
                    updateLoginStatus();
                    updateLoginButton();
                    showNotification(`Connecté en tant que ${hydrated.email}`, 'success');
                }).catch((err) => {
                    console.error('Erreur hydration user:', err);
                    currentUser = {
                        username: user.email,
                        email: user.email,
                        role: 'lecteur',
                        isLoggedIn: true,
                        uid: user.uid
                    };
                    updateLoginStatus();
                    updateLoginButton();
                });
            } else {
                console.log('Aucun utilisateur Firebase connecté');
            }
        });

        // Charger les données depuis Firebase si en mode FIREBASE
        if (APP_MODE === 'FIREBASE') {
            loadDataFromFirebase();
        }
    }
}

// Charger les données depuis Firebase
async function loadDataFromFirebase() {
    if (!isFirebaseAvailable()) return;

    try {
        console.log('📡 Chargement des données depuis Firebase...');

        // Charger les paramètres
        const settingsResult = await window.firebaseHelper.getDocument('settings', 'main');
        if (settingsResult.success) {
            // Fusionner les settings avec ceux existants
            siteData.settings = { ...siteData.settings, ...settingsResult.data };
            console.log('✅ Settings chargés depuis Firebase');
        }

        // Charger les offres d'emploi
        const jobsResult = await window.firebaseHelper.getCollection(
            'jobs',
            [window.firebaseServices.where('active', '==', true)]
        );
        if (jobsResult.success && jobsResult.data.length > 0) {
            siteData.jobs = jobsResult.data;
            console.log('✅ Jobs chargés depuis Firebase:', siteData.jobs.length);
        }

        // Charger les services
        const servicesResult = await window.firebaseHelper.getCollection(
            'services',
            [window.firebaseServices.where('active', '==', true)]
        );
        if (servicesResult.success && servicesResult.data.length > 0) {
            siteData.services = servicesResult.data;
            console.log('✅ Services chargés depuis Firebase:', siteData.services.length);
        }

        showNotification('Données chargées depuis le cloud', 'success');

    } catch (error) {
        console.error('❌ Erreur chargement Firebase:', error);
        showNotification('Utilisation des données locales', 'warning');
    }
}

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', function () {
    initializeFirebaseIfAvailable();
});
function setupLecteurInteractions() {
    // Update user info
    document.getElementById('lecteurCurrentUser').textContent = currentUser.username;

    // Setup candidature filter
    const candidatureFilter = document.getElementById('lecteurCandidatureFilter');
    if (candidatureFilter) {
        candidatureFilter.addEventListener('change', function () {
            renderLecteurCvDatabase();
        });
    }
}

// Initialize website
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Initializing AE2I Ultra-Professional Website...');

    // Load saved data
    loadSiteData().catch(err => console.error('Error loading site data:', err));

    // Initialize all systems
    initializeWebsite();

    // Setup page-specific functionality
    executeHomeScript();

    // Setup form handlers
    setupApplicationForm();

    // Setup file uploads
    setupFileUploads();

    // Hide loading screen
    /* FIX: remove-loading-screen */

    console.log('✅ Website fully initialized with enhanced admin dashboard, prism effects, and ultra-professional design');
});

// REMOVED: Duplicate loadSiteData function - using the one at line 2553 instead
// This function was causing conflicts and session restoration issues

function initializeWebsite() {
    updateTheme();
    updateLanguage();
    renderFooterServices();
    updateContactInfo();
    applyCustomSettings();
    updateSectionVisibility();
}

function updateTheme() {
    const savedTheme = localStorage.getItem('ae2i_theme') || siteData.theme;
    if (savedTheme === 'dark' || siteData.settings.darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function updateLanguage() {
    siteData.language = siteData.settings.defaultLanguage || siteData.language || 'fr';

    // Set HTML lang and dir attributes for the current language
    document.documentElement.lang = siteData.language;
    document.documentElement.dir = siteData.language === 'ar' ? 'rtl' : 'ltr';

    // Mettre à jour les boutons de langue (FR/EN/AR)
    document.querySelectorAll('.language-btn').forEach(btn => {
        const lang = btn.getAttribute('data-lang');

        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
        if (lang === siteData.language) {
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
        }
    });
}

function updateSectionVisibility() {
    // Masquer les sections désactivées dans la navigation
    if (siteData.settings.sectionsEnabled) {
        Object.keys(siteData.settings.sectionsEnabled).forEach(section => {
            const navLink = document.querySelector(`a[data-page="${section}"]`);
            if (navLink) {
                const listItem = navLink.parentElement;
                if (siteData.settings.sectionsEnabled[section]) {
                    listItem.style.display = 'block';
                } else {
                    listItem.style.display = 'none';
                }
            }
        });
    }
}

function applyCustomSettings() {
    // Appliquer les couleurs personnalisées et toutes les variations
    if (siteData.settings.primaryColor) {
        const primary = siteData.settings.primaryColor;
        document.documentElement.style.setProperty('--primary', primary);
        document.documentElement.style.setProperty('--primary-light', lightenColor(primary, 10));
        document.documentElement.style.setProperty('--primary-dark', darkenColor(primary, 10));
        document.documentElement.style.setProperty('--accent', lightenColor(primary, 15));
        document.documentElement.style.setProperty('--accent-light', lightenColor(primary, 25));
        document.documentElement.style.setProperty('--accent-dark', darkenColor(primary, 5));
        document.documentElement.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${primary} 0%, ${darkenColor(primary, 10)} 100%)`);
        document.documentElement.style.setProperty('--gradient-accent', `linear-gradient(135deg, ${lightenColor(primary, 15)} 0%, ${darkenColor(primary, 5)} 100%)`);
    }
    if (siteData.settings.secondaryColor) {
        const secondary = siteData.settings.secondaryColor;
        document.documentElement.style.setProperty('--secondary', secondary);
        document.documentElement.style.setProperty('--secondary-light', lightenColor(secondary, 10));
        document.documentElement.style.setProperty('--secondary-dark', darkenColor(secondary, 10));
        document.documentElement.style.setProperty('--gradient-secondary', `linear-gradient(135deg, ${secondary} 0%, ${darkenColor(secondary, 10)} 100%)`);
    }

    // Appliquer le logo personnalisé
    if (siteData.settings.logo) {
        document.getElementById('headerLogo').src = siteData.settings.logo;
        document.getElementById('footerLogo').src = siteData.settings.logo;
    }

    // Appliquer le titre personnalisé
    if (siteData.settings.title) {
        document.title = siteData.settings.title;
        document.getElementById('heroTitle').textContent = siteData.settings.title;
    }

    // Appliquer le slogan personnalisé
    if (siteData.settings.slogan) {
        const heroSubtitle = document.getElementById('heroSubtitle');
        if (heroSubtitle) {
            heroSubtitle.textContent = siteData.settings.slogan;
        }
    }

    // Appliquer les tailles de police sauvegardées
    if (siteData.heroSizes) {
        const heroTitle = document.getElementById('heroTitle');
        const heroSubtitle = document.getElementById('heroSubtitle');

        if (siteData.heroSizes.title && heroTitle) {
            heroTitle.style.fontSize = siteData.heroSizes.title + 'px';
        }

        if (siteData.heroSizes.subtitle && heroSubtitle) {
            heroSubtitle.style.fontSize = siteData.heroSizes.subtitle + 'px';
        }
    }

    // Appliquer le formatage du titre sauvegardé
    if (siteData.titleFormatting) {
        const heroTitle = document.getElementById('heroTitle');
        if (heroTitle) {
            heroTitle.style.fontWeight = siteData.titleFormatting.bold ? '900' : '800';
            heroTitle.style.fontStyle = siteData.titleFormatting.italic ? 'italic' : 'normal';
            heroTitle.style.textDecoration = siteData.titleFormatting.underline ? 'underline' : 'none';
        }
    }

    // Appliquer le formatage du sous-titre sauvegardé
    if (siteData.subtitleFormatting) {
        const heroSubtitle = document.getElementById('heroSubtitle');
        if (heroSubtitle) {
            heroSubtitle.style.fontWeight = siteData.subtitleFormatting.bold ? '700' : '400';
            heroSubtitle.style.fontStyle = siteData.subtitleFormatting.italic ? 'italic' : 'normal';
            heroSubtitle.style.textDecoration = siteData.subtitleFormatting.underline ? 'underline' : 'none';
        }
    }

    // Appliquer les fonds personnalisés
    if (siteData.heroBackground) {
        const heroBackground = document.getElementById('heroBackground');
        if (siteData.heroBackground.type === 'gradient') {
            heroBackground.style.background = siteData.heroBackground.gradient;
        } else if (siteData.heroBackground.type === 'image') {
            heroBackground.style.backgroundImage = `url(${siteData.heroBackground.url})`;
            heroBackground.classList.add('has-image');
        } else if (siteData.heroBackground.type === 'video') {
            const heroVideo = document.getElementById('heroVideo');
            const heroVideoSource = document.getElementById('heroVideoSource');
            if (heroVideo && heroVideoSource) {
                heroVideoSource.src = siteData.heroBackground.url;
                heroVideo.load();
                heroVideo.style.display = 'block';
                heroBackground.classList.add('has-video');
            }
        }
    }

    // FIX: Apply footer background with better error handling
    if (siteData.footerBackground) {
        const footerBackground = document.getElementById('footerBackground');
        if (footerBackground) {
            if (siteData.footerBackground.type === 'gradient') {
                footerBackground.style.background = siteData.footerBackground.gradient;
                footerBackground.classList.remove('has-image', 'has-video');
            } else if (siteData.footerBackground.type === 'image') {
                footerBackground.style.backgroundImage = `url(${siteData.footerBackground.url})`;
                footerBackground.style.backgroundSize = 'cover';
                footerBackground.style.backgroundPosition = 'center';
                footerBackground.classList.add('has-image');
                footerBackground.classList.remove('has-video');
            } else if (siteData.footerBackground.type === 'video') {
                const footerVideo = document.getElementById('footerVideo');
                const footerVideoSource = document.getElementById('footerVideoSource');
                if (footerVideo && footerVideoSource) {
                    footerVideoSource.src = siteData.footerBackground.url;
                    footerVideo.load();
                    footerVideo.style.display = 'block';
                    footerBackground.classList.add('has-video');
                    footerBackground.classList.remove('has-image');
                }
            } else if (siteData.footerBackground.gradient) {
                // Fallback: if gradient property exists directly
                footerBackground.style.background = siteData.footerBackground.gradient;
                footerBackground.classList.remove('has-image', 'has-video');
            }
            console.log('✅ [APPLY] Footer background applied:', siteData.footerBackground.type || 'gradient');
        } else {
            console.warn('⚠️ [APPLY] Footer background element not found');
        }
    } else {
        console.log('ℹ️ [APPLY] No footer background configured');
    }

    // Vérifier le mode maintenance
    if (siteData.settings.maintenanceMode && currentUser.role !== 'admin') {
        document.body.classList.add('maintenance-mode');
        showPage('maintenance');
    }
}

function renderFooterServices() {
    const footerServices = document.getElementById('footerServices');
    if (footerServices) {
        footerServices.innerHTML = '';
        const activeServices = siteData.services.filter(s => s.active).slice(0, 4);

        activeServices.forEach(service => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#services" class="nav-link functional-btn" data-page="services"><i class="fas fa-chevron-right"></i> ${service.title[siteData.language] || service.title.fr}</a>`;
            footerServices.appendChild(li);
        });
    }
}

function updateContactInfo() {
    // Update contact information across the site
    if (siteData.settings.contact) {
        const contactElements = {
            'contactPageAddress': siteData.settings.contact.address,
            'contactPagePhone': siteData.settings.contact.phone,
            'contactPageEmail': siteData.settings.contact.email,
            'footerAddress': siteData.settings.contact.address,
            'footerPhone': siteData.settings.contact.phone,
            'footerEmail': siteData.settings.contact.email
        };

        Object.keys(contactElements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = contactElements[id];
            }
        });
    }
}

function setupApplicationForm() {
    // Application form is handled in application-script
}

function setupFileUploads() {
    // File uploads are handled in admin-script
}

// Auto-save functionality OPÉRATIONNELLE
setInterval(function () {
    if (currentUser.isLoggedIn) {
        saveSiteData();
    }
}, 30000); // Auto-save every 30 seconds

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                showPage('home');
                break;
            case '2':
                e.preventDefault();
                showPage('about');
                break;
            case '3':
                e.preventDefault();
                showPage('services');
                break;
            case '4':
                e.preventDefault();
                showPage('qualite');
                break;
            case '5':
                e.preventDefault();
                showPage('carriere');
                break;
            case '6':
                e.preventDefault();
                showPage('contact');
                break;
            case 's':
                if (currentUser.isLoggedIn) {
                    e.preventDefault();
                    if (saveSiteData()) {
                        showNotification('✅ Données sauvegardées manuellement', 'success');
                    }
                }
                break;
        }
    }
});

// Performance monitoring
window.addEventListener('load', function () {
    const loadTime = performance.now();
    logActivity('system', `Site chargé en ${loadTime.toFixed(2)}ms`);

    // Update performance display
    if (document.getElementById('loadTime')) {
        document.getElementById('loadTime').textContent = `${loadTime.toFixed(2)}ms`;
    }
});
// Error handling
window.addEventListener('error', function (e) {
    console.error('JavaScript Error:', e.error);
    logActivity('system', `Erreur: ${e.message}`);

    // Update error count
    if (document.getElementById('errorCount')) {
        const currentCount = parseInt(document.getElementById('errorCount').textContent) || 0;
        document.getElementById('errorCount').textContent = currentCount + 1;
    }
});

// Memory usage monitoring
if (performance.memory) {
    setInterval(() => {
        const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        if (document.getElementById('memoryUsage')) {
            document.getElementById('memoryUsage').textContent = `${memoryMB} MB`;
        }
    }, 5000);
}

// Cache size monitoring
function updateCacheSize() {
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length;
        }
    }

    const sizeKB = (totalSize / 1024).toFixed(2);
    if (document.getElementById('cacheSize')) {
        document.getElementById('cacheSize').textContent = `${sizeKB} KB`;
    }
}

// Update cache size every 1000 seconds
setInterval(updateCacheSize, 100000);


// Fonction de test d'upload CV
async function testCVUpload() {
    // Créer un faux fichier CV pour le test
    const testContent = "Test CV content";
    const blob = new Blob([testContent], { type: 'text/plain' });
    const testFile = new File([blob], "test_cv.txt", { type: 'text/plain' });

    console.log('🧪 Test CV Upload...');

    // Appeler votre fonction d'upload
    const result = await uploadCVToR2(testFile, "Test User", "Test Job");
    console.log('Result:', result);

    if (result.success) {
        alert('✅ Test upload réussi! URL: ' + result.url);
    } else {
        alert('❌ Test upload échoué: ' + result.error);
    }
}
// ============================================
// INITIALISATION FINALE - FIN DU FICHIER
// ============================================

// Appeler l'initialisation Firebase
document.addEventListener('DOMContentLoaded', function () {
    console.log('📄 DOM Content Loaded - Initialisation Firebase...');
    initializeFirebase();
});

console.log('✅ Script chargé - Fonctions Firebase prêtes');

// ====================================================================
// EXPOSE ALL FUNCTIONS GLOBALLY FOR ONCLICK HANDLERS - ORGANIZED LIST
// ====================================================================

// === ADMIN DASHBOARD FUNCTIONS ===
window.editService = editService;
window.toggleService = toggleService;
window.deleteService = deleteService;
window.renderServicesConfiguration = renderServicesConfiguration;
window.toggleServiceConfig = toggleServiceConfig;
window.moveServiceUp = moveServiceUp;
window.moveServiceDown = moveServiceDown;
window.saveServicesConfiguration = saveServicesConfiguration;
window.editClient = editClient;
window.toggleClient = toggleClient;
window.deleteClient = deleteClient;
window.editTestimonial = editTestimonial;
window.toggleTestimonial = toggleTestimonial;
window.deleteTestimonial = deleteTestimonial;
window.editJob = editJob;
window.toggleJob = toggleJob;
window.deleteJob = deleteJob;
window.viewJobApplications = viewJobApplications;
window.editPage = editPage;
window.toggleSection = toggleSection;
window.viewPage = viewPage;
window.duplicatePage = duplicatePage;
window.deletePage = deletePage;
window.editUser = editUser;
window.toggleUser = toggleUser;
window.resetUserPassword = resetUserPassword;
window.viewUserActivity = viewUserActivity;
window.deleteUser = deleteUser;
window.deleteMessage = deleteMessage;
window.replyToMessage = replyToMessage;
window.downloadCV = downloadCV;
window.previewCV = previewCV;
window.deleteApplication = deleteApplication;
window.contactApplicant = contactApplicant;
window.markAsProcessed = markAsProcessed;
window.markAsRead = markAsRead;
window.viewRecruteurApplications = viewRecruteurApplications;
window.filterApplications = filterApplications;
window.exportApplicationsToCSV = exportApplicationsToCSV;
window.exportApplicationsToPDF = exportApplicationsToPDF;

// === RECRUITER DASHBOARD FUNCTIONS ===
window.editRecruteurJob = editRecruteurJob;
window.toggleRecruteurJob = toggleRecruteurJob;
window.deleteRecruteurJob = deleteRecruteurJob;
window.viewRecruteurApplications = viewRecruteurApplications;
window.openRecruteurJobModal = openRecruteurJobModal;
window.executeRecruteurScript = executeRecruteurScript;
window.renderRecruteurContent = renderRecruteurContent;
window.setupRecruteurInteractions = setupRecruteurInteractions;

// === LECTEUR DASHBOARD FUNCTIONS ===
// FIX sécurisée pour éviter crash
window.downloadLecteurCV = (typeof window.downloadLecteurCV === "function")
    ? window.downloadLecteurCV
    : (typeof window.downloadCV === "function" ? window.downloadCV : function (id) {
        console.warn("downloadCV manquant, fallback utilisé.");
    });

window.previewLecteurCV = (typeof previewLecteurCV === "function")
    ? previewLecteurCV
    : (typeof previewCV === "function" ? previewCV : function (id) {
        console.warn("previewCV manquant, fallback utilisé.");
    });
window.executeLecteurScript = executeLecteurScript;
window.renderLecteurContent = renderLecteurContent;
window.setupLecteurInteractions = setupLecteurInteractions;

// === SITE SETTINGS FUNCTIONS ===
window.updateSiteTitle = updateSiteTitle;
window.updateSiteSlogan = updateSiteSlogan;
window.updateSiteDescription = updateSiteDescription;
window.applyTitleGradient = applyTitleGradient;
window.applySloganGradient = applySloganGradient;
window.applyDescriptionGradient = applyDescriptionGradient;
window.setHeroBackground = setHeroBackground;
window.applyHeroGradient = applyHeroGradient;
window.toggleTitleFormatting = toggleTitleFormatting;
window.updateLanguageSettings = updateLanguageSettings;
window.updateThemeSettings = updateThemeSettings;
window.saveContactSettings = saveContactSettings;
window.saveSocialNetworks = saveSocialNetworks;
window.saveRecruitmentEmails = saveRecruitmentEmails;
window.addRecruitmentEmail = addRecruitmentEmail;
window.updateMaintenanceMessage = updateMaintenanceMessage;
window.saveConsentSettings = saveConsentSettings;
window.updateAdminProfile = updateAdminProfile;

// === UTILITIES & MAINTENANCE ===
window.clearCache = clearCache;
window.createBackup = createBackup;
window.anonymizeOldData = anonymizeOldData;
window.runPerformanceCheck = runPerformanceCheck;
window.removeHeroBackground = removeHeroBackground;
window.removeFooterBackground = removeFooterBackground;
window.removeRecruitmentEmail = removeRecruitmentEmail;

// === MODALS & UI ===
window.connectLinkedIn = connectLinkedIn;
window.disconnectLinkedIn = disconnectLinkedIn;
window.closeModal = closeModal;
window.openModal = openModal;
window.applyMultiFilters = applyMultiFilters;
window.resetMultiFilters = resetMultiFilters;
window.toggleMultiFilter = toggleMultiFilter;
window.setFooterBackground = setFooterBackground;
window.applyFooterGradient = applyFooterGradient;

// === USER MANAGEMENT ===
window.openUserModal = openUserModal;
window.updateRoleDescription = updateRoleDescription;

// === EXPORT FUNCTIONS ===
window.exportAuditLog = exportAuditLog;
window.exportLecteurCVs = exportLecteurCVs;
window.openServiceModal = openServiceModal;
window.openTestimonialModal = openTestimonialModal;
window.openJobModal = openJobModal;
window.openClientModal = openClientModal;
window.openPageModal = openPageModal;
window.openApplicationForm = openApplicationForm;
window.handleMaintenanceLogin = handleMaintenanceLogin;
window.disableMaintenanceMode = disableMaintenanceMode;
window.logoutFromMaintenance = logoutFromMaintenance;
window.exportAllCVs = exportAllCVs;
window.exportCVDatabase = exportCVDatabase;
window.exportAnalytics = exportAnalytics;
window.exportConsentData = exportConsentData;
window.generateGlobalReport = generateGlobalReport;

// === FIREBASE & CLOUDFLARE FUNCTIONS ===
window.initializeFirebase = initializeFirebase;
window.testFirebaseConnection = testFirebaseConnection;
window.uploadCVToR2 = uploadCVToR2;
window.saveApplicationToFirebase = saveApplicationToFirebase;
window.isFirebaseAvailable = isFirebaseAvailable;
window.toggleAppMode = toggleAppMode;
window.initializeFirebaseIfAvailable = initializeFirebaseIfAvailable;
window.testCVUpload = testCVUpload;

// === ADDITIONAL FUNCTIONS (ensure they exist) ===
// If these don't exist in your code, you can create simple placeholders:
if (typeof window.viewRecruteurApplications === 'undefined') {
    window.viewRecruteurApplications = function (jobId) {
        console.log('Viewing applications for job:', jobId);
        const applications = siteData.cvDatabase.filter(cv => cv.jobId === jobId);
        console.log('Applications:', applications);
    };
}

// ====================================================================
// END OF GLOBAL EXPOSURE - ALL FUNCTIONS NOW AVAILABLE VIA window.*
// ====================================================================

console.log('🎉 AE2I Enhanced Ultra-Professional Site - All functions exposed globally');
console.log('🔥 Total functions exposed:', Object.keys(window).filter(k => typeof window[k] === 'function').length);

/* ADD: admin-toggle-socials-persistence - Functions to control social networks visibility with persistence */

/* SECTION: Individual Social Network Toggle */
function toggleIndividualSocial(network, toggleElement) {
    const isActive = toggleElement.classList.contains('active');

    if (isActive) {
        toggleElement.classList.remove('active');
        // Masquer tous les liens de ce réseau
        document.querySelectorAll(`[data-network="${network}"]`).forEach(el => {
            if (el !== toggleElement) {
                el.style.display = 'none';
            }
        });
        localStorage.setItem(`ae2i_social_${network}`, 'disabled');
        showNotification(`${network} désactivé`, 'info');
    } else {
        toggleElement.classList.add('active');
        // Afficher tous les liens de ce réseau
        document.querySelectorAll(`[data-network="${network}"]`).forEach(el => {
            if (el !== toggleElement) {
                el.style.display = '';
            }
        });
        localStorage.setItem(`ae2i_social_${network}`, 'enabled');
        showNotification(`${network} activé`, 'success');
    }

    logActivity(currentUser.username, `Réseau social ${network} ${isActive ? 'désactivé' : 'activé'}`);
    forceSaveData();
}

/* SECTION: Load Social Network States on Init */
function loadSocialNetworkStates() {
    const networks = ['linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'tiktok'];

    networks.forEach(network => {
        const state = localStorage.getItem(`ae2i_social_${network}`);

        if (state === 'disabled') {
            // Désactiver le réseau
            document.querySelectorAll(`[data-network="${network}"]`).forEach(el => {
                if (el.classList.contains('toggle-switch')) {
                    el.classList.remove('active');
                } else {
                    el.style.display = 'none';
                }
            });
        }
    });
}

// REMOVED: Duplicate toggleSocialNetworks function - using the complete one at line 6337

function applySocialsSettings() {
    const socialsToggle = document.getElementById('socialsToggle');
    const enabled = socialsToggle.classList.contains('active');

    if (!siteData.settings) siteData.settings = {};
    siteData.settings.socialsEnabled = enabled;

    if (saveSiteData()) {
        /* ADD: socials-visibility-update - Apply visibility dynamically */
        applySocialsVisibility(enabled);

        showNotification(
            enabled ? 'Réseaux sociaux activés' : 'Réseaux sociaux désactivés',
            'success'
        );
        logActivity(currentUser.username, `Réseaux sociaux ${enabled ? 'activés' : 'désactivés'}`);
    } else {
        showNotification('Erreur lors de la sauvegarde', 'error');
    }
}

/* ADD: socials-visibility-update - Apply social networks visibility */
function applySocialsVisibility(enabled) {
    console.log('🔄 [SOCIALS VISIBILITY] Applying visibility:', enabled);
    
    // FIX: Apply to footer social links container (id="footerSocialLinks")
    const footerSocialLinks = document.getElementById('footerSocialLinks');
    if (footerSocialLinks) {
        footerSocialLinks.style.display = enabled ? 'flex' : 'none';
        console.log('✅ [SOCIALS VISIBILITY] Footer social links container updated');
        
        // Also hide/show all child elements
        const childButtons = footerSocialLinks.querySelectorAll('.social-btn, [data-network]');
        childButtons.forEach(btn => {
            btn.style.display = enabled ? '' : 'none';
        });
    } else {
        console.warn('⚠️ [SOCIALS VISIBILITY] footerSocialLinks element not found');
    }
    
    // Apply to all social network buttons with data-network attribute (but not toggle switches)
    const socialButtons = document.querySelectorAll('[data-network]');
    let buttonsUpdated = 0;
    socialButtons.forEach(el => {
        // Don't hide toggle switches, only actual links
        if (!el.classList.contains('toggle-switch') && el.tagName === 'A') {
            el.style.display = enabled ? '' : 'none';
            buttonsUpdated++;
        }
    });
    console.log(`✅ [SOCIALS VISIBILITY] ${buttonsUpdated} social buttons with data-network updated`);
    
    // Apply to ALL social-btn class elements (including those in footer)
    const socialBtnElements = document.querySelectorAll('.social-btn');
    let socialBtnUpdated = 0;
    socialBtnElements.forEach(el => {
        // Don't hide toggle switches or elements in admin panels
        if (!el.classList.contains('toggle-switch') && !el.closest('.admin-card')) {
            el.style.display = enabled ? '' : 'none';
            socialBtnUpdated++;
        }
    });
    console.log(`✅ [SOCIALS VISIBILITY] ${socialBtnUpdated} .social-btn elements updated`);
    
    // Apply to footer-social class containers
    const footerSocialContainers = document.querySelectorAll('.footer-social');
    footerSocialContainers.forEach(el => {
        el.style.display = enabled ? 'flex' : 'none';
    });
    
    // Also apply to any other social network containers (but be careful not to hide admin toggles)
    const socialContainers = document.querySelectorAll('.social-networks, .social-links');
    socialContainers.forEach(el => {
        // Only apply to containers in footer/public areas, not admin panels
        if (!el.closest('.admin-card') && !el.classList.contains('toggle-switch')) {
            el.style.display = enabled ? '' : 'none';
        }
    });
    
    console.log('✅ [SOCIALS VISIBILITY] Visibility applied to all elements');
}

/* ADD: admin-toggle-socials-persistence - Initialize socials state on page load */
function initializeSocialsState() {
    if (!siteData.settings) siteData.settings = {};

    // FIX: Use socialNetworksEnabled instead of socialsEnabled for consistency
    // Default to enabled if not set
    const isEnabled = siteData.settings.socialNetworksEnabled !== false; // Default to true

    // Apply visibility based on saved state
    applySocialsVisibility(isEnabled);

    // Update toggle button in admin if it exists
    const socialsToggle = document.getElementById('socialsToggle');
    if (socialsToggle) {
        if (isEnabled) {
            socialsToggle.classList.add('active');
        } else {
            socialsToggle.classList.remove('active');
        }
    }
}

/* ADD: admin-database-export-clear - Database management functions */
function exportCompleteDatabase() {
    try {
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data: siteData
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `AE2I_Database_Export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        showNotification('Base de données exportée avec succès (JSON)', 'success');
        logActivity(currentUser.username, 'Export complet base de données (JSON)');
    } catch (error) {
        console.error('Error exporting database:', error);
        showNotification('Erreur lors de l\'export', 'error');
    }
}

function exportCompleteDatabaseZip() {
    try {
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data: siteData,
            metadata: {
                totalApplications: siteData.cvDatabase ? siteData.cvDatabase.length : 0,
                totalJobs: siteData.jobs ? siteData.jobs.length : 0,
                totalUsers: siteData.users ? siteData.users.length : 0
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `AE2I_Database_Complete_${new Date().toISOString().split('T')[0]}.zip.json`;
        link.click();

        showNotification('Base de données exportée avec succès (ZIP format)', 'success');
        logActivity(currentUser.username, 'Export complet base de données (ZIP)');
    } catch (error) {
        console.error('Error exporting database:', error);
        showNotification('Erreur lors de l\'export', 'error');
    }
}

function confirmClearDatabase() {
    const lang = siteData.language || 'fr';
    const confirmMessage = lang === 'en' ?
        'WARNING: This action is IRREVERSIBLE!\n\nAre you absolutely sure you want to DELETE ALL DATA?\n\n- All applications will be lost\n- All job offers will be lost\n- All settings will be reset\n\nType "DELETE" to confirm:' :
        'ATTENTION: Cette action est IRRÉVERSIBLE!\n\nÊtes-vous absolument sûr de vouloir SUPPRIMER TOUTES LES DONNÉES?\n\n- Toutes les candidatures seront perdues\n- Toutes les offres seront perdues\n- Tous les paramètres seront réinitialisés\n\nTapez "DELETE" pour confirmer:';

    const userInput = prompt(confirmMessage);

    if (userInput === 'DELETE') {
        const finalConfirm = confirm(
            lang === 'en' ?
                'LAST WARNING: You are about to delete everything. Continue?' :
                'DERNIER AVERTISSEMENT: Vous êtes sur le point de tout supprimer. Continuer?'
        );

        if (finalConfirm) {
            clearCompleteDatabase();
        }
    } else {
        showNotification(
            lang === 'en' ? 'Operation cancelled' : 'Opération annulée',
            'info'
        );
    }
}

function clearCompleteDatabase() {
    try {
        // Keep only essential settings
        const lang = siteData.language || 'fr';
        const newSiteData = {
            settings: {
                title: siteData.settings.title,
                logo: siteData.settings.logo,
                favicon: siteData.settings.favicon,
                defaultLanguage: lang,
                socialsEnabled: true
            },
            services: [],
            clients: [],
            testimonials: [],
            jobs: [],
            cvDatabase: [],
            users: siteData.users || [],
            activityLog: []
        };

        siteData = newSiteData;

        if (forceSaveData()) {
            showNotification(
                lang === 'en' ?
                    'Database cleared successfully. Page will reload.' :
                    'Base de données vidée avec succès. La page va se recharger.',
                'success'
            );
            logActivity(currentUser.username, 'Vidage complet de la base de données');

            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            showNotification('Erreur lors du vidage', 'error');
        }
    } catch (error) {
        console.error('Error clearing database:', error);
        showNotification('Erreur lors du vidage de la base', 'error');
    }
}
// ========================================
// SYSTÈME D'AUTOSAVE BIDIRECTIONNEL INTELLIGENT
// ========================================

const AutosaveManager = {
    supabaseUrl: 'https://uisxrkzkqtbapnxnyuod.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpc3hya3prcXRiYXBueG55dW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDA0MTksImV4cCI6MjA3NzQ3NjQxOX0.lySWXQnIUDdCtrYVTrgoBMCIKWsKuqN8b-ipl3qSDwg',
    syncInterval: null,
    pendingChanges: [],
    isOnline: navigator.onLine,

    // Initialiser Supabase client
    async initSupabase() {
        if (typeof supabase === 'undefined' && typeof window.supabase === 'undefined') {
            // Load Supabase client from CDN if not already loaded
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            document.head.appendChild(script);

            await new Promise(resolve => {
                script.onload = resolve;
            });
        }

        const { createClient } = window.supabase || supabase;
        this.client = createClient(this.supabaseUrl, this.supabaseKey);

        console.log('✅ Supabase client initialized');
        return this.client;
    },

    // Charger les données depuis localStorage (autosave.json local)
    loadLocal() {
        try {
            const data = localStorage.getItem('ae2i_autosave');
            return data ? JSON.parse(data) : this.getDefaultStructure();
        } catch (error) {
            console.error('❌ Error loading local autosave:', error);
            return this.getDefaultStructure();
        }
    },

    // Sauvegarder localement
    saveLocal(data) {
        try {
            data.metadata = data.metadata || {};
            data.metadata.lastSync = new Date().toISOString();
            data.metadata.syncStatus = 'saved_locally';
            localStorage.setItem('ae2i_autosave', JSON.stringify(data));
            console.log('✅ Data saved locally');
            return true;
        } catch (error) {
            console.error('❌ Error saving locally:', error);
            return false;
        }
    },

    // Structure par défaut
    getDefaultStructure() {
        return {
            metadata: {
                version: '1.0.0',
                lastSync: null,
                syncStatus: 'initialized'
            },
            services: [],
            job_offers: [],
            site_sections: {},
            uploads: [],
            clients_logos: [],
            dashboard_settings: {},
            visual_settings: {},
            social_media: {}
        };
    },

    // Synchroniser avec Supabase (BIDIRECTIONNEL)
    async sync(userEmail = 'visitor', userRole = 'public') {
        if (!this.isOnline) {
            console.warn('⚠️ Offline mode: Changes queued');
            return { success: false, message: 'Offline - changes queued' };
        }

        try {
            await this.initSupabase();

            const localData = this.loadLocal();

            // 1. Envoyer les modifications locales vers Supabase
            await this.pushToSupabase(localData, userEmail, userRole);

            // 2. Récupérer les modifications depuis Supabase
            const remoteData = await this.pullFromSupabase();

            // 3. Fusionner les données
            const mergedData = this.mergeData(localData, remoteData);

            // 4. Sauvegarder localement
            this.saveLocal(mergedData);

            // 5. Mettre à jour l'affichage du site
            this.updateSiteDisplay(mergedData);

            console.log('✅ Sync completed successfully');
            showNotification('Synchronisation réussie !', 'success');

            return { success: true, data: mergedData };
        } catch (error) {
            console.error('❌ Sync error:', error);
            showNotification('Erreur de synchronisation', 'error');
            return { success: false, error: error.message };
        }
    },

    // Pousser les données vers Supabase
    async pushToSupabase(data, userEmail, userRole) {
        try {
            // Services
            if (data.services && data.services.length > 0) {
                for (const service of data.services) {
                    await this.client.from('services').upsert(service);
                    await this.logActivity(userEmail, userRole, 'SYNC', 'services', service.id);
                }
            }

            // Job offers
            if (data.job_offers && data.job_offers.length > 0) {
                for (const job of data.job_offers) {
                    await this.client.from('job_offers').upsert(job);
                    await this.logActivity(userEmail, userRole, 'SYNC', 'job_offers', job.id);
                }
            }

            // Uploads
            if (data.uploads && data.uploads.length > 0) {
                for (const upload of data.uploads) {
                    await this.client.from('uploads').upsert(upload);
                }
            }

            // Client logos
            if (data.clients_logos && data.clients_logos.length > 0) {
                for (const logo of data.clients_logos) {
                    await this.client.from('clients_logos').upsert(logo);
                }
            }

            console.log('✅ Data pushed to Supabase');
        } catch (error) {
            console.error('❌ Error pushing to Supabase:', error);
            throw error;
        }
    },

    // Récupérer les données depuis Supabase
    async pullFromSupabase() {
        try {
            const data = this.getDefaultStructure();

            // Services
            const { data: services } = await this.client.from('services').select('*').order('display_order');
            data.services = services || [];

            // Job offers
            const { data: jobs } = await this.client.from('job_offers').select('*').order('created_at', { ascending: false });
            data.job_offers = jobs || [];

            // Uploads
            const { data: uploads } = await this.client.from('uploads').select('*');
            data.uploads = uploads || [];

            // Client logos
            const { data: logos } = await this.client.from('clients_logos').select('*').order('display_order');
            data.clients_logos = logos || [];

            // Site sections
            const { data: sections } = await this.client.from('site_sections').select('*');
            if (sections) {
                sections.forEach(section => {
                    data.site_sections[section.section_name] = section.content;
                });
            }

            console.log('✅ Data pulled from Supabase');
            return data;
        } catch (error) {
            console.error('❌ Error pulling from Supabase:', error);
            throw error;
        }
    },

    // Fusionner les données (résolution de conflits: last-write-wins)
    mergeData(local, remote) {
        // Pour cet implémentation, on privilégie les données distantes (Supabase)
        // car elles sont considérées comme source de vérité
        return {
            ...local,
            ...remote,
            metadata: {
                ...local.metadata,
                lastSync: new Date().toISOString(),
                syncStatus: 'synced'
            }
        };
    },

    // Mettre à jour l'affichage du site
    updateSiteDisplay(data) {
        try {
            // Mettre à jour les services affichés
            if (typeof renderServices === 'function' && data.services) {
                // Fonction à implémenter côté site
                console.log('🔄 Updating services display');
            }

            // Mettre à jour les offres d'emploi
            if (typeof renderJobOffers === 'function' && data.job_offers) {
                // Fonction à implémenter côté site
                console.log('🔄 Updating job offers display');
            }

            // Mettre à jour les logos clients
            if (typeof renderClientLogos === 'function' && data.clients_logos) {
                // Fonction à implémenter côté site
                console.log('🔄 Updating client logos display');
            }

            console.log('✅ Site display updated');
        } catch (error) {
            console.error('❌ Error updating site display:', error);
        }
    },

    // Logger les activités
    async logActivity(userEmail, userRole, actionType, tableName, recordId = null, oldData = null, newData = null) {
        try {
            await this.client.from('activity_logs').insert({
                user_email: userEmail,
                user_role: userRole,
                action_type: actionType,
                table_name: tableName,
                record_id: recordId,
                old_data: oldData,
                new_data: newData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Error logging activity:', error);
        }
    },

    // Créer ou mettre à jour une ressource
    async upsertResource(type, data, userEmail = 'visitor', userRole = 'admin') {
        try {
            const localData = this.loadLocal();

            switch (type) {
                case 'service':
                    const serviceIndex = localData.services.findIndex(s => s.id === data.id);
                    const actionType = serviceIndex >= 0 ? 'UPDATE' : 'CREATE';

                    if (serviceIndex >= 0) {
                        localData.services[serviceIndex] = data;
                    } else {
                        localData.services.push(data);
                    }

                    this.saveLocal(localData);
                    await this.sync(userEmail, userRole);
                    break;

                case 'job_offer':
                    const jobIndex = localData.job_offers.findIndex(j => j.id === data.id);

                    if (jobIndex >= 0) {
                        localData.job_offers[jobIndex] = data;
                    } else {
                        localData.job_offers.push(data);
                    }

                    this.saveLocal(localData);
                    await this.sync(userEmail, userRole);
                    break;

                case 'upload':
                    localData.uploads.push(data);
                    this.saveLocal(localData);
                    await this.sync(userEmail, userRole);
                    break;

                case 'client_logo':
                    const logoIndex = localData.clients_logos.findIndex(l => l.id === data.id);

                    if (logoIndex >= 0) {
                        localData.clients_logos[logoIndex] = data;
                    } else {
                        localData.clients_logos.push(data);
                    }

                    this.saveLocal(localData);
                    await this.sync(userEmail, userRole);
                    break;
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Error upserting resource:', error);
            return { success: false, error: error.message };
        }
    },

    // Supprimer une ressource
    async deleteResource(type, id, userEmail = 'visitor', userRole = 'admin') {
        try {
            const localData = this.loadLocal();

            switch (type) {
                case 'service':
                    localData.services = localData.services.filter(s => s.id !== id);
                    break;
                case 'job_offer':
                    localData.job_offers = localData.job_offers.filter(j => j.id !== id);
                    break;
                case 'upload':
                    localData.uploads = localData.uploads.filter(u => u.id !== id);
                    break;
                case 'client_logo':
                    localData.clients_logos = localData.clients_logos.filter(l => l.id !== id);
                    break;
            }

            this.saveLocal(localData);

            // Supprimer aussi de Supabase
            await this.client.from(type + 's').delete().eq('id', id);
            await this.logActivity(userEmail, userRole, 'DELETE', type + 's', id);

            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting resource:', error);
            return { success: false, error: error.message };
        }
    },

    // Démarrer la synchronisation automatique
    startAutoSync(intervalMs = 60000) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(() => {
            console.log('🔄 Auto-sync triggered');
            this.sync();
        }, intervalMs);

        console.log(`✅ Auto-sync started (every ${intervalMs / 1000}s)`);
    },

    // Arrêter la synchronisation automatique
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏸️ Auto-sync stopped');
        }
    }
};

// Exposer AutosaveManager globalement
window.AutosaveManager = AutosaveManager;

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Autosave Manager...');

    // Charger les données locales au démarrage
    const localData = AutosaveManager.loadLocal();
    console.log('📦 Local data loaded:', localData);

    // Synchroniser avec Supabase au démarrage
    await AutosaveManager.sync();

    // Démarrer la synchronisation automatique (toutes les 60 secondes)
    AutosaveManager.startAutoSync(60000);

    // Écouter les changements de connexion
    window.addEventListener('online', () => {
        AutosaveManager.isOnline = true;
        console.log('🌐 Back online - syncing...');
        AutosaveManager.sync();
    });

    window.addEventListener('offline', () => {
        AutosaveManager.isOnline = false;
        console.log('📴 Offline mode activated');
        showNotification('Mode hors ligne - les modifications seront synchronisées à la reconnexion', 'warning');
    });
});
// --- PATCH start ---
// Appeler ceci quand firebase est prêt (firebaseReady event dans index.html)
window.addEventListener('firebaseReady', () => {
    console.log('🔔 firebaseReady reçu — set up cvDatabase listener');

    if (window.firebaseHelper && typeof window.firebaseHelper.listenToCollection === 'function') {
        // Listen real-time to cvDatabase collection - get ALL documents
        // Use orderBy to ensure we get all documents (Firestore requires orderBy for consistent results)
        const { orderBy } = window.firebaseHelper.firestore || {};
        window.firebaseHelper.listenToCollection('cvDatabase', function (docs) {
            console.log('🔁 [FIREBASE LISTENER] cvDatabase snapshot reçu, count =', docs.length);
            console.log('📦 [FIREBASE LISTENER] All document IDs:', docs.map(d => d.id));

            if (docs.length === 0) {
                console.warn('⚠️ [FIREBASE LISTENER] No documents received! Check Firebase permissions.');
                siteData.cvDatabase = [];
                return;
            }

            if (docs.length > 0) {
                console.log('📦 [FIREBASE LISTENER] First doc sample:', JSON.stringify(docs[0], null, 2));
                console.log('📦 [FIREBASE LISTENER] First doc keys:', Object.keys(docs[0]));
            }

            console.log('📊 [FIREBASE LISTENER] Total documents to process:', docs.length);

            // Convertir les timestamps Firebase en dates et normaliser champs attendus par siteData
            const normalized = docs.map(doc => {
                // firebase.js listener now sends: { ...docData, id: doc.id }
                // So doc.id is ALWAYS the Firebase document ID (it overwrites any id in docData)
                const firebaseDocId = doc.id;
                
                // Use doc as-is (it already has the correct Firebase ID)
                const d = { ...doc };
                
                console.log('🔄 [NORMALIZE] Processing doc ID:', firebaseDocId, 'Type:', typeof firebaseDocId);

                // serverTimestamp fields -> convertir si nécessaire
                if (d.submittedAt && d.submittedAt.toDate) {
                    try { d.appliedAt = d.submittedAt.toDate().toISOString(); } catch (e) { }
                } else if (d.submittedAt) {
                    d.appliedAt = (new Date(d.submittedAt)).toISOString();
                } else if (!d.appliedAt) {
                    d.appliedAt = new Date().toISOString();
                }

                // Alignement nom des champs - Firebase uses different field names
                // Map from Firebase fields to expected fields
                if (!d.applicantName) {
                    d.applicantName = d.fullName || d.applicantName || d.cvData?.fullName || d.applicantFullName ||
                        ((d.applicantFirstName || '') + ' ' + (d.applicantLastName || '')).trim() || 'Candidat';
                }
                if (!d.jobTitle) {
                    d.jobTitle = d.position || d.jobTitle || d.job || d.cvData?.position || 'Poste';
                }

                // Ensure all required fields exist - map Firebase field names
                if (!d.applicantEmail) {
                    d.applicantEmail = d.email || d.applicantEmail || '';
                }
                if (!d.applicantPhone) {
                    d.applicantPhone = d.phone || d.applicantPhone || '';
                }
                if (!d.applicantFirstName && d.applicantName) {
                    // Try to split name if we have full name
                    const nameParts = d.applicantName.split(' ');
                    if (nameParts.length > 0) d.applicantFirstName = nameParts[0];
                }
                if (!d.applicantLastName && d.applicantName) {
                    const nameParts = d.applicantName.split(' ');
                    if (nameParts.length > 1) d.applicantLastName = nameParts.slice(1).join(' ');
                }
                if (!d.jobId) {
                    d.jobId = d.job_id || d.jobId || null;
                }

                // Map CV URL fields
                if (!d.cvUrl && d.cvR2Url) {
                    d.cvUrl = d.cvR2Url;
                }
                if (!d.cvR2Url && d.cvUrl) {
                    d.cvR2Url = d.cvUrl;
                }

                console.log('✅ [NORMALIZE] Normalized doc:', {
                    id: d.id,
                    name: d.applicantName,
                    email: d.applicantEmail,
                    phone: d.applicantPhone,
                    jobTitle: d.jobTitle,
                    cvUrl: d.cvUrl || d.cvR2Url
                });

                // Mapper cvUrl depuis cvUrl ou cvR2Url
                if (!d.cvR2Url && d.cvUrl) {
                    d.cvR2Url = d.cvUrl;
                }
                if (!d.cvUrl && d.cvR2Url) {
                    d.cvUrl = d.cvR2Url;
                }

                // processed flag
                d.processed = !!d.processed;

                // Store Firebase ID for deletion (always use the Firebase document ID)
                // Both id and firebaseId should be the Firebase document ID
                d.firebaseId = firebaseDocId;
                // Ensure id is also the Firebase document ID (in case data had a different id)
                d.id = firebaseDocId;

                return d;
            });

            console.log('✅ [NORMALIZE] Successfully normalized', normalized.length, 'documents from', docs.length, 'Firebase documents');
            if (docs.length !== normalized.length) {
                console.error('❌ [ERROR] Document count mismatch! Firebase sent:', docs.length, 'but normalized:', normalized.length);
            }

            // Remplacer siteData.cvDatabase et re-render les dashboards
            siteData.cvDatabase = normalized;

            console.log('✅ [UPDATE] cvDatabase mis à jour avec', normalized.length, 'candidatures');
            console.log('📋 [UPDATE] All candidature IDs:', normalized.map(c => c.id));
            console.log('📋 [FULL DATA] Détails candidatures:', normalized.map(c => ({
                id: c.id,
                name: c.applicantName,
                email: c.applicantEmail,
                phone: c.applicantPhone,
                jobId: c.jobId,
                jobTitle: c.jobTitle,
                cvUrl: c.cvUrl,
                cvR2Url: c.cvR2Url,
                cvFileName: c.cvFileName,
                allFields: Object.keys(c)
            })));

            // Re-render les vues pertinentes
            try {
                if (typeof renderAdminCvDatabase === 'function') renderAdminCvDatabase();
                if (typeof renderRecruteurApplications === 'function') {
                    renderRecruteurApplications();
                    console.log('✅ Recruteur applications re-rendered');
                }
                if (typeof renderRecruteurContent === 'function') {
                    renderRecruteurContent();
                    console.log('✅ Recruteur content re-rendered');
                }
                if (typeof renderLecteurCvDatabase === 'function') renderLecteurCvDatabase();
                if (typeof renderLecteurContent === 'function') renderLecteurContent();
                if (typeof updateAnalytics === 'function') updateAnalytics();
            } catch (e) {
                console.error('Erreur lors du re-render après sync CV:', e);
            }
        }, [ /* optional query constraints */]);
        
        // Listen to settings collection for real-time updates (including recruitmentEmails)
        window.firebaseHelper.listenToCollection('settings', function (docs) {
            console.log('🔁 [FIREBASE LISTENER] Settings snapshot reçu, count =', docs.length);
            
            if (docs.length > 0) {
                // Find the 'main' settings document
                const mainSettings = docs.find(doc => doc.id === 'main');
                if (mainSettings) {
                    console.log('✅ [SETTINGS LISTENER] Main settings loaded');
                    
                    // Update siteData.settings
                    if (!siteData.settings) {
                        siteData.settings = {};
                    }
                    
                    // Merge settings (preserve recruitmentEmails array)
                    Object.keys(mainSettings).forEach(key => {
                        if (key !== 'id' && key !== 'lastUpdated' && key !== 'updatedBy' && key !== 'updatedByUid') {
                            if (Array.isArray(mainSettings[key])) {
                                // Always use Firebase version for arrays
                                siteData.settings[key] = mainSettings[key];
                            } else {
                                siteData.settings[key] = mainSettings[key];
                            }
                        }
                    });
                    
                    // Ensure recruitmentEmails is preserved
                    if (mainSettings.recruitmentEmails && Array.isArray(mainSettings.recruitmentEmails)) {
                        siteData.settings.recruitmentEmails = mainSettings.recruitmentEmails;
                        console.log('✅ [SETTINGS LISTENER] Recruitment emails updated:', mainSettings.recruitmentEmails.length, mainSettings.recruitmentEmails);
                        
                        // Re-render recruitment emails if admin page is active
                        if (currentUser && currentUser.role === 'admin') {
                            if (typeof renderRecruitmentEmails === 'function') {
                                renderRecruitmentEmails();
                            }
                        }
                    }
                }
            }
        });
    } else {
        console.warn('⚠️ firebaseHelper.listenToCollection non disponible');
    }
});
// --- PATCH end ---
// ============================================
// NOUVELLES FONCTIONNALITÉS DASHBOARD ADMIN
// ============================================
// === 1. GESTION DES RÔLES ===
function renderRolesManagement() {
    const tbody = document.getElementById('rolesTableBody');
    if (!tbody) return;

    const users = siteData.users || [];
    tbody.innerHTML = users.map(user => `
        <tr style="border-bottom: 1px solid var(--border); transition: var(--transition);" 
            onmouseenter="this.style.background='var(--bg-alt)'" 
            onmouseleave="this.style.background='transparent'">
            <td style="padding: 16px; font-weight: 600;">${user.username}</td>
            <td style="padding: 16px; color: var(--text-light);">${user.email || 'N/A'}</td>
            <td style="padding: 16px;">
                <span class="badge ${user.role === 'admin' ? 'badge-primary' : user.role === 'recruteur' ? 'badge-success' : 'badge-info'}" 
                      style="padding: 6px 16px; font-size: 13px; font-weight: 600; border-radius: var(--border-radius-full); box-shadow: var(--shadow-sm);">
                    ${user.role === 'admin' ? '👑 Admin' : user.role === 'recruteur' ? '💼 Recruteur' : '👁️ Lecteur'}
                </span>
            </td>
            <td style="padding: 16px;">
                <select id="newRole-${user.username}" class="form-control" 
                        style="max-width: 200px; padding: 8px 12px; border: 2px solid var(--border); border-radius: var(--border-radius); transition: var(--transition);"
                        onmouseover="this.style.borderColor='var(--primary)'"
                        onmouseout="this.style.borderColor='var(--border)'">
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>👑 Admin</option>
                    <option value="recruteur" ${user.role === 'recruteur' ? 'selected' : ''}>💼 Recruteur</option>
                    <option value="lecteur" ${user.role === 'lecteur' ? 'selected' : ''}>👁️ Lecteur</option>
                </select>
            </td>
            <td style="padding: 16px; text-align: center;">
                <button class="btn btn-sm btn-primary functional-btn" onclick="changeUserRole('${user.username}')"
                        style="padding: 8px 20px; border-radius: var(--border-radius-full); box-shadow: var(--shadow); transition: var(--transition);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-lg)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow)'">
                    <i class="fas fa-check"></i> Appliquer
                </button>
            </td>
        </tr>
    `).join('');
}

function changeUserRole(username) {
    const newRoleSelect = document.getElementById(`newRole-${username}`);
    if (!newRoleSelect) return;

    const newRole = newRoleSelect.value;
    const user = siteData.users.find(u => u.username === username);

    if (!user) return;
    if (user.role === newRole) {
        showNotification('Le rôle est déjà identique', 'info');
        return;
    }

    if (confirm(`Voulez-vous vraiment changer le rôle de ${username} de "${user.role}" à "${newRole}" ?`)) {
        const oldRole = user.role;
        user.role = newRole;
        saveSiteData();

        // Log audit
        addAuditLog({
            user: currentUser.username,
            action: 'role_change',
            details: `Changement de rôle: ${username} (${oldRole} → ${newRole})`,
            ip: '127.0.0.1'
        });

        showNotification(`Rôle de ${username} changé avec succès`, 'success');
        renderRolesManagement();
    }
}

// === 2. AUDIT LOG ===
function initializeAuditLog() {
    if (!siteData.auditLog) {
        siteData.auditLog = [];
    }
}

function addAuditLog(entry) {
    initializeAuditLog();
    siteData.auditLog.push({
        timestamp: new Date().toISOString(),
        user: entry.user || 'Système',
        action: entry.action,
        details: entry.details,
        ip: entry.ip || 'N/A'
    });
    saveSiteData();
}

function renderAuditLog() {
    initializeAuditLog();
    const tbody = document.getElementById('auditLogTableBody');
    if (!tbody) return;

    let logs = [...siteData.auditLog].reverse();

    // Appliquer les filtres
    const dateFilter = document.getElementById('auditDateFilter')?.value;
    const userFilter = document.getElementById('auditUserFilter')?.value || 'all';
    const actionFilter = document.getElementById('auditActionFilter')?.value || 'all';

    if (dateFilter) {
        logs = logs.filter(log => log.timestamp.startsWith(dateFilter));
    }
    if (userFilter !== 'all') {
        logs = logs.filter(log => log.user === userFilter);
    }
    if (actionFilter !== 'all') {
        logs = logs.filter(log => log.action === actionFilter);
    }

    // Pagination
    const itemsPerPage = 20;
    const currentPage = window.currentAuditPage || 1;
    const totalPages = Math.ceil(logs.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedLogs = logs.slice(startIdx, endIdx);

    tbody.innerHTML = paginatedLogs.map(log => {
        const date = new Date(log.timestamp);
        const actionBadge = {
            'create': 'badge-success',
            'update': 'badge-warning',
            'delete': 'badge-danger',
            'login': 'badge-info',
            'role_change': 'badge-primary'
        }[log.action] || 'badge-secondary';

        return `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 12px;">${date.toLocaleString('fr-FR')}</td>
                <td style="padding: 12px;"><strong>${log.user}</strong></td>
                <td style="padding: 12px;">
                    <span class="badge ${actionBadge}">${log.action}</span>
                </td>
                <td style="padding: 12px;">${log.details}</td>
                <td style="padding: 12px;">${log.ip}</td>
            </tr>
        `;
    }).join('');

    // Pagination UI
    const paginationDiv = document.getElementById('auditPagination');
    if (paginationDiv) {
        paginationDiv.innerHTML = `
            <button class="btn btn-sm btn-outline functional-btn" onclick="changeAuditPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Précédent
            </button>
            <span style="margin: 0 16px;">Page ${currentPage} / ${totalPages}</span>
            <button class="btn btn-sm btn-outline functional-btn" onclick="changeAuditPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                Suivant <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    // Populate user filter
    const userFilterSelect = document.getElementById('auditUserFilter');
    if (userFilterSelect && userFilterSelect.options.length === 1) {
        const uniqueUsers = [...new Set(siteData.auditLog.map(log => log.user))];
        uniqueUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            userFilterSelect.appendChild(option);
        });
    }
}

function changeAuditPage(page) {
    window.currentAuditPage = page;
    renderAuditLog();
}

function applyAuditFilters() {
    window.currentAuditPage = 1;
    renderAuditLog();
}

function resetAuditFilters() {
    document.getElementById('auditDateFilter').value = '';
    document.getElementById('auditUserFilter').value = 'all';
    document.getElementById('auditActionFilter').value = 'all';
    window.currentAuditPage = 1;
    renderAuditLog();
}
function exportAuditLogCSV() {
    initializeAuditLog();
    const logs = siteData.auditLog;

    let csv = 'Date/Heure,Utilisateur,Action,Détails,IP\n';
    logs.forEach(log => {
        const date = new Date(log.timestamp).toLocaleString('fr-FR');
        csv += `"${date}","${log.user}","${log.action}","${log.details}","${log.ip}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `AE2I_AuditLog_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification('Audit Log exporté avec succès', 'success');
}

// === 3. PERSONNALISATION DU THÈME ===
function initializeThemeCustomization() {
    // Sync color inputs
    const colorInputs = [
        { colorId: 'primaryColor', textId: 'primaryColorText', cssVar: '--primary' },
        { colorId: 'primaryLightColor', textId: 'primaryLightColorText', cssVar: '--primary-light' },
        { colorId: 'primaryDarkColor', textId: 'primaryDarkColorText', cssVar: '--primary-dark' },
        { colorId: 'secondaryColor', textId: 'secondaryColorText', cssVar: '--secondary' },
        { colorId: 'accentColor', textId: 'accentColorText', cssVar: '--accent' }
    ];

    colorInputs.forEach(({ colorId, textId }) => {
        const colorInput = document.getElementById(colorId);
        const textInput = document.getElementById(textId);

        if (colorInput && textInput) {
            colorInput.addEventListener('input', (e) => {
                textInput.value = e.target.value;
            });

            textInput.addEventListener('input', (e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    colorInput.value = e.target.value;
                }
            });
        }
    });

    // Load saved theme
    loadSavedTheme();
}

function applyThemeColors() {
    const colors = {
        '--primary': document.getElementById('primaryColor').value,
        '--primary-light': document.getElementById('primaryLightColor').value,
        '--primary-dark': document.getElementById('primaryDarkColor').value,
        '--secondary': document.getElementById('secondaryColor').value,
        '--accent': document.getElementById('accentColor').value
    };

    Object.entries(colors).forEach(([varName, color]) => {
        document.documentElement.style.setProperty(varName, color);
    });

    showNotification('Couleurs appliquées (temporaire)', 'info');
}

function saveThemeColors() {
    applyThemeColors();

    const theme = {
        primary: document.getElementById('primaryColor').value,
        primaryLight: document.getElementById('primaryLightColor').value,
        primaryDark: document.getElementById('primaryDarkColor').value,
        secondary: document.getElementById('secondaryColor').value,
        accent: document.getElementById('accentColor').value
    };

    localStorage.setItem('ae2i_custom_theme', JSON.stringify(theme));

    addAuditLog({
        user: currentUser.username,
        action: 'update',
        details: 'Personnalisation du thème sauvegardée',
        ip: '127.0.0.1'
    });

    showNotification('Thème sauvegardé avec succès', 'success');
}

function resetThemeColors() {
    if (confirm('Voulez-vous vraiment réinitialiser les couleurs par défaut ?')) {
        const defaultColors = {
            primaryColor: '#0e7a9e',
            primaryLightColor: '#138397',
            primaryDarkColor: '#2988a5',
            secondaryColor: '#e63946',
            accentColor: '#00a896'
        };

        Object.entries(defaultColors).forEach(([id, color]) => {
            document.getElementById(id).value = color;
            document.getElementById(id + 'Text').value = color;
        });

        localStorage.removeItem('ae2i_custom_theme');
        applyThemeColors();
        showNotification('Thème réinitialisé', 'success');
    }
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('ae2i_custom_theme');
    if (savedTheme) {
        const theme = JSON.parse(savedTheme);

        if (theme.primary) {
            document.getElementById('primaryColor').value = theme.primary;
            document.getElementById('primaryColorText').value = theme.primary;
        }
        if (theme.primaryLight) {
            document.getElementById('primaryLightColor').value = theme.primaryLight;
            document.getElementById('primaryLightColorText').value = theme.primaryLight;
        }
        if (theme.primaryDark) {
            document.getElementById('primaryDarkColor').value = theme.primaryDark;
            document.getElementById('primaryDarkColorText').value = theme.primaryDark;
        }
        if (theme.secondary) {
            document.getElementById('secondaryColor').value = theme.secondary;
            document.getElementById('secondaryColorText').value = theme.secondary;
        }
        if (theme.accent) {
            document.getElementById('accentColor').value = theme.accent;
            document.getElementById('accentColorText').value = theme.accent;
        }

        applyThemeColors();
    }
}

// === 4. GESTION DES IMAGES ===
function initializeImageManagement() {
    const uploads = [
        { inputId: 'faviconUpload', previewId: 'faviconImg', placeholderId: 'faviconPlaceholder', storageKey: 'ae2i_favicon' },
        { inputId: 'logoUpload', previewId: 'logoImg', placeholderId: 'logoPlaceholder', storageKey: 'ae2i_logo' },
        { inputId: 'logoFooterUpload', previewId: 'logoFooterImg', placeholderId: 'logoFooterPlaceholder', storageKey: 'ae2i_logo_footer' },
        { inputId: 'watermarkUpload', previewId: 'watermarkImg', placeholderId: 'watermarkPlaceholder', storageKey: 'ae2i_watermark' }
    ];

    uploads.forEach(({ inputId, previewId, placeholderId, storageKey }) => {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        const placeholder = document.getElementById(placeholderId);

        if (input) {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const dataUrl = event.target.result;
                        preview.src = dataUrl;
                        preview.style.display = 'block';
                        placeholder.style.display = 'none';

                        // Save to localStorage temporarily
                        localStorage.setItem(storageKey + '_temp', dataUrl);

                        showNotification('Image chargée (non sauvegardée)', 'info');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Load saved images
        const savedImage = localStorage.getItem(storageKey);
        if (savedImage && preview && placeholder) {
            preview.src = savedImage;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        }
    });
}

function saveAllImages() {
    const images = [
        { tempKey: 'ae2i_favicon_temp', finalKey: 'ae2i_favicon' },
        { tempKey: 'ae2i_logo_temp', finalKey: 'ae2i_logo' },
        { tempKey: 'ae2i_logo_footer_temp', finalKey: 'ae2i_logo_footer' },
        { tempKey: 'ae2i_watermark_temp', finalKey: 'ae2i_watermark' }
    ];

    let saved = 0;
    images.forEach(({ tempKey, finalKey }) => {
        const tempImage = localStorage.getItem(tempKey);
        if (tempImage) {
            localStorage.setItem(finalKey, tempImage);
            localStorage.removeItem(tempKey);
            saved++;
        }
    });

    if (saved > 0) {
        addAuditLog({
            user: currentUser.username,
            action: 'update',
            details: `${saved} image(s) sauvegardée(s)`,
            ip: '127.0.0.1'
        });
        showNotification(`${saved} image(s) sauvegardée(s) avec succès`, 'success');
    } else {
        showNotification('Aucune nouvelle image à sauvegarder', 'info');
    }
}

function resetAllImages() {
    if (confirm('Voulez-vous vraiment supprimer toutes les images personnalisées ?')) {
        const keys = ['ae2i_favicon', 'ae2i_logo', 'ae2i_logo_footer', 'ae2i_watermark',
            'ae2i_favicon_temp', 'ae2i_logo_temp', 'ae2i_logo_footer_temp', 'ae2i_watermark_temp'];

        keys.forEach(key => localStorage.removeItem(key));

        // Reset previews
        ['faviconImg', 'logoImg', 'logoFooterImg', 'watermarkImg'].forEach(id => {
            const img = document.getElementById(id);
            if (img) img.style.display = 'none';
        });

        ['faviconPlaceholder', 'logoPlaceholder', 'logoFooterPlaceholder', 'watermarkPlaceholder'].forEach(id => {
            const placeholder = document.getElementById(id);
            if (placeholder) placeholder.style.display = 'block';
        });

        showNotification('Toutes les images ont été réinitialisées', 'success');
    }
}

// ============================================
// NOUVELLES FONCTIONNALITÉS DASHBOARD RECRUTEUR
// ============================================

// Notes internes pour chaque candidat
function initializeCandidateNotes() {
    const notes = localStorage.getItem('ae2i_candidate_notes');
    return notes ? JSON.parse(notes) : {};
}

function saveCandidateNote(cvId, note) {
    const notes = initializeCandidateNotes();
    notes[cvId] = {
        text: note,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('ae2i_candidate_notes', JSON.stringify(notes));
    showNotification('Note sauvegardée automatiquement', 'success');
}

function getCandidateNote(cvId) {
    const notes = initializeCandidateNotes();
    return notes[cvId]?.text || '';
}

// Export CSV amélioré
function exportRecruteurCSV() {
    const candidates = getRecruteurFilteredCandidates();
    if (candidates.length === 0) {
        showNotification('Aucune candidature à exporter', 'warning');
        return;
    }

    let csv = 'Nom,Email,Téléphone,Poste,Domaine,Diplôme,Expérience,Statut,Date,Notes\n';
    candidates.forEach(cv => {
        const notes = getCandidateNote(cv.id || cv.applicantEmail);
        csv += `"${cv.applicantName}","${cv.applicantEmail}","${cv.applicantPhone || 'N/A'}","${cv.jobTitle}","${cv.domaine || 'N/A'}","${cv.diplome || 'N/A'}","${cv.experience || 'N/A'}","${cv.status || (cv.processed ? 'Traité' : 'En attente')}","${new Date(cv.appliedAt).toLocaleDateString()}","${notes.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `AE2I_Candidatures_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification('Export CSV réussi', 'success');
}

// Export PDF amélioré
function exportRecruteurPDF() {
    const candidates = getRecruteurFilteredCandidates();
    if (candidates.length === 0) {
        showNotification('Aucune candidature à exporter', 'warning');
        return;
    }

    let content = `AE2I - Export Candidatures Recruteur\n`;
    content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n`;
    content += `Total: ${candidates.length} candidature(s)\n\n`;
    content += '='.repeat(80) + '\n\n';

    candidates.forEach((cv, idx) => {
        const notes = getCandidateNote(cv.id || cv.applicantEmail);
        content += `${idx + 1}. ${cv.applicantName}\n`;
        content += `   Poste: ${cv.jobTitle}\n`;
        content += `   Email: ${cv.applicantEmail}\n`;
        content += `   Téléphone: ${cv.applicantPhone || 'N/A'}\n`;
        content += `   Domaine: ${cv.domaine || 'N/A'}\n`;
        content += `   Diplôme: ${cv.diplome || 'N/A'}\n`;
        content += `   Expérience: ${cv.experience || 'N/A'} ans\n`;
        content += `   Statut: ${cv.status || (cv.processed ? 'Traité' : 'En attente')}\n`;
        content += `   Date: ${new Date(cv.appliedAt).toLocaleDateString('fr-FR')}\n`;
        if (notes) content += `   Notes: ${notes}\n`;
        content += '-'.repeat(80) + '\n\n';
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `AE2I_Candidatures_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();

    showNotification('Export PDF réussi', 'success');
}

// Visionneuse CV (Modal)
function openCVViewer(cvUrl, candidateName) {
    if (!cvUrl) {
        showNotification('CV non disponible', 'warning');
        return;
    }

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="width: 100%; max-width: 900px; height: 90%; background: white; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;">
            <div style="padding: 20px; background: var(--primary); color: white; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0;"><i class="fas fa-file-pdf"></i> CV - ${candidateName}</h3>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <button onclick="window.open('${cvUrl}', '_blank').print()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                        <i class="fas fa-print"></i> Imprimer
                    </button>
                    <a href="${cvUrl}" download style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; text-decoration: none;">
                        <i class="fas fa-download"></i> Télécharger
                    </a>
                <button onclick="this.closest('div').parentElement.parentElement.remove()" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
                </div>
            </div>
            <div style="flex: 1; overflow: auto; padding: 20px;">
                <iframe id="cvViewerFrame" src="${cvUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// ============================================
// NOUVELLES FONCTIONNALITÉS DASHBOARD LECTEUR
// ============================================

// Stats avancées
function renderLecteurAdvancedStats() {
    const allCVs = siteData.cvDatabase || [];

    // Stats par domaine
    const domaineStats = {};
    allCVs.forEach(cv => {
        const domaine = cv.domaine || 'Non spécifié';
        domaineStats[domaine] = (domaineStats[domaine] || 0) + 1;
    });

    const topDomaines = Object.entries(domaineStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Stats par wilaya
    const wilayaStats = {};
    allCVs.forEach(cv => {
        const wilaya = cv.wilaya || 'Non spécifié';
        wilayaStats[wilaya] = (wilayaStats[wilaya] || 0) + 1;
    });

    const topWilayas = Object.entries(wilayaStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Afficher dans une section dédiée (à ajouter après les cards existantes)
    const container = document.querySelector('#lecteur-page .recruteur-overview');
    if (container) {
        let statsHTML = `
            <div class="recruteur-stat-card" style="grid-column: 1 / -1; margin-top: var(--spacing-md);">
                <h4 style="margin-bottom: var(--spacing-md);"><i class="fas fa-chart-pie"></i> Top 5 Domaines</h4>
                ${topDomaines.map(([domaine, count]) => `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>${domaine}</span>
                        <span style="font-weight: bold; color: var(--primary);">${count}</span>
                    </div>
                `).join('')}
            </div>
            <div class="recruteur-stat-card" style="grid-column: 1 / -1;">
                <h4 style="margin-bottom: var(--spacing-md);"><i class="fas fa-map-marked-alt"></i> Top 5 Wilayas</h4>
                ${topWilayas.map(([wilaya, count]) => `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>${wilaya}</span>
                        <span style="font-weight: bold; color: var(--accent);">${count}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Vérifier si déjà ajouté
        if (!document.getElementById('lecteur-advanced-stats')) {
            const statsDiv = document.createElement('div');
            statsDiv.id = 'lecteur-advanced-stats';
            statsDiv.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-md); margin-top: var(--spacing-lg);';
            statsDiv.innerHTML = statsHTML;
            container.parentElement.insertBefore(statsDiv, container.nextSibling);
        }
    }
}

// Système d'alertes email
// ✅ REMOVED: Email notification feature for Lecteur dashboard
// The initializeLecteurAlerts() and saveLecteurAlert() functions have been removed as requested

// Expose new functions to window
window.toggleSocialNetworks = toggleSocialNetworks;
window.applySocialsSettings = applySocialsSettings;
window.exportCompleteDatabase = exportCompleteDatabase;
window.exportCompleteDatabaseZip = exportCompleteDatabaseZip;
window.confirmClearDatabase = confirmClearDatabase;

// Admin Dashboard - Gestion des rôles
window.renderRolesManagement = renderRolesManagement;
window.changeUserRole = changeUserRole;

// Admin Dashboard - Audit Log
window.addAuditLog = addAuditLog;
window.renderAuditLog = renderAuditLog;
window.changeAuditPage = changeAuditPage;
window.applyAuditFilters = applyAuditFilters;
window.resetAuditFilters = resetAuditFilters;
window.exportAuditLogCSV = exportAuditLogCSV;

// Admin Dashboard - Thème
window.initializeThemeCustomization = initializeThemeCustomization;
window.applyThemeColors = applyThemeColors;
window.saveThemeColors = saveThemeColors;
window.resetThemeColors = resetThemeColors;

// Admin Dashboard - Images
window.initializeImageManagement = initializeImageManagement;
window.saveAllImages = saveAllImages;
window.resetAllImages = resetAllImages;

// Recruteur Dashboard
window.saveCandidateNote = saveCandidateNote;
window.getCandidateNote = getCandidateNote;
window.exportRecruteurCSV = exportRecruteurCSV;
window.exportRecruteurPDF = exportRecruteurPDF;
window.openCVViewer = openCVViewer;

// Lecteur Dashboard
window.renderLecteurAdvancedStats = renderLecteurAdvancedStats;
// Removed: initializeLecteurAlerts and saveLecteurAlert functions
// window.initializeLecteurAlerts = initializeLecteurAlerts;
// window.saveLecteurAlert = saveLecteurAlert;

// Version check function for testing
window.checkCodeVersion = function () {
    const version = {
        date: '2025-12-11',
        build: '1.0.0',
        features: ['logout-fix', 'session-restoration-fix', 'role-based-routing']
    };
    console.log('📦 Code Version:', version);
    console.log('✅ Logout fix applied:', typeof justLoggedOut !== 'undefined');
    console.log('✅ Firebase logout available:', typeof logoutFirebase === 'function');
    return version;
};

// Inspect Firebase cvDatabase collection - DIRECT QUERY to verify all documents
window.inspectFirebaseCandidatures = async function () {
    if (!window.firebaseHelper) {
        console.error('❌ Firebase helper not available');
        return;
    }

    // First, ensure user document exists for permissions
    const currentUser = window.currentUser || JSON.parse(localStorage.getItem('ae2i_current_user') || '{}');
    if (currentUser.uid && currentUser.email && currentUser.role) {
        console.log('🔧 [INSPECT] Ensuring user document exists for permissions...');
        await ensureUserDocumentInFirestore(currentUser.uid, currentUser.email, currentUser.role);
        // Wait a bit for Firestore to update
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
        console.log('🔍 [INSPECT] Loading ALL candidatures from Firebase cvDatabase collection...');
        console.log('🔍 [INSPECT] Current user:', currentUser);

        // Try direct query without any constraints to get ALL documents
        const result = await window.firebaseHelper.getCollection('cvDatabase', []);

        if (result.success && result.data) {
            console.log('✅ [INSPECT] Found', result.data.length, 'candidatures in Firebase (direct query)');
            console.log('📦 [INSPECT] All document IDs:', result.data.map(d => d.id));
            console.log('📦 [INSPECT] Raw Firebase data:', result.data);

            // Compare with listener data
            console.log('📊 [INSPECT] Listener has', siteData.cvDatabase?.length || 0, 'candidatures');
            console.log('📊 [INSPECT] Listener IDs:', siteData.cvDatabase?.map(c => c.id) || []);

            if (result.data.length !== (siteData.cvDatabase?.length || 0)) {
                console.warn('⚠️ [INSPECT] MISMATCH! Direct query:', result.data.length, 'vs Listener:', siteData.cvDatabase?.length || 0);
                const missingIds = result.data.map(d => d.id).filter(id => !siteData.cvDatabase?.some(c => c.id === id));
                if (missingIds.length > 0) {
                    console.warn('⚠️ [INSPECT] Missing IDs in listener:', missingIds);
                }
                const extraIds = (siteData.cvDatabase || []).map(c => c.id).filter(id => !result.data.some(d => d.id === id));
                if (extraIds.length > 0) {
                    console.warn('⚠️ [INSPECT] Extra IDs in listener (not in Firebase):', extraIds);
                }
            }

            result.data.forEach((doc, index) => {
                console.log(`\n📄 [INSPECT] Candidature #${index + 1}:`);
                console.log('  ID:', doc.id);
                console.log('  All fields:', Object.keys(doc));
                console.log('  Name:', doc.applicantName || doc.fullName || doc.applicantFirstName + ' ' + doc.applicantLastName);
                console.log('  Email:', doc.applicantEmail || doc.email);
                console.log('  Phone:', doc.applicantPhone || doc.phone);
                console.log('  Job Title:', doc.jobTitle || doc.position);
                console.log('  CV URL:', doc.cvUrl || 'NOT SET');
                console.log('  CV R2 URL:', doc.cvR2Url || 'NOT SET');
                console.log('  CV File Name:', doc.cvFileName || 'NOT SET');
                console.log('  Full data:', JSON.stringify(doc, null, 2));
            });

            return result.data;
        } else {
            console.error('❌ [INSPECT] Failed to load:', result.error);
            console.error('❌ [INSPECT] Error details:', result);

            // If permissions error, try to fix and retry
            if (result.error && result.error.includes('permission')) {
                console.log('💡 [INSPECT] Permission error detected. User document may be missing.');
                console.log('💡 [INSPECT] Try running: fixUserPermissions()');
            }

            return null;
        }
    } catch (error) {
        console.error('❌ [INSPECT] Error:', error);

        // If permissions error, suggest fix
        if (error.message && error.message.includes('permission')) {
            console.log('💡 [INSPECT] Permission error. Try running: fixUserPermissions()');
        }

        return null;
    }
};

// Inspect local cvDatabase
window.inspectLocalCandidatures = function () {
    console.log('🔍 [INSPECT LOCAL] Current cvDatabase:');
    console.log('  Count:', siteData.cvDatabase?.length || 0);

    if (siteData.cvDatabase && siteData.cvDatabase.length > 0) {
        siteData.cvDatabase.forEach((cv, index) => {
            console.log(`\n📄 [INSPECT LOCAL] Candidature #${index + 1}:`);
            console.log('  ID:', cv.id);
            console.log('  Name:', cv.applicantName);
            console.log('  Email:', cv.applicantEmail);
            console.log('  Phone:', cv.applicantPhone);
            console.log('  Job Title:', cv.jobTitle);
            console.log('  CV URL:', cv.cvUrl);
            console.log('  CV R2 URL:', cv.cvR2Url);
            console.log('  CV File Name:', cv.cvFileName);
            console.log('  All fields:', Object.keys(cv));
        });
    } else {
        console.log('  ⚠️ No candidatures in local database');
    }

    return siteData.cvDatabase;
};

// Comprehensive logout test function
window.testLogout = async function () {
    console.log('🧪 Testing logout functionality...');

    // Check current state
    const beforeState = {
        currentUser: JSON.parse(JSON.stringify(window.currentUser || {})),
        localStorage: localStorage.getItem('ae2i_current_user'),
        justLoggedOut: typeof justLoggedOut !== 'undefined' ? justLoggedOut : 'undefined'
    };
    console.log('📊 State BEFORE logout:', beforeState);

    // Perform logout
    try {
        await logoutFirebase();
        console.log('✅ Logout function completed');
    } catch (error) {
        console.error('❌ Logout error:', error);
        return false;
    }

    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check state after logout
    const afterState = {
        currentUser: JSON.parse(JSON.stringify(window.currentUser || {})),
        localStorage: localStorage.getItem('ae2i_current_user'),
        isLoggedIn: window.currentUser?.isLoggedIn || false
    };
    console.log('📊 State AFTER logout:', afterState);

    // Verify logout succeeded
    const logoutSuccess = !afterState.isLoggedIn && !afterState.localStorage;
    if (logoutSuccess) {
        console.log('✅ Logout test PASSED - User is logged out');
    } else {
        console.error('❌ Logout test FAILED - Session still exists');
        console.log('Current user:', afterState.currentUser);
        console.log('LocalStorage:', afterState.localStorage);
    }

    return logoutSuccess;
};

// Force logout function (nuclear option)
window.forceLogout = function () {
    console.log('💣 FORCE LOGOUT - Clearing everything...');

    // Set logout flag
    if (typeof justLoggedOut !== 'undefined') {
        justLoggedOut = true;
    }

    // Clear Firebase auth
    if (window.firebaseServices?.auth?.signOut) {
        window.firebaseServices.auth.signOut().catch(console.error);
    }
    if (window.firebaseHelper?.logout) {
        window.firebaseHelper.logout().catch(console.error);
    }

    // Clear all storage
    localStorage.removeItem('ae2i_current_user');
    sessionStorage.clear();

    // Reset user
    window.currentUser = { username: "guest", role: "guest", isLoggedIn: false };

    // Update UI
    if (typeof updateLoginButton === 'function') updateLoginButton();
    if (typeof updateLoginStatus === 'function') updateLoginStatus();
    if (typeof showPage === 'function') showPage('home');

    console.log('✅ Force logout completed');
    console.log('Current user:', window.currentUser);
    console.log('LocalStorage session:', localStorage.getItem('ae2i_current_user'));

    return true;
};

// Test login button function
window.testLoginButton = function () {
    console.log('🧪 Testing login button...');

    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');

    if (!loginBtn) {
        console.error('❌ Login button not found!');
        return false;
    }

    console.log('✅ Login button found');
    console.log('  - Button text:', loginBtn.textContent);
    console.log('  - Button innerHTML:', loginBtn.innerHTML);
    console.log('  - Has "logged-in" class:', loginBtn.classList.contains('logged-in'));
    console.log('  - Current user:', window.currentUser);
    console.log('  - Is logged in:', window.currentUser?.isLoggedIn);
    console.log('  - Login modal exists:', !!loginModal);

    // Check if button should show login or dashboard
    const shouldShowLogin = !window.currentUser?.isLoggedIn || window.currentUser?.role === 'guest';

    if (shouldShowLogin) {
        console.log('✅ Button should show LOGIN (user is logged out)');
        console.log('  - Clicking button should open login modal');
    } else {
        console.log('✅ Button should show DASHBOARD (user is logged in)');
        console.log('  - Clicking button should route to dashboard');
    }

    return true;
};

// Open login modal manually
window.openLoginModal = function () {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.add('show');
        setTimeout(() => {
            const usernameInput = document.getElementById('loginUsername');
            if (usernameInput) usernameInput.focus();
        }, 300);
        console.log('✅ Login modal opened');
        return true;
    } else {
        console.error('❌ Login modal not found!');
        return false;
    }
};

// Note: inspectFirebaseCandidatures is defined earlier (line ~11628) as an async function
// that does a DIRECT QUERY to Firebase. This duplicate was removed.

// Inspect local cvDatabase
window.inspectLocalCandidatures = function () {
    console.log('🔍 [INSPECT LOCAL] Current cvDatabase:');
    console.log('  Count:', siteData.cvDatabase?.length || 0);

    if (siteData.cvDatabase && siteData.cvDatabase.length > 0) {
        siteData.cvDatabase.forEach((cv, index) => {
            console.log(`\n📄 [INSPECT LOCAL] Candidature #${index + 1}:`);
            console.log('  ID:', cv.id);
            console.log('  Name:', cv.applicantName);
            console.log('  Email:', cv.applicantEmail);
            console.log('  Phone:', cv.applicantPhone);
            console.log('  Job Title:', cv.jobTitle);
            console.log('  CV URL:', cv.cvUrl);
            console.log('  CV R2 URL:', cv.cvR2Url);
            console.log('  CV File Name:', cv.cvFileName);
            console.log('  All fields:', Object.keys(cv));
        });
    } else {
        console.log('  ⚠️ No candidatures in local database');
    }

    return siteData.cvDatabase;
};

// Check logout status
window.checkLogoutStatus = function () {
    const loggedOutFlag = localStorage.getItem('ae2i_logged_out');
    const savedSession = localStorage.getItem('ae2i_current_user');
    const currentUserState = window.currentUser;

    console.log('🔍 [LOGOUT STATUS CHECK]');
    console.log('  - Logout flag (ae2i_logged_out):', loggedOutFlag);
    console.log('  - Saved session (ae2i_current_user):', savedSession ? 'EXISTS' : 'NONE');
    console.log('  - Current user state:', currentUserState);
    console.log('  - Is logged in:', currentUserState?.isLoggedIn);

    if (loggedOutFlag === 'true') {
        console.log('✅ Logout flag is SET - user should stay logged out');
    } else {
        console.log('⚠️ Logout flag is NOT SET - session may be restored');
    }

    return {
        logoutFlag: loggedOutFlag,
        hasSession: !!savedSession,
        currentUser: currentUserState
    };
};

// Force clear logout flag (for testing)
window.clearLogoutFlag = function () {
    localStorage.removeItem('ae2i_logged_out');
    console.log('✅ Logout flag cleared');
};

// Delete multiple candidatures from Firebase
window.deleteMultipleCandidatures = async function (cvIds) {
    if (!Array.isArray(cvIds) || cvIds.length === 0) {
        console.error('❌ [BULK DELETE] No IDs provided');
        return { success: false, error: 'No IDs provided' };
    }

    // First, ensure user document exists for permissions
    if (APP_MODE === 'FIREBASE' && window.firebaseHelper && currentUser?.uid) {
        console.log('🔧 [BULK DELETE] Ensuring user document exists for permissions...');
        await ensureUserDocumentInFirestore(currentUser.uid, currentUser.email, currentUser.role);
    }

    // Skip confirmation if called from deleteAllCandidatures (already confirmed)
    const skipConfirm = window._skipDeleteConfirm;
    window._skipDeleteConfirm = false; // Reset flag

    if (!skipConfirm && !confirm(`Supprimer ${cvIds.length} candidature(s)? Cette action est irréversible.`)) {
        return { success: false, cancelled: true };
    }

    console.log(`🗑️ [BULK DELETE] Deleting ${cvIds.length} candidatures...`);

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const cvId of cvIds) {
        try {
            // Find the candidature
            let cv = siteData.cvDatabase.find(c =>
                c.id === cvId || c.id == cvId || String(c.id) === String(cvId) || c.firebaseId === cvId
            );

            if (!cv) {
                console.warn(`⚠️ [BULK DELETE] Candidature not found: ${cvId}`);
                failCount++;
                continue;
            }

            const firebaseId = cv.firebaseId || cv.id;
            // Convert to string - Firebase requires string IDs
            const firebaseIdString = String(firebaseId);

            // Delete from Firebase
            if (APP_MODE === 'FIREBASE' && window.firebaseHelper && firebaseIdString) {
                const result = await window.firebaseHelper.deleteDocument('cvDatabase', firebaseIdString);
                if (!result.success) {
                    console.error(`❌ [BULK DELETE] Failed to delete ${firebaseId}:`, result.error);
                    errors.push({ id: firebaseId, error: result.error });
                    failCount++;
                    continue;
                }
            }

            // Delete from local database
            const cvIndex = siteData.cvDatabase.findIndex(c =>
                c.id === cvId || c.id == cvId || String(c.id) === String(cvId) || c.firebaseId === firebaseId
            );

            if (cvIndex >= 0) {
                siteData.cvDatabase.splice(cvIndex, 1);
                successCount++;
            }
        } catch (error) {
            console.error(`❌ [BULK DELETE] Error deleting ${cvId}:`, error);
            errors.push({ id: cvId, error: error.message });
            failCount++;
        }
    }

    // Save local changes
    if (successCount > 0) {
        saveSiteData();
        if (typeof renderAdminCvDatabase === 'function') renderAdminCvDatabase();
        if (typeof renderRecruteurApplications === 'function') renderRecruteurApplications();
        if (typeof renderLecteurCvDatabase === 'function') renderLecteurCvDatabase();
    }

    const message = `Supprimé: ${successCount}, Échoué: ${failCount}`;
    if (failCount > 0) {
        showNotification(message, 'warning');
        console.error('❌ [BULK DELETE] Errors:', errors);
    } else {
        showNotification(`${successCount} candidature(s) supprimée(s)`, 'success');
    }

    logActivity(currentUser.username, `Suppression en masse: ${successCount} candidatures`);

    return { success: true, successCount, failCount, errors };
};

// Delete all test candidatures (filter by email pattern or name)
window.deleteTestCandidatures = async function () {
    const testPatterns = ['test', 'example.com', 'Test', 'TEST'];

    const testCandidatures = siteData.cvDatabase.filter(cv => {
        const email = (cv.applicantEmail || cv.email || '').toLowerCase();
        const name = (cv.applicantName || '').toLowerCase();
        return testPatterns.some(pattern =>
            email.includes(pattern.toLowerCase()) || name.includes(pattern.toLowerCase())
        );
    });

    if (testCandidatures.length === 0) {
        showNotification('Aucune candidature de test trouvée', 'info');
        return;
    }

    console.log(`🔍 [DELETE TESTS] Found ${testCandidatures.length} test candidatures:`, testCandidatures.map(c => ({
        id: c.id,
        name: c.applicantName,
        email: c.applicantEmail
    })));

    if (!confirm(`Supprimer ${testCandidatures.length} candidature(s) de test? Cette action est irréversible.`)) {
        return;
    }

    const cvIds = testCandidatures.map(c => c.firebaseId || c.id);
    return await window.deleteMultipleCandidatures(cvIds);
};

// Delete all candidatures (use with caution!)
window.deleteAllCandidatures = async function () {
    // Check Firebase Auth first
    if (APP_MODE === 'FIREBASE') {
        const authUser = window.firebaseServices?.auth?.currentUser;
        if (!authUser) {
            console.error('❌ [DELETE ALL] Not authenticated with Firebase Auth!');
            console.log('💡 Run: await quickLogin()');
            showNotification('Vous devez être connecté avec Firebase Auth pour supprimer', 'error');
            return { success: false, error: 'Not authenticated' };
        }

        // Ensure user document exists for permissions
        if (window.firebaseHelper && currentUser?.uid) {
            console.log('🔧 [DELETE ALL] Ensuring user document exists for permissions...');
            await ensureUserDocumentInFirestore(currentUser.uid, currentUser.email, currentUser.role);
        }
    }

    const totalCount = siteData.cvDatabase?.length || 0;
    if (totalCount === 0) {
        showNotification('Aucune candidature à supprimer', 'info');
        return { success: true, successCount: 0, failCount: 0 };
    }

    if (!confirm(`⚠️ ATTENTION: Supprimer TOUTES les ${totalCount} candidatures? Cette action est irréversible et ne peut pas être annulée!`)) {
        return { success: false, cancelled: true };
    }

    if (!confirm('Êtes-vous ABSOLUMENT SÛR? Cliquez OK pour confirmer.')) {
        return { success: false, cancelled: true };
    }

    console.log(`🗑️ [DELETE ALL] Starting deletion of ${totalCount} candidatures...`);
    const allIds = siteData.cvDatabase.map(c => c.firebaseId || c.id);
    window._skipDeleteConfirm = true; // Skip double confirmation in deleteMultipleCandidatures
    const result = await window.deleteMultipleCandidatures(allIds);

    if (result.success) {
        console.log(`✅ [DELETE ALL] Completed: ${result.successCount} deleted, ${result.failCount} failed`);
        // Refresh UI
        if (typeof renderAdminCvDatabase === 'function') renderAdminCvDatabase();
        if (typeof renderRecruteurApplications === 'function') renderRecruteurApplications();
        if (typeof renderLecteurCvDatabase === 'function') renderLecteurCvDatabase();
    }

    return result;
};

// Fix user permissions - ensure user document exists in Firestore with CORRECT UID
window.fixUserPermissions = async function () {
    const currentUser = window.currentUser || JSON.parse(localStorage.getItem('ae2i_current_user') || '{}');

    if (!currentUser || !currentUser.uid || !currentUser.email) {
        console.error('❌ No user logged in or missing UID/email');
        showNotification('Vous devez être connecté', 'error');
        return;
    }

    console.log('🔧 [FIX PERMISSIONS] Current user:', currentUser);
    console.log('🔧 [FIX PERMISSIONS] Firebase Auth UID:', currentUser.uid);
    console.log('🔧 [FIX PERMISSIONS] Email:', currentUser.email);
    console.log('🔧 [FIX PERMISSIONS] Role:', currentUser.role);

    // Check if document exists with correct UID
    const userDocByUid = await window.firebaseHelper.getDocument('users', currentUser.uid);

    if (userDocByUid.success && userDocByUid.data) {
        console.log('✅ [FIX PERMISSIONS] User document exists with correct UID');
        // Update role if needed
        if (userDocByUid.data.role !== currentUser.role) {
            console.log('📝 [FIX PERMISSIONS] Updating role from', userDocByUid.data.role, 'to', currentUser.role);
            await window.firebaseHelper.updateDocument('users', currentUser.uid, {
                role: currentUser.role,
                email: currentUser.email,
                updatedAt: new Date().toISOString()
            });
        }
        showNotification('✅ Document existe avec le bon UID. Permissions OK!', 'success');
        return;
    }

    // Document doesn't exist with UID - try to find by email
    console.log('⚠️ [FIX PERMISSIONS] No document found with UID. Searching by email...');
    const { where } = window.firebaseServices || {};
    if (where) {
        const byEmail = await window.firebaseHelper.getCollection('users', [where('email', '==', currentUser.email)]);

        if (byEmail.success && byEmail.data && byEmail.data.length > 0) {
            const oldDoc = byEmail.data[0];
            console.log('📋 [FIX PERMISSIONS] Found document by email with ID:', oldDoc.id);
            console.log('📋 [FIX PERMISSIONS] Old document data:', oldDoc);

            if (oldDoc.id === currentUser.uid) {
                // IDs match, just update
                console.log('✅ [FIX PERMISSIONS] Document ID matches UID, updating...');
                await ensureUserDocumentInFirestore(currentUser.uid, currentUser.email, currentUser.role);
                showNotification('✅ Document mis à jour avec le bon UID.', 'success');
                return;
            }

            // Create new document with correct UID
            console.log('📝 [FIX PERMISSIONS] Creating new document with correct UID:', currentUser.uid);
            const createResult = await window.firebaseHelper.setDocument('users', currentUser.uid, {
                email: currentUser.email,
                role: currentUser.role,
                username: oldDoc.username || currentUser.email.split('@')[0],
                active: oldDoc.active !== undefined ? oldDoc.active : true,
                permissions: oldDoc.permissions || [],
                createdAt: oldDoc.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, false);

            if (createResult.success) {
                console.log('✅ [FIX PERMISSIONS] New document created with correct UID');
                console.log('💡 [FIX PERMISSIONS] Old document ID:', oldDoc.id, '- You can delete it manually in Firebase console');
                showNotification('✅ Document créé avec le bon UID. L\'ancien document (' + oldDoc.id + ') peut être supprimé.', 'success');
            } else {
                console.error('❌ [FIX PERMISSIONS] Failed to create document:', createResult.error);
                showNotification('❌ Erreur lors de la création du document.', 'error');
            }
        } else {
            // No document found by email - create new one
            console.log('📝 [FIX PERMISSIONS] No document found by email. Creating new one...');
            await ensureUserDocumentInFirestore(currentUser.uid, currentUser.email, currentUser.role);
            showNotification('✅ Nouveau document créé avec le bon UID.', 'success');
        }
    } else {
        // Fallback: just try to create
        await ensureUserDocumentInFirestore(currentUser.uid, currentUser.email, currentUser.role);
        showNotification('✅ Permissions vérifiées.', 'success');
    }
};

// ============================================
// DEBUG FUNCTIONS FOR CONSOLE TESTING
// ============================================

// Debug cvDatabase - Check everything
window.debugCvDatabase = async function () {
    console.log('🔍 ===== CV DATABASE DEBUG =====');
    console.log('');

    // 1. Check current user
    console.log('1️⃣ CURRENT USER:');
    console.log('  - currentUser:', window.currentUser);
    console.log('  - UID:', window.currentUser?.uid);
    console.log('  - Email:', window.currentUser?.email);
    console.log('  - Role:', window.currentUser?.role);
    console.log('  - IsLoggedIn:', window.currentUser?.isLoggedIn);
    console.log('');

    // 2. Check Firebase Auth
    console.log('2️⃣ FIREBASE AUTH:');
    const authUser = window.firebaseServices?.auth?.currentUser;
    console.log('  - Auth User:', authUser);
    console.log('  - Auth UID:', authUser?.uid);
    console.log('  - Auth Email:', authUser?.email);
    console.log('');

    // 3. Check user document in Firestore
    console.log('3️⃣ USER DOCUMENT IN FIRESTORE:');
    if (window.currentUser?.uid && window.firebaseHelper) {
        try {
            const userDoc = await window.firebaseHelper.getDocument('users', window.currentUser.uid);
            console.log('  - User Doc Result:', userDoc);
            if (userDoc.success && userDoc.data) {
                console.log('  - ✅ User document exists');
                console.log('  - Role:', userDoc.data.role);
                console.log('  - Email:', userDoc.data.email);
                console.log('  - Permissions:', userDoc.data.permissions);
            } else {
                console.log('  - ❌ User document NOT found or error:', userDoc.error);
            }
        } catch (e) {
            console.log('  - ❌ Error getting user document:', e);
        }
    } else {
        console.log('  - ⚠️ No UID or firebaseHelper not available');
    }
    console.log('');

    // 4. Check siteData.cvDatabase (what listener populated)
    console.log('4️⃣ SITE DATA CV DATABASE (from listener):');
    console.log('  - Count:', siteData.cvDatabase?.length || 0);
    console.log('  - All IDs:', siteData.cvDatabase?.map(c => c.id) || []);
    if (siteData.cvDatabase && siteData.cvDatabase.length > 0) {
        console.log('  - First 3 documents:');
        siteData.cvDatabase.slice(0, 3).forEach((cv, i) => {
            console.log(`    ${i + 1}. ID: ${cv.id}, Name: ${cv.applicantName || cv.fullName}, Email: ${cv.applicantEmail || cv.email}`);
        });
    }
    console.log('');

    // 5. Direct query to Firebase (bypass listener)
    console.log('5️⃣ DIRECT FIREBASE QUERY (bypass listener):');
    if (window.firebaseHelper) {
        try {
            const result = await window.firebaseHelper.getCollection('cvDatabase', []);
            console.log('  - Query Result:', result);
            if (result.success && result.data) {
                console.log('  - ✅ Query successful');
                console.log('  - Count:', result.data.length);
                console.log('  - All IDs:', result.data.map(d => d.id));
                console.log('  - First 3 documents:');
                result.data.slice(0, 3).forEach((doc, i) => {
                    console.log(`    ${i + 1}. ID: ${doc.id}, Name: ${doc.fullName || doc.applicantName}, Email: ${doc.email || doc.applicantEmail}`);
                });

                // Compare with listener data
                console.log('');
                console.log('  - COMPARISON:');
                console.log(`    Listener has: ${siteData.cvDatabase?.length || 0} documents`);
                console.log(`    Direct query has: ${result.data.length} documents`);
                if (result.data.length !== (siteData.cvDatabase?.length || 0)) {
                    console.log('    ⚠️ MISMATCH!');
                    const listenerIds = (siteData.cvDatabase || []).map(c => c.id);
                    const queryIds = result.data.map(d => d.id);
                    const missing = queryIds.filter(id => !listenerIds.includes(id));
                    const extra = listenerIds.filter(id => !queryIds.includes(id));
                    if (missing.length > 0) {
                        console.log('    Missing in listener:', missing);
                    }
                    if (extra.length > 0) {
                        console.log('    Extra in listener:', extra);
                    }
                } else {
                    console.log('    ✅ Counts match!');
                }
            } else {
                console.log('  - ❌ Query failed:', result.error);
            }
        } catch (e) {
            console.log('  - ❌ Error querying:', e);
        }
    } else {
        console.log('  - ⚠️ firebaseHelper not available');
    }
    console.log('');

    // 6. Check Firestore rules (test permission)
    console.log('6️⃣ PERMISSION TEST:');
    if (window.firebaseHelper && window.currentUser?.uid) {
        try {
            // Try to read one document
            const testDoc = await window.firebaseHelper.getCollection('cvDatabase', []);
            if (testDoc.success) {
                console.log('  - ✅ Permission check passed');
            } else {
                console.log('  - ❌ Permission check failed:', testDoc.error);
            }
        } catch (e) {
            console.log('  - ❌ Permission error:', e);
        }
    }
    console.log('');

    console.log('🔍 ===== END DEBUG =====');
    return {
        user: window.currentUser,
        authUser: authUser,
        listenerCount: siteData.cvDatabase?.length || 0,
        listenerIds: siteData.cvDatabase?.map(c => c.id) || []
    };
};

// Quick test - Get all candidatures count
window.getCvCount = function () {
    console.log('📊 CV Counts:');
    console.log('  - Listener (siteData.cvDatabase):', siteData.cvDatabase?.length || 0);
    console.log('  - Current user:', window.currentUser?.role);
    return siteData.cvDatabase?.length || 0;
};

// Force Firebase Auth login using stored credentials
window.forceFirebaseLogin = async function () {
    console.log('🔐 ===== FORCE FIREBASE LOGIN =====');

    const currentUser = window.currentUser || JSON.parse(localStorage.getItem('ae2i_current_user') || '{}');

    if (!currentUser.email) {
        console.error('❌ No email found in currentUser. You need to log in through the login form.');
        return false;
    }

    console.log('📧 Email:', currentUser.email);
    console.log('💡 You need to enter your password to authenticate with Firebase.');
    console.log('💡 Run: await forceFirebaseLoginWithPassword("your_password")');

    return false;
};

// Force Firebase Auth login with password
window.forceFirebaseLoginWithPassword = async function (password) {
    console.log('🔐 ===== FORCE FIREBASE LOGIN WITH PASSWORD =====');

    const currentUser = window.currentUser || JSON.parse(localStorage.getItem('ae2i_current_user') || '{}');

    if (!currentUser.email) {
        console.error('❌ No email found in currentUser');
        return false;
    }

    if (!password) {
        console.error('❌ Password required');
        return false;
    }

    console.log('🔐 Attempting Firebase Auth login for:', currentUser.email);

    try {
        if (!window.firebaseHelper || !window.firebaseHelper.login) {
            console.error('❌ FirebaseHelper not available');
            return false;
        }

        const result = await window.firebaseHelper.login(currentUser.email, password);

        if (result.success) {
            console.log('✅ Firebase Auth login successful!');
            console.log('✅ User:', result.user);
            console.log('💡 Wait a few seconds for the listener to sync...');
            return true;
        } else {
            console.error('❌ Login failed:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        return false;
    }
};

// Check Firebase Auth status
window.checkFirebaseAuth = function () {
    console.log('🔍 ===== FIREBASE AUTH STATUS =====');
    const authUser = window.firebaseServices?.auth?.currentUser;
    console.log('  - Firebase Auth User:', authUser);
    console.log('  - Is Authenticated:', authUser !== null);
    console.log('  - Current User (localStorage):', window.currentUser);
    console.log('  - Match:', authUser?.uid === window.currentUser?.uid);

    if (!authUser) {
        console.log('');
        console.log('⚠️ NOT AUTHENTICATED WITH FIREBASE!');
        console.log('💡 You need to log in through Firebase Auth.');
        console.log('💡 Options:');
        console.log('  1. Use the login form (click login button)');
        console.log('  2. Run: await forceFirebaseLoginWithPassword("your_password")');
        console.log('  3. Run: await quickLogin() - will prompt for password');
    }

    return authUser;
};

// Quick login helper - prompts for password
window.quickLogin = async function () {
    const currentUser = window.currentUser || JSON.parse(localStorage.getItem('ae2i_current_user') || '{}');

    if (!currentUser.email) {
        console.error('❌ No email found. Please use the login form.');
        return false;
    }

    const password = prompt(`Enter password for ${currentUser.email}:`);
    if (!password) {
        console.log('❌ Login cancelled');
        return false;
    }

    console.log('🔐 Logging in...');
    const result = await forceFirebaseLoginWithPassword(password);

    if (result) {
        console.log('✅ Login successful! Waiting for listener to sync...');
        console.log('💡 Run: await debugCvDatabase() in a few seconds');
    }

    return result;
};

// Auto-restore Firebase Auth session if localStorage has user but Firebase Auth is null
window.autoRestoreFirebaseAuth = async function () {
    console.log('🔄 ===== AUTO-RESTORE FIREBASE AUTH =====');

    const authUser = window.firebaseServices?.auth?.currentUser;
    const savedUser = JSON.parse(localStorage.getItem('ae2i_current_user') || '{}');

    console.log('  - Firebase Auth User:', authUser ? '✅ Authenticated' : '❌ Not authenticated');
    console.log('  - Saved User:', savedUser.email || 'None');

    if (authUser) {
        console.log('✅ Already authenticated with Firebase Auth');
        return true;
    }

    if (!savedUser.email) {
        console.log('⚠️ No saved user found. Please log in.');
        return false;
    }

    console.log('');
    console.log('⚠️ Firebase Auth session expired but localStorage has user.');
    console.log('💡 You need to log in again through Firebase Auth.');
    console.log('💡 Run: await quickLogin()');
    console.log('💡 Or use the login button in the UI');

    return false;
};

// Force refresh listener
window.refreshCvListener = function () {
    console.log('🔄 Refreshing cvDatabase listener...');
    if (window.firebaseHelper && typeof window.firebaseHelper.listenToCollection === 'function') {
        // The listener should already be active, but we can check
        console.log('✅ Listener should be active');
        console.log('💡 Try refreshing the page to restart listener');
    } else {
        console.log('❌ Listener not available');
    }
};

console.log('🎉 AE2I Enhanced Ultra-Professional Site - Multi-role System with Advanced Features + Autosave Initialized Successfully');
// ============================================
// FORCE GLOBAL EXPOSURE - FIN DU FICHIER
// ============================================

// Exposer tout ce qui n'est pas déjà exposé
const globalFunctions = [
    'testFirebaseConnection',
    'initializeFirebase',
    'uploadCVToR2',
    'saveApplicationToFirebase',
    'isFirebaseAvailable',
    'toggleAppMode'
];

globalFunctions.forEach(funcName => {
    if (typeof eval(funcName) === 'function' && typeof window[funcName] === 'undefined') {
        window[funcName] = eval(funcName);
        console.log(`✅ ${funcName} exposée globalement`);
    }
});

console.log('🔥 Toutes les fonctions Firebase sont maintenant disponibles via window.*');