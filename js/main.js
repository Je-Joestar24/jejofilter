
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

function setDisplayLoadingState(isLoading) {
    const btn = document.getElementById('displayBtn');
    const btnText = document.getElementById('displayBtnText');

    if (isLoading) {
        btn.classList.add('display-loading', 'active');
        btn.disabled = true;
        btnText.textContent = 'Loading...';
        btn.style.cursor = 'not-allowed';
    } else {
        btn.classList.remove('display-loading', 'active');
        btn.disabled = false;
        btnText.textContent = 'Filter & Display';
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

function showNotification(message, type = 'error') {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-green-500';
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Modal functions
function openModal() {
    const modal = document.getElementById('dataModal');
    modal.classList.remove('hidden');
    modal.classList.add('modal-enter');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('dataModal');
    modal.classList.add('modal-exit');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('modal-enter', 'modal-exit');
        document.body.style.overflow = 'auto';
    }, 200);
}

// Add keyboard support for modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('dataModal');
        if (!modal.classList.contains('hidden')) {
            closeModal();
        }
    }
});

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('dataModal');
    if (event.target === modal) {
        closeModal();
    }
});

// Global variable to store filtered data
let currentFilteredData = null;

function createDataTable(data) {
    if (!data || data.length === 0) {
        return '<p class="text-gray-500 text-center py-8">No data to display</p>';
    }

    const headers = data[0];
    const rows = data.slice(1);

    let tableHTML = '<table class="data-table">';
    
    // Create header row
    tableHTML += '<thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${header || 'Unknown'}</th>`;
    });
    tableHTML += '</tr></thead>';
    
    // Create data rows
    tableHTML += '<tbody>';
    rows.forEach(row => {
        tableHTML += '<tr>';
        headers.forEach((header, index) => {
            const cellValue = row[index] || '';
            const processedCell = processCellContent(cellValue, header, headers, row);
            tableHTML += `<td title="${cellValue}">${processedCell}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    
    return tableHTML;
}

function processCellContent(cellValue, columnHeader = '', headers = [], row = []) {
    if (!cellValue || typeof cellValue !== 'string') {
        return cellValue || '';
    }

    // Check if this is a 3P Seller column
    const isSellerColumn = columnHeader.toLowerCase().includes('3p seller') || 
                          columnHeader.toLowerCase().includes('seller');

    // Find ASIN column index
    const asinColumnIndex = headers.findIndex(header => 
        header && header.toLowerCase().includes('asin')
    );

    // URL patterns to detect
    const urlPatterns = [
        // Google Sheets links
        /https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/g,
        // Amazon ASIN links
        /https:\/\/www\.amazon\.com\/[^\s]+/g,
        // General HTTP/HTTPS URLs
        /https?:\/\/[^\s]+/g,
        // Email addresses
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    ];

    let processedValue = cellValue;

    // Check each URL pattern
    urlPatterns.forEach(pattern => {
        processedValue = processedValue.replace(pattern, (match) => {
            // Determine if it's an email or URL
            const isEmail = match.includes('@');
            const linkText = isEmail ? match : (match.length > 50 ? match.substring(0, 47) + '...' : match);
            const target = isEmail ? '' : ' target="_blank" rel="noopener noreferrer"';
            
            return `<a href="${isEmail ? 'mailto:' + match : match}"${target} class="text-blue-600 hover:text-blue-800 underline transition-colors duration-200">${linkText}</a>`;
        });
    });

    // For 3P Seller columns, convert seller names to Amazon seller links with specific ASIN
    if (isSellerColumn && processedValue && processedValue.trim() !== '' && processedValue.toLowerCase() !== 'n/a') {
        // Skip if it's already a URL or email
        if (!processedValue.includes('http') && !processedValue.includes('@')) {
            const sellerName = processedValue.trim();
            
            // Get ASIN from the same row
            const asin = asinColumnIndex !== -1 ? row[asinColumnIndex] : null;
            
            if (asin && asin.trim() !== '') {
                // Create Amazon seller page URL with specific ASIN
                const sellerUrl = `https://www.amazon.com/sp?ie=UTF8&seller=${encodeURIComponent(sellerName)}&asin=${asin}`;
                return `<a href="${sellerUrl}" target="_blank" rel="noopener noreferrer" class="text-purple-600 hover:text-purple-800 underline transition-colors duration-200">${sellerName}</a>`;
            } else {
                // Fallback to general seller search if no ASIN
                const sellerUrl = `https://www.amazon.com/s?me=${encodeURIComponent(sellerName)}`;
                return `<a href="${sellerUrl}" target="_blank" rel="noopener noreferrer" class="text-purple-600 hover:text-purple-800 underline transition-colors duration-200">${sellerName}</a>`;
            }
        }
    }

    // Check for ASIN patterns (Amazon product IDs) - only for non-seller columns
    if (!isSellerColumn) {
        const asinPattern = /\b(B[A-Z0-9]{9})\b/g;
        processedValue = processedValue.replace(asinPattern, (asin) => {
            const amazonUrl = `https://www.amazon.com/dp/${asin}`;
            return `<a href="${amazonUrl}" target="_blank" rel="noopener noreferrer" class="text-orange-600 hover:text-orange-800 underline transition-colors duration-200">${asin}</a>`;
        });
    }

    // Check for Google Sheets ID patterns
    const sheetIdPattern = /\b([a-zA-Z0-9-_]{44})\b/g;
    processedValue = processedValue.replace(sheetIdPattern, (sheetId) => {
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
        return `<a href="${sheetUrl}" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:text-green-800 underline transition-colors duration-200">${sheetId}</a>`;
    });

    return processedValue;
}

function downloadFromModal() {
    if (!currentFilteredData) {
        showNotification('No data available to download', 'error');
        return;
    }
    
    const filteredCSV = Papa.unparse(currentFilteredData);
    const blob = new Blob([filteredCSV], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "filtered_data.csv";
    link.click();
    
    showNotification(`Downloaded ${currentFilteredData.length - 1} rows successfully!`, 'success');
}

async function filterAndDisplay() {
    let url = document.getElementById("sheetUrl").value.trim();
    const colIndex = parseInt(document.getElementById("colIndex").value);
    const term = document
        .getElementById("searchTerm")
        .value.toLowerCase()
        .trim();

    if (!url || !term) {
        showNotification('Please enter both URL and search term!', 'error');
        return;
    }

    setDisplayLoadingState(true);

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
        
        // Filter out completely empty rows
        const rows = parsed.data.filter(
            (r) => r.length > 0 && r.some((c) => c !== "" && c !== null && c !== undefined)
        );
        console.log("Parsed rows:", rows);

        const headers = rows[0];
        const termLower = term.toLowerCase();

        // ✅ Adjust column index for human input (1-based → 0-based)
        const actualColIndex = colIndex - 1;

        // ✅ Check if the target column exists and has data
        if (actualColIndex >= headers.length) {
            throw new Error(`Column index ${colIndex} is out of range. This sheet only has ${headers.length} columns.`);
        }

        // ✅ Check if the target column is empty (all cells are empty, null, undefined, or just whitespace)
        const columnData = rows.slice(1).map(row => row[actualColIndex]);
        const hasDataInColumn = columnData.some(cell => 
            cell && 
            cell.toString().trim() !== "" && 
            cell.toString().trim().toLowerCase() !== "n/a"
        );

        if (!hasDataInColumn) {
            throw new Error(`Column ${colIndex} (${headers[actualColIndex] || 'Unknown'}) appears to be empty or contains only "N/A" values.`);
        }

        // ✅ Filter rows (keep header + case-insensitive match)
        const filteredRows = rows.filter((row, i) => {
            if (i === 0) return true; // keep header
            const cell = row[actualColIndex];
            
            // Skip empty cells, null, undefined, or whitespace-only cells
            if (!cell || cell.toString().trim() === "" || cell.toString().trim().toLowerCase() === "n/a") {
                return false;
            }
            
            return cell.toString().toLowerCase().includes(termLower);
        });

        console.log("Filtered rows:", filteredRows, termLower);

        if (filteredRows.length <= 1) {
            showNotification("No matching results found.", "warning");
            return;
        }

        // Store filtered data globally
        currentFilteredData = filteredRows;

        // Update modal content
        const tableContainer = document.getElementById('dataTableContainer');
        tableContainer.innerHTML = createDataTable(filteredRows);

        // Update modal info
        document.getElementById('rowCount').textContent = filteredRows.length - 1;
        document.getElementById('modalSubtitle').textContent = 
            `Showing results for "${term}" in column ${colIndex} (${headers[actualColIndex] || 'Unknown'})`;

        // Open modal
        openModal();

    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    } finally {
        setDisplayLoadingState(false);
    }
}

async function filterCSV() {
    let url = document.getElementById("sheetUrl").value.trim();
    const colIndex = parseInt(document.getElementById("colIndex").value);
    const term = document
        .getElementById("searchTerm")
        .value.toLowerCase()
        .trim();

    if (!url || !term) {
        showNotification('Please enter both URL and search term!', 'error');
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
        
        // Filter out completely empty rows
        const rows = parsed.data.filter(
            (r) => r.length > 0 && r.some((c) => c !== "" && c !== null && c !== undefined)
        );
        console.log("Parsed rows:", rows);

        const headers = rows[0];
        const termLower = term.toLowerCase();

        // ✅ Adjust column index for human input (1-based → 0-based)
        const actualColIndex = colIndex - 1;

        // ✅ Check if the target column exists and has data
        if (actualColIndex >= headers.length) {
            throw new Error(`Column index ${colIndex} is out of range. This sheet only has ${headers.length} columns.`);
        }

        // ✅ Check if the target column is empty (all cells are empty, null, undefined, or just whitespace)
        const columnData = rows.slice(1).map(row => row[actualColIndex]);
        const hasDataInColumn = columnData.some(cell => 
            cell && 
            cell.toString().trim() !== "" && 
            cell.toString().trim().toLowerCase() !== "n/a"
        );

        if (!hasDataInColumn) {
            throw new Error(`Column ${colIndex} (${headers[actualColIndex] || 'Unknown'}) appears to be empty or contains only "N/A" values.`);
        }

        // ✅ Filter rows (keep header + case-insensitive match)
        const filteredRows = rows.filter((row, i) => {
            if (i === 0) return true; // keep header
            const cell = row[actualColIndex];
            
            // Skip empty cells, null, undefined, or whitespace-only cells
            if (!cell || cell.toString().trim() === "" || cell.toString().trim().toLowerCase() === "n/a") {
                return false;
            }
            
            return cell.toString().toLowerCase().includes(termLower);
        });

        console.log("Filtered rows:", filteredRows, termLower);

        if (filteredRows.length <= 1) {
            showNotification("No matching results found.", "warning");
            return;
        }

        // ✅ Convert to CSV and trigger download
        const filteredCSV = Papa.unparse(filteredRows);
        const blob = new Blob([filteredCSV], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "filtered_data.csv";
        link.click();
        
        showSuccessAnimation();
        showNotification(`Successfully filtered and downloaded ${filteredRows.length - 1} rows!`, 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    } finally {
        setLoadingState(false);
    }
}