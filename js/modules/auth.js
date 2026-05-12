BarangayManager.prototype.handleLogin = async function() {
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
            await this.loadAllData();
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


BarangayManager.prototype.handleUserSignup = async function() {
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

        const savedUser = await this.persistRecord('users', newUser);
        if (!savedUser) return;
        this.users.push(savedUser);
        if (existingResidentIndex > -1) {
            const existingResident = this.residents[existingResidentIndex];
            const residentRecord = {
                ...existingResident,
                userId: savedUser.id,
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
            const savedResident = await this.persistRecord('residents', residentRecord);
            if (!savedResident) return;
            this.residents[existingResidentIndex] = savedResident;
        } else {
            const residentRecord = {
                id: savedUser.id,
                userId: savedUser.id,
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
            };
            const savedResident = await this.persistRecord('residents', residentRecord);
            if (!savedResident) return;
            this.residents.push(savedResident);
        }
        this.saveToStorage('users', this.users);
        this.saveToStorage('residents', this.residents);
        await this.logActivity('signup', fullName, `New resident account created with username ${username}.`);
        this.updateDashboard();
        document.getElementById('signupForm').reset();
        successEl.textContent = 'Account created. You can now log in.';
        this.switchAuthView('login');
        document.getElementById('username').value = username;
    }


BarangayManager.prototype.logout = function() {
        localStorage.removeItem('bms_admin_logged_in');
        localStorage.removeItem('bms_admin_name');
        localStorage.removeItem('bms_session_role');
        localStorage.removeItem('bms_session_user');
        this.isLoggedIn = false;
        this.currentUserRole = '';
        this.currentUser = null;
        this.showLogin();
    }


