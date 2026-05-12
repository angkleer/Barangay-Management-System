BarangayManager.prototype.renderAdminDashboard = function() {
        const certificateFeed = document.getElementById('adminCertificateFeed');
        const appointmentFeed = document.getElementById('adminAppointmentFeed');
        const announcementFeed = document.getElementById('adminAnnouncementFeed');
        const activityFeed = document.getElementById('adminActivityFeed');

        const recentCertificates = [...this.certificates]
            .sort((left, right) => `${right.date}`.localeCompare(`${left.date}`))
            .slice(0, 4);

        certificateFeed.innerHTML = recentCertificates.length
            ? recentCertificates.map(certificate => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-file-signature"></i></div>
                    <div>
                        <h3>${certificate.residentName}</h3>
                        <p>${certificate.type}</p>
                        <small>${certificate.date} - ${certificate.status}</small>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">No certificate requests recorded yet.</div>';

        const upcomingAppointments = [...this.appointments]
            .filter(appointment => appointment.status !== 'Completed' && appointment.status !== 'Cancelled')
            .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))
            .slice(0, 4);

        appointmentFeed.innerHTML = upcomingAppointments.length
            ? upcomingAppointments.map(appointment => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-calendar-day"></i></div>
                    <div>
                        <h3>${appointment.residentName}</h3>
                        <p>${appointment.purpose}</p>
                        <small>${appointment.date} - ${appointment.time} - ${appointment.status}</small>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">No upcoming appointments scheduled.</div>';

        const latestAnnouncements = [...this.announcements]
            .slice(-4)
            .reverse();

        announcementFeed.innerHTML = latestAnnouncements.length
            ? latestAnnouncements.map(announcement => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-bullhorn"></i></div>
                    <div>
                        <h3>${announcement.title}</h3>
                        <p>${announcement.content}</p>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">No announcements posted yet.</div>';

        const recentActivities = [...this.activities]
            .sort((left, right) => `${right.createdAt}`.localeCompare(`${left.createdAt}`))
            .slice(0, 5);

        activityFeed.innerHTML = recentActivities.length
            ? recentActivities.map(activity => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-clock-rotate-left"></i></div>
                    <div>
                        <h3>${activity.title}</h3>
                        <p>${activity.detail}</p>
                        <small>${activity.createdAtDisplay}</small>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">No recent activity yet.</div>';
    }


BarangayManager.prototype.renderUserDashboard = function() {
        const verification = this.getCurrentVerificationState();
        const currentUser = verification.user || this.currentUser;
        const residentName = currentUser?.fullName || '';
        const verificationStatus = verification.status;
        const residentCertificates = this.certificates
            .filter(certificate => certificate.residentName === residentName)
            .sort((left, right) => `${right.date}`.localeCompare(`${left.date}`));
        const residentConcerns = this.blotters
            .filter(blotter => blotter.complainant === residentName)
            .sort((left, right) => `${right.date}`.localeCompare(`${left.date}`));
        const residentAppointments = this.appointments
            .filter(appointment => appointment.residentName === residentName)
            .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`));
        const upcomingAppointments = residentAppointments
            .filter(appointment => appointment.status !== 'Completed' && appointment.status !== 'Cancelled');
        const announcements = [...this.announcements].slice(-4).reverse();
        const reminderMessages = [
            verificationStatus === 'scheduled'
                ? `Attend your verification schedule on ${verification.scheduleDisplay} and bring your legal documents.`
                : 'Wait for the barangay admin to schedule your in-person verification.',
            verificationStatus === 'verified'
                ? 'Bring a valid ID before claiming any approved certificate.'
                : 'Barangay services will unlock after your identity is verified.',
            verificationStatus === 'verified'
                ? 'Keep your contact details updated for barangay notices.'
                : 'Check this dashboard for your assigned verification date and time.'
        ];
        const verificationLabel = verificationStatus === 'verified'
            ? 'Verified'
            : verificationStatus === 'scheduled'
                ? 'Verification Scheduled'
                : 'Pending Verification';

        document.getElementById('userWelcomeHeading').textContent = currentUser?.fullName
            ? `Welcome, ${currentUser.fullName}`
            : 'Welcome';
        document.getElementById('userVerificationStatus').textContent = verificationLabel;
        document.getElementById('userVerificationSchedule').textContent = verificationStatus === 'verified'
            ? 'Barangay identity confirmed'
            : verification.scheduleDisplay;
        document.getElementById('userProfileUsername').textContent = `@${currentUser?.username || 'resident'}`;
        document.getElementById('userCertificateCount').textContent = residentCertificates.length;
        document.getElementById('userUpcomingAppointments').textContent = upcomingAppointments.length;
        document.getElementById('userConcernCount').textContent = residentConcerns.length;
        document.getElementById('userProfileContact').textContent = currentUser?.contact || '-';
        document.getElementById('userProfileFullName').textContent = currentUser?.fullName || '-';
        document.getElementById('userProfileUsernameDetail').textContent = currentUser?.username || '-';
        document.getElementById('userProfileContactDetail').textContent = currentUser?.contact || '-';
        document.getElementById('userProfileAddress').textContent = currentUser?.address || 'Brgy. Biasong, Loon, Bohol';

        const verificationNotice = document.getElementById('userVerificationNotice');
        const verificationNoticeTitle = document.getElementById('userVerificationNoticeTitle');
        const verificationNoticeText = document.getElementById('userVerificationNoticeText');
        verificationNotice.classList.toggle('hidden', verificationStatus === 'verified');
        verificationNoticeTitle.textContent = verificationStatus === 'scheduled'
            ? 'Verification Schedule Ready'
            : 'Account Needs Verification';
        verificationNoticeText.textContent = verificationStatus === 'scheduled'
            ? `Please come to the barangay office on ${verification.scheduleDisplay} and bring your legal documents for identity checking.`
            : 'Your account cannot access barangay services yet. The barangay admin will assign your verification date after reviewing your registration.';

        document.getElementById('userServicePanelLead').textContent = verificationStatus === 'verified'
            ? 'Actions available for your verified account'
            : verificationStatus === 'scheduled'
                ? 'Your admin-scheduled identity check'
                : 'Verification is required before services unlock';
        document.getElementById('userServiceActionGrid').innerHTML = verificationStatus === 'verified'
            ? `
                <button type="button" class="resident-action-card" data-user-action="certificate">
                    <i class="fas fa-file-signature"></i>
                    <strong>Request Document</strong>
                    <span>Submit a barangay certificate or clearance request.</span>
                </button>
                <button type="button" class="resident-action-card" data-user-action="appointment">
                    <i class="fas fa-calendar-check"></i>
                    <strong>Book Appointment</strong>
                    <span>Schedule your visit to the barangay office.</span>
                </button>
                <button type="button" class="resident-action-card" data-user-action="concern">
                    <i class="fas fa-comment-dots"></i>
                    <strong>Report Concern</strong>
                    <span>Send a concern or incident for review.</span>
                </button>
            `
            : `
                <button type="button" class="resident-action-card" data-user-action="verification">
                    <i class="fas fa-id-card"></i>
                    <strong>${verificationStatus === 'scheduled' ? 'Scheduled for Verification' : 'Schedule for Verification'}</strong>
                    <span>${verificationStatus === 'scheduled' ? `Your barangay visit is set for ${verification.scheduleDisplay}.` : 'The barangay admin will assign your verification date and time after reviewing your registration.'}</span>
                </button>
            `;

        document.getElementById('userCertificateFeed').innerHTML = residentCertificates.length
            ? residentCertificates.slice(0, 4).map(certificate => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-file-signature"></i></div>
                    <div>
                        <h3>${certificate.type}</h3>
                        <p>Your certificate request</p>
                        <small>${certificate.date} - ${certificate.status}</small>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">You have no certificate requests yet.</div>';

        document.getElementById('userAppointmentFeed').innerHTML = upcomingAppointments.length
            ? upcomingAppointments.slice(0, 4).map(appointment => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-calendar-day"></i></div>
                    <div>
                        <h3>${appointment.purpose}</h3>
                        <p>Your scheduled barangay visit</p>
                        <small>${appointment.date} at ${appointment.time} - ${appointment.status}</small>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">You have no upcoming appointments yet.</div>';

        document.getElementById('userConcernFeed').innerHTML = residentConcerns.length
            ? residentConcerns.slice(0, 4).map(concern => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-comment-dots"></i></div>
                    <div>
                        <h3>${concern.respondent || 'Concern submitted'}</h3>
                        <p>${concern.description}</p>
                        <small>${concern.date} - ${concern.status}</small>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">You have not reported any concerns yet.</div>';

        document.getElementById('userAnnouncementFeed').innerHTML = announcements.length
            ? announcements.map(announcement => `
                <article class="feed-card">
                    <div class="feed-icon"><i class="fas fa-bullhorn"></i></div>
                    <div>
                        <h3>${announcement.title}</h3>
                        <p>${announcement.content}</p>
                    </div>
                </article>
            `).join('')
            : '<div class="empty-feed">No announcements available right now.</div>';

        document.getElementById('userReminderFeed').innerHTML = reminderMessages.map(reminder => `
            <article class="feed-card">
                <div class="feed-icon"><i class="fas fa-circle-check"></i></div>
                <div>
                    <h3>Reminder</h3>
                    <p>${reminder}</p>
                </div>
            </article>
        `).join('');
    }

