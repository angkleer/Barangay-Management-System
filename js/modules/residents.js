BarangayManager.prototype.renderResidents = function() {
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


BarangayManager.prototype.populateResidentDropdowns = function() {
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


BarangayManager.prototype.openUserCertificateRequest = function() {
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


BarangayManager.prototype.openUserAppointmentRequest = function() {
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


BarangayManager.prototype.openUserConcernReport = function() {
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


BarangayManager.prototype.findCurrentResidentId = function() {
        const resident = this.getResidentByUser(this.currentUser);
        return resident ? resident.id : '';
    }


BarangayManager.prototype.openResidentModal = function(resident = null) {
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


BarangayManager.prototype.saveResident = async function() {
        const rawId = document.getElementById('residentId').value;
        const id = rawId ? parseInt(rawId, 10) : null;
        const existingResident = id ? this.residents.find(r => r.id === id) : null;
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

        if (verificationStatus === 'scheduled' && !verificationScheduleTime) {
            alert('Please select a verification time before saving a scheduled verification.');
            return;
        }

        if (verificationStatus === 'pending' && verificationScheduleDate) {
            verificationStatus = 'scheduled';
        }

        const resident = {
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
        if (id) resident.id = id;

        const index = id ? this.residents.findIndex(r => r.id === id) : -1;
        const isExisting = index > -1;
        const savedResident = await this.persistRecord('residents', resident);
        if (!savedResident) return;
        if (index > -1) {
            this.residents[index] = savedResident;
        } else {
            this.residents.push(savedResident);
        }

        this.saveToStorage('residents', this.residents);
        await this.syncResidentToLinkedUser(savedResident);
        await this.logActivity(
            isExisting ? 'resident-update' : 'resident-create',
            savedResident.name,
            isExisting ? 'Resident record updated.' : 'New resident record added.'
        );
        this.refreshViewsAfterDataChange('residents');
        this.closeAllModals();
    }


BarangayManager.prototype.editResident = function(id) {
        const resident = this.residents.find(r => r.id === id);
        this.openResidentModal(resident);
    }


BarangayManager.prototype.markResidentVerified = async function(id) {
        const residentIndex = this.residents.findIndex(r => r.id === id);
        if (residentIndex === -1) return;

        const resident = {
            ...this.residents[residentIndex],
            verificationStatus: 'verified',
            verifiedAt: new Date().toISOString()
        };

        const savedResident = await this.persistRecord('residents', resident);
        if (!savedResident) return;
        this.residents[residentIndex] = savedResident;
        this.saveToStorage('residents', this.residents);
        await this.syncResidentToLinkedUser(savedResident);
        await this.logActivity('resident-verify', savedResident.name, 'Resident identity verified after face-to-face document checking.');
        this.refreshViewsAfterDataChange('residents');
    }


BarangayManager.prototype.deleteResident = async function(id) {
        if (confirm('Are you sure you want to delete this resident?')) {
            const resident = this.residents.find(r => r.id === id);
            const removed = await this.removeRecord('residents', id);
            if (!removed) return;
            this.deleteCollectionItem('residents', id);
            if (resident) await this.logActivity('resident-delete', resident.name, 'Resident record deleted.');
            this.refreshViewsAfterDataChange('residents');
        }
    }

    // Certificates CRUD (similar pattern)

