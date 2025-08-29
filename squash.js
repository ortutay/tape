import fs from 'fs';
import path from 'path';
import readline from 'readline';
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
  const [,, nArg, dirArg] = process.argv;

  if (!nArg || !dirArg) {
    console.error('Usage: node script.js <N> <directory>');
    process.exit(1);
  }

  const N = parseInt(nArg, 10);
  const dir = dirArg;

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.jsonl'));

  const outStream = fs.createWriteStream('out.csv');

  const rows = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });

    let count = 0;
    for await (const line of rl) {
      if (count >= N) break;
      rows.push(crush(JSON.parse(line)));
      // outStream.write(JSON.stringify(, null, 2) + '\n');
      count++;
    }
  }

  // const headers = {};
  // for (const row of rows) {
  //   console.log(row);
  //   for (const key of Object.keys(row)) {
  //     headers[key] = true;
  //   }
  // }

  const headers = {
    '_url': true,
    '_htmlUrl': true,
    'isTape': true,
    'brand': true,
    'name': true,
    'shopName': true,
    'country': true,
    'domain': true,
    'eurPerSqm': true,
    'sku': true,
    'ean': true,
    'categoryUrl': true,
    'categoryEnglishName': true,
    'description': true,
    'color': true,
    'material': true,
    'type': true,
    'backing': true,
    'temperature.0.value': true,
    'temperature.0.unit': true,
    'widthOriginal.value': true,
    'widthOriginal.unit': true,
    'widthConverted.value': true,
    'widthConverted.unit': true,
    'lengthOriginal.value': true,
    'lengthOriginal.unit': true,
    'lengthConverted.value': true,
    'lengthConverted.unit': true,
    'weightOriginal': true,
    'weightConverted': true,
    'thicknessOriginal.value': true,
    'thicknessOriginal.unit': true,
    'thicknessConverted.value': true,
    'thicknessConverted.unit': true,
    'rawWithVatProductPrice.value': true,
    'rawWithVatProductPrice.currency': true,
    'rawWithVatProductPrice.unit': true,
    'rawWithVatProductPrice.amount': true,
    'euroProductPrice.value': true,
    'euroProductPrice.currency': true,
    'euroProductPrice.unit': true,
    '_confidence': true,
  }

  rows.unshift(headers);

  // const csvRows = [headers];
  // for (const row of rows) {
  //   const csvRow = [];
  //   for (const key of Object.keys(headers)) {
  //     csvRow.push(row[key] || '');
  //   }
  //   csvRows.push(csvRow);
  // }

  const serialized = rowsToCSV(rows);
  console.log('serialized', serialized);
  outStream.write(serialized);

  outStream.end();
  console.log(`Wrote out.jsonl with first ${N} lines from each file.`);
};

main();
