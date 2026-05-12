BarangayManager.prototype.getCurrentPageName = function() {
        return window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
    }


BarangayManager.prototype.isAppPage = function() {
        return this.getCurrentPageName() === 'index.html';
    }


BarangayManager.prototype.isWelcomePage = function() {
        return this.getCurrentPageName() === 'welcome.html';
    }


BarangayManager.prototype.isAuthPage = function() {
        return this.getCurrentPageName() === 'auth.html';
    }


BarangayManager.prototype.getAuthViewFromUrl = function() {
        const params = new URLSearchParams(window.location.search);
        return params.get('view') === 'user-signup' ? 'user-signup' : 'login';
    }


BarangayManager.prototype.navigateTo = function(page, query = '') {
        const target = `${page}${query}`;
        if (window.location.pathname.endsWith(page) && window.location.search === query) {
            return false;
        }

        window.location.href = target;
        return true;
    }


BarangayManager.prototype.resetAuthForms = function() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const loginError = document.getElementById('loginError');
        const signupError = document.getElementById('signupError');
        const signupSuccess = document.getElementById('signupSuccess');

        if (loginForm) loginForm.reset();
        if (signupForm) signupForm.reset();
        if (loginError) loginError.textContent = '';
        if (signupError) signupError.textContent = '';
        if (signupSuccess) signupSuccess.textContent = '';
    }


BarangayManager.prototype.init = function() {
        this.loadAllData();
        this.removeLegacySampleData();
        this.normalizeVerificationRecords();
        this.bindEvents();
        this.renderPublicAnnouncements();

        const savedLogin = localStorage.getItem('bms_admin_logged_in');
        const savedAdmin = localStorage.getItem('bms_admin_name');
        const savedRole = localStorage.getItem('bms_session_role');
        const savedUser = localStorage.getItem('bms_session_user');
        const hasUserSession = savedRole && savedUser;
        const hasAdminSession = savedLogin === 'true' && savedAdmin;

        if (hasUserSession) {
            this.isLoggedIn = true;
            this.currentUserRole = savedRole;
            this.currentUser = JSON.parse(savedUser);
            this.currentAdmin = this.currentUser.username;
            this.updateRoleUI();

            if (!this.isAppPage()) {
                this.navigateTo('index.html');
                return;
            }

            this.showApp();
            this.updateDashboard();
            this.renderAllPages();
            if (savedRole === 'user') {
                this.showPage('user-dashboard');
            }
            return;
        }

        if (hasAdminSession) {
            this.isLoggedIn = true;
            this.currentUserRole = 'admin';
            this.currentAdmin = savedAdmin;
            this.currentUser = { username: savedAdmin, fullName: savedAdmin };
            this.updateRoleUI();

            if (!this.isAppPage()) {
                this.navigateTo('index.html');
                return;
            }

            this.showApp();
            this.updateDashboard();
            this.renderAllPages();
            return;
        }

        if (this.isAppPage()) {
            this.navigateTo('welcome.html');
            return;
        }

        if (this.isAuthPage()) {
            this.resetAuthForms();
            this.switchAuthView(this.getAuthViewFromUrl());
        }
    }


BarangayManager.prototype.showApp = function() {
        if (!this.isAppPage()) {
            this.navigateTo('index.html');
            return;
        }

        const app = document.getElementById('app');
        if (app) {
            app.classList.remove('hidden');
        }
    }


BarangayManager.prototype.showLogin = function() {
        this.showWelcome();
    }


BarangayManager.prototype.showWelcome = function() {
        if (!this.isWelcomePage()) {
            this.navigateTo('welcome.html');
            return;
        }

        this.renderPublicAnnouncements();
    }


BarangayManager.prototype.showAuthPage = function(view = 'login') {
        if (!this.isAuthPage()) {
            this.navigateTo('auth.html', `?view=${view}`);
            return;
        }

        this.resetAuthForms();
        this.switchAuthView(view);
    }


BarangayManager.prototype.showPage = function(pageName) {
        if (this.currentUserRole === 'user') {
            pageName = 'user-dashboard';
        }

        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const targetNav = document.querySelector(`[data-page="${pageName}"]`);
        if (targetNav) targetNav.classList.add('active');

        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageName);
        if (targetPage) targetPage.classList.add('active');

        switch (pageName) {
            case 'dashboard':
                this.renderAdminDashboard();
                break;
            case 'user-dashboard':
                this.renderUserDashboard();
                break;
            case 'residents':
                this.renderResidents();
                break;
            case 'certificates':
                this.renderCertificates();
                break;
            case 'blotter':
                this.renderBlotters();
                break;
            case 'appointments':
                this.renderAppointments();
                break;
            case 'announcements':
                this.renderAnnouncements();
                break;
            case 'reports':
                this.renderReports();
                break;
        }

        this.updateRoleUI();
    }

    // Data Management

