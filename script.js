const group = {
  name: "",
  members: [],
  expenses: []
};

document.getElementById("toggle-theme").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

function createGroup() {
  const name = document.getElementById("group-name").value.trim();
  const raw = document.getElementById("participants").value;
  const members = raw.split(",").map(m => m.trim()).filter(Boolean);

  if (!name || members.length < 2) {
    alert("Enter a group name and at least two members.");
    return;
  }

  group.name = name;
  group.members = members;
  group.expenses = [];

  updatePayer();
  updateSplitUsers();
  renderSummary();
}

function updatePayer() {
  const select = document.getElementById("payer");
  select.innerHTML = "";
  group.members.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });
}

function updateSplitUsers() {
  const div = document.getElementById("split-users");
  div.innerHTML = "";
  group.members.forEach(m => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${m}"/> ${m}`;
    div.appendChild(label);
  });
}

function addExpense() {
  const payer = document.getElementById("payer").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const desc = document.getElementById("desc").value.trim();
  const category = document.getElementById("category").value;
  const selected = Array.from(document.querySelectorAll("#split-users input:checked")).map(cb => cb.value);

  if (!payer || !amount || !desc || selected.length < 1) {
    alert("Fill all fields and select split users.");
    return;
  }

  group.expenses.push({ payer, amount, desc, category, splitWith: selected });
  renderSummary();
}

function renderSummary() {
  const expenseList = document.getElementById("expense-list");
  const balanceSummary = document.getElementById("balance-summary");
  expenseList.innerHTML = "";
  balanceSummary.innerHTML = "";

  const expenseTable = document.createElement("table");
  expenseTable.innerHTML = `
    <thead><tr><th>Payer</th><th>Amount</th><th>Description</th><th>Category</th><th>Split With</th></tr></thead>
    <tbody></tbody>
  `;
  const tbody = expenseTable.querySelector("tbody");
  const balances = {};
  group.members.forEach(m => balances[m] = 0);

  group.expenses.forEach(exp => {
    const split = exp.amount / exp.splitWith.length;
    exp.splitWith.forEach(m => balances[m] -= split);
    balances[exp.payer] += exp.amount;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.payer}</td>
      <td>₹${exp.amount.toFixed(2)}</td>
      <td>${exp.desc}</td>
      <td>${exp.category}</td>
      <td>${exp.splitWith.join(", ")}</td>
    `;
    tbody.appendChild(row);
  });

  expenseList.appendChild(expenseTable);

  const balanceTable = document.createElement("table");
  balanceTable.innerHTML = `
    <thead><tr><th>Member</th><th>Balance</th></tr></thead>
    <tbody></tbody>
  `;
  const balBody = balanceTable.querySelector("tbody");
  for (const m in balances) {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${m}</td><td>₹${balances[m].toFixed(2)}</td>`;
    balBody.appendChild(row);
  }

  balanceSummary.appendChild(balanceTable);
}

document.getElementById("export-btn").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont("courier");
  doc.setFontSize(12);

  doc.text(`Group: ${group.name}`, 10, 10);
  doc.text("Members: " + group.members.join(", "), 10, 20);

  const expenseRows = group.expenses.map(exp => [
    exp.payer,
    `₹${exp.amount.toFixed(2)}`,
    exp.desc,
    exp.category,
    exp.splitWith.join(", ")
  ]);

  doc.autoTable({
    startY: 30,
    head: [["Payer", "Amount", "Description", "Category", "Split With"]],
    body: expenseRows,
    styles: { font: "courier", fontSize: 11 }
  });

  const balances = {};
  group.members.forEach(m => balances[m] = 0);
  group.expenses.forEach(exp => {
    const split = exp.amount / exp.splitWith.length;
    exp.splitWith.forEach(m => balances[m] -= split);
    balances[exp.payer] += exp.amount;
  });

  const balanceRows = Object.entries(balances).map(([name, amount]) => [name, `₹${amount.toFixed(2)}`]);
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Member", "Balance"]],
    body: balanceRows,
    styles: { font: "courier", fontSize: 11 }
  });

  doc.save(`${group.name}_summary.pdf`);
});
