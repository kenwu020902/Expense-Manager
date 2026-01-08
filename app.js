// Global State - Stores all data
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

// ====================
// INITIALIZE APP
// ====================
function initializeApp() {
    setupTabs();
    setDefaultDates();
    createCalendars();
    loadSavedData();
    addDefaultParticipants();
    setupEventListeners();
    updateAllDisplays();
    
    // Close calendar when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.date-container') && !e.target.closest('.calendar-modal')) {
            hideAllCalendars();
        }
    });
}

// ====================
// TAB NAVIGATION
// ====================
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

// ====================
// DATE FUNCTIONS
// ====================
function setDefaultDates() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    document.getElementById('startDate').value = formatDate(today, 'DD/MM/YYYY');
    document.getElementById('endDate').value = formatDate(nextWeek, 'DD/MM/YYYY');
}

function formatDate(date, format = 'DD/MM/YYYY') {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function parseDateInput(input) {
    if (!input) return null;
    const match = input.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = parseInt(match[3]);
        const date = new Date(year, month, day);
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
            return date;
        }
    }
    return null;
}

// ====================
// CALENDAR FUNCTIONS
// ====================
function createCalendars() {
    createCalendar('calendarStart', 'start');
    createCalendar('calendarEnd', 'end');
    createCalendar('calendarActivity', 'activity');
}

function createCalendar(containerId, type) {
    const container = document.getElementById(containerId);
    const today = new Date();
    const currentDate = new Date(state.calendar.currentDate);
    
    container.innerHTML = generateCalendarHTML(currentDate, today, type);
    
    // Add click handlers
    const prevBtn = container.querySelector('.prev-month');
    const nextBtn = container.querySelector('.next-month');
    
    if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); changeMonth(containerId, type, -1); };
    if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); changeMonth(containerId, type, 1); };
    
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
            
            // Update input field
            const inputId = type === 'activity' ? 'activityDate' : `${type}Date`;
            document.getElementById(inputId).value = formatDate(selectedDate, 'DD/MM/YYYY');
            
            // Update state
            if (type === 'start') state.trip.startDate = selectedDate;
            if (type === 'end') state.trip.endDate = selectedDate;
            
            // Update calendar
            state.calendar.selectedDate = selectedDate;
            createCalendar(containerId, type);
            
            // Hide calendar
            setTimeout(() => hideCalendar(type), 300);
            saveData();
        };
    });
}

function generateCalendarHTML(date, today, type) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
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
    
    for (let i = 0; i < startDay; i++) html += `<div class="calendar-day empty"></div>`;
    
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
    
    html += `</div></div>`;
    return html;
}

function toggleCalendar(type) {
    const calendarId = `calendar${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const calendar = document.getElementById(calendarId);
    hideAllCalendars();
    calendar.classList.add('active');
    
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

// ====================
// CALENDAR EXPORT & NOTIFICATIONS
// ====================
function exportToCalendar() {
    const startDate = parseDateInput(document.getElementById('startDate').value);
    const endDate = parseDateInput(document.getElementById('endDate').value);
    const tripName = document.getElementById('tripName').value || 'Trip';
    const destination = document.getElementById('destination').value || '';
    
    if (!startDate || !endDate) {
        alert('Please set valid start and end dates first');
        return;
    }
    
    // Create iCalendar content
    const formatICalDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:${tripName} Trip`,
        `DESCRIPTION:Trip to ${destination}. Planned with Trip Planner App`,
        `DTSTART:${formatICalDate(startDate)}`,
        `DTEND:${formatICalDate(new Date(endDate.getTime() + 24 * 60 * 60 * 1000))}`,
        `LOCATION:${destination}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');
    
    // Create download link
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tripName.replace(/\s+/g, '_')}_trip.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    document.getElementById('calendarStatus').innerHTML = 
        '<span style="color: #4CAF50;"><i class="fas fa-check-circle"></i> Calendar file downloaded! Import to your calendar app</span>';
}

function setupNotifications() {
    if (!('Notification' in window)) {
        alert('This browser does not support desktop notifications');
        return;
    }
    
    if (Notification.permission === 'granted') {
        scheduleNotifications();
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') scheduleNotifications();
        });
    }
}

function scheduleNotifications() {
    const startDate = parseDateInput(document.getElementById('startDate').value);
    const tripName = document.getElementById('tripName').value || 'Your Trip';
    
    if (!startDate) {
        alert('Please set a valid start date first');
        return;
    }
    
    const now = new Date();
    const daysUntil = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil > 0) {
        const notificationTime = new Date(startDate);
        notificationTime.setDate(notificationTime.getDate() - 1);
        notificationTime.setHours(9, 0, 0);
        const timeUntilNotify = notificationTime - now;
        
        if (timeUntilNotify > 0) {
            setTimeout(() => {
                new Notification('Trip Tomorrow!', {
                    body: `Don't forget: ${tripName} starts tomorrow!`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/2907/2907972.png'
                });
            }, timeUntilNotify);
        }
        
        document.getElementById('calendarStatus').innerHTML = 
            `<span style="color: #4CAF50;">
                <i class="fas fa-check-circle"></i> Notifications set! You'll get a reminder 1 day before your trip
            </span>`;
    }
}

// ====================
// PARTICIPANTS
// ====================
function addDefaultParticipants() {
    if (state.participants.length === 0) {
        state.participants = [
            { id: 1, name: "You", budget: 1000, currency: "USD" },
            { id: 2, name: "Friend", budget: 800, currency: "USD" },
            { id: 3, name: "Partner", budget: 1200, currency: "USD" }
        ];
    }
}

function addPerson() {
    const name = document.getElementById('personName').value.trim();
    const budget = parseFloat(document.getElementById('personBudget').value) || 0;
    const currency = document.getElementById('personCurrency').value;
    
    if (!name) {
        alert("Please enter a name");
        return;
    }
    
    state.participants.push({ id: Date.now(), name, budget, currency });
    updateAllDisplays();
    saveData();
    
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

// ====================
// ACTIVITIES WITH BUDGET CHECK
// ====================
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
    
    setTimeout(checkBudgets, 100);
}

function checkBudgets() {
    const activityCost = parseFloat(document.getElementById('activityCost').value) || 0;
    const currency = document.getElementById('activityCurrency').value;
    
    if (activityCost <= 0) {
        document.getElementById('budgetCheck').style.display = 'none';
        return;
    }
    
    const selectedParticipants = [];
    document.querySelectorAll('#activityParticipantsCheckboxes input:checked').forEach(cb => {
        selectedParticipants.push(parseInt(cb.value));
    });
    
    if (selectedParticipants.length === 0) {
        document.getElementById('budgetCheck').style.display = 'none';
        return;
    }
    
    const costPerPerson = activityCost / selectedParticipants.length;
    let html = '';
    let allHaveBudget = true;
    
    selectedParticipants.forEach(pid => {
        const person = state.participants.find(p => p.id === pid);
        if (person) {
            const costInPersonCurrency = convertCurrencyAmount(costPerPerson, currency, person.currency);
            const remainingBudget = person.budget - getPersonTotalSpent(pid);
            const canAfford = remainingBudget >= costInPersonCurrency;
            
            html += `
                <div style="margin: 8px 0; padding: 8px; background: ${canAfford ? '#e8f5e9' : '#ffebee'}; border-radius: 5px;">
                    <strong>${person.name}:</strong> ${formatCurrency(costInPersonCurrency, person.currency)}
                    <div style="font-size: 0.85rem;">
                        Remaining budget: ${formatCurrency(remainingBudget, person.currency)}
                        ${!canAfford ? '<span style="color: #f44336;"> (Exceeds budget!)</span>' : ''}
                    </div>
                </div>
            `;
            
            if (!canAfford) allHaveBudget = false;
        }
    });
    
    document.getElementById('budgetStatus').innerHTML = html;
    document.getElementById('budgetCheck').style.display = 'block';
    
    const addBtn = document.querySelector('button[onclick="addActivity()"]');
    if (addBtn) {
        if (!allHaveBudget) {
            addBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Add Activity (Budget Warning)';
            addBtn.style.background = '#FF9800';
        } else {
            addBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Add Activity';
            addBtn.style.background = '#2196F3';
        }
    }
}

function getPersonTotalSpent(personId) {
    let total = 0;
    
    // Add expenses
    state.expenses.forEach(expense => {
        if (expense.splitBetween.includes(personId)) {
            const share = expense.amount / expense.splitBetween.length;
            const shareInPersonCurrency = convertCurrencyAmount(share, expense.currency, 
                state.participants.find(p => p.id === personId)?.currency || 'USD');
            total += shareInPersonCurrency;
        }
    });
    
    // Add activities
    state.activities.forEach(activity => {
        if (activity.participantIds.includes(personId)) {
            const costInPersonCurrency = convertCurrencyAmount(activity.costPerPerson, activity.currency,
                state.participants.find(p => p.id === personId)?.currency || 'USD');
            total += costInPersonCurrency;
        }
    });
    
    return total;
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
    
    // Budget check
    const selectedParticipants = [];
    document.querySelectorAll('#activityParticipantsCheckboxes input:checked').forEach(cb => {
        selectedParticipants.push(parseInt(cb.value));
    });
    
    if (selectedParticipants.length === 0) {
        alert("Please select at least one participant");
        return;
    }
    
    const costPerPerson = cost / selectedParticipants.length;
    let overBudgetParticipants = [];
    
    selectedParticipants.forEach(pid => {
        const person = state.participants.find(p => p.id === pid);
        if (person) {
            const costInPersonCurrency = convertCurrencyAmount(costPerPerson, currency, person.currency);
            const remainingBudget = person.budget - getPersonTotalSpent(pid);
            
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
    
    document.getElementById('activityName').value = '';
    document.getElementById('activityDate').value = '';
    document.getElementById('activityCost').value = '';
    document.getElementById('activityDescription').value = '';
    document.getElementById('budgetCheck').style.display = 'none';
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

// ====================
// EXPENSES WITH REAL-TIME BALANCE PREVIEW
// ====================
function updateExpenseForm() {
    const paidBySelect = document.getElementById('paidBy');
    const splitContainer = document.getElementById('splitCheckboxes');
    
    paidBySelect.innerHTML = '<option value="">Select who paid</option>' + 
        state.participants.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
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
    
    setTimeout(updateBalancePreview, 100);
}

function updateBalancePreview() {
    const expenseAmount = parseFloat(document.getElementById('expenseAmount').value) || 0;
    const currency = document.getElementById('expenseCurrency').value;
    const paidById = parseInt(document.getElementById('paidBy').value);
    
    if (expenseAmount <= 0 || !paidById || state.participants.length === 0) {
        document.getElementById('balancePreview').innerHTML = 
            '<div style="color: #666; text-align: center;">Enter expense details to see balance impact</div>';
        return;
    }
    
    const selectedParticipants = [];
    document.querySelectorAll('#splitCheckboxes input:checked').forEach(cb => {
        selectedParticipants.push(parseInt(cb.value));
    });
    
    if (selectedParticipants.length === 0) {
        document.getElementById('balancePreview').innerHTML = 
            '<div style="color: #666; text-align: center;">Select participants to split with</div>';
        return;
    }
    
    // Calculate hypothetical balances
    const hypotheticalBalances = {};
    state.participants.forEach(p => hypotheticalBalances[p.id] = getPersonBalance(p.id));
    
    const share = expenseAmount / selectedParticipants.length;
    
    // Update balances with this new expense
    selectedParticipants.forEach(pid => {
        if (pid !== paidById) {
            const shareInPersonCurrency = convertCurrencyAmount(share, currency,
                state.participants.find(p => p.id === pid)?.currency || 'USD');
            hypotheticalBalances[pid] -= shareInPersonCurrency;
        }
    });
    
    const paidShareInPersonCurrency = convertCurrencyAmount(expenseAmount, currency,
        state.participants.find(p => p.id === paidById)?.currency || 'USD');
    hypotheticalBalances[paidById] += paidShareInPersonCurrency;
    
    // Display results
    let html = '<div style="display: grid; gap: 8px;">';
    state.participants.forEach(person => {
        const balance = hypotheticalBalances[person.id];
        if (Math.abs(balance) > 0.01) {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; 
                          padding: 10px; background: ${balance >= 0 ? '#e8f5e9' : '#ffebee'}; 
                          border-radius: 8px;">
                    <span><strong>${person.name}</strong></span>
                    <span style="color: ${balance >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                        ${balance >= 0 ? '+' : ''}${formatCurrency(balance, person.currency)}
                    </span>
                </div>
            `;
        }
    });
    
    if (html === '<div style="display: grid; gap: 8px;">') {
        html += '<div style="color: #666; text-align: center;">No significant balance changes</div>';
    }
    
    html += '</div>';
    document.getElementById('balancePreview').innerHTML = html;
}

function getPersonBalance(personId) {
    let balance = 0;
    
    // Process expenses
    state.expenses.forEach(expense => {
        const share = expense.amount / expense.splitBetween.length;
        const paidById = expense.paidById;
        
        if (personId === paidById) {
            const amountInPersonCurrency = convertCurrencyAmount(expense.amount, expense.currency,
                state.participants.find(p => p.id === personId)?.currency || 'USD');
            balance += amountInPersonCurrency;
        }
        
        if (expense.splitBetween.includes(personId) && personId !== paidById) {
            const shareInPersonCurrency = convertCurrencyAmount(share, expense.currency,
                state.participants.find(p => p.id === personId)?.currency || 'USD');
            balance -= shareInPersonCurrency;
        }
    });
    
    // Process activities
    state.activities.forEach(activity => {
        if (activity.participantIds.includes(personId)) {
            const costInPersonCurrency = convertCurrencyAmount(activity.costPerPerson, activity.currency,
                state.participants.find(p => p.id === personId)?.currency || 'USD');
            balance -= costInPersonCurrency;
        }
    });
    
    return balance;
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
    
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
    updateBalancePreview();
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
        document.getElementById('conversionResult').style.display = 'none';
        document.getElementById('convertToAmount').value = '';
        return;
    }
    
    const result = convertCurrencyAmount(amount, fromCurrency, toCurrency);
    
    document.getElementById('convertToAmount').value = result.toFixed(2);
    
    const resultDiv = document.getElementById('conversionResult');
    resultDiv.innerHTML = `${formatCurrency(amount, fromCurrency)} = ${formatCurrency(result, toCurrency)}`;
    resultDiv.style.display = 'block';
}

function convertCurrencyAmount(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const inUSD = amount / state.exchangeRates[fromCurrency];
    const result = inUSD * state.exchangeRates[toCurrency];
    return parseFloat(result.toFixed(2));
}

// ====================
// BALANCE CALCULATIONS
// ====================
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
        
        const amountUSD = convertCurrencyAmount(expense.amount, expense.currency, 'USD');
        const shareUSD = amountUSD / expense.splitBetween.length;
        
        totalCost += amountUSD;
        balances[paidById] += amountUSD;
        
        expense.splitBetween.forEach(pid => {
            if (pid !== paidById) balances[pid] -= shareUSD;
        });
    });
    
    // Process activities
    state.activities.forEach(activity => {
        const share = activity.costPerPerson;
        const shareUSD = convertCurrencyAmount(share, activity.currency, 'USD');
        
        totalCost += activity.costPerPerson * activity.participantIds.length;
        activity.participantIds.forEach(pid => balances[pid] -= shareUSD);
    });
    
    // Calculate total owed
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

function updateAllDisplays() {
    updateParticipantsDisplay();
    updateActivityForm();
    updateExpenseForm();
}

function setupEventListeners() {
    // Date auto-format
    document.querySelectorAll('input[placeholder*="DD/MM/YYYY"]').forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2);
            if (value.length > 5) value = value.substring(0, 5) + '/' + value.substring(5, 9);
            e.target.value = value;
        });
    });
    
    // Budget check listeners
    document.getElementById('activityCost').addEventListener('input', checkBudgets);
    document.getElementById('activityCurrency').addEventListener('change', checkBudgets);
    
    // Balance preview listeners
    document.getElementById('expenseAmount').addEventListener('input', updateBalancePreview);
    document.getElementById('expenseCurrency').addEventListener('change', updateBalancePreview);
    document.getElementById('paidBy').addEventListener('change', updateBalancePreview);
    
    // Update when checkboxes change
    document.addEventListener('change', function(e) {
        if (e.target.closest('#activityParticipantsCheckboxes')) checkBudgets();
        if (e.target.closest('#splitCheckboxes')) updateBalancePreview();
    });
}

function loadSavedData() {
    const saved = localStorage.getItem('tripPlannerData');
    if (saved) {
        const data = JSON.parse(saved);
        
        // Restore dates
        if (data.trip.startDate) data.trip.startDate = new Date(data.trip.startDate);
        if (data.trip.endDate) data.trip.endDate = new Date(data.trip.endDate);
        
        // Restore activity dates
        if (data.activities) {
            data.activities.forEach(activity => {
                if (activity.date) activity.date = new Date(activity.date);
            });
        }
        
        Object.assign(state, data);
        
        // Update UI from saved state
        if (state.trip.name) document.getElementById('tripName').value = state.trip.name;
        if (state.trip.destination) document.getElementById('destination').value = state.trip.destination;
        if (state.trip.description) document.getElementById('tripDescription').value = state.trip.description;
        
        if (state.trip.startDate) document.getElementById('startDate').value = formatDate(state.trip.startDate, 'DD/MM/YYYY');
        if (state.trip.endDate) document.getElementById('endDate').value = formatDate(state.trip.endDate, 'DD/MM/YYYY');
    }
}

function saveData() {
    state.trip.name = document.getElementById('tripName').value;
    state.trip.destination = document.getElementById('destination').value;
    state.trip.description = document.getElementById('tripDescription').value;
    localStorage.setItem('tripPlannerData', JSON.stringify(state));
}

// ====================
// START THE APP
// ====================
window.onload = initializeApp;
