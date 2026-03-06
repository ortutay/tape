import * as fox from 'fetchfox-sdk';
import { writeFile } from 'fs/promises';


const api_key = process.env.FETCHFOX_API_KEY;
fox.configure({
  apiKey: api_key,
  host: 'https://api.fetchfox.ai',
});

const scrapeRsOnline = async (top, template, maxVisits, maxExtracts) => {
  const steps = [
    'Find the tape category URLs',
    'Find product detail URLs',
  ];

  let urls = [top];
  const hits = [];
  const batchSize = 20;
  for (const step of steps) {
    const stepHits = [];
    for (let i = 0; i < urls.length && i < maxVisits; i += batchSize) {
      console.log('Running', i, step);
      const startUrls = urls.slice(i, i + batchSize);
      const out = await fox.crawl({
        query: step,
        startUrls,
        maxVisits,
        maxDepth: 0,
      });
      console.log('Batch results:', {
        startUrls,
        hits: out.results.hits,
        len: out.results.hits.length,
      });
      stepHits.push(...out.results.hits);
    }
    console.log('Hits:', stepHits);
    console.log('Hits length:', stepHits.length);
    hits.push(stepHits);
    urls = stepHits.slice(0, maxVisits);
  }

  const productUrls = hits[1];
  const allProductUrls = [...(new Set(productUrls))].sort();
  console.log('All product URLs:', allProductUrls);
  console.log('Final number of product urls found:', allProductUrls.length);

  const items = [];
  for (let i = 0; i < allProductUrls.length && i < maxExtracts; i += batchSize) {
    console.log('Run extract', i);
    const out = await fox.extract({
      urls: allProductUrls.slice(i, i + batchSize),
      template
    });
    console.log('Batch items:', out.results.items);
    console.log('Batch items length:', out.results.items.length);
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

  console.log('Final result:', items);
  console.log('Final result count:', items.length);

  const filename = 'out_rsonline.jsonl'

  const jsonl = items.map(it => JSON.stringify(it)).join('\n') + '\n';
  await writeFile(filename, jsonl, 'utf8');
  console.log(`Wrote ${filename}`);
}

run();
