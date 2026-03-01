import * as fox from 'fetchfox-sdk';

const api_key = process.env.FETCHFOX_API_KEY;
fox.configure({
  apiKey: api_key,
  host: 'https://staging.api.fetchfox.ai',
  // host: 'https://api.fetchfox.ai',
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

  const urls = `https://www.hoffmann-group.com/DE/de/hom/p/7000071805-
https://www.hoffmann-group.com/DE/de/hom/p/7000062746-
https://www.hoffmann-group.com/DE/de/hom/p/7000062744-
https://www.hoffmann-group.com/DE/de/hom/p/7000033182-
https://www.hoffmann-group.com/DE/de/hom/p/7000111470-
https://www.hoffmann-group.com/DE/de/hom/p/083769-18X50
https://www.hoffmann-group.com/DE/de/hom/p/083648-19X50
https://www.hoffmann-group.com/DE/de/hom/p/7000047441-
https://www.hoffmann-group.com/DE/de/hom/p/7000047494-
https://www.hoffmann-group.com/DE/de/hom/p/7000062736-
https://www.hoffmann-group.com/DE/de/hom/p/7000031495-
https://www.hoffmann-group.com/DE/de/hom/p/7000111472-
https://www.hoffmann-group.com/DE/de/hom/p/7000111459-
https://www.hoffmann-group.com/DE/de/hom/p/7000048694-
https://www.hoffmann-group.com/DE/de/hom/p/7000111463-
https://www.hoffmann-group.com/DE/de/hom/p/7000111461-
https://www.hoffmann-group.com/DE/de/hom/p/7000049257-
https://www.hoffmann-group.com/DE/de/hom/p/7000050132-
https://www.hoffmann-group.com/DE/de/hom/p/7000029154-
https://www.hoffmann-group.com/DE/de/hom/p/083767-38X25
https://www.hoffmann-group.com/DE/de/hom/p/7000001172-
https://www.hoffmann-group.com/DE/de/hom/p/7000006178-
https://www.hoffmann-group.com/DE/de/hom/p/7000037640-
https://www.hoffmann-group.com/DE/de/hom/p/7000048395-
https://www.hoffmann-group.com/DE/de/hom/p/7000111471-
https://www.hoffmann-group.com/DE/de/hom/p/502290000-
https://www.hoffmann-group.com/DE/de/hom/p/502260000-
https://www.hoffmann-group.com/DE/de/hom/p/083645-19X50
https://www.hoffmann-group.com/DE/de/hom/p/083618-48X20
https://www.hoffmann-group.com/DE/de/hom/p/083616-50X25`.split('\n');

const runExtract = async () => {
  const template = {"_rules":"GLOBAL RULES THAT APPLY TO EVERY FIELD BELOW: (1) If a field value cannot be found on the page, always return an empty string \"\". Never return null, undefined, \"N/A\", \"n/a\", \"not available\", \"not found\", or any placeholder. (2) All fields ending in \"_original\" must be copied exactly as displayed on the page in the original website language, character for character, without any translation or modification. (3) All fields ending in \"_en\" must be translated to English. If the page is already in English, copy as-is. (4) All dimension fields (width, length, weight, thickness) must return a dictionary with \"value\" (number) and \"unit\" (string). If the dimension is not found, return \"\". (5) This field \"_rules\" should be ignored in the output, it only contains instructions.","tape":"Boolean. Return true if this product page is about an adhesive tape (any type: packaging tape, masking tape, duct tape, double-sided tape, electrical tape, etc.). Return false for tape dispensers, tape guns, tape accessories, cutters, or any non-adhesive tape product. Only adhesive tapes count as true.","productName":"The exact product name as displayed on the page. Copy it character for character in the original language of the website. Do not translate, do not abbreviate, do not modify.","brand":"The brand or manufacturer name of this product. Examples: tesa, 3M, Scotch, Nitto, Advance Tapes, Stokvis. If no brand is identifiable, return \"\".","domain":"The root domain of this website extracted from the page URL. Format: https://www.example.com (include protocol, include www if present, no trailing slash, no path).","country":"The two-letter ISO 3166-1 alpha-2 country code derived from the URL or website language/locale. Lowercase. Examples: de, us, gb, fr, au, jp, br.","PNSC":"The tesa PNSC product code. This is a 4 or 5 digit number that identifies a tesa product, typically embedded in the product name or title. Example: \"tesa 4124\" means PNSC is \"4124\", \"tesa 55667\" means PNSC is \"55667\". Only extract this for tesa-branded products. For non-tesa products, return \"\".","SKU":"The Stock Keeping Unit (SKU) or article number assigned by the shop/retailer. This is the retailer-specific product identifier, not the manufacturer code. If multiple SKUs exist, return the primary one. If not found, return \"\".","EAN":"The European Article Number (EAN-13) or Universal Product Code (UPC-12) barcode number. This is a standardized 8, 12, or 13 digit product identifier. Some shops label it as EAN, GTIN, UPC, or barcode. Return exactly one number. Prefer EAN over UPC if both exist. If not found, return \"\".","category_url":"The full URL of the most specific (deepest/narrowest) category page that contains this product. This is typically the last category in the breadcrumb navigation. Return the complete URL including protocol. If not found, return \"\".","subcategory_url":"An array of ALL category/breadcrumb URLs for this product, from the broadest (top-level) to the most specific. Include every level of the category hierarchy. Each entry must be a full URL. If not found, return \"\".","description_original":"The main product description text as displayed on the page. Copy the full description exactly as written in the original language. Do not translate, summarize, or modify. If there are multiple description sections, use the primary/main one. If not found, return \"\".","category_original":"The name of the most specific (deepest) category this product belongs to, exactly as shown on the page in the original language. Typically the last item in the breadcrumb trail before the product name. If not found, return \"\".","subcategory_original":"An array of ALL breadcrumb category names for this product, from broadest to most specific, exactly as shown on the page in the original language. Example: [\"Klebebänder\", \"Gewebeklebebänder\", \"Universalklebebänder\"]. If not found, return \"\".","color_original":"The color of the adhesive tape as stated on the product page, in the original language. Examples: schwarz, transparant, gris. Copy exactly as shown. If not found, return \"\".","material_original":"The base material/carrier of the adhesive tape as stated on the page, in the original language. Common materials: PVC, PP (polypropylene), PE (polyethylene), papier, tissu (cloth/fabric), aluminium, polyester. Copy exactly as shown. If not found, return \"\".","type_original":"The adhesive type of the tape as stated on the page, in the original language. Common types: acrylic, rubber, silicone, hotmelt, solvant (solvent-based). Copy exactly as shown. If not found, return \"\".","backing_original":"The backing or carrier material of the adhesive tape as stated on the page, in the original language. This refers to what the adhesive is applied onto. Examples: paper, filmic. Copy exactly as shown. If not found, return \"\".","description_en":"The main product description translated to English. If the original is already in English, copy it as-is. Otherwise, provide an accurate English translation preserving the original meaning and technical details. If not found, return \"\".","category_en":"The most specific category name translated to English. If already in English, copy as-is. Otherwise translate. If not found, return \"\".","subcategory_en":"An array of ALL breadcrumb category names translated to English, from broadest to most specific. Example: [\"Adhesive tapes\", \"Cloth tapes\", \"Universal tapes\"]. If already in English, copy as-is. Otherwise translate each entry. If not found, return \"\".","color_en":"The color of the adhesive tape translated to English. Examples: black, transparent, grey, white. If already in English, copy as-is. If not found, return \"\".","material_en":"The base material of the adhesive tape translated to English. Examples: PVC, polypropylene, polyethylene, paper, cloth, aluminium, polyester. If already in English, copy as-is. If not found, return \"\".","type_en":"The adhesive type translated to English. Examples: acrylic, rubber, natural rubber, silicone, hot-melt, solvent-based. If already in English, copy as-is. If not found, return \"\".","backing_en":"The backing material translated to English. Examples: acrylic foam, crepe paper, PVC film, cloth. If already in English, copy as-is. If not found, return \"\".","temperature":"The operating temperature range of the adhesive tape. Return as an array of dictionaries, each with \"value\" (number) and \"unit\" (string, typically \"°C\" or \"°F\"). A range like \"-40°C to +120°C\" should return [{\"value\": -40, \"unit\": \"°C\"}, {\"value\": 120, \"unit\": \"°C\"}]. A single value like \"80°C\" should return [{\"value\": 80, \"unit\": \"°C\"}]. If not found, return \"\".","width_original":"The width of the tape roll as listed on the product page, in its original unit. Return a dictionary with \"value\" (number) and \"unit\" (string, e.g. \"mm\", \"cm\", \"in\", \"inches\"). Tape width is typically the shorter cross-direction measurement, often given in mm. In formats like \"50mm x 66m\", the width is 50mm. If multiple variants exist, use the primary/first one. All dimension fields must refer to the same product variant. If not found, return \"\".","width_converted":"The width of the tape converted to millimeters. Return a dictionary with \"value\" (number) and \"unit\" (always \"mm\"). Convert from the original unit: 1 cm = 10 mm, 1 inch = 25.4 mm. If the original is already in mm, copy the value. If not found, return \"\".","length_original":"The length of the tape roll as listed on the product page, in its original unit. Return a dictionary with \"value\" (number) and \"unit\" (string, e.g. \"m\", \"yd\", \"ft\", \"yards\"). Tape length is the longer running-direction measurement, often given in meters. In formats like \"50mm x 66m\", the length is 66m. Use the same product variant as width. If not found, return \"\".","length_converted":"The length of the tape converted to meters. Return a dictionary with \"value\" (number) and \"unit\" (always \"m\"). Convert from the original unit: 1 yard = 0.9144 m, 1 foot = 0.3048 m. If the original is already in meters, copy the value. If not found, return \"\".","weight_original":"The weight of the tape roll as listed on the product page, in its original unit. Return a dictionary with \"value\" (number) and \"unit\" (string, e.g. \"g\", \"kg\", \"oz\", \"lbs\"). Use the same product variant as other dimensions. If not found, return \"\".","weight_converted":"The weight of the tape converted to grams. Return a dictionary with \"value\" (number) and \"unit\" (always \"g\"). Convert from the original unit: 1 kg = 1000 g, 1 oz = 28.3495 g, 1 lb = 453.592 g. If the original is already in grams, copy the value. If not found, return \"\".","thickness_original":"The total thickness of the adhesive tape as listed on the product page, in its original unit. Return a dictionary with \"value\" (number) and \"unit\" (string, e.g. \"mm\", \"µm\", \"mil\", \"microns\"). Thickness refers to the total tape thickness including backing and adhesive layer. Use the same product variant as other dimensions. If not found, return \"\".","thickness_converted":"The total thickness of the tape converted to millimeters. Return a dictionary with \"value\" (number) and \"unit\" (always \"mm\"). Convert from the original unit: 1 µm = 0.001 mm, 1 mil = 0.0254 mm. If the original is already in mm, copy the value. If not found, return \"\".","price":"The raw retail price of this product exactly as displayed on the page. Include VAT/tax if shown. If multiple prices exist (e.g. quantity discounts), use the standard single-unit price. Do not convert currency. Return a dictionary with four fields:\n\n- \"price_value\": decimal number in format X,XX (e.g. 12,99). Use the exact price shown, do not round.\n- \"price_currency\": three-letter ISO 4217 currency code (e.g. EUR, USD, GBP, CHF, SEK, PLN, CNY, JPY, CAD, AUD, BRL).\n- \"price_unit\": what unit is being sold. Return \"meters\" if priced per meter/running length, \"millimeters\" if priced per mm, or \"unit\" if priced per roll/piece/pack.\n- \"price_amount\": the quantity of that unit included. For \"unit\": how many rolls/pieces (usually 1). For \"meters\"/\"millimeters\": the length of tape included at this price.\n\nIf price is not found, return \"\".","EUR_price":"Convert the price to EUR using the exchange rates below. Return a dictionary with four fields:\n- \"value\": the price_value converted to EUR, as decimal X.XX.\n- \"currency\": always \"EUR\".\n- \"unit\": same as price_unit above.\n- \"amount\": same as price_amount above.\n\nIf the original currency is already EUR, copy price_value directly. Otherwise divide price_value by the rate below.\n\nExchange rates (1 EUR equals):\nGBP: 0.8711\nCHF: 0.9142\nSEK: 10.5670\nPLN: 4.2158\nCNY: 8.1944\nUSD: 1.1874\nJPY: 182.52\nCAD: 1.6128\nAUD: 1.6678\nBRL: 6.2500\n\nIf price was not found, return \"\"."};

  const job = await fox.extract.detach({
    urls: urls,
    template,
  });
  console.log('Job ID:', job.id);
  console.log('Progress:', job.appUrl);
  const out = await job.finished();
}

const runVisit = async () => {
  const out = await fox.visit({
    url: urls[0],
    proxy: 'auto',
    none: Math.random(),
  });
  console.log('out:', out);
  console.log('network:', out.metrics.network);
}

const main = async () => {
  // await runAgent();
  // await demonstrateBost();
  // await runVisit();

  await runExtract();

  process.exit(0);
} 

main();
