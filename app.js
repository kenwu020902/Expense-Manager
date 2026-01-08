// Global State
const state = {
    currentStep: 1,
    trip: {
        name: "Bali Vacation",
        destination: "Bali, Indonesia",
        startDate: null,
        endDate: null,
        description: ""
    },
    participants: [],
    activities: [], // Only for budget checking, NOT for balances
    expenses: [], // Only expenses count toward balances
    exchangeRates: {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.5,
        INR: 74.3
    }
};

// ====================
// INITIALIZE APP
// ====================
function initializeApp() {
    // Set default dates to today and next week
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    document.getElementById('startDate').valueAsDate = today;
    document.getElementById('endDate').valueAsDate = nextWeek;
    document.getElementById('activityDate').valueAsDate = today;
    
    // Set trip dates in state
    state.trip.startDate = today;
    state.trip.endDate = nextWeek;
    
    // Load saved data
    loadData();
    
    // Update displays
    updateParticipantsDisplay();
    updateActivityParticipants();
    updateExpenseForm();
    
    saveData();
}

// ====================
// CALENDAR EXPORT FUNCTIONS
// ====================

function exportToCalendar() {
    const tripName = document.getElementById('tripName').value || 'My Trip';
    const destination = document.getElementById('destination').value || '';
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Please set both start and end dates first');
        return;
    }
    
    // Format dates for iCalendar
    const formatICalDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    // Create iCalendar content
    const icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Trip Planner//EN',
        'BEGIN:VEVENT',
        `SUMMARY:${tripName}`,
        `DESCRIPTION:Trip to ${destination}. Planned with Trip Planner App`,
        `DTSTART:${formatICalDate(startDate)}`,
        `DTEND:${formatICalDate(endDate)}`,
        `LOCATION:${destination}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
    
    // Create download link
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tripName.replace(/\s+/g, '_')}_trip.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    document.getElementById('calendarStatus').innerHTML = 
        '<span style="color: #4CAF50;"><i class="fas fa-check-circle"></i> Calendar file downloaded! Import this .ics file to your calendar app.</span>';
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
        document.getElementById('calendarStatus').innerHTML = '';
    }, 5000);
}

function setupTripReminder() {
    const startDate = document.getElementById('startDate').value;
    const tripName = document.getElementById('tripName').value || 'Your Trip';
    
    if (!startDate) {
        alert('Please set a start date first');
        return;
    }
    
    if (!('Notification' in window)) {
        alert('This browser doesn\'t support notifications');
        return;
    }
    
    if (Notification.permission === 'granted') {
        scheduleReminder();
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                scheduleReminder();
            }
        });
    }
}

function scheduleReminder() {
    const startDate = new Date(document.getElementById('startDate').value);
    const tripName = document.getElementById('tripName').value || 'Your Trip';
    const now = new Date();
    
    // Calculate when to show notification (1 day before trip)
    const reminderTime = new Date(startDate);
    reminderTime.setDate(reminderTime.getDate() - 1);
    reminderTime.setHours(9, 0, 0); // 9 AM day before
    
    const timeUntilReminder = reminderTime - now;
    
    if (timeUntilReminder > 0) {
        setTimeout(() => {
            new Notification('Trip Reminder!', {
                body: `Don't forget: ${tripName} starts tomorrow!`,
                icon: 'https://cdn-icons-png.flaticon.com/512/2907/2907972.png',
                tag: 'trip-reminder'
            });
        }, timeUntilReminder);
        
        document.getElementById('calendarStatus').innerHTML = 
            `<span style="color: #4CAF50;">
                <i class="fas fa-check-circle"></i> Reminder set! You'll get a notification 1 day before your trip.
            </span>`;
    } else {
        document.getElementById('calendarStatus').innerHTML = 
            `<span style="color: #FF9800;">
                <i class="fas fa-info-circle"></i> Trip is too soon for a reminder. You'll get a notification next time!
            </span>`;
    }
}

// ====================
// STEP NAVIGATION
// ====================
function nextStep() {
    if (state.currentStep < 5) {
        state.currentStep++;
        updateStepDisplay();
        
        // Update specific step when entering
        if (state.currentStep === 3) updateActivityParticipants();
        if (state.currentStep === 4) updateExpenseForm();
        if (state.currentStep === 5) calculateFinalBalances();
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
        : 'Next Step <i class="fas fa-arrow-right"></i>';
    
    saveData();
}

// ====================
// LOAD/SAVE DATA
// ====================
function loadData() {
    const saved = localStorage.getItem('tripPlannerSimple');
    if (saved) {
        const data = JSON.parse(saved);
        
        // Restore dates
        if (data.trip.startDate) data.trip.startDate = new Date(data.trip.startDate);
        if (data.trip.endDate) data.trip.endDate = new Date(data.trip.endDate);
        if (data.activities) {
            data.activities.forEach(activity => {
                if (activity.date) activity.date = new Date(activity.date);
            });
        }
        if (data.expenses) {
            data.expenses.forEach(expense => {
                if (expense.date) expense.date = new Date(expense.date);
            });
        }
        
        Object.assign(state, data);
        
        // Update UI from saved state
        if (state.trip.name) document.getElementById('tripName').value = state.trip.name;
        if (state.trip.destination) document.getElementById('destination').value = state.trip.destination;
        if (state.trip.description) document.getElementById('tripDescription').value = state.trip.description;
        
        if (state.trip.startDate) document.getElementById('startDate').valueAsDate = state.trip.startDate;
        if (state.trip.endDate) document.getElementById('endDate').valueAsDate = state.trip.endDate;
        
        updateParticipantsDisplay();
        updateActivitiesDisplay();
        updateExpensesDisplay();
    }
}

function saveData() {
    // Save trip info
    state.trip.name = document.getElementById('tripName').value;
    state.trip.destination = document.getElementById('destination').value;
    state.trip.description = document.getElementById('tripDescription').value;
    
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;
    
    if (startDateInput) state.trip.startDate = new Date(startDateInput);
    if (endDateInput) state.trip.endDate = new Date(endDateInput);
    
    localStorage.setItem('tripPlannerSimple', JSON.stringify(state));
}

// ====================
// PARTICIPANTS
// ====================
function addPerson() {
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
        currency: currency,
        spent: 0 // Track how much they've spent
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
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No participants added yet</div>';
        return;
    }
    
    container.innerHTML = state.participants.map(person => `
        <div class="list-item">
            <div>
                <strong>${person.name}</strong>
                <div style="font-size: 0.9rem; color: #666;">
                    Budget: ${formatCurrency(person.budget, person.currency)}
                    ${person.spent > 0 ? `<br>Spent: ${formatCurrency(person.spent, person.currency)}` : ''}
                </div>
            </div>
            <button class="delete-btn" onclick="deleteParticipant(${person.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function deleteParticipant(id) {
    state.participants = state.participants.filter(p => p.id !== id);
    updateParticipantsDisplay();
    saveData();
}

// ====================
// ACTIVITIES (Budget Check Only - NOT for balances)
// ====================
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

function checkActivityBudget() {
    const activityCost = parseFloat(document.getElementById('activityCost').value) || 0;
    const currency = document.getElementById('activityCurrency').value;
    
    if (activityCost <= 0) {
        alert("Please enter an activity cost");
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
    
    const costPerPerson = activityCost / selectedParticipants.length;
    let html = '';
    let allWithinBudget = true;
    
    selectedParticipants.forEach(pid => {
        const person = state.participants.find(p => p.id === pid);
        if (person) {
            // Convert cost to person's currency
            const costInPersonCurrency = convertCurrencyAmount(costPerPerson, currency, person.currency);
            const remainingBudget = person.budget - person.spent;
            const canAfford = remainingBudget >= costInPersonCurrency;
            
            const statusClass = canAfford ? 'budget-good' : 'budget-danger';
            const statusText = canAfford ? '✓ Within budget' : '✗ Exceeds budget!';
            
            html += `
                <div style="margin: 10px 0; padding: 10px; background: ${canAfford ? '#e8f5e9' : '#ffebee'}; border-radius: 8px;">
                    <strong>${person.name}</strong>
                    <div style="font-size: 0.9rem;">
                        Activity cost: ${formatCurrency(costInPersonCurrency, person.currency)} each
                        <br>Remaining budget: ${formatCurrency(remainingBudget, person.currency)}
                        <br><span class="${statusClass}">${statusText}</span>
                    </div>
                </div>
            `;
            
            if (!canAfford) allWithinBudget = false;
        }
    });
    
    document.getElementById('budgetStatus').innerHTML = html;
    document.getElementById('budgetStatusContainer').style.display = 'block';
    
    // Update button text based on budget status
    const addBtn = document.querySelector('button[onclick="addActivity()"]');
    if (addBtn) {
        if (!allWithinBudget) {
            addBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Add Anyway (Budget Warning)';
            addBtn.style.background = '#FF9800';
        } else {
            addBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Plan';
            addBtn.style.background = '#4CAF50';
        }
    }
}

function addActivity() {
    const name = document.getElementById('activityName').value.trim();
    const cost = parseFloat(document.getElementById('activityCost').value) || 0;
    const currency = document.getElementById('activityCurrency').value;
    const dateInput = document.getElementById('activityDate').value;
    const description = document.getElementById('activityDescription').value;
    
    if (!name || cost <= 0) {
        alert("Please enter activity name and cost");
        return;
    }
    
    const date = dateInput ? new Date(dateInput) : new Date();
    
    // Get selected participants
    const selectedParticipants = [];
    document.querySelectorAll('#activityParticipantsCheckboxes input:checked').forEach(cb => {
        selectedParticipants.push(parseInt(cb.value));
    });
    
    if (selectedParticipants.length === 0) {
        alert("Please select at least one participant");
        return;
    }
    
    const costPerPerson = cost / selectedParticipants.length;
    
    // Check budgets and ask for confirmation if over budget
    let overBudgetParticipants = [];
    selectedParticipants.forEach(pid => {
        const person = state.participants.find(p => p.id === pid);
        if (person) {
            const costInPersonCurrency = convertCurrencyAmount(costPerPerson, currency, person.currency);
            const remainingBudget = person.budget - person.spent;
            if (remainingBudget < costInPersonCurrency) {
                overBudgetParticipants.push(person.name);
            }
        }
    });
    
    if (overBudgetParticipants.length > 0) {
        const confirmAdd = confirm(
            `${overBudgetParticipants.join(', ')} ${overBudgetParticipants.length === 1 ? 'is' : 'are'} over budget. Add activity anyway?`
        );
        if (!confirmAdd) return;
    }
    
    // Add activity (but DON'T update spent amounts - activities are just for planning)
    const newActivity = {
        id: Date.now(),
        name: name,
        cost: cost,
        currency: currency,
        date: date,
        description: description,
        participantIds: selectedParticipants,
        costPerPerson: costPerPerson
    };
    
    state.activities.push(newActivity);
    updateActivitiesDisplay();
    saveData();
    
    // Clear inputs
    document.getElementById('activityName').value = '';
    document.getElementById('activityCost').value = '';
    document.getElementById('activityDescription').value = '';
    document.getElementById('budgetStatusContainer').style.display = 'none';
}

function updateActivitiesDisplay() {
    const container = document.getElementById('activitiesContainer');
    
    if (state.activities.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No activities planned yet</div>';
        return;
    }
    
    container.innerHTML = state.activities.map(activity => {
        const participants = activity.participantIds.map(id => {
            const person = state.participants.find(p => p.id === id);
            return person ? person.name : 'Unknown';
        }).join(', ');
        
        const dateStr = activity.date.toLocaleDateString();
        
        return `
            <div class="list-item">
                <div>
                    <strong>${activity.name}</strong>
                    <div style="font-size: 0.9rem; color: #666;">
                        ${dateStr} | ${formatCurrency(activity.cost, activity.currency)}
                        <br>${formatCurrency(activity.costPerPerson, activity.currency)} per person
                    </div>
                    <div style="font-size: 0.9rem; color: #666;">
                        Participants: ${participants}
                    </div>
                    ${activity.description ? `<div style="font-size: 0.9rem; color: #777;">${activity.description}</div>` : ''}
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
    updateActivitiesDisplay();
    saveData();
}

// ====================
// EXPENSES (ONLY these count toward balances)
// ====================
function updateExpenseForm() {
    const paidBySelect = document.getElementById('paidBy');
    const splitContainer = document.getElementById('splitCheckboxes');
    
    // Update "Paid By" dropdown
    paidBySelect.innerHTML = '<option value="">Select who paid</option>' + 
        state.participants.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
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
    
    // Update person's spent amount
    const share = amount / splitBetween.length;
    
    splitBetween.forEach(pid => {
        const person = state.participants.find(p => p.id === pid);
        if (person && pid !== paidById) {
            // Add share to person's spent amount
            const shareInPersonCurrency = convertCurrencyAmount(share, currency, person.currency);
            person.spent += shareInPersonCurrency;
        }
    });
    
    // Subtract from person who paid (they get money back from others)
    const paidByPerson = state.participants.find(p => p.id === paidById);
    if (paidByPerson) {
        const totalReceived = amount - share; // They don't pay their own share
        const totalReceivedInPersonCurrency = convertCurrencyAmount(totalReceived, currency, paidByPerson.currency);
        paidByPerson.spent -= totalReceivedInPersonCurrency;
    }
    
    const newExpense = {
        id: Date.now(),
        name: name,
        amount: amount,
        currency: currency,
        paidById: paidById,
        category: category,
        splitBetween: splitBetween,
        date: new Date()
    };
    
    state.expenses.push(newExpense);
    updateExpensesDisplay();
    updateParticipantsDisplay(); // Update spent amounts
    saveData();
    
    // Clear inputs
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
}

function updateExpensesDisplay() {
    const container = document.getElementById('expensesContainer');
    
    if (state.expenses.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No expenses added yet</div>';
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
            <div class="list-item">
                <div>
                    <strong>${categoryIcons[expense.category] || '📦'} ${expense.name}</strong>
                    <div style="font-size: 0.9rem; color: #666;">
                        ${formatCurrency(expense.amount, expense.currency)} 
                        | Paid by: ${paidBy}
                    </div>
                    <div style="font-size: 0.9rem; color: #666;">
                        Split ${splitCount} ways (${formatCurrency(share, expense.currency)} each)
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
    // Find and remove expense
    const expenseIndex = state.expenses.findIndex(e => e.id === id);
    if (expenseIndex === -1) return;
    
    const expense = state.expenses[expenseIndex];
    const share = expense.amount / expense.splitBetween.length;
    
    // Reverse the spent amounts
    expense.splitBetween.forEach(pid => {
        const person = state.participants.find(p => p.id === pid);
        if (person && pid !== expense.paidById) {
            const shareInPersonCurrency = convertCurrencyAmount(share, expense.currency, person.currency);
            person.spent -= shareInPersonCurrency;
        }
    });
    
    // Reverse for person who paid
    const paidByPerson = state.participants.find(p => p.id === expense.paidById);
    if (paidByPerson) {
        const totalReceived = expense.amount - share;
        const totalReceivedInPersonCurrency = convertCurrencyAmount(totalReceived, expense.currency, paidByPerson.currency);
        paidByPerson.spent += totalReceivedInPersonCurrency;
    }
    
    // Remove expense
    state.expenses.splice(expenseIndex, 1);
    updateExpensesDisplay();
    updateParticipantsDisplay();
    saveData();
}

// ====================
// CURRENCY CONVERTER
// ====================
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
        document.getElementById('convertToAmount').value = '';
        return;
    }
    
    const result = convertCurrencyAmount(amount, fromCurrency, toCurrency);
    document.getElementById('convertToAmount').value = result.toFixed(2);
}

function convertCurrencyAmount(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const inUSD = amount / state.exchangeRates[fromCurrency];
    const result = inUSD * state.exchangeRates[toCurrency];
    return parseFloat(result.toFixed(2));
}

// ====================
// FINAL BALANCES (ONLY from expenses, NOT activities)
// ====================
function calculateFinalBalances() {
    if (state.participants.length === 0) {
        document.getElementById('balancesList').innerHTML = 
            '<div style="text-align: center; color: #666; padding: 20px;">Add participants and expenses first</div>';
        return;
    }
    
    if (state.expenses.length === 0) {
        document.getElementById('balancesList').innerHTML = 
            '<div style="text-align: center; color: #666; padding: 20px;">Add expenses in Step 4 to see balances</div>';
        return;
    }
    
    // Calculate net position for each person
    const balances = {};
    state.participants.forEach(p => balances[p.id] = 0);
    
    // Only count expenses (activities are just for planning)
    state.expenses.forEach(expense => {
        const share = expense.amount / expense.splitBetween.length;
        const paidById = expense.paidById;
        
        // Convert to each person's currency
        expense.splitBetween.forEach(pid => {
            const person = state.participants.find(p => p.id === pid);
            if (person) {
                const amountInPersonCurrency = convertCurrencyAmount(
                    pid === paidById ? expense.amount - share : -share,
                    expense.currency,
                    person.currency
                );
                balances[pid] += amountInPersonCurrency;
            }
        });
    });
    
    // Display results
    let html = '';
    let totalOwed = 0;
    let totalGets = 0;
    
    state.participants.forEach(person => {
        const balance = balances[person.id];
        
        if (balance < 0) {
            totalOwed += Math.abs(balance);
        } else if (balance > 0) {
            totalGets += balance;
        }
        
        if (Math.abs(balance) > 0.01) { // Only show significant amounts
            html += `
                <div class="list-item">
                    <strong>${person.name}</strong>
                    <span class="${balance >= 0 ? 'balance-positive' : 'balance-negative'}">
                        ${balance >= 0 ? 'Gets ' : 'Owes '}${formatCurrency(Math.abs(balance), person.currency)}
                    </span>
                </div>
            `;
        }
    });
    
    if (html === '') {
        html = '<div style="text-align: center; color: #666; padding: 20px;">Balances are settled! No money owed.</div>';
    }
    
    document.getElementById('balancesList').innerHTML = html;
}

// ====================
// HELPER FUNCTIONS
// ====================
function formatCurrency(amount, currency) {
    if (isNaN(amount)) amount = 0;
    const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹' };
    const symbol = symbols[currency] || currency;
    if (currency === 'JPY') return `${symbol}${Math.round(amount)}`;
    return `${symbol}${amount.toFixed(2)}`;
}

// ====================
// START THE APP
// ====================
window.onload = initializeApp;
