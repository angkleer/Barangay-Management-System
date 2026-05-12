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


BarangayManager.prototype.saveAnnouncement = async function() {
        const rawId = document.getElementById('announcementId').value;
        const id = rawId ? parseInt(rawId, 10) : null;
        const title = document.getElementById('announcementTitle').value.trim();
        const content = document.getElementById('announcementContent').value.trim();
        const index = id ? this.announcements.findIndex(a => a.id === id) : -1;
        const isExisting = index > -1;
        const announcement = { title, content };
        if (id) announcement.id = id;
        const savedAnnouncement = await this.persistRecord('announcements', announcement);
        if (!savedAnnouncement) return;

        if (isExisting) {
            this.announcements[index] = savedAnnouncement;
        } else {
            this.announcements.push(savedAnnouncement);
        }

        this.saveToStorage('announcements', this.announcements);
        await this.logActivity(
            isExisting ? 'announcement-update' : 'announcement-create',
            savedAnnouncement.title,
            isExisting ? 'Announcement updated.' : 'New announcement posted.'
        );
        this.refreshViewsAfterDataChange('announcements');
        this.closeAllModals();
    }


BarangayManager.prototype.editAnnouncement = function(id) {
        const announcement = this.announcements.find(a => a.id === id);
        document.getElementById('announcementId').value = announcement.id;
        document.getElementById('announcementTitle').value = announcement.title;
        document.getElementById('announcementContent').value = announcement.content;
        document.getElementById('announcementModal').classList.add('active');
    }


BarangayManager.prototype.deleteAnnouncement = async function(id) {
        if (confirm('Delete this announcement?')) {
            const announcement = this.announcements.find(a => a.id === id);
            const removed = await this.removeRecord('announcements', id);
            if (!removed) return;
            this.deleteCollectionItem('announcements', id);
            if (announcement) await this.logActivity('announcement-delete', announcement.title, 'Announcement deleted.');
            this.refreshViewsAfterDataChange('announcements');
        }
    }

    // Reports

