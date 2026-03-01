import * as fox from 'fetchfox-sdk';

const api_key = process.env.FETCHFOX_API_KEY;
fox.configure({
  apiKey: api_key,
  host: 'https://staging.api.fetchfox.ai',
  // host: 'http://localhost:3030',
});

const run = async () => {
  const maxVisits = 10;
  const top = 'https://shop.eriks.nl/en/maintenance-products/maintenance-products-tapes-and-accessories/maintenance-products-tapes-and-accessories-tapes/';

  const steps = [
    'Find the tape category URLs',
    'Find product detail URLs',
    'Find URLs of product variants. Return empty results if no product variants found on this page.',
  ];

  let urls = [top];
  const hits = [];
  for (const step of steps) {
    const out = await fox.crawl({
      query: step,
      startUrls: urls,
      maxVisits,
      maxDepth: 0,
    });
    urls = out.results.hits;
    console.log('Step:', step);
    console.log('Hits:', urls);
    hits.push(urls);
  }

  const productUrls = hits[1];
  const variantUrls = hits[2];
  const delta = new Set(variantUrls)
    .difference(new Set(productUrls))
    .size;
  console.log('New URLs from variants:', delta);

  const allProductUrls = [...(new Set([...productUrls, ...variantUrls]))].sort();

  console.log('All product URLs:', allProductUrls);
  console.log(allProductUrls.length);
}

run();

