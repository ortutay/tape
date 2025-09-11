import fs from 'fs';
import { crush } from 'radash'

function rowsToCSV(rows) {
  const d = {};
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      d[k] = true;
    }
  }
  const headers = Object.keys(d).sort();
  console.log(headers);

  const csvRows = [
    headers.join(','),
    ...rows.slice(1).map(row =>
      headers.map(field => {
        let val = row[field] ?? '';
        val = String(val).replace(/"/g, '""');
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

  const serialized = rowsToCSV(rows);
  console.log(serialized);

  fs.writeFileSync('results/combined.csv', serialized, 'utf8');
}

main().then(() => process.exit(0));
