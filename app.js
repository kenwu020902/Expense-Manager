// Global state management
let state = {
    trip: {
        name: '',
        destination: '',
        startDate: '',
        endDate: '',
        description: '',
        reminders: []
    },
    participants: [],
    activities: [],
    expenses: [],
    exchangeRates: {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110,
        CAD: 1.25,
        AUD: 1.35,
        INR: 74,
        SGD: 1.35
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    updateTripSummary();
    updateParticipantSelectors();
    updateRemindersList();
    updateParticipantsList();
    updateActivitiesList();
    updateExpensesList();
    updateBudgetVisualization();
    calculateBalances();
});

// Tab switching
function switchTab(tabId) {
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabId) {
            tab.classList.add('active');
        }
    });
    
    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
            content.classList.add('active');
        }
    });
    
    // Update UI elements when switching to specific tabs
    if (tabId === 'participants') {
        updateParticipantsList();
    } else if (tabId === 'itinerary') {
        updateActivityParticipantsCheckboxes();
        updateActivitiesList();
        updateBudgetVisualization();
    } else if (tabId === 'expenses') {
        updateExpenseParticipantsCheckboxes();
        updatePaidBySelect();
        updateExpensesList();
    } else if (tabId === 'balances') {
        calculateBalances();
    }
}

// Trip Details Functions
function saveTripDetails() {
    state.trip = {
        name: document.getElementById('trip-name').value,
        destination: document.getElementById('destination').value,
        startDate: document.getElementById('start-date').value,
        endDate: document.getElementById('end-date').value,
        description: document.getElementById('trip-description').value,
        reminders: state.trip.reminders
    };
    
    saveToLocalStorage();
    updateTripSummary();
    alert('Trip details saved successfully!');
}

function addReminder() {
    const date = document.getElementById('reminder-date').value;
    const time = document.getElementById('reminder-time').value;
    const note = document.getElementById('reminder-note').value;
    
    if (!date || !time || !note) {
        alert('Please fill in all reminder fields');
        return;
    }
    
    const reminder = {
        id: Date.now(),
        date: date,
        time: time,
        note: note
    };
    
    state.trip.reminders.push(reminder);
    updateRemindersList();
    saveToLocalStorage();
    
    // Clear inputs
    document.getElementById('reminder-date').value = '';
    document.getElementById('reminder-time').value = '';
    document.getElementById('reminder-note').value = '';
}

function addToCalendar() {
    if (!state.trip.name || !state.trip.startDate || !state.trip.endDate) {
        alert('Please save trip details first');
        return;
    }
    
    // Create Google Calendar link (simplified)
    const startDate = new Date(state.trip.startDate).toISOString().replace(/-|:|\.\d+/g, '');
    const endDate = new Date(state.trip.endDate).toISOString().replace(/-|:|\.\d+/g, '');
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(state.trip.name)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(state.trip.description)}&location=${encodeURIComponent(state.trip.destination)}`;
    
    window.open(calendarUrl, '_blank');
}

// Participant Functions
function addParticipant() {
    const name = document.getElementById('participant-name').value;
    const budget = parseFloat(document.getElementById('participant-budget').value);
    const currency = document.getElementById('participant-currency').value;
    
    if (!name || isNaN(budget) || budget <= 0) {
        alert('Please enter valid participant details');
        return;
    }
    
    const participant = {
        id: Date.now(),
        name: name,
        budget: budget,
        currency: currency,
        remainingBudget: budget,
        spent: 0,
        color: getRandomColor()
    };
    
    state.participants.push(participant);
    updateParticipantsList();
    updateParticipantSelectors();
    updateBudgetVisualization();
    saveToLocalStorage();
    
    // Clear inputs
    document.getElementById('participant-name').value = '';
    document.getElementById('participant-budget').value = '';
}

// Activity Functions
function updateActivityParticipantsCheckboxes() {
    const container = document.getElementById('activity-participants-checkboxes');
    container.innerHTML = '';
    
    state.participants.forEach(participant => {
        const checkbox = document.createElement('div');
        checkbox.className = 'participant-chip';
        checkbox.innerHTML = `
            <input type="checkbox" id="act-part-${participant.id}" value="${participant.id}" checked>
            <label for="act-part-${participant.id}">${participant.name}</label>
        `;
        container.appendChild(checkbox);
    });
}

function addActivity() {
    const name = document.getElementById('activity-name').value;
    const cost = parseFloat(document.getElementById('activity-cost').value);
    const date = document.getElementById('activity-date').value;
    
    if (!name || isNaN(cost) || cost <= 0 || !date) {
        alert('Please fill in all activity fields');
        return;
    }
    
    // Get selected participants
    const selectedParticipants = [];
    state.participants.forEach(participant => {
        const checkbox = document.getElementById(`act-part-${participant.id}`);
        if (checkbox && checkbox.checked) {
            selectedParticipants.push(participant.id);
        }
    });
    
    if (selectedParticipants.length === 0) {
        alert('Please select at least one participant');
        return;
    }
    
    const activity = {
        id: Date.now(),
        name: name,
        cost: cost,
        date: date,
        participantIds: selectedParticipants
    };
    
    state.activities.push(activity);
    
    // Update participant budgets
    updateParticipantBudgets();
    updateActivitiesList();
    updateBudgetVisualization();
    saveToLocalStorage();
    
    // Clear inputs
    document.getElementById('activity-name').value = '';
    document.getElementById('activity-cost').value = '';
    document.getElementById('activity-date').value = '';
}

// Expense Functions
function updateExpenseParticipantsCheckboxes() {
    const container = document.getElementById('expense-participants-checkboxes');
    container.innerHTML = '';
    
    state.participants.forEach(participant => {
        const checkbox = document.createElement('div');
        checkbox.className = 'participant-chip';
        checkbox.innerHTML = `
            <input type="checkbox" id="exp-part-${participant.id}" value="${participant.id}" checked>
            <label for="exp-part-${participant.id}">${participant.name}</label>
        `;
        container.appendChild(checkbox);
    });
}

function updatePaidBySelect() {
    const select = document.getElementById('paid-by');
    select.innerHTML = '<option value="">Select who paid</option>';
    
    state.participants.forEach(participant => {
        const option = document.createElement('option');
        option.value = participant.id;
        option.textContent = participant.name;
        select.appendChild(option);
    });
}

function addExpense() {
    const description = document.getElementById('expense-description').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const currency = document.getElementById('expense-currency').value;
    const paidBy = document.getElementById('paid-by').value;
    
    if (!description || isNaN(amount) || amount <= 0 || !paidBy) {
        alert('Please fill in all required expense fields');
        return;
    }
    
    // Get selected participants
    const selectedParticipants = [];
    state.participants.forEach(participant => {
        const checkbox = document.getElementById(`exp-part-${participant.id}`);
        if (checkbox && checkbox.checked) {
            selectedParticipants.push(participant.id);
        }
    });
    
    if (selectedParticipants.length === 0) {
        alert('Please select at least one participant to split with');
        return;
    }
    
    const expense = {
        id: Date.now(),
        description: description,
        amount: amount,
        category: category,
        currency: currency,
        paidBy: paidBy,
        participantIds: selectedParticipants,
        date: new Date().toISOString().split('T')[0]
    };
    
    state.expenses.push(expense);
    updateExpensesList();
    calculateBalances();
    saveToLocalStorage();
    
    // Clear inputs
    document.getElementById('expense-description').value = '';
    document.getElementById('expense-amount').value = '';
}

// Balance Functions
function convertToBaseCurrency(amount, fromCurrency) {
    const baseCurrency = document.getElementById('base-currency').value;
    if (fromCurrency === baseCurrency) return amount;
    
    // Convert to USD first, then to base currency
    const amountInUSD = amount / state.exchangeRates[fromCurrency];
    return amountInUSD * state.exchangeRates[baseCurrency];
}

function calculateBalances() {
    const baseCurrency = document.getElementById('base-currency').value;
    const balances = {};
    
    // Initialize balances
    state.participants.forEach(p => {
        balances[p.id] = 0;
    });
    
    // Calculate balances from expenses
    state.expenses.forEach(expense => {
        const splitCount = expense.participantIds.length;
        const sharePerPerson = expense.amount / splitCount;
        
        // Convert to base currency
        const shareInBase = convertToBaseCurrency(sharePerPerson, expense.currency);
        const totalInBase = convertToBaseCurrency(expense.amount, expense.currency);
        
        // Paid person gets credited
        balances[expense.paidBy] += totalInBase;
        
        // Participants get debited
        expense.participantIds.forEach(pid => {
            balances[pid] -= shareInBase;
        });
    });
    
    // Update UI
    updateBalancesSummary(balances, baseCurrency);
}

function settleAll() {
    if (confirm('Mark all balances as settled? This will clear all expense records.')) {
        state.expenses = [];
        updateExpensesList();
        calculateBalances();
        saveToLocalStorage();
        alert('All balances have been marked as settled!');
    }
}

// Currency Converter Functions
function swapCurrencies() {
    const fromSelect = document.getElementById('convert-from');
    const toSelect = document.getElementById('convert-to');
    
    const tempValue = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = tempValue;
    
    convertCurrency();
}

function convertCurrency() {
    const amount = parseFloat(document.getElementById('convert-amount').value);
    const fromCurrency = document.getElementById('convert-from').value;
    const toCurrency = document.getElementById('convert-to').value;
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    // Convert using exchange rates
    const amountInUSD = amount / state.exchangeRates[fromCurrency];
    const convertedAmount = amountInUSD * state.exchangeRates[toCurrency];
    
    const resultElement = document.getElementById('conversion-result');
    resultElement.innerHTML = `
        ${amount.toFixed(2)} ${fromCurrency} = 
        <span style="color: #4facfe;">${convertedAmount.toFixed(2)} ${toCurrency}</span>
    `;
}

// UI Update Functions
function updateTripSummary() {
    const summary = document.getElementById('trip-summary');
    
    if (state.trip.name) {
        summary.innerHTML = `
            <h3><i class="fas fa-umbrella-beach"></i> ${state.trip.name}</h3>
            <p><strong>Destination:</strong> ${state.trip.destination}</p>
            <p><strong>Dates:</strong> ${formatDate(state.trip.startDate)} to ${formatDate(state.trip.endDate)}</p>
            ${state.trip.description ? `<p><strong>Description:</strong> ${state.trip.description}</p>` : ''}
            ${state.trip.reminders.length > 0 ? `<p><strong>Reminders:</strong> ${state.trip.reminders.length} set</p>` : ''}
        `;
    }
}

function updateRemindersList() {
    const container = document.getElementById('reminders-list');
    container.innerHTML = '';
    
    if (state.trip.reminders.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">No reminders set</p>';
        return;
    }
    
    state.trip.reminders.forEach(reminder => {
        const reminderDiv = document.createElement('div');
        reminderDiv.className = 'participant-chip';
        reminderDiv.innerHTML = `
            <i class="fas fa-bell"></i>
            <span>${reminder.note} - ${reminder.date} at ${reminder.time}</span>
            <button onclick="removeReminder(${reminder.id})" style="background: none; border: none; color: #dc3545; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(reminderDiv);
    });
}

function updateParticipantsList() {
    const container = document.getElementById('participants-list');
    container.innerHTML = '';
    
    if (state.participants.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">No participants added yet</p>';
        return;
    }
    
    state.participants.forEach(participant => {
        const percentage = (participant.remainingBudget / participant.budget) * 100;
        const statusClass = percentage > 50 ? 'budget-green' : percentage > 20 ? 'budget-yellow' : 'budget-red';
        
        const card = document.createElement('div');
        card.className = 'participant-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3><i class="fas fa-user" style="color: ${participant.color}"></i> ${participant.name}</h3>
                    <p>Budget: ${participant.budget.toFixed(2)} ${participant.currency}</p>
                    <p>Remaining: <strong>${participant.remainingBudget.toFixed(2)} ${participant.currency}</strong></p>
                    <p>Spent: ${participant.spent.toFixed(2)} ${participant.currency}</p>
                </div>
                <button onclick="removeParticipant(${participant.id})" class="btn btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="budget-bar">
                <div class="budget-fill ${statusClass}" style="width: ${percentage}%;"></div>
            </div>
            ${participant.remainingBudget < 0 ? 
                `<p style="color: #dc3545; margin-top: 10px;">
                    <i class="fas fa-exclamation-triangle"></i> Over budget by ${Math.abs(participant.remainingBudget).toFixed(2)} ${participant.currency}
                </p>` : ''
            }
        `;
        container.appendChild(card);
    });
}

function updateActivitiesList() {
    const container = document.getElementById('activities-list');
    container.innerHTML = '';
    
    if (state.activities.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">No activities planned yet</p>';
        return;
    }
    
    state.activities.forEach(activity => {
        const participantNames = state.participants
            .filter(p => activity.participantIds.includes(p.id))
            .map(p => p.name)
            .join(', ');
        
        const card = document.createElement('div');
        card.className = 'activity-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3><i class="fas fa-hiking"></i> ${activity.name}</h3>
                    <p><strong>Date:</strong> ${formatDate(activity.date)}</p>
                    <p><strong>Cost per person:</strong> ${activity.cost.toFixed(2)}</p>
                    <p><strong>Participants:</strong> ${participantNames}</p>
                    <p><strong>Total cost:</strong> ${(activity.cost * activity.participantIds.length).toFixed(2)}</p>
                </div>
                <button onclick="removeActivity(${activity.id})" class="btn btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateExpensesList() {
    const container = document.getElementById('expenses-list');
    container.innerHTML = '';
    
    if (state.expenses.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">No expenses recorded yet</p>';
        return;
    }
    
    state.expenses.forEach(expense => {
        const paidBy = state.participants.find(p => p.id == expense.paidBy);
        const participantNames = state.participants
            .filter(p => expense.participantIds.includes(p.id))
            .map(p => p.name)
            .join(', ');
        
        const categoryClass = `category-${expense.category}`;
        const categoryNames = {
            food: 'Food & Dining',
            transport: 'Transportation',
            accommodation: 'Accommodation',
            activities: 'Activities',
            shopping: 'Shopping',
            other: 'Other'
        };
        
        const card = document.createElement('div');
        card.className = 'expense-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h3><i class="fas fa-receipt"></i> ${expense.description}</h3>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 10px;">
                        <span class="category-badge ${categoryClass}">
                            ${categoryNames[expense.category]}
                        </span>
                        <span><strong>Amount:</strong> ${expense.amount.toFixed(2)} ${expense.currency}</span>
                        <span><strong>Paid by:</strong> ${paidBy ? paidBy.name : 'Unknown'}</span>
                        <span><strong>Date:</strong> ${formatDate(expense.date)}</span>
                    </div>
                    <p style="margin-top: 10px;"><strong>Split between:</strong> ${participantNames}</p>
                    <p><strong>Share per person:</strong> ${(expense.amount / expense.participantIds.length).toFixed(2)} ${expense.currency}</p>
                </div>
                <button onclick="removeExpense(${expense.id})" class="btn btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateBudgetVisualization() {
    const container = document.getElementById('budget-visualization');
    container.innerHTML = '';
    
    if (state.participants.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">Add participants to see budget visualization</p>';
        return;
    }
    
    state.participants.forEach(participant => {
        const percentage = (participant.remainingBudget / participant.budget) * 100;
        const statusClass = percentage > 50 ? 'budget-green' : percentage > 20 ? 'budget-yellow' : 'budget-red';
        
        const card = document.createElement('div');
        card.className = 'balance-card';
        card.innerHTML = `
            <h3><i class="fas fa-user" style="color: ${participant.color}"></i> ${participant.name}'s Budget</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Original: ${participant.budget.toFixed(2)} ${participant.currency}</span>
                <span>Remaining: <strong>${participant.remainingBudget.toFixed(2)} ${participant.currency}</strong></span>
                <span>Spent: ${participant.spent.toFixed(2)} ${participant.currency}</span>
            </div>
            <div class="budget-bar">
                <div class="budget-fill ${statusClass}" style="width: ${Math.min(percentage, 100)}%;"></div>
            </div>
            ${participant.remainingBudget < 0 ? 
                `<p style="color: #dc3545; margin-top: 10px; font-weight: bold;">
                    <i class="fas fa-exclamation-triangle"></i> OVER BUDGET by ${Math.abs(participant.remainingBudget).toFixed(2)} ${participant.currency}
                </p>` : 
                `<p style="color: #28a745; margin-top: 10px; font-weight: bold;">
                    <i class="fas fa-check-circle"></i> Within budget (${percentage.toFixed(1)}% remaining)
                </p>`
            }
        `;
        container.appendChild(card);
    });
}

function updateBalancesSummary(balances, baseCurrency) {
    const container = document.getElementById('balances-summary');
    container.innerHTML = '';
    
    if (state.participants.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">Add participants and expenses to see balances</p>';
        return;
    }
    
    const settlements = [];
    const creditors = [];
    const debtors = [];
    
    // Separate creditors and debtors
    state.participants.forEach(participant => {
        const balance = balances[participant.id] || 0;
        const balanceFormatted = Math.abs(balance).toFixed(2);
        
        if (balance > 0.01) { // Creditor
            creditors.push({ participant, amount: balance });
        } else if (balance < -0.01) { // Debtor
            debtors.push({ participant, amount: -balance });
        }
        
        const balanceClass = balance > 0.01 ? 'balance-positive' : 
                           balance < -0.01 ? 'balance-negative' : 'balance-zero';
        
        const card = document.createElement('div');
        card.className = 'balance-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3><i class="fas fa-user" style="color: ${participant.color}"></i> ${participant.name}</h3>
                    <p>Balance in ${baseCurrency}:</p>
                </div>
                <div class="${balanceClass}" style="font-size: 1.5rem;">
                    ${balance > 0 ? '+' : ''}${balance.toFixed(2)} ${baseCurrency}
                </div>
            </div>
            ${balance > 0.01 ? 
                `<p style="color: #28a745; margin-top: 10px;">
                    <i class="fas fa-hand-holding-usd"></i> Should receive ${balanceFormatted} ${baseCurrency}
                </p>` : 
             balance < -0.01 ?
                `<p style="color: #dc3545; margin-top: 10px;">
                    <i class="fas fa-money-check-alt"></i> Should pay ${balanceFormatted} ${baseCurrency}
                </p>` :
                `<p style="color: #6c757d; margin-top: 10px;">
                    <i class="fas fa-check-circle"></i> All settled up
                </p>`
            }
        `;
        container.appendChild(card);
    });
    
    // Calculate settlements (simplified)
    if (creditors.length > 0 && debtors.length > 0) {
        const settlementDiv = document.createElement('div');
        settlementDiv.className = 'balance-card';
        settlementDiv.style.background = 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)';
        settlementDiv.innerHTML = `
            <h3><i class="fas fa-handshake"></i> Suggested Settlements</h3>
            <p>To settle all balances:</p>
        `;
        
        let settlementText = '';
        debtors.forEach(debtor => {
            creditors.forEach(creditor => {
                if (debtor.amount > 0 && creditor.amount > 0) {
                    const settleAmount = Math.min(debtor.amount, creditor.amount);
                    if (settleAmount > 0.01) {
                        settlementText += `
                            <p style="margin: 10px 0; padding: 10px; background: white; border-radius: 8px;">
                                <strong>${debtor.participant.name}</strong> should pay 
                                <strong>${creditor.participant.name}</strong>: 
                                ${settleAmount.toFixed(2)} ${baseCurrency}
                            </p>
                        `;
                        debtor.amount -= settleAmount;
                        creditor.amount -= settleAmount;
                    }
                }
            });
        });
        
        if (settlementText) {
            settlementDiv.innerHTML += settlementText;
        } else {
            settlementDiv.innerHTML += '<p style="color: #666; font-style: italic;">No settlements needed</p>';
        }
        
        container.appendChild(settlementDiv);
    }
}

function updateParticipantBudgets() {
    // Reset all participants
    state.participants.forEach(p => {
        p.remainingBudget = p.budget;
        p.spent = 0;
    });
    
    // Apply activity costs
    state.activities.forEach(activity => {
        const costPerPerson = activity.cost;
        activity.participantIds.forEach(pid => {
            const participant = state.participants.find(p => p.id === pid);
            if (participant) {
                participant.spent += costPerPerson;
                participant.remainingBudget -= costPerPerson;
            }
        });
    });
}

function updateParticipantSelectors() {
    // This function ensures all participant-based selectors are updated
    updateActivityParticipantsCheckboxes();
    updateExpenseParticipantsCheckboxes();
    updatePaidBySelect();
}

// Helper Functions
function getRandomColor() {
    const colors = ['#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#ff9a9e', '#fad0c4', '#a1c4fd', '#ffecd2'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function formatDate(dateString) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function removeReminder(id) {
    state.trip.reminders = state.trip.reminders.filter(r => r.id !== id);
    updateRemindersList();
    saveToLocalStorage();
}

function removeParticipant(id) {
    if (confirm('Are you sure? This will remove all related activities and expenses.')) {
        // Remove participant
        state.participants = state.participants.filter(p => p.id !== id);
        
        // Remove from activities
        state.activities.forEach(activity => {
            activity.participantIds = activity.participantIds.filter(pid => pid !== id);
        });
        state.activities = state.activities.filter(a => a.participantIds.length > 0);
        
        // Remove from expenses
        state.expenses.forEach(expense => {
            expense.participantIds = expense.participantIds.filter(pid => pid !== id);
        });
        state.expenses = state.expenses.filter(e => e.participantIds.length > 0);
        
        updateParticipantsList();
        updateParticipantSelectors();
        updateActivitiesList();
        updateExpensesList();
        updateBudgetVisualization();
        calculateBalances();
        saveToLocalStorage();
    }
}

function removeActivity(id) {
    state.activities = state.activities.filter(a => a.id !== id);
    updateParticipantBudgets();
    updateActivitiesList();
    updateBudgetVisualization();
    saveToLocalStorage();
}

function removeExpense(id) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    updateExpensesList();
    calculateBalances();
    saveToLocalStorage();
}

// Local Storage Functions
function saveToLocalStorage() {
    localStorage.setItem('tripPlannerState', JSON.stringify(state));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('tripPlannerState');
    if (saved) {
        state = JSON.parse(saved);
    }
}

// Set today's date as default for date inputs
document.getElementById('start-date').valueAsDate = new Date();
const endDate = new Date();
endDate.setDate(endDate.getDate() + 7);
document.getElementById('end-date').valueAsDate = endDate;
document.getElementById('activity-date').valueAsDate = new Date();
document.getElementById('reminder-date').valueAsDate = new Date();
