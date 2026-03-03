/**
 * TripSplit Pro - Core Logic & State Management
 * Handles Data Persistence, View Navigation, and UI Updates
 */

class Store {
    constructor() {
        this.storageKey = 'tripsplit_pro_data';
        this.data = this.load();
    }

    load() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : {
            members: [],
            trips: [],
            expenses: [],
            settings: {
                theme: 'system',
                currency: 'INR',
                timezone: 'Asia/Kolkata'
            },
            templates: [
                { id: 'default', name: 'Standard Summary', body: 'Trip: {trip_name}\nMember: {member_name}\nTotal Trip Exp: {total}\nYour Share: {amount}' }
            ],
            currentTripId: null
        };
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    // Member Methods
    addMember(member) {
        const newMember = { ...member, id: Date.now().toString() };
        this.data.members.push(newMember);
        this.save();
        return newMember;
    }

    getMembers() {
        return this.data.members;
    }

    updateMember(id, updatedMember) {
        const index = this.data.members.findIndex(m => m.id === id);
        if (index !== -1) {
            this.data.members[index] = { ...this.data.members[index], ...updatedMember };
            this.save();
        }
    }

    deleteMember(id) {
        this.data.members = this.data.members.filter(m => m.id !== id);
        this.save();
    }

    // Trip Methods
    createTrip(trip) {
        const newTrip = {
            ...trip,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        this.data.trips.push(newTrip);
        this.data.currentTripId = newTrip.id;
        this.save();
        return newTrip;
    }

    deleteTrip(id) {
        this.data.trips = this.data.trips.filter(t => t.id !== id);
        this.data.expenses = this.data.expenses.filter(e => e.tripId !== id);
        if (this.data.currentTripId === id) this.data.currentTripId = null;
        this.save();
    }

    getCurrentTrip() {
        return this.data.trips.find(t => t.id === this.data.currentTripId);
    }

    // Expense Methods
    addExpense(expense) {
        const newExpense = { ...expense, id: Date.now().toString() };
        this.data.expenses.push(newExpense);
        this.save();
        return newExpense;
    }

    getTripExpenses(tripId) {
        return this.data.expenses.filter(e => e.tripId === tripId);
    }

    getExpense(id) {
        return this.data.expenses.find(e => e.id === id);
    }

    deleteExpense(id) {
        this.data.expenses = this.data.expenses.filter(e => e.id !== id);
        this.save();
    }

    // Template Methods
    addTemplate(template) {
        const newTemplate = { ...template, id: Date.now().toString() };
        this.data.templates.push(newTemplate);
        this.save();
        return newTemplate;
    }

    updateTemplate(id, updatedTemplate) {
        const index = this.data.templates.findIndex(t => t.id === id);
        if (index !== -1) {
            this.data.templates[index] = { ...this.data.templates[index], ...updatedTemplate };
            this.save();
        }
    }

    deleteTemplate(id) {
        this.data.templates = this.data.templates.filter(t => t.id !== id);
        this.save();
    }

    // Settings
    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
    }
}

const UI = {
    views: ['view-loading', 'view-trip-creation', 'view-dashboard', 'view-members', 'view-settings'],

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.route();
    },

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('[data-view-target]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.viewTarget;
                this.showView(`view-${target}`);
                this.updateActiveNav(e.currentTarget);
            });
        });

        // Theme Toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            store.updateSettings({ theme: next });
            this.updateThemeIcon(next);
        });

        // About Dropdown
        const aboutTrigger = document.getElementById('about-trigger');
        const aboutMenu = document.getElementById('about-menu');
        aboutTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            aboutMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', () => {
            aboutMenu.classList.add('hidden');
        });

        // Modal Close
        document.getElementById('modal-close').addEventListener('click', () => this.hideModal());
        document.getElementById('modal-container').addEventListener('click', (e) => {
            if (e.target.id === 'modal-container') this.hideModal();
        });

        // Trip Form
        const tripForm = document.getElementById('trip-form');
        if (tripForm) {
            tripForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTripCreation();
            });
        }

        // Add Member Trigger in Trip Creation
        document.getElementById('add-member-trigger').addEventListener('click', () => {
            this.showMemberModal();
        });

        // Dashboard Actions
        document.getElementById('add-expense-trigger').addEventListener('click', () => {
            this.showExpenseModal();
        });

        document.getElementById('send-whatsapp-summary').addEventListener('click', () => {
            this.handleWhatsAppSummary();
        });

        // Settings Listeners
        document.getElementById('settings-theme').addEventListener('change', (e) => {
            store.updateSettings({ theme: e.target.value });
            this.applyTheme();
        });

        document.getElementById('settings-currency').addEventListener('change', (e) => {
            store.updateSettings({ currency: e.target.value });
            this.renderDashboard();
        });

        document.getElementById('add-template-trigger').addEventListener('click', () => {
            this.showTemplateModal();
        });
    },

    route() {
        const trip = store.getCurrentTrip();
        const hash = window.location.hash;

        if (!trip) {
            this.showView('view-trip-creation');
            this.renderMemberSelection();
        } else if (hash === '#members') {
            this.showView('view-members');
            this.renderMembersManagement();
        } else if (hash === '#settings') {
            this.showView('view-settings');
            this.renderSettings();
        } else {
            this.showView('view-dashboard');
            this.renderDashboard();
        }
    },

    showView(viewId) {
        this.views.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        const target = document.getElementById(viewId);
        if (target) target.classList.remove('hidden');
    },

    updateActiveNav(activeBtn) {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    },

    applyTheme() {
        const theme = store.data.settings.theme;
        let activeTheme = theme;
        if (theme === 'system') {
            activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', activeTheme);
        this.updateThemeIcon(activeTheme);
    },

    updateThemeIcon(theme) {
        const icon = document.querySelector('#theme-toggle .icon');
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    },

    // Modal Helpers
    showModal(title, contentHtml) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = contentHtml;
        document.getElementById('modal-container').classList.remove('hidden');
    },

    hideModal() {
        document.getElementById('modal-container').classList.add('hidden');
    },

    // View Renders & Actions
    renderMemberSelection() {
        const container = document.getElementById('member-selection-list');
        const members = store.getMembers();

        if (members.length === 0) {
            container.innerHTML = '<p class="text-secondary">No members added yet.</p>';
            return;
        }

        container.innerHTML = members.map(m => `
            <div class="member-chip" data-id="${m.id}">
                <input type="checkbox" id="m-${m.id}" value="${m.id}" name="members" checked>
                <label for="m-${m.id}">
                    ${m.photo ? `<img src="${m.photo}" class="chip-avatar">` : '👤'}
                    <span>${m.name}</span>
                </label>
            </div>
        `).join('');
    },

    showMemberModal() {
        const html = `
            <form id="member-form">
                <div class="form-group">
                    <label>Member Name</label>
                    <input type="text" id="m-name" required placeholder="Name">
                </div>
                <div class="form-group">
                    <label>WhatsApp Number</label>
                    <input type="tel" id="m-phone" required placeholder="e.g. 919876543210">
                </div>
                <div class="form-group">
                    <label>Photo</label>
                    <input type="file" id="m-photo" accept="image/*">
                    <div id="photo-preview" class="mt-sm"></div>
                </div>
                <button type="submit" class="btn-primary w-full mt-md">Save Member</button>
            </form>
        `;
        this.showModal('Add New Member', html);

        const form = document.getElementById('member-form');
        const photoInput = document.getElementById('m-photo');
        let base64Photo = '';

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    base64Photo = re.target.result;
                    document.getElementById('photo-preview').innerHTML = `<img src="${base64Photo}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('m-name').value;
            const phone = document.getElementById('m-phone').value;
            store.addMember({ name, whatsapp: phone, photo: base64Photo });
            this.hideModal();
            this.renderMemberSelection();
            this.showToast('Member added successfully!');
        });
    },

    handleTripCreation() {
        const name = document.getElementById('trip-name').value;
        const location = document.getElementById('trip-location').value;
        const startDate = document.getElementById('trip-start').value;
        const endDate = document.getElementById('trip-end').value;
        const selectedMembers = Array.from(document.querySelectorAll('input[name="members"]:checked')).map(cb => cb.value);

        if (selectedMembers.length === 0) {
            this.showToast('Please select at least one member!', 'error');
            return;
        }

        store.createTrip({ name, location, startDate, endDate, memberIds: selectedMembers });
        this.showToast('Trip created successfully!');
        this.route();
    },

    renderDashboard() {
        const trip = store.getCurrentTrip();
        if (!trip) return;

        const currency = store.data.settings.currency === 'INR' ? '₹' : (store.data.settings.currency === 'USD' ? '$' : '€');
        const start = trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '';
        const end = trip.endDate ? new Date(trip.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

        document.getElementById('dashboard-trip-name').textContent = trip.name;
        document.getElementById('dashboard-trip-location').textContent = `${trip.location} • ${start} - ${end}`;

        const expenses = store.getTripExpenses(trip.id);
        const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        document.getElementById('total-trip-cost').textContent = `${currency}${total.toLocaleString()}`;
        document.getElementById('member-count').textContent = trip.memberIds.length;

        this.renderExpenseList(expenses, currency);
        this.renderMemberBreakdown(trip, expenses, currency);
    },

    renderExpenseList(expenses, currency) {
        const container = document.getElementById('expense-list');
        if (expenses.length === 0) {
            container.innerHTML = '<div class="card glass text-center py-xl">No expenses yet. Start by adding one!</div>';
            return;
        }

        const grouped = expenses.sort((a, b) => new Date(b.date) - new Date(a.date))
            .reduce((acc, exp) => {
                const date = new Date(exp.date).toLocaleDateString('en-IN', { dateStyle: 'long' });
                if (!acc[date]) acc[date] = [];
                acc[date].push(exp);
                return acc;
            }, {});

        container.innerHTML = Object.entries(grouped).map(([date, items]) => `
            <div class="expense-group mb-lg">
                <div class="expense-date text-secondary mb-sm" style="font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">${date}</div>
                <div class="flex-col gap-sm">
                    ${items.map(exp => {
            const payer = store.getMembers().find(m => m.id === exp.paidBy);
            return `
                            <div class="expense-item glass animate-in p-md flex-between" style="border-radius: var(--radius-md); cursor: pointer;" onclick="UI.showExpenseDetailModal('${exp.id}')">
                                <div class="exp-info">
                                    <strong style="display: block">${exp.title}</strong>
                                    <span class="text-secondary" style="font-size: 0.75rem">Paid by ${payer ? payer.name : 'Unknown'}</span>
                                </div>
                                <div class="flex-center gap-md">
                                    <div class="exp-amount" style="font-weight: 700; color: var(--primary)">${currency}${parseFloat(exp.amount).toLocaleString()}</div>
                                    <span class="icon text-muted" style="font-size: 0.8rem">👁️</span>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `).join('');
    },

    renderMemberBreakdown(trip, expenses, currency) {
        const container = document.getElementById('member-breakdown');
        const members = store.getMembers().filter(m => trip.memberIds.includes(m.id));

        const totals = members.map(m => {
            const paid = expenses.filter(e => e.paidBy === m.id).reduce((s, e) => s + parseFloat(e.amount), 0);
            let share = 0;
            expenses.forEach(e => {
                if (e.splitBetweenIds.includes(m.id)) {
                    share += parseFloat(e.amount) / e.splitBetweenIds.length;
                }
            });
            return { ...m, paid, share, balance: paid - share };
        });

        container.innerHTML = totals.map(t => `
            <div class="member-card glass mb-md p-md flex-between" style="border-radius: var(--radius-md)">
                <div class="m-meta flex-center gap-md">
                    ${t.photo ? `<img src="${t.photo}" class="avatar-sm" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">` : '<div class="avatar-sm flex-center bg-glass" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--glass-border)">👤</div>'}
                    <div>
                        <strong style="font-size: 0.875rem">${t.name}</strong>
                        <p class="text-secondary" style="font-size: 0.7rem">Paid: ${currency}${t.paid.toFixed(0)}</p>
                    </div>
                </div>
                <div class="m-balance ${t.balance >= 0 ? 'text-success' : 'text-danger'}" style="font-weight: 700; font-size: 0.875rem">
                    ${t.balance >= 0 ? '+' : ''}${currency}${t.balance.toFixed(0)}
                </div>
            </div>
        `).join('');
    },

    showExpenseModal() {
        const trip = store.getCurrentTrip();
        const members = store.getMembers().filter(m => trip.memberIds.includes(m.id));

        const html = `
            <form id="expense-form">
                <div class="form-group">
                    <label>Expense Title</label>
                    <input type="text" id="exp-title" required placeholder="e.g. Dinner at Beach">
                </div>
                <div class="form-group">
                    <label>Amount</label>
                    <input type="number" id="exp-amount" required placeholder="0.00" step="0.01">
                </div>
                <div class="form-group">
                    <label>Paid By</label>
                    <select id="exp-payer" required>
                        ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Split Between</label>
                    <div class="flex-col gap-sm mt-sm">
                        ${members.map(m => `
                            <label class="flex-between" style="font-weight: 400">
                                <span>${m.name}</span>
                                <input type="checkbox" name="exp-split" value="${m.id}" checked>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <button type="submit" class="btn-primary w-full mt-lg">Add Expense</button>
            </form>
        `;
        this.showModal('Add New Expense', html);

        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('exp-title').value;
            const amount = document.getElementById('exp-amount').value;
            const paidBy = document.getElementById('exp-payer').value;
            const splitBetweenIds = Array.from(document.querySelectorAll('input[name="exp-split"]:checked')).map(cb => cb.value);

            if (splitBetweenIds.length === 0) {
                this.showToast('Please select at least one person to split with!', 'error');
                return;
            }

            store.addExpense({
                tripId: trip.id,
                title,
                amount,
                paidBy,
                splitBetweenIds,
                date: new Date().toISOString()
            });

            this.hideModal();
            this.renderDashboard();
            this.showToast('Expense added!');
        });
    },

    handleWhatsAppSummary() {
        const trip = store.getCurrentTrip();
        const expenses = store.getTripExpenses(trip.id);
        const members = store.getMembers().filter(m => trip.memberIds.includes(m.id));
        const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        const html = `
            <div class="form-group">
                <label>Select Template</label>
                <select id="wa-template-select">
                    ${store.data.templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                </select>
            </div>
            <p class="text-secondary mb-md">Select a member to send their specific summary.</p>
            <div class="flex-col gap-sm" id="wa-member-list">
                ${members.map(m => {
            const paid = expenses.filter(e => e.paidBy === m.id).reduce((s, e) => s + parseFloat(e.amount), 0);
            let share = 0;
            expenses.forEach(e => {
                if (e.splitBetweenIds.includes(m.id)) {
                    share += parseFloat(e.amount) / e.splitBetweenIds.length;
                }
            });
            const balance = paid - share;
            return `
                        <button class="btn-secondary w-full flex-between p-md" onclick="UI.sendSpecificWhatsApp('${m.id}', '${balance.toFixed(0)}', '${share.toFixed(0)}')">
                            <span>${m.name}</span>
                            <span class="${balance >= 0 ? 'text-success' : 'text-danger'}" style="font-weight: 700">${balance >= 0 ? '+' : ''}${balance.toFixed(0)}</span>
                        </button>
                    `;
        }).join('')}
            </div>
        `;
        this.showModal('Send WhatsApp Summary', html);
    },

    sendSpecificWhatsApp(memberId, balanceVal, shareVal) {
        const trip = store.getCurrentTrip();
        const expenses = store.getTripExpenses(trip.id);
        const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        const member = store.getMembers().find(m => m.id === memberId);
        const templateId = document.getElementById('wa-template-select').value;
        const template = store.data.templates.find(t => t.id === templateId).body;

        const message = template
            .replace('{trip_name}', trip.name)
            .replace('{member_name}', member.name)
            .replace('{total}', total.toFixed(0))
            .replace('{amount}', shareVal);

        window.open(`https://wa.me/${member.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
    },

    showExpenseDetailModal(expenseId) {
        const exp = store.getExpense(expenseId);
        if (!exp) return;

        const payer = store.getMembers().find(m => m.id === exp.paidBy);
        const splitMembers = store.getMembers().filter(m => exp.splitBetweenIds.includes(m.id));
        const currency = store.data.settings.currency === 'INR' ? '₹' : (store.data.settings.currency === 'USD' ? '$' : '€');
        const share = parseFloat(exp.amount) / exp.splitBetweenIds.length;

        const html = `
            <div class="expense-details">
                <div class="flex-between mb-lg">
                    <div>
                        <h2 class="h3">${exp.title}</h2>
                        <span class="text-secondary">${new Date(exp.date).toLocaleString()}</span>
                    </div>
                    <div class="h2 text-primary">${currency}${parseFloat(exp.amount).toLocaleString()}</div>
                </div>
                <div class="detail-label text-secondary mb-xs">Paid By</div>
                <div class="flex-center gap-md mb-lg">
                    ${payer?.photo ? `<img src="${payer.photo}" class="avatar-sm">` : '👤'}
                    <strong>${payer ? payer.name : 'Unknown'}</strong>
                </div>
                <div class="detail-label text-secondary mb-xs">Split Between (${exp.splitBetweenIds.length} members)</div>
                <div class="flex-col gap-sm mb-xl">
                    ${splitMembers.map(m => `
                        <div class="flex-between p-sm glass" style="border-radius: var(--radius-sm)">
                            <div class="flex-center gap-sm">
                                ${m.photo ? `<img src="${m.photo}" style="width: 24px; height: 24px; border-radius: 50%;">` : '👤'}
                                <span>${m.name}</span>
                            </div>
                            <span>${currency}${share.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-outline w-full text-danger border-danger" onclick="UI.handleDeleteExpense('${exp.id}')">Delete Expense</button>
            </div>
        `;
        this.showModal('Expense Details', html);
    },

    handleDeleteExpense(id) {
        if (confirm('Delete this expense?')) {
            store.deleteExpense(id);
            this.hideModal();
            this.renderDashboard();
            this.showToast('Expense deleted');
        }
    },

    renderMembersManagement() {
        const container = document.getElementById('members-list');
        const members = store.getMembers();

        if (members.length === 0) {
            container.innerHTML = '<div class="card glass text-center py-xl w-full">No members found.</div>';
            return;
        }

        container.innerHTML = members.map(m => `
            <div class="card glass animate-in flex-between p-md" style="border-radius: var(--radius-md)">
                <div class="flex-center gap-md" style="cursor: pointer;" onclick="UI.showEditMemberModal('${m.id}')">
                    ${m.photo ? `<img src="${m.photo}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` : '<div style="width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--glass-border)" class="flex-center">👤</div>'}
                    <div>
                        <strong>${m.name}</strong>
                        <p class="text-secondary" style="font-size: 0.75rem">${m.whatsapp}</p>
                    </div>
                </div>
                <div class="flex-center gap-sm">
                    <button class="btn-icon" onclick="UI.showEditMemberModal('${m.id}')">✏️</button>
                    <button class="btn-icon" onclick="UI.handleDeleteMember('${m.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    showEditMemberModal(id) {
        const member = store.getMembers().find(m => m.id === id);
        if (!member) return;

        const html = `
            <form id="edit-member-form">
                <div class="form-group">
                    <label>Member Name</label>
                    <input type="text" id="edit-m-name" required value="${member.name}">
                </div>
                <div class="form-group">
                    <label>WhatsApp Number</label>
                    <input type="tel" id="edit-m-phone" required value="${member.whatsapp}">
                </div>
                <div class="form-group">
                    <label>Photo</label>
                    <input type="file" id="edit-m-photo" accept="image/*">
                    <div id="edit-photo-preview" class="mt-sm">
                        ${member.photo ? `<img src="${member.photo}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">` : ''}
                    </div>
                </div>
                <button type="submit" class="btn-primary w-full mt-md">Update Member</button>
            </form>
        `;
        this.showModal('Edit Member', html);

        let newPhoto = member.photo;
        document.getElementById('edit-m-photo').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    newPhoto = re.target.result;
                    document.getElementById('edit-photo-preview').innerHTML = `<img src="${newPhoto}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('edit-member-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('edit-m-name').value;
            const phone = document.getElementById('edit-m-phone').value;
            store.updateMember(id, { name, whatsapp: phone, photo: newPhoto });
            this.hideModal();
            this.renderMembersManagement();
            this.showToast('Member updated');
        });
    },

    renderTemplatesManagement() {
        const container = document.getElementById('templates-list');
        const templates = store.data.templates;

        container.innerHTML = templates.map(t => `
            <div class="glass p-md mb-md flex-between" style="border-radius: var(--radius-md)">
                <div>
                    <strong>${t.name}</strong>
                    <p class="text-secondary" style="font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${t.body}</p>
                </div>
                <div class="flex-center gap-sm">
                    <button class="btn-icon" onclick="UI.showTemplateModal('${t.id}')">✏️</button>
                    ${t.id !== 'default' ? `<button class="btn-icon" onclick="UI.handleDeleteTemplate('${t.id}')">🗑️</button>` : ''}
                </div>
            </div>
        `).join('');
    },

    showTemplateModal(templateId = null) {
        const template = templateId ? store.data.templates.find(t => t.id === templateId) : { name: '', body: '' };

        const html = `
            <form id="template-form">
                <div class="form-group">
                    <label>Template Name</label>
                    <input type="text" id="tpl-name" required value="${template.name}" placeholder="e.g. Simple Summary">
                </div>
                <div class="form-group">
                    <label>Message Body</label>
                    <textarea id="tpl-body" required rows="6" style="padding: 0.75rem; border-radius: var(--radius-md); background: var(--surface); border: 1px solid var(--glass-border); width: 100%; color: var(--text-main); font-family: inherit;">${template.body}</textarea>
                    <div class="text-muted mt-sm" style="font-size: 0.75rem">
                        Variables: {trip_name}, {member_name}, {amount}, {total}
                    </div>
                </div>
                <button type="submit" class="btn-primary w-full mt-md">${templateId ? 'Update' : 'Create'} Template</button>
            </form>
        `;
        this.showModal(templateId ? 'Edit Template' : 'Create Template', html);

        document.getElementById('template-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('tpl-name').value;
            const body = document.getElementById('tpl-body').value;

            if (templateId) {
                store.updateTemplate(templateId, { name, body });
            } else {
                store.addTemplate({ name, body });
            }

            this.hideModal();
            this.renderTemplatesManagement();
            this.showToast('Template saved');
        });
    },

    handleDeleteTemplate(id) {
        if (confirm('Delete this template?')) {
            store.deleteTemplate(id);
            this.renderTemplatesManagement();
            this.showToast('Template deleted');
        }
    },

    renderSettings() {
        const { theme, currency, timezone } = store.data.settings;
        document.getElementById('settings-theme').value = theme;
        document.getElementById('settings-currency').value = currency;
        document.getElementById('settings-timezone').value = timezone;
        this.renderTemplatesManagement();
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast glass animate-slide-up ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

// Initialize App
const store = new Store();
UI.init();
