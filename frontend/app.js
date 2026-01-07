let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

function addExpense() {
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    
    if (desc && amount) {
        const expense = {
            id: Date.now(),
            description: desc,
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            paidBy: "You",
            splitBetween: ["You", "Friend1", "Friend2"]
        };
        
        expenses.push(expense);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        renderExpenses();
        calculateBalances();
        
        // Clear inputs
        document.getElementById('desc').value = '';
        document.getElementById('amount').value = '';
    }
}

function renderExpenses() {
    const list = document.getElementById('expensesList');
    list.innerHTML = expenses.map(exp => `
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
    renderExpenses();
    calculateBalances();
}

function calculateBalances() {
    // Simple calculation: split equally between 3 people
    const balances = { "You": 0, "Friend1": 0, "Friend2": 0 };
    
    expenses.forEach(expense => {
        const share = expense.amount / 3;
        balances[expense.paidBy] += expense.amount;
        
        ["You", "Friend1", "Friend2"].forEach(person => {
            if (person !== expense.paidBy) {
                balances[person] -= share;
            }
        });
    });
    
    document.getElementById('balances').innerHTML = `
        <p><strong>You:</strong> ${balances["You"] > 0 ? 'Gets $' + Math.abs(balances["You"]).toFixed(2) : 'Owes $' + Math.abs(balances["You"]).toFixed(2)}</p>
        <p><strong>Friend1:</strong> ${balances["Friend1"] > 0 ? 'Gets $' + Math.abs(balances["Friend1"]).toFixed(2) : 'Owes $' + Math.abs(balances["Friend1"]).toFixed(2)}</p>
        <p><strong>Friend2:</strong> ${balances["Friend2"] > 0 ? 'Gets $' + Math.abs(balances["Friend2"]).toFixed(2) : 'Owes $' + Math.abs(balances["Friend2"]).toFixed(2)}</p>
    `;
}

// Initial render
renderExpenses();
calculateBalances();
