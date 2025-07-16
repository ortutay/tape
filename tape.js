import { configure, crawl, extract } from 'fetchfox-sdk';

const shared = {
  proxy: 'auto',
  maxDepth: 0,
  maxVisits: 200,
  contentTransform: ['reduce', 'text_only'],
};
const shops = {
  shop_sks: {
    pattern: 'https://www.shop-sks.com/3M:*',
    startUrls: [
      'https://www.shop-sks.com/3M/Kleben-und-Verbinden/Einseitige-Klebebaender/?p={{0..100}}',
	    'https://www.shop-sks.com/3M/Kleben-und-Verbinden/Doppelseitige-Klebebaender/?p={{0..100}}',
    ],
    ...shared,
  },

  adecteshop_cz: {
    pattern: 'https://www.adecteshop.cz/:*/',
    startUrls: [
      'https://www.adecteshop.cz/maskovaci-pasky/strana-{{1..20}}/',
      'https://www.adecteshop.cz/oznacovaci-barevne-pasky/strana-{{1..20}}/',
    ],
    ...shared,
  },

  seyffer_shop: {
    pattern: 'https://seyffer.shop/de/:*.html',
    startUrls: [
      'https://seyffer.shop/de/kleben/einseitige-klebebaender/?view_mode=tiled&listing_sort=&listing_count=72&page={{0..50}}',
      'https://seyffer.shop/de/kleben/doppelseitige-klebebaender/?view_mode=tiled&listing_sort=&listing_count=72&page={{0..50}}',
    ],
    ...shared,
  },

  gd_industrie: {
    pattern: 'https://www.gd-industrie.com/fr/:*/:*/',
    startUrls: [
      'https://www.gd-industrie.com/fr/masquage-1',
    ],
    ...shared,
  },
};

const run = async (name) => {
  console.log('Running:', name);
  const shop = shops[name];

  const out = await crawl(shop);

  console.log('== crawl ==');
  console.log(out.results.hits.slice(0, 10));
  console.log(out.results.hits.length);
  console.log(JSON.stringify(out.metrics, null, 2));

  const urls = out.results.hits;

  const template = `Extract name, price, categories, and all technical details for the products. price should be a dictionary of amount and currency, amount is a decimal field with two decimals. Include fields for dimensions if available. Include a place for general techincal details in case different products have more or fewer technical details. If there are variants on any aspect, for example variants in color, dimensions, or other attributes, include those in an array and specify what is varying..`;

  console.log('urls', urls.length, urls.slice(0, 10));
  const out2 = await extract({ urls: urls.slice(0, 100), template, ...shop });

  return {
    count: urls.length,
    items: out2.results.items,
    cost: out.metrics.cost.total + out2.metrics.cost.total,
  };
}

const main = async () => {
  configure({ apiKey: process.env.FETCHFOX_API_KEY });

  const results = {};
  const names = Object.keys(shops);
  for (const name of names) {
    results[name] = await run(name);
  }

  console.log('== sample data ==');
  for (const name of Object.keys(results)) {
    const { items, cost } = results[name];
    console.log(`${name}\t${items.length}\t${JSON.stringify(items.slice(0, 3), null, 2)}`);
  }

  console.log('== cost ==');
  for (const name of Object.keys(results)) {
    const { items, cost } = results[name];
    console.log(`${name}\t${items.length}\t${((cost / items.length) * 1000).toFixed(2)} USD per 1k`);
  }
}

main();
