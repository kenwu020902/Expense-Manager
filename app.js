// Global State
const state = {
    currentStep: 1,
    trip: {
        name: "Bali Vacation",
        dates: "Jan 15-22, 2024",
        destination: "Bali, Indonesia",
        baseCurrency: "USD",
        description: "Beach vacation with friends"
    },
    participants: [],
    activities: [],
    expenses: [],
    exchangeRates: {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.5,
        INR: 74.3,
        AUD: 1.35,
        CAD: 1.25,
        SGD: 1.34,
        MYR: 4.18,
        THB: 33.5
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateStepDisplay();
    updateActivityParticipants();
    updateExpenseForm();
    updateSummary();
    
    // Set today as default date
    document.getElementById('activityDate').valueAsDate = new Date();
});

// Step Navigation
function nextStep() {
    if (state.currentStep < 5) {
        state.currentStep++;
        updateStepDisplay();
        
        // Update specific step data when entering
        if (state.currentStep === 3) updateActivityParticipants();
        if (state.currentStep === 4) updateExpenseForm();
        if (state.currentStep === 5) {
            convertCurrency(); // Auto-convert on entering currency step
            updateSummary();
        }
    }
}

function prevStep() {
    if (state.currentStep > 1) {
        state.currentStep--;
        updateStepDisplay();
    }
}

function updateStepDisplay() {
    // Update step indicators
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
        const stepNum = parseInt(step.dataset.step);
        if (stepNum === state.currentStep) {
            step.classList.add('active');
        } else if (stepNum < state.currentStep) {
            step.querySelector('.step-number').style.background = '#4CAF50';
        }
    });
    
    // Update step content
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`step${state.currentStep}`).classList.add('active');
    
    // Update buttons
    document.getElementById('prevBtn').disabled = state.currentStep === 1;
    document.getElementById('nextBtn').innerHTML = state.currentStep === 5 
        ? 'Finish <i class="fas fa-check"></i>' 
        : 'Next <i class="fas fa-arrow-right"></i>';
    
    saveData();
}

// Load/Save Data
function loadData() {
    const saved = localStorage.getItem('tripData');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(state, data);
        
        // Update UI from saved state
        document.getElementById('tripName').value = state.trip.name;
        document.getElementById('tripDates').value = state.trip.dates;
        document.getElementById('destination').value = state.trip.destination;
        document.getElementById('baseCurrency').value = state.trip.baseCurrency;
        document.getElementById('tripDescription').value = state.trip.description;
        
        updateParticipantsDisplay();
        updateActivitiesDisplay();
        updateExpensesDisplay();
    }
}

function saveData() {
    // Save trip info
    state.trip.name = document.getElementById('tripName').value;
    state.trip.dates = document.getElementById('tripDates').value;
    state.trip.destination = document.getElementById('destination').value;
    state.trip.baseCurrency = document.getElementById('baseCurrency').value;
    state.trip.description = document.getElementById('tripDescription').value;
    
    localStorage.setItem('tripData', JSON.stringify(state));
}

// Participants
function addParticipant() {
    const name = document.getElementById('personName').value.trim();
    const budget = parseFloat(document.getElementById('personBudget').value) || 0;
    const currency = document.getElementById('personCurrency').value;
    
    if (!name) {
        alert("Please enter a name");
        return;
    }
    
    const newPerson = {
        id: Date.now(),
        name: name,
        budget: budget,
        currency: currency
    };
    
    state.participants.push(newPerson);
    updateParticipantsDisplay();
    saveData();
    
    // Clear inputs
    document.getElementById('personName').value = '';
    document.getElementById('personBudget').value = '';
}

function updateParticipantsDisplay() {
    const container = document.getElementById('participantsContainer');
    
    if (state.participants.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px; background: white; border-radius: 10px;">No participants added yet</div>';
        return;
    }
    
    container.innerHTML = state.participants.map(person => `
        <div style="background: white; padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #4CAF50;">
            <div>
                <strong>${person.name}</strong>
                <div style="font-size: 0.9em; color: #666;">
                    Budget: ${formatCurrency(person.budget, person.currency)}
                </div>
            </div>
            <button onclick="deleteParticipant(${person.id})" style="background: #ff6b6b; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function deleteParticipant(id) {
    state.participants = state.participants.filter(p => p.id !== id);
    updateParticipantsDisplay();
    saveData();
}

// Activities
function updateActivityParticipants() {
    const container = document.getElementById('activityParticipantsCheckboxes');
    
    if (state.participants.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Add participants in Step 2 first</div>';
        return;
    }
    
    container.innerHTML = state.participants.map(person => `
        <label class="checkbox-item">
            <input type="checkbox" value="${person.id}" checked>
            ${person.name}
        </label>
    `).join('');
}

function addActivity() {
    const name = document.getElementById('activityName').value.trim();
    const date = document.getElementById('activityDate').value;
    const description = document.getElementById('activityDescription').value;
    
    if (!name) {
        alert("Please enter an activity name");
        return;
    }
    
    // Get selected participants
    const selectedParticipants = [];
    document.querySelectorAll('#activityParticipantsCheckboxes input:checked').forEach(cb => {
        selectedParticipants.push(parseInt(cb.value));
    });
    
    if (selectedParticipants.length === 0) {
        alert("Please select at least one participant");
        return;
    }
    
    const newActivity = {
        id: Date.now(),
        name: name,
        date: date,
        description: description,
        participantIds: selectedParticipants,
        cost: 0 // Will be set when expenses are added
    };
    
    state.activities.push(newActivity);
    updateActivitiesDisplay();
    saveData();
    
    // Clear inputs
    document.getElementById('activityName').value = '';
    document.getElementById('activityDescription').value = '';
}

function updateActivitiesDisplay() {
    const container = document.getElementById('activitiesContainer');
    
    if (state.activities.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px; background: white; border-radius: 10px;">No activities planned yet</div>';
        return;
    }
    
    container.innerHTML = state.activities.map(activity => {
        const participants = activity.participantIds.map(id => {
            const person = state.participants.find(p => p.id === id);
            return person ? person.name : 'Unknown';
        }).join(', ');
        
        return `
            <div style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #2196F3;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <strong>${activity.name}</strong>
                        <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                            <i class="far fa-calendar"></i> ${activity.date}
                        </div>
                        <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                            <i class="fas fa-users"></i> ${participants}
                        </div>
                        ${activity.description ? `<div style="font-size: 0.9em; color: #777; margin-top: 5px;">${activity.description}</div>` : ''}
                    </div>
                    <button onclick="deleteActivity(${activity.id})" style="background: #ff6b6b; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteActivity(id) {
    state.activities = state.activities.filter(a => a.id !== id);
    updateActivitiesDisplay();
    saveData();
}

// Expenses
function updateExpenseForm() {
    const paidBySelect = document.getElementById('paidBy');
    const splitContainer = document.getElementById('splitCheckboxes');
    
    // Update "Paid By" dropdown
    paidBySelect.innerHTML = '<option value="">Select who paid</option>' + 
        state.participants.map(p => 
            `<option value="${p.id}">${p.name}</option>`
        ).join('');
    
    // Update split checkboxes
    if (state.participants.length === 0) {
        splitContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Add participants first</div>';
    } else {
        splitContainer.innerHTML = state.participants.map(p => `
            <label class="checkbox-item">
                <input type="checkbox" value="${p.id}" checked>
                ${p.name}
            </label>
        `).join('');
    }
}

function addExpense() {
    const name = document.getElementById('expenseName').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const currency = document.getElementById('expenseCurrency').value;
    const paidById = parseInt(document.getElementById('paidBy').value);
    const category = document.getElementById('expenseCategory').value;
    
    if (!name || !amount || !paidById) {
        alert("Please fill all required fields");
        return;
    }
    
    // Get selected participants for splitting
    const splitBetween = [];
    document.querySelectorAll('#splitCheckboxes input:checked').forEach(cb => {
        splitBetween.push(parseInt(cb.value));
    });
    
    if (splitBetween.length === 0) {
        alert("Please select at least one person to split with");
        return;
    }
    
    const newExpense = {
        id: Date.now(),
        name: name,
        amount: amount,
        currency: currency,
        paidById: paidById,
        category: category,
        splitBetween: splitBetween,
        date: new Date().toLocaleDateString()
    };
    
    state.expenses.push(newExpense);
    updateExpensesDisplay();
    saveData();
    
    // Clear inputs
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
}

function updateExpensesDisplay() {
    const container = document.getElementById('expensesContainer');
    
    if (state.expenses.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px; background: white; border-radius: 10px;">No expenses added yet</div>';
        return;
    }
    
    container.innerHTML = state.expenses.map(expense => {
        const paidBy = state.participants.find(p => p.id === expense.paidById)?.name || 'Unknown';
        const splitCount = expense.splitBetween.length;
        const share = expense.amount / splitCount;
        
        const categoryIcons = {
            food: '🍕',
            transport: '🚗',
            accommodation: '🏨',
            activities: '🎭',
            shopping: '🛍️',
            other: '📦'
        };
        
        return `
            <div style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #FF9800;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <strong>${categoryIcons[expense.category] || '📦'} ${expense.name}</strong>
                        <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                            ${formatCurrency(expense.amount, expense.currency)} 
                            | Paid by: ${paidBy}
                        </div>
                        <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                            Split ${splitCount} ways (${formatCurrency(share, expense.currency)} each)
                        </div>
                    </div>
                    <button onclick="deleteExpense(${expense.id})" style="background: #ff6b6b; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteExpense(id) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    updateExpensesDisplay();
    saveData();
}

// Currency Converter
function swapCurrencies() {
    const fromCurrency = document.getElementById('convertFromCurrency');
    const toCurrency = document.getElementById('convertToCurrency');
    const fromAmount = document.getElementById('convertFromAmount');
    const toAmount = document.getElementById('convertToAmount');
    
    // Swap currencies
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    
    // Swap amounts if toAmount has value
    if (toAmount.value) {
        const tempAmount = fromAmount.value;
        fromAmount.value = toAmount.value;
        toAmount.value = tempAmount;
    }
    
    convertCurrency();
}

function convertCurrency() {
    const amount = parseFloat(document.getElementById('convertFromAmount').value);
    const fromCurrency = document.getElementById('convertFromCurrency').value;
    const toCurrency = document.getElementById('convertToCurrency').value;
    
    if (!amount || amount <= 0) {
        document.getElementById('conversionResult').style.display = 'none';
        document.getElementById('convertToAmount').value = '';
        return;
    }
    
    const result = convertCurrencyAmount(amount, fromCurrency, toCurrency);
    
    document.getElementById('convertToAmount').value = result.toFixed(2);
    
    const resultDiv = document.getElementById('conversionResult');
    resultDiv.innerHTML = `
        ${formatCurrency(amount, fromCurrency)} = 
        ${formatCurrency(result, toCurrency)}
    `;
    resultDiv.style.display = 'block';
}

function convertCurrencyAmount(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to USD first, then to target currency
    const inUSD = amount / state.exchangeRates[fromCurrency];
    const result = inUSD * state.exchangeRates[toCurrency];
    
    return parseFloat(result.toFixed(2));
}

// Summary
function updateSummary() {
    document.getElementById('summaryTripName').textContent = state.trip.name;
    document.getElementById('summaryDates').textContent = state.trip.dates;
    document.getElementById('summaryPeople').textContent = state.participants.length;
    document.getElementById('summaryActivities').textContent = state.activities.length;
    document.getElementById('summaryExpenses').textContent = state.expenses.length;
    
    // Calculate total cost in base currency
    let totalCost = 0;
    state.expenses.forEach(exp => {
        totalCost += convertCurrencyAmount(exp.amount, exp.currency, state.trip.baseCurrency);
    });
    
    document.getElementById('summaryTotalCost').textContent = formatCurrency(totalCost, state.trip.baseCurrency);
}

function calculateFinalBalances() {
    if (state.participants.length === 0) {
        document.getElementById('summaryBalances').innerHTML = '<div style="color: #666;">Add participants first</div>';
        return;
    }
    
    // Calculate balances in base currency
    const balances = {};
    state.participants.forEach(p => balances[p.id] = 0);
    
    // Process expenses
    state.expenses.forEach(expense => {
        const share = expense.amount / expense.splitBetween.length;
        const paidById = expense.paidById;
        
        // Convert to base currency
        const amountBase = convertCurrencyAmount(expense.amount, expense.currency, state.trip.baseCurrency);
        const shareBase = amountBase / expense.splitBetween.length;
        
        balances[paidById] += amountBase;
        
        expense.splitBetween.forEach(pid => {
            if (pid !== paidById) {
                balances[pid] -= shareBase;
            }
        });
    });
    
    // Display balances
    let html = '';
    state.participants.forEach(person => {
        const balance = balances[person.id];
        const balanceInPersonCurrency = convertCurrencyAmount(balance, state.trip.baseCurrency, person.currency);
        
        html += `
            <div style="margin-bottom: 8px; padding: 8px; background: ${balance >= 0 ? '#e8f5e9' : '#ffebee'}; border-radius: 6px;">
                <strong>${person.name}:</strong>
                <span style="float: right; color: ${balance >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                    ${balance >= 0 ? '+' : ''}${formatCurrency(balanceInPersonCurrency, person.currency)}
                </span>
            </div>
        `;
    });
    
    document.getElementById('summaryBalances').innerHTML = html || '<div style="color: #666;">No expenses to calculate</div>';
}

// Helper Functions
function formatCurrency(amount, currency) {
    if (isNaN(amount)) amount = 0;
    
    const symbols = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        INR: '₹',
        AUD: 'A$',
        CAD: 'C$',
        SGD: 'S$',
        MYR: 'RM',
        THB: '฿'
    };
    
    const symbol = symbols[currency] || currency;
    
    if (currency === 'JPY') {
        return `${symbol}${Math.round(amount)}`;
    }
    
    return `${symbol}${amount.toFixed(2)}`;
}
