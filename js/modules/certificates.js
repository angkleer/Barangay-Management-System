BarangayManager.prototype.renderCertificates = function() {
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


BarangayManager.prototype.saveCertificate = async function() {
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
        const savedCertificate = await this.persistRecord('certificates', certificate);
        if (!savedCertificate) return;
        if (index > -1) {
            this.certificates[index] = savedCertificate;
        } else {
            this.certificates.push(savedCertificate);
        }

        this.saveToStorage('certificates', this.certificates);
        await this.logActivity(
            isExisting ? 'certificate-update' : 'certificate-create',
            residentName,
            `${isExisting ? 'Updated' : 'Created'} ${savedCertificate.type} request.`
        );
        this.refreshViewsAfterDataChange('certificates');
        this.closeAllModals();
    }


BarangayManager.prototype.editCertificate = function(id) {
        const cert = this.certificates.find(c => c.id === id);
        document.getElementById('certificateId').value = cert.id;
        document.getElementById('certificateResident').value = cert.residentId;
        document.getElementById('certificateType').value = cert.type;
        document.getElementById('certificateDate').value = cert.date;
        document.getElementById('certificateStatus').value = cert.status;
        document.getElementById('certificateModal').classList.add('active');
    }


BarangayManager.prototype.deleteCertificate = async function(id) {
        if (confirm('Delete this certificate request?')) {
            const certificate = this.certificates.find(c => c.id === id);
            const removed = await this.removeRecord('certificates', id);
            if (!removed) return;
            this.deleteCollectionItem('certificates', id);
            if (certificate) await this.logActivity('certificate-delete', certificate.residentName, `${certificate.type} request deleted.`);
            this.refreshViewsAfterDataChange('certificates');
        }
    }

    // Blotter CRUD

