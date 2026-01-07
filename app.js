// Global State
const state = {
    trip: {
        name: "Bali Vacation",
        destination: "Bali, Indonesia",
        startDate: null,
        endDate: null
    },
    activities: [],
    calendar: {
        currentDate: new Date(),
        selectedDate: null,
        activeCalendar: null // 'start', 'end', or 'activity'
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set today's date in inputs
    const today = new Date();
    const todayFormatted = formatDate(today, 'DD/MM/YYYY');
    
    document.getElementById('startDate').value = todayFormatted;
    document.getElementById('endDate').value = addDays(today, 7);
    
    // Initialize calendars
    createCalendar('calendarStart', 'start');
    createCalendar('calendarEnd', 'end');
    createCalendar('calendarActivity', 'activity');
    
    // Add event listeners for manual input
    document.getElementById('startDate').addEventListener('input', function(e) {
        const date = parseDateInput(this.value);
        if (date) {
            state.trip.startDate = date;
            updateSummary();
        }
    });
    
    document.getElementById('endDate').addEventListener('input', function(e) {
        const date = parseDateInput(this.value);
        if (date) {
            state.trip.endDate = date;
            updateSummary();
        }
    });
    
    // Close calendar when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.date-container')) {
            hideAllCalendars();
        }
    });
    
    updateSummary();
}

// Date Formatting Functions
function formatDate(date, format = 'DD/MM/YYYY') {
    if (!date) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    switch(format) {
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'Month D, YYYY':
            return `${monthNames[date.getMonth()]} ${date.getDate()}, ${year}`;
        case 'D Month YYYY':
            return `${date.getDate()} ${monthNames[date.getMonth()]} ${year}`;
        default:
            return `${day}/${month}/${year}`;
    }
}

function parseDateInput(input) {
    if (!input) return null;
    
    // Try DD/MM/YYYY format
    let match = input.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = parseInt(match[3]);
        return new Date(year, month, day);
    }
    
    // Try MM/DD/YYYY format
    match = input.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (match) {
        const month = parseInt(match[1]) - 1;
        const day = parseInt(match[2]);
        const year = parseInt(match[3]);
        return new Date(year, month, day);
    }
    
    // Try YYYY-MM-DD format
    match = input.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const day = parseInt(match[3]);
        return new Date(year, month, day);
    }
    
    // Try textual date (e.g., "Jan 15, 2024")
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }
    
    return null;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return formatDate(result, 'DD/MM/YYYY');
}

// Calendar Functions
function createCalendar(containerId, type) {
    const container = document.getElementById(containerId);
    const today = new Date();
    const currentDate = new Date(state.calendar.currentDate);
    
    container.innerHTML = generateCalendarHTML(currentDate, today, type);
    
    // Add click handlers for calendar buttons
    container.querySelector('.prev-month')?.addEventListener('click', () => {
        changeMonth(containerId, type, -1);
    });
    
    container.querySelector('.next-month')?.addEventListener('click', () => {
        changeMonth(containerId, type, 1);
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
        
        html += `<div class="${className}" data-date="${formatDate(currentDate, 'YYYY-MM-DD')}">${day}</div>`;
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

function changeMonth(containerId, type, direction) {
    const currentDate = new Date(state.calendar.currentDate);
    currentDate.setMonth(currentDate.getMonth() + direction);
    state.calendar.currentDate = currentDate;
    
    createCalendar(containerId, type);
    addDayClickHandlers(type);
}

function addDayClickHandlers(type) {
    const calendarId = `calendar${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const container = document.getElementById(calendarId);
    
    container.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
        day.addEventListener('click', function() {
            const dateStr = this.getAttribute('data-date');
            const [year, month, day] = dateStr.split('-').map(Number);
            const selectedDate = new Date(year, month - 1, day);
            
            // Update selected date
            state.calendar.selectedDate = selectedDate;
            
            // Update the input field
            const inputId = type === 'activity' ? 'activityDate' : `${type}Date`;
            document.getElementById(inputId).value = formatDate(selectedDate, 'DD/MM/YYYY');
            
            // Update state
            if (type === 'start') {
                state.trip.startDate = selectedDate;
            } else if (type === 'end') {
                state.trip.endDate = selectedDate;
            }
            
            // Re-render calendar to show selection
            createCalendar(calendarId, type);
            addDayClickHandlers(type);
            
            // Hide calendar
            hideCalendar(type);
            
            // Update summary
            updateSummary();
        });
    });
}

// Calendar Toggle Functions
function toggleCalendar(type) {
    const calendarId = `calendar${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const calendar = document.getElementById(calendarId);
    
    // Hide all calendars first
    hideAllCalendars();
    
    // Show this calendar
    calendar.classList.add('active');
    state.calendar.activeCalendar = type;
    
    // Add click handlers for days
    addDayClickHandlers(type);
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
    state.calendar.activeCalendar = null;
}

// Activity Functions
function addActivityDate() {
    const dateInput = document.getElementById('activityDate').value;
    const date = parseDateInput(dateInput);
    
    if (!date) {
        alert('Please enter a valid date in DD/MM/YYYY format');
        return;
    }
    
    const activity = {
        id: Date.now(),
        date: date,
        formattedDate: formatDate(date, 'DD/MM/YYYY'),
        description: `Activity on ${formatDate(date, 'DD/MM/YYYY')}`
    };
    
    state.activities.push(activity);
    updateActivitiesList();
    updateSummary();
    
    // Clear input
    document.getElementById('activityDate').value = '';
}

function updateActivitiesList() {
    const container = document.getElementById('activitiesContainer');
    
    if (state.activities.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No activities added yet</p>';
        return;
    }
    
    container.innerHTML = state.activities.map(activity => `
        <div class="date-item">
            <div>
                <strong>${activity.formattedDate}</strong>
                <div style="font-size: 0.9rem; color: #666;">${activity.description}</div>
            </div>
            <button class="delete-date" onclick="deleteActivity(${activity.id})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function deleteActivity(id) {
    state.activities = state.activities.filter(a => a.id !== id);
    updateActivitiesList();
    updateSummary();
}

// Date Format Converter
function convertDateFormat() {
    const input = document.getElementById('dateInput').value;
    const format = document.getElementById('formatSelect').value;
    
    if (!input) {
        alert('Please enter a date to convert');
        return;
    }
    
    const date = parseDateInput(input);
    
    if (!date) {
        alert('Could not understand the date format. Please try formats like: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, or "Jan 15, 2024"');
        return;
    }
    
    const converted = formatDate(date, format);
    
    document.getElementById('convertedDate').textContent = converted;
    document.getElementById('dateResult').style.display = 'block';
}

// Summary Functions
function updateSummary() {
    const tripName = document.getElementById('tripName').value || 'Unnamed Trip';
    document.getElementById('summaryName').textContent = tripName;
    
    // Update dates
    if (state.trip.startDate && state.trip.endDate) {
        const start = formatDate(state.trip.startDate, 'DD/MM/YYYY');
        const end = formatDate(state.trip.endDate, 'DD/MM/YYYY');
        document.getElementById('summaryDates').textContent = `${start} to ${end}`;
        
        // Calculate duration
        const diffTime = Math.abs(state.trip.endDate - state.trip.startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        document.getElementById('summaryDuration').textContent = `${diffDays} days`;
    } else {
        document.getElementById('summaryDates').textContent = 'No dates selected';
        document.getElementById('summaryDuration').textContent = '0 days';
    }
    
    // Update activities count
    document.getElementById('summaryActivities').textContent = state.activities.length;
}

// Export trip data (for debugging)
function exportTripData() {
    const data = {
        trip: state.trip,
        activities: state.activities,
        summary: {
            name: document.getElementById('tripName').value,
            destination: document.getElementById('destination').value,
            duration: document.getElementById('summaryDuration').textContent
        }
    };
    
    console.log('Trip Data:', data);
    alert('Trip data logged to console. Check Developer Tools (F12)');
}

// Auto-format date input (as user types)
document.addEventListener('DOMContentLoaded', function() {
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
        });
    });
});
