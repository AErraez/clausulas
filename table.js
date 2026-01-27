const formatBtn = document.getElementById("submit");
const resultDiv = document.getElementById("resultado");
const sizeInput = document.getElementById("tablesize");
const textArea = document.getElementById("texto");
const clearBtn = document.getElementById("clear-button");

const MIN_GAP = 2;

const characters={
    '€':'EUR',
    '—':'-',
    '…':'...',
    '•':'-',
    '™':'(TM)',
}
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeCurrency(str) {
  if (!str) return str;
  const s = String(str).replace(/\u00A0/g, " ").trim();
  const m = s.match(/\$\s*([0-9][0-9.,]*)/);
  if (!m) return s;
  return `$ ${m[1]}`;
}

function parseTsv(text) {
  for (const [key, value] of Object.entries(characters)) {
        text = text.split(key).join(value);
    }
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  let cellStart = true; // NEW: are we at the start of a cell?

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    // Only enter/exit quoted-mode if the quote begins a cell
    if (ch === '"' && cellStart) {
      inQuotes = true;
      cellStart = false;
      continue;
    }

    // If we are in quoted-mode, allow "" to mean a literal "
    if (inQuotes && ch === '"') {
      const next = text[i + 1];
      if (next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = false; // closing quote
      }
      continue;
    }

    if (!inQuotes && ch === "\t") {
      row.push(normalizeCurrency(cell.trim()));
      cell = "";
      cellStart = true;
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(normalizeCurrency(cell.trim()));
      cell = "";
      cellStart = true;

      if (row.some(v => String(v).trim().length > 0)) rows.push(row);
      row = [];
      continue;
    }

    cell += ch;
    cellStart = false;
  }

  row.push(normalizeCurrency(cell.trim()));
  if (row.some(v => String(v).trim().length > 0)) rows.push(row);

  const colCount = Math.max(0, ...rows.map(r => r.length));
  for (const r of rows) while (r.length < colCount) r.push("");

  return { rows, colCount };
}

function wrapLineAtSpaces(line, limit) {
  const parts = [];
  let s = String(line ?? "").trim();

  if (s.length === 0) return [""];

  while (s.length > limit) {
    let cut = s.lastIndexOf(" ", limit);
    if (cut <= 0) cut = limit;

    parts.push(s.slice(0, cut).trimEnd());
    s = s.slice(cut).trimStart();
  }

  parts.push(s);
  return parts;
}

function setupLongestLens(rows, colCount) {
  const longestLens = new Array(colCount).fill(0);

  for (const r of rows) {
    for (let c = 0; c < colCount; c++) {
      const v = String(r[c] ?? "").trim();
      const lines = v.split(/\r?\n/);
      for (const ln of lines) longestLens[c] = Math.max(longestLens[c], ln.length);
    }
  }

  for (let c = 0; c < colCount; c++) longestLens[c] = Math.max(1, longestLens[c]);
  return longestLens;
}


function calcSequentialLimit(totalWidth, colCount, longestLens) {
  const glob = Math.floor(totalWidth / colCount);

  let sum = 0;
  let nExceeding = 0;

  for (const w of longestLens) {
    if (w <= glob) sum += (glob - w);
    else nExceeding += 1;
  }

  if (nExceeding === 0) return Math.max(2, glob);

  const limit =
    glob +
    Math.floor(sum / nExceeding) -
    Math.ceil((colCount - 1) / nExceeding);

  return Math.max(2, limit);
}


function wrapRowsNoRepeat(rows, colCount, colWidths) {
  const out = [];

  for (const row of rows) {
    const chunks = row.map((cell, c) => {
      const value = String(cell ?? "");
      if (value === "") return [""];

      const logicalLines = value.split(/\r?\n/);
      const parts = [];

      for (const ln0 of logicalLines) {
        const ln = String(ln0);
        if (ln.trim().length === 0) {
          parts.push("");
          continue;
        }
        parts.push(...wrapLineAtSpaces(ln, colWidths[c]));
      }

      return parts.length ? parts : [""];
    });

    const height = Math.max(...chunks.map(a => a.length));

    for (let h = 0; h < height; h++) {
      const newRow = new Array(colCount).fill("");
      for (let c = 0; c < colCount; c++) {
        newRow[c] = chunks[c][h] ?? "";
      }
      out.push(newRow);
    }
  }

  return out;
}

function usedWidthsFromWrapped(wrapped, colCount) {
  const widths = new Array(colCount).fill(0);
  for (const r of wrapped) {
    for (let c = 0; c < colCount; c++) {
      widths[c] = Math.max(widths[c], String(r[c] ?? "").length);
    }
  }
  for (let c = 0; c < colCount; c++) widths[c] = Math.max(1, widths[c]);
  return widths;
}

function renderTable(wrapped, colWidths, gap) {
  const sep = " ".repeat(gap);
  const cols = colWidths.length;

  return wrapped
    .map(r =>
      r.map((cell, i) => {
        const s = String(cell ?? "");
        return i === cols - 1 ? s : s.padEnd(colWidths[i], " ");
      }).join(sep)
    )
    .join("\n");
}



function layoutMaxSpace(rows, colCount, totalWidth) {
  const longestLens = setupLongestLens(rows, colCount);

  const widthBudgetForCols = totalWidth - MIN_GAP * (colCount - 1);
  if (widthBudgetForCols <= colCount) {
    const tiny = new Array(colCount).fill(1);
    const wrapped = wrapRowsNoRepeat(rows, colCount, tiny);
    return { wrapped, colWidths: tiny, gap: MIN_GAP };
  }

  let limit = calcSequentialLimit(widthBudgetForCols, colCount, longestLens);


  let colWidths = longestLens.map(w => Math.min(w, limit));

  let wrapped = wrapRowsNoRepeat(rows, colCount, colWidths);
  let used = usedWidthsFromWrapped(wrapped, colCount);


  let slack = totalWidth - used.reduce((a, b) => a + b, 0) - MIN_GAP * (colCount - 1);


  let guard = 0;
  while (slack > 0 && guard < 20000) {
    guard++;


    let grew = false;
    for (let c = 0; c < colCount && slack > 0; c++) {
      if (colWidths[c] < longestLens[c]) {
        colWidths[c] += 1;
        slack -= 1;
        grew = true;
      }
    }


    if (!grew) break;


    if (guard % 20 === 0) {
      wrapped = wrapRowsNoRepeat(rows, colCount, colWidths);
      used = usedWidthsFromWrapped(wrapped, colCount);
      slack = totalWidth - used.reduce((a, b) => a + b, 0) - MIN_GAP * (colCount - 1);
    }
  }


  wrapped = wrapRowsNoRepeat(rows, colCount, colWidths);
  used = usedWidthsFromWrapped(wrapped, colCount);


  const baseGap = MIN_GAP;

  // Start with minimum gap (don’t inflate it yet)
  let gap = baseGap;

  // Hard clamp: last column must fit in totalWidth given other columns + gaps
  const last = colCount - 1;

  // Recompute available width for last column based on current used widths
  // (use "used" for other columns, because that’s what you actually render)
  const otherColsWidth = used
    .slice(0, last)
    .reduce((a, b) => a + b, 0);

  // Max width the last column is allowed to occupy on a line
  let maxLastWidth = totalWidth - otherColsWidth - gap * (colCount - 1);
  maxLastWidth = Math.max(1, maxLastWidth);

  // If last column would exceed, force wrap by shrinking it
  if (colWidths[last] > maxLastWidth) {
    colWidths[last] = maxLastWidth;

    wrapped = wrapRowsNoRepeat(rows, colCount, colWidths);
    used = usedWidthsFromWrapped(wrapped, colCount);
  }

  // Now (optionally) distribute extra space into the gap, BUT never break width constraint
  const usedCols = used.reduce((a, b) => a + b, 0);
  const remaining = totalWidth - usedCols - baseGap * (colCount - 1);
  const extraSlack = Math.max(0, remaining);

  const extraPerGap = colCount > 1 ? Math.floor(extraSlack / (colCount - 1)) : 0;
  gap = baseGap + extraPerGap;

  // Re-check constraint after increasing gap:
  // increasing gap reduces available width for last col, so clamp again if needed.
  maxLastWidth = totalWidth - otherColsWidth - gap * (colCount - 1);
  maxLastWidth = Math.max(1, maxLastWidth);

  if (colWidths[last] > maxLastWidth) {
    colWidths[last] = maxLastWidth;
    wrapped = wrapRowsNoRepeat(rows, colCount, colWidths);
    used = usedWidthsFromWrapped(wrapped, colCount);
  }

  return { wrapped, colWidths: used, gap };

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

  const { wrapped, colWidths, gap } = layoutMaxSpace(rows, colCount, totalWidth);
  const tableText = renderTable(wrapped, colWidths, gap);

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
