// Barangay Management System - JavaScript
// All data is stored in localStorage

class BarangayManager {
    constructor() {
        this.isLoggedIn = false;
        this.currentAdmin = '';
        this.currentUserRole = '';
        this.currentUser = null;
        this.users = [];
        this.residents = [];
        this.certificates = [];
        this.blotters = [];
        this.appointments = [];
        this.announcements = [];
        this.activities = [];
        this.init();
    }

    getCurrentPageName() {
        return window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
    }

    isAppPage() {
        return this.getCurrentPageName() === 'index.html';
    }

    isWelcomePage() {
        return this.getCurrentPageName() === 'welcome.html';
    }

    isAuthPage() {
        return this.getCurrentPageName() === 'auth.html';
    }

    getAuthViewFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('view') === 'user-signup' ? 'user-signup' : 'login';
    }

    navigateTo(page, query = '') {
        const target = `${page}${query}`;
        if (window.location.pathname.endsWith(page) && window.location.search === query) {
            return false;
        }

        window.location.href = target;
        return true;
    }

    resetAuthForms() {
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

    init() {
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

    bindEvents() {
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

    handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('loginError');

        errorEl.textContent = '';

        if (username === 'admin' && password === 'admin123') {
            this.isLoggedIn = true;
            this.currentAdmin = username;
            this.currentUserRole = 'admin';
            this.currentUser = { username, fullName: 'Administrator' };
            localStorage.setItem('bms_admin_logged_in', 'true');
            localStorage.setItem('bms_admin_name', username);
            localStorage.setItem('bms_session_role', 'admin');
            localStorage.setItem('bms_session_user', JSON.stringify(this.currentUser));
            this.updateRoleUI();
            this.showApp();
            this.loadAllData();
            this.updateDashboard();
            this.renderAllPages();
            return;
        }

        const matchedUser = this.users.find(user => user.username === username && user.password === password);

        if (!matchedUser) {
            errorEl.textContent = 'Invalid username or password.';
            return;
        }

        this.isLoggedIn = true;
        this.currentUserRole = 'user';
        this.currentUser = matchedUser;
        this.currentAdmin = matchedUser.username;
        localStorage.removeItem('bms_admin_logged_in');
        localStorage.removeItem('bms_admin_name');
        localStorage.setItem('bms_session_role', 'user');
        localStorage.setItem('bms_session_user', JSON.stringify(matchedUser));
        this.updateRoleUI();
        this.showApp();
        this.updateDashboard();
        this.renderAllPages();
        this.showPage('user-dashboard');
    }

    handleUserSignup() {
        const defaultAddress = 'Brgy. Biasong, Loon, Bohol';
        const fullName = document.getElementById('signupFullName').value.trim();
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const contact = document.getElementById('signupContact').value.trim();
        const birthdate = document.getElementById('signupBirthdate').value;
        const gender = document.getElementById('signupGender').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const errorEl = document.getElementById('signupError');
        const successEl = document.getElementById('signupSuccess');

        errorEl.textContent = '';
        successEl.textContent = '';

        if (password.length < 6) {
            errorEl.textContent = 'Password must be at least 6 characters.';
            return;
        }

        if (password !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match.';
            return;
        }

        if (this.users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
            errorEl.textContent = 'Username already exists.';
            return;
        }

        if (this.users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
            errorEl.textContent = 'Email address is already registered.';
            return;
        }
        const userId = Date.now();
        const newUser = {
            id: userId,
            fullName,
            username,
            email,
            contact,
            address: defaultAddress,
            birthdate,
            gender,
            password,
            verificationStatus: 'pending',
            verificationScheduleDate: '',
            verificationScheduleTime: '',
            verificationNotes: '',
            verifiedAt: '',
            createdAt: new Date().toISOString()
        };
        const existingResidentIndex = this.residents.findIndex(resident => resident.name.toLowerCase() === fullName.toLowerCase());

        this.users.push(newUser);
        if (existingResidentIndex > -1) {
            const existingResident = this.residents[existingResidentIndex];
            this.residents[existingResidentIndex] = {
                ...existingResident,
                userId,
                name: fullName,
                age: existingResident.age || this.calculateAge(birthdate),
                gender: existingResident.gender || gender,
                birthdate: existingResident.birthdate || birthdate,
                address: existingResident.address || defaultAddress,
                contact: contact || existingResident.contact,
                status: existingResident.status || 'Active',
                verificationStatus: existingResident.verificationStatus || 'pending',
                verificationScheduleDate: existingResident.verificationScheduleDate || '',
                verificationScheduleTime: existingResident.verificationScheduleTime || '',
                verificationNotes: existingResident.verificationNotes || '',
                verifiedAt: existingResident.verifiedAt || ''
            };
        } else {
            this.residents.push({
                id: userId,
                userId,
                name: fullName,
                age: this.calculateAge(birthdate),
                gender,
                birthdate,
                civilStatus: '',
                address: defaultAddress,
                contact,
                occupation: '',
                status: 'Active',
                verificationStatus: 'pending',
                verificationScheduleDate: '',
                verificationScheduleTime: '',
                verificationNotes: '',
                verifiedAt: ''
            });
        }
        this.saveToStorage('users', this.users);
        this.saveToStorage('residents', this.residents);
        this.logActivity('signup', fullName, `New resident account created with username ${username}.`);
        this.updateDashboard();
        document.getElementById('signupForm').reset();
        successEl.textContent = 'Account created. You can now log in.';
        this.switchAuthView('login');
        document.getElementById('username').value = username;
    }

    logout() {
        localStorage.removeItem('bms_admin_logged_in');
        localStorage.removeItem('bms_admin_name');
        localStorage.removeItem('bms_session_role');
        localStorage.removeItem('bms_session_user');
        this.isLoggedIn = false;
        this.currentUserRole = '';
        this.currentUser = null;
        this.showLogin();
    }

    showApp() {
        if (!this.isAppPage()) {
            this.navigateTo('index.html');
            return;
        }

        const app = document.getElementById('app');
        if (app) {
            app.classList.remove('hidden');
        }
    }

    showLogin() {
        this.showWelcome();
    }

    showWelcome() {
        if (!this.isWelcomePage()) {
            this.navigateTo('welcome.html');
            return;
        }

        this.renderPublicAnnouncements();
    }

    showAuthPage(view = 'login') {
        if (!this.isAuthPage()) {
            this.navigateTo('auth.html', `?view=${view}`);
            return;
        }

        this.resetAuthForms();
        this.switchAuthView(view);
    }

    showPage(pageName) {
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
    saveToStorage(key, data) {
        localStorage.setItem(`bms_${key}`, JSON.stringify(data));
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(`bms_${key}`);
        return data ? JSON.parse(data) : [];
    }

    loadAllData() {
        this.users = this.loadFromStorage('users');
        this.residents = this.loadFromStorage('residents');
        this.certificates = this.loadFromStorage('certificates');
        this.blotters = this.loadFromStorage('blotters');
        this.appointments = this.loadFromStorage('appointments');
        this.announcements = this.loadFromStorage('announcements');
        this.activities = this.loadFromStorage('activities');
    }

    removeLegacySampleData() {
        const filteredUsers = this.users.filter(user => user.username !== 'liagomez');
        const filteredResidents = this.residents.filter(resident => !['Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes'].includes(resident.name));
        const filteredCertificates = this.certificates.filter(certificate => !['Juan Dela Cruz', 'Maria Santos'].includes(certificate.residentName));
        const filteredBlotters = this.blotters.filter(blotter =>
            !(blotter.complainant === 'Juan Dela Cruz' && blotter.respondent === 'Pedro Reyes' && blotter.description === 'Noise complaint')
        );
        const filteredAppointments = this.appointments.filter(appointment =>
            !(appointment.residentName === 'Juan Dela Cruz' && appointment.purpose === 'Business Permit Renewal')
        );
        const filteredAnnouncements = this.announcements.filter(announcement =>
            !['Barangay Clean-Up Drive', 'Vaccination Drive'].includes(announcement.title)
        );

        if (filteredUsers.length !== this.users.length) {
            this.users = filteredUsers;
            this.saveToStorage('users', this.users);
        }

        if (filteredResidents.length !== this.residents.length) {
            this.residents = filteredResidents;
            this.saveToStorage('residents', this.residents);
        }

        if (filteredCertificates.length !== this.certificates.length) {
            this.certificates = filteredCertificates;
            this.saveToStorage('certificates', this.certificates);
        }

        if (filteredBlotters.length !== this.blotters.length) {
            this.blotters = filteredBlotters;
            this.saveToStorage('blotters', this.blotters);
        }

        if (filteredAppointments.length !== this.appointments.length) {
            this.appointments = filteredAppointments;
            this.saveToStorage('appointments', this.appointments);
        }

        if (filteredAnnouncements.length !== this.announcements.length) {
            this.announcements = filteredAnnouncements;
            this.saveToStorage('announcements', this.announcements);
        }
    }

    renderPublicAnnouncements() {
        const container = document.getElementById('publicAnnouncementFeed');
        if (!container) return;

        const announcements = [...this.announcements]
            .slice(-6)
            .reverse();

        container.innerHTML = announcements.length
            ? announcements.map(announcement => `
                <article class="public-announcement-card">
                    <div class="public-announcement-icon"><i class="fas fa-bullhorn"></i></div>
                    <div>
                        <h3>${announcement.title}</h3>
                        <p>${announcement.content}</p>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed public-empty-feed">No announcements posted yet. Please check back later.</div>';
    }

    getUserByIdentity(userLike = null) {
        if (!userLike) return null;

        return this.users.find(user =>
            user.id === userLike.id ||
            user.username === userLike.username ||
            user.fullName === userLike.fullName
        ) || userLike;
    }

    getResidentByUser(userLike = null) {
        const user = this.getUserByIdentity(userLike);
        if (!user) return null;

        return this.residents.find(resident =>
            resident.userId === user.id ||
            resident.id === user.id ||
            resident.name === user.fullName
        ) || null;
    }

    normalizeVerificationRecords() {
        let usersChanged = false;
        let residentsChanged = false;

        this.users = this.users.map(user => {
            const normalized = {
                ...user,
                verificationStatus: user.verificationStatus || 'pending',
                verificationScheduleDate: user.verificationScheduleDate || '',
                verificationScheduleTime: user.verificationScheduleTime || '',
                verificationNotes: user.verificationNotes || '',
                verifiedAt: user.verifiedAt || ''
            };

            if (
                normalized.verificationStatus !== user.verificationStatus ||
                normalized.verificationScheduleDate !== user.verificationScheduleDate ||
                normalized.verificationScheduleTime !== user.verificationScheduleTime ||
                normalized.verificationNotes !== user.verificationNotes ||
                normalized.verifiedAt !== user.verifiedAt
            ) {
                usersChanged = true;
            }

            return normalized;
        });

        this.residents = this.residents.map(resident => {
            const matchedUser = this.users.find(user =>
                user.id === resident.userId ||
                user.id === resident.id ||
                user.fullName?.toLowerCase() === resident.name.toLowerCase()
            );
            const defaultStatus = resident.verificationStatus || matchedUser?.verificationStatus || (matchedUser ? 'pending' : 'verified');
            const normalized = {
                ...resident,
                userId: resident.userId || matchedUser?.id || '',
                verificationStatus: defaultStatus,
                verificationScheduleDate: resident.verificationScheduleDate || matchedUser?.verificationScheduleDate || '',
                verificationScheduleTime: resident.verificationScheduleTime || matchedUser?.verificationScheduleTime || '',
                verificationNotes: resident.verificationNotes || matchedUser?.verificationNotes || '',
                verifiedAt: resident.verifiedAt || matchedUser?.verifiedAt || ''
            };

            if (
                normalized.userId !== resident.userId ||
                normalized.verificationStatus !== resident.verificationStatus ||
                normalized.verificationScheduleDate !== resident.verificationScheduleDate ||
                normalized.verificationScheduleTime !== resident.verificationScheduleTime ||
                normalized.verificationNotes !== resident.verificationNotes ||
                normalized.verifiedAt !== resident.verifiedAt
            ) {
                residentsChanged = true;
            }

            return normalized;
        });

        if (usersChanged) this.saveToStorage('users', this.users);
        if (residentsChanged) this.saveToStorage('residents', this.residents);
    }

    syncCurrentUserSession(user) {
        if (this.currentUserRole !== 'user' || !user) return;

        const sameUser = this.currentUser && (
            this.currentUser.id === user.id ||
            this.currentUser.username === user.username ||
            this.currentUser.fullName === user.fullName
        );

        if (!sameUser) return;

        this.currentUser = user;
        localStorage.setItem('bms_session_user', JSON.stringify(user));
    }

    syncResidentToLinkedUser(resident) {
        const userIndex = this.users.findIndex(user =>
            user.id === resident.userId ||
            user.fullName?.toLowerCase() === resident.name.toLowerCase()
        );

        if (userIndex === -1) return;

        const updatedUser = {
            ...this.users[userIndex],
            fullName: resident.name,
            contact: resident.contact || this.users[userIndex].contact,
            address: resident.address || this.users[userIndex].address,
            birthdate: resident.birthdate || this.users[userIndex].birthdate,
            gender: resident.gender || this.users[userIndex].gender,
            verificationStatus: resident.verificationStatus || 'pending',
            verificationScheduleDate: resident.verificationScheduleDate || '',
            verificationScheduleTime: resident.verificationScheduleTime || '',
            verificationNotes: resident.verificationNotes || '',
            verifiedAt: resident.verifiedAt || ''
        };

        this.users[userIndex] = updatedUser;
        this.saveToStorage('users', this.users);
        this.syncCurrentUserSession(updatedUser);
    }

    formatScheduleDisplay(date, time) {
        if (!date) return 'Not yet scheduled';

        const parsedDate = new Date(`${date}T00:00:00`);
        const dateLabel = Number.isNaN(parsedDate.getTime())
            ? date
            : parsedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

        return time ? `${dateLabel} at ${time}` : dateLabel;
    }

    getCurrentVerificationState() {
        const liveUser = this.getUserByIdentity(this.currentUser);
        const resident = this.getResidentByUser(liveUser);
        const status = resident?.verificationStatus || liveUser?.verificationStatus || 'pending';
        const scheduleDate = resident?.verificationScheduleDate || liveUser?.verificationScheduleDate || '';
        const scheduleTime = resident?.verificationScheduleTime || liveUser?.verificationScheduleTime || '';
        const notes = resident?.verificationNotes || liveUser?.verificationNotes || '';

        if (liveUser) {
            this.syncCurrentUserSession({
                ...liveUser,
                verificationStatus: status,
                verificationScheduleDate: scheduleDate,
                verificationScheduleTime: scheduleTime,
                verificationNotes: notes,
                verifiedAt: resident?.verifiedAt || liveUser?.verifiedAt || ''
            });
        }

        return {
            user: liveUser,
            resident,
            status,
            scheduleDate,
            scheduleTime,
            scheduleDisplay: this.formatScheduleDisplay(scheduleDate, scheduleTime),
            notes
        };
    }

    canCurrentUserAccessServices() {
        return this.getCurrentVerificationState().status === 'verified';
    }

    showVerificationScheduleInfo() {
        const verification = this.getCurrentVerificationState();

        if (verification.status === 'scheduled') {
            alert(`Your identity verification is scheduled on ${verification.scheduleDisplay}. Please bring valid government IDs and supporting legal documents.`);
            return;
        }

        alert('Your account cannot access barangay services yet. Please wait for the barangay admin to schedule your identity verification.');
    }

    // Dashboard
    updateDashboard() {
        const totalResidents = document.getElementById('totalResidents');
        if (!totalResidents) return;

        totalResidents.textContent = this.residents.length;
        document.getElementById('pendingRequests').textContent = this.certificates.filter(c => c.status === 'Pending').length;
        document.getElementById('approvedCerts').textContent = this.certificates.filter(c => c.status === 'Approved').length;
        document.getElementById('totalAppointments').textContent = this.appointments.length;
        document.getElementById('totalBlotters').textContent = this.blotters.length;
        this.renderAdminDashboard();
        if (this.currentUserRole === 'user') {
            this.renderUserDashboard();
        }
    }

    updateRoleUI() {
        const label = document.getElementById('adminName');
        const isAdmin = this.currentUserRole === 'admin';

        if (label) {
            label.textContent = isAdmin
                ? `Admin: ${this.currentAdmin}`
                : `Resident: ${this.currentUser?.fullName || this.currentAdmin}`;
        }

        document.querySelectorAll('.admin-only').forEach(element => {
            element.classList.toggle('hidden', !isAdmin);
        });

        document.querySelectorAll('.resident-only').forEach(element => {
            element.classList.toggle('hidden', isAdmin);
        });
    }

    switchAuthView(viewId) {
        const authTabs = document.querySelectorAll('.auth-tab');
        const authPanels = document.querySelectorAll('.auth-panel');
        const lead = document.getElementById('authLead');

        if (!authTabs.length || !authPanels.length || !lead) {
            return;
        }

        authTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.authView === viewId);
        });

        authPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === viewId);
        });

        if (viewId === 'login') lead.textContent = 'Sign in to the barangay portal.';
        if (viewId === 'user-signup') lead.textContent = 'Create a resident account with your personal and contact information.';
        if (this.isAuthPage()) {
            window.history.replaceState({}, '', `auth.html?view=${viewId}`);
        }
    }

    togglePasswordVisibility(toggleButton) {
        const input = document.getElementById(toggleButton.dataset.togglePassword);
        const icon = toggleButton.querySelector('i');
        const isHidden = input.type === 'password';

        input.type = isHidden ? 'text' : 'password';
        icon.classList.toggle('fa-eye', !isHidden);
        icon.classList.toggle('fa-eye-slash', isHidden);
        toggleButton.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    }

    renderAdminDashboard() {
        const certificateFeed = document.getElementById('adminCertificateFeed');
        const appointmentFeed = document.getElementById('adminAppointmentFeed');
        const announcementFeed = document.getElementById('adminAnnouncementFeed');
        const activityFeed = document.getElementById('adminActivityFeed');

        const recentCertificates = [...this.certificates]
            .sort((left, right) => `${right.date}`.localeCompare(`${left.date}`))
            .slice(0, 4);

        certificateFeed.innerHTML = recentCertificates.length
            ? recentCertificates.map(certificate => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-file-signature"></i></div>
                    <div>
                        <h3>${certificate.residentName}</h3>
                        <p>${certificate.type}</p>
                        <small>${certificate.date} - ${certificate.status}</small>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">No certificate requests recorded yet.</div>';

        const upcomingAppointments = [...this.appointments]
            .filter(appointment => appointment.status !== 'Completed' && appointment.status !== 'Cancelled')
            .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))
            .slice(0, 4);

        appointmentFeed.innerHTML = upcomingAppointments.length
            ? upcomingAppointments.map(appointment => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-calendar-day"></i></div>
                    <div>
                        <h3>${appointment.residentName}</h3>
                        <p>${appointment.purpose}</p>
                        <small>${appointment.date} - ${appointment.time} - ${appointment.status}</small>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">No upcoming appointments scheduled.</div>';

        const latestAnnouncements = [...this.announcements]
            .slice(-4)
            .reverse();

        announcementFeed.innerHTML = latestAnnouncements.length
            ? latestAnnouncements.map(announcement => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-bullhorn"></i></div>
                    <div>
                        <h3>${announcement.title}</h3>
                        <p>${announcement.content}</p>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">No announcements posted yet.</div>';

        const recentActivities = [...this.activities]
            .sort((left, right) => `${right.createdAt}`.localeCompare(`${left.createdAt}`))
            .slice(0, 5);

        activityFeed.innerHTML = recentActivities.length
            ? recentActivities.map(activity => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-clock-rotate-left"></i></div>
                    <div>
                        <h3>${activity.title}</h3>
                        <p>${activity.detail}</p>
                        <small>${activity.createdAtDisplay}</small>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">No recent activity yet.</div>';
    }

    renderUserDashboard() {
        const verification = this.getCurrentVerificationState();
        const currentUser = verification.user || this.currentUser;
        const residentName = currentUser?.fullName || '';
        const verificationStatus = verification.status;
        const residentCertificates = this.certificates
            .filter(certificate => certificate.residentName === residentName)
            .sort((left, right) => `${right.date}`.localeCompare(`${left.date}`));
        const residentConcerns = this.blotters
            .filter(blotter => blotter.complainant === residentName)
            .sort((left, right) => `${right.date}`.localeCompare(`${left.date}`));
        const residentAppointments = this.appointments
            .filter(appointment => appointment.residentName === residentName)
            .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`));
        const upcomingAppointments = residentAppointments
            .filter(appointment => appointment.status !== 'Completed' && appointment.status !== 'Cancelled');
        const announcements = [...this.announcements].slice(-4).reverse();
        const reminderMessages = [
            verificationStatus === 'scheduled'
                ? `Attend your verification schedule on ${verification.scheduleDisplay} and bring your legal documents.`
                : 'Wait for the barangay admin to schedule your in-person verification.',
            verificationStatus === 'verified'
                ? 'Bring a valid ID before claiming any approved certificate.'
                : 'Barangay services will unlock after your identity is verified.',
            verificationStatus === 'verified'
                ? 'Keep your contact details updated for barangay notices.'
                : 'Check this dashboard for your assigned verification date and time.'
        ];
        const verificationLabel = verificationStatus === 'verified'
            ? 'Verified'
            : verificationStatus === 'scheduled'
                ? 'Verification Scheduled'
                : 'Pending Verification';

        document.getElementById('userWelcomeHeading').textContent = currentUser?.fullName
            ? `Welcome, ${currentUser.fullName}`
            : 'Welcome';
        document.getElementById('userVerificationStatus').textContent = verificationLabel;
        document.getElementById('userVerificationSchedule').textContent = verificationStatus === 'verified'
            ? 'Barangay identity confirmed'
            : verification.scheduleDisplay;
        document.getElementById('userProfileUsername').textContent = `@${currentUser?.username || 'resident'}`;
        document.getElementById('userCertificateCount').textContent = residentCertificates.length;
        document.getElementById('userUpcomingAppointments').textContent = upcomingAppointments.length;
        document.getElementById('userConcernCount').textContent = residentConcerns.length;
        document.getElementById('userProfileContact').textContent = currentUser?.contact || '-';
        document.getElementById('userProfileFullName').textContent = currentUser?.fullName || '-';
        document.getElementById('userProfileUsernameDetail').textContent = currentUser?.username || '-';
        document.getElementById('userProfileContactDetail').textContent = currentUser?.contact || '-';
        document.getElementById('userProfileAddress').textContent = currentUser?.address || 'Brgy. Biasong, Loon, Bohol';

        const verificationNotice = document.getElementById('userVerificationNotice');
        const verificationNoticeTitle = document.getElementById('userVerificationNoticeTitle');
        const verificationNoticeText = document.getElementById('userVerificationNoticeText');
        verificationNotice.classList.toggle('hidden', verificationStatus === 'verified');
        verificationNoticeTitle.textContent = verificationStatus === 'scheduled'
            ? 'Verification Schedule Ready'
            : 'Account Needs Verification';
        verificationNoticeText.textContent = verificationStatus === 'scheduled'
            ? `Please come to the barangay office on ${verification.scheduleDisplay} and bring your legal documents for identity checking.`
            : 'Your account cannot access barangay services yet. The barangay admin will assign your verification date after reviewing your registration.';

        document.getElementById('userServicePanelLead').textContent = verificationStatus === 'verified'
            ? 'Actions available for your verified account'
            : verificationStatus === 'scheduled'
                ? 'Your admin-scheduled identity check'
                : 'Verification is required before services unlock';
        document.getElementById('userServiceActionGrid').innerHTML = verificationStatus === 'verified'
            ? `
                <button type="button" class="resident-action-card" data-user-action="certificate">
                    <i class="fas fa-file-signature"></i>
                    <strong>Request Document</strong>
                    <span>Submit a barangay certificate or clearance request.</span>
                </button>
                <button type="button" class="resident-action-card" data-user-action="appointment">
                    <i class="fas fa-calendar-check"></i>
                    <strong>Book Appointment</strong>
                    <span>Schedule your visit to the barangay office.</span>
                </button>
                <button type="button" class="resident-action-card" data-user-action="concern">
                    <i class="fas fa-comment-dots"></i>
                    <strong>Report Concern</strong>
                    <span>Send a concern or incident for review.</span>
                </button>
            `
            : `
                <button type="button" class="resident-action-card" data-user-action="verification">
                    <i class="fas fa-id-card"></i>
                    <strong>${verificationStatus === 'scheduled' ? 'Scheduled for Verification' : 'Schedule for Verification'}</strong>
                    <span>${verificationStatus === 'scheduled' ? `Your barangay visit is set for ${verification.scheduleDisplay}.` : 'The barangay admin will assign your verification date and time after reviewing your registration.'}</span>
                </button>
            `;

        document.getElementById('userCertificateFeed').innerHTML = residentCertificates.length
            ? residentCertificates.slice(0, 4).map(certificate => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-file-signature"></i></div>
                    <div>
                        <h3>${certificate.type}</h3>
                        <p>Your certificate request</p>
                        <small>${certificate.date} - ${certificate.status}</small>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">You have no certificate requests yet.</div>';

        document.getElementById('userAppointmentFeed').innerHTML = upcomingAppointments.length
            ? upcomingAppointments.slice(0, 4).map(appointment => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-calendar-day"></i></div>
                    <div>
                        <h3>${appointment.purpose}</h3>
                        <p>Your scheduled barangay visit</p>
                        <small>${appointment.date} at ${appointment.time} - ${appointment.status}</small>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">You have no upcoming appointments yet.</div>';

        document.getElementById('userConcernFeed').innerHTML = residentConcerns.length
            ? residentConcerns.slice(0, 4).map(concern => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-comment-dots"></i></div>
                    <div>
                        <h3>${concern.respondent || 'Concern submitted'}</h3>
                        <p>${concern.description}</p>
                        <small>${concern.date} - ${concern.status}</small>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">You have not reported any concerns yet.</div>';

        document.getElementById('userAnnouncementFeed').innerHTML = announcements.length
            ? announcements.map(announcement => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-bullhorn"></i></div>
                    <div>
                        <h3>${announcement.title}</h3>
                        <p>${announcement.content}</p>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">No announcements available right now.</div>';

        document.getElementById('userReminderFeed').innerHTML = reminderMessages.map(reminder => `
            <article class="feed-card">
                <div class="feed-icon"><i class="fas fa-circle-check"></i></div>
                <div>
                    <h3>Reminder</h3>
                    <p>${reminder}</p>
                </div>
            </article>
        `).join('');
    }
    calculateAge(birthdate) {
        if (!birthdate) return 0;

        const today = new Date();
        const value = new Date(birthdate);
        let age = today.getFullYear() - value.getFullYear();
        const monthDiff = today.getMonth() - value.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < value.getDate())) {
            age -= 1;
        }

        return age;
    }

    logActivity(type, title, detail) {
        const createdAt = new Date();
        this.activities.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            type,
            title,
            detail,
            createdAt: createdAt.toISOString(),
            createdAtDisplay: createdAt.toLocaleString()
        });
        this.saveToStorage('activities', this.activities);
    }

    // Residents CRUD
    renderResidents() {
        const tbody = document.querySelector('#residentsTable tbody');
        tbody.innerHTML = '';
        
        const searchTerm = document.getElementById('residentSearch').value.toLowerCase();
        const filtered = this.residents.filter(r => 
            r.name.toLowerCase().includes(searchTerm) ||
            r.address.toLowerCase().includes(searchTerm)
        );

        if (!filtered.length) {
            this.renderEmptyTableState(
                tbody,
                9,
                searchTerm ? 'No resident records match your search.' : 'No resident records yet.'
            );
            this.populateResidentDropdowns();
            return;
        }

        filtered.forEach(resident => {
            const row = tbody.insertRow();
            const hasAccount = Boolean(resident.userId);
            const verificationStatus = hasAccount ? (resident.verificationStatus || 'pending') : 'no account';
            const scheduleDisplay = hasAccount
                ? this.formatScheduleDisplay(resident.verificationScheduleDate, resident.verificationScheduleTime)
                : 'No portal account';
            row.innerHTML = `
                <td>${resident.name}</td>
                <td>${resident.age}</td>
                <td>${resident.gender}</td>
                <td>${resident.address}</td>
                <td>${resident.contact}</td>
                <td><span class="status-badge status-${resident.status.toLowerCase()}">${resident.status}</span></td>
                <td>${hasAccount ? `<span class="status-badge status-${verificationStatus.toLowerCase()}">${verificationStatus}</span>` : '<span class="status-badge">No Account</span>'}</td>
                <td>${scheduleDisplay}</td>
                <td>
                    <button class="action-btn btn btn-primary" onclick="bms.editResident(${resident.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${hasAccount && verificationStatus !== 'verified' ? `
                        <button class="action-btn btn btn-secondary" onclick="bms.markResidentVerified(${resident.id})" title="Mark as verified">
                            <i class="fas fa-user-check"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn btn btn-danger" onclick="bms.deleteResident(${resident.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        });
        
        this.populateResidentDropdowns();
    }

    populateResidentDropdowns() {
        const selects = document.querySelectorAll('#certificateResident, #appointmentResident');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Select Resident</option>';
            const residents = this.currentUserRole === 'user'
                ? this.residents.filter(r => r.userId === this.currentUser?.id || r.name === this.currentUser?.fullName)
                : this.residents;
            residents.forEach(r => {
                select.innerHTML += `<option value="${r.id}" data-name="${r.name}">${r.name}</option>`;
            });
        });
    }

    openUserCertificateRequest() {
        if (!this.canCurrentUserAccessServices()) {
            this.showVerificationScheduleInfo();
            return;
        }

        this.populateResidentDropdowns();
        document.getElementById('certificateForm').reset();
        document.getElementById('certificateId').value = '';
        document.getElementById('certificateModalTitle').textContent = 'Request Document';
        document.getElementById('certificateDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('certificateStatus').value = 'Pending';
        document.getElementById('certificateStatus').setAttribute('disabled', 'disabled');
        document.getElementById('certificateResident').value = String(this.findCurrentResidentId() || '');
        document.getElementById('certificateModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    openUserAppointmentRequest() {
        if (!this.canCurrentUserAccessServices()) {
            this.showVerificationScheduleInfo();
            return;
        }

        this.populateResidentDropdowns();
        document.getElementById('appointmentForm').reset();
        document.getElementById('appointmentId').value = '';
        document.getElementById('appointmentModalTitle').textContent = 'Book Appointment';
        document.getElementById('appointmentStatus').value = 'Scheduled';
        document.getElementById('appointmentStatus').setAttribute('disabled', 'disabled');
        document.getElementById('appointmentResident').value = String(this.findCurrentResidentId() || '');
        document.getElementById('appointmentModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    openUserConcernReport() {
        if (!this.canCurrentUserAccessServices()) {
            this.showVerificationScheduleInfo();
            return;
        }

        document.getElementById('blotterForm').reset();
        document.getElementById('blotterId').value = '';
        document.getElementById('blotterModalTitle').textContent = 'Report Concern';
        document.getElementById('blotterComplainant').value = this.currentUser?.fullName || '';
        document.getElementById('blotterComplainant').setAttribute('readonly', 'readonly');
        document.getElementById('blotterStatus').value = 'Open';
        document.getElementById('blotterStatus').setAttribute('disabled', 'disabled');
        document.getElementById('blotterModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    findCurrentResidentId() {
        const resident = this.getResidentByUser(this.currentUser);
        return resident ? resident.id : '';
    }

    openResidentModal(resident = null) {
        document.getElementById('residentModal').classList.add('active');
        document.getElementById('residentModalTitle').textContent = resident ? 'Edit Resident' : 'Add Resident';
        
        if (resident) {
            document.getElementById('residentId').value = resident.id;
            document.getElementById('residentName').value = resident.name;
            document.getElementById('residentAge').value = resident.age;
            document.getElementById('residentGender').value = resident.gender;
            document.getElementById('residentBirthdate').value = resident.birthdate;
            document.getElementById('residentCivilStatus').value = resident.civilStatus;
            document.getElementById('residentAddress').value = resident.address;
            document.getElementById('residentContact').value = resident.contact;
            document.getElementById('residentOccupation').value = resident.occupation;
            document.getElementById('residentStatus').value = resident.status;
            document.getElementById('residentVerificationStatus').value = resident.verificationStatus || (resident.userId ? 'pending' : 'verified');
            document.getElementById('residentVerificationDate').value = resident.verificationScheduleDate || '';
            document.getElementById('residentVerificationTime').value = resident.verificationScheduleTime || '';
            document.getElementById('residentVerificationNotes').value = resident.verificationNotes || '';
        } else {
            document.getElementById('residentForm').reset();
            document.getElementById('residentStatus').value = 'Active';
            document.getElementById('residentVerificationStatus').value = 'pending';
        }
    }

    saveResident() {
        const id = document.getElementById('residentId').value || Date.now();
        const existingResident = this.residents.find(r => r.id === parseInt(id));
        const residentName = document.getElementById('residentName').value;
        const matchedUser = this.users.find(user =>
            user.id === existingResident?.userId ||
            user.fullName?.toLowerCase() === residentName.toLowerCase()
        );
        let verificationStatus = document.getElementById('residentVerificationStatus').value;
        const verificationScheduleDate = document.getElementById('residentVerificationDate').value;
        const verificationScheduleTime = document.getElementById('residentVerificationTime').value;
        const verificationNotes = document.getElementById('residentVerificationNotes').value.trim();

        if (verificationStatus === 'scheduled' && !verificationScheduleDate) {
            alert('Please select a verification date before saving a scheduled verification.');
            return;
        }

        if (verificationStatus === 'pending' && verificationScheduleDate) {
            verificationStatus = 'scheduled';
        }

        const resident = {
            id: parseInt(id),
            userId: existingResident?.userId || matchedUser?.id || '',
            name: residentName,
            age: parseInt(document.getElementById('residentAge').value),
            gender: document.getElementById('residentGender').value,
            birthdate: document.getElementById('residentBirthdate').value,
            civilStatus: document.getElementById('residentCivilStatus').value,
            address: document.getElementById('residentAddress').value,
            contact: document.getElementById('residentContact').value,
            occupation: document.getElementById('residentOccupation').value,
            status: document.getElementById('residentStatus').value,
            verificationStatus,
            verificationScheduleDate: verificationStatus === 'pending' ? '' : verificationScheduleDate,
            verificationScheduleTime: verificationStatus === 'pending' ? '' : verificationScheduleTime,
            verificationNotes,
            verifiedAt: verificationStatus === 'verified'
                ? (existingResident?.verifiedAt || new Date().toISOString())
                : ''
        };

        const index = this.residents.findIndex(r => r.id === parseInt(id));
        const isExisting = index > -1;
        if (index > -1) {
            this.residents[index] = resident;
        } else {
            this.residents.push(resident);
        }

        this.saveToStorage('residents', this.residents);
        this.syncResidentToLinkedUser(resident);
        this.logActivity(
            isExisting ? 'resident-update' : 'resident-create',
            resident.name,
            isExisting ? 'Resident record updated.' : 'New resident record added.'
        );
        this.renderResidents();
        this.updateDashboard();
        this.closeAllModals();
    }

    editResident(id) {
        const resident = this.residents.find(r => r.id === id);
        this.openResidentModal(resident);
    }

    markResidentVerified(id) {
        const residentIndex = this.residents.findIndex(r => r.id === id);
        if (residentIndex === -1) return;

        const resident = {
            ...this.residents[residentIndex],
            verificationStatus: 'verified',
            verifiedAt: new Date().toISOString()
        };

        this.residents[residentIndex] = resident;
        this.saveToStorage('residents', this.residents);
        this.syncResidentToLinkedUser(resident);
        this.logActivity('resident-verify', resident.name, 'Resident identity verified after face-to-face document checking.');
        this.renderResidents();
        this.updateDashboard();
    }

    deleteResident(id) {
        if (confirm('Are you sure you want to delete this resident?')) {
            const resident = this.residents.find(r => r.id === id);
            this.residents = this.residents.filter(r => r.id !== id);
            this.saveToStorage('residents', this.residents);
            if (resident) this.logActivity('resident-delete', resident.name, 'Resident record deleted.');
            this.renderResidents();
            this.updateDashboard();
        }
    }

    // Certificates CRUD (similar pattern)
    renderCertificates() {
        const tbody = document.querySelector('#certificatesTable tbody');
        tbody.innerHTML = '';
        
        const searchTerm = document.getElementById('certificateSearch').value.toLowerCase();
        const filtered = this.certificates.filter(c => 
            c.residentName.toLowerCase().includes(searchTerm) ||
            c.type.toLowerCase().includes(searchTerm)
        );

        if (!filtered.length) {
            this.renderEmptyTableState(
                tbody,
                5,
                searchTerm ? 'No certificate records match your search.' : 'No certificate requests yet.'
            );
            return;
        }

        filtered.forEach(cert => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${cert.residentName}</td>
                <td>${cert.type}</td>
                <td>${cert.date}</td>
                <td><span class="status-badge status-${cert.status.toLowerCase()}">${cert.status}</span></td>
                <td>
                    <button class="action-btn btn btn-primary" onclick="bms.editCertificate(${cert.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn btn-danger" onclick="bms.deleteCertificate(${cert.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        });
    }

    saveCertificate() {
        const id = document.getElementById('certificateId').value || Date.now();
        const residentSelect = document.getElementById('certificateResident');
        const residentName = residentSelect.options[residentSelect.selectedIndex].dataset.name;
        
        const certificate = {
            id: parseInt(id),
            residentId: parseInt(residentSelect.value),
            residentName: residentName,
            type: document.getElementById('certificateType').value,
            date: document.getElementById('certificateDate').value,
            status: this.currentUserRole === 'user' ? 'Pending' : document.getElementById('certificateStatus').value
        };

        const index = this.certificates.findIndex(c => c.id === parseInt(id));
        const isExisting = index > -1;
        if (index > -1) {
            this.certificates[index] = certificate;
        } else {
            this.certificates.push(certificate);
        }

        this.saveToStorage('certificates', this.certificates);
        this.logActivity(
            isExisting ? 'certificate-update' : 'certificate-create',
            residentName,
            `${isExisting ? 'Updated' : 'Created'} ${certificate.type} request.`
        );
        this.renderCertificates();
        this.updateDashboard();
        this.closeAllModals();
    }

    editCertificate(id) {
        const cert = this.certificates.find(c => c.id === id);
        document.getElementById('certificateId').value = cert.id;
        document.getElementById('certificateResident').value = cert.residentId;
        document.getElementById('certificateType').value = cert.type;
        document.getElementById('certificateDate').value = cert.date;
        document.getElementById('certificateStatus').value = cert.status;
        document.getElementById('certificateModal').classList.add('active');
    }

    deleteCertificate(id) {
        if (confirm('Delete this certificate request?')) {
            const certificate = this.certificates.find(c => c.id === id);
            this.certificates = this.certificates.filter(c => c.id !== id);
            this.saveToStorage('certificates', this.certificates);
            if (certificate) this.logActivity('certificate-delete', certificate.residentName, `${certificate.type} request deleted.`);
            this.renderCertificates();
            this.updateDashboard();
        }
    }

    // Blotter CRUD
    renderBlotters() {
        const tbody = document.querySelector('#blotterTable tbody');
        tbody.innerHTML = '';
        
        const searchTerm = document.getElementById('blotterSearch').value.toLowerCase();
        const filtered = this.blotters.filter(b => 
            b.complainant.toLowerCase().includes(searchTerm) ||
            b.respondent.toLowerCase().includes(searchTerm)
        );

        if (!filtered.length) {
            this.renderEmptyTableState(
                tbody,
                5,
                searchTerm ? 'No blotter records match your search.' : 'No blotter records yet.'
            );
            return;
        }

        filtered.forEach(blotter => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${blotter.complainant}</td>
                <td>${blotter.respondent}</td>
                <td>${blotter.date}</td>
                <td><span class="status-badge status-${blotter.status.toLowerCase()}">${blotter.status}</span></td>
                <td>
                    <button class="action-btn btn btn-primary" onclick="bms.editBlotter(${blotter.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn btn-danger" onclick="bms.deleteBlotter(${blotter.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        });
    }

    saveBlotter() {
        const id = document.getElementById('blotterId').value || Date.now();
        const blotter = {
            id: parseInt(id),
            complainant: this.currentUserRole === 'user'
                ? (this.currentUser?.fullName || document.getElementById('blotterComplainant').value)
                : document.getElementById('blotterComplainant').value,
            respondent: document.getElementById('blotterRespondent').value,
            date: document.getElementById('blotterDate').value,
            description: document.getElementById('blotterDescription').value,
            status: this.currentUserRole === 'user' ? 'Open' : document.getElementById('blotterStatus').value
        };

        const index = this.blotters.findIndex(b => b.id === parseInt(id));
        const isExisting = index > -1;
        if (index > -1) {
            this.blotters[index] = blotter;
        } else {
            this.blotters.push(blotter);
        }

        this.saveToStorage('blotters', this.blotters);
        this.logActivity(
            isExisting ? 'blotter-update' : 'blotter-create',
            blotter.complainant,
            `${isExisting ? 'Updated' : 'Created'} blotter record against ${blotter.respondent}.`
        );
        this.renderBlotters();
        this.updateDashboard();
        this.closeAllModals();
    }

    editBlotter(id) {
        const blotter = this.blotters.find(b => b.id === id);
        document.getElementById('blotterId').value = blotter.id;
        document.getElementById('blotterComplainant').value = blotter.complainant;
        document.getElementById('blotterRespondent').value = blotter.respondent;
        document.getElementById('blotterDate').value = blotter.date;
        document.getElementById('blotterDescription').value = blotter.description;
        document.getElementById('blotterStatus').value = blotter.status;
        document.getElementById('blotterModal').classList.add('active');
    }

    deleteBlotter(id) {
        if (confirm('Delete this blotter record?')) {
            const blotter = this.blotters.find(b => b.id === id);
            this.blotters = this.blotters.filter(b => b.id !== id);
            this.saveToStorage('blotters', this.blotters);
            if (blotter) this.logActivity('blotter-delete', blotter.complainant, `Blotter record against ${blotter.respondent} deleted.`);
            this.renderBlotters();
            this.updateDashboard();
        }
    }

    // Appointments CRUD
    renderAppointments() {
        const tbody = document.querySelector('#appointmentsTable tbody');
        tbody.innerHTML = '';
        
        const searchTerm = document.getElementById('appointmentSearch').value.toLowerCase();
        const filtered = this.appointments.filter(a => 
            a.residentName.toLowerCase().includes(searchTerm) ||
            a.purpose.toLowerCase().includes(searchTerm)
        );

        if (!filtered.length) {
            this.renderEmptyTableState(
                tbody,
                6,
                searchTerm ? 'No appointment records match your search.' : 'No appointments yet.'
            );
            return;
        }

        filtered.forEach(appointment => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${appointment.residentName}</td>
                <td>${appointment.date}</td>
                <td>${appointment.time}</td>
                <td>${appointment.purpose}</td>
                <td><span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span></td>
                <td>
                    <button class="action-btn btn btn-primary" onclick="bms.editAppointment(${appointment.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn btn-danger" onclick="bms.deleteAppointment(${appointment.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        });
    }

    saveAppointment() {
        const id = document.getElementById('appointmentId').value || Date.now();
        const residentSelect = document.getElementById('appointmentResident');
        const residentName = residentSelect.options[residentSelect.selectedIndex].dataset.name;
        
        const appointment = {
            id: parseInt(id),
            residentId: parseInt(residentSelect.value),
            residentName: residentName,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value,
            purpose: document.getElementById('appointmentPurpose').value,
            status: this.currentUserRole === 'user' ? 'Scheduled' : document.getElementById('appointmentStatus').value
        };

        const index = this.appointments.findIndex(a => a.id === parseInt(id));
        const isExisting = index > -1;
        if (index > -1) {
            this.appointments[index] = appointment;
        } else {
            this.appointments.push(appointment);
        }

        this.saveToStorage('appointments', this.appointments);
        this.logActivity(
            isExisting ? 'appointment-update' : 'appointment-create',
            residentName,
            `${isExisting ? 'Updated' : 'Created'} appointment for ${appointment.date} at ${appointment.time}.`
        );
        this.renderAppointments();
        this.updateDashboard();
        this.closeAllModals();
    }

    editAppointment(id) {
        const appointment = this.appointments.find(a => a.id === id);
        document.getElementById('appointmentId').value = appointment.id;
        document.getElementById('appointmentResident').value = appointment.residentId;
        document.getElementById('appointmentDate').value = appointment.date;
        document.getElementById('appointmentTime').value = appointment.time;
        document.getElementById('appointmentPurpose').value = appointment.purpose;
        document.getElementById('appointmentStatus').value = appointment.status;
        document.getElementById('appointmentModal').classList.add('active');
    }

    deleteAppointment(id) {
        if (confirm('Delete this appointment?')) {
            const appointment = this.appointments.find(a => a.id === id);
            this.appointments = this.appointments.filter(a => a.id !== id);
            this.saveToStorage('appointments', this.appointments);
            if (appointment) this.logActivity('appointment-delete', appointment.residentName, `Appointment on ${appointment.date} at ${appointment.time} deleted.`);
            this.renderAppointments();
            this.updateDashboard();
        }
    }

    // Announcements
    renderAnnouncements() {
        const container = document.querySelector('.announcements-grid');
        container.innerHTML = '';

        if (!this.announcements.length) {
            container.innerHTML = '<div class="empty-feed">No announcements yet.</div>';
            return;
        }

        this.announcements.forEach(announcement => {
            const card = document.createElement('div');
            card.className = 'announcement-card';
            card.innerHTML = `
                <h3>${announcement.title}</h3>
                <p>${announcement.content}</p>
                <div style="margin-top: 1rem;">
                    <button class="action-btn btn btn-primary" onclick="bms.editAnnouncement(${announcement.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn btn btn-danger" onclick="bms.deleteAnnouncement(${announcement.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    saveAnnouncement() {
        const id = document.getElementById('announcementId').value || Date.now();
        const announcement = {
            id: parseInt(id),
            title: document.getElementById('announcementTitle').value,
            content: document.getElementById('announcementContent').value
        };

        const index = this.announcements.findIndex(a => a.id === parseInt(id));
        const isExisting = index > -1;
        if (index > -1) {
            this.announcements[index] = announcement;
        } else {
            this.announcements.push(announcement);
        }

        this.saveToStorage('announcements', this.announcements);
        this.logActivity(
            isExisting ? 'announcement-update' : 'announcement-create',
            announcement.title,
            isExisting ? 'Announcement updated.' : 'New announcement posted.'
        );
        this.renderAnnouncements();
        this.renderPublicAnnouncements();
        this.updateDashboard();
        this.closeAllModals();
    }

    editAnnouncement(id) {
        const announcement = this.announcements.find(a => a.id === id);
        document.getElementById('announcementId').value = announcement.id;
        document.getElementById('announcementTitle').value = announcement.title;
        document.getElementById('announcementContent').value = announcement.content;
        document.getElementById('announcementModal').classList.add('active');
    }

    deleteAnnouncement(id) {
        if (confirm('Delete this announcement?')) {
            const announcement = this.announcements.find(a => a.id === id);
            this.announcements = this.announcements.filter(a => a.id !== id);
            this.saveToStorage('announcements', this.announcements);
            if (announcement) this.logActivity('announcement-delete', announcement.title, 'Announcement deleted.');
            this.renderAnnouncements();
            this.renderPublicAnnouncements();
            this.updateDashboard();
        }
    }

    // Reports
    renderReports() {
        this.renderReport('residents');
        this.renderReport('certificates');
        this.renderReport('blotter');
        this.renderReport('appointments');
    }

    renderReport(type) {
        const tableId = `${type}ReportTable`;
        const tbody = document.querySelector(`#${tableId} tbody`);
        tbody.innerHTML = '';

        let data = [];
        switch(type) {
            case 'residents': data = this.residents; break;
            case 'certificates': data = this.certificates; break;
            case 'blotter': data = this.blotters; break;
            case 'appointments': data = this.appointments; break;
        }

        const fieldsByType = {
            residents: ['name', 'age', 'gender', 'address', 'contact', 'status'],
            certificates: ['residentName', 'type', 'date', 'status'],
            blotter: ['complainant', 'respondent', 'date', 'status'],
            appointments: ['residentName', 'date', 'time', 'purpose', 'status']
        };

        if (!data.length) {
            this.renderEmptyTableState(
                tbody,
                (fieldsByType[type] || []).length,
                `No ${type} records yet.`
            );
            return;
        }

        data.forEach(item => {
            const row = tbody.insertRow();
            (fieldsByType[type] || []).forEach(field => {
                const cell = row.insertCell();
                cell.textContent = item[field] ?? '';
            });
        });
    }

    showReportTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    }

    // Modal Management
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
        document.body.style.overflow = '';
        // Reset forms
        document.querySelectorAll('form').forEach(form => form.reset());
        document.getElementById('certificateStatus').removeAttribute('disabled');
        document.getElementById('appointmentStatus').removeAttribute('disabled');
        document.getElementById('blotterStatus').removeAttribute('disabled');
        document.getElementById('blotterComplainant').removeAttribute('readonly');
        document.getElementById('certificateModalTitle').textContent = 'New Certificate Request';
        document.getElementById('appointmentModalTitle').textContent = 'New Appointment';
        document.getElementById('blotterModalTitle').textContent = 'New Blotter Record';
    }

    renderEmptyTableState(tbody, colSpan, message) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = colSpan;
        cell.className = 'empty-table-cell';
        cell.textContent = message;
    }

    // Search Events
    bindSearchEvents() {
        ['residentSearch', 'certificateSearch', 'blotterSearch', 'appointmentSearch'].forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;

            input.addEventListener('input', () => {
                const page = id.split('Search')[0].toLowerCase();
                if (this[page + 's']) {
                    this['render' + page.charAt(0).toUpperCase() + page.slice(1) + 's']();
                }
            });
        });
    }

    // Initial render
    renderAllPages() {
        this.renderPublicAnnouncements();
        if (!this.isAppPage() || !document.getElementById('app')) {
            return;
        }

        this.renderAdminDashboard();
        if (this.currentUserRole === 'user') {
            this.renderUserDashboard();
        }
        this.renderResidents();
        this.renderCertificates();
        this.renderBlotters();
        this.renderAppointments();
        this.renderAnnouncements();
        this.renderReports();
    }
}

// Initialize app
const bms = new BarangayManager();

// Global functions for onclick handlers
window.bms = bms;








