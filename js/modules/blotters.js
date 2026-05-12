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


BarangayManager.prototype.saveBlotter = async function() {
        const rawId = document.getElementById('blotterId').value;
        const id = rawId ? parseInt(rawId, 10) : null;
        const blotter = {
            complainant: this.currentUserRole === 'user'
                ? (this.currentUser?.fullName || document.getElementById('blotterComplainant').value)
                : document.getElementById('blotterComplainant').value,
            respondent: document.getElementById('blotterRespondent').value,
            date: document.getElementById('blotterDate').value,
            description: document.getElementById('blotterDescription').value,
            status: this.currentUserRole === 'user' ? 'Open' : document.getElementById('blotterStatus').value
        };
        if (id) blotter.id = id;

        const index = id ? this.blotters.findIndex(b => b.id === id) : -1;
        const isExisting = index > -1;
        const savedBlotter = await this.persistRecord('blotters', blotter);
        if (!savedBlotter) return;
        if (index > -1) {
            this.blotters[index] = savedBlotter;
        } else {
            this.blotters.push(savedBlotter);
        }

        this.saveToStorage('blotters', this.blotters);
        await this.logActivity(
            isExisting ? 'blotter-update' : 'blotter-create',
            savedBlotter.complainant,
            `${isExisting ? 'Updated' : 'Created'} blotter record against ${savedBlotter.respondent}.`
        );
        this.refreshViewsAfterDataChange('blotters');
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


BarangayManager.prototype.deleteBlotter = async function(id) {
        if (confirm('Delete this blotter record?')) {
            const blotter = this.blotters.find(b => b.id === id);
            const removed = await this.removeRecord('blotters', id);
            if (!removed) return;
            this.deleteCollectionItem('blotters', id);
            if (blotter) await this.logActivity('blotter-delete', blotter.complainant, `Blotter record against ${blotter.respondent} deleted.`);
            this.refreshViewsAfterDataChange('blotters');
        }
    }

    // Appointments CRUD

