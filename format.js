const formatBtn = document.getElementById("submit");
const resultDiv = document.getElementById("resultado");
const sizeInput = document.getElementById("tablesize");
const textArea = document.getElementById("texto");
const clearBtn = document.getElementById("clear-button");

function normalizeCurrency(str) {
  if (!str) return str;

  const match = str.match(/\$\s*([\d.,]+)/);
  if (!match) return str;

  return `$ ${match[1]}`;
}

function wrapLineAtSpaces(line, limit) {
  const parts = [];
  let s = line.trimEnd();

  while (s.length > limit) {
    let cut = s.lastIndexOf(" ", limit);
    if (cut <= 0) cut = limit;

    parts.push(s.slice(0, cut).trimEnd());
    s = s.slice(cut).trimStart();
  }

  parts.push(s);
  return parts;
}

function parseTsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      const next = text[i + 1];
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === "\t") {
      row.push(normalizeCurrency(cell.trim()));
      cell = "";
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(normalizeCurrency(cell.trim()));
      cell = "";
      if (row.some(v => v.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    cell += ch;
  }

  row.push(normalizeCurrency(cell.trim()));
  if (row.some(v => v.length > 0)) rows.push(row);

  const colCount = Math.max(0, ...rows.map(r => r.length));
  for (const r of rows) while (r.length < colCount) r.push("");

  return { rows, colCount };
}

function wrapRows(rows, colCount, limit) {
  const out = [];

  for (const row of rows) {
    const chunks = row.map(cell => {
      const value = cell ?? "";
      if (value === "") return [""];

      const logicalLines = value.split(/\r?\n/);
      const parts = [];

      for (const ln of logicalLines) {
        if (ln.length === 0) {
          parts.push("");
          continue;
        }
        parts.push(...wrapLineAtSpaces(ln, limit));
      }

      return parts.length ? parts : [""];
    });

    const height = Math.max(...chunks.map(c => c.length));
    for (let h = 0; h < height; h++) {
      const newRow = new Array(colCount);
      for (let c = 0; c < colCount; c++) {
        newRow[c] = chunks[c]?.[h] ?? "";
      }
      out.push(newRow);
    }
  }

  return out;
}

function colWidths(rows, colCount) {
  const widths = new Array(colCount).fill(0);
  for (const r of rows) {
    for (let c = 0; c < colCount; c++) {
      widths[c] = Math.max(widths[c], (r[c] ?? "").length);
    }
  }
  return widths;
}

function computeGap(totalWidth, widths) {
  const cols = widths.length;
  if (cols <= 1) return 1;

  const used = widths.reduce((a, b) => a + b, 0);
  const remaining = totalWidth - used;
  return Math.max(1, Math.floor(remaining / (cols - 1)));
}

function renderTable(rows, widths, gap) {
  const sep = " ".repeat(gap);
  return rows
    .map(r =>
      r.map((cell, i) => {
        const s = cell ?? "";
        return i === widths.length - 1 ? s : s.padEnd(widths[i], " ");
      }).join(sep)
    )
    .join("\n");
}

formatBtn.addEventListener("click", () => {
  const totalWidth = Number.parseInt(sizeInput.value, 10);
  if (!Number.isFinite(totalWidth) || totalWidth <= 0) {
    resultDiv.textContent = "Invalid table width.";
    return;
  }

  const { rows, colCount } = parseTsv(textArea.value);
  if (colCount === 0 || rows.length === 0) {
    resultDiv.textContent = "";
    return;
  }

  let limit = Math.max(4, Math.floor(totalWidth / colCount) - 1);

  let wrapped = wrapRows(rows, colCount, limit);
  let widths = colWidths(wrapped, colCount);
  let gap = computeGap(totalWidth, widths);

  for (let tries = 0; tries < 50 && gap < 1; tries++) {
    limit = Math.max(2, limit - 1);
    wrapped = wrapRows(rows, colCount, limit);
    widths = colWidths(wrapped, colCount);
    gap = computeGap(totalWidth, widths);
  }

  const tableText = renderTable(wrapped, widths, gap);

  resultDiv.innerHTML = `
    <div>
      <button class="grey-but" style="width:10%" onclick="Copy('copyable')">Copiar</button>
    </div>
    <pre id="copyable" class="sise_font border border-dark" style="white-space: pre; max-width: 97ch!important; overflow:auto;">${escapeHtml(tableText)}</pre>
  `;
});

clearBtn.addEventListener("click", () => {
  textArea.value = "";
  resultDiv.textContent = "";
});

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
