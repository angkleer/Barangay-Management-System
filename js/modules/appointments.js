BarangayManager.prototype.renderAppointments = function() {
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


BarangayManager.prototype.saveAppointment = async function() {
        const rawId = document.getElementById('appointmentId').value;
        const id = rawId ? parseInt(rawId, 10) : null;
        const residentSelect = document.getElementById('appointmentResident');
        const residentName = residentSelect.options[residentSelect.selectedIndex].dataset.name;
        
        const appointment = {
            residentId: parseInt(residentSelect.value),
            residentName: residentName,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value,
            purpose: document.getElementById('appointmentPurpose').value,
            status: this.currentUserRole === 'user' ? 'Scheduled' : document.getElementById('appointmentStatus').value
        };
        if (id) appointment.id = id;

        const index = id ? this.appointments.findIndex(a => a.id === id) : -1;
        const isExisting = index > -1;
        const savedAppointment = await this.persistRecord('appointments', appointment);
        if (!savedAppointment) return;
        if (index > -1) {
            this.appointments[index] = savedAppointment;
        } else {
            this.appointments.push(savedAppointment);
        }

        this.saveToStorage('appointments', this.appointments);
        await this.logActivity(
            isExisting ? 'appointment-update' : 'appointment-create',
            residentName,
            `${isExisting ? 'Updated' : 'Created'} appointment for ${savedAppointment.date} at ${savedAppointment.time}.`
        );
        this.refreshViewsAfterDataChange('appointments');
        this.closeAllModals();
    }


BarangayManager.prototype.editAppointment = function(id) {
        const appointment = this.appointments.find(a => a.id === id);
        document.getElementById('appointmentId').value = appointment.id;
        document.getElementById('appointmentResident').value = appointment.residentId;
        document.getElementById('appointmentDate').value = appointment.date;
        document.getElementById('appointmentTime').value = appointment.time;
        document.getElementById('appointmentPurpose').value = appointment.purpose;
        document.getElementById('appointmentStatus').value = appointment.status;
        document.getElementById('appointmentModal').classList.add('active');
    }


BarangayManager.prototype.deleteAppointment = async function(id) {
        if (confirm('Delete this appointment?')) {
            const appointment = this.appointments.find(a => a.id === id);
            const removed = await this.removeRecord('appointments', id);
            if (!removed) return;
            this.deleteCollectionItem('appointments', id);
            if (appointment) await this.logActivity('appointment-delete', appointment.residentName, `Appointment on ${appointment.date} at ${appointment.time} deleted.`);
            this.refreshViewsAfterDataChange('appointments');
        }
    }

    // Announcements

