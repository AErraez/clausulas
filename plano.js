const formatBtn = document.getElementById("submit");
const resultDiv = document.getElementById("resultado");
const textArea = document.getElementById("texto");
const clearBtn = document.getElementById("clear-button");

const EDITABLE_COLS = new Set([
  18, // Debe Facultar?
  25, // Acum. Prima Total
  26, // Acum. Suma Total
  27  // Se imprime
]);


const finalHeaders = [
  "1. Item",
  "2. Cod Ramo",
  "3. Ramo",
  "4. Cod Sub Ramo",
  "5. Sub Ramo",
  "6. Cod Obj del Seg",
  "7. Obj del Seg",
  "8. Cod Amparo",
  "9. Amparo",
  "10. Cod Categoría",
  "11. Categoría",
  "12. Valor Declarado",
  "13. Suma Asegurada",
  "14. Tasa",
  "15. % - %o",
  "16. Ajuste de prima",
  "17. Responsabilidad Máxima",
  "18. Limite Agregado Anual",
  "19. Debe Facultar?",
  "20. A Primer Riesgo",
  "21. Ajuste",
  "22. Deducibles",
  "23. Valor",
  "24. Mínimo",
  "25. Mínimo",
  "26. Acum. Prima Total",
  "27. Acum. Suma Total",
  "28. Se imprime"
];


function createInstructionBox({ title, text, type = "info", icon = "ℹ️" }) {
  const box = document.createElement("div");
  box.className = `alert alert-${type} mb-3`;

  const strong = document.createElement("strong");
  strong.textContent = `${icon} ${title}`;
  box.appendChild(strong);

  const p = document.createElement("div");
  p.className = "mt-1";
  p.textContent = text;
  box.appendChild(p);

  return box;
}


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
  const pickedIndexes = [4, 6, 8, 12,18, 25, 26, 27];
  const pickedHeaders=['RAMO','OBJETO','AMPARO','SUMA_ASEGURADA','FACULTADO','ACUM_PRIMA','ACUM_SUMA','IMPRIME']

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
  td.dataset.colIndex = idx;

  if (EDITABLE_COLS.has(idx)) {
    td.contentEditable = "true";
    td.classList.add("binary-cell");
  }

  tr.appendChild(td);
});


  tbody.appendChild(tr);
});

table.addEventListener("blur", (e) => {
  const td = e.target.closest("td");
  if (!td || !td.isContentEditable) return;

  const tr = td.closest("tr");
  const rowIndex = tr.dataset.rowIndex;
  const colIndex = Number(td.dataset.colIndex);

  if (rowIndex == null || Number.isNaN(colIndex)) return;

  let raw = td.textContent.trim();

  // normalize input
  let value;
  if (raw === "-1") value = -1;
  else value = 0; // default fallback

  // reflect normalized value in UI
  td.textContent = value;

  // 🔥 persist into original data
  rows[rowIndex][colIndex] = value;

}, true);



  table.appendChild(tbody);
resultDiv.appendChild(
  createInstructionBox({
    title: "Seleccione los objetos asegurados",
    text: "Marque únicamente los objetos que deben recibir valores. Los no seleccionados se tratarán como amparos.",
    type: "primary",
    icon: "🧾"
  })
);

resultDiv.appendChild(
  createInstructionBox({
    title: "Verifique el campo IMPRIME",
    text: "Antes de continuar, asegúrese de que todos los objetos a imprimir tengan el valor IMPRIME en -1.",
    type: "warning",
    icon: "⚠️"
  })
);



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
resultDiv.appendChild(
  createInstructionBox({
    title: "Pegue valores desde Excel",
    text: "Haga clic en una celda y pegue los valores correspondientes a cada objeto asegurado. Puede pegar múltiples filas y columnas como en Excel.",
    type: "success",
    icon: "📋"
  })
);

resultDiv.appendChild(
  createInstructionBox({
    title: "Importante:",
    text: "Las celdas vacías o que contengan texto serán interpretadas como 0.",
    type: "warning",
    icon: "⚠️"
  })
);

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
const totalsCard = document.createElement("div");
totalsCard.className = "card mb-3";
totalsCard.style.display = "none"

const totalsHeader = document.createElement("div");
totalsHeader.className = "card-header py-2";
totalsHeader.innerHTML = "📊 <strong>Totales por objeto</strong>";

const totalsBody = document.createElement("div");
totalsBody.className = "card-body p-2 excel-table-container";
totalsBody.appendChild(totalsTable);

totalsCard.appendChild(totalsHeader);
totalsCard.appendChild(totalsBody);
resultDiv.appendChild(totalsCard);
let totalsShown = false;
excelTable.addEventListener("paste", function (e) {
  const cell = e.target.closest("td");
  if (!cell) return;

  e.preventDefault();

  if (!totalsShown) {
    totalsCard.style.display = "block";
    totalsShown = true;
  }

  const text = e.clipboardData.getData("text/plain");
  const rows = text.split(/\r?\n/);

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

const tsv =
  finalHeaders.join("\t") + "\n" +
  exportRowsToTSV(finalRows);

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
