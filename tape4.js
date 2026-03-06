import * as fox from 'fetchfox-sdk';
import { writeFile } from 'fs/promises';


const api_key = process.env.FETCHFOX_API_KEY;
fox.configure({
  apiKey: api_key,
  host: 'https://staging.api.fetchfox.ai',
});

const run = async () => {
  const urls = [
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-double-sided-tape/general-purpose-double-side-tape-4954-50mx50mm-23331776/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-double-sided-tape/high-resistant-double-side-tape-4968-50mx50mm-23331866/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-double-sided-tape/scotch-pvc-double-sided-tape-9087-12mmx50m-11965298/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-double-sided-tape/scotch-textile-double-sided-tape-9086-pr-ec000128-0304-jlr/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-double-sided-tape/tape-465-clear-19mmx55m-11554168/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-double-sided-tape/teroson-117-05y-dubbelzijdige-tape-25mmx-10m-23570232-en/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-double-sided-tape/tesa-50607-50mmx50m-transparant-dubbelzijdige-tape-non-woven-splicing-23332043/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-double-sided-tape/tranparent-double-sided-filmic-tape-51977-50mx50mm-23332124/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-double-sided-tape/vhb-strip-of-acrylic-adhesive-pr1449127604012/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-double-sided-tape/vr-5080-rl50m-egfd-11905299/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-duct-cloth-tape/3m-1900-fabric-tape-50mm-x-50m-black-12014834/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-duct-cloth-tape/4615-pcr-industrial-duct-tape-for-general-applications-pr1579278077892351/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-duct-cloth-tape/4662-strong-all-purpose-fabric-tape-pr-ec000128-0075/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-duct-cloth-tape/all-weather-duct-tape-50mm-x-50mtr-13208765/',
    'https://shop.eriks.nl/en/maintenance-products-tapes-and-accessories-tapes-duct-cloth-tape/duct-tape-2903-pr184613569923111-en/',
  ];

  let i = 0;
  for (const url of urls) {
    const out = await fox.visit({
      url,
      proxy: 'auto',
    });
    for (const result of out.results) {
      console.log(
        'out:',
        result.status,
        result.bytes,
        url,
        result.markdown?.link,
      );
    }
  }
}

run();
