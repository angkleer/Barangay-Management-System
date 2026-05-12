BarangayManager.prototype.updateDashboard = function() {
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


BarangayManager.prototype.updateRoleUI = function() {
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


BarangayManager.prototype.switchAuthView = function(viewId) {
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


BarangayManager.prototype.togglePasswordVisibility = function(toggleButton) {
        const input = document.getElementById(toggleButton.dataset.togglePassword);
        const icon = toggleButton.querySelector('i');
        const isHidden = input.type === 'password';

        input.type = isHidden ? 'text' : 'password';
        icon.classList.toggle('fa-eye', !isHidden);
        icon.classList.toggle('fa-eye-slash', isHidden);
        toggleButton.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    }


BarangayManager.prototype.openModal = function(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }


BarangayManager.prototype.closeAllModals = function() {
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


