BarangayManager.prototype.renderBlotters = function() {
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


BarangayManager.prototype.saveBlotter = function() {
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


BarangayManager.prototype.editBlotter = function(id) {
        const blotter = this.blotters.find(b => b.id === id);
        document.getElementById('blotterId').value = blotter.id;
        document.getElementById('blotterComplainant').value = blotter.complainant;
        document.getElementById('blotterRespondent').value = blotter.respondent;
        document.getElementById('blotterDate').value = blotter.date;
        document.getElementById('blotterDescription').value = blotter.description;
        document.getElementById('blotterStatus').value = blotter.status;
        document.getElementById('blotterModal').classList.add('active');
    }


BarangayManager.prototype.deleteBlotter = function(id) {
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

