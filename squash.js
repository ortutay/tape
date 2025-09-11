import fs from 'fs';
import { crush } from 'radash'

function rowsToCSV(rows) {
  if (!rows || rows.length === 0) return '';

  // Get all headers (keys from first row)
  const headers = Object.keys(rows[0]);

  // Convert each row to CSV
  const csvRows = [
    headers.join(','), // header row
    ...rows.slice(1).map(row =>
      headers.map(field => {
        let val = row[field] ?? '';
        // Escape double quotes by doubling them
        val = String(val).replace(/"/g, '""');
        // Wrap in quotes if contains comma, quote, or newline
        if (/[",\n]/.test(val)) {
          val = `"${val}"`;
        }
        return val;
      }).join(',')
    ),
  ];

  return csvRows.join('\n');
}

const main = async () => {
  const files = process.argv.slice(2);
  console.log(files);

  const rows = [];
  for (const file of files) {
    const r = fs.readFileSync(file, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(it => JSON.parse(it))
      .map(it => {
        const out = {};
        for (const k of Object.keys(it)) {
          if (k.startsWith('_')) {
            continue;
          }
          out[k] = it[k];
        }
        return out;
      })
      .map(crush)
    rows.push(...r);
  }

  console.log(rows);

  const headers = {};
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      headers[k] = true;
    }
  }

  console.log(headers);
  const serialized = rowsToCSV(rows);
  console.log(serialized);

  fs.writeFileSync('results/combined.csv', serialized, 'utf8');
}

main().then(() => process.exit(0));
