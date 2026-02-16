/**
 * NEXUS FINANCE ENGINE - V2.5 (FINANCIAL LOGIC + DATE FILTER)
 */

class NexusApp {
    constructor() {
        this.storageKey = 'NEXUS_CORE_DATA_V2.5';
        this.state = this.initStorage();
        this.bindEvents();
        this.render();
    }

    initStorage() {
        const data = localStorage.getItem(this.storageKey);
        if (data) return JSON.parse(data);

        const initial = {
            users: [{ id: 1, name: "Admin Nexus", role: "admin", budget: 40000, cats: ["Arriendo", "Servicios", "Nómina", "Ventas", "Donaciones"] }],
            transactions: [],
            activeUserId: 1
        };
        localStorage.setItem(this.storageKey, JSON.stringify(initial));
        return initial;
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        this.render();
    }

    // --- LOGICA DE TRANSACCIONES ---
    handleTxSubmit(e) {
        e.preventDefault();
        const editId = document.getElementById('tx-edit-id').value;

        const txData = {
            desc: document.getElementById('tx-desc').value,
            amount: parseFloat(document.getElementById('tx-amount').value),
            type: document.getElementById('tx-type').value,
            category: document.getElementById('tx-category').value,
            date: document.getElementById('tx-date').value,
            userId: this.state.activeUserId
        };

        if (editId) {
            const index = this.state.transactions.findIndex(t => t.id == editId);
            if (index !== -1) {
                this.state.transactions[index] = { ...this.state.transactions[index], ...txData };
            }
        } else {
            this.state.transactions.push({ id: Date.now(), ...txData });
        }

        ui.resetForm();
        this.save();
    }

    startEdit(id) {
        const tx = this.state.transactions.find(t => t.id == id);
        if (!tx) return;

        document.getElementById('tx-edit-id').value = tx.id;
        document.getElementById('tx-desc').value = tx.desc;
        document.getElementById('tx-amount').value = tx.amount;
        document.getElementById('tx-type').value = tx.type;
        document.getElementById('tx-category').value = tx.category;
        document.getElementById('tx-date').value = tx.date;

        document.getElementById('form-title').innerHTML = '<i class="bi bi-pencil-fill text-yellow-500"></i> Editando Movimiento';
        document.getElementById('btn-submit').innerText = 'Guardar Cambios';
        document.getElementById('btn-submit').classList.replace('bg-emerald-600', 'bg-yellow-600');
        document.getElementById('btn-cancel-edit').classList.remove('hidden');

        document.getElementById('form-tx').scrollIntoView({ behavior: 'smooth' });
    }

    deleteTx(id) {
        if (confirm('¿Eliminar este registro financiero?')) {
            this.state.transactions = this.state.transactions.filter(t => t.id !== id);
            this.save();
        }
    }

    // --- PERFILES ---
    registerUser() {
        const name = document.getElementById('new-u-name').value;
        const role = document.getElementById('new-u-role').value;
        if (!name) return alert('Ingrese un nombre');

        const newUser = { id: Date.now(), name, role, budget: 10000, cats: ["Arriendo", "Servicios", "Nómina", "Ventas", "Donaciones", "Publicidad"] };
        this.state.users.push(newUser);
        ui.hideModal('modal-user');
        this.save();
    }

    updateBudget() {
        const amount = document.getElementById('input-budget').value;
        const user = this.state.users.find(u => u.id === this.state.activeUserId);
        user.budget = parseFloat(amount) || 0;
        ui.hideModal('modal-budget');
        this.save();
    }

    // --- RENDERIZADO ---
    render() {
        const user = this.state.users.find(u => u.id === this.state.activeUserId);
        const filterText = document.getElementById('tx-filter').value.toLowerCase();
        const filterFrom = document.getElementById('tx-filter-from').value;
        const filterTo = document.getElementById('tx-filter-to').value;

        document.getElementById('nav-user-name').innerText = user.name;
        document.getElementById('nav-user-role').innerText = user.role;

        const selector = document.getElementById('userSelector');
        selector.innerHTML = this.state.users.map(u => `<option value="${u.id}" ${u.id === user.id ? 'selected' : ''}>${u.name}</option>`).join('');

        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        if (user.role === 'admin') {
            document.getElementById('view-admin').classList.add('active');
            this.renderAdmin();
        } else {
            document.getElementById('view-user').classList.add('active');
            this.renderUser(user, filterText, filterFrom, filterTo);
        }
    }

    renderUser(user, filter, filterFrom, filterTo) {
        const uTxs = this.state.transactions.filter(t => t.userId === user.id);

        // 1. LÓGICA FINANCIERA SOLICITADA
        const incomeReal = uTxs.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
        const expenseReal = uTxs.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
        const balance = incomeReal - expenseReal; // Balance = Ingresos - Gastos
        const diff = expenseReal - user.budget;   // Diferencia = Real - Presupuesto

        // 2. ACTUALIZAR DASHBOARD
        document.getElementById('u-balance').innerText = `$${balance.toLocaleString()}`;
        document.getElementById('u-total-income').innerText = `$${incomeReal.toLocaleString()}`;
        document.getElementById('u-total-expense').innerText = `$${expenseReal.toLocaleString()}`;
        document.getElementById('u-budget').innerText = `$${user.budget.toLocaleString()}`;

        // Interpretación: Superávit vs Déficit
        const statusEl = document.getElementById('u-status');
        if (balance > 0) {
            statusEl.innerText = "Superávit";
            statusEl.className = "text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500";
        } else if (balance < 0) {
            statusEl.innerText = "Déficit";
            statusEl.className = "text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-500";
        } else {
            statusEl.innerText = "Equilibrio";
            statusEl.className = "text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-500/20 text-slate-500";
        }

        // Diferencia Presupuesto
        const diffEl = document.getElementById('u-diff');
        diffEl.innerText = `${diff <= 0 ? 'Ahorro:' : 'Exceso:'} $${Math.abs(diff).toLocaleString()}`;
        diffEl.className = `text-[10px] font-mono mt-1 ${diff <= 0 ? 'text-emerald-500' : 'text-red-500'}`;

        document.getElementById('tx-category').innerHTML = user.cats.map(c => `<option value="${c}">${c}</option>`).join('');

        // 3. RENDER TABLA CON FILTROS
        const tbody = document.getElementById('table-tx');
        tbody.innerHTML = uTxs.filter(t => {
            const matchText = t.desc.toLowerCase().includes(filter) || t.category.toLowerCase().includes(filter);
            const matchFrom = !filterFrom || t.date >= filterFrom;
            const matchTo = !filterTo || t.date <= filterTo;
            return matchText && matchFrom && matchTo;
        }).reverse().map(t => `
            <tr class="hover:bg-slate-800/40 transition-colors group">
                <td class="p-4 text-slate-500 font-mono text-xs">${t.date}</td>
                <td class="p-4"><span class="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700 uppercase font-bold">${t.category}</span></td>
                <td class="p-4 font-semibold text-slate-200">${t.desc}</td>
                <td class="p-4 font-mono font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}">
                    ${t.type === 'income' ? '+' : '-'}$${t.amount.toLocaleString()}
                </td>
                <td class="p-4 text-center">
                    <div class="flex justify-center gap-3">
                        <button onclick="app.startEdit(${t.id})" class="text-slate-500 hover:text-yellow-500 transition-colors"><i class="bi bi-pencil-square"></i></button>
                        <button onclick="app.deleteTx(${t.id})" class="text-slate-500 hover:text-red-500 transition-colors"><i class="bi bi-trash-fill"></i></button>
                    </div>
                </td>
            </tr>
        `).join('') || `<tr><td colspan="5" class="p-10 text-center text-slate-600 italic">Sin registros</td></tr>`;
    }

    renderAdmin() {
        const grid = document.getElementById('admin-grid');
        grid.innerHTML = this.state.users.filter(u => u.role === 'user').map(u => {
            const expense = this.state.transactions.filter(t => t.userId === u.id && t.type === 'expense').reduce((a, b) => a + b.amount, 0);
            const isOver = expense > u.budget;
            return `
                <div class="bg-slate-900 p-6 rounded-2xl border ${isOver ? 'border-red-500/40' : 'border-slate-800'}">
                    <div class="flex justify-between items-start mb-4">
                        <h4 class="font-bold text-white">${u.name}</h4>
                        <i class="bi ${isOver ? 'bi-exclamation-triangle text-red-500' : 'bi-check-circle text-emerald-500'}"></i>
                    </div>
                    <div class="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-2">
                        <div class="h-full ${isOver ? 'bg-red-500' : 'bg-emerald-500'}" style="width: ${Math.min((expense / u.budget) * 100, 100)}%"></div>
                    </div>
                    <p class="text-[10px] font-mono text-slate-500 text-right">$${expense.toLocaleString()} / $${u.budget.toLocaleString()}</p>
                </div>
            `;
        }).join('') || '<p class="text-slate-500 col-span-3 text-center">No hay usuarios para auditar.</p>';
    }

    bindEvents() {
        document.getElementById('userSelector').onchange = (e) => {
            this.state.activeUserId = parseInt(e.target.value);
            ui.resetForm();
            this.save();
        };
        document.getElementById('form-tx').onsubmit = (e) => this.handleTxSubmit(e);
        document.getElementById('tx-filter').oninput = () => this.render();
        document.getElementById('tx-filter-from').onchange = () => this.render();
        document.getElementById('tx-filter-to').onchange = () => this.render();
    }
}

const ui = {
    showModal: (id) => document.getElementById(id).classList.remove('hidden'),
    hideModal: (id) => document.getElementById(id).classList.add('hidden'),
    resetForm: () => {
        const f = document.getElementById('form-tx');
        f.reset();
        document.getElementById('tx-edit-id').value = '';
        document.getElementById('form-title').innerHTML = '<i class="bi bi-plus-circle-fill text-emerald-500"></i> Nueva Transacción';
        document.getElementById('btn-submit').innerText = 'Registrar';
        document.getElementById('btn-submit').classList.replace('bg-yellow-600', 'bg-emerald-600');
        document.getElementById('btn-cancel-edit').classList.add('hidden');
    },
    resetFilters: () => {
        document.getElementById('tx-filter').value = '';
        document.getElementById('tx-filter-from').value = '';
        document.getElementById('tx-filter-to').value = '';
        app.render();
    }
};

const app = new NexusApp();