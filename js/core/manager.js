// Barangay Management System - JavaScript
// All data is stored in localStorage

class BarangayManager {
    constructor() {
        this.isLoggedIn = false;
        this.currentAdmin = '';
        this.currentUserRole = '';
        this.currentUser = null;
        this.users = [];
        this.residents = [];
        this.certificates = [];
        this.blotters = [];
        this.appointments = [];
        this.announcements = [];
        this.activities = [];
        this.init();
}

}
