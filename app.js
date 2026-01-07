// Global State
const state = {
    trip: {
        name: "Bali Vacation",
        destination: "Bali, Indonesia",
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        description: "Beach vacation with friends"
    },
    participants: [],
    activities: [],
    expenses: [],
    calendar: {
        currentDate: new Date(),
        selectedDate: null
    },
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
    initializeApp();
});

function initializeApp() {
    // Setup tab navigation
    setupTabs();
    
    // Set default dates
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    document.getElementById('startDate').value = formatDate(today, 'DD/MM/YYYY');
    document.getElementById('endDate').value = formatDate(nextWeek, 'DD/MM/YYYY');
    
    // Initialize calendars
    createCalendar('calendarStart', 'start');
    createCalendar('calendarEnd', 'end');
    createCalendar('calendarActivity', 'activity');
    
    // Load saved data
    loadData();
    
    // Add default participants if empty
    if (state.participants.length === 0) {
        addDefaultParticipants();
    }
    
    // Update all displays
    updateAllDisplays();
    
    // Setup auto-format for date inputs
    setupDateAutoFormat();
    
    // Close calendar when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.date-container') && !e.target.closest('.calendar-modal')) {
            hideAllCalendars();
        }
    });
}

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
            if (tabId === 'people') updateParticipantsDisplay();
            if (tabId === 'activities') updateActivityForm();
            if (tabId === 'expenses') updateExpenseForm();
            if (tabId === 'balances') calculateAllBalances();
        });
    });
}

// Load/Save Data
function loadData() {
    const saved = localStorage.getItem('tripPlannerData');
    if (saved) {
        const data = JSON.parse(saved);
        
        // Restore dates from strings
        if (data.trip.startDate) data.trip.startDate = new Date(data.trip.startDate);
        if (data.trip.endDate) data.trip.endDate = new Date(data.trip.endDate);
        
        // Restore activity dates
        if (data.activities) {
            data.activities.forEach(activity => {
                if (activity.date) activity.date = new Date(activity.date);
            });
        }
        
        // Restore expense dates
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
        
        if (state.trip.startDate) {
            document.getElementById('startDate').value = formatDate(state.trip.startDate, 'DD/MM/YYYY');
        }
        if (state.trip.endDate) {
            document.getElementById('endDate').value = formatDate(state.trip.endDate, 'DD/MM/YYYY');
        }
    }
}

function saveData() {
    // Save trip info
    state.trip.name = document.getElementById('tripName').value;
    state.trip.destination = document.getElementById('destination').value;
    state.trip.description = document.getElementById('tripDescription').value;
    
    localStorage.setItem('tripPlannerData', JSON.stringify(state));
}

// Date Functions
function formatDate(date, format = 'DD/MM/YYYY') {
    if (!date) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    if (format === 'DD/MM/YYYY') {
        return `${day}/${month}/${year}`;
    }
    return `${day}/${month}/${year}`;
}

function parseDateInput(input) {
    if (!input) return null;
    
    // Try DD/MM/YYYY format
    const match = input.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = parseInt(match[3]);
        const date = new Date(year, month, day);
        
        // Check if date is valid
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
            return date;
        }
    }
    
    return null;
}

function setupDateAutoFormat() {
    const dateInputs = document.querySelectorAll('input[placeholder*="DD/MM/YYYY"]');
    
    dateInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            if (value.length > 5) {
                value = value.substring(0, 5) + '/' + value.substring(5, 9);
            }
            
            e.target.value = value;
            
            // Update state if it's a trip date
            if (e.target.id === 'startDate') {
                const date = parseDateInput(value);
                if (date) state.trip.startDate = date;
            } else if (e.target.id === 'endDate') {
                const date = parseDateInput(value);
                if (date) state.trip.endDate = date;
            }
        });
    });
}

// Calendar Functions
function createCalendar(containerId, type) {
    const container = document.getElementById(containerId);
    const today = new Date();
    const currentDate = new Date(state.calendar.currentDate);
    
    container.innerHTML = generateCalendarHTML(currentDate, today, type);
    
    // Add click handlers for calendar buttons
    const prevBtn = container.querySelector('.prev-month');
    const nextBtn = container.querySelector('.next-month');
    
    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            changeMonth(containerId, type, -1);
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            changeMonth(containerId, type, 1);
        };
    }
    
    // Add click handlers for days
    addDayClickHandlers(containerId, type);
}

function changeMonth(containerId, type, direction) {
    const currentDate = new Date(state.calendar.currentDate);
    currentDate.setMonth(currentDate.getMonth() + direction);
    state.calendar.currentDate = currentDate;
    
    createCalendar(containerId, type);
}

function addDayClickHandlers(containerId, type) {
    const container = document.getElementById(containerId);
    const dayElements = container.querySelectorAll('.calendar-day:not(.empty)');
    
    dayElements.forEach(day => {
        day.onclick = function(e) {
            e.stopPropagation();
            
            const dayNum = parseInt(this.textContent);
            const currentDate = new Date(state.calendar.currentDate);
            const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
            
            // Update the input field
            const inputId = type === 'activity' ? 'activityDate' : `${type}Date`;
            document.getElementById(inputId).value = formatDate(selectedDate, 'DD/MM/YYYY');
            
            // Update state
            if (type === 'start') {
                state.trip.startDate = selectedDate;
            } else if (type === 'end') {
                state.trip.endDate = selectedDate;
            }
            
            // Update calendar to show selection
            state.calendar.selectedDate = selectedDate;
            createCalendar(containerId, type);
            
            // Hide calendar after selection
            setTimeout(() => hideCalendar(type), 300);
            
            saveData();
        };
    });
}

function generateCalendarHTML(date, today, type) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    // Get starting day (0 = Sunday, 1 = Monday, etc.)
    const startDay = firstDay.getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    let html = `
        <div class="calendar">
            <div class="calendar-header">
                <button class="prev-month"><i class="fas fa-chevron-left"></i></button>
                <div class="calendar-month-year">${monthNames[month]} ${year}</div>
                <button class="next-month"><i class="fas fa-chevron-right"></i></button>
            </div>
            
            <div class="calendar-weekdays">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
                <div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            
            <div class="calendar-days">
    `;
    
    // Empty cells for days before the first of the month
    for (let i = 0; i < startDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }
    
    // Days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(year, month, day);
        const isToday = currentDate.toDateString() === today.toDateString();
        const isSelected = state.calendar.selectedDate && 
                          currentDate.toDateString() === state.calendar.selectedDate.toDateString();
        
        let className = 'calendar-day';
        if (isToday) className += ' today';
        if (isSelected) className += ' selected';
        
        html += `<div class="${className}">${day}</div>`;
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

function toggleCalendar(type) {
    const calendarId = `calendar${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const calendar = document.getElementById(calendarId);
    
    // Hide all calendars first
    hideAllCalendars();
    
    // Show this calendar
    calendar.classList.add('active');
    
    // Update to current input date if exists
    const currentInputId = type === 'activity' ? 'activityDate' : `${type}Date`;
    const currentValue = document.getElementById(currentInputId).value;
    
    if (currentValue) {
        const parsedDate = parseDateInput(currentValue);
        if (parsedDate) {
            state.calendar.currentDate = parsedDate;
            state.calendar.selectedDate = parsedDate;
        }
    }
    
    createCalendar(calendarId, type);
}

function hideCalendar(type) {
    const calendarId = `calendar${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const calendar = document.getElementById(calendarId);
    calendar.classList.remove('active');
}

function hideAllCalendars() {
    document.querySelectorAll('.calendar-modal').forEach(calendar => {
        calendar.classList.remove('active');
    });
}

// Participants
function addDefaultParticipants() {
    const defaultParticipants = [
        { id: 1, name: "You", budget: 1000, currency: "USD" },
        { id: 2, name: "Friend", budget: 800, currency: "USD" },
        { id: 3, name: "Partner", budget: 1200, currency: "USD" }
    ];
    
    state.participants = defaultParticipants;
}

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
        currency: currency
    };
    
    state.participants.push(newPerson);
    updateAllDisplays();
    saveData();
    
    // Clear inputs
    document.getElementById('personName').value = '';
    document.getElementById('personBudget').value = '';
}

function updateAllDisplays() {
    updateParticipantsDisplay();
    updateActivityForm();
    updateExpenseForm();
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
    updateAllDisplays();
    saveData();
}

// Activities
function updateActivityForm() {
    const container = document.getElementById('activityParticipantsCheckboxes');
    
    if (state.participants.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Add participants first</div>';
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
    const dateInput = document.getElementById('activityDate').value;
    const cost = parseFloat(document.getElementById('activityCost').value) || 0;
    const currency = document.getElementById('activityCurrency').value;
    const description = document.getElementById('activityDescription').value;
    
    if (!name) {
        alert("Please enter an activity name");
        return;
    }
    
    const date = parseDateInput(dateInput);
    if (!date) {
        alert("Please enter a valid date in DD/MM/YYYY format");
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
        cost: cost,
        currency: currency,
        description: description,
        participantIds: selectedParticipants,
        costPerPerson: cost / selectedParticipants.length
    };
    
    state.activities.push(newActivity);
    updateActivitiesDisplay();
    saveData();
    
    // Clear inputs
    document.getElementById('activityName').value = '';
    document.getElementById('activityDate').value = '';
    document.getElementById('activityCost').value = '';
    document.getElementById('activityDescription').value = '';
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
        
        return `
            <div class="list-item">
                <div>
                    <strong>${activity.name}</strong>
                    <div style="font-size: 0.9rem; color: #666;">
                        ${formatDate(activity.date, 'DD/MM/YYYY')} | 
                        ${formatCurrency(activity.cost, activity.currency)}
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
        date: new Date()
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

// Balance Calculations
function calculateAllBalances() {
    if (state.participants.length === 0) {
        document.getElementById('balancesList').innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Add participants first</div>';
        return;
    }
    
    // Calculate balances in USD
    const balances = {};
    state.participants.forEach(p => balances[p.id] = 0);
    
    let totalCost = 0;
    
    // Process expenses
    state.expenses.forEach(expense => {
        const share = expense.amount / expense.splitBetween.length;
        const paidById = expense.paidById;
        
        // Convert to USD
        const amountUSD = convertCurrencyAmount(expense.amount, expense.currency, 'USD');
        const shareUSD = amountUSD / expense.splitBetween.length;
        
        totalCost += amountUSD;
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
        const shareUSD = convertCurrencyAmount(share, activity.currency, 'USD');
        
        totalCost += activity.costPerPerson * activity.participantIds.length;
        
        activity.participantIds.forEach(pid => {
            balances[pid] -= shareUSD;
        });
    });
    
    // Calculate total owed (only negative balances)
    let totalOwed = 0;
    Object.values(balances).forEach(balance => {
        if (balance < 0) totalOwed += Math.abs(balance);
    });
    
    // Display balances
    let html = '';
    state.participants.forEach(person => {
        const balance = balances[person.id];
        const balanceInPersonCurrency = convertCurrencyAmount(balance, 'USD', person.currency);
        
        html += `
            <div class="list-item">
                <strong>${person.name}</strong>
                <span style="color: ${balance >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                    ${balance >= 0 ? 'Gets ' : 'Owes '}${formatCurrency(Math.abs(balanceInPersonCurrency), person.currency)}
                </span>
            </div>
        `;
    });
    
    document.getElementById('balancesList').innerHTML = html || '<div style="color: #666;">No balances to calculate</div>';
    document.getElementById('totalCost').textContent = formatCurrency(totalCost, 'USD');
    document.getElementById('totalOwed').textContent = formatCurrency(totalOwed, 'USD');
}

// Helper Functions
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
