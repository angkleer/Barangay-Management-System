BarangayManager.prototype.renderReports = function() {
        this.renderReport('residents');
        this.renderReport('certificates');
        this.renderReport('blotter');
        this.renderReport('appointments');
    }


BarangayManager.prototype.renderReport = function(type) {
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


BarangayManager.prototype.showReportTab = function(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    }

    // Modal Management

