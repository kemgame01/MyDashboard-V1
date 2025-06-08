// export.js

/**
 * Export data as a CSV file, supporting:
 * - Array of arrays (e.g. [["a","b"], ["c","d"]])
 * - Array of objects (e.g. [{a:1, b:2}, {a:3, b:4}])
 * - Optionally with headers
 *
 * @param {string} filename - Name of the CSV file (e.g. "data.csv")
 * @param {Array} rows - Array of arrays or array of objects
 */
export function exportCSV(filename, rows) {
  // 1. Guard clause: must be a non-empty array
  if (!Array.isArray(rows) || rows.length === 0) {
    alert("No data to export!");
    return;
  }

  let csv = "";

  // 2. Detect array of objects (vs array of arrays)
  if (typeof rows[0] === "object" && !Array.isArray(rows[0])) {
    // Array of objects
    // Collect all unique keys as headers
    const headers = Array.from(
      rows.reduce((set, obj) => {
        Object.keys(obj).forEach(k => set.add(k));
        return set;
      }, new Set())
    );
    csv += headers.join(",") + "\n";
    csv += rows.map(row =>
      headers.map(h => escapeCSV(row[h])).join(",")
    ).join("\n");
  } else if (Array.isArray(rows[0])) {
    // Array of arrays (optional: add header support if passed as first row)
    csv = rows.map(row =>
      row.map(escapeCSV).join(",")
    ).join("\n");
  } else {
    alert("Invalid data format for export!");
    return;
  }

  // 3. Download the file in a cross-browser way
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename || "export.csv";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

// Helper to escape CSV values (commas, quotes, line breaks)
function escapeCSV(value) {
  if (value == null) return ""; // null/undefined
  let str = String(value);
  if (/["\n,]/.test(str)) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
