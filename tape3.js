import * as fox from 'fetchfox-sdk';

const api_key = process.env.FETCHFOX_API_KEY;
fox.configure({
  apiKey: api_key,
  host: 'https://staging.api.fetchfox.ai',
});

const run = async () => {
  const maxVisits = 300;
  const maxExtracts = 50;

  const top = 'https://shop.eriks.nl/en/maintenance-products/maintenance-products-tapes-and-accessories/maintenance-products-tapes-and-accessories-tapes/';

  const steps = [
    'Find the tape category URLs',
    'Find product detail URLs',
    'Find URLs of product variants. Return empty results if no product variants found on this page.',
  ];

  let urls = [top];
  const hits = [];
  const batchSize = 20;
  for (const step of steps) {
    const stepHits = [];
    for (let i = 0; i < urls.length; i += batchSize) {
      console.log('Running', i, step);
      const out = await fox.crawl({
        query: step,
        startUrls: urls.slice(i, i + batchSize),
        maxVisits,
        maxDepth: 0,
      });
      stepHits.push(...out.results.hits);
      console.log('Batch got:', out.results.hits.length, 'now at', stepHits.length);
    }
    console.log('Hits:', stepHits);
    console.log('Hits length:', stepHits.length);
    hits.push(stepHits);
    urls = stepHits;
  }

  const productUrls = hits[1];
  const variantUrls = hits[2];
  const delta = new Set(variantUrls)
    .difference(new Set(productUrls))
    .size;
  console.log('New URLs from variants:', delta);

  const allProductUrls = [...(new Set([...productUrls, ...variantUrls]))].sort();

  console.log('All product URLs:', allProductUrls);
  console.log('Number of product urls found:', allProductUrls.length);

  const out = await fox.extract({
    urls: allProductUrls.slice(0, maxExtracts),
    template: {
      name: 'product name',
      price: 'product price in EUR',
      dimensions: '{ width: width in mm, length: length in m }, numbers only'
    }
  });
  console.log('Items:', out.results.items);
  console.log('Items length:', out.results.items.length);
}

run();

