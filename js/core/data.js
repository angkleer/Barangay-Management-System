BarangayManager.prototype.saveToStorage = function(key, data) {
        localStorage.setItem(`bms_${key}`, JSON.stringify(data));
    }


BarangayManager.prototype.loadFromStorage = function(key) {
        const data = localStorage.getItem(`bms_${key}`);
        return data ? JSON.parse(data) : [];
    }


BarangayManager.prototype.getSupabaseClient = function() {
        return window.supabaseClient || null;
    }


BarangayManager.prototype.getDataKeys = function() {
        return ['users', 'residents', 'certificates', 'blotters', 'appointments', 'announcements', 'activities'];
    }


BarangayManager.prototype.getTableNameForKey = function(key) {
        const map = window.BMS_SUPABASE_TABLES || {};
        return map[key] || window[`BMS_SUPABASE_${key.toUpperCase()}_TABLE`] || key;
    }


BarangayManager.prototype.normalizeRecord = function(record) {
        if (!record || typeof record !== 'object') return record;

        if (record.id !== undefined && record.id !== null && record.id !== '') {
            const numericId = Number(record.id);
            if (!Number.isNaN(numericId)) {
                record.id = numericId;
            }
        }

        return record;
    }


BarangayManager.prototype.reportDataError = function(action, error) {
        console.error(`Supabase failed to ${action}:`, error);
        alert(`Supabase could not ${action}: ${error.message}`);
    }


BarangayManager.prototype.loadCollection = async function(key) {
        const fallback = this.loadFromStorage(key);
        const client = this.getSupabaseClient();

        if (!client) {
            this[key] = fallback;
            return fallback;
        }

        const { data, error } = await client
            .from(this.getTableNameForKey(key))
            .select('*');

        if (error) {
            console.error(`Failed to load ${key} from Supabase:`, error);
            this[key] = fallback;
            return fallback;
        }

        const records = (data || []).map(record => this.normalizeRecord(record));
        this[key] = records;
        this.saveToStorage(key, records);
        return records;
    }


BarangayManager.prototype.loadAllData = async function() {
        await Promise.all(this.getDataKeys().map(key => this.loadCollection(key)));
    }


BarangayManager.prototype.persistRecord = async function(key, record) {
        const normalizedRecord = this.normalizeRecord({ ...record });
        const client = this.getSupabaseClient();

        if (client) {
            try {
                const { data, error } = await client
                    .from(this.getTableNameForKey(key))
                    .upsert(normalizedRecord)
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                return this.normalizeRecord(data);
            } catch (error) {
                this.reportDataError(`save ${key}`, error);
                return null;
            }
        }

        return normalizedRecord;
    }


BarangayManager.prototype.removeRecord = async function(key, id) {
        const client = this.getSupabaseClient();

        if (!client) return true;

        try {
            const { error } = await client
                .from(this.getTableNameForKey(key))
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            this.reportDataError(`delete ${key}`, error);
            return false;
        }
    }


BarangayManager.prototype.replaceCollectionItem = function(key, record) {
        const index = this[key].findIndex(item => Number(item.id) === Number(record.id));
        if (index > -1) {
            this[key][index] = record;
        } else {
            this[key].push(record);
        }

        this.saveToStorage(key, this[key]);
    }


BarangayManager.prototype.deleteCollectionItem = function(key, id) {
        this[key] = this[key].filter(item => Number(item.id) !== Number(id));
        this.saveToStorage(key, this[key]);
    }


BarangayManager.prototype.refreshViewsAfterDataChange = function(key) {
        if (key === 'announcements') {
            this.renderPublicAnnouncements();
        }

        if (!this.isAppPage() || !document.getElementById('app')) {
            return;
        }

        const viewMap = {
            residents: 'renderResidents',
            certificates: 'renderCertificates',
            blotters: 'renderBlotters',
            appointments: 'renderAppointments',
            announcements: 'renderAnnouncements'
        };

        const viewMethod = viewMap[key];
        if (viewMethod && typeof this[viewMethod] === 'function') {
            this[viewMethod]();
        }

        if (key === 'residents') {
            this.populateResidentDropdowns();
        }

        this.updateDashboard();
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


BarangayManager.prototype.refreshAnnouncementViews = function() {
        this.saveToStorage('announcements', this.announcements);
        this.renderPublicAnnouncements();

        if (this.isAppPage()) {
            this.renderAnnouncements();
            this.updateDashboard();
        }
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


BarangayManager.prototype.syncResidentToLinkedUser = async function(resident) {
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

        const savedUser = await this.persistRecord('users', updatedUser);
        if (!savedUser) return;
        this.users[userIndex] = savedUser;
        this.saveToStorage('users', this.users);
        this.syncCurrentUserSession(savedUser);
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


BarangayManager.prototype.logActivity = async function(type, title, detail) {
        const createdAt = new Date();
        const activity = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            type,
            title,
            detail,
            createdAt: createdAt.toISOString(),
            createdAtDisplay: createdAt.toLocaleString()
        };
        const savedActivity = await this.persistRecord('activities', activity);
        if (savedActivity) {
            this.replaceCollectionItem('activities', savedActivity);
        } else {
            this.activities.push(activity);
            this.saveToStorage('activities', this.activities);
        }
        this.refreshViewsAfterDataChange('activities');
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

