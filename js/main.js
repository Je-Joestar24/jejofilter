
// Enhanced loading and success animations
function setLoadingState(isLoading) {
    const btn = document.getElementById('filterBtn');
    const btnText = document.getElementById('btnText');

    if (isLoading) {
        btn.classList.add('loading', 'active');
        btn.disabled = true;
        btnText.textContent = 'Processing...';
        btn.style.cursor = 'not-allowed';
    } else {
        btn.classList.remove('loading', 'active');
        btn.disabled = false;
        btnText.textContent = 'Filter & Download';
        btn.style.cursor = 'pointer';
    }
}

function showSuccessAnimation() {
    const btn = document.getElementById('filterBtn');
    btn.classList.add('success-animation');
    setTimeout(() => {
        btn.classList.remove('success-animation');
    }, 600);
}

async function filterCSV() {
    let url = document.getElementById("sheetUrl").value.trim();
    const colIndex = parseInt(document.getElementById("colIndex").value);
    const term = document
        .getElementById("searchTerm")
        .value.toLowerCase()
        .trim();

    if (!url || !term) {
        // Enhanced error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse';
        notification.textContent = 'Please enter both URL and search term!';
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
        return;
    }

    setLoadingState(true);

    try {
        // 🔄 Convert any sheet link to export CSV
        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            throw new Error("Invalid Google Sheet link!");
        }

        const sheetId = match[1];
        const gidMatch = url.match(/gid=(\d+)/);
        const gid = gidMatch ? gidMatch[1] : "0";

        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
        console.log("✅ Fetching CSV from:", csvUrl);

        const response = await fetch(csvUrl);
        const csvText = await response.text();

        if (csvText.startsWith("<!DOCTYPE html>")) {
            throw new Error("⚠️ The sheet is not publicly accessible. Make sure it's shared with 'Anyone with the link → Viewer'.");
        }

        // ✅ Trim extra whitespace, skip empty rows
        const parsed = Papa.parse(csvText.trim(), {
            header: false,
            skipEmptyLines: true,
        });
        const rows = parsed.data.filter(
            (r) => r.length > 0 && r.some((c) => c !== "")
        );
        console.log("Parsed rows:", rows);

        const headers = rows[0];
        const termLower = term.toLowerCase();

        // ✅ Adjust column index for human input (1-based → 0-based)
        const actualColIndex = colIndex - 1;

        // ✅ Filter rows (keep header + case-insensitive match)
        const filteredRows = rows.filter((row, i) => {
            if (i === 0) return true; // keep header
            const cell = row[actualColIndex];
            if (!cell) return false;
            return cell.toString().toLowerCase().includes(termLower);
        });

        console.log("Filtered rows:", filteredRows, termLower);

        if (filteredRows.length <= 1) {
            alert("No matching results found.");
            return;
        }

        // ✅ Convert to CSV and trigger download
        const filteredCSV = Papa.unparse(filteredRows);
        const blob = new Blob([filteredCSV], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "filtered_data.csv";
        link.click();
    } finally {
        setLoadingState(false);
    }
}