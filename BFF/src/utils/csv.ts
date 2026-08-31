export function jsonToCsv(items: any[]): string {
  if (!items || !items.length) {
    return "";
  }

  // Define headers from first object
  const headerKeys = Object.keys(items[0]);
  
  // Format headers: e.g. "activeRequirements" -> "Active Requirements"
  const headerRow = headerKeys.map((key) => {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  });

  const csvRows = [];
  csvRows.push(headerRow.join(","));

  for (const item of items) {
    const row = headerKeys.map((key) => {
      let val = item[key];
      if (val === null || val === undefined) {
        val = "";
      } else if (typeof val === "string") {
        // Escape quotes and wrap in quotes if there's a comma or quote
        val = val.replace(/"/g, '""');
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          val = `"${val}"`;
        }
      }
      return val;
    });
    csvRows.push(row.join(","));
  }

  return csvRows.join("\n");
}
