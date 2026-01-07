let expenses = [];

// Load saved expenses
if (localStorage.getItem('expenses')) {
    expenses = JSON.parse(localStorage.getItem('expenses'));
    showExpenses();
    calculateBalance();
}

function addExpense() {
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const paidBy = document.getElementById('paidBy').value;
    
    if (!desc || !amount) {
        alert('Please fill all fields');
        return;
    }
    
    // Create expense object
    const expense = {
        id: Date.now(), // Unique ID
        description: desc,
        amount: amount,
        paidBy: paidBy,
        date: new Date().toLocaleDateString(),
        splitBetween: ['You', 'Friend', 'Partner'] // Always split 3 ways
    };
    
    // Add to list
    expenses.push(expense);
    
    // Save to browser
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    // Update display
    showExpenses();
    calculateBalance();
    
    // Clear inputs
    document.getElementById('desc').value = '';
    document.getElementById('amount').value = '';
}

function showExpenses() {
    const container = document.getElementById('expenses');
    if (expenses.length === 0) {
        container.innerHTML = '<p>No expenses added yet.</p>';
        return;
    }
    
    container.innerHTML = expenses.map(exp => `
        <div class="expense">
            <strong>${exp.description}</strong> - $${exp.amount}
            <br><small>Paid by: ${exp.paidBy} | ${exp.date}</small>
            <button onclick="deleteExpense(${exp.id})">Delete</button>
        </div>
    `).join('');
}

function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    showExpenses();
    calculateBalance();
}

function calculateBalance() {
    const people = ['You', 'Friend', 'Partner'];
    const balances = { 'You': 0, 'Friend': 0, 'Partner': 0 };
    
    // For each expense, split 3 ways
    expenses.forEach(exp => {
        const share = exp.amount / 3;
        
        // Person who paid gets money back
        balances[exp.paidBy] += exp.amount;
        
        // Everyone owes their share
        people.forEach(person => {
            if (person !== exp.paidBy) {
                balances[person] -= share;
            }
        });
    });
    
    // Display results
    const balanceDiv = document.getElementById('balance');
    balanceDiv.innerHTML = `
        <p><strong>You:</strong> ${balances['You'] > 0 ? 'Gets $' + balances['You'].toFixed(2) : 'Owes $' + Math.abs(balances['You']).toFixed(2)}</p>
        <p><strong>Friend:</strong> ${balances['Friend'] > 0 ? 'Gets $' + Math.abs(balances['Friend']).toFixed(2) : 'Owes $' + Math.abs(balances['Friend']).toFixed(2)}</p>
        <p><strong>Partner:</strong> ${balances['Partner'] > 0 ? 'Gets $' + Math.abs(balances['Partner']).toFixed(2) : 'Owes $' + Math.abs(balances['Partner']).toFixed(2)}</p>
    `;
}
