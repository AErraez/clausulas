const formatBtn = document.getElementById("submit");
const resultDiv = document.getElementById("resultado");
const sizeInput = document.getElementById("tablesize");
const textArea = document.getElementById("texto");
const clearBtn = document.getElementById("clear-button");
const headerSepCheckbox = document.getElementById("useHeaderSep");

const MIN_GAP = 2;

function isMoney(value) {
  if (!value) return false;
  const v = String(value).trim();
  return /^(?:US\$|us\$|\$)\s*\d[\d,\s]*(?:\.\d+)?$/.test(v);
}

function longestBodyValue(rows, col) {
  let max = 1;
  for (let r = 1; r < rows.length; r++) {
    const v = String(rows[r][col] ?? "").trim();
    const lines = v.split(/\r?\n/);
    for (const ln of lines) {
      max = Math.max(max, ln.length);
    }
  }
  return max;
}

function detectMoneyColumns(rows, colCount) {
  const moneyCols = new Array(colCount).fill(true);
  for (let c = 0; c < colCount; c++) {
    for (let r = 1; r < rows.length; r++) {
      const val = String(rows[r][c] ?? "").trim();
      if (val === "") continue;
      if (!isMoney(val)) {
        moneyCols[c] = false;
        break;
      }
    }
  }
  return moneyCols;
}

function insertHeaderSeparator(rows, colCount, colWidths, gap) {
  if (rows.length === 0) return [];

  const headerWrapped = wrapRowsNoRepeat([rows[0]], colCount, colWidths);
  const bodyWrapped = wrapRowsNoRepeat(rows.slice(1), colCount, colWidths);
  const dashRow = colWidths.map(w => "-".repeat(Math.max(1, w)));

  return [...headerWrapped, dashRow, ...bodyWrapped];
}

const characters = {
  '€': 'EUR',
  '—': '-',
  '…': '...',
  '•': '-',
  '™': '(TM)',
};

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
  return String(str)
    .replace(/\u00A0/g, " ")
    .replace(/\$\s*([0-9][0-9.,]*)/g, "$ $1");
}

function parseTsv(text) {
  for (const [key, value] of Object.entries(characters)) {
    text = text.split(key).join(value);
  }
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  let cellStart = true;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"' && cellStart) {
      inQuotes = true;
      cellStart = false;
      continue;
    }

    if (inQuotes && ch === '"') {
      const next = text[i + 1];
      if (next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = false;
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
  const moneyCols = detectMoneyColumns(rows, colCount);
  const useHeaderLogic = headerSepCheckbox?.checked;

  // --- Money column reserved widths ---
  const reservedWidths = new Array(colCount).fill(0);
  let reservedTotal = 0;

  for (let c = 0; c < colCount; c++) {
    if (moneyCols[c]) {
      reservedWidths[c] = useHeaderLogic
        ? longestBodyValue(rows, c)
        : longestLens[c];
      reservedTotal += reservedWidths[c];
    }
  }

  const budget = totalWidth - MIN_GAP * (colCount - 1);

  // Extreme squish fallback (impossible to fit)
  if (budget <= colCount) {
    const fallbackWidths = new Array(colCount).fill(1);
    for (let c = 0; c < colCount; c++) {
      if (moneyCols[c]) fallbackWidths[c] = reservedWidths[c];
    }
    const wrapped = wrapRowsNoRepeat(rows, colCount, fallbackWidths);
    return { wrapped, colWidths: fallbackWidths, gap: MIN_GAP };
  }

  // --- 1. Binary search for the best safe base limit ---
  // We test the ACTUAL rendered width to avoid word-wrap math errors
  let low = 1;
  let high = Math.max(...longestLens, 1);
  let bestLimit = 1;
  
  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    let testWidths = longestLens.map((w, c) => 
      moneyCols[c] ? reservedWidths[c] : Math.min(w, mid)
    );
    
    let testWrapped = wrapRowsNoRepeat(rows, colCount, testWidths);
    let testUsed = usedWidthsFromWrapped(testWrapped, colCount);
    let testTotal = testUsed.reduce((a, b) => a + b, 0) + MIN_GAP * (colCount - 1);
    
    if (testTotal <= totalWidth) {
      bestLimit = mid;
      low = mid + 1; // Safe! Try to give it more space
    } else {
      high = mid - 1; // Overshot the totalWidth, back down
    }
  }

  // Set initial widths from the binary search
  let colWidths = longestLens.map((w, c) => {
    if (moneyCols[c]) return reservedWidths[c];
    return Math.min(w, bestLimit);
  });

  let wrapped = wrapRowsNoRepeat(rows, colCount, colWidths);
  let used = usedWidthsFromWrapped(wrapped, colCount);

  // --- 2. Strict Slack Distribution ---
  // Grow columns one by one, strictly verifying they don't cause a word-wrap jump 
  // that overshoots the total user limit.
  let canGrow = new Array(colCount).fill(true);
  let guard = 0;
  
  while (guard < totalWidth) {
    guard++;
    let grewAtLeastOne = false;
    
    for (let c = 0; c < colCount; c++) {
      if (moneyCols[c] || !canGrow[c] || colWidths[c] >= longestLens[c]) {
        continue;
      }
      
      // Tentatively add 1 character of space
      colWidths[c]++;
      let testWrapped = wrapRowsNoRepeat(rows, colCount, colWidths);
      let testUsed = usedWidthsFromWrapped(testWrapped, colCount);
      let testTotal = testUsed.reduce((a, b) => a + b, 0) + MIN_GAP * (colCount - 1);
      
      if (testTotal > totalWidth) {
        // Revert! A word just jumped up and broke the budget
        colWidths[c]--;
        canGrow[c] = false;
      } else {
        // Success, keep the new width
        wrapped = testWrapped;
        used = testUsed;
        grewAtLeastOne = true;
      }
    }
    if (!grewAtLeastOne) break;
  }

  // --- 3. Gap calculation ---
  const usedTotal = used.reduce((a, b) => a + b, 0);
  const remaining = totalWidth - usedTotal - MIN_GAP * (colCount - 1);
  const extraPerGap = colCount > 1 ? Math.floor(Math.max(0, remaining) / (colCount - 1)) : 0;
  const gap = MIN_GAP + extraPerGap;

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

  let { wrapped, colWidths, gap } = layoutMaxSpace(rows, colCount, totalWidth);

  if (headerSepCheckbox?.checked) {
    wrapped = insertHeaderSeparator(rows, colCount, colWidths, gap);
  }

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