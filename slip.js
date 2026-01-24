const formatBtn = document.getElementById("submit");
const resultDiv = document.getElementById("resultado");
const textArea = document.getElementById("texto");
const clearBtn = document.getElementById("clear-button");


const characters={
    '€':'EUR',
    '—':'-',
    '…':'...',
    '•':'-',
    '™':'(TM)',
    '?':' '
}

formatBtn.addEventListener("click", () => {
    let outputText = textArea.value;

    // replace tabs with a single space
    outputText = outputText.replace(/\t/g, ' ');

    // replace special characters
    for (const [key, value] of Object.entries(characters)) {
        outputText = outputText.split(key).join(value);
    }

  resultDiv.innerHTML = `
    <div>
      <button class="grey-but" style="width:10%" onclick="Copy('copyable')">Copiar</button>
    </div>
    <pre id="copyable" class="sise_font border border-dark" style="white-space: pre-wrap; max-width: 97ch!important; ">${outputText}</pre>
  `;
});

clearBtn.addEventListener("click", () => {
  textArea.value = "";
  resultDiv.textContent = "";
});
