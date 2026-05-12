BarangayManager.prototype.saveToStorage = function(key, data) {
        localStorage.setItem(`bms_${key}`, JSON.stringify(data));
    }


BarangayManager.prototype.loadFromStorage = function(key) {
        const data = localStorage.getItem(`bms_${key}`);
        return data ? JSON.parse(data) : [];
    }


BarangayManager.prototype.loadAllData = function() {
        this.users = this.loadFromStorage('users');
        this.residents = this.loadFromStorage('residents');
        this.certificates = this.loadFromStorage('certificates');
        this.blotters = this.loadFromStorage('blotters');
        this.appointments = this.loadFromStorage('appointments');
        this.announcements = this.loadFromStorage('announcements');
        this.activities = this.loadFromStorage('activities');
    }


BarangayManager.prototype.removeLegacySampleData = function() {
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


BarangayManager.prototype.renderPublicAnnouncements = function() {
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


BarangayManager.prototype.getUserByIdentity = function(userLike = null) {
        if (!userLike) return null;

        return this.users.find(user =>
            user.id === userLike.id ||
            user.username === userLike.username ||
            user.fullName === userLike.fullName
        ) || userLike;
    }


BarangayManager.prototype.getResidentByUser = function(userLike = null) {
        const user = this.getUserByIdentity(userLike);
        if (!user) return null;

        return this.residents.find(resident =>
            resident.userId === user.id ||
            resident.id === user.id ||
            resident.name === user.fullName
        ) || null;
    }


BarangayManager.prototype.normalizeVerificationRecords = function() {
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


BarangayManager.prototype.syncCurrentUserSession = function(user) {
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


BarangayManager.prototype.syncResidentToLinkedUser = function(resident) {
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


BarangayManager.prototype.formatScheduleDisplay = function(date, time) {
        if (!date) return 'Not yet scheduled';

        const parsedDate = new Date(`${date}T00:00:00`);
        const dateLabel = Number.isNaN(parsedDate.getTime())
            ? date
            : parsedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

        return time ? `${dateLabel} at ${time}` : dateLabel;
    }


BarangayManager.prototype.getCurrentVerificationState = function() {
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


BarangayManager.prototype.canCurrentUserAccessServices = function() {
        return this.getCurrentVerificationState().status === 'verified';
    }


BarangayManager.prototype.showVerificationScheduleInfo = function() {
        const verification = this.getCurrentVerificationState();

        if (verification.status === 'scheduled') {
            alert(`Your identity verification is scheduled on ${verification.scheduleDisplay}. Please bring valid government IDs and supporting legal documents.`);
            return;
        }

        alert('Your account cannot access barangay services yet. Please wait for the barangay admin to schedule your identity verification.');
    }

    // Dashboard

BarangayManager.prototype.calculateAge = function(birthdate) {
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


BarangayManager.prototype.logActivity = function(type, title, detail) {
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

BarangayManager.prototype.renderEmptyTableState = function(tbody, colSpan, message) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = colSpan;
        cell.className = 'empty-table-cell';
        cell.textContent = message;
    }

    // Search Events

BarangayManager.prototype.bindSearchEvents = function() {
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

BarangayManager.prototype.renderAllPages = function() {
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

