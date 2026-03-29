import * as fox from 'fetchfox-sdk';
import { writeFile } from 'fs/promises';


const api_key = process.env.FETCHFOX_API_KEY;
fox.configure({
  apiKey: api_key,
  host: 'https://staging.api.fetchfox.ai',
});

const scrapeRsOnline = async (top, template, maxVisits, maxExtracts) => {
  const out = await fox.crawl({
    steps: [
      'Find the tape category URLs',
      'Find product detail URLs',
    ],
    startUrls: [top],
    maxVisits: 500,
  });

  const hits = out.results.hits;
  console.log('Hits:', hits);
  console.log('Final number of product urls found:', hits.length);

  const items = [];
  for (let i = 0; i < hits.length && i < maxExtracts; i += batchSize) {
    console.log('Run extract', i);
    const out = await fox.extract({
      urls: hits.slice(i, i + batchSize),
      template,
      nonce: 1
    });
    console.log('Batch items:', out.results.items);
    const len = out.results.items.length
    const boostedLen = out.results.items.filter(it => it._boosted).length
    console.log(`Batch items length is ${len}, with ${boostedLen} boosted`);
    console.log(`Total cost was ${out.metrics.cost.total}, and AI cost was ${out.metrics.cost.ai}`);
    items.push(...out.results.items);
  }

  return items;
}

const run = async () => {
  const maxVisits = 30;
  const maxExtracts = 100;
  const startingUrl = 'https://de.rs-online.com/web/c/klebstoffe-dichtmittel-klebebander/klebebander/';
  const template = {
    name: 'product name',
    price: 'product price in EUR',
    dimensions: '{ width: width in mm, length: length in m }, numbers only'
  };

  const items = await scrapeRsOnline(
    startingUrl,
    template,
    maxVisits,
    maxExtracts);

  return;

  console.log('Final result:', items);
  console.log('Final result count:', items.length);

  const filename = 'out_rsonline.jsonl'

  const jsonl = items.map(it => JSON.stringify(it)).join('\n') + '\n';
  await writeFile(filename, jsonl, 'utf8');
  console.log(`Wrote ${filename}`);
}

run();
