BarangayManager.prototype.renderAnnouncements = function() {
        const container = document.querySelector('.announcements-grid');
        container.innerHTML = '';

        if (!this.announcements.length) {
            container.innerHTML = '<div class="empty-feed">No announcements yet.</div>';
            return;
        }

        this.announcements.forEach(announcement => {
            const card = document.createElement('div');
            card.className = 'announcement-card';
            card.innerHTML = `
                <h3>${announcement.title}</h3>
                <p>${announcement.content}</p>
                <div style="margin-top: 1rem;">
                    <button class="action-btn btn btn-primary" onclick="bms.editAnnouncement(${announcement.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn btn btn-danger" onclick="bms.deleteAnnouncement(${announcement.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }


BarangayManager.prototype.saveAnnouncement = function() {
        const id = document.getElementById('announcementId').value || Date.now();
        const announcement = {
            id: parseInt(id),
            title: document.getElementById('announcementTitle').value,
            content: document.getElementById('announcementContent').value
        };

        const index = this.announcements.findIndex(a => a.id === parseInt(id));
        const isExisting = index > -1;
        if (index > -1) {
            this.announcements[index] = announcement;
        } else {
            this.announcements.push(announcement);
        }

        this.saveToStorage('announcements', this.announcements);
        this.logActivity(
            isExisting ? 'announcement-update' : 'announcement-create',
            announcement.title,
            isExisting ? 'Announcement updated.' : 'New announcement posted.'
        );
        this.renderAnnouncements();
        this.renderPublicAnnouncements();
        this.updateDashboard();
        this.closeAllModals();
    }


BarangayManager.prototype.editAnnouncement = function(id) {
        const announcement = this.announcements.find(a => a.id === id);
        document.getElementById('announcementId').value = announcement.id;
        document.getElementById('announcementTitle').value = announcement.title;
        document.getElementById('announcementContent').value = announcement.content;
        document.getElementById('announcementModal').classList.add('active');
    }


BarangayManager.prototype.deleteAnnouncement = function(id) {
        if (confirm('Delete this announcement?')) {
            const announcement = this.announcements.find(a => a.id === id);
            this.announcements = this.announcements.filter(a => a.id !== id);
            this.saveToStorage('announcements', this.announcements);
            if (announcement) this.logActivity('announcement-delete', announcement.title, 'Announcement deleted.');
            this.renderAnnouncements();
            this.renderPublicAnnouncements();
            this.updateDashboard();
        }
    }

    // Reports

