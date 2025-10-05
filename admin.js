// Admin Panel JavaScript - Clean Version
const BACKEND_URL = 'https://luckyspin-backend.onrender.com';

// Global state management
const AdminState = {
    currentUsers: [],
    selectedUsers: new Set(),
    currentPrizes: { en: [], mm: [] },
    currentProbabilities: []
};

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'ezbet123@'
};

// Utility functions
const Utils = {
    showMessage: function(message, type, container = null) {
        const messageDiv = container || document.createElement('div');
        if (!container) {
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = message;
            document.body.appendChild(messageDiv);
            setTimeout(() => messageDiv.remove(), 5000);
        } else {
            container.className = `message ${type}`;
            container.textContent = message;
        }
    },

    formatDate: function(dateString) {
        return new Date(dateString).toLocaleDateString();
    }
};

// Authentication module
const Auth = {
    login: function() {
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value;
        const messageDiv = document.getElementById('loginMessage');

        if (!username || !password) {
            Utils.showMessage('Please enter both username and password.', 'error', messageDiv);
            return;
        }

        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            this.showAdminPanel();
            Stats.load();
            Users.load();
            Utils.showMessage('Login successful!', 'success');
        } else {
            Utils.showMessage('Invalid credentials!', 'error', messageDiv);
        }
    },

    logout: function() {
        sessionStorage.removeItem('adminLoggedIn');
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
        Utils.showMessage('Logged out successfully!', 'info');
    },

    showAdminPanel: function() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        Prizes.load();
        Probabilities.load();
        Counter.load();
    },

    isLoggedIn: function() {
        return sessionStorage.getItem('adminLoggedIn') === 'true';
    }
};

// Statistics module
const Stats = {
    async load(params = '') {
        try {
            let url = `${BACKEND_URL}/api/admin/stats${params}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                // Fallback to calculate from spins data
                return this.loadFromSpins(params);
            }
            
            const data = await response.json();
            if (data.success) {
                this.updateDisplay(data.stats);
                if (!params) {
                    Utils.showMessage('Statistics loaded successfully', 'success');
                }
            } else {
                this.loadFromSpins(params);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            this.loadFromSpins(params);
        }
    },

    async loadFromSpins(params = '') {
        try {
            const response = await fetch(`${BACKEND_URL}/api/spins`);
            const spins = await response.json();
            const stats = this.calculateStats(spins, params);
            this.updateDisplay(stats);
            
            if (!params) {
                Utils.showMessage('Statistics calculated from spins data', 'info');
            }
        } catch (error) {
            console.error('Error loading spins for stats:', error);
            Utils.showMessage('Error loading statistics', 'error');
        }
    },

    calculateStats(spins, params = '') {
        let filteredSpins = spins;
        let dateLabel = 'All Time';

        if (params.includes('dateFilter=')) {
            const dateFilter = params.split('dateFilter=')[1];
            filteredSpins = spins.filter(spin => {
                const spinDate = new Date(spin.date).toISOString().split('T')[0];
                return spinDate === dateFilter;
            });
            dateLabel = new Date(dateFilter).toLocaleDateString();
        }

        const today = new Date().toISOString().split('T')[0];
        const todaySpins = spins.filter(spin => {
            const spinDate = new Date(spin.date).toISOString().split('T')[0];
            return spinDate === today;
        });

        const totalPrizes = filteredSpins.reduce((total, spin) => {
            const prizeValue = parseInt(spin.prize.replace(/[^\d]/g, '')) || 0;
            return total + prizeValue;
        }, 0);

        return {
            totalUsers: filteredSpins.length,
            totalSpins: filteredSpins.length,
            totalPrizes: totalPrizes,
            todaySpins: todaySpins.length,
            dateLabel: dateLabel
        };
    },

    updateDisplay(stats) {
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('totalSpins').textContent = stats.totalSpins || 0;
        document.getElementById('totalPrizes').textContent = (stats.totalPrizes || 0).toLocaleString();
        document.getElementById('todaySpins').textContent = stats.todaySpins || 0;
        
        const dateLabel = stats.dateLabel || 'All Time';
        this.updateDateLabel(dateLabel);
    },

    updateDateLabel(dateLabel) {
        const element = document.getElementById('statsDateLabel');
        if (element) {
            element.textContent = `Showing: ${dateLabel} Data`;
        }
    },

    async filterByDate() {
        const dateFilter = document.getElementById('statsDateFilter').value;
        if (!dateFilter) {
            Utils.showMessage('Please select a date to filter', 'error');
            return;
        }
        
        document.getElementById('dateFilter').value = dateFilter;
        const params = `?dateFilter=${dateFilter}`;
        await this.load(params);
        await Users.load(dateFilter);
        
        const formattedDate = new Date(dateFilter).toLocaleDateString();
        Utils.showMessage(`Filtered data for ${formattedDate}`, 'success');
    },

    async loadTodayStats() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('statsDateFilter').value = today;
        document.getElementById('dateFilter').value = today;
        
        const params = `?dateFilter=${today}`;
        await this.load(params);
        await Users.load(today);
        
        Utils.showMessage('Showing today\'s data', 'success');
    },

    async loadAllTimeStats() {
        document.getElementById('statsDateFilter').value = '';
        document.getElementById('dateFilter').value = '';
        
        await this.load();
        await Users.load();
        
        Utils.showMessage('Showing all time data', 'success');
    },

    async refreshCurrentView() {
        const statsDateFilter = document.getElementById('statsDateFilter').value;
        
        if (statsDateFilter) {
            const params = `?dateFilter=${statsDateFilter}`;
            await this.load(params);
            await Users.load(statsDateFilter);
        } else {
            await this.load();
            await Users.load();
        }
        
        Utils.showMessage('Data refreshed', 'success');
    }
};

// Users module
const Users = {
    async load(dateFilter = null) {
        try {
            let url = `${BACKEND_URL}/api/spins`;
            if (dateFilter) {
                url += `?dateFilter=${dateFilter}`;
            }
            
            const response = await fetch(url);
            const users = await response.json();
            
            AdminState.currentUsers = users;
            this.display(users);
            this.updateSelectedCount();
        } catch (error) {
            console.error('Error loading users:', error);
            Utils.showMessage('Error loading users', 'error');
        }
    },

    display(users) {
        const tbody = document.getElementById('usersTableBody');
        
        if (!users.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading-message">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <input type="checkbox" class="user-checkbox" value="${user.username}" 
                           onchange="Users.toggleSelection('${user.username}')">
                </td>
                <td style="word-break: break-word;">${user.username}</td>
                <td style="color: #FFD700; font-weight: bold; word-break: break-word;">${user.prize}</td>
                <td style="white-space: nowrap;">${Utils.formatDate(user.date)}</td>
                <td style="color: #00FFFF;">${user.device || 'Unknown'}</td>
                <td style="color: ${user.ipAddress && user.ipAddress !== 'Unknown' ? '#FF6B6B' : '#666'}; font-family: monospace; font-size: 11px; word-break: break-all;">${user.ipAddress || 'Not tracked'}</td>
                <td style="color: #00FF66;">${user.os || 'Unknown'}</td>
                <td>
                    <button class="btn btn-danger" style="padding: 5px 10px; font-size: 12px; white-space: nowrap;" 
                            onclick="Users.deleteSingle('${user.username}')">Delete</button>
                </td>
            </tr>
        `).join('');
    },

    filter() {
        const searchTerm = document.getElementById('searchUser').value.toLowerCase();
        const dateFilter = document.getElementById('dateFilter').value;
        
        let filtered = AdminState.currentUsers;
        
        if (searchTerm) {
            filtered = filtered.filter(user => 
                user.username.toLowerCase().includes(searchTerm)
            );
        }
        
        if (dateFilter) {
            filtered = filtered.filter(user => {
                const userDate = new Date(user.date).toISOString().split('T')[0];
                return userDate === dateFilter;
            });
        }
        
        this.display(filtered);
    },

    toggleSelection(username) {
        if (AdminState.selectedUsers.has(username)) {
            AdminState.selectedUsers.delete(username);
        } else {
            AdminState.selectedUsers.add(username);
        }
        this.updateSelectedCount();
    },

    toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const userCheckboxes = document.querySelectorAll('.user-checkbox');
        
        if (selectAllCheckbox.checked) {
            userCheckboxes.forEach(checkbox => {
                checkbox.checked = true;
                AdminState.selectedUsers.add(checkbox.value);
            });
        } else {
            userCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
                AdminState.selectedUsers.delete(checkbox.value);
            });
        }
        this.updateSelectedCount();
    },

    selectAll() {
        const userCheckboxes = document.querySelectorAll('.user-checkbox');
        userCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
            AdminState.selectedUsers.add(checkbox.value);
        });
        document.getElementById('selectAllCheckbox').checked = true;
        this.updateSelectedCount();
    },

    deselectAll() {
        const userCheckboxes = document.querySelectorAll('.user-checkbox');
        userCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
            AdminState.selectedUsers.delete(checkbox.value);
        });
        document.getElementById('selectAllCheckbox').checked = false;
        this.updateSelectedCount();
    },

    updateSelectedCount() {
        document.getElementById('selectedCount').textContent = `${AdminState.selectedUsers.size} selected`;
    },

    async deleteSingle(username) {
        if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/delete-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            
            const data = await response.json();
            
            if (data.success) {
                Utils.showMessage(`User "${username}" deleted successfully`, 'success');
                this.load();
                Stats.load();
            } else {
                Utils.showMessage(data.error || 'Failed to delete user', 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            Utils.showMessage('Error deleting user', 'error');
        }
    },

    async deleteSelected() {
        if (AdminState.selectedUsers.size === 0) {
            Utils.showMessage('Please select users to delete', 'error');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${AdminState.selectedUsers.size} selected users?`)) {
            return;
        }
        
        try {
            const usernames = Array.from(AdminState.selectedUsers);
            const response = await fetch(`${BACKEND_URL}/api/admin/batch-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernames })
            });
            
            const data = await response.json();
            
            if (data.success) {
                Utils.showMessage(`Successfully deleted ${data.deletedCount} users`, 'success');
                AdminState.selectedUsers.clear();
                this.load();
                Stats.load();
            } else {
                Utils.showMessage(data.error || 'Failed to delete users', 'error');
            }
        } catch (error) {
            console.error('Error deleting selected users:', error);
            Utils.showMessage('Error deleting users', 'error');
        }
    }
};

// Prizes module
const Prizes = {
    async load() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/prizes`);
            
            if (!response.ok) {
                // Fallback to config endpoint
                return this.loadFromConfig();
            }
            
            const data = await response.json();
            
            if (data.success) {
                AdminState.currentPrizes = data.prizes;
                this.display();
                Utils.showMessage('Prizes loaded successfully', 'success');
            } else {
                this.loadFromConfig();
            }
        } catch (error) {
            console.error('Error loading prizes:', error);
            this.loadFromConfig();
        }
    },

    async loadFromConfig() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/config`);
            const data = await response.json();
            
            if (data.success && data.config.prizes) {
                AdminState.currentPrizes = data.config.prizes;
                this.display();
                Utils.showMessage('Prizes loaded from config', 'info');
            } else {
                this.setDefaults();
            }
        } catch (error) {
            console.error('Error loading config:', error);
            this.setDefaults();
        }
    },

    setDefaults() {
        AdminState.currentPrizes = {
            en: ["500 MMK", "1,000 MMK", "2,000 MMK", "3,000 MMK", "5,000 MMK", "10,000 MMK", "15,000 MMK", "30,000 MMK", "100,000 MMK"],
            mm: ["၅၀၀ ကျပ်", "၁၀၀၀ ကျပ်", "၂၀၀၀ ကျပ်", "၃၀၀၀ ကျပ်", "၅၀၀၀ ကျပ်", "၁၀၀၀၀ ကျပ်", "၁၅၀၀၀ ကျပ်", "၃၀၀၀၀ ကျပ်", "၁၀၀၀၀၀ ကျပ်"]
        };
        this.display();
        Utils.showMessage('Loaded default prizes', 'info');
    },

    display() {
        this.displayInputs('en', 'englishPrizes');
        this.displayInputs('mm', 'myanmarPrizes');
    },

    displayInputs(lang, containerId) {
        const container = document.getElementById(containerId);
        const prizes = AdminState.currentPrizes[lang] || [];
        
        container.innerHTML = prizes.map((prize, index) => `
            <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
                <input type="text" value="${prize}" 
                       onchange="Prizes.update('${lang}', ${index}, this.value)"
                       style="flex: 1; padding: 8px; border-radius: 5px; border: 1px solid rgba(0,255,255,0.3); background: rgba(0,0,0,0.3); color: white;">
                <button class="btn btn-danger" onclick="Prizes.remove('${lang}', ${index})" 
                        style="padding: 8px 12px; font-size: 12px;">🗑️</button>
            </div>
        `).join('');
    },

    update(lang, index, value) {
        if (!AdminState.currentPrizes[lang]) AdminState.currentPrizes[lang] = [];
        AdminState.currentPrizes[lang][index] = value;
    },

    add(lang) {
        if (!AdminState.currentPrizes[lang]) AdminState.currentPrizes[lang] = [];
        const defaultPrize = lang === 'en' ? '1,000 MMK' : '၁၀၀၀ ကျပ်';
        AdminState.currentPrizes[lang].push(defaultPrize);
        this.display();
        Utils.showMessage(`Prize added to ${lang === 'en' ? 'English' : 'Myanmar'} list`, 'success');
    },

    remove(lang, index) {
        if (!AdminState.currentPrizes[lang]) return;
        const removedPrize = AdminState.currentPrizes[lang][index];
        AdminState.currentPrizes[lang].splice(index, 1);
        this.display();
        Probabilities.load();
        Utils.showMessage(`Prize "${removedPrize}" removed`, 'success');
    },

    async save() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/prizes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prizes: AdminState.currentPrizes })
            });
            
            const data = await response.json();
            
            if (data.success) {
                Utils.showMessage('Prizes saved successfully!', 'success');
                Probabilities.load();
            } else {
                Utils.showMessage(data.error || 'Failed to save prizes', 'error');
            }
        } catch (error) {
            console.error('Error saving prizes:', error);
            Utils.showMessage('Error saving prizes', 'error');
        }
    }
};

// Probabilities module
const Probabilities = {
    async load() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/probabilities`);
            
            if (!response.ok) {
                return this.loadFromConfig();
            }
            
            const data = await response.json();
            
            if (data.success) {
                AdminState.currentProbabilities = data.probabilities;
                this.display();
                Utils.showMessage('Probabilities loaded successfully', 'success');
            } else {
                this.loadFromConfig();
            }
        } catch (error) {
            console.error('Error loading probabilities:', error);
            this.loadFromConfig();
        }
    },

    async loadFromConfig() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/config`);
            const data = await response.json();
            
            if (data.success && data.config.probabilities) {
                AdminState.currentProbabilities = data.config.probabilities;
                this.display();
                Utils.showMessage('Probabilities loaded from config', 'info');
            } else {
                this.setDefaults();
            }
        } catch (error) {
            console.error('Error loading config:', error);
            this.setDefaults();
        }
    },

    setDefaults() {
        AdminState.currentProbabilities = [30, 20, 40, 30, 1, 0.1, 0.01, 0.001, 0.0001];
        this.display();
        Utils.showMessage('Loaded default probabilities', 'info');
    },

    display() {
        const container = document.getElementById('probabilityInputs');
        const prizeCount = Math.max(AdminState.currentPrizes.en?.length || 0, AdminState.currentPrizes.mm?.length || 0);
        
        if (prizeCount === 0) {
            container.innerHTML = '<p style="color: #ccc;">Please set up prizes first</p>';
            return;
        }
        
        while (AdminState.currentProbabilities.length < prizeCount) {
            AdminState.currentProbabilities.push(1);
        }
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                ${AdminState.currentProbabilities.slice(0, prizeCount).map((prob, index) => `
                    <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; border: 1px solid rgba(0,255,255,0.1);">
                        <label style="color: #00FFFF; font-weight: bold; margin-bottom: 5px; display: block;">
                            Prize ${index + 1}:
                        </label>
                        <div style="color: #FFD700; font-size: 12px; margin-bottom: 8px;">
                            ${AdminState.currentPrizes.en?.[index] || 'N/A'}
                        </div>
                        <input type="number" value="${prob}" min="0" step="0.001"
                               onchange="Probabilities.update(${index}, this.value)"
                               style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid rgba(0,255,255,0.3); background: rgba(0,0,0,0.3); color: white;">
                        <div style="color: #ccc; font-size: 11px; margin-top: 5px;">
                            Current: ${((prob / AdminState.currentProbabilities.reduce((a, b) => a + b, 0)) * 100).toFixed(2)}%
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    update(index, value) {
        AdminState.currentProbabilities[index] = parseFloat(value) || 0;
        this.display();
    },

    async save() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/probabilities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ probabilities: AdminState.currentProbabilities })
            });
            
            const data = await response.json();
            
            if (data.success) {
                Utils.showMessage('Probabilities saved successfully!', 'success');
            } else {
                Utils.showMessage(data.error || 'Failed to save probabilities', 'error');
            }
        } catch (error) {
            console.error('Error saving probabilities:', error);
            Utils.showMessage('Error saving probabilities', 'error');
        }
    },

    resetToDefault() {
        if (!confirm('Reset probabilities to default values?')) return;
        
        const prizeCount = Math.max(AdminState.currentPrizes.en?.length || 0, AdminState.currentPrizes.mm?.length || 0);
        const defaultProbs = [30, 20, 40, 30, 1, 0.1, 0.01, 0.001, 0.0001];
        AdminState.currentProbabilities = defaultProbs.slice(0, prizeCount);
        
        while (AdminState.currentProbabilities.length < prizeCount) {
            AdminState.currentProbabilities.push(1);
        }
        
        this.display();
        Utils.showMessage('Probabilities reset to default', 'info');
    }
};

// Counter module
const Counter = {
    async load() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/counter`);
            
            if (!response.ok) {
                return this.loadFromTotalSpins();
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.updateDisplay(data.counter);
                Utils.showMessage('Counter loaded successfully', 'success');
            } else {
                this.loadFromTotalSpins();
            }
        } catch (error) {
            console.error('Error loading counter:', error);
            this.loadFromTotalSpins();
        }
    },

    async loadFromTotalSpins() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/total-spins`);
            const data = await response.json();
            
            if (data.success) {
                const counter = {
                    displayedTotal: data.totalSpins || 1958,
                    baseCounter: 1958,
                    dbSpins: (data.totalSpins || 1958) - 1958
                };
                this.updateDisplay(counter);
                Utils.showMessage('Counter loaded from total spins', 'info');
            } else {
                this.setDefaults();
            }
        } catch (error) {
            console.error('Error loading total spins:', error);
            this.setDefaults();
        }
    },

    setDefaults() {
        const counter = {
            displayedTotal: 1958,
            baseCounter: 1958,
            dbSpins: 0
        };
        this.updateDisplay(counter);
        Utils.showMessage('Counter loaded with default values', 'info');
    },

    updateDisplay(counter) {
        const displayedTotal = document.getElementById('displayedTotal');
        const baseCounter = document.getElementById('baseCounter');
        const dbSpins = document.getElementById('dbSpins');
        
        if (displayedTotal) displayedTotal.textContent = (counter.displayedTotal || 0).toLocaleString();
        if (baseCounter) baseCounter.textContent = (counter.baseCounter || 0).toLocaleString();
        if (dbSpins) dbSpins.textContent = (counter.dbSpins || 0).toLocaleString();
    },

    async setTotal() {
        const input = document.getElementById('totalCounterInput');
        if (!input) return;
        
        const totalValue = parseInt(input.value);
        if (isNaN(totalValue) || totalValue < 0) {
            Utils.showMessage('Please enter a valid number', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/counter/set-total`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ total: totalValue })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateDisplay(data.counter);
                Utils.showMessage('Total counter updated successfully', 'success');
                input.value = '';
            } else {
                Utils.showMessage(data.error || 'Failed to update counter', 'error');
            }
        } catch (error) {
            console.error('Error setting total counter:', error);
            Utils.showMessage('Error updating counter', 'error');
        }
    },

    async setBase() {
        const input = document.getElementById('baseCounterInput');
        if (!input) return;
        
        const baseValue = parseInt(input.value);
        if (isNaN(baseValue) || baseValue < 0) {
            Utils.showMessage('Please enter a valid number', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/counter/set-base`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ base: baseValue })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateDisplay(data.counter);
                Utils.showMessage('Base counter updated successfully', 'success');
                input.value = '';
            } else {
                Utils.showMessage(data.error || 'Failed to update base counter', 'error');
            }
        } catch (error) {
            console.error('Error setting base counter:', error);
            Utils.showMessage('Error updating base counter', 'error');
        }
    },

    async reset() {
        if (!confirm('Reset base counter to default (1958)?')) return;
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/counter/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateDisplay(data.counter);
                Utils.showMessage('Base counter reset to default', 'success');
            } else {
                Utils.showMessage(data.error || 'Failed to reset counter', 'error');
            }
        } catch (error) {
            console.error('Error resetting counter:', error);
            Utils.showMessage('Error resetting counter', 'error');
        }
    }
};

// Database management functions
async function resetAllDatabase() {
    const confirmCheckbox = document.getElementById('confirmReset');
    
    if (!confirmCheckbox.checked) {
        Utils.showMessage('Please confirm that you understand this action', 'error');
        return;
    }
    
    const finalConfirm = prompt('Type "DELETE ALL" to confirm this action:');
    if (finalConfirm !== 'DELETE ALL') {
        Utils.showMessage('Action cancelled', 'info');
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/admin/reset-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            Utils.showMessage('All database records deleted successfully', 'success');
            confirmCheckbox.checked = false;
            document.getElementById('resetAllBtn').disabled = true;
            AdminState.selectedUsers.clear();
            Users.load();
            Stats.load();
        } else {
            Utils.showMessage(data.error || 'Failed to reset database', 'error');
        }
    } catch (error) {
        console.error('Error resetting database:', error);
        Utils.showMessage('Error resetting database', 'error');
    }
}

// Export data
async function exportData(format) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/admin/export?format=${format}`);
        
        if (!response.ok) {
            // Fallback to manual export
            return exportDataManual(format);
        }
        
        const data = await response.json();
        
        if (data.success) {
            const blob = new Blob([data.data], { 
                type: format === 'json' ? 'application/json' : 'text/csv' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ezbet-data-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Utils.showMessage(`Data exported as ${format.toUpperCase()}`, 'success');
        } else {
            exportDataManual(format);
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        exportDataManual(format);
    }
}

async function exportDataManual(format) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/spins`);
        const spins = await response.json();
        
        let exportData;
        let mimeType;
        let fileExtension;
        
        if (format === 'json') {
            exportData = JSON.stringify(spins, null, 2);
            mimeType = 'application/json';
            fileExtension = 'json';
        } else {
            const headers = ['Username', 'Prize', 'Date', 'Device', 'IP Address', 'OS'];
            const csvRows = [headers.join(',')];
            
            spins.forEach(spin => {
                const row = [
                    `"${spin.username || ''}"`,
                    `"${spin.prize || ''}"`,
                    `"${new Date(spin.date).toLocaleDateString()}"`,
                    `"${spin.device || 'Unknown'}"`,
                    `"${spin.ipAddress || 'Unknown'}"`,
                    `"${spin.os || 'Unknown'}"`
                ];
                csvRows.push(row.join(','));
            });
            
            exportData = csvRows.join('\n');
            mimeType = 'text/csv';
            fileExtension = 'csv';
        }
        
        const blob = new Blob([exportData], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ezbet-data-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showMessage(`Data exported as ${format.toUpperCase()} (${spins.length} records)`, 'success');
    } catch (error) {
        console.error('Error exporting data manually:', error);
        Utils.showMessage('Error exporting data', 'error');
    }
}

// Import data
async function importData() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        Utils.showMessage('Please select a file to import', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/admin/import`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            Utils.showMessage(`Successfully imported ${data.importedCount} records`, 'success');
            fileInput.value = '';
            Users.load();
            Stats.load();
        } else {
            Utils.showMessage(data.error || 'Failed to import data', 'error');
        }
    } catch (error) {
        console.error('Error importing data:', error);
        Utils.showMessage('Error importing data', 'error');
    }
}

// Event handlers
document.addEventListener('DOMContentLoaded', () => {
    if (Auth.isLoggedIn()) {
        Auth.showAdminPanel();
        Stats.load();
        Users.load();
    }

    // Setup event listeners
    const confirmReset = document.getElementById('confirmReset');
    if (confirmReset) {
        confirmReset.addEventListener('change', function() {
            document.getElementById('resetAllBtn').disabled = !this.checked;
        });
    }

    const adminPassword = document.getElementById('adminPassword');
    if (adminPassword) {
        adminPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                Auth.login();
            }
        });
    }
    
    setTimeout(() => {
        const statsDateFilter = document.getElementById('statsDateFilter');
        if (statsDateFilter) {
            statsDateFilter.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    Stats.filterByDate();
                }
            });
        }
    }, 1000);
});

// Global function wrappers for HTML compatibility
function adminLogin() { Auth.login(); }
function adminLogout() { Auth.logout(); }
function showAdminPanel() { Auth.showAdminPanel(); }
function loadStats(params) { return Stats.load(params); }
function filterByDate() { return Stats.filterByDate(); }
function loadTodayStats() { return Stats.loadTodayStats(); }
function loadAllTimeStats() { return Stats.loadAllTimeStats(); }
function loadUsers(dateFilter) { return Users.load(dateFilter); }
function filterUsers() { Users.filter(); }
function toggleUserSelection(username) { Users.toggleSelection(username); }
function toggleSelectAll() { Users.toggleSelectAll(); }
function selectAllUsers() { Users.selectAll(); }
function deselectAllUsers() { Users.deselectAll(); }
function updateSelectedCount() { Users.updateSelectedCount(); }
function deleteSingleUserByName(username) { return Users.deleteSingle(username); }
function deleteSelectedUsers() { return Users.deleteSelected(); }
function refreshCurrentView() { return Stats.refreshCurrentView(); }
function updateDateLabel(dateLabel) { Stats.updateDateLabel(dateLabel); }
function loadPrizes() { return Prizes.load(); }
function addPrize(lang) { Prizes.add(lang); }
function savePrizes() { return Prizes.save(); }
function showMessage(message, type, container) { Utils.showMessage(message, type, container); }
function loadProbabilities() { return Probabilities.load(); }
function saveProbabilities() { return Probabilities.save(); }
function resetToDefault() { Probabilities.resetToDefault(); }
function setTotalCounter() { return Counter.setTotal(); }
function setBaseCounter() { return Counter.setBase(); }
function resetBaseCounter() { return Counter.reset(); }
function loadTotalSpinsCounter() { return Counter.load(); }
function updatePrize(lang, index, value) { Prizes.update(lang, index, value); }
function removePrize(lang, index) { Prizes.remove(lang, index); }
function updateProbability(index, value) { Probabilities.update(index, value); }