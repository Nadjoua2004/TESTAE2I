/* SECTION: API/LOCAL MODE CONFIG */
        const MODE = 'LOCAL'; // 'API' | 'LOCAL'
        const API_BASE_URL = '................';
        const API_KEY = '.................';

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
            if (siteData.settings.maintenanceMode && currentUser.role !== 'admin' && pageId !== 'maintenance') {
                pageId = 'maintenance';
            }

            if (!checkPageAccess(pageId)) {
                return;
            }

            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active', 'fade-in');
            });

            const targetSection = document.getElementById(`${pageId}-page`);
            if (targetSection) {
                targetSection.classList.add('active', 'fade-in');
                currentPage = pageId;

                updateNavigation(pageId);

                if (addToHistory) {
                    window.history.pushState({ page: pageId }, '', `#${pageId}`);
                }

                window.scrollTo({ top: 0, behavior: 'smooth' });

                triggerPageScript(pageId);

                logActivity(currentUser.username || 'visitor', `Navigation vers page ${pageId}`);
            }
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
            console.log('🔍 [ACCESS CHECK] Page:', pageId, 'currentUser:', JSON.stringify(currentUser));

            if (siteData.settings.maintenanceMode && currentUser.role !== 'admin' && pageId !== 'maintenance') {
                console.log('❌ [ACCESS CHECK] Bloqué par mode maintenance');
                return false;
            }

            if (siteData.settings.sectionsEnabled && siteData.settings.sectionsEnabled[pageId] === false) {
                console.log('❌ [ACCESS CHECK] Section désactivée');
                showNotification(siteData.language === 'en' ? 'This section is temporarily disabled' : 'Cette section est temporairement désactivée', 'warning');
                return false;
            }

            /* FIX: Ajouter logs d\u00e9taill\u00e9s pour debug acc\u00e8s admin */
            if (pageId === 'admin' && currentUser.role !== 'admin') {
                console.log('\u274c [ACCESS CHECK] Pas admin - Role actuel:', currentUser.role, 'isLoggedIn:', currentUser.isLoggedIn);
                console.log('\u274c [ACCESS CHECK] currentUser complet:', JSON.stringify(currentUser));
                console.log('\u274c [ACCESS CHECK] Session localStorage:', localStorage.getItem('ae2i_current_user'));
                showNotification(siteData.language === 'en' ? 'Administrator access required' : 'Acc\u00e8s administrateur requis', 'error');
                showPage('home');
                return false;
            }
            
            if (pageId === 'recruteur' && currentUser.role !== 'recruiter' && currentUser.role !== 'recruteur' && currentUser.role !== 'admin') {
                showNotification(siteData.language === 'en' ? 'Recruiter access required' : 'Accès recruteur requis', 'error');
                showPage('home');
                return false;
            }

            if (pageId === 'lecteur' && currentUser.role !== 'reader' && currentUser.role !== 'lecteur' && currentUser.role !== 'admin') {
                showNotification(siteData.language === 'en' ? 'Reader access required' : 'Accès lecteur requis', 'error');
                showPage('home');
                return false;
            }
            
            return true;
        }

        // Setup navigation globale
        function setupNavigation() {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const pageId = this.getAttribute('data-page');
                    if (pageId) {
                        showPage(pageId);
                    }
                });
            });

            window.addEventListener('popstate', function(e) {
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

            loginBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (currentUser.isLoggedIn) {
                    // Si connecté, rediriger vers le dashboard approprié
                    console.log('🔍 [LOGIN BTN CLICK] Utilisateur connecté:', currentUser.role);
                    if (currentUser.role === 'admin') {
                        showPage('admin');
                    } else if (currentUser.role === 'recruiter' || currentUser.role === 'recruteur') {
                        showPage('recruteur');
                    } else if (currentUser.role === 'reader' || currentUser.role === 'lecteur') {
                        showPage('lecteur');
                    }
                } else {
                    // Si non connecté, afficher la modale de connexion
                    loginModal.classList.add('show');
                    setTimeout(() => document.getElementById('loginUsername').focus(), 300);
                }
            });

            loginClose.addEventListener('click', function() {
                loginModal.classList.remove('show');
            });

            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const username = document.getElementById('loginUsername').value;
                const password = document.getElementById('loginPassword').value;

                console.log('🔍 Tentative connexion:', username);
                console.log('📋 Total utilisateurs:', siteData.users.length);
                console.log('📋 Utilisateurs disponibles:', siteData.users.map(u => ({
                    username: u.username,
                    email: u.email,
                    role: u.role,
                    active: u.active,
                    passwordLength: u.password?.length
                })));

                const user = siteData.users.find(u => (u.username === username || u.email === username) && u.password === password && u.active);

                if (user) {
                    console.log('✅ Utilisateur trouvé:', user.username, 'Role:', user.role);

                    currentUser = {
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        isLoggedIn: true
                    };

                    user.lastLogin = new Date().toISOString();

                    // Sauvegarder la session dans localStorage
                    localStorage.setItem('ae2i_current_user', JSON.stringify(currentUser));

                    // Force save immediately after login avec vérification
                    if (forceSaveData()) {
                        // Mettre à jour immédiatement le bouton et le statut
                        updateLoginButton();
                        updateLoginStatus();
                        loginModal.classList.remove('show');
                        loginForm.reset();

                        const welcomeMsg = siteData.language === 'en' ? 
                            `Welcome, ${user.username}!` :
                            `Bienvenue, ${user.username}!`;
                        
                        showNotification(welcomeMsg, 'success');
                        logActivity(user.username, `Connexion réussie (rôle: ${user.role})`);

                        // Rediriger vers le dashboard approprié
                        if (user.role === 'admin') {
                            showPage('admin');
                        } else if (user.role === 'recruiter' || user.role === 'recruteur') {
                            showPage('recruteur');
                        } else if (user.role === 'reader' || user.role === 'lecteur') {
                            showPage('lecteur');
                        }
                    } else {
                        showNotification('Échec de sauvegarde - Veuillez réessayer', 'error');
                    }
                } else {
                    console.log('❌ Échec connexion - Vérification:', {
                        tentativeUsername: username,
                        tentativePasswordLength: password.length,
                        correspondanceUsername: siteData.users.some(u => u.username === username || u.email === username),
                        correspondancePassword: siteData.users.some(u => u.password === password),
                        correspondanceActive: siteData.users.some(u => u.active && (u.username === username || u.email === username))
                    });
                    showNotification(siteData.language === 'en' ? 'Incorrect credentials' : 'Identifiants incorrects', 'error');
                }
            });

            adminPanelLink.addEventListener('click', function(e) {
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

            logoutLink.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });

            /* FIX: logout-system - Event listeners pour les nouveaux boutons */
            if (headerLogoutBtn) {
                headerLogoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    logoutUser();
                });
            }

            if (mobileDashboardBtn) {
                mobileDashboardBtn.addEventListener('click', function(e) {
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
                mobileLogoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    logoutUser();
                });
            }

            document.addEventListener('click', function(e) {
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
            const loginBtn = document.getElementById('loginBtn');
            const userDropdown = document.getElementById('userDropdown');
            const adminPanelLink = document.getElementById('adminPanelLink');
            const profileLink = document.getElementById('profileLink');
            const logoutLink = document.getElementById('logoutLink');

            /* FIX: logout-system - Récupération des nouveaux éléments */
            const headerLogoutBtn = document.getElementById('headerLogoutBtn');
            const mobileDashboardLink = document.getElementById('mobileDashboardLink');
            const mobileLogoutLink = document.getElementById('mobileLogoutLink');
            const mobileDashboardBtn = document.getElementById('mobileDashboardBtn');

            console.log('🔄 [UPDATE STATUS] currentUser:', JSON.stringify(currentUser));

            // Mettre à jour le bouton login
            updateLoginButton();

            if (currentUser.isLoggedIn) {
                /* FIX: logout-system - Afficher les boutons de déconnexion */
                if (headerLogoutBtn) {
                    headerLogoutBtn.style.display = 'flex';
                }
                if (mobileDashboardLink) {
                    mobileDashboardLink.style.display = 'block';
                }
                if (mobileLogoutLink) {
                    mobileLogoutLink.style.display = 'block';
                }

                if (adminPanelLink) {
                    adminPanelLink.style.display = 'flex';
                }
                if (profileLink) {
                    profileLink.style.display = 'flex';
                }
                if (logoutLink) {
                    logoutLink.style.display = 'flex';
                }

                // Adapter le texte selon le rôle
                let dashboardText = 'Mon tableau de bord';
                let dashboardTextEn = 'My Dashboard';
                let dashboardTextAr = 'لوحة التحكم';
                let iconClass = 'fa-tachometer-alt';

                if (currentUser.role === 'recruiter' || currentUser.role === 'recruteur') {
                    adminPanelLink.innerHTML = `<i class="fas fa-users"></i><span data-fr="Espace Recruteur" data-en="Recruiter Area" data-ar="منطقة المُوظّف">Espace Recruteur</span>`;
                    dashboardText = 'Espace Recruteur';
                    dashboardTextEn = 'Recruiter Dashboard';
                    dashboardTextAr = 'لوحة المُوظّف';
                    iconClass = 'fa-users';
                } else if (currentUser.role === 'reader' || currentUser.role === 'lecteur') {
                    adminPanelLink.innerHTML = `<i class="fas fa-eye"></i><span data-fr="Espace Lecteur" data-en="Reader Area" data-ar="منطقة القارئ">Espace Lecteur</span>`;
                    dashboardText = 'Espace Lecteur';
                    dashboardTextEn = 'Reader Dashboard';
                    dashboardTextAr = 'لوحة القارئ';
                    iconClass = 'fa-eye';
                } else if (currentUser.role === 'admin') {
                    adminPanelLink.innerHTML = `<i class="fas fa-cogs"></i><span data-fr="Panneau d'administration" data-en="Administration Panel" data-ar="لوحة الإدارة">Panneau d'administration</span>`;
                    dashboardText = 'Dashboard Admin';
                    dashboardTextEn = 'Admin Dashboard';
                    dashboardTextAr = 'لوحة الإدارة';
                    iconClass = 'fa-cogs';
                }

                /* FIX: logout-system - Mettre à jour le texte du bouton dashboard mobile */
                if (mobileDashboardBtn) {
                    mobileDashboardBtn.innerHTML = `<i class="fas ${iconClass}"></i><span data-fr="${dashboardText}" data-en="${dashboardTextEn}" data-ar="${dashboardTextAr}">${dashboardText}</span>`;
                }

                document.body.setAttribute('data-user-role', currentUser.role);
            } else {
                /* FIX: logout-system - Masquer les boutons de déconnexion */
                if (headerLogoutBtn) {
                    headerLogoutBtn.style.display = 'none';
                }
                if (mobileDashboardLink) {
                    mobileDashboardLink.style.display = 'none';
                }
                if (mobileLogoutLink) {
                    mobileLogoutLink.style.display = 'none';
                }

                if (userDropdown) {
                    userDropdown.classList.remove('show');
                }

                if (adminPanelLink) {
                    adminPanelLink.style.display = 'none';
                }
                if (profileLink) {
                    profileLink.style.display = 'none';
                }
                if (logoutLink) {
                    logoutLink.style.display = 'none';
                }

                document.body.setAttribute('data-user-role', 'guest');
            }
        }

        function logout() {
            console.log('🔴 [LOGOUT] Fonction logout() appelée');
            logActivity(currentUser.username, 'Déconnexion');

            currentUser = { username: 'guest', role: 'guest', isLoggedIn: false };
            localStorage.removeItem('ae2i_current_user');
            sessionStorage.clear();

            updateLoginButton();
            updateLoginStatus();
            showPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            showNotification(siteData.language === 'en' ? 'Successfully logged out' : 'Déconnexion réussie', 'success');
            console.log('✅ [LOGOUT] Déconnexion réussie');
        }

        // Fonction globale pour déconnexion depuis les dashboards
        function logoutUser() {
            console.log('🔴 [LOGOUT] Déconnexion en cours...');

            if (currentUser && currentUser.username) {
                logActivity(currentUser.username, 'Déconnexion');
            }

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

            // Mettre à jour le bouton immédiatement
            updateLoginButton();
            updateLoginStatus();

            // Rediriger vers l'accueil
            showPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Notification de succès
            showNotification(siteData.language === 'en' ? 'Successfully logged out' : 'Déconnexion réussie', 'success');

            console.log('✅ [LOGOUT] Déconnexion réussie - currentUser:', JSON.stringify(currentUser));
        }

        // Expose functions to window for onclick handlers and global access
        window.logoutUser = logoutUser;
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
            
            themeToggle.addEventListener('click', function() {
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
                btn.addEventListener('click', function() {
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
                const text = element.getAttribute(`data-${lang}`);
                if (text) {
                    element.textContent = text;
                }
            });

            // Also support elements with data-ar attribute
            document.querySelectorAll('[data-ar]').forEach(element => {
                const text = element.getAttribute(`data-${lang}`);
                if (text) {
                    element.textContent = text;
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
            
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) {
                    scrollToTopBtn.classList.add('show');
                } else {
                    scrollToTopBtn.classList.remove('show');
                }
            });

            scrollToTopBtn.addEventListener('click', function() {
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
            mobileToggle.addEventListener('click', function() {
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

        /* FIX: Préserver currentUser lors de la sauvegarde */
        // SYSTÈME DE SAUVEGARDE FORCÉE ULTRA-AMÉLIORÉ ET CORRECTION COMPLÈTE DES BUGS
        function forceSaveData() {
            console.log('[QA] Saving siteData...');
            if (saveInProgress) {
                console.log('⏳ Sauvegarde déjà en cours, attente...');
                return false;
            }

            saveInProgress = true;

            try {
                /* FIX: Sauvegarder currentUser AVANT toute opération */
                localStorage.setItem('ae2i_current_user', JSON.stringify(currentUser));
                console.log('💾 [SAVE] Session préservée:', currentUser.username, currentUser.role);

                // Validation des données avant sauvegarde
                if (!siteData || typeof siteData !== 'object') {
                    throw new Error('Données invalides');
                }

                // Créer une copie profonde avec safeSerialize pour éviter les données volumineuses
                console.log('[QA] Applying safeSerialize to siteData...');
                const dataToSave = safeSerialize(siteData);
                
                // Nettoyer les données si nécessaire
                if (dataToSave.activityLog && dataToSave.activityLog.length > 1000) {
                    dataToSave.activityLog = dataToSave.activityLog.slice(0, 500);
                    console.log('🧹 Nettoyage automatique des logs anciens');
                }

                const serializedData = JSON.stringify(dataToSave);
                
                // Vérifier la taille des données avant sauvegarde
                const dataSize = new Blob([serializedData]).size;
                const maxSize = 8 * 1024 * 1024; // 8MB limit pour localStorage
                
                if (dataSize > maxSize) {
                    console.warn('⚠️ Données volumineuses détectées, compression...');
                    
                    // Compression des données volumineuses
                    if (dataToSave.cvDatabase && dataToSave.cvDatabase.length > 100) {
                        dataToSave.cvDatabase = dataToSave.cvDatabase.slice(0, 100);
                        console.log('🗜️ Base CV compressée à 100 entrées');
                    }
                    
                    if (dataToSave.activityLog && dataToSave.activityLog.length > 200) {
                        dataToSave.activityLog = dataToSave.activityLog.slice(0, 200);
                        console.log('🗜️ Logs compressés à 200 entrées');
                    }
                }
                
                // Tentative de sauvegarde principale
                localStorage.setItem('ae2i_site_data', JSON.stringify(dataToSave));
                
                // Double vérification de la sauvegarde
                const savedData = localStorage.getItem('ae2i_site_data');
                if (!savedData) {
                    throw new Error('Échec de vérification de sauvegarde');
                }
                
                // Test de parsing pour s'assurer que les données sont valides
                const parsedData = JSON.parse(savedData);
                if (!parsedData || !parsedData.settings) {
                    throw new Error('Données sauvegardées corrompues');
                }
                
                // Sauvegarde de secours dans sessionStorage
                sessionStorage.setItem('ae2i_backup_data', JSON.stringify(dataToSave));
                
                // Mettre à jour le timestamp de dernière sauvegarde
                localStorage.setItem('ae2i_last_save', new Date().toISOString());

                /* FIX: Re-sauvegarder currentUser APRÈS la sauvegarde */
                localStorage.setItem('ae2i_current_user', JSON.stringify(currentUser));

                console.log('✅ Données sauvegardées avec succès (vérifiées)');
                console.log('✅ Session préservée après sauvegarde:', currentUser.username, currentUser.role);
                saveInProgress = false;
                return true;
                
            } catch (error) {
                console.error('❌ Erreur sauvegarde critique:', error);
                saveInProgress = false;
                
                // Tentative de sauvegarde de secours
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

        // Alias pour compatibilité
        function saveSiteData() {
            return forceSaveData();
        }

        function loadSiteData() {
            try {
                const savedData = localStorage.getItem('ae2i_site_data');
                if (savedData) {
                    const parsed = JSON.parse(savedData);

                    // Validation des données chargées
                    if (parsed && parsed.settings) {
                        siteData = { ...siteData, ...parsed };

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

                        // Restaurer la session utilisateur si elle existe
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
        function toggleMaintenanceMode() {
            const enabled = document.getElementById('maintenanceMode').checked;
            siteData.settings.maintenanceMode = enabled;
            
            if (forceSaveData()) {
                if (enabled) {
                    document.body.classList.add('maintenance-mode');
                    document.getElementById('maintenanceNotice').style.display = 'block';
                    showNotification(siteData.language === 'en' ? 'Maintenance mode enabled' : 'Mode maintenance activé', 'warning');
                } else {
                    document.body.classList.remove('maintenance-mode');
                    document.getElementById('maintenanceNotice').style.display = 'none';
                    showNotification(siteData.language === 'en' ? 'Maintenance mode disabled' : 'Mode maintenance désactivé', 'success');
                }

                logActivity(currentUser.username, `Mode maintenance ${enabled ? 'activé' : 'désactivé'}`);
            } else {
                showNotification('Échec de sauvegarde du mode maintenance', 'error');
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
            redirectUri: window.location.origin,
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
                // FIX: linkedin-backend-auth - Fetch client ID securely from backend
                const configResponse = await fetch('/.netlify/functions/getLinkedInKey');
                const config = await configResponse.json();

                if (!config.client_id) {
                    showNotification(siteData.language === 'en' ? 'LinkedIn configuration error' : 'Erreur de configuration LinkedIn', 'error');
                    return;
                }

                LINKEDIN_CONFIG.clientId = config.client_id;
                if (config.redirect_uri) {
                    LINKEDIN_CONFIG.redirectUri = config.redirect_uri;
                }

                // Build OAuth2 authorization URL
                const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
                authUrl.searchParams.append('response_type', 'code');
                authUrl.searchParams.append('client_id', LINKEDIN_CONFIG.clientId);
                authUrl.searchParams.append('redirect_uri', LINKEDIN_CONFIG.redirectUri);
                authUrl.searchParams.append('scope', LINKEDIN_CONFIG.scope);
                authUrl.searchParams.append('state', LINKEDIN_CONFIG.state);

                sessionStorage.setItem('linkedin_oauth_state', LINKEDIN_CONFIG.state);
                sessionStorage.setItem('linkedin_redirect_origin', 'application_form');

                // Redirect to LinkedIn OAuth
                window.location.href = authUrl.toString();
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
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const savedState = sessionStorage.getItem('linkedin_oauth_state');

            if (!code || !state || state !== savedState) {
                if (code) {
                    showNotification(siteData.language === 'en' ? 'LinkedIn authentication failed' : 'Échec de l\'authentification LinkedIn', 'error');
                }
                return;
            }

            try {
                showNotification(siteData.language === 'en' ? 'LinkedIn connection in progress...' : 'Connexion LinkedIn en cours...', 'info');

                // FIX: linkedin-backend-auth - Exchange code for token via backend
                const profileData = await fetchLinkedInProfile(code);

                if (profileData) {
                    sessionStorage.setItem('linkedin_profile_data', JSON.stringify(profileData));
                    sessionStorage.setItem('linkedin_access_token', profileData.accessToken);

                    // Prefill form with LinkedIn data
                    prefillFormWithLinkedInData(profileData);

                    // Update UI
                    updateLinkedInButtonState(true, profileData);

                    // MODIFIED: Auto-redirect to LinkedIn profile in new tab after successful connection
                    if (profileData.publicProfileUrl) {
                        setTimeout(() => {
                            window.open(profileData.publicProfileUrl, '_blank', 'noopener,noreferrer');
                        }, 500);
                    }

                    showNotification(siteData.language === 'en' ? 'Successfully connected to LinkedIn! Profile opened in new tab.' : 'Connecté à LinkedIn avec succès ! Profil ouvert dans un nouvel onglet.', 'success');
                    logActivity(currentUser.username || 'visitor', 'Connexion LinkedIn réussie - Redirection automatique vers profil');

                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } catch (error) {
                console.error('LinkedIn authentication error:', error);
                showNotification(siteData.language === 'en' ? 'LinkedIn connection error' : 'Erreur de connexion LinkedIn', 'error');
            }
        }

        async function fetchLinkedInProfile(code) {
            // FIX: linkedin-token-exchange - Call backend API to exchange code for token
            // ADD: linkedin-user-profile-fetch - Backend fetches user profile data
            try {
                const response = await fetch('/.netlify/functions/linkedin_auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });

                if (!response.ok) {
                    throw new Error('Failed to authenticate with LinkedIn');
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
        if (window.location.search.includes('code=')) {
            handleLinkedInCallback();
        } else {
            // Check if already connected and update UI
            const savedProfile = sessionStorage.getItem('linkedin_profile_data');
            if (savedProfile) {
                try {
                    const profileData = JSON.parse(savedProfile);
                    updateLinkedInButtonState(true, profileData);
                    prefillFormWithLinkedInData(profileData);
                } catch (e) {
                    console.error('Error parsing LinkedIn profile data:', e);
                }
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
                
                document.addEventListener('click', function(e) {
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

        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 [INIT] DOMContentLoaded - currentUser avant loadSiteData:', JSON.stringify(currentUser));
            loadSiteData();
            console.log('🚀 [INIT] Après loadSiteData - currentUser:', JSON.stringify(currentUser));
            updateIsoImages(); // FIX: Update ISO images after loading data
            setupNavigation();
            setupLoginSystem();
            updateLoginButton(); // Mettre à jour le bouton login immédiatement
            updateLoginStatus(); // Restore login status after loading session
            console.log('🚀 [INIT] Après updateLoginStatus - currentUser:', JSON.stringify(currentUser));
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
            updateMaintenanceStatus();
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
            document.addEventListener('mouseenter', function(e) {
                const target = e.target;

                // Gestion des cartes et éléments avec effet hover
                if (target.closest('.service-item, .client-item, .testimonial-item, .job-item, .user-item, .log-item, .page-item, .cv-item, .message-item')) {
                    const element = target.closest('.service-item, .client-item, .testimonial-item, .job-item, .user-item, .log-item, .page-item, .cv-item, .message-item');
                    element.style.transform = 'translateY(-5px)';
                    element.style.boxShadow = 'var(--shadow-lg)';
                    element.style.borderColor = 'var(--primary)';
                }
            }, true);

            document.addEventListener('mouseleave', function(e) {
                const target = e.target;

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
            if (siteData.settings.maintenanceMode) {
                document.body.classList.add('maintenance-mode');
                document.getElementById('maintenanceNotice').style.display = 'block';
                
                if (currentUser.role !== 'admin') {
                    showPage('maintenance');
                }
            }
        }

        window.addEventListener('error', function(e) {
            console.error('Erreur JavaScript:', e.error);
            logActivity('system', `Erreur: ${e.message}`);
        });

        window.addEventListener('load', function() {
            const loadTime = performance.now();
            logActivity('system', `Site chargé en ${loadTime.toFixed(2)}ms`);
            
            if (document.getElementById('loadTime')) {
                document.getElementById('loadTime').textContent = `${loadTime.toFixed(2)}ms`;
            }
        });

        // Auto-save avec sauvegarde forcée toutes les 30 secondes OPÉRATIONNEL
        setInterval(function() {
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
        window.addEventListener('beforeunload', function(e) {
            if (currentUser.isLoggedIn && !saveInProgress) {
                forceSaveData();
            }
        });

        document.addEventListener('keydown', function(e) {
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
                homeBrochureDownload.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    if (siteData.brochure && siteData.brochure.url) {
                        const link = document.createElement('a');
                        link.href = siteData.brochure.url;
                        link.download = siteData.brochure.name || 'Brochure_AE2I.pdf';
                        link.click();
                        
                        showNotification(siteData.language === 'en' ? 'AE2I 2025 brochure download started' : 'Téléchargement de la brochure AE2I 2025 démarré', 'success');
                        logActivity(currentUser.username || 'visitor', 'Brochure téléchargée depuis accueil');
                    } else {
                        showNotification(siteData.language === 'en' ? 'Brochure not available' : 'Brochure non disponible', 'warning');
                    }
                });
            }

            const homePrevTestimonial = document.getElementById('homePrevTestimonial');
            const homeNextTestimonial = document.getElementById('homeNextTestimonial');
            
            if (homePrevTestimonial) {
                homePrevTestimonial.addEventListener('click', function() {
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
                homeNextTestimonial.addEventListener('click', function() {
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
            window.showIsoPreview = function() {
                const preview = document.getElementById('aboutIsoPreview');
                if (preview) {
                    preview.classList.add('show');
                }
            };

            window.hideIsoPreview = function() {
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
                isoQr.addEventListener('click', function(e) {
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
                document.addEventListener('click', function(e) {
                    if (isPreviewOpen && !isoQr.contains(e.target) && !isoPreview.contains(e.target)) {
                        hideIsoPreview();
                        isPreviewOpen = false;
                        isoQr.classList.remove('active');
                    }
                });

                // Sur PC: hover fonctionne normalement
                if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                    isoQr.addEventListener('mouseenter', function() {
                        if (!isPreviewOpen) {
                            showIsoPreview();
                        }
                    });

                    isoQr.addEventListener('mouseleave', function() {
                        if (!isPreviewOpen) {
                            hideIsoPreview();
                        }
                    });

                    // Hover sur le preview lui-m\u00eame
                    isoPreview.addEventListener('mouseenter', function() {
                        if (!isPreviewOpen) {
                            showIsoPreview();
                        }
                    });

                    isoPreview.addEventListener('mouseleave', function() {
                        if (!isPreviewOpen) {
                            hideIsoPreview();
                        }
                    });
                }
            }

            const statItems = document.querySelectorAll('.about-stat-item');
            statItems.forEach((item, index) => {
                item.style.animationDelay = `${index * 0.1}s`;
                item.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-8px) scale(1.05)';
                });
                item.addEventListener('mouseleave', function() {
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
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-12px) scale(1.02)';
                    this.style.boxShadow = 'var(--shadow-2xl)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                    this.style.boxShadow = 'var(--shadow-lg)';
                });
            });

            document.querySelectorAll('.service-link').forEach(link => {
                link.addEventListener('click', function(e) {
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
                section.addEventListener('mouseenter', function() {
                    const prism = document.querySelector('.prism');
                    if (prism) {
                        prism.style.animationDuration = '10s';
                    }
                });
                
                section.addEventListener('mouseleave', function() {
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
                
                item.addEventListener('click', function() {
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
        document.addEventListener('click', function(e) {
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
                prevBtn.addEventListener('click', function() {
                    if (currentJobsPage > 1) {
                        currentJobsPage--;
                        renderCarriereJobs();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', function() {
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
                    filter.addEventListener('change', function() {
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
                btn.addEventListener('click', function() {
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
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-4px) scale(1.01)';
                    this.style.boxShadow = 'var(--shadow-xl)';
                });
                
                card.addEventListener('mouseleave', function() {
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
                setTimeout(function() {
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
                contactForm.addEventListener('submit', function(e) {
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
                item.addEventListener('mouseenter', function() {
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

                item.addEventListener('mouseleave', function() {
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
                contactEmail.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.location.href = `mailto:${siteData.settings.contact.email}?subject=${siteData.language === 'en' ? 'AE2I Information Request' : 'Demande d\'information AE2I'}`;
                    logActivity(currentUser.username || 'visitor', 'Email de contact cliqué');
                });
            }
        }

function executeAdminScript() {
            console.log('⚙️ Executing admin dashboard script');
            setupAdminTabs();
            renderAdminContent();
            setupAdminForms();
            setupTinyMCE();
            updateAnalytics();
            setupAdminFileUploads();
            initializeAdminSettings();
        }

        function setupAdminTabs() {
            document.querySelectorAll('.admin-tab').forEach(tab => {
                tab.addEventListener('click', function() {
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
                } else if (tabId === 'contact') {
                    renderContactMessages();
                    updateContactStats();
                } else if (tabId === 'hero') {
                    initializeHeroSettings();
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
                document.getElementById('titleGradientStart').value = siteData.titleGradient.start;
                document.getElementById('titleGradientEnd').value = siteData.titleGradient.end;
            }
            if (siteData.sloganGradient) {
                document.getElementById('sloganGradientStart').value = siteData.sloganGradient.start;
                document.getElementById('sloganGradientEnd').value = siteData.sloganGradient.end;
            }
            if (siteData.descriptionGradient) {
                document.getElementById('descriptionGradientStart').value = siteData.descriptionGradient.start;
                document.getElementById('descriptionGradientEnd').value = siteData.descriptionGradient.end;
            }
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
                primaryColorPicker.addEventListener('change', function() {
                    const value = this.value;
                    document.getElementById('primaryColorValue').textContent = value;
                    document.documentElement.style.setProperty('--primary', value);
                    siteData.settings.primaryColor = value;
                    forceSaveData();
                });
            }
            
            if (secondaryColorPicker) {
                secondaryColorPicker.addEventListener('change', function() {
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

        function toggleSection(sectionName, toggleElement) {
            const isCurrentlyActive = toggleElement.classList.contains('active');
            const newState = !isCurrentlyActive;

            siteData.settings.sectionsEnabled[sectionName] = newState;

            toggleElement.classList.toggle('active', newState);
            toggleElement.parentElement.classList.toggle('active', newState);

            if (sectionName === 'testimonials') {
                const testimonialsSection = document.getElementById('testimonials-section');
                if (testimonialsSection) {
                    testimonialsSection.style.display = newState ? 'block' : 'none';
                }
            }

            if (forceSaveData()) {
                const message = siteData.language === 'en' ?
                    `Section ${sectionName} ${newState ? 'enabled' : 'disabled'}` :
                    `Section ${sectionName} ${newState ? 'activée' : 'désactivée'}`;
                showNotification(message, 'success');
                logActivity(currentUser.username, `Section ${sectionName} ${newState ? 'activée' : 'désactivée'}`);
            } else {
                showNotification('Échec de sauvegarde de la section', 'error');
                // Revert toggle state
                toggleElement.classList.toggle('active', !newState);
                toggleElement.parentElement.classList.toggle('active', !newState);
            }
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

        function addRecruitmentEmail() {
            const emailInput = document.getElementById('recruitmentEmail');
            const email = emailInput.value.trim();
            
            if (email && email.includes('@')) {
                if (!siteData.settings.recruitmentEmails) {
                    siteData.settings.recruitmentEmails = [];
                }
                
                if (!siteData.settings.recruitmentEmails.includes(email)) {
                    siteData.settings.recruitmentEmails.push(email);
                    emailInput.value = '';
                    renderRecruitmentEmails();
                    showNotification(siteData.language === 'en' ? 'Email added' : 'Email ajouté', 'success');
                    forceSaveData();
                } else {
                    showNotification(siteData.language === 'en' ? 'Email already exists' : 'Email déjà présent', 'warning');
                }
            } else {
                showNotification(siteData.language === 'en' ? 'Invalid email' : 'Email invalide', 'error');
            }
        }

        function removeRecruitmentEmail(index) {
            if (confirm(siteData.language === 'en' ? 'Delete this email?' : 'Supprimer cet email?')) {
                siteData.settings.recruitmentEmails.splice(index, 1);
                renderRecruitmentEmails();
                showNotification(siteData.language === 'en' ? 'Email deleted' : 'Email supprimé', 'success');
                forceSaveData();
            }
        }

        function saveRecruitmentEmails() {
            if (forceSaveData()) {
                showNotification(siteData.language === 'en' ? 'Recruitment emails saved' : 'Emails de recrutement sauvegardés', 'success');
                logActivity(currentUser.username, 'Emails de recrutement mis à jour');
            } else {
                showNotification('Échec de sauvegarde des emails', 'error');
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

        function saveSocialNetworks() {
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
            
            if (forceSaveData()) {
                showNotification(siteData.language === 'en' ? 'Social networks saved' : 'Réseaux sociaux sauvegardés', 'success');
                logActivity(currentUser.username, 'Réseaux sociaux mis à jour');
            } else {
                showNotification('Échec de sauvegarde des réseaux sociaux', 'error');
            }
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
                        
                        messageItem.addEventListener('mouseenter', function() {
                            this.style.transform = 'translateY(-5px)';
                            this.style.boxShadow = 'var(--shadow-lg)';
                            this.style.borderColor = 'var(--primary)';
                        });
                        
                        messageItem.addEventListener('mouseleave', function() {
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
        function toggleTitleFormatting(type) {
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

            if (forceSaveData()) {
                showNotification(`Formatage ${type} ${siteData.titleFormatting[type] ? 'activé' : 'désactivé'}`, 'success');
            }
        }

        /* ADD: hero-title-size-control - Function to update Hero title size */
        function updateHeroTitleSize(size) {
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

            forceSaveData();
        }

        /* ADD: hero-subtitle-style - Function to toggle text formatting for Hero subtitle */
        function toggleSubtitleFormatting(type) {
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

            if (forceSaveData()) {
                showNotification(`Formatage sous-titre ${type} ${siteData.subtitleFormatting[type] ? 'activé' : 'désactivé'}`, 'success');
            }
        }

        /* ADD: hero-subtitle-size-control - Function to update Hero subtitle size */
        function updateHeroSubtitleSize(size) {
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

            forceSaveData();
        }

        function updateSiteTitle() {
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
            }

            if (forceSaveData()) {
                showNotification('Titre du site mis à jour', 'success');
                logActivity(currentUser.username, 'Titre du site modifié');
            } else {
                showNotification('Échec de sauvegarde du titre', 'error');
            }
        }

        function updateSiteSlogan() {
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
            }
            
            if (forceSaveData()) {
                showNotification('Slogan du site mis à jour', 'success');
                logActivity(currentUser.username, 'Slogan du site modifié');
            } else {
                showNotification('Échec de sauvegarde du slogan', 'error');
            }
        }

        function updateSiteDescription() {
            const description = document.getElementById('siteDescription').value;
            siteData.settings.description = description;
            
            if (forceSaveData()) {
                showNotification('Description du site mise à jour', 'success');
                logActivity(currentUser.username, 'Description du site modifiée');
            } else {
                showNotification('Échec de sauvegarde de la description', 'error');
            }
        }

        function applyTitleGradient() {
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
            
            if (forceSaveData()) {
                showNotification('Dégradé titre appliqué', 'success');
                logActivity(currentUser.username, 'Dégradé titre modifié');
            } else {
                showNotification('Échec d\'application du dégradé titre', 'error');
            }
        }

        function applySloganGradient() {
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
            
            if (forceSaveData()) {
                showNotification('Dégradé slogan appliqué', 'success');
                logActivity(currentUser.username, 'Dégradé slogan modifié');
            } else {
                showNotification('Échec d\'application du dégradé slogan', 'error');
            }
        }

        function applyDescriptionGradient() {
            const start = document.getElementById('descriptionGradientStart').value;
            const end = document.getElementById('descriptionGradientEnd').value;
            
            siteData.descriptionGradient = {
                start: start,
                end: end,
                gradient: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`
            };
            
            if (forceSaveData()) {
                showNotification('Dégradé description appliqué', 'success');
                logActivity(currentUser.username, 'Dégradé description modifié');
            } else {
                showNotification('Échec d\'application du dégradé description', 'error');
            }
        }

        function applyHeroGradient() {
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
            
            if (forceSaveData()) {
                showNotification('Dégradé hero appliqué', 'success');
                logActivity(currentUser.username, 'Dégradé hero modifié');
            } else {
                showNotification('Échec d\'application du dégradé hero', 'error');
            }
        }

        function applyFooterGradient() {
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
            
            if (forceSaveData()) {
                showNotification('Dégradé footer appliqué', 'success');
                logActivity(currentUser.username, 'Dégradé footer modifié');
            } else {
                showNotification('Échec d\'application du dégradé footer', 'error');
            }
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

        function removeFooterBackground() {
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
                
                if (forceSaveData()) {
                    showNotification('Fond footer supprimé', 'success');
                    logActivity(currentUser.username, 'Fond footer supprimé');
                } else {
                    showNotification('Échec de suppression du fond footer', 'error');
                }
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
                    ctx.fillText(value, x + barWidth/2, y - 5);
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
                    
                    serviceItem.addEventListener('mouseenter', function() {
                        this.style.transform = 'translateY(-5px)';
                        this.style.boxShadow = 'var(--shadow-lg)';
                        this.style.borderColor = 'var(--primary)';
                    });
                    
                    serviceItem.addEventListener('mouseleave', function() {
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
                siteData.clients.forEach((client, index) => {
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
                            <h4 style="font-size: var(--font-size-xl); font-weight: 800;">${client.name}</h4>
                            <span class="status-badge ${client.active ? 'status-active' : 'status-inactive'}">
                                <i class="fas fa-${client.active ? 'check' : 'times'}"></i>
                                ${client.active ? (siteData.language === 'en' ? 'Active' : 'Actif') : (siteData.language === 'en' ? 'Inactive' : 'Inactif')}
                            </span>
                        </div>
                        <div style="text-align: center; margin: 20px 0;">
                            <img src="${client.logo}" alt="${client.name}" style="max-width: 200px; max-height: 100px; object-fit: contain; border-radius: var(--border-radius); box-shadow: var(--shadow-sm);" loading="lazy">
                        </div>
                        <div style="display: flex; gap: 12px; margin-top: 16px; justify-content: center;">
                            <button class="btn btn-sm btn-outline functional-btn" onclick="editClient(${index})">
                                <i class="fas fa-edit"></i> ${siteData.language === 'en' ? 'Edit' : 'Modifier'}
                            </button>
                            <button class="btn btn-sm btn-warning functional-btn" onclick="toggleClient(${index})">
                                <i class="fas fa-toggle-${client.active ? 'on' : 'off'}"></i> ${client.active ? (siteData.language === 'en' ? 'Disable' : 'Désactiver') : (siteData.language === 'en' ? 'Enable' : 'Activer')}
                            </button>
                            <button class="btn btn-sm btn-danger functional-btn" onclick="deleteClient(${index})">
                                <i class="fas fa-trash"></i> ${siteData.language === 'en' ? 'Delete' : 'Supprimer'}
                            </button>
                        </div>
                    `;
                    /* FIX: event-delegation - Suppression des listeners individuels, gérés globalement */

                    container.appendChild(clientItem);
                });
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
                    
                    jobItem.addEventListener('mouseenter', function() {
                        this.style.transform = 'translateY(-5px)';
                        this.style.boxShadow = 'var(--shadow-lg)';
                        this.style.borderColor = 'var(--primary)';
                    });
                    
                    jobItem.addEventListener('mouseleave', function() {
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
                siteData.users.forEach((user, index) => {
                    if (user.role !== 'admin') { // Ne pas afficher l'admin dans la liste
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
                                    <span style="background: ${user.role === 'recruiter' ? 'var(--accent)' : user.role === 'reader' ? 'var(--warning)' : 'var(--info)'}; color: white; padding: 4px 12px; border-radius: var(--border-radius-full); font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase;">${user.role}</span>
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
                                    ${roleDescriptions[siteData.language][user.role]}
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
                        
                        userItem.addEventListener('mouseenter', function() {
                            this.style.transform = 'translateY(-5px)';
                            this.style.boxShadow = 'var(--shadow-lg)';
                            this.style.borderColor = 'var(--primary)';
                        });
                        
                        userItem.addEventListener('mouseleave', function() {
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
                        
                        logItem.addEventListener('mouseenter', function() {
                            this.style.background = 'linear-gradient(135deg, rgba(0, 86, 179, 0.08) 0%, rgba(0, 168, 150, 0.05) 100%)';
                            this.style.transform = 'translateX(5px)';
                            this.style.boxShadow = 'var(--shadow-sm)';
                        });
                        
                        logItem.addEventListener('mouseleave', function() {
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
                        
                        pageItem.addEventListener('mouseenter', function() {
                            this.style.transform = 'translateY(-5px)';
                            this.style.boxShadow = 'var(--shadow-lg)';
                            this.style.borderColor = 'var(--primary)';
                        });
                        
                        pageItem.addEventListener('mouseleave', function() {
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

            // Barre de recherche
            const searchTerm = document.getElementById('adminSearchBar')?.value.toLowerCase() || '';
            if (searchTerm) {
                candidates = candidates.filter(cv =>
                    cv.applicantName?.toLowerCase().includes(searchTerm) ||
                    cv.jobTitle?.toLowerCase().includes(searchTerm) ||
                    cv.diplome?.toLowerCase().includes(searchTerm) ||
                    cv.domaine?.toLowerCase().includes(searchTerm)
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

        function renderAdminCvDatabase(filterJobId = null) {
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
                                <button class="btn btn-sm btn-accent functional-btn" onclick="downloadApplicationPdfSummary(siteData.cvDatabase.find(c => c.id === ${cv.id}))" style="background: linear-gradient(135deg, #00a896 0%, #028090 100%); color: white; border: none;">
                                    <i class="fas fa-file-pdf"></i> ${siteData.language === 'en' ? 'Summary PDF' : 'Résumé PDF'}
                                </button>
                                <button class="btn btn-sm btn-outline functional-btn" onclick="previewCV(${cv.id})">
                                    <i class="fas fa-eye"></i> ${siteData.language === 'en' ? 'View CV' : 'Voir CV'}
                                </button>
                                <button class="btn btn-sm btn-primary functional-btn" onclick="contactApplicant('${cv.applicantEmail}')">
                                    <i class="fas fa-envelope"></i> ${siteData.language === 'en' ? 'Contact' : 'Contacter'}
                                </button>
                                <button class="btn btn-sm btn-success functional-btn" onclick="markAsProcessed(${cv.id})">
                                    <i class="fas fa-check"></i> ${siteData.language === 'en' ? 'Mark processed' : 'Marquer traité'}
                                </button>
                                <button class="btn btn-sm btn-warning functional-btn" onclick="downloadCV(${cv.id})">
                                    <i class="fas fa-download"></i> ${siteData.language === 'en' ? 'Download CV' : 'Télécharger CV'}
                                </button>
                                <button class="btn btn-sm btn-danger functional-btn" onclick="deleteApplication(${cv.id})">
                                    <i class="fas fa-trash"></i> ${siteData.language === 'en' ? 'Delete' : 'Supprimer'}
                                </button>
                            </div>
                        `;
                        
                        cvItem.addEventListener('mouseenter', function() {
                            this.style.transform = 'translateY(-5px)';
                            this.style.boxShadow = 'var(--shadow-lg)';
                            this.style.borderColor = 'var(--primary)';
                        });
                        
                        cvItem.addEventListener('mouseleave', function() {
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
                serviceForm.onsubmit = function(e) {
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

                        if (forceSaveData()) {
                            renderAdminServices();
                            closeModal('serviceModal');
                            showNotification(currentEditingIndex >= 0 ?
                                (siteData.language === 'en' ? 'Service updated successfully!' : 'Service modifié avec succès!') :
                                (siteData.language === 'en' ? 'Service added successfully!' : 'Service ajouté avec succès!'), 'success');

                            currentEditingIndex = -1;
                        } else {
                            showNotification('Échec de sauvegarde du service', 'error');
                        }
                    };

                    // Check if user uploaded a new image
                    if (imageInput.files && imageInput.files[0]) {
                        const file = imageInput.files[0];
                        if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = function(e) {
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
                testimonialForm.onsubmit = function(e) {
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
                    
                    if (forceSaveData()) {
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
                    } else {
                        showNotification('Échec de sauvegarde du témoignage', 'error');
                    }
                };
            }

            // Job form avec support bilingue
            /* FIX: Use onsubmit instead of addEventListener to prevent duplicate submissions */
            const jobForm = document.getElementById('jobForm');
            if (jobForm) {
                jobForm.onsubmit = function(e) {
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

                    if (forceSaveData()) {
                        renderAdminJobs();
                        if (currentUser.role === 'recruiter' || currentUser.role === 'recruteur') {
                            renderRecruteurContent();
                        }
                        closeModal('jobModal');
                        showNotification(currentEditingIndex >= 0 ?
                            (siteData.language === 'en' ? 'Job offer updated successfully!' : 'Offre modifiée avec succès!') :
                            (siteData.language === 'en' ? 'Job offer created successfully!' : 'Offre créée avec succès!'), 'success');

                        currentEditingIndex = -1;
                    } else {
                        showNotification('Échec de sauvegarde de l\'offre', 'error');
                    }
                };
            }

            // Client form
            /* FIX: Use onsubmit instead of addEventListener to prevent duplicate submissions */
            const clientForm = document.getElementById('clientForm');
            if (clientForm) {
                clientForm.onsubmit = function(e) {
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

                        if (currentEditingIndex >= 0) {
                            siteData.clients[currentEditingIndex] = { ...siteData.clients[currentEditingIndex], ...clientData };
                            logActivity(currentUser.username, `Client modifié: ${name}`);
                        } else {
                            siteData.clients.push(clientData);
                            logActivity(currentUser.username, `Client créé: ${name}`);
                        }

                        if (forceSaveData()) {
                            renderAdminClients();
                            closeModal('clientModal');
                            showNotification(currentEditingIndex >= 0 ?
                                (siteData.language === 'en' ? 'Client updated successfully!' : 'Client modifié avec succès!') :
                                (siteData.language === 'en' ? 'Client added successfully!' : 'Client ajouté avec succès!'), 'success');

                            currentEditingIndex = -1;
                        } else {
                            showNotification('Échec de sauvegarde du client', 'error');
                        }
                    };

                    // Check if user uploaded a new logo
                    if (logoInput.files && logoInput.files[0]) {
                        const file = logoInput.files[0];
                        if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                processClientData(e.target.result);
                            };
                            reader.readAsDataURL(file);
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
                pageForm.onsubmit = function(e) {
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
                    
                    if (currentEditingIndex >= 0) {
                        siteData.customPages[currentEditingIndex] = { ...siteData.customPages[currentEditingIndex], ...pageData };
                        logActivity(currentUser.username, `Page modifiée: ${title}`);
                    } else {
                        if (!siteData.customPages) siteData.customPages = [];
                        siteData.customPages.push(pageData);
                        logActivity(currentUser.username, `Page créée: ${title}`);
                    }
                    
                    if (forceSaveData()) {
                        renderAdminPages();
                        closeModal('pageModal');
                        showNotification(currentEditingIndex >= 0 ? 
                            (siteData.language === 'en' ? 'Page updated successfully!' : 'Page modifiée avec succès!') : 
                            (siteData.language === 'en' ? 'Page created successfully!' : 'Page créée avec succès!'), 'success');
                        
                        currentEditingIndex = -1;
                    } else {
                        showNotification('Échec de sauvegarde de la page', 'error');
                    }
                };
            }

            // User form avec nouveau rôle "lecteur"
            /* FIX: Use onsubmit instead of addEventListener to prevent duplicate submissions */
            const userForm = document.getElementById('userForm');
            if (userForm) {
                userForm.onsubmit = function(e) {
                    e.preventDefault();

                    console.log('🔍 [DEBUG] Début création utilisateur');
                    console.log('🔍 [DEBUG] currentUser avant sauvegarde:', JSON.stringify(currentUser));

                    const username = document.getElementById('userName').value;
                    const email = document.getElementById('userEmail').value;
                    const role = document.getElementById('userRole').value;
                    const password = document.getElementById('userPassword').value;

                    const userData = {
                        id: currentEditingIndex >= 0 ? siteData.users[currentEditingIndex].id : Date.now(),
                        username: username,
                        email: email,
                        role: role,
                        password: password,
                        active: true,
                        createdAt: currentEditingIndex >= 0 ? siteData.users[currentEditingIndex].createdAt : new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    if (currentEditingIndex >= 0) {
                        siteData.users[currentEditingIndex] = { ...siteData.users[currentEditingIndex], ...userData };
                        logActivity(currentUser.username, `Utilisateur modifié: ${username}`);
                    } else {
                        siteData.users.push(userData);
                        logActivity(currentUser.username, `Utilisateur créé: ${username} (${role})`);
                    }

                    console.log('🔍 [DEBUG] currentUser après ajout:', JSON.stringify(currentUser));

                    if (forceSaveData()) {
                        console.log('🔍 [DEBUG] currentUser après forceSaveData:', JSON.stringify(currentUser));

                        // RE-SAUVEGARDER la session après forceSaveData
                        localStorage.setItem('ae2i_current_user', JSON.stringify(currentUser));

                        renderAdminUsers();
                        closeModal('userModal');
                        showNotification(currentEditingIndex >= 0 ?
                            (siteData.language === 'en' ? 'User updated successfully!' : 'Utilisateur modifié avec succès!') :
                            (siteData.language === 'en' ? 'User created successfully!' : 'Utilisateur créé avec succès!'), 'success');

                        currentEditingIndex = -1;

                        console.log('🔍 [DEBUG] currentUser final:', JSON.stringify(currentUser));
                    } else {
                        showNotification('Échec de sauvegarde de l\'utilisateur', 'error');
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
                adminLogoInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            // Redimensionner l'image pour optimiser l'affichage
                            const img = new Image();
                            img.onload = function() {
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
                heroBackgroundInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const heroBackground = document.getElementById('heroBackground');

                        if (file.type.startsWith('video/')) {
                            // FIX: Use createObjectURL instead of DataURL for videos
                            const videoURL = URL.createObjectURL(file);

                            siteData.heroBackground = {
                                type: 'video',
                                url: videoURL,
                                name: file.name,
                                isObjectURL: true // Flag to know it's an object URL
                            };

                            const heroVideo = document.getElementById('heroVideo');
                            const heroVideoSource = document.getElementById('heroVideoSource');
                            if (heroVideo && heroVideoSource) {
                                // Revoke previous object URL if exists
                                if (heroVideoSource.src && heroVideoSource.src.startsWith('blob:')) {
                                    URL.revokeObjectURL(heroVideoSource.src);
                                }
                                heroVideoSource.src = videoURL;
                                heroVideo.load();
                                heroVideo.style.display = 'block';
                                heroBackground.classList.add('has-video');
                                heroBackground.classList.remove('has-image');
                            }

                            // FIX: Single notification
                            showNotification(siteData.language === 'en' ? 'Hero video updated' : 'Vidéo hero mise à jour', 'success');
                            logActivity(currentUser.username, 'Vidéo hero modifiée');
                        } else if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                // Redimensionner l'image pour optimiser les performances
                                const img = new Image();
                                img.onload = function() {
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

                                    const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

                                    siteData.heroBackground = {
                                        type: 'image',
                                        url: optimizedDataUrl,
                                        name: file.name
                                    };

                                    heroBackground.style.backgroundImage = `url(${optimizedDataUrl})`;
                                    heroBackground.classList.add('has-image');
                                    heroBackground.classList.remove('has-video');

                                    const heroVideo = document.getElementById('heroVideo');
                                    if (heroVideo) heroVideo.style.display = 'none';

                                    // FIX: Single notification
                                    if (saveSiteData()) {
                                        showNotification(siteData.language === 'en' ? 'Hero background updated and optimized' : 'Fond hero mis à jour et optimisé', 'success');
                                        logActivity(currentUser.username, 'Fond hero modifié');
                                    }
                                };
                                img.src = e.target.result;
                            };
                            reader.readAsDataURL(file);
                        }
                    }
                });
            }

            // Footer background upload avec redimensionnement
            const footerBackgroundInput = document.getElementById('footerBackgroundInput');
            if (footerBackgroundInput) {
                footerBackgroundInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const footerBackground = document.getElementById('footerBackground');
                            
                            if (file.type.startsWith('video/')) {
                                siteData.footerBackground = {
                                    type: 'video',
                                    url: e.target.result,
                                    name: file.name
                                };
                                
                                const footerVideo = document.getElementById('footerVideo');
                                const footerVideoSource = document.getElementById('footerVideoSource');
                                if (footerVideo && footerVideoSource) {
                                    footerVideoSource.src = e.target.result;
                                    footerVideo.load();
                                    footerVideo.style.display = 'block';
                                    footerBackground.classList.add('has-video');
                                    footerBackground.classList.remove('has-image');
                                }
                            } else if (file.type.startsWith('image/')) {
                                // Redimensionner l'image
                                const img = new Image();
                                img.onload = function() {
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
                                    
                                    const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                    
                                    siteData.footerBackground = {
                                        type: 'image',
                                        url: optimizedDataUrl,
                                        name: file.name
                                    };
                                    
                                    footerBackground.style.backgroundImage = `url(${optimizedDataUrl})`;
                                    footerBackground.classList.add('has-image');
                                    footerBackground.classList.remove('has-video');
                                    
                                    const footerVideo = document.getElementById('footerVideo');
                                    if (footerVideo) footerVideo.style.display = 'none';
                                    
                                    if (saveSiteData()) {
                                        showNotification(siteData.language === 'en' ? 'Footer background updated and optimized' : 'Fond footer mis à jour et optimisé', 'success');
                                        logActivity(currentUser.username, 'Fond footer modifié');
                                    }
                                };
                                img.src = e.target.result;
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            // Autres uploads (favicon, ISO, brochure, galerie)
            const adminFaviconInput = document.getElementById('adminFaviconInput');
            if (adminFaviconInput) {
                adminFaviconInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            // Créer une image pour redimensionner automatiquement
                            const img = new Image();
                            img.onload = function() {
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
                adminIsoQrInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            siteData.isoQr = e.target.result;

                            /* FIX: Update all ISO QR displays */
                            updateIsoImages();

                            if (saveSiteData()) {
                                showNotification(siteData.language === 'en' ? 'ISO QR Code updated' : 'QR Code ISO mis à jour', 'success');
                                logActivity(currentUser.username, 'QR Code ISO modifié');
                            }
                        };
                        reader.readAsDataURL(file);
                    } else {
                        showNotification('Veuillez sélectionner une image valide', 'error');
                    }
                });
            }

            const adminIsoCertInput = document.getElementById('adminIsoCertInput');
            if (adminIsoCertInput) {
                adminIsoCertInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            siteData.isoCert = e.target.result;

                            /* FIX: Update all ISO certificate displays */
                            updateIsoImages();

                            if (saveSiteData()) {
                                showNotification(siteData.language === 'en' ? 'ISO Certificate updated' : 'Certificat ISO mis à jour', 'success');
                                logActivity(currentUser.username, 'Certificat ISO modifié');
                            }
                        };
                        reader.readAsDataURL(file);
                    } else {
                        showNotification('Veuillez sélectionner une image valide', 'error');
                    }
                });
            }

            const adminBrochureInput = document.getElementById('adminBrochureInput');
            if (adminBrochureInput) {
                adminBrochureInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            siteData.brochure = {
                                name: file.name,
                                type: file.type,
                                url: e.target.result,
                                uploadedAt: new Date().toISOString()
                            };
                            
                            const brochureInfo = document.getElementById('adminBrochureInfo');
                            if (brochureInfo) {
                                brochureInfo.innerHTML = `<i class="fas fa-file-pdf"></i> ${file.name}`;
                            }
                            
                            if (saveSiteData()) {
                                showNotification('Brochure mise à jour', 'success');
                                logActivity(currentUser.username, 'Brochure mise à jour');
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            const adminGalleryInput = document.getElementById('adminGalleryInput');
            if (adminGalleryInput) {
                adminGalleryInput.addEventListener('change', function(e) {
                    const files = Array.from(e.target.files);
                    if (!siteData.gallery) siteData.gallery = [];
                    
                    files.forEach(file => {
                        if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = function(e) {
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
                restoreInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file && file.type === 'application/json') {
                        const reader = new FileReader();
                        reader.onload = function(e) {
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

        function toggleService(index) {
            siteData.services[index].active = !siteData.services[index].active;
            if (saveSiteData()) {
                renderAdminServices();
                showNotification('Service mis à jour', 'success');
                logActivity(currentUser.username, `Service ${siteData.services[index].active ? 'activé' : 'désactivé'}: ${siteData.services[index].title.fr}`);
            }
        }

        function deleteService(index) {
            if (confirm('Supprimer ce service? Cette action est irréversible.')) {
                const service = siteData.services[index];
                siteData.services.splice(index, 1);
                if (saveSiteData()) {
                    renderAdminServices();
                    showNotification('Service supprimé', 'success');
                    logActivity(currentUser.username, `Service supprimé: ${service.title.fr}`);
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

        function toggleServiceConfig(index) {
            siteData.services[index].active = !siteData.services[index].active;
            renderServicesConfiguration();
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

        function toggleClient(index) {
            siteData.clients[index].active = !siteData.clients[index].active;
            if (saveSiteData()) {
                renderAdminClients();
                showNotification('Client mis à jour', 'success');
                logActivity(currentUser.username, `Client ${siteData.clients[index].active ? 'activé' : 'désactivé'}: ${siteData.clients[index].name}`);
            }
        }

        function deleteClient(index) {
            if (confirm('Supprimer ce client? Cette action est irréversible.')) {
                const client = siteData.clients[index];
                siteData.clients.splice(index, 1);
                if (saveSiteData()) {
                    renderAdminClients();
                    showNotification('Client supprimé', 'success');
                    logActivity(currentUser.username, `Client supprimé: ${client.name}`);
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

        function toggleTestimonial(index) {
            siteData.testimonials[index].active = !siteData.testimonials[index].active;
            if (saveSiteData()) {
                renderAdminTestimonials();
                showNotification('Témoignage mis à jour', 'success');
                logActivity(currentUser.username, `Témoignage ${siteData.testimonials[index].active ? 'activé' : 'désactivé'}: ${siteData.testimonials[index].name}`);
                
                // Redémarrer le carrousel automatique
                if (currentPage === 'home') {
                    executeHomeScript();
                }
            }
        }

        function deleteTestimonial(index) {
            if (confirm('Supprimer ce témoignage? Cette action est irréversible.')) {
                const testimonial = siteData.testimonials[index];
                siteData.testimonials.splice(index, 1);
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

        function toggleJob(index) {
            siteData.jobs[index].active = !siteData.jobs[index].active;
            if (saveSiteData()) {
                renderAdminJobs();
                showNotification('Offre mise à jour', 'success');
                logActivity(currentUser.username, `Offre ${siteData.jobs[index].active ? 'activée' : 'désactivée'}: ${siteData.jobs[index].title.fr}`);
            }
        }

        function deleteJob(index) {
            if (confirm('Supprimer cette offre? Cette action est irréversible.')) {
                const job = siteData.jobs[index];
                siteData.jobs.splice(index, 1);
                if (saveSiteData()) {
                    renderAdminJobs();
                    showNotification('Offre supprimée', 'success');
                    logActivity(currentUser.username, `Offre supprimée: ${job.title.fr}`);
                }
            }
        }

        function editUser(index) {
            const user = siteData.users[index];
            currentEditingIndex = index;
            currentEditingType = 'user';
            document.getElementById('userName').value = user.username;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userPassword').value = ''; // Ne pas pré-remplir le mot de passe
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

        function deletePage(index) {
            if (confirm('Supprimer cette page? Cette action est irréversible.')) {
                const page = siteData.customPages[index];
                siteData.customPages.splice(index, 1);
                if (saveSiteData()) {
                    renderAdminPages();
                    showNotification('Page supprimée', 'success');
                    logActivity(currentUser.username, `Page supprimée: ${page.title}`);
                }
            }
        }

        function previewCV(cvId) {
            const cv = siteData.cvDatabase.find(c => c.id === cvId);
            if (cv) {
                document.getElementById('cvPreviewContent').innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                        <div>
                            <h3 style="color: var(--primary); font-weight: 800; margin-bottom: 20px; font-size: var(--font-size-2xl);">${cv.applicantName}</h3>
                            <p><strong>Email:</strong> ${cv.applicantEmail}</p>
                            <p><strong>Téléphone:</strong> ${cv.applicantPhone || 'Non renseigné'}</p>
                            ${cv.applicantPosition ? `<p><strong>Poste actuel:</strong> ${cv.applicantPosition}</p>` : ''}
                            ${cv.expectedSalary ? `<p><strong>Salaire souhaité:</strong> ${cv.expectedSalary} DA</p>` : ''}
                        </div>
                        <div>
                            <p><strong>Poste:</strong> <span style="color: var(--primary); font-weight: 600;">${cv.jobTitle}</span></p>
                            <p><strong>Date:</strong> ${new Date(cv.appliedAt).toLocaleDateString()}</p>
                            <p><strong>Statut:</strong> <span class="status-badge ${cv.processed ? 'status-processed' : 'status-pending'}">${cv.processed ? 'Traité' : 'En attente'}</span></p>
                            ${cv.processedBy ? `<p><strong>Traité par:</strong> ${cv.processedBy}</p>` : ''}
                            ${cv.currentlyEmployed ? `<p><strong>En poste:</strong> ${cv.currentlyEmployed === 'yes' ? 'Oui' : 'Non'}</p>` : ''}
                            ${cv.lastJobDate ? `<p><strong>Dernier poste:</strong> ${cv.lastJobDate}</p>` : ''}
                            ${cv.lastContractType ? `<p><strong>Type contrat:</strong> ${cv.lastContractType}</p>` : ''}
                        </div>
                    </div>
                    <div style="margin-top: 24px;">
                        <h4 style="color: var(--primary); font-weight: 700; margin-bottom: 16px;">CV:</h4>
                        <div style="background: var(--bg-alt); padding: 24px; border-radius: var(--border-radius-lg); margin-top: 12px; text-align: center; border: 3px dashed var(--border);">
                            <i class="fas fa-file-pdf" style="font-size: 60px; color: var(--danger); margin-bottom: 12px;"></i>
                            <p style="font-weight: 600; margin-bottom: 8px;">${cv.applicantCV ? cv.applicantCV.name : 'CV non disponible'}</p>
                            ${cv.applicantCV ? `<p style="font-size: var(--font-size-sm); color: var(--text-light);">Taille: ${(cv.applicantCV.size / 1024).toFixed(1)} KB</p>` : ''}
                        </div>
                    </div>
                `;
                openModal('cvPreviewModal');
            }
        }

        function contactApplicant(email) {
            window.location.href = `mailto:${email}?subject=Votre candidature chez AE2I Algérie`;
            logActivity(currentUser.username, `Contact candidat: ${email}`);
        }

        function markAsProcessed(cvId) {
            const cv = siteData.cvDatabase.find(c => c.id === cvId);
            if (cv) {
                cv.processed = true;
                cv.processedAt = new Date().toISOString();
                cv.processedBy = currentUser.username;
                if (saveSiteData()) {
                    renderAdminCvDatabase();
                    populateCVJobFilter();
                    showNotification('Candidature marquée comme traitée', 'success');
                    logActivity(currentUser.username, `Candidature traitée: ${cv.applicantName}`);
                }
            }
        }

        function downloadCV(cvId) {
            const cv = siteData.cvDatabase.find(c => c.id === cvId);
            if (cv && cv.applicantCV) {
                showNotification(`Téléchargement du CV de ${cv.applicantName}`, 'info');
                logActivity(currentUser.username, `CV téléchargé: ${cv.applicantName}`);
            }
        }

        function deleteApplication(cvId) {
            if (confirm('Supprimer cette candidature? Cette action est irréversible.')) {
                const cvIndex = siteData.cvDatabase.findIndex(c => c.id === cvId);
                if (cvIndex >= 0) {
                    const cv = siteData.cvDatabase[cvIndex];
                    siteData.cvDatabase.splice(cvIndex, 1);
                    if (saveSiteData()) {
                        renderAdminCvDatabase();
                        populateCVJobFilter();
                        showNotification('Candidature supprimée', 'success');
                        logActivity(currentUser.username, `Candidature supprimée: ${cv.applicantName}`);
                    }
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

        function updateAdminProfile() {
            const adminUser = siteData.users.find(u => u.role === 'admin');
            if (adminUser) {
                const newName = document.getElementById('adminName').value;
                const newEmail = document.getElementById('adminEmail').value;
                const newPassword = document.getElementById('adminPassword').value;
                
                adminUser.username = newName;
                adminUser.email = newEmail;
                if (newPassword) {
                    adminUser.password = newPassword;
                }
                
                if (saveSiteData()) {
                    showNotification('Profil administrateur mis à jour', 'success');
                    logActivity(currentUser.username, 'Profil administrateur modifié');
                }
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
            renderRecruteurContent();
            setupRecruteurInteractions();
        }

        function renderRecruteurContent() {
            // Update recruiter stats
            const myJobs = siteData.jobs.filter(j => j.createdBy === currentUser.username);
            const myApplications = siteData.cvDatabase.filter(cv => 
                myJobs.some(job => job.id === cv.jobId)
            );
            
            document.getElementById('recruteurMyJobs').textContent = myJobs.length;
            document.getElementById('recruteurApplications').textContent = myApplications.length;
            document.getElementById('recruteurProcessed').textContent = myApplications.filter(cv => cv.processed).length;
            document.getElementById('recruteurPending').textContent = myApplications.filter(cv => !cv.processed).length;

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
                    
                    jobItem.addEventListener('mouseenter', function() {
                        this.style.transform = 'translateY(-3px)';
                        this.style.boxShadow = 'var(--shadow-lg)';
                        this.style.borderColor = 'var(--accent)';
                    });
                    
                    jobItem.addEventListener('mouseleave', function() {
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
                
                // Pagination
                const itemsPerPage = 10;
                const currentPage = window.recruteurCurrentPage || 1;
                const totalPages = Math.ceil(allFiltered.length / itemsPerPage);
                const startIdx = (currentPage - 1) * itemsPerPage;
                const endIdx = startIdx + itemsPerPage;
                const filteredApplications = allFiltered.slice(startIdx, endIdx);

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
                            <h4 style="font-weight: 800; font-size: var(--font-size-lg);">${cv.applicantName}</h4>
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
                            <button class="btn btn-sm btn-outline functional-btn" onclick="openCVViewer('${cv.cvUrl || ''}', '${cv.applicantName}')">
                                <i class="fas fa-expand"></i> Visionneuse CV
                            </button>
                            <button class="btn btn-sm btn-outline functional-btn" onclick="previewCV(${cv.id})">
                                <i class="fas fa-eye"></i> Voir détails
                            </button>
                            <button class="btn btn-sm btn-primary functional-btn" onclick="contactApplicant('${cv.applicantEmail}')">
                                <i class="fas fa-envelope"></i> Contacter
                            </button>
                            <button class="btn btn-sm btn-success functional-btn" onclick="markAsProcessed(${cv.id})">
                                <i class="fas fa-check"></i> Marquer traité
                            </button>
                            <button class="btn btn-sm btn-warning functional-btn" onclick="downloadCV(${cv.id})">
                                <i class="fas fa-download"></i> Télécharger CV
                            </button>
                        </div>
                    `;
                    
                    cvItem.addEventListener('mouseenter', function() {
                        this.style.transform = 'translateY(-3px)';
                        this.style.boxShadow = 'var(--shadow-lg)';
                        this.style.borderColor = 'var(--accent)';
                    });
                    
                    cvItem.addEventListener('mouseleave', function() {
                        this.style.transform = 'translateY(0)';
                        this.style.boxShadow = 'var(--shadow-md)';
                        this.style.borderColor = 'var(--border)';
                    });
                    
                    candidatures.appendChild(cvItem);
                    
                    // Setup auto-save for notes
                    const noteTextarea = document.getElementById(`note-${cvId}`);
                    if (noteTextarea) {
                        noteTextarea.addEventListener('input', debounce(function() {
                            saveCandidateNote(cvId, this.value);
                        }, 1000));
                    }
                });

                // Pagination UI
                if (totalPages > 1) {
                    const paginationDiv = document.createElement('div');
                    paginationDiv.style.cssText = 'margin-top: var(--spacing-lg); text-align: center;';
                    paginationDiv.innerHTML = `
                        <button class="btn btn-sm btn-outline functional-btn" onclick="changeRecruteurPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i> Précédent
                        </button>
                        <span style="margin: 0 16px; font-weight: 600;">Page ${currentPage} / ${totalPages} (${allFiltered.length} résultats)</span>
                        <button class="btn btn-sm btn-outline functional-btn" onclick="changeRecruteurPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                            Suivant <i class="fas fa-chevron-right"></i>
                        </button>
                    `;
                    candidatures.appendChild(paginationDiv);
                }

                if (filteredApplications.length === 0) {
                    candidatures.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px; background: var(--bg-alt); border-radius: var(--border-radius-lg);">Aucune candidature trouvée</p>';
                }
            }
        }
        
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
            const myJobs = siteData.jobs.filter(j => j.createdBy === currentUser.username);
            let candidates = siteData.cvDatabase.filter(cv => myJobs.some(job => job.id === cv.jobId));

            // Barre de recherche
            const searchTerm = document.getElementById('recruteurSearchBar')?.value.toLowerCase() || '';
            if (searchTerm) {
                candidates = candidates.filter(cv =>
                    cv.applicantName?.toLowerCase().includes(searchTerm) ||
                    cv.jobTitle?.toLowerCase().includes(searchTerm) ||
                    cv.diplome?.toLowerCase().includes(searchTerm) ||
                    cv.domaine?.toLowerCase().includes(searchTerm)
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

            // Update count
            const countElement = document.getElementById('recruteurFilterCountNumber');
            if (countElement) countElement.textContent = candidates.length;

            return candidates;
        }

        function resetRecruteurFilters() {
            document.getElementById('recruteurSearchBar').value = '';
            document.getElementById('recruteurStatusFilter').value = 'all';
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
            renderLecteurContent();
            setupLecteurInteractions();
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
            
            // Initialize alerts
            initializeLecteurAlerts();
        }

        /* FIX: uniformize-filter-keys */
        /* ADD: apply-lecteur-filters */
        function applyLecteurFilters() {
            renderLecteurCvDatabase();
        }

        function getLecteurFilteredCandidates() {
            let candidates = siteData.cvDatabase || [];

            // Barre de recherche
            const searchTerm = document.getElementById('lecteurSearchBar')?.value.toLowerCase() || '';
            if (searchTerm) {
                candidates = candidates.filter(cv =>
                    cv.applicantName?.toLowerCase().includes(searchTerm) ||
                    cv.jobTitle?.toLowerCase().includes(searchTerm) ||
                    cv.diplome?.toLowerCase().includes(searchTerm) ||
                    cv.domaine?.toLowerCase().includes(searchTerm)
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
                        
                        cvItem.addEventListener('mouseenter', function() {
                            this.style.transform = 'translateY(-3px)';
                            this.style.boxShadow = 'var(--shadow-lg)';
                            this.style.borderColor = 'var(--info)';
                        });
                        
                        cvItem.addEventListener('mouseleave', function() {
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
                candidatureFilter.addEventListener('change', function() {
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
        document.addEventListener('DOMContentLoaded', function() {
            const applicationForm = document.getElementById('applicationForm');
            const closeApplicationModal = document.getElementById('closeApplicationModal');

            /* FIX: Setup driver license radio buttons event listeners */
            const licenseRadios = document.querySelectorAll('input[name="hasDriverLicense"]');
            console.log('Setting up driver license radio buttons, found:', licenseRadios.length);

            licenseRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    console.log('Radio changed, value:', this.value);
                    if (window.toggleDriverLicenseFields) {
                        window.toggleDriverLicenseFields(this.value);
                    } else {
                        console.error('toggleDriverLicenseFields function not found!');
                    }
                });
            });

            if (closeApplicationModal) {
                closeApplicationModal.addEventListener('click', function() {
                    closeModal('applicationModal');
                });
            }

            /* FIX: prevent-double-submit - Enhanced form submission handler with double-submit prevention */
            let isSubmittingApplication = false;

            if (applicationForm) {
                applicationForm.addEventListener('submit', function(e) {
                    e.preventDefault();

                    /* FIX: prevent-double-submit - Check if already processing */
                    if (isSubmittingApplication) {
                        console.log('Form submission already in progress...');
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

                    // Lire le fichier CV
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        /* ADD: candidature-save-pdf - Complete application object with all fields */
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
                                content: e.target.result
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
                            pdfSummary: null  // Will be generated next
                        };
                        
                        /* ADD: auto-generate-pdf - Generate PDF summary automatically */
                        application.pdfSummary = generateApplicationPdfSummary(application, job);

                        if (!siteData.cvDatabase) siteData.cvDatabase = [];
                        siteData.cvDatabase.push(application);

                        if (saveSiteData()) {
                            const successMsg = siteData.language === 'en' ?
                                `Thank you ${applicantName}! Your application has been submitted successfully.` :
                                `Merci ${applicantName}! Votre candidature a été soumise avec succès.`;

                            showNotification(successMsg, 'success');

                            // Notification pour admin et recruteurs connectés
                            if (currentUser.role === 'admin' || currentUser.role === 'recruiter') {
                                setTimeout(() => {
                                    showCandidateNotification(applicantName, job.title.fr, application.id);
                                }, 2000);
                            }

                            applicationForm.reset();
                            closeModal('applicationModal');

                            logActivity('applicant', `Candidature soumise pour ${job.title.fr} par ${applicantName}`);

                            /* FIX: prevent-double-submit - Reset processing flag and button */
                            isSubmittingApplication = false;
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = originalBtnText;
                        } else {
                            /* FIX: prevent-double-submit - Reset on error */
                            isSubmittingApplication = false;
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = originalBtnText;
                            showNotification('Erreur lors de la sauvegarde', 'error');
                        }
                    };

                    reader.onerror = function() {
                        /* FIX: prevent-double-submit - Reset on file read error */
                        isSubmittingApplication = false;
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                        showNotification('Erreur lors de la lecture du fichier CV', 'error');
                    };

                    reader.readAsDataURL(applicantCV);
                });
            }
        });

        function setupLecteurInteractions() {
            // Update user info
            document.getElementById('lecteurCurrentUser').textContent = currentUser.username;
            
            // Setup candidature filter
            const candidatureFilter = document.getElementById('lecteurCandidatureFilter');
            if (candidatureFilter) {
                candidatureFilter.addEventListener('change', function() {
                    renderLecteurCvDatabase();
                });
            }
        }

// Initialize website
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Initializing AE2I Ultra-Professional Website...');
            
            // Load saved data
            loadSiteData();
            
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

        function loadSiteData() {
            try {
                const savedData = localStorage.getItem('ae2i_site_data');
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    siteData = { ...siteData, ...parsed };
                    console.log('✅ Site data loaded successfully');
                }
                
                // Charger le consentement
                const savedConsent = localStorage.getItem('ae2i_consent');
                if (savedConsent) {
                    consentStatus = JSON.parse(savedConsent);
                }
            } catch (error) {
                console.error('❌ Error loading site data:', error);
            }
        }

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
                document.getElementById('heroSubtitle').textContent = siteData.settings.slogan;
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
            
            if (siteData.footerBackground) {
                const footerBackground = document.getElementById('footerBackground');
                if (siteData.footerBackground.type === 'gradient') {
                    footerBackground.style.background = siteData.footerBackground.gradient;
                } else if (siteData.footerBackground.type === 'image') {
                    footerBackground.style.backgroundImage = `url(${siteData.footerBackground.url})`;
                    footerBackground.classList.add('has-image');
                } else if (siteData.footerBackground.type === 'video') {
                    const footerVideo = document.getElementById('footerVideo');
                    const footerVideoSource = document.getElementById('footerVideoSource');
                    if (footerVideo && footerVideoSource) {
                        footerVideoSource.src = siteData.footerBackground.url;
                        footerVideo.load();
                        footerVideo.style.display = 'block';
                        footerBackground.classList.add('has-video');
                    }
                }
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
        setInterval(function() {
            if (currentUser.isLoggedIn) {
                saveSiteData();
            }
        }, 30000); // Auto-save every 30 seconds

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
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
        window.addEventListener('load', function() {
            const loadTime = performance.now();
            logActivity('system', `Site chargé en ${loadTime.toFixed(2)}ms`);
            
            // Update performance display
            if (document.getElementById('loadTime')) {
                document.getElementById('loadTime').textContent = `${loadTime.toFixed(2)}ms`;
            }
        });

        // Error handling
        window.addEventListener('error', function(e) {
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

        // Expose all functions globally for onclick handlers
        window.editService = editService;
        window.toggleService = toggleService;
        window.deleteService = deleteService;
        /* ADD: service-admin-ui - Exposition des nouvelles fonctions */
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
        window.editRecruteurJob = editRecruteurJob;
        window.toggleRecruteurJob = toggleRecruteurJob;
        window.deleteRecruteurJob = deleteRecruteurJob;
        window.viewRecruteurApplications = viewRecruteurApplications;
        window.downloadLecteurCV = downloadLecteurCV;
        window.previewLecteurCV = previewLecteurCV;
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
        window.clearCache = clearCache;
        window.createBackup = createBackup;
        window.anonymizeOldData = anonymizeOldData;
        window.runPerformanceCheck = runPerformanceCheck;
        window.connectLinkedIn = connectLinkedIn;
        window.disconnectLinkedIn = disconnectLinkedIn;
        window.closeModal = closeModal;
        window.openModal = openModal;
        window.applyMultiFilters = applyMultiFilters;
        window.resetMultiFilters = resetMultiFilters;
        window.toggleMultiFilter = toggleMultiFilter;
        window.setFooterBackground = setFooterBackground;
        window.applyFooterGradient = applyFooterGradient;
        window.openRecruteurJobModal = openRecruteurJobModal;
        window.viewRecruteurApplications = viewRecruteurApplications || function(jobId) {
            console.log('Viewing applications for job:', jobId);
            const applications = siteData.cvDatabase.filter(cv => cv.jobId === jobId);
            console.log('Applications:', applications);
        };
        window.downloadLecteurCV = downloadLecteurCV || downloadCV;
        window.previewLecteurCV = previewLecteurCV || previewCV;
        window.executeRecruteurScript = executeRecruteurScript;
        window.executeLecteurScript = executeLecteurScript;
        window.renderRecruteurContent = renderRecruteurContent;
        window.renderLecteurContent = renderLecteurContent;
        window.setupRecruteurInteractions = setupRecruteurInteractions;
        window.setupLecteurInteractions = setupLecteurInteractions;
        window.openUserModal = openUserModal;
        window.updateRoleDescription = updateRoleDescription;
        window.exportAuditLog = exportAuditLog;
        window.exportLecteurCVs = exportLecteurCVs;
        window.openServiceModal = openServiceModal;
        window.openTestimonialModal = openTestimonialModal;
        window.openJobModal = openJobModal;
        window.openClientModal = openClientModal;
        window.openPageModal = openPageModal;
        window.openApplicationForm = openApplicationForm;
        window.exportAllCVs = exportAllCVs;
        window.exportCVDatabase = exportCVDatabase;
        window.exportAnalytics = exportAnalytics;
        window.exportConsentData = exportConsentData;
        window.generateGlobalReport = generateGlobalReport;
        window.markAsProcessed = markAsProcessed;
        window.markAsRead = markAsRead;
        window.removeHeroBackground = removeHeroBackground;
        window.removeFooterBackground = removeFooterBackground;
        window.removeRecruitmentEmail = removeRecruitmentEmail;

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

        function toggleSocialNetworks(toggleElement) {
            toggleElement.classList.toggle('active');
        }

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
            const socialElements = document.querySelectorAll('.footer-social-links, [class*="social"]');
            socialElements.forEach(el => {
                if (enabled) {
                    el.style.display = '';
                } else {
                    el.style.display = 'none';
                }
            });
        }

        /* ADD: admin-toggle-socials-persistence - Initialize socials state on page load */
        function initializeSocialsState() {
            if (!siteData.settings) siteData.settings = {};

            // Default to enabled if not set
            if (siteData.settings.socialsEnabled === undefined) {
                siteData.settings.socialsEnabled = true;
            }

            // Apply visibility based on saved state
            applySocialsVisibility(siteData.settings.socialsEnabled);

            // Update toggle button in admin if it exists
            const socialsToggle = document.getElementById('socialsToggle');
            if (socialsToggle) {
                if (siteData.settings.socialsEnabled) {
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
                    
                    switch(type) {
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
                    
                    switch(type) {
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
                        <button onclick="this.closest('div').parentElement.parentElement.remove()" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div style="flex: 1; overflow: auto; padding: 20px;">
                        <iframe src="${cvUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
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
        window.initializeLecteurAlerts = initializeLecteurAlerts;
        window.saveLecteurAlert = saveLecteurAlert;

        console.log('🎉 AE2I Enhanced Ultra-Professional Site - Multi-role System with Advanced Features + Autosave Initialized Successfully');