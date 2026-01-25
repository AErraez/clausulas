const formatBtn = document.getElementById("submit");
const resultDiv = document.getElementById("resultado");
const textArea = document.getElementById("texto");
const clearBtn = document.getElementById("clear-button");

const columns=['ITEM','COD_RAMO','RAMO','COD_SUB_RAMO','SUB_RAMO','COD_OBJETO','OBJETO',
                'COD_AMPARO','AMPARO','COD_CATEGORIA','CATEGORIA','VALOR_DECLARADO','SUMA_ASEGURADA',
                'TASA','%','AJUSTE_PRIMA','RESP_MAXIMA','LAA','FACULTADO','PRIMER_RIESGO','AJUSTE',
                'DEDUCIBLES','VALOR','MINIMO','MINIMO2','ACUM_PRIMA','ACUM_SUMA','IMPRIME']

function parseFlexibleNumber(input) {
  if (typeof input !== "string") return NaN;

  let value = input
    .replace(/[^\d.,-]/g, "")
    .trim();

  const hasComma = value.includes(",");
  const hasDot = value.includes(".");

  if (hasComma && hasDot) {
    // Both present → last separator is decimal
    if (value.lastIndexOf(",") > value.lastIndexOf(".")) {
      // 25.000,50
      value = value.replace(/\./g, "").replace(",", ".");
    } else {
      // 25,000.50
      value = value.replace(/,/g, "");
    }
  } else if (hasComma || hasDot) {
    const sep = hasComma ? "," : ".";
    const parts = value.split(sep);

    if (parts.length === 2 && parts[1].length === 3) {
      // thousands separator
      value = parts.join("");
    } else {
      // decimal separator
      value = parts.join(".");
    }
  }

  const num = Number(value);
  if (Number.isNaN(num)) return NaN;

  return Math.round(num * 100) / 100;
}

function exportRowsToTSV(rows) {
  return rows
    .map(row =>
      row.map(cell => {
        if (cell === null || cell === undefined) return "";
        if (typeof cell === "number") return cell;
        return String(cell).replace(/\t/g, " ").replace(/\n/g, " ");
      }).join("\t")
    )
    .join("\n");
}


function formatNumberUS(num) {
  if (typeof num !== "number" || Number.isNaN(num)) return "";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function normalizeCell(td) {
  const raw = td.textContent.trim();
  const num = parseFlexibleNumber(raw);

  if (Number.isNaN(num)) {
    td.textContent = "";
    return 0;
  }

  td.textContent = formatNumberUS(num);
  return num;
}

function createTotalsTable(headers) {
  const table = document.createElement("table");
  table.className = "table table-bordered table-sm mb-2";
  table.id = "totalsTable";

  const thead = document.createElement("thead");
  thead.className = "table-light";
  const headRow = document.createElement("tr");

  const labelTh = document.createElement("th");
  labelTh.textContent = "TOTAL";
  headRow.appendChild(labelTh);

  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const tr = document.createElement("tr");

  const labelTd = document.createElement("td");
  labelTd.textContent = "TOTAL";
  labelTd.style.fontWeight = "bold";
  tr.appendChild(labelTd);

  headers.forEach(() => {
    const td = document.createElement("td");
    td.textContent = "0.00";
    td.style.fontWeight = "bold";
    tr.appendChild(td);
  });

  tbody.appendChild(tr);
  table.appendChild(tbody);

  return table;
}


function recalcTotals(excelTable, totalsTable) {
  const tbody = excelTable.tBodies[0];
  const totalRow = totalsTable.tBodies[0].rows[0];

  const colCount = excelTable.tHead.rows[0].cells.length;

  for (let col = 1; col < colCount; col++) {
    let sum = 0;

    Array.from(tbody.rows).forEach(row => {
      const td = row.cells[col];
      if (!td) return;

      const num = parseFlexibleNumber(td.textContent);
      if (!Number.isNaN(num)) sum += num;
    });

    totalRow.cells[col].textContent = formatNumberUS(sum);
  }
}



formatBtn.addEventListener("click", () => {
  resultDiv.innerHTML = "";
  const primer_item=parseInt(document.getElementById("first_item").value);
  const outputText = textArea.value.trim();
  if (!outputText) return;

  const rows = outputText
    .split("\n")
    .map(r => r.split("\t"));
if (rows[0][0]=='1. Item') { // only splice array when item is found
  rows.splice(0, 1); // 2nd parameter means remove one item only
}

  // indices we want (0-based)
  const pickedIndexes = [4, 6, 8, 12, 25, 26, 27];
  const pickedHeaders=['RAMO','OBJETO','AMPARO','SUMA_ASEGURADA','ACUM_PRIMA','ACUM_SUMA','IMPRIME']

  // create table
  const table = document.createElement("table");
  table.className = "table table-bordered table-sm";

  // ---------- THEAD ----------
  const thead = document.createElement("thead");
  thead.className = "table-light";
  const headRow = document.createElement("tr");

  // checkbox column header
const selectTh = document.createElement("th");
selectTh.textContent = "SELECCIÓN";
headRow.appendChild(selectTh);

  // ordinal headers
  pickedIndexes.forEach((_, i) => {
    const th = document.createElement("th");
    th.textContent = pickedHeaders[i];
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  table.appendChild(thead);

  // ---------- TBODY ----------
  const tbody = document.createElement("tbody");

rows.forEach((row, rowIndex) => {
  const tr = document.createElement("tr");

  // 🔑 keep reference to original row
  tr.dataset.rowIndex = rowIndex;

  // checkbox column
  const checkTd = document.createElement("td");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkTd.appendChild(checkbox);
  tr.appendChild(checkTd);

  // picked values
  pickedIndexes.forEach(idx => {
    const td = document.createElement("td");
    td.textContent = row[idx] ?? "";
    tr.appendChild(td);
  });

  tbody.appendChild(tr);
});


  table.appendChild(tbody);
const label = document.createElement("label");
label.textContent = "Seleccione únicamente los objetos asegurados:";
resultDiv.appendChild(label);

const container = document.createElement("div");
container.className = "table-container my-3";

// Put table INSIDE container
container.appendChild(table);

// Add container to resultDiv
resultDiv.appendChild(container);

const next_button = document.createElement("button");
next_button.textContent = "Continuar";
next_button.className = "grey-but my-3";
resultDiv.appendChild(next_button);

next_button.addEventListener("click", () => {
  const objetos = [];
  const amparos = [];

  // iterate visible table rows
  tbody.querySelectorAll("tr").forEach(tr => {
    const checkbox = tr.querySelector('input[type="checkbox"]');
    const originalRow = rows[tr.dataset.rowIndex];
    checkbox.checked ? objetos.push(originalRow) : amparos.push(originalRow);
  });

  console.log("OBJETOS:", objetos);
  console.log("AMPAROS:", amparos);
// 🔥 clear previous UI
resultDiv.innerHTML = "";

// ---------- CREATE TABLE ----------
const excelTable = document.createElement("table");
excelTable.className = "table table-bordered table-sm";
excelTable.id = "excelTable";

// ---------- THEAD ----------
const thead = document.createElement("thead");
thead.className = "table-light";
const headRow = document.createElement("tr");

// ITEM header
const itemTh = document.createElement("th");
itemTh.textContent = "ITEM";
headRow.appendChild(itemTh);

// dynamic headers from objetos
objetos.forEach(objeto => {
  const th = document.createElement("th");
  th.textContent = `${objeto[4]}-${objeto[6]}`;
  headRow.appendChild(th);
});

thead.appendChild(headRow);
excelTable.appendChild(thead);

const totalHeaders = objetos.map(o => `${o[4]}-${o[6]}`);
const totalsTable = createTotalsTable(totalHeaders);

// ⬆️ totals first
const totalsContainer = document.createElement("div");
totalsContainer.className = "excel-table-container mb-2";
totalsContainer.appendChild(totalsTable);
resultDiv.appendChild(totalsContainer);



// ---------- TBODY ----------
const tbodyExcel = document.createElement("tbody");

// first row
const firstRow = document.createElement("tr");

// ITEM cell (not editable)
const itemTd = document.createElement("td");
itemTd.textContent = primer_item;
itemTd.contentEditable = "false";
firstRow.appendChild(itemTd);

// values from objeto[12]
objetos.forEach(objeto => {
  const td = document.createElement("td");

const raw = objeto[12] ?? "";
const num = parseFlexibleNumber(String(raw));
td.textContent = Number.isNaN(num) ? "" : formatNumberUS(num);


  td.contentEditable = "true";
  firstRow.appendChild(td);
});

tbodyExcel.appendChild(firstRow);
excelTable.appendChild(tbodyExcel);

// append to UI
// ---------- SCROLLABLE CONTAINER ----------
const excelContainer = document.createElement("div");
excelContainer.className = "excel-table-container my-3";

// put table inside container
excelContainer.appendChild(excelTable);
recalcTotals(excelTable, totalsTable);

excelTable.addEventListener("blur", (e) => {
  const td = e.target.closest("td");
  if (!td) return;

  // ignore ITEM column
  if (td.cellIndex === 0) return;

  normalizeCell(td);
  recalcTotals(excelTable, totalsTable);
}, true); // 👈 capture phase is important

// append container instead of table
resultDiv.appendChild(excelContainer);

excelTable.addEventListener("paste", function (e) {
  const cell = e.target.closest("td");
  if (!cell) return;

  e.preventDefault();

  const text = e.clipboardData.getData("text/plain");
  const rows = text.trim().split(/\r?\n/);

  const startRow = cell.parentElement.rowIndex - 1; // tbody index
  const startCol = cell.cellIndex;
  const tbody = this.tBodies[0];
  const totalCols = this.tHead.rows[0].cells.length;

  rows.forEach((rowText, r) => {
    const values = rowText.split("\t");

    let row = tbody.rows[startRow + r];
    if (!row) {
      row = tbody.insertRow();

      // ITEM cell (auto increment, locked)
      const itemCell = row.insertCell();
      itemCell.contentEditable = "false";
      itemCell.textContent = primer_item + tbody.rows.length - 1;

      // rest of cells editable
      for (let i = 1; i < totalCols; i++) {
        const td = row.insertCell();
        td.contentEditable = "true";
      }
    }

    values.forEach((value, c) => {
      const targetCell = row.cells[startCol + c];
      if (targetCell && targetCell.cellIndex !== 0) {
        targetCell.textContent = value;
        normalizeCell(targetCell);

      }
    });
    recalcTotals(excelTable, totalsTable);


  });
});

const final_button = document.createElement("button");
final_button.textContent = "Finalizar";
final_button.className = "grey-but my-3";
resultDiv.appendChild(final_button);

final_button.addEventListener("click", () => {
  const finalRows = [];

  const tbody = excelTable.tBodies[0];

  // iterate each ITEM row in excelTable
  Array.from(tbody.rows).forEach(excelRow => {
    const itemNumber = excelRow.cells[0].textContent;

    // ---------- OBJETOS ----------
    objetos.forEach((objeto, colIndex) => {
      const cell = excelRow.cells[colIndex + 1]; // +1 skips ITEM col
      if (!cell) return;

      const value = parseFlexibleNumber(cell.textContent);

      // skip empty or zero
      if (!value || value === 0) return;

      // clone original objeto row
      const newRow = [...objeto];

      // override values
      newRow[0]  = itemNumber; // ITEM
      newRow[11] = value;
      newRow[12] = value;
      newRow[16] = value;

      finalRows.push(newRow);
    });

    // ---------- AMPAROS ----------
    amparos.forEach(amparo => {
      const newRow = [...amparo];
      newRow[0] = itemNumber; // only ITEM changes
      finalRows.push(newRow);
    });
  });

  const tsv = exportRowsToTSV(finalRows);

// copy to clipboard
navigator.clipboard.writeText(tsv).then(() => {
  alert("Tabla copiado al portapapeles. Pega directamente en Excel.");
});

});


});

});


clearBtn.addEventListener("click", () => {
  textArea.value = "";
  resultDiv.textContent = "";
});
