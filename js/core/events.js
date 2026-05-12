BarangayManager.prototype.bindEvents = function() {
        const attachById = (id, eventName, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(eventName, handler);
            }
        };

        attachById('openLoginBtn', 'click', () => this.showAuthPage('login'));
        attachById('openSignupBtn', 'click', () => this.showAuthPage('user-signup'));
        attachById('backToWelcomeBtn', 'click', () => this.showWelcome());
        attachById('logoutBtn', 'click', () => this.logout());

        attachById('loginForm', 'submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        attachById('signupForm', 'submit', (e) => {
            e.preventDefault();
            this.handleUserSignup();
        });

        attachById('residentForm', 'submit', (e) => {
            e.preventDefault();
            this.saveResident();
        });

        attachById('certificateForm', 'submit', (e) => {
            e.preventDefault();
            this.saveCertificate();
        });

        attachById('blotterForm', 'submit', (e) => {
            e.preventDefault();
            this.saveBlotter();
        });

        attachById('appointmentForm', 'submit', (e) => {
            e.preventDefault();
            this.saveAppointment();
        });

        attachById('announcementForm', 'submit', (e) => {
            e.preventDefault();
            this.saveAnnouncement();
        });

        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchAuthView(tab.dataset.authView);
            });
        });

        document.querySelectorAll('[data-toggle-password]').forEach(toggle => {
            toggle.addEventListener('click', () => {
                this.togglePasswordVisibility(toggle);
            });
        });

        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage(item.dataset.page);
            });
        });

        document.querySelectorAll('[data-page-shortcut]').forEach(button => {
            button.addEventListener('click', () => {
                this.showPage(button.dataset.pageShortcut);
            });
        });

        document.addEventListener('click', (event) => {
            const button = event.target.closest('[data-user-action]');
            if (!button) return;

            const action = button.dataset.userAction;
            if (action === 'verification') {
                this.showVerificationScheduleInfo();
                return;
            }

            if (this.currentUserRole === 'user' && !this.canCurrentUserAccessServices()) {
                this.showVerificationScheduleInfo();
                return;
            }

            if (action === 'certificate') this.openUserCertificateRequest();
            if (action === 'appointment') this.openUserAppointmentRequest();
            if (action === 'concern') this.openUserConcernReport();
        });

        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openModal(btn.dataset.modal);
            });
        });

        document.querySelectorAll('.close, [data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        this.bindSearchEvents();

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showReportTab(btn.dataset.tab);
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }


