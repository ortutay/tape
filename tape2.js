import * as fox from 'fetchfox-sdk';

const api_key = process.env.FETCHFOX_API_KEY;
fox.configure({
  apiKey: api_key,
  // host: 'https://staging.api.fetchfox.ai',
  host: 'https://api.fetchfox.ai',
});

const runAgent = async () => {
  const prompt = `https://www.hoffmann-group.com/DE/de/hom/Chemisch-technische-Produkte/Klebeb%C3%A4nder/Gewebeklebeb%C3%A4nder/c/06-07-01-00-00?page=1 find all the product detail pages, and extract product name, price in EUR, and product dimensions. for dimensions, give L x W x W as a dictionary, with both units and values. then give a second dimensions object, same format, but in millimeters. THIS IS A TEST RUN: extract at most 100 items, and visit at most 20 pages."`;

  const job = await fox.agent.detach({ prompt });
  console.log('Job ID:', job.id);
  console.log('Progress:', job.appUrl);
  const out = await job.finished();
  console.log(out.results?.items);
  console.log(out.results?.items?.length);
  console.log(out.metrics?.cost?.total);
}

const demonstrateBost = async () => {
  const nonce = Math.random();

  const template = `product name and price`;
  const first = [
    'https://www.hoffmann-group.com/DE/de/hom/p/083600-48X50',
    'https://www.hoffmann-group.com/DE/de/hom/p/083601-48X50',
    'https://www.hoffmann-group.com/DE/de/hom/p/083602-48X50',
    'https://www.hoffmann-group.com/DE/de/hom/p/083605-38X25',
    'https://www.hoffmann-group.com/DE/de/hom/p/083606-50X50',
  ];
  const rest = [
    'https://www.hoffmann-group.com/DE/de/hom/p/083616-50X25',
    'https://www.hoffmann-group.com/DE/de/hom/p/083617-50X25',
    'https://www.hoffmann-group.com/DE/de/hom/p/083618-48X20',
    'https://www.hoffmann-group.com/DE/de/hom/p/083621-50X50',
    'https://www.hoffmann-group.com/DE/de/hom/p/083622-50X50',
    'https://www.hoffmann-group.com/DE/de/hom/p/083623-50X50',
    'https://www.hoffmann-group.com/DE/de/hom/p/083624-50X50',
    'https://www.hoffmann-group.com/DE/de/hom/p/083645-19X50',
    'https://www.hoffmann-group.com/DE/de/hom/p/083648-19X50',
    'https://www.hoffmann-group.com/DE/de/hom/p/083765-48X50',
    'https://www.hoffmann-group.com/DE/de/hom/p/083766-48X50',
    'https://www.hoffmann-group.com/DE/de/hom/p/083767-38X25',
    'https://www.hoffmann-group.com/DE/de/hom/p/083769-18X50',
    'https://www.hoffmann-group.com/DE/de/hom/p/083772-18X50',
  ];

  console.log('Running:', first, template);

  const out1 = await fox.extract({
    urls: first,
    template,
    nonce,
  });

  console.log('out1 item count:', out1.results.items.length);
  console.log('out1 first:', out1.results.items[0]);
  console.log('out1 cost:', out1.metrics.cost);

  console.log('-'.repeat(40));

  console.log('Running:', rest, template);

  const out2 = await fox.extract({
    urls: rest,
    template,
    nonce,
  });

  console.log('out2 item count:', out2.results.items.length);
  console.log('out2 first:', out2.results.items[0]);
  console.log('out2 cost:', out2.metrics.cost);
}

const main = async () => {
  await runAgent();
  await demonstrateBost();
  process.exit(0);
} 

main();
