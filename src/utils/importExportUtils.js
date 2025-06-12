// src/utils/importExportUtils.js

/**
 * Triggers a browser download for the given data.
 * @param {string} filename The name of the file to download.
 * @param {string} data The file content.
 * @param {string} type The MIME type of the file.
 */
export function downloadFile(filename, data, type = "text/csv;charset=utf-8;") {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * A simple CSV parser for brand and category data.
 * @param {string} text The CSV content.
 * @returns {Array<Object>} An array of parsed item objects.
 */
export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const [header, ...rows] = lines;
  
  if (!header) return [];

  const [type] = header.split(",");
  return rows.map((row) => {
    const parts = row.split(",");
    if (type === "brand") return { name: parts[1] || "" };
    if (type === "category") {
      return {
        name: parts[1] || "",
        subcategories: parts[2] ? parts[2].split("|") : [],
      };
    }
    return null;
  }).filter(Boolean); // Filter out any null entries
}