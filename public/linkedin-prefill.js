/* ===== LINKEDIN PREFILL SYSTEM ===== */
/* Auto-detects LinkedIn data and pre-fills application form */

(function() {
    'use strict';

    const LinkedInPrefill = {
        storageKey: 'linkedin_user_profile',
        autofilled: false,

        init() {
            console.log('🔍 LinkedIn Prefill System Initialized');

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.checkAndPrefill());
            } else {
                this.checkAndPrefill();
            }
        },

        checkAndPrefill() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const shouldPrefill = urlParams.get('prefill') === 'true' || urlParams.get('linkedin_auth') === 'success';

                if (!shouldPrefill) {
                    console.log('⏭️ LinkedIn prefill not requested');
                    return;
                }

                const linkedInProfile = this.getLinkedInProfile();

                if (!linkedInProfile) {
                    console.warn('⚠️ No LinkedIn profile found in localStorage');
                    return;
                }

                console.log('✅ LinkedIn profile found, pre-filling form...');
                this.prefillForm(linkedInProfile);
                this.showPrefillNotification();
                this.cleanUrl();

            } catch (error) {
                console.error('❌ LinkedIn prefill error:', error);
            }
        },

        getLinkedInProfile() {
            try {
                const stored = localStorage.getItem(this.storageKey);
                return stored ? JSON.parse(stored) : null;
            } catch (error) {
                console.error('Error parsing LinkedIn profile:', error);
                return null;
            }
        },

        prefillForm(profile) {
            const fieldMappings = {
                applicantFirstName: profile.firstName || '',
                applicantLastName: profile.lastName || '',
                applicantEmail: profile.email || '',
                applicantPosition: profile.headline || ''
            };

            let filledCount = 0;

            for (const [fieldId, value] of Object.entries(fieldMappings)) {
                const field = document.getElementById(fieldId);
                if (field && value) {
                    field.value = value;
                    field.setAttribute('data-linkedin-filled', 'true');
                    field.classList.add('linkedin-prefilled');
                    filledCount++;
                    console.log(`✓ Filled ${fieldId}: ${value}`);
                }
            }

            this.autofilled = filledCount > 0;
            console.log(`📝 Pre-filled ${filledCount} fields`);

            if (this.autofilled) {
                this.highlightFilledFields();
            }
        },

        highlightFilledFields() {
            const style = document.createElement('style');
            style.textContent = `
                .linkedin-prefilled {
                    background: linear-gradient(135deg, rgba(0, 119, 181, 0.05) 0%, rgba(0, 119, 181, 0.02) 100%) !important;
                    border-color: #0077B5 !important;
                    box-shadow: inset 0 0 0 1px rgba(0, 119, 181, 0.2) !important;
                    transition: all 0.3s ease;
                }

                .linkedin-prefilled:focus {
                    box-shadow: inset 0 0 0 2px rgba(0, 119, 181, 0.4), 0 0 0 3px rgba(0, 119, 181, 0.1) !important;
                    border-color: #0077B5 !important;
                }

                .linkedin-prefill-notification {
                    animation: slideInDown 0.5s ease-out;
                }

                @keyframes slideInDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        },

        showPrefillNotification() {
            const profile = this.getLinkedInProfile();
            if (!profile) return;

            const notification = document.createElement('div');
            notification.className = 'linkedin-prefill-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #0077B5 0%, #005885 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 119, 181, 0.3);
                z-index: 10000;
                max-width: 400px;
                font-size: 14px;
                font-weight: 500;
                border-left: 4px solid rgba(255, 255, 255, 0.3);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                gap: 12px;
            `;

            const icon = document.createElement('i');
            icon.className = 'fas fa-check-circle';
            icon.style.fontSize = '18px';

            const text = document.createElement('span');
            text.textContent = `Formulaire pré-rempli avec votre profil LinkedIn (${profile.firstName} ${profile.lastName})`;

            notification.appendChild(icon);
            notification.appendChild(text);
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.transition = 'opacity 0.3s ease';
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        },

        cleanUrl() {
            const url = new URL(window.location);
            url.searchParams.delete('linkedin_auth');
            url.searchParams.delete('prefill');
            url.searchParams.delete('linkedin_user_id');
            window.history.replaceState({}, document.title, url.toString());
        }
    };

    window.LinkedInPrefill = LinkedInPrefill;
    LinkedInPrefill.init();
})();
