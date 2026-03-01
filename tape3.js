import * as fox from 'fetchfox-sdk';

const api_key = process.env.FETCHFOX_API_KEY;
fox.configure({
  apiKey: api_key,
  host: 'https://staging.api.fetchfox.ai',
  // host: 'https://api.fetchfox.ai',
});

const run = async () => {
  const top = 'https://shop.eriks.nl/en/maintenance-products/maintenance-products-tapes-and-accessories/maintenance-products-tapes-and-accessories-tapes/';

  const out1 = await fox.agent({
    prompt: 'Crawl: Find the dozen or so tape category URLs on this page maxVisits=1 ' + top,
  });
  const categories = out1.results.hits;
  console.log('categories:', categories);

  const out2 = await fox.agent({
    prompt: 'Find all product detail URLs linked from these categories  maxVisits=10 ' + categories.join(' '),
  });
  const products = out2.results.hits;
  console.log('products:', products);

  const out3 = await fox.agent({
    prompt: 'Check each of these pages for links to additional product detail URLs maxVisits=10 ' + products.join(' '),
  });
  const products2 = out3.results.hits;
  console.log('products2:', products2);

  const allProducts = [
    ...products,
    ...products2,
  ];

  const out4 = await fox.agent({
    prompt: 'Extract product name, price in EUR, and dimensions as length in meters and width in mm maxExtracts=10 ' + allProducts.join(' '),
  });
  console.log('items:', out4.results.items);
}

run();

