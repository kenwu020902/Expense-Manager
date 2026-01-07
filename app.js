// Global State
const state = {
    tripName: "Bali Trip 2024",
    participants: [],
    activities: [],
    expenses: [],
    exchangeRates: {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.5,
        INR: 74.3
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupTabs();
    updateUI();
    setupCurrencyConverter();
});

// Tab Navigation
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
            
            // Update specific tab data
            if (tabId === 'activities') updateActivityParticipants();
            if (tabId === 'expenses') updateExpenseForm();
        });
    });
}

// Load/Save Data
function loadData() {
    const saved = localStorage.getItem('tripPlannerData');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(state, data);
    }
    
    // Add default participants if empty
    if (state.participants.length === 0) {
        state.participants = [
            { id: 1, name: "You", budget: 1000, currency: "USD" },
            { id: 2, name: "Friend", budget: 800, currency: "USD" },
            { id: 3, name: "Partner", budget: 1200, currency: "USD" }
        ];
    }
}

function saveData() {
    localStorage.setItem('tripPlannerData', JSON.stringify(state));
}

// Update All UI
function updateUI() {
    updatePeopleList();
    updateActivitiesList();
    updateExpensesList();
    updateBalances();
    updateTotalCost();
}

// PARTICIPANTS FUNCTIONS
function addPerson() {
    const name = document.getElementById('personName').value.trim();
    const budget = document.getElementById('personBudget').value;
    const currency = document.getElementById('personCurrency').value;
    
    if (!name) {
        alert("Please enter a name");
        return;
    }
    
    const newPerson = {
        id: Date.now(),
        name: name,
        budget: budget ? parseFloat(budget) : 0,
        currency: currency
    };
    
    state.participants.push(newPerson);
    saveData();
    updateUI();
    
    // Clear inputs
    document.getElementById('personName').value = '';
    document.getElementById('personBudget').value = '';
}

function updatePeopleList() {
    const container = document.getElementById('peopleList');
    if (state.participants.length === 0) {
        container.innerHTML = '<div class="list-item">No participants added yet.</div>';
        return;
    }
    
    container.innerHTML = state.participants.map(person => `
        <div class="list-item">
            <div>
                <strong>${person.name}</strong>
                <div class="small-text">
                    Budget: ${formatCurrency(person.budget, person.currency)}
                </div>
            </div>
            <button class="delete-btn" onclick="deletePerson(${person.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function deletePerson(id) {
    state.participants = state.participants.filter(p => p.id !== id);
    saveData();
    updateUI();
}

// ACTIVITIES FUNCTIONS
function addActivity() {
    const name = document.getElementById('activityName').value.trim();
    const cost = parseFloat(document.getElementById('activityCost').value);
    const currency = document.getElementById('activityCurrency').value;
    
    if (!name || !cost) {
        alert("Please fill all fields");
        return;
    }
    
    // Get selected participants
    const selectedParticipants = [];
    document.querySelectorAll('#activityParticipants input:checked').forEach(cb => {
        selectedParticipants.push(parseInt(cb.value));
    });
    
    if (selectedParticipants.length === 0) {
        alert("Please select at least one participant");
        return;
    }
    
    const newActivity = {
        id: Date.now(),
        name: name,
        cost: cost,
        currency: currency,
        participantIds: selectedParticipants,
        costPerPerson: cost / selectedParticipants.length
    };
    
    state.activities.push(newActivity);
    saveData();
    updateUI();
    
    // Clear inputs
    document.getElementById('activityName').value = '';
    document.getElementById('activityCost').value = '';
}

function updateActivityParticipants() {
    const container = document.getElementById('activityParticipants');
    container.innerHTML = state.participants.map(person => `
        <label class="checkbox-item">
            <input type="checkbox" value="${person.id}" checked>
            ${person.name}
        </label>
    `).join('');
}

function updateActivitiesList() {
    const container = document.getElementById('activitiesList');
    if (state.activities.length === 0) {
        container.innerHTML = '<div class="list-item">No activities planned yet.</div>';
        return;
    }
    
    container.innerHTML = state.activities.map(activity => {
        const participants = activity.participantIds.map(id => {
            const person = state.participants.find(p => p.id === id);
            return person ? person.name : 'Unknown';
        }).join(', ');
        
        return `
            <div class="list-item">
                <div>
                    <strong>${activity.name}</strong>
                    <div class="small-text">
                        Cost: ${formatCurrency(activity.cost, activity.currency)} 
                        | ${formatCurrency(activity.costPerPerson, activity.currency)} per person
                    </div>
                    <div class="small-text">
                        Participants: ${participants}
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteActivity(${activity.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

function deleteActivity(id) {
    state.activities = state.activities.filter(a => a.id !== id);
    saveData();
    updateUI();
}

// EXPENSES FUNCTIONS
function updateExpenseForm() {
    const paidBySelect = document.getElementById('expensePaidBy');
    const splitContainer = document.getElementById('splitParticipants');
    
    // Update "Paid By" dropdown
    paidBySelect.innerHTML = state.participants.map(p => 
        `<option value="${p.id}">${p.name}</option>`
    ).join('');
    
    // Update split checkboxes
    splitContainer.innerHTML = state.participants.map(p => `
        <label class="checkbox-item">
            <input type="checkbox" value="${p.id}" checked>
            ${p.name}
        </label>
    `).join('');
}

function addExpense() {
    const desc = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const currency = document.getElementById('expenseCurrency').value;
    const paidById = parseInt(document.getElementById('expensePaidBy').value);
    
    if (!desc || !amount) {
        alert("Please fill all fields");
        return;
    }
    
    // Get selected participants for splitting
    const splitBetween = [];
    document.querySelectorAll('#splitParticipants input:checked').forEach(cb => {
        splitBetween.push(parseInt(cb.value));
    });
    
    if (splitBetween.length === 0) {
        alert("Please select at least one person to split with");
        return;
    }
    
    const newExpense = {
        id: Date.now(),
        description: desc,
        amount: amount,
        currency: currency,
        paidById: paidById,
        splitBetween: splitBetween,
        date: new Date().toLocaleDateString(),
        category: 'other'
    };
    
    state.expenses.push(newExpense);
    saveData();
    updateUI();
    
    // Clear inputs
    document.getElementById('expenseDesc').value = '';
    document.getElementById('expenseAmount').value = '';
}

function splitEqually() {
    // All checkboxes will be checked by default already
    alert("Splitting equally between selected participants");
}

function splitByPercentage() {
    alert("Percentage split feature coming soon!");
}

function updateExpensesList() {
    const container = document.getElementById('expensesList');
    if (state.expenses.length === 0) {
        container.innerHTML = '<div class="list-item">No expenses added yet.</div>';
        return;
    }
    
    container.innerHTML = state.expenses.map(expense => {
        const paidBy = state.participants.find(p => p.id === expense.paidById)?.name || 'Unknown';
        const splitCount = expense.splitBetween.length;
        
        return `
            <div class="list-item">
                <div>
                    <strong>${expense.description}</strong>
                    <div class="small-text">
                        ${formatCurrency(expense.amount, expense.currency)} 
                        | Paid by: ${paidBy}
                    </div>
                    <div class="small-text">
                        Split between ${splitCount} people
                        (${formatCurrency(expense.amount/splitCount, expense.currency)} each)
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteExpense(${expense.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

function deleteExpense(id) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveData();
    updateUI();
}

// BALANCE CALCULATIONS
function updateBalances() {
    const container = document.getElementById('balancesList');
    
    // Calculate balances in USD for simplicity
    const balances = {};
    state.participants.forEach(p => balances[p.id] = 0);
    
    // Process expenses
    state.expenses.forEach(expense => {
        const share = expense.amount / expense.splitBetween.length;
        const paidById = expense.paidById;
        
        // Convert to USD for calculations
        const amountUSD = convertCurrency(expense.amount, expense.currency, 'USD');
        const shareUSD = amountUSD / expense.splitBetween.length;
        
        balances[paidById] += amountUSD;
        
        expense.splitBetween.forEach(pid => {
            if (pid !== paidById) {
                balances[pid] -= shareUSD;
            }
        });
    });
    
    // Process activities
    state.activities.forEach(activity => {
        const share = activity.costPerPerson;
        const shareUSD = convertCurrency(share, activity.currency, 'USD');
        
        activity.participantIds.forEach(pid => {
            balances[pid] -= shareUSD;
        });
    });
    
    // Display balances
    let html = '';
    state.participants.forEach(person => {
        const balance = balances[person.id];
        const balanceInPersonCurrency = convertCurrency(balance, 'USD', person.currency);
        
        html += `
            <div class="list-item">
                <strong>${person.name}</strong>
                <span class="${balance >= 0 ? 'positive' : 'negative'}">
                    ${balance >= 0 ? 'Gets' : 'Owes'} 
                    ${formatCurrency(Math.abs(balanceInPersonCurrency), person.currency)}
                </span>
            </div>
        `;
    });
    
    container.innerHTML = html || '<div class="list-item">No balances to calculate yet.</div>';
    
    // Update total owed
    const totalOwed = Object.values(balances)
        .filter(b => b < 0)
        .reduce((sum, b) => sum + Math.abs(b), 0);
    
    document.getElementById('totalOwed').textContent = formatCurrency(totalOwed, 'USD');
}

function updateTotalCost() {
    let total = 0;
    
    // Add all expenses in USD
    state.expenses.forEach(exp => {
        total += convertCurrency(exp.amount, exp.currency, 'USD');
    });
    
    // Add all activities in USD
    state.activities.forEach(act => {
        total += convertCurrency(act.cost, act.currency, 'USD');
    });
    
    document.getElementById('totalCost').textContent = formatCurrency(total, 'USD');
    document.getElementById('totalBalance').textContent = formatCurrency(total, 'USD');
}

// CURRENCY FUNCTIONS
function setupCurrencyConverter() {
    // Set default values
    document.getElementById('convertAmount').value = '100';
}

function convertCurrency() {
    const amount = parseFloat(document.getElementById('convertAmount').value);
    const from = document.getElementById('convertFrom').value;
    const to = document.getElementById('convertTo').value;
    
    if (!amount || amount <= 0) {
        alert("Please enter a valid amount");
        return;
    }
    
    const result = convertCurrencyAmount(amount, from, to);
    const container = document.getElementById('conversionResult');
    
    container.innerHTML = `
        ${formatCurrency(amount, from)} = 
        <strong>${formatCurrency(result, to)}</strong>
    `;
}

function convertCurrencyAmount(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to USD first, then to target currency
    const inUSD = amount / state.exchangeRates[fromCurrency];
    const result = inUSD * state.exchangeRates[toCurrency];
    
    return parseFloat(result.toFixed(2));
}

function convertCurrency(amount, fromCurrency, toCurrency) {
    return convertCurrencyAmount(amount, fromCurrency, toCurrency);
}

function formatCurrency(amount, currency) {
    if (isNaN(amount)) amount = 0;
    
    const symbols = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        INR: '₹'
    };
    
    const symbol = symbols[currency] || currency;
    
    if (currency === 'JPY') {
        return `${symbol}${Math.round(amount)}`;
    }
    
    return `${symbol}${amount.toFixed(2)}`;
}

// Helper function for small text
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .small-text {
            font-size: 0.85rem;
            color: #666;
            margin-top: 4px;
        }
        .positive { color: #4CAF50; }
        .negative { color: #f44336; }
    </style>
`);
