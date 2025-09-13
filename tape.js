import { configure, crawl, extract } from 'fetchfox-sdk';
import * as fox from 'fetchfox-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const { default: dotenv } = await import('dotenv');
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
} catch (error) {
  // dotenv not installed, continue with process.env only
}

// ============================================================================
// FETCHFOX CONFIGURATION OPTIONS - Edit these to change behavior
// ============================================================================

// Configure SDK with API key from environment
const api_key = process.env.FETCHFOX_API_KEY;
configure({
  apiKey: api_key,
  // host: 'https://dev.api.fetchfox.ai',
  // host: 'https://staging.api.fetchfox.ai',
  host: 'https://api.fetchfox.ai',
});

// Option to use saved URLs from database if they are available. Useful to skip repeated crawls when testing.
const USE_SAVED_URLS = false;

// PROXY OPTIONS - Mark with 'x' to select which proxy to use
// auto: Let FetchFox choose the best proxy automatically
// none: $0.01/GB (cheapest, no proxy, may be blocked by some sites)
// datacenter: $0.01/GB (cheapest, may be blocked by some sites)
// residential_cdp: $8.00/GB (residential IPs, no assets)
// residential_cdp_assets: $8.50/GB (residential IPs, loads assets - most expensive but best for bot detection)
const PROXY_OPTIONS = {
  'auto': '',                    // Let FetchFox choose automatically
  'none': 'x',              // Cheapest option, may be blocked
  'datacenter': '',              // Cheapest option, may be blocked
  'residential_cdp': '',        // R3esidential IPs
  'residential_cdp_assets': '',  // Most expensive, loads assets
};

// TRANSFORM METHODS - For reducing AI context and cost
// Mark with 'x' to select which transform method to use
const TRANSFORM_OPTIONS = {
  // Usually good
  'reduce': '',        // Reduces content intelligently (similar to SDK default)
  'slim_html': 'x',      // Removes unnecessary HTML

  'text_only': '',      // Extracts only text content
  'full_html': '',           // No transformation (full HTML)
};

// EXTRACT MODES - Different processing approaches
// Mark with 'x' to select which extract mode to use
const EXTRACT_MODES = {
  'ai': 'x',           // AI-powered extraction
  'code': '',          // code selector-based extraction (faster, less flexible)
};

// PROCESSING LIMITS - Following SDK approach
const MAX_DEPTH = 3;           // Crawl depth limit (0 = current page only)
const MAX_VISITS = 20;        // Maximum pages to visit during crawl
// const MAX_EXTRACTS = 100;      // Limit URLs for extraction (cost control)
const MAX_EXTRACTS = 20;      // Limit URLs for extraction (cost control)

// ============================================================================
// SCRAPING TARGETS - Enhanced with pagination templates and customer info
// ============================================================================

const COPY_KEYS = [
  'ranking',
  'name',
  'dmu',
  'soldTo',
];

const SCRAPING_TARGETS = [
  {
    working: true,

    ranking: '1',
    name: 'de_hoffmann_verpackung',
    dmu: 'Carl Bernh. Hoffmann GmbH & Co. KG',
    soldTo: 'Carl Bernh. Hoffmann',

    // customer: 'Carl Bernh. Hoffmann GmbH & Co. KG',
    pattern: 'https://www.hoffmann-verpackung.de/**c=**',
    startUrls: [
      'https://www.hoffmann-verpackung.de/klebeband-umreifung/klebeband/?p=1&o=2&n=100',
	    'https://www.hoffmann-verpackung.de/klebeband-umreifung/klebeband-mit-druck/?p=1&o=2&n=100',
	    'https://www.hoffmann-verpackung.de/klebeband-umreifung/warndruck-klebeband/?p=1&o=2&n=48',
	    'https://www.hoffmann-verpackung.de/klebeband-umreifung/nassklebeband/?p=1&o=2&n=48',
	    'https://www.hoffmann-verpackung.de/klebeband-umreifung/kreppband/?p=1&o=2&n=48',
	  ],
    maxDepth: 0,
    maxVisits: 10,
  },

  {
    working: true,

    ranking: '2',
    name: 'de_hoffmann_group',
    dmu: 'Hoffmann GmbH',
    soldTo: 'Hoffmann GmbH',

    pattern: 'https://www.hoffmann-group.com/DE/de/hom/p/*',
    startUrls: [
      'https://www.hoffmann-group.com/DE/de/hom/Chemisch-technische-Produkte/Klebeb%C3%A4nder/c/06-07-00-00-00',
      'https://www.hoffmann-group.com/DE/de/hom/Chemisch-technische-Produkte/Klebeb%C3%A4nder/c/06-07-00-00-00?page={{1..100}}',
	  ],
    maxDepth: 0,
    maxVisits: 4,
    proxy: 'datacenter',
  },

  {
    ranking: '3',
    name: 'de_haberkorn',
    dmu: 'Haberkorn',
    soldTo: 'Haberkorn GmbH',
    pattern: 'https://www.haberkorn.com/at/de/chemisch-technische-produkte/klebetechnik/**l=3',
    startUrls: [
      'https://www.haberkorn.com/at/de/chemisch-technische-produkte/klebetechnik/klebebaender-einseitig?page={{1..20}}',
      'https://www.haberkorn.com/at/de/chemisch-technische-produkte/klebetechnik/klebebaender-doppelseitig?page={{1..20}}',
      'https://www.haberkorn.com/at/de/chemisch-technische-produkte/klebetechnik/reflektierende-folien?page={{1..20}}',
	  ],
    maxDepth: 0,
    maxVisits: 10,
    proxy: 'datacenter',
  },

  {
    working: true,

    ranking: '4',
    name: 'no_norengros',
    dmu: 'NORENGROS',
    soldTo: 'NORENGROS NB ENGROS',

    pattern: 'https://www.norengros.no/product/**',
    startUrls: [
      'https://www.norengros.no/category/emballasje/tape?page={{0..20}}',
    ],
    maxDepth: 0,
    maxVisits: 10,
  },

  {
    working: true,

    ranking: '5',
    name: 'us_fastenal',
    dmu: 'FASTENAL',
    soldTo: 'FASTENAL EUROPE LTD',

    pattern: 'https://www.fastenal.com/product/details/*',
    startUrls: [
      'https://www.fastenal.com/product/Adhesives%2C%20Sealants%2C%20and%20Tape/Tape?categoryId=601991',
    ],
    priority: {
      only: [
        'https://www.fastenal.com/product/Adhesives%2C%20Sealants%2C%20and%20Tape/Tape/**',
      ],
    },
    crawlStrategy: 'dfs',
    maxDepth: 3,
    maxVisits: 100,
    // perPage: 'many',
  },

  {
    ranking: '6',
    name: 'us_kramp',
    dmu: 'KRAMP GROUP',
    soldTo: 'KRAMP UK',

    pattern: 'https://www.kramp.com/shop-gb/en/vp/*',
    startUrls: [
      'https://www.kramp.com/shop-gb/en/c/adhesive-tape--web3-4055687?page={{1..20}}',
    ],
    maxDepth: 0,
    maxVisits: 10,
  },

  {
    working: true,

    ranking: '7',
    name: 'de_eriks',
    dmu: 'ERIKS',
    soldTo: 'ERIKS INDUSTRIAL SER',

    customer: 'Eriks',
    pattern: 'https://shop.eriks.de/de/wartungsprodukte-klebebaender-und-zubehoer-klebebaender-abdeck-klebebaender/*/',
    startUrls: [
      'https://shop.eriks.de/de/wartungsprodukte-klebebaender-und-zubehoer-klebebaender/',
    ],
    priority: {
      only: [
        'https://shop.eriks.de/de/wartungsprodukte-klebebaender-und-zubehoer-klebebaender**',
      ],
    },
    maxDepth: 3,
    maxVisits: 100,
    crawlStrategy: 'dfs',
    perPage: 'many',
  },

  {
    ranking: '8',
    name: 'de_tme',
    dmu: 'TRANSFER MULISORT ELEKTRONIK',
    soldTo: 'TRANSFER MULTISORT',

    pattern: 'https://www.tme.eu/de/details/**',
    startUrls: [
      'https://www.tme.eu/de/katalog/warn-und-markierungsbander_113787/?page={{1..20}}',
	    'https://www.tme.eu/de/katalog/bander_112715/?page={{1..20}}',
    ],
    maxDepth: 0,
    maxVisits: 40,
    loadWait: 6000,
  },

  {
    ranking: '9',
    name: 'cn_ehsy',
    dmu: 'Ehsy',
    soldTo: 'Ehsy',

    pattern: 'https://www.ehsy.com/product-*',
    startUrls: [
      'https://www.ehsy.com/category-16688?p={{1..100}}',
    ],
    maxDepth: 0,
    maxVisits: 10,
  },

  {
    working: true,

    ranking: '10',
    name: 'us_rs_hughes',
    dmu: 'RS HUGHES',
    soldTo: 'RS HUGHES COMPANY IN',

    pattern: 'https://www.rshughes.com/p/**',
    startUrls: [
      'https://www.rshughes.com/c/Tapes/3002/',
    ],
    priority: {
      only: [
        'https://www.rshughes.com/c/**',
      ],
      high: [
        // Tape categories
        'https://www.rshughes.com/c/**Tape**',
        // Category pages
        'https://www.rshughes.com/c/**Tape**start_item=*',
      ],
    },
    contentTransform: 'reduce',
    maxDepth: 1,
    maxVisits: 50,
    crawlStrategy: 'dfs',
  },

  {
    working: true,

    ranking: '11',
    name: 'us_uline',
    dmu: 'ULINE',
    soldTo: 'ULINE INC',

    pattern: 'https://www.uline.com/Product/Detail/**',
    startUrls: [
      'https://www.uline.com/Cls_02/Tapef',
    ],
    priority: {
      only: [
        'https://www.uline.com/BL**Tape**',
        'https://www.uline.com/Grp**Tape**',
      ],
      skip: [
        '**Dispenser**',
        'https://www.uline.com/Grp_16/Hand-Held-Tape-Dispensers',
        'https://www.uline.com/Grp_128/Kraft-Tape-Dispensers',
        'https://www.uline.com/Grp_288/Velcro-Brand',
        'https://www.uline.com/Grp_526/Hook-and-Loop-Tape',
        'https://www.uline.com/Grp_247/Glue-Dots',
        'https://www.uline.com/Grp_339/Adhesives-Glue-Epoxy',
        'https://www.uline.com/Grp_85/Glue-Guns-and-Glue-Sticks',
      ],
    },
    maxDepth: 2,
    maxVisits: 100,
    crawlStrategy: 'dfs',
  },

  {
    working: true,

    ranking: '12',
    name: 'de_sks',
    dmu: 'S.K.S GmbH',
    soldTo: 'S.K.S GmbH',

    pattern: 'https://www.shop-sks.com/*',
    startUrls: [
      'https://www.shop-sks.com/3M/Kleben-und-Verbinden/Einseitige-Klebebaender/?p={{0..20}}',
      'https://www.shop-sks.com/3M/Kleben-und-Verbinden/Doppelseitige-Klebebaender/?p={{0..20}}',
      'https://www.shop-sks.com/tesa/Einseitige-Klebebaender/?p={{0..20}}',
      'https://www.shop-sks.com/tesa/Doppelseitige-Klebebaender/?p={{0..20}}',
      'https://www.shop-sks.com/tesa/Klischeebaender/?p={{0..10}}',
      'https://www.shop-sks.com/tesa/Lasergravurfolie/?p={{0..10}}',
    ],
    contentTransform: 'slim_html',
  },

  {
    ranking: '13',
    name: 'pl_semicon',
    dmu: 'SEMICON',
    soldTo: 'SEMICON SP. Z O.O.',
    pattern: 'https://sklep.semicon.com.pl/shop2/,*',
    startUrls: [
      'https://sklep.semicon.com.pl/shop2/,c1481,page-{{1..10}}',
    ],
  },

  {
    working: true,

    ranking: '14',
    name: 'de_seyffer',
    dmu: 'Seyffer GmbH',
    soldTo: 'Seyffer GmbH',

    pattern: 'https://seyffer.shop/de/*.html',
    startUrls: [
      'https://seyffer.shop/de/kleben/einseitige-klebebaender/?view_mode=tiled&listing_sort=&listing_count=72&page={{0..30}}',
      'https://seyffer.shop/de/kleben/doppelseitige-klebebaender/?view_mode=tiled&listing_sort=&listing_count=72&page={{0..30}}',
    ],
    contentTransform: 'slim_html',
  },

  {
    ranking: '15',
    name: 'ch_ibz',
    dmu: 'IBZ',
    soldTo: 'IBZ Industrie AG',
    pattern: 'https://www.ibzag.ch/*~p*',
    startUrls: [
      'https://www.ibzag.ch/de/shop/einseitig-klebende-klebebaender~c1217?page={{1..15}}',
      'https://www.ibzag.ch/de/shop/doppelseitig-klebende-klebebaender~c1298?page={{1..15}}',
      'https://www.ibzag.ch/de/shop/warnbaender-kennzeichung~c677347?page={{1..10}}',
      'https://www.ibzag.ch/de/shop/magnetbaender~c1376?page={{1..10}}',
    ],
  },
  {
    ranking: '16',
    name: 'cz_adect',
    dmu: 'ADECT',
    soldTo: 'ADECT CZ spol. s r.o',
    pattern: 'https://www.adecteshop.cz/:*/',
    startUrls: [
      'https://www.adecteshop.cz/maskovaci-pasky/strana-{{1..15}}/',
      'https://www.adecteshop.cz/oznacovaci-barevne-pasky/strana-{{1..15}}/',
    ],
  },
  {
    ranking: '17',
    name: 'fr_manutan',
    dmu: 'GROUP MANUTAN',
    soldTo: 'MANUTAN (11621)',
    pattern: 'https://www.manutan.fr/fr/maf/adhesif*',
    startUrls: [
      'https://www.manutan.fr/fr/maf/adhesif-agrafeuse-et-collage?page={{1..20}}',
      'https://www.manutan.fr/fr/maf/adhesif-pvc?page={{1..20}}',
      'https://www.manutan.fr/fr/maf/adhesif-specifique?page={{1..20}}',
      'https://www.manutan.fr/fr/maf/adhesif-personnalisable?page={{1..15}}',
      'https://www.manutan.fr/fr/maf/adhesif-polypropylene?page={{1..15}}',
    ],
  },
  {
    name: 'fr_maillaj', 
    dmu: 'GROUPE ALIZON INDUSTRIE',
    soldTo: 'MAILLAJ (GPE 12229)',
    pattern: 'https://www.maillaj.fr/fr/adhesif-colle-machine/*',
    startUrls: [
      'https://www.maillaj.fr/fr/adhesif-colle-machine?page={{1..25}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-technique-industriel/adhesif-de-masquage?page={{1..15}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-technique-industriel/adhesif-marquage-signalisation?page={{1..15}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-technique-industriel/adhesif-toile-gaffer?page={{1..10}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-technique-industriel/adhesif-disolation-etancheite?page={{1..10}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-technique-industriel/film-adhesif-technique?page={{1..10}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-systeme-dassemblage/adhesif-double-face?page={{1..15}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-systeme-dassemblage/mousse-adhesive-double-face?page={{1..10}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-systeme-dassemblage/adhesif-de-transfert?page={{1..10}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-demballage/adhesif-manuel-papier?page={{1..10}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-demballage/adhesif-manuel-pp?page={{1..10}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-demballage/adhesif-manuel-pvc?page={{1..10}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-demballage/adhesif-manuel-pet-recycle?page={{1..10}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-demballage/adhesif-arme?page={{1..10}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-demballage/adhesif-machine?page={{1..10}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-demballage/adhesif-de-palettisation?page={{1..10}}',
      'https://www.maillaj.fr/fr/adhesif-colle-machine/adhesif-demballage/bande-gommee-0?page={{1..10}}',
    ],
  },
  {
    ranking: '18',
    name: 'fr_gd_industrie',
    dmu: 'GROUPE GD INDUSTRIE',
    soldTo: 'GD INDUSTRIE (GPE 10',
    pattern: 'https://www.gd-industrie.com/fr/*',
    startUrls: [
      // Main adhesives category with pagination
      'https://www.gd-industrie.com/fr/adhesifs?page={{1..20}}',
      // Adhesives subcategories with pagination
      'https://www.gd-industrie.com/fr/simple-face-2?page={{1..15}}',
      'https://www.gd-industrie.com/fr/simple-face-d-emballage-1?page={{1..15}}',
      'https://www.gd-industrie.com/fr/double-face-fin-1?page={{1..10}}',
      'https://www.gd-industrie.com/fr/double-face-mousse-2?page={{1..10}}',
      'https://www.gd-industrie.com/fr/double-face-cliche?page={{1..10}}',
      // Adhesive tapes main category with pagination
      'https://www.gd-industrie.com/fr/ruban-adhesif?page={{1..20}}',
      // Adhesive tapes subcategories with pagination
      'https://www.gd-industrie.com/fr/kraft-adhesif-gomme?page={{1..10}}',
      'https://www.gd-industrie.com/fr/fermeture-de-carton-1?page={{1..10}}',
      'https://www.gd-industrie.com/fr/imprime-/personnalise?page={{1..10}}',
      'https://www.gd-industrie.com/fr/palettisation-2?page={{1..10}}',
      'https://www.gd-industrie.com/fr/renforce?page={{1..10}}',
      'https://www.gd-industrie.com/fr/securite-garantie-0?page={{1..10}}',
      'https://www.gd-industrie.com/fr/protection-de-document?page={{1..10}}',
    ],
  },
  {
    ranking: '19',
    name: 'int_rs_components',
    dmu: 'RS COMPONENTS',
    soldTo: 'RS Components GmbH',
    pattern: 'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/*',
    startUrls: [
      // Main tapes category with pagination
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/?applied-dimensions=4294554428&r=f&searchTerm=*',
      // Tape subcategories with pagination
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/cable-sleeving-tape/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/clear-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/double-sided-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/duct-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/esd-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/electrical-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/foam-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/gaffer-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/high-visibility-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/hook-loop-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/magnetic-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/masking-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/metallic-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/ptfe-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/packing-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/safety-hazard-tapes/?r=f&searchTerm=*',
      'https://uk.rs-online.com/web/c/adhesives-sealants-tapes/tapes/self-amalgamating-tapes/?r=f&searchTerm=*',
    ],
  },
  {
    ranking: '20',
    name: 'int_rubix',
    dmu: 'RUBIX',
    soldTo: 'RUBIX',
    pattern: 'https://uk.rubix.com/en/*',
    startUrls: [
      // Main adhesive tapes category with pagination
      'https://uk.rubix.com/en/adhesive-tapes/c-50-15-20?page={{1..15}}',
      // Tape subcategories with pagination
      'https://uk.rubix.com/en/masking-tapes/c-50-15-20-15?page={{1..10}}',
      'https://uk.rubix.com/en/mounting-tapes/c-50-15-20-35?page={{1..10}}',
      'https://uk.rubix.com/en/packaging-adhesive/c-50-15-20-45?page={{1..10}}',
      'https://uk.rubix.com/en/insulating-tapes/c-50-15-20-30-10?page={{1..10}}',
      'https://uk.rubix.com/en/marking-tape/c-50-15-20-20-10?page={{1..10}}',
      'https://uk.rubix.com/en/protective-films/c-50-15-20-55?page={{1..10}}',
      'https://uk.rubix.com/en/protecting-tapes/c-50-15-20-25?page={{1..10}}',
      'https://uk.rubix.com/en/anti-slip-tapes-and-other-anti-slip-materials/c-50-15-20-40?page={{1..10}}',
      'https://uk.rubix.com/en/sealing-tapes/c-50-15-20-10?page={{1..10}}',
    ],
  },
  {
    ranking: '21',
    name: 'de_klebetechnik_und_mehr',
    dmu: 'Krückemeyer',
    soldTo: 'Krückemeyer',
    pattern: 'https://www.klebetechnik-und-mehr.de/epages/63672978.sf/de_DE/*',
    startUrls: [
      // Main adhesive tapes category with pagination
      'https://www.klebetechnik-und-mehr.de/epages/63672978.sf/de_DE/?ObjectPath=/Shops/63672978/Categories/Klebebaender&PageSize=100&ViewMode=Grid&Page={{1..20}}',
    ],
  },
  {
    ranking: '22',
    name: 'de_kahmann_ellerbrock',
    dmu: 'Kahmann & Ellerbrock',
    soldTo: 'Kahmann & Ellerbrock',
    pattern: 'https://www.ke.de/*',
    startUrls: [
      // Main adhesive tapes category with pagination
      'https://www.ke.de/Klebebaender?page={{1..20}}',
    ],
  },
  {
    ranking: '23',
    name: 'at_kaindl',
    dmu: 'Kaindl-Technischer Industriebedarf',
    soldTo: 'Kaindl-Technischer I',
    pattern: 'https://webshop.kaindltech.at/shop/de/*',
    startUrls: [
      // Main category and subcategories
      'https://webshop.kaindltech.at/shop/de/s/klebebaender/',
      'https://webshop.kaindltech.at/shop/de/?plugin=dynamicsearch&filterKategorie1=Klebeb%25C3%25A4nder&filterKategorie2=Abdeckklebeb%C3%A4nder&filterPageType=shop&query=%2A&productsPerPage=500',
      'https://webshop.kaindltech.at/shop/de/?plugin=dynamicsearch&ffs_mode=rub&filterKategorie1=Klebeb%25C3%25A4nder&filterKategorie2=Aluminiumklebeb%C3%A4nder&filterPageType=shop&query=%2A&productsPerPage=500',
      'https://webshop.kaindltech.at/shop/de/?plugin=dynamicsearch&ffs_mode=rub&filterKategorie1=Klebeb%25C3%25A4nder&filterKategorie2=Bau-%20Putz%20und%20Schutzklebeb%C3%A4nder&filterPageType=shop&query=%2A&productsPerPage=500',
      'https://webshop.kaindltech.at/shop/de/?plugin=dynamicsearch&ffs_mode=rub&filterKategorie1=Klebeb%25C3%25A4nder&filterKategorie2=Doppelklebeb%C3%A4nder&filterPageType=shop&query=%2A&productsPerPage=500',
      'https://webshop.kaindltech.at/shop/de/?plugin=dynamicsearch&ffs_mode=rub&filterKategorie1=Klebeb%25C3%25A4nder&filterKategorie2=Gewebeklebeb%C3%A4nder&filterPageType=shop&query=%2A&productsPerPage=500',
      'https://webshop.kaindltech.at/shop/de/?plugin=dynamicsearch&ffs_mode=rub&filterKategorie1=Klebeb%25C3%25A4nder&filterKategorie2=Klettverschl%C3%BCsse&filterPageType=shop&query=%2A&productsPerPage=500',
      'https://webshop.kaindltech.at/shop/de/?plugin=dynamicsearch&ffs_mode=rub&filterKategorie1=Klebeb%25C3%25A4nder&filterKategorie2=Spezialklebeb%C3%A4nder&filterPageType=shop&query=%2A&productsPerPage=500',
      'https://webshop.kaindltech.at/shop/de/?plugin=dynamicsearch&ffs_mode=rub&filterKategorie1=Klebeb%25C3%25A4nder&filterKategorie2=Verpackungsklebeb%C3%A4nder&filterPageType=shop&query=%2A&productsPerPage=500',
    ],
  },
  {
    ranking: '24',
    name: 'de_moosmann',
    dmu: 'Moosmann GmbH & Co. KG',
    soldTo: 'Moosmann GmbH & Co.',
    pattern: 'https://www.moosmann.de/*',
    startUrls: [
      // Main category and subcategories
      'https://www.moosmann.de/klebeband',
      'https://www.moosmann.de/gewebeband',
      'https://www.moosmann.de/etikettenschutzfilm',
      'https://www.moosmann.de/kreppband',
      'https://www.moosmann.de/nassklebeband',
      'https://www.moosmann.de/papierklebeband',
      'https://www.moosmann.de/pet-klebeband',
      'https://www.moosmann.de/pp-klebeband',
      'https://www.moosmann.de/pvc-klebeband',
      'https://www.moosmann.de/tesapack-60400-bio-strong-50-mm',
      'https://www.moosmann.de/filamtenklebeband-tesa-4590-transparent',
    ],
  },
  {
    ranking: '25',
    name: 'de_mueth_tapes',
    dmu: 'müth tapes GmbH & Co.KG',
    soldTo: 'mÃ¼th tapes GmbH & Co',
    pattern: 'https://shop.mueth.de/*',
    startUrls: [
      // Main category and subcategories
      'https://shop.mueth.de/produkte/',
      'https://shop.mueth.de/produkte/verpackungsklebebaender/',
      'https://shop.mueth.de/produkte/schaumstoff-u.-dichtungs-klebebaender/',
      'https://shop.mueth.de/produkte/nature-bio/',
      'https://shop.mueth.de/produkte/abdeckbaender/',
      'https://shop.mueth.de/produkte/aluminium-klebebaender/',
      'https://shop.mueth.de/produkte/bedruckte-klebebaender-u.-folien/',
      'https://shop.mueth.de/produkte/doppelseitige-klebebaender/',
      'https://shop.mueth.de/produkte/gewebebaender/',
      'https://shop.mueth.de/produkte/warn-markierung-u.-antirutsch/',
      'https://shop.mueth.de/produkte/oberflaechenschutzfolien/',
      'https://shop.mueth.de/produkte/elektro-klebebaender/',
    ],
  },
  {
    ranking: '26',
    name: 'de_selmundo',
    dmu: 'OM-Klebetechnik GmbH',
    soldTo: 'OM-Klebetechnik GmbH',
    pattern: 'https://www.selmundo.com/:*',
    visitPriority: {
      only: [
        'https://www.selmundo.com/de/packband*',
      ],
      skip: [
        'https://www.selmundo.com/de/packband/handabroller-tischabroller*',
      ],
    },
    startUrls: [
      // Packaging tapes main category and subcategories
      'https://www.selmundo.com/de/packband/',
      'https://www.selmundo.com/de/packband/bedrucktes-packband/',
      'https://www.selmundo.com/de/packband/pvc-pp-paketband/',
      'https://www.selmundo.com/de/packband/papier-packband-oeko-packband/',
      'https://www.selmundo.com/de/packband/maschinen-packband/',
      'https://www.selmundo.com/de/packband/fadenverstaerktes-nassklebeband/',
      // Single-sided tapes main category and subcategories
      'https://www.selmundo.com/de/einseitiges-klebeband/',
      'https://www.selmundo.com/de/einseitiges-klebeband/malerkrepp-lackierband/',
      'https://www.selmundo.com/de/einseitiges-klebeband/gewebeband-duct-tape-panzertape/',
      'https://www.selmundo.com/de/einseitiges-klebeband/strapping-klebeband/',
      'https://www.selmundo.com/de/einseitiges-klebeband/metall-klebebaender/',
      'https://www.selmundo.com/de/einseitiges-klebeband/anti-rutsch-klebebaender/',
      'https://www.selmundo.com/de/einseitiges-klebeband/markierungsbaender/',
      'https://www.selmundo.com/de/einseitiges-klebeband/isolierband-dichtungsband/',
      'https://www.selmundo.com/de/einseitiges-klebeband/filament-klebeband/',
      'https://www.selmundo.com/de/einseitiges-klebeband/sonstige/',
      // Double-sided tapes main category and subcategories
      'https://www.selmundo.com/de/doppelseitiges-klebeband/',
      'https://www.selmundo.com/de/doppelseitiges-klebeband/acrylat-klebeband/',
      'https://www.selmundo.com/de/doppelseitiges-klebeband/folientraeger/',
      'https://www.selmundo.com/de/doppelseitiges-klebeband/gewebetraeger/',
      'https://www.selmundo.com/de/doppelseitiges-klebeband/vliestraeger/',
      'https://www.selmundo.com/de/doppelseitiges-klebeband/ohne-traeger/',
      'https://www.selmundo.com/de/doppelseitiges-klebeband/schaumband/',
      'https://www.selmundo.com/de/doppelseitiges-klebeband/transferklebeband/',
      'https://www.selmundo.com/de/doppelseitiges-klebeband/waermeleitfaehige-klebebaender/',
    ],
  },
  {
    ranking: '27',
    name: 'de_roeckelein',
    dmu: 'Röckelein GmbH',
    soldTo: 'RÃ¶ckelein GmbH',
    pattern: 'https://roeckelein-gmbh.de/*',
    startUrls: [
      // Single-sided tapes main category and subcategories
      'https://roeckelein-gmbh.de/kleben-und-verbinden/einseitige-klebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/einseitige-klebebander/klebebander-mit-schaumstofftrager',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/einseitige-klebebander/abdeckklebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/einseitige-klebebander/filament-klebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/einseitige-klebebander/gewebe-klebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/einseitige-klebebander/hochleistungs-dichtbander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/einseitige-klebebander/klebebander-mit-metalltrager',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/einseitige-klebebander/kreppklebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/einseitige-klebebander/spezial-klebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/einseitige-klebebander/warnmarkierungsbander',
      // Double-sided tapes main category and subcategories
      'https://roeckelein-gmbh.de/kleben-und-verbinden/doppelseitige-klebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/doppelseitige-klebebander/acrylatschaum-klebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/doppelseitige-klebebander/atg-klebebandauftragssystem',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/doppelseitige-klebebander/dunne-doppelseitige-klebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/doppelseitige-klebebander/hitzeaktivierbare-klebstoff-filme',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/doppelseitige-klebebander/doppelseitige-klebebander-mit-schaumstofftrager',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/doppelseitige-klebebander/transferklebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/doppelseitige-klebebander/vhb-klebebander',
      // Packaging systems main category and subcategories
      'https://roeckelein-gmbh.de/kleben-und-verbinden/verpackungssysteme',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/verpackungssysteme/bedruckte-klebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/verpackungssysteme/bundelungs-und-transportsicherungs-klebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/verpackungssysteme/verpackungsklebebander',
      // Electrical products main category and subcategories
      'https://roeckelein-gmbh.de/kleben-und-verbinden/elektroprodukte',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/elektroprodukte/isolier-und-montageklebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/elektroprodukte/einseitig-elektrisch-leitfahige-klebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/elektroprodukte/doppelseitig-elektrisch-leitfahige-klebebander',
      'https://roeckelein-gmbh.de/kleben-und-verbinden/elektroprodukte/thermisch-leitfahige-klebebander',
      // Hook and loop tapes
      'https://roeckelein-gmbh.de/kleben-und-verbinden/druckverschluss-haken-und-schlaufenbander',
    ],
  },
  {
    ranking: '28',
    name: 'uk_austen_direct',
    dmu: 'AUSTEN INSTANT TAPES LTD',
    soldTo: 'AUSTEN INSTANT TAPES',
    pattern: 'https://austendirect.co.uk/*',
    startUrls: [
      // All subcategories
      'https://austendirect.co.uk/product-category/customised-printed-tapes/',
      'https://austendirect.co.uk/product-category/automotive-tapes/',
      'https://austendirect.co.uk/category/eco-friendly/',
      'https://austendirect.co.uk/product-category/speciality-single-sided-tapes/',
      'https://austendirect.co.uk/product-category/paper-filmic/',
      'https://austendirect.co.uk/product-category/cloth-gaffer-tapes/',
      'https://austendirect.co.uk/product-category/double-sided-tapes/',
      'https://austendirect.co.uk/product-category/electrical-insulating-tapes/',
      'https://austendirect.co.uk/product-category/lane-marking-warning-safety/',
      'https://austendirect.co.uk/product-category/metallic-tapes/',
      'https://austendirect.co.uk/product-category/packaging-tapes/',
      'https://austendirect.co.uk/product-category/sealing-tapes/',
      'https://austendirect.co.uk/product-category/splicing-tape/',
    ],
  },
  {
    ranking: '29',
    name: 'se_ahlsell',
    dmu: 'AHLSELL',
    soldTo: 'AHLSELL (DIREKTLEV.)',
    pattern: 'https://www.ahlsell.se/*',
    startUrls: [
      // Main category
      'https://www.ahlsell.se/category/forbrukningsvaror/tejp-och-tatningslister',
    ],
  },
  {
    ranking: '30',
    name: 'cz_aztech',
    dmu: 'AZ TECH',
    soldTo: 'AZ TECH, s.r.o.',
    pattern: 'https://eshop.aztech.cz/*',
    startUrls: [
      // Main category
      'https://eshop.aztech.cz/lepeni/',
    ],
  },
  {
    ranking: '31',
    name: 'cz_dr_tapes',
    dmu: 'B.M.P.',
    soldTo: 'B.M.P. S.R.L.',
    pattern: 'https://drtapes.com/it/*',
    startUrls: [
      // Main categories
      'https://drtapes.com/it/5-monoadesivi',
      'https://drtapes.com/it/7-biadesivi',
    ],
  },
  {
    ranking: '32',
    name: 'it_tapes_store',
    dmu: 'BIEMME ADESIVI SRL',
    soldTo: 'BIEMME ADESIVI SRL',
    pattern: 'https://www.tapes-store.com/it/*',
    startUrls: [
      // Main categories
      'https://www.tapes-store.com/it/nastri-monoadesivi.html',
      'https://www.tapes-store.com/it/nastri-biadesivi.html',
    ],
  },
  {
    ranking: '33',
    name: 'se_boxon',
    dmu: 'BOXON',
    soldTo: 'BOXON A/S',
    pattern: 'https://www.boxon.se/*',
    startUrls: [
      // Main category
      'https://www.boxon.se/produkter/forslutning/tejp',
    ],
  },
  {
    ranking: '34',
    name: 'uk_castletis',
    dmu: 'CASTLE TAPES & INDUSTRIAL SOLUTIONS',
    soldTo: 'CASTLE TAPES & INDUS',
    pattern: 'https://castletis.co.uk/*',
    startUrls: [
      // Main category
      'https://castletis.co.uk/15-tapes',
    ],
  },
  {
    ranking: '35',
    name: 'it_dpm',
    dmu: 'DIPIEMME S.R.L.',
    soldTo: 'DIPIEMME S.R.L.',
    pattern: 'https://dpmtapes.com/*',
    startUrls: [
      // Main categories
      'https://dpmtapes.com/buisness/monoadesivi/',
      'https://dpmtapes.com/buisness/biadesivi/',
      'https://dpmtapes.com/biadesivi/',
    ],
  },
  {
    ranking: '36',
    name: 'de_hahn_kolb',
    dmu: 'Würth',
    soldTo: 'HAHN + KOLB Werkzeug',
    pattern: 'https://www.hahn-kolb.de/*',
    startUrls: [
      // Main category
      'https://www.hahn-kolb.de/All-categories/Adhesive-tapes-insulating-tapes/1521AC04_1907362.cyid/1521.cgid/en/US/EUR/',
    ],
  },
  {
    ranking: '37',
    name: 'at_hostra',
    dmu: 'Hostra',
    soldTo: 'Hostra Gummi- und Ku',
    pattern: 'https://shop.hostra.at/*',
    startUrls: [
      // Main category
      'https://shop.hostra.at/Klebebaender/',
    ],
  },
  {
    ranking: '38',
    name: 'it_firenze',
    dmu: 'NUOVA FIRENZE NASTRI',
    soldTo: 'NUOVA FIRENZE NASTRI',
    pattern: 'https://www.firenzenastri.it/it/*',
    startUrls: [
      // Main category
      'https://www.firenzenastri.it/it/vendita-nastri-adesivi-professionali-tesa.html',
    ],
  },
  {
    ranking: '39',
    name: 'ro_papyrus',
    dmu: 'PAPYRUS',
    soldTo: 'PAPYRUS ROMANIA SRL',
    pattern: 'https://www.papyrus.com/roRO/*',
    startUrls: [
      // Main category
      'https://www.papyrus.com/roRO/catalog/benzi-adezive-materiale-sigilare--c16?mya=0&query=::allCategories:16',
    ],
  },
  {
    ranking: '40',
    name: 'uk_shandhigson',
    dmu: 'SHAND HIGSON & CO LTD',
    soldTo: 'SHAND HIGSON & CO. L',
    pattern: 'https://www.shandhigson.co.uk/*',
    startUrls: [
      // Main category
      'https://www.shandhigson.co.uk/tapes',
    ],
  },
  {
    ranking: '41',
    name: 'es_solbi_mural',
    dmu: 'SOLBI MURAL',
    soldTo: 'SOLBI MURAL,S.L.',
    pattern: 'https://solbi-mural.com/en/*',
    startUrls: [
      // Main categories
      'https://solbi-mural.com/en/22-one-sided-adhesive-tapes',
      'https://solbi-mural.com/en/15-double-sided-adhesive-tapes',
    ],
  },
  {
    ranking: '42',
    name: 'hr_tahea',
    dmu: 'Tahea csoport',
    soldTo: 'TAHEA d.o.o.Poduzece',
    pattern: 'https://www.spooling.hr/product-page/*',
    startUrls: [
      // Main category
      'https://www.spooling.hr/proizvodi',
    ],
  },
  {
    ranking: '43',
    name: 'no_tess',
    dmu: 'TESS',
    soldTo: 'TESS Ã˜ST AS',
    pattern: 'https://www.tess.no/*',
    startUrls: [
      // Main category
      'https://www.tess.no/produkter/festemateriell/tape-og-merkeband/',
    ],
  },
  {
    ranking: '44',
    name: 'it_tapes_point',
    dmu: 'THE-MA',
    soldTo: 'THE-MA SPA',
    pattern: 'https://tapespoint.com/en/*',
    startUrls: [
      // Main categories
      'https://tapespoint.com/en/12-single-sided-adhesive-tapes',
      'https://tapespoint.com/en/13-double-sided-adhesive-tapes',
      'https://tapespoint.com/en/50-packing-tapes',
    ],
  },
  {
    ranking: '45',
    name: 'se_swedol',
    dmu: 'TOOLS',
    soldTo: 'SWEDOL AB',
    pattern: 'https://www.swedol.se/*',
    startUrls: [
      // Main category
      'https://www.swedol.se/produktsortiment/montering-skruv-och-las/tejpa-och-hafta/tejpa.html?mcprod_swedol_sek_sv_products%5BhierarchicalMenu%5D%5Bcategories.level0%5D%5B0%5D=Produktsortiment&mcprod_swedol_sek_sv_products%5BhierarchicalMenu%5D%5Bcategories.level0%5D%5B1%5D=Montering%2C%20skruv%20och%20l%C3%A5s&mcprod_swedol_sek_sv_products%5BhierarchicalMenu%5D%5Bcategories.level0%5D%5B2%5D=Tejpa%20och%20h%C3%A4fta&mcprod_swedol_sek_sv_products%5BhierarchicalMenu%5D%5Bcategories.level0%5D%5B3%5D=Tejpa&mcprod_swedol_sek_sv_products%5Bpage%5D=2&',
    ],
  },
  {
    ranking: '46',
    name: 'es_trayma',
    dmu: 'TRANSFORMADOS Y MANIPULADOS',
    soldTo: 'TRANSFORMADOS Y MANI',
    pattern: 'https://www.trayma.es/*',
    startUrls: [
      // Main categories
      'https://www.trayma.es/cintas-adhesivas-de-una-cara/',
      'https://www.trayma.es/cinta-adhesiva-doble-cara/',
      'https://www.trayma.es/espumas-epdm-pvc-adhesivo/',
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '47',
    name: 'cn_zkh',
    dmu: 'ZKH',
    soldTo: 'ZKH',
    website: 'https://www.zkh.com',
    pattern: '',
    mainCategory: 'https://www.zkh.com/list/c-10283311.html?showType=pic&clp=1',
    subCategories: [],
    startUrls: [
      'https://www.zkh.com/list/c-10283311.html?showType=pic&clp=1'
    ],
    info: 'check language, load more functionality, create pattern',
    status: 'inactive',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '48',
    name: 'cn_jd',
    dmu: 'JD',
    soldTo: 'JD',
    website: 'https://www.jd.com',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [
      ''
    ],
    info: 'cant access, tried many vpns',
    status: 'blocked',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '49',
    name: 'us_addev',
    dmu: 'ADDEV',
    soldTo: 'DICKSON HOLLAND B.V.',
    website: 'https://shop.aero.addevmaterials.us',
    pattern: 'https://shop.aero.addevmaterials.us/product/*',
    mainCategory: 'https://shop.aero.addevmaterials.us/product-category/tapes/?products-per-page=all',
    subCategories: [],
    startUrls: [
      'https://shop.aero.addevmaterials.us/product-category/tapes/?products-per-page=all'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '50',
    name: 'us_crown',
    dmu: 'Crown',
    soldTo: 'Crown',

    pattern: 'https://shop.crown.com/crown/en/**Tape**/p/**',
    startUrls: [
      'https://shop.crown.com/crown/en/General-Supplies/Service-Supplies/Tape-Packaging/c/tape_packaging',
      'https://shop.crown.com/crown/en/General-Supplies/Warehouse/Floor-Tape/c/floor_tape',
    ],
    maxDepth: 0,
    maxVisits: 10,
    interact: true,

    website: 'https://shop.crown.com',
    mainCategory: 'https://shop.crown.com/crown/en/General-Supplies/Service-Supplies/Tape-Packaging/c/tape_packaging',
    subCategories: [],
    info: '2 main categories, different patterns -> how to implement?',
  },
  {
    ranking: '51',
    name: 'us_piedmont',
    dmu: 'Piedmont National',
    soldTo: 'Piedmont National',
    website: 'https://piedmontnational.com',
    pattern: 'https://piedmontnational.com/product/*',
    mainCategory: 'https://piedmontnational.com/packaging-materials-supplies/tapes-adhesives/',
    subCategories: [],
    startUrls: [
      'https://piedmontnational.com/packaging-materials-supplies/tapes-adhesives/'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '52',
    name: 'us_bgr',
    dmu: 'BGR',
    soldTo: 'BGR',
    website: 'https://store.packbgr.com',
    pattern: '',
    mainCategory: 'https://store.packbgr.com/packaging/tape.asp',
    skipSubCategories: [
      'https://store.packbgr.com/tape/office-and-stationery-tape.asp'
    ],
    subCategories: [],
    startUrls: [
      'https://store.packbgr.com/packaging/tape.asp'
    ],
    info: 'do all sub categories EXCEPT the ones I listed to skip',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '53',
    name: 'us_msc',
    dmu: 'MSC',
    soldTo: 'MSC',
    website: 'https://www.mscdirect.com',
    pattern: 'https://www.mscdirect.com/product/*',
    mainCategory: 'https://www.mscdirect.com/browse/Tapes-Adhesives/Tape?navid=2108684',
    subCategories: [],
    startUrls: [
      'https://www.mscdirect.com/browse/Tapes-Adhesives/Tape?navid=2108684'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '54',
    name: 'us_motion',
    dmu: 'Motion',
    soldTo: 'Motion',
    website: 'https://www.motion.com',
    pattern: 'https://www.motion.com/products/sku/*',
    mainCategory: 'https://www.motion.com/products/Adhesives,%20Sealants%20and%20Tape/Tape',
    subCategories: [],
    startUrls: [
      'https://www.motion.com/products/Adhesives,%20Sealants%20and%20Tape/Tape'
    ],
    info: 'vpn from us needed',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '55',
    name: 'us_grainger',
    dmu: 'Grainger',
    soldTo: 'Grainger',
    website: 'https://www.grainger.com',
    pattern: '',
    mainCategory: 'https://www.grainger.com/category/adhesives-sealants-and-tape/tape',
    subCategories: [],
    startUrls: [
      'https://www.grainger.com/category/adhesives-sealants-and-tape/tape'
    ],
    info: 'many categories with complete different pattern -> how to do?',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '56',
    name: 'br_neo_brasil',
    dmu: 'NEO BRAS IND E COM D',
    soldTo: 'NEO BRAS IND E COM D',
    website: 'https://www.lojaneobrasil.com.br',
    pattern: 'https://www.lojaneobrasil.com.br/fitas-adesivas/*',
    mainCategory: 'https://www.lojaneobrasil.com.br/fitas-adesivas',
    subCategories: [],
    startUrls: [
      'https://www.lojaneobrasil.com.br/fitas-adesivas'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '57',
    name: 'br_so_fitas',
    dmu: 'SO FITAS IND, COM E',
    soldTo: 'SO FITAS IND, COM E',
    website: 'https://www.sofitas.com.br',
    pattern: 'https://www.sofitas.com.br/*',
    mainCategory: 'https://www.sofitas.com.br/vhb-automotivo',
    subCategories: [],
    startUrls: [
      'https://www.sofitas.com.br/vhb-automotivo'
    ],
    info: 'many main categories, setup?',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '58',
    name: 'br_atm',
    dmu: 'ATM REPRESENTACOES C',
    soldTo: 'ATM REPRESENTACOES C',
    website: 'https://www.atmdistribuicao.com.br',
    pattern: 'https://www.atmdistribuicao.com.br/*',
    mainCategory: 'https://www.atmdistribuicao.com.br/fitas',
    subCategories: [],
    startUrls: [
      'https://www.atmdistribuicao.com.br/fitas'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '59',
    name: 'cr_afalpi',
    dmu: 'Afalpi S.A.',
    soldTo: 'Afalpi S.A.',
    website: 'https://www.afalpi.com',
    pattern: 'https://www.afalpi.com/products/*',
    mainCategory: 'https://www.afalpi.com/categories/12553/cintas-adhesivas-industriales',
    subCategories: [],
    startUrls: [
      'https://www.afalpi.com/categories/12553/cintas-adhesivas-industriales'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '60',
    name: 'cl_santiago_hermanos',
    dmu: 'SANTIAGO HERMANOS LT',
    soldTo: 'SANTIAGO HERMANOS LT',
    website: 'https://www.tiendamicrogeo.cl',
    pattern: 'https://www.tiendamicrogeo.cl/collections/cintas-adhesivas/products/*',
    mainCategory: 'https://www.tiendamicrogeo.cl/collections/cintas-adhesivas',
    subCategories: [],
    startUrls: [
      'https://www.tiendamicrogeo.cl/collections/cintas-adhesivas'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '61',
    name: 'au_ata',
    dmu: 'A.T.A. DISTRIBUTORS PTY.LTD.',
    soldTo: 'A.T.A. DISTRIBUTORS',
    website: 'https://www.atadist.com.au',
    pattern: 'https://www.atadist.com.au/*',
    mainCategory: 'https://www.atadist.com.au/Adhesive-Tape/pl.php',
    skipSubCategories: [
      'https://www.atadist.com.au/Adhesive-Tape/Wipes/pl.php'
    ],
    subCategories: [],
    startUrls: [
      'https://www.atadist.com.au/Adhesive-Tape/pl.php'
    ],
    info: 'crawl all main categories but skip the ones I mentioned',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '62',
    name: 'au_adelaide_packaging',
    dmu: 'ADELAIDE PACKAGING SUPP. P/L',
    soldTo: 'United Office Suppli',
    website: 'https://www.adpack.com.au',
    pattern: '',
    mainCategory: 'https://www.adpack.com.au/category/104-tapes-and-adhesives',
    skipSubCategories: [
      'https://www.adpack.com.au/category/127-tape-dispensers'
    ],
    subCategories: [],
    startUrls: [
      'https://www.adpack.com.au/category/104-tapes-and-adhesives'
    ],
    info: 'crawl all main categories but skip the ones I mentioned',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '63',
    name: 'nz_attwoods',
    dmu: 'ATTWOOD PACKAGING LTD',
    soldTo: 'ATTWOOD PACKAGING LT',
    website: 'https://www.attwoods.co.nz',
    pattern: '',
    mainCategory: 'https://www.attwoods.co.nz/Product-Range/TA/FO',
    subCategories: [],
    startUrls: [
      'https://www.attwoods.co.nz/Product-Range/TA/FO'
    ],
    info: 'many main categories, setup?',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '64',
    name: 'ko_coretech',
    dmu: 'CORETECH',
    soldTo: 'CORETECH',
    website: 'https://ctshop.co.kr',
    pattern: '',
    mainCategory: 'https://ctshop.co.kr/product/list.html?cate_no=23',
    subCategories: [],
    startUrls: [
      'https://ctshop.co.kr/product/list.html?cate_no=23'
    ],
    info: 'help with pattern, korean page',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '65',
    name: 'au_ets',
    dmu: 'EMBOSSING & TAPE SUPPLIES P/L',
    soldTo: 'EMBOSSING & TAPE SUP',
    website: 'https://embossingtapesupplies.com.au',
    pattern: '',
    mainCategory: 'https://embossingtapesupplies.com.au/order-tape-online.html?product_list_limit=36',
    subCategories: [],
    startUrls: [
      'https://embossingtapesupplies.com.au/order-tape-online.html?product_list_limit=36'
    ],
    info: 'this entire shop is a nightmare in terms of getting all tapes, too many weird categories, need better solution',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '66',
    name: 'au_irs',
    dmu: 'INDUSTRIAL RUBBER SUPPLIES P/L',
    soldTo: 'INDUSTRIAL RUBBER SU',
    website: 'https://www.indrub.com.au',
    pattern: 'https://www.indrub.com.au/*',
    mainCategory: 'https://www.indrub.com.au/tapes.html',
    subCategories: [],
    startUrls: [
      'https://www.indrub.com.au/tapes.html'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '67',
    name: 'jp_logical_eye',
    dmu: 'LOGICAL EYE',
    soldTo: 'LOGICAL EYE',
    website: 'https://logicaleye-shop.com',
    pattern: '',
    mainCategory: 'https://logicaleye-shop.com/?mode=grp&gid=2487800',
    subCategories: [],
    startUrls: [
      'https://logicaleye-shop.com/?mode=grp&gid=2487800'
    ],
    info: 'need to check language',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '68',
    name: 'au_mws',
    dmu: 'MACARTHUR WRAP AND STRAP',
    soldTo: 'MACARTHUR WRAP AND S',
    website: 'https://www.macwrapstrap.com.au',
    pattern: 'https://www.macwrapstrap.com.au/product/*',
    mainCategory: 'https://www.macwrapstrap.com.au/category/tapes/',
    subCategories: [],
    startUrls: [
      'https://www.macwrapstrap.com.au/category/tapes/'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '69',
    name: 'au_total_tools',
    dmu: 'Total Tools',
    soldTo: 'Total Tools',
    website: 'https://www.totaltools.com.au',
    pattern: 'https://www.totaltools.com.au/construction-tools/glues-sealants/*',
    mainCategory: 'https://www.totaltools.com.au/construction-tools/glues-sealants/tapes?product_list_limit=48',
    subCategories: [],
    startUrls: [
      'https://www.totaltools.com.au/construction-tools/glues-sealants/tapes?product_list_limit=48'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '70',
    name: 'at_sonepar',
    dmu: 'Sonepar',
    soldTo: 'Sonepar',
    website: 'https://shop.sonepar.at',
    pattern: 'https://shop.sonepar.at/article/*',
    mainCategory: 'https://shop.sonepar.at/search?c=1235',
    subCategories: [],
    startUrls: [
      'https://shop.sonepar.at/search?c=1235'
    ],
    info: 'no prices',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '71',
    name: 'de_rexel',
    dmu: 'Rexel',
    soldTo: 'Rexel',
    website: 'https://www.rexel.de',
    pattern: 'https://www.rexel.de/Kategorien/Installation/Anschliessen-%26-Verbinden/Klebeband/*',
    mainCategory: 'https://www.rexel.de/Kategorien/Installation/Anschliessen-%26-Verbinden/Klebeband/c/EC000128',
    subCategories: [],
    startUrls: [
      'https://www.rexel.de/Kategorien/Installation/Anschliessen-%26-Verbinden/Klebeband/c/EC000128'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '72',
    name: 'uk_cromwell',
    dmu: 'Cromwell',
    soldTo: 'Cromwell',
    website: 'https://www.cromwell.co.uk',
    pattern: 'https://www.cromwell.co.uk/shop/adhesives-and-sealants/*',
    mainCategory: 'https://www.cromwell.co.uk/shop/adhesives-and-sealants/adhesive-tapes/c/0401',
    subCategories: [],
    startUrls: [
      'https://www.cromwell.co.uk/shop/adhesives-and-sealants/adhesive-tapes/c/0401'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '73',
    name: 'de_farnell',
    dmu: 'Farnell',
    soldTo: 'Farnell',
    website: 'https://de.farnell.com',
    pattern: 'https://de.farnell.com/*',
    mainCategory: 'https://de.farnell.com/c/werkzeuge-werkstattbedarf/klebebander/prl/ergebnisse',
    subCategories: [],
    startUrls: [
      'https://de.farnell.com/c/werkzeuge-werkstattbedarf/klebebander/prl/ergebnisse'
    ],
    info: 'pattern needs final check',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '74',
    name: 'uk_ferguson',
    dmu: 'Ferguson',
    soldTo: 'Ferguson',
    website: 'https://www.ferguson.com',
    pattern: 'https://www.ferguson.com/product/*',
    mainCategory: 'https://www.ferguson.com/category/adhesives-sealants/tapes/',
    subCategories: [],
    startUrls: [
      'https://www.ferguson.com/category/adhesives-sealants/tapes/'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '75',
    name: 'de_bodo_moeller',
    dmu: 'Bodo Möller Chemie',
    soldTo: 'Bodo Möller Chemie',
    website: 'https://shop.bm-chemie.com',
    pattern: 'https://shop.bm-chemie.com/de/de/*',
    mainCategory: 'https://shop.bm-chemie.com/de/de/klebstoffe/doppelseitige-klebebander.html',
    subCategories: [],
    startUrls: [
      'https://shop.bm-chemie.com/de/de/klebstoffe/doppelseitige-klebebander.html'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '76',
    name: 'de_wuerth',
    dmu: 'Würth',
    soldTo: 'Würth',
    website: 'https://eshop.wuerth.de',
    pattern: '',
    mainCategory: 'https://eshop.wuerth.de/Produktkategorien/Klebebaender/14013004.cyid/1401.cgid/de/DE/EUR/',
    skipSubCategories: [
      'https://eshop.wuerth.de/Produktkategorien/Klebe-Isolier-Dichtbaender-Zubehoer/1401300407.cyid/1401.cgid/de/DE/EUR/'
    ],
    subCategories: [],
    startUrls: [
      'https://eshop.wuerth.de/Produktkategorien/Klebebaender/14013004.cyid/1401.cgid/de/DE/EUR/'
    ],
    info: 'skip sub categories',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '77',
    name: 'us_airgas',
    dmu: 'Airgas Inc.',
    soldTo: 'Airgas Inc.',
    website: 'https://www.airgas.com',
    pattern: 'https://www.airgas.com/product/Tools-and-Hardware/MRO-%26-Plant-Maintenance/Industrial-Tape/p/*',
    mainCategory: 'https://www.airgas.com/Tools-and-Hardware/MRO-%26-Plant-Maintenance/Industrial-Tape/category/291',
    subCategories: [],
    startUrls: [
      'https://www.airgas.com/Tools-and-Hardware/MRO-%26-Plant-Maintenance/Industrial-Tape/category/291'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '78',
    name: 'be_dexis',
    dmu: 'GROUPE DESCOURS & CABAUD',
    soldTo: 'DEXIS BOUTILLON SENS',
    website: 'https://www.dexis.be',
    pattern: 'https://www.dexis.be/*',
    mainCategory: 'https://www.dexis.be/Parts-Products/Technische-producten/Lijmen-en-kleefband/Kleefband-en-folie/KLEEFBAND/',
    subCategories: [],
    startUrls: [
      'https://www.dexis.be/Parts-Products/Technische-producten/Lijmen-en-kleefband/Kleefband-en-folie/KLEEFBAND/'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '79',
    name: 'es_prolians',
    dmu: 'PROLIANS',
    soldTo: 'METALCO',
    website: 'https://prolians.es',
    pattern: 'https://prolians.es/clientes/empresa*',
    mainCategory: 'https://prolians.es/clientes/empresa/shop.php?cat=10&sub=2&sub2=50&sub3=0&sub4=0&sub5=0&grupo=1',
    subCategories: [],
    startUrls: [
      'https://prolians.es/clientes/empresa/shop.php?cat=10&sub=2&sub2=50&sub3=0&sub4=0&sub5=0&grupo=1'
    ],
    info: 'has no real product detail pages, no prices, "closed" shop',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '80',
    name: 'be_cebeo',
    dmu: 'Cebeo',
    soldTo: 'Cebeo',
    website: 'https://www.cebeo.be',
    pattern: 'https://www.cebeo.be/catalog/nl-be/products/*',
    mainCategory: 'https://www.cebeo.be/catalog/nl-be/category/tapes-14369',
    subCategories: [],
    startUrls: [
      'https://www.cebeo.be/catalog/nl-be/category/tapes-14369'
    ],
    info: 'no prices, "closed" shop',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '81',
    name: 'fr_mabeo',
    dmu: 'Mabeo Industries',
    soldTo: 'Mabeo Industries',
    website: 'https://www.mabeo-industries.com',
    pattern: 'https://www.mabeo-industries.com/*',
    mainCategory: 'https://www.mabeo-industries.com/C-150770-adhesif/I-Page1_40',
    subCategories: [],
    startUrls: [
      'https://www.mabeo-industries.com/C-150770-adhesif/I-Page1_40'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '82',
    name: 'fr_legallais',
    dmu: 'GROUPE LEGALLAIS',
    soldTo: 'LEGALLAIS',
    website: 'https://www.legallais.com',
    pattern: '',
    mainCategory: 'https://www.legallais.com/adhesifs-demballage/985',
    subCategories: [],
    startUrls: [
      'https://www.legallais.com/adhesifs-demballage/985'
    ],
    info: 'many main categories, setup?',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '83',
    name: 'us_budnick',
    dmu: 'Budnick',
    soldTo: 'Budnick',
    website: 'https://budnick.com',
    pattern: '',
    mainCategory: 'https://budnick.com/products/advanced-search?wp=6&thmin=0&thmax=781&tmin=-40&tmax=752&tsmin=0&tsmax=4400',
    subCategories: [],
    startUrls: [
      'https://budnick.com/products/advanced-search?wp=6&thmin=0&thmax=781&tmin=-40&tmax=752&tsmin=0&tsmax=4400'
    ],
    info: 'only main categories, no product detail pages, setup for pattern?',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '84',
    name: 'de_armpack',
    dmu: 'Armpack',
    soldTo: 'Armpack',
    website: 'https://www.armpack.de',
    pattern: 'https://www.armpack.de/klebebaender/*',
    mainCategory: 'https://www.armpack.de/klebebaender/',
    subCategories: [],
    startUrls: [
      'https://www.armpack.de/klebebaender/'
    ],
    info: 'German packaging supplier with tape section',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '85',
    name: 'nl_tape_jungle',
    dmu: 'Tape Jungle',
    soldTo: 'Tape Jungle',
    website: 'https://www.tapejungle.nl',
    pattern: 'https://www.tapejungle.nl/product/*',
    mainCategory: 'https://www.tapejungle.nl/tape/',
    subCategories: [],
    startUrls: [
      'https://www.tapejungle.nl/tape/'
    ],
    info: 'Dutch tape specialist',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '86',
    name: 'de_pack4food24',
    dmu: 'Pack4Food24',
    soldTo: 'Pack4Food24',
    website: 'https://www.pack4food24.de',
    pattern: 'https://www.pack4food24.de/*',
    mainCategory: 'https://www.pack4food24.de/klebebaender/',
    subCategories: [],
    startUrls: [
      'https://www.pack4food24.de/klebebaender/'
    ],
    info: 'Food packaging specialist with tape section',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '87',
    name: 'de_viking',
    dmu: 'Viking',
    soldTo: 'Viking',
    website: 'https://www.viking.de',
    pattern: 'https://www.viking.de/de/p/*',
    mainCategory: 'https://www.viking.de/de/c/klebebaender',
    subCategories: [],
    startUrls: [
      'https://www.viking.de/de/c/klebebaender'
    ],
    info: 'Office supplies with tape section',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '88',
    name: 'fr_raja',
    dmu: 'RAJA',
    soldTo: 'RAJA',
    website: 'https://www.raja.fr',
    pattern: 'https://www.raja.fr/*',
    mainCategory: 'https://www.raja.fr/emballage/adhesifs-et-rubans',
    subCategories: [],
    startUrls: [
      'https://www.raja.fr/emballage/adhesifs-et-rubans'
    ],
    info: 'French packaging specialist',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '89',
    name: 'uk_raja',
    dmu: 'RAJA UK',
    soldTo: 'RAJA UK',
    website: 'https://www.raja.co.uk',
    pattern: 'https://www.raja.co.uk/*',
    mainCategory: 'https://www.raja.co.uk/packaging/tapes-adhesives',
    subCategories: [],
    startUrls: [
      'https://www.raja.co.uk/packaging/tapes-adhesives'
    ],
    info: 'UK branch of RAJA packaging',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '90',
    name: 'es_raja',
    dmu: 'RAJA España',
    soldTo: 'RAJA España',
    website: 'https://www.raja.es',
    pattern: 'https://www.raja.es/*',
    mainCategory: 'https://www.raja.es/embalaje/cintas-adhesivas',
    subCategories: [],
    startUrls: [
      'https://www.raja.es/embalaje/cintas-adhesivas'
    ],
    info: 'Spanish branch of RAJA packaging',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '91',
    name: 'it_raja',
    dmu: 'RAJA Italia',
    soldTo: 'RAJA Italia',
    website: 'https://www.raja.it',
    pattern: 'https://www.raja.it/*',
    mainCategory: 'https://www.raja.it/imballaggio/nastri-adesivi',
    subCategories: [],
    startUrls: [
      'https://www.raja.it/imballaggio/nastri-adesivi'
    ],
    info: 'Italian branch of RAJA packaging',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '92',
    name: 'de_ratioform',
    dmu: 'ratioform',
    soldTo: 'ratioform',
    website: 'https://www.ratioform.de',
    pattern: 'https://www.ratioform.de/shop/*',
    mainCategory: 'https://www.ratioform.de/shop/klebebaender/',
    subCategories: [],
    startUrls: [
      'https://www.ratioform.de/shop/klebebaender/'
    ],
    info: 'German packaging specialist',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '93',
    name: 'nl_ratioform',
    dmu: 'ratioform Nederland',
    soldTo: 'ratioform Nederland',
    website: 'https://www.ratioform.nl',
    pattern: 'https://www.ratioform.nl/shop/*',
    mainCategory: 'https://www.ratioform.nl/shop/tape/',
    subCategories: [],
    startUrls: [
      'https://www.ratioform.nl/shop/tape/'
    ],
    info: 'Dutch branch of ratioform',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '94',
    name: 'be_ratioform',
    dmu: 'ratioform België',
    soldTo: 'ratioform België',
    website: 'https://www.ratioform.be',
    pattern: 'https://www.ratioform.be/shop/*',
    mainCategory: 'https://www.ratioform.be/shop/tape/',
    subCategories: [],
    startUrls: [
      'https://www.ratioform.be/shop/tape/'
    ],
    info: 'Belgian branch of ratioform',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '95',
    name: 'us_packaging_corporation',
    dmu: 'Packaging Corporation',
    soldTo: 'Packaging Corporation',
    website: 'https://www.packagingcorp.com',
    pattern: 'https://www.packagingcorp.com/product/*',
    mainCategory: 'https://www.packagingcorp.com/packaging-tape/',
    subCategories: [],
    startUrls: [
      'https://www.packagingcorp.com/packaging-tape/'
    ],
    info: 'US packaging supplier',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '96',
    name: 'ca_uline',
    dmu: 'Uline Canada',
    soldTo: 'Uline Canada',
    website: 'https://www.uline.ca',
    pattern: 'https://www.uline.ca/Product/Detail/*',
    mainCategory: 'https://www.uline.ca/Grp_90/Tape',
    subCategories: [],
    startUrls: [
      'https://www.uline.ca/Grp_90/Tape'
    ],
    info: 'Canadian branch of Uline',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '97',
    name: 'mx_uline',
    dmu: 'Uline Mexico',
    soldTo: 'Uline Mexico',
    website: 'https://www.uline.mx',
    pattern: 'https://www.uline.mx/Product/Detail/*',
    mainCategory: 'https://www.uline.mx/Grp_90/Cinta-Adhesiva',
    subCategories: [],
    startUrls: [
      'https://www.uline.mx/Grp_90/Cinta-Adhesiva'
    ],
    info: 'Mexican branch of Uline',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '98',
    name: 'marketplace_digikey',
    dmu: 'DigiKey',
    soldTo: 'DigiKey',
    website: 'https://www.digikey.com',
    pattern: '',
    mainCategory: 'https://www.digikey.com/en/products/filter/tape/908?s=N4IgTCBcDaIMwFsAEA3AFgIxAXQL5A',
    subCategories: [],
    startUrls: [
      'https://www.digikey.com/en/products/filter/tape/908?s=N4IgTCBcDaIMwFsAEA3AFgIxAXQL5A'
    ],
    info: 'will probably require residential proxies',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '99',
    name: 'marketplace_mercado_livre',
    dmu: 'Mercado Livre',
    soldTo: 'Mercado Livre',
    website: 'https://lista.mercadolivre.com.br',
    pattern: '',
    mainCategory: 'https://lista.mercadolivre.com.br/arte-papelaria-armarinho/materiais-escolares/comercial-organizacao/adesivos-corte/fitas-adesivas/',
    subCategories: [],
    startUrls: [
      'https://lista.mercadolivre.com.br/arte-papelaria-armarinho/materiais-escolares/comercial-organizacao/adesivos-corte/fitas-adesivas/'
    ],
    info: 'need assistance here, you get blocked every x-pages (error 429), seems they have over +30k tape listings???',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '100',
    name: 'br_mipe',
    dmu: 'MIPE Supply',
    soldTo: 'MIPE Supply',
    website: 'https://mipesupply.com.br',
    pattern: 'https://mipesupply.com.br/loja/*',
    mainCategory: 'https://mipesupply.com.br/categoria-produto/linhas-de-produtos/fitas-e-adesivos/',
    subCategories: [],
    startUrls: [
      'https://mipesupply.com.br/categoria-produto/linhas-de-produtos/fitas-e-adesivos/'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '101',
    name: 'co_sumatec',
    dmu: 'Sumatec',
    soldTo: 'Sumatec',
    website: 'https://www.sumatec.co',
    pattern: 'https://www.sumatec.co/*',
    mainCategory: 'https://www.sumatec.co/productos/ferreteria-y-accesorios-mro/cintas',
    subCategories: [],
    startUrls: [
      'https://www.sumatec.co/productos/ferreteria-y-accesorios-mro/cintas'
    ],
    info: 'needs proxy',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '102',
    name: 'br_anhanguera_ferramentas',
    dmu: 'Anhanguera Ferramentas',
    soldTo: 'Anhanguera Ferramentas',
    website: 'https://www.anhangueraferramentas.com.br',
    pattern: 'https://www.anhangueraferramentas.com.br/*',
    mainCategory: 'https://www.anhangueraferramentas.com.br/colas-adesivos-e-lubrificantes/fita-adesiva',
    subCategories: [],
    startUrls: [
      'https://www.anhangueraferramentas.com.br/colas-adesivos-e-lubrificantes/fita-adesiva'
    ],
    info: 'many main categories, setup?',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '103',
    name: 'br_dimensional',
    dmu: 'Dimensional',
    soldTo: 'Dimensional',
    website: 'https://www.dimensional.com.br',
    pattern: 'https://www.dimensional.com.br/*',
    mainCategory: 'https://www.dimensional.com.br/material-eletrico/fita',
    subCategories: [],
    startUrls: [
      'https://www.dimensional.com.br/material-eletrico/fita'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '104',
    name: 'sa_bmg',
    dmu: 'Bearing Man Group',
    soldTo: 'Bearing Man Group',
    website: 'https://bmgworld.net',
    pattern: 'https://bmgworld.net/bmg/en/ZAR/All-Categories/Adhesives/Tape/*',
    mainCategory: 'https://bmgworld.net/bmg/en/ZAR/All-Categories/Adhesives/Tape/c/E20618',
    subCategories: [],
    startUrls: [
      'https://bmgworld.net/bmg/en/ZAR/All-Categories/Adhesives/Tape/c/E20618'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '105',
    name: 'sa_fowkes_bros',
    dmu: 'Fowkes Bros',
    soldTo: 'Fowkes Bros',
    website: 'https://www.fowkes.co.za',
    pattern: 'https://www.fowkes.co.za/product/*',
    mainCategory: 'https://www.fowkes.co.za/catalogue/adhesive-tapes',
    subCategories: [],
    startUrls: [
      'https://www.fowkes.co.za/catalogue/adhesive-tapes'
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '106',
    name: 'ro_proxima',
    dmu: 'Proxima',
    soldTo: 'Proxima',
    website: 'http://proximatapes.ro',
    pattern: 'http://proximatapes.ro/*',
    mainCategory: 'http://proximatapes.ro/fixare/benzi-dublu-adezive-lipire-permanenta.html',
    subCategories: [],
    startUrls: [
      'http://proximatapes.ro/fixare/benzi-dublu-adezive-lipire-permanenta.html'
    ],
    info: 'many main categories, setup?',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '107',
    name: 'au_armpack',
    dmu: 'Armpack',
    soldTo: 'Armpack',
    website: 'https://armpack.com.au',
    pattern: 'https://armpack.com.au/product/*',
    mainCategory: 'https://armpack.com.au/product-category/tapes-and-adhesives/',
    subCategories: [],
    startUrls: [
      'https://armpack.com.au/product-category/tapes-and-adhesives/'
    ],
    info: 'no prices',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '108',
    name: 'vn_creative',
    dmu: 'Creative',
    soldTo: 'CREATIVE ENGINEERING',
    website: 'https://www.ce.com.vn/vi/product-tag/tesa/',
    pattern: 'https://www.ce.com.vn/vi/products/*',
    mainCategory: 'https://www.ce.com.vn/vi/product-tag/bang-keo-cong-nghiep/',
    subCategories: [],
    startUrls: [
      'https://www.ce.com.vn/vi/product-tag/bang-keo-cong-nghiep/'
    ],
    info: 'no prices, need to check language',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '109',
    name: 'au_emjay',
    dmu: 'EMJAY PRODUCTS PTY LTD',
    soldTo: 'EMJAY PRODUCTS PTY L',
    website: 'https://www.emjayproducts.com.au',
    pattern: '',
    mainCategory: 'https://www.emjayproducts.com.au/product-category/eco-friendly-products/packaging-tape-eco-friendly-products/',
    subCategories: [],
    startUrls: [
      'https://www.emjayproducts.com.au/product-category/eco-friendly-products/packaging-tape-eco-friendly-products/'
    ],
    info: 'many main categories, setup?',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '110',
    name: 'br_celmar',
    dmu: 'Celmar',
    soldTo: 'Celmar',
    website: 'https://celmar.com.br',
    pattern: 'https://celmar.com.br/produtos/mro/*',
    mainCategory: 'https://celmar.com.br/produtos/?swoof=1&woof_text=fita',
    subCategories: [],
    startUrls: [
      'https://celmar.com.br/produtos/?swoof=1&woof_text=fita'
    ],
    info: 'products only available through search query in url, will have some wrong products',
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '111',
    name: 'au_armstrong_packaging',
    dmu: 'ARMSTRONG PACKAGING',
    soldTo: 'ARMSTRONG PACKAGING',
    website: 'http://www.armpack.com.au',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [''],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '112',
    name: 'it_corazza_carlo',
    dmu: 'CORAZZA CARLO',
    soldTo: 'CORAZZA CARLO S.R.L.',
    website: 'https://shop.corazzacarlo.com',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [''],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '113',
    name: 'pl_eko_tech',
    dmu: 'EKO-TECH',
    soldTo: 'EKO-TECH SPÃ"ÅKA Z O.',
    website: 'https://www.eko-tech.biz',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [''],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '114',
    name: 'de_friedrich_schwertfeger',
    dmu: 'Friedrich Schwertfeger',
    soldTo: 'Friedrich Schwertfeg',
    website: 'https://www.klebfix.eu',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [''],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '115',
    name: 'de_k_k_klebetechnik',
    dmu: 'K + K Klebetechnik',
    soldTo: 'K + K Klebetechnik G',
    website: 'https://www.kk-klebetechnik.de',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [''],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '116',
    name: 'sk_kbm',
    dmu: 'KBM',
    soldTo: 'KBM, s.r.o.',
    website: 'https://eshop.kbm.sk',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [''],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '117',
    name: 'de_logotape',
    dmu: 'Logotape',
    soldTo: 'Scharnau City Shop G',
    website: 'https://scharnau-berlin.de',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [''],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '118',
    name: 'sk_pebal',
    dmu: 'PEBAL',
    soldTo: 'PEBAL s.r.o.',
    website: 'https://epackshop.myshopify.com/',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [''],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '119',
    name: 'se_svensk_industri',
    dmu: 'SVENSK INDUSTRI KONVERTERING AB',
    soldTo: 'SVENSK INDUSTRI KONV',
    website: 'https://shop.sikab.se',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [''],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '120',
    name: 'au_vision_pack',
    dmu: 'VISION PACK',
    soldTo: 'VISION PACK PTY LTD',
    website: 'https://visionpack.com.au',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [''],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '121',
    name: 'au_blackwoods',
    dmu: 'Blackwoods',
    soldTo: 'Blackwoods',
    website: 'https://www.blackwoods.com.au',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [''],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '122',
    name: 'de_transpack_krumbach',
    dmu: 'Transpack Krümbach',
    soldTo: 'Transpack Krümbach',
    website: 'https://www.transpack-krumbach.de',
    pattern: '',
    mainCategory: '',
    subCategories: [],
    startUrls: [''],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '123',
    name: 'us_krayden',
    dmu: 'Krayden',
    soldTo: 'Krayden',
    website: 'https://krayden.com',
    pattern: 'https://krayden.com/categories/tapes/*',
    mainCategory: 'https://krayden.com/categories/tapes',
    subCategories: [],
    startUrls: ['https://krayden.com/categories/tapes'],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '124',
    name: 'uk_swst',
    dmu: 'SWST',
    soldTo: 'SWST',
    website: 'https://swst.co.uk',
    pattern: 'https://swst.co.uk/shop/*',
    mainCategory: 'https://swst.co.uk/shop/',
    subCategories: [],
    startUrls: ['https://swst.co.uk/shop/'],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '125',
    name: 'de_wuerth_eshop',
    dmu: 'Würth eShop',
    soldTo: 'Würth eShop',
    website: 'https://eshop.wuerth.de',
    pattern: '',
    mainCategory: 'https://eshop.wuerth.de/de/DE/EUR/',
    subCategories: [],
    startUrls: ['https://eshop.wuerth.de/de/DE/EUR/'],
    maxDepth: 0,
    maxVisits: 10,
  },
  {
    ranking: '126',
    name: 'de_hahn_kolb',
    dmu: 'Würth',
    soldTo: 'HAHN + KOLB Werkzeug',
    pattern: 'https://www.hahn-kolb.de/*',
    startUrls: [
      // Main category
      'https://www.hahn-kolb.de/All-categories/Adhesive-tapes-insulating-tapes/1521AC04_1907362.cyid/1521.cgid/en/US/EUR/',
    ],
    maxDepth: 0,
    maxVisits: 10,
  },
];

const workingShops = SCRAPING_TARGETS
  .filter((shop) => shop.working)
  .map(shop => shop.name);

const sleep = (msec) => new Promise(ok => setTimeout(ok, msec));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get selected option from configuration object
function getSelectedOption(options) {
  const selected = Object.entries(options).find(([key, value]) => value === 'x');
  const val = selected ? selected[0] : Object.keys(options)[0]; // fallback to first option
  if (val.includes(',')) {
    return val.split(',');
  } else {
    return val;
  }
}

// ============================================================================
// MAIN PROCESSING FUNCTION - SDK-based implementation
// ============================================================================

async function run_case(targetData) {
  const { name, customer, pattern, startUrls, ...rest } = targetData;

  const template = {
    isTape: 'boolean, true or false, is this current page about a roll of tape. give true for rolls of tape, give false for tape dispensers, tape accessories, otoher products that are not rolls of tape',

    // Basic info
    productName: 'Product name. For this and all other fields, give answers in ENGLISH, translate if necessary',
    brand: 'Brand of the product, eg. tesa, 3m, etc.',
    domain: 'The domain (host) of this website, based on the URL. Format must be https://www.example.com',
    country: 'The two letter country code of this website, based on the URL, lower case',

    // Product ID codes
    tesaBnr: 'If the product is a Tesa brand tape, give the BNR number. It is a 4 or 5 digit product code, usually in the name of the product, eg. TESA 4120 means BNR is 4120, TESA 55667 means BNR is 55667, etc. If not a Tesa product, leave this null',
    sku: 'Product SKU',
    ean: 'this is a standard product number field used worldwide. most shops have this. some (especially in the U.S.) are using UPC instead of EAN, therefore we should put the UPC also in this field. ofc we should always have 1 number only, EAN prefered.',

    // Category fields
    categoryUrl: 'Category page that contains this product. Give the MOST SPECIFIC category available.',
    subCategoryUrls: 'List of ALL category URLs for this product, as an array',

    // Language fields
    // First in original language...
    categoryOriginalLanguage: 'Name of that most specific category page for this product, in the original language, word-for-word copy.',
    subCategoryOriginalLanguage: 'Name of ALL category bread crumbs for this product, as an array, in the original language, word-for-word copy.',
    descriptionOriginalLanguage: 'text from a description field that describes the product, in the original language, word-for-word copy',
    colorOriginalLanguage: 'Color of the product, in the original language, word-for-word copy',
    materialOriginalLanguage: 'could be anything, paper, pvc etc. its the material of the adhesive tape, in the original language, word-for-word copy',
    typeOriginalLanguage: 'Type of adhesive: e.g. acrylic or rubber, in the original language, word-for-word copy',
    backingOriginalLanguage: 'the backing of the adhesive tape, e.g. acrylic foam, in the original language, word-for-word copy',

    // ...then in English
    categoryEnglish: 'Name of that most specific category page for this product, in English, translate if necessary.',
    subCategoryEnglish: 'Name of ALL category bread crumbs for this product, as an array. In English, translate if necessary,',
    descriptionEnglish: 'text from a description field that describes the product, in English, translate if necessary',
    colorEnglish: 'Color of the product, in English, translate if necessary',
    materialEnglish: 'could be anything, paper, pvc etc. its the material of the adhesive tape, in English, translate if necessary',
    typeEnglish: 'Type of adhesive: e.g. acrylic or rubber, in English, translate if necessary',
    backingEnglish: 'the backing of the adhesive tape, e.g. acrylic foam, in English, translate if necessary',

    // Technical details
    temperature: 'Sometimes we have one, something two values. one value is often -x °C and the other is x°C (range from minus to plus), e.g. -54 °C - 149 °C. Format: array of "value" and "unit".',

    // Width
    widthOriginal: 'Width of the product, if available, in the original units, as a dictionary. Dictionary fields for all dimensions must be "value", and "unit", value is a number and unit is a measurement unit. For this field and any other dimension fields, if there are multiple products, pick the first one or main one. All dimensions must be for the same product. If not available, give null for both fields.',
    widthConverted: 'Width of the product, if available, with unit as "millimeters". Typically listed in format (width) x (length) Include "value" and "unit" fields. If not available, give null for both fields.',

    // Length
    lengthOriginal: 'Length of the product, in the unit listed on the site. Include "value" and "unit" fields. If not available, give null for both fields.',
    lengthConverted: 'Length of the product converted to unit="meters". Include "value" and "unit" fields. If not available, give null for both fields.',

    // Weight
    weightOriginal: 'Width of the product, in the unit listed on the site. Include "value" and "unit" fields. If not available, give null for both fields.',
    weightConverted: 'Width of the product as unit="grams". Include "value" and "unit" fields. If not available, give null for both fields.',

    // Thickness
    thicknessOriginal: 'Thickness  the product, in the unit listed on the site. Include "value" and "unit" fields. If not available, give null for both fields.',
    thicknessConverted: 'Thickness of the product in unit="millimeters". Include "value" and "unit" fields. If not available, give null for both fields.',

    // Pricing
    rawWithVatProductPrice: `The full raw price of the product. Give full raw price from the site, including shipping and VAT. If multiple prices are listed, give the lowest per unit price. Do not transform it in anyway. Give four fields:

- "value", which is a decimal number in format X.XX
- "currency", which is a three letter currency code
- "unit", which is the unit being sold. Give one of "meters" or "millimeters" if it is a measurement, or just "unit" if it is sold as a single unit in the dimensions desecribed above. Always english, always give one of these units.
- "amount", which is the amount of that unit. if "unit" is "meters" or "millimeters", then give how many of that you are getting. If unit is "unit", then how many tape products are we getting?

`,
    euroProductPrice: `Convert the raw product price price to euros, giving a dictionary with four fields: "value" which is a decimal number X.XX, and "currency" which is EUR, and "unit" and "amount" as before. Use these conversions:

Country,Currency Code,1 EUR Equals,Source,Date
United Kingdom,GBP,0.8649,European Central Bank,2025-07-31
Switzerland,CHF,0.9297,European Central Bank,2025-07-31
Sweden,SEK,11.1575,European Central Bank,2025-07-31
Poland,PLN,4.2728,European Central Bank,2025-07-31
China,CNY,8.2350,European Central Bank,2025-07-31
United States,USD,1.1651,European Central Bank,2025-08-20
Japan,JPY,172.67,European Central Bank,2025-08-19
Canada,CAD,1.6167,X-Rates,2025-08-20
Australia,AUD,1.8116,X-Rates,2025-08-20
`
  };

  console.log(`\n=== Processing ${name} (${customer}) ===`);

  // Get selected configuration options
  const selectedProxy = getSelectedOption(PROXY_OPTIONS);
  const selectedTransform = getSelectedOption(TRANSFORM_OPTIONS);
  const selectedExtractMode = getSelectedOption(EXTRACT_MODES);

  // SDK Configuration object (SDK handles pagination templates natively)
  console.log('Rest:', rest);
  const crawlConfig = {
    pattern,
    startUrls: startUrls,
    maxVisits: MAX_VISITS,
    maxDepth: MAX_DEPTH,
    proxy: selectedProxy,
    crawlPriority: 'random',
    ...rest,
  };
  console.log('crawlConfig', crawlConfig);

  // Add transform if not 'none'
  if (!crawlConfig.contentTransform && selectedTransform !== 'none') {
    crawlConfig.contentTransform = [selectedTransform];
  }

  try {
    // Step 1: Crawl to get URLs using SDK

    let urls;
    let crawlResult;

    // Try to get URLs from the API
    const data = USE_SAVED_URLS ? await fox.urls.list({ pattern: crawlConfig.pattern }) : {};

    if (false) {
      urls = [
        'https://seyffer.shop/de/3m-4411-hochleistungs-dichtband-4411-w50-50-mm-x-33-m-1-mm-weiss-universelle-haftung-fuer-saubere-abdichtungen.html',
        'https://seyffer.shop/de/3m-5425-25-mm-x-33-m-0-11-mm-transparent-uhmw-polyethylen-gleitklebeband.html',
        'https://seyffer.shop/de/3m-431-38-mm-x-50-m-0-09-mm-silber-aluminiumklebeband.html',
        'https://seyffer.shop/de/3m-4410-hochleistungs-dichtband-4410-g76-76-mm-x-33-m-0-6-mm-grau-universelle-haftung-fuer-saubere-abdichtungen.html',

        // 'https://www.shop-sks.com/3M-361-Glasgewebeband-Weiss-25-4-mm-x-55m-0-17-mm',
        // 'https://www.shop-sks.com/3M-389-Gewebeband-50-mm-x-50-m-gelb',
        // 'https://www.shop-sks.com/3M-5421-UHMW-Polyethylen-Gleitklebeband-19mmx16-5m-0-17mm-Gummi-Harz',
        // 'https://www.shop-sks.com/3M-5423-UHMW-Polyethylen-Gleitklebeband-19mmx16-5m-0-28mm-Gummi-Harz',

        // 'https://www.shop-sks.com/3M-5421-UHMW-Polyethylen-Gleitklebeband-19mmx16-5m-0-17mm-Gummi-Harz',

        // 'https://seyffer.shop/de/3m-4410-hochleistungs-dichtband-4410-g76-76-mm-x-33-m-0-6-mm-grau-universelle-haftung-fuer-saubere-abdichtungen.html',

        // 'https://www.uline.com/Product/Detail/H-167/Desktop-Tape-Dispensers/Uline-Standard-Bag-Taper-3-8-Capacity',
        // 'https://www.uline.com/Product/Detail/H-2650/Desk-Accessories/2-Roll-Tape-Starter-Pack-2-x-55-yds',
        // 'https://www.uline.com/Product/Detail/H-726/Tape-Dispensers-Hand-Held/Uline-Supermask-Tape-Dispenser',
        // 'https://www.uline.com/Product/Detail/S-10153/3M-Carton-Sealing-Tape/3M-373-Hot-Melt-Machine-Length-Tape-2-x-1000-yds-Clear',
        // 'https://www.uline.com/Product/Detail/S-10154/3M-Carton-Sealing-Tape/3M-373-Hot-Melt-Machine-Length-Tape-3-x-1000-yds-Clear',
        // 'https://www.uline.com/Product/Detail/S-10173/3M-Carton-Sealing-Tape/3M-142-Shipping-Tape-with-Dispenser-Clear-2-x-222-yds',
        // 'https://www.uline.com/Product/Detail/S-10174/3M-Carton-Sealing-Tape/3M-355-Hot-Melt-Machine-Length-Tape-2-x-1000-yds-Clear',
        // 'https://www.uline.com/Product/Detail/S-10310/3M-Foil-Tape/3M-425-Aluminum-Foil-Tape-1-x-60-yds',
        // 'https://www.uline.com/Product/Detail/S-10311/3M-Foil-Tape/3M-425-Aluminum-Foil-Tape-2-x-60-yds',
        // 'https://www.uline.com/Product/Detail/S-10524/Double-Sided-Tape/Double-Sided-Film-Tape-3-4-x-60-yds',

        // 'https://www.hoffmann-group.com/DE/de/hom/p/083601-48X50',

        // 'https://www.hoffmann-verpackung.de/nachhaltige-verpackung/klebebaender-zubehoer/pet-recycling-klebeband-03-pet5001?c=40',
        // 'https://www.hoffmann-verpackung.de/klebeband-umreifung/klebeband-mit-druck/kraftpapier-klebeband-mit-1-farb.-druck-kp-1b?c=43',
        // 'https://www.hoffmann-verpackung.de/klebeband-umreifung/klebeband-mit-druck/kraftpapier-klebeband-mit-1-farb.-druck-kp-1w?c=43',
        // 'https://www.hoffmann-verpackung.de/klebeband-umreifung/klebeband-mit-druck/kraftpapier-klebeband-mit-2-farb.-druck-kp-2b?c=43',
      ];
    } else if (USE_SAVED_URLS && data?.results?.length > 2) {
      console.log('Not running crawl, using saved URLs');
      urls = data.results;
    } else {
      console.log(`Run crawl with proxy: ${crawlConfig.proxy}, transform: ${selectedTransform}`);
      const crawlJob = await crawl.detach(crawlConfig);
      console.log('Crawl progress:', crawlJob.appUrl);
      crawlResult = await crawlJob.finished();
      // const crawlResult = await crawl(crawlConfig);

      urls = (crawlResult.results && crawlResult.results.hits) || [];
    }
    
    console.log('Found URLs:', urls.length);
    console.log('First few URLs:', urls.slice(0, 10));

    // Step 2: Extract from limited URLs (cost control) using SDK
    const limitedUrls = urls.slice(0, MAX_EXTRACTS);
    
    const extractConfig = {
      urls: limitedUrls,
      template,
      proxy: selectedProxy,
      extractMode: selectedExtractMode,
      ...rest,
    };

    // Add transform if not 'none'
    if (!extractConfig.contentTransform && selectedTransform !== 'none') {
      extractConfig.contentTransform = selectedTransform;
    }

    console.log(`Run extract with ${limitedUrls.length} URLs, mode: ${selectedExtractMode}`);
    console.log('extractConfig:', extractConfig);

    const extractJob = await extract.detach(extractConfig);
    console.log('Extract progress:', extractJob.appUrl);
    const extractResult = await extractJob.finished();
    // const extractResult = await extract(extractConfig);

    const items = (extractResult.results && extractResult.results.items) || [];

    console.log('Items extracted:', items.length);

    for (const item of items) {
      for (const key of COPY_KEYS) {
        item[key] = targetData[key];
      }

      const euros = item.euroProductPrice?.value;
      const width = item.widthConverted?.value / 1000;
      let length;
      if (item.euroProductPrice?.unit == 'unit') {
        length = item.euroProductPrice?.amount * item.lengthConverted?.value;
      } else {
        length = item.euroProductPrice?.amount;
      }
      let eurPerSqm;
      try {
        // eurPerSqm = (length * width / 1000) / euros;
        // eurPerSqm = (length * width / 1000) / euros;
        // eurPerSqm = (eurPerSqm / 1.0).toFixed(4);
        eurPerSqm =  euros / (length * width);
      } catch (e) {
        eurPerSqm = 'n/a';
      }
      if (isNaN(eurPerSqm)) {
        eurPerSqm = 'n/a';
      }

      item.eurPerSqm = eurPerSqm;
    }
    

    console.log('First few items:');
    items.slice(0, 3).forEach(it => console.log(JSON.stringify(it, null, 2)));

    // Step 3: Calculate costs and metrics (in-memory analysis)
    const crawlCost = crawlResult?.metrics?.cost?.total || 0;
    const extractCost = extractResult.metrics?.cost?.total || 0;
    const totalCost = crawlCost + extractCost;
    const costPer1k = items.length > 0 ? (totalCost / items.length) * 1000 : 0;

    const result = {
      name,
      customer,
      count: urls.length,
      items: items,
      cost: totalCost,
      costPer1k: costPer1k,
      crawlMetrics: crawlResult?.metrics || {},
      extractMetrics: extractResult.metrics,
    };

    // Step 4: Save to JSONL file (persistent storage)
    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const outputPath = path.join(resultsDir, `results_${name}.jsonl`);
    const str = items.map(it => JSON.stringify(it)).join('\n');
    fs.writeFileSync(outputPath, str, 'utf-8');

    console.log(`\n=== Results for ${name} ===`);
    console.log(`Customer: ${customer}`);
    console.log(`URLs found: ${urls.length}`);
    console.log(`Items extracted: ${items.length}`);
    console.log(`Total cost: $${totalCost.toFixed(4)} (crawl: $${crawlCost.toFixed(4)}, extract: $${extractCost.toFixed(4)})`);
    console.log(`Cost per 1k items: $${costPer1k.toFixed(2)}`);
    console.log(`Output saved to: ${outputPath}`);

    return { result, name, outputPath };

  } catch (error) {
    console.error(`Error processing ${name}:`, error.message);
    throw error;
  }
}

async function run() {
  const results = [];
  
  for (const targetData of SCRAPING_TARGETS) {
    try {
      const result = await run_case(targetData);
      results.push(result);
    } catch (error) {
      console.error(`Error processing ${targetData.name}:`, error.message);
      results.push({
        name: targetData.name,
        customer: targetData.customer,
        error: error.message,
        count: 0,
        items: [],
        cost: 0,
        costPer1k: 0,
      });
    }
  }

  // Final summary with cost analysis
  console.log(`\n=== FINAL SUMMARY ===`);
  console.log('Configuration:');
  console.log(`- Proxy: ${getSelectedOption(PROXY_OPTIONS)}`);
  console.log(`- Transform: ${getSelectedOption(TRANSFORM_OPTIONS)}`);
  console.log(`- Extract Mode: ${getSelectedOption(EXTRACT_MODES)}`);
  console.log(`- Max Visits: ${MAX_VISITS}`);
  console.log(`- Max Extracts: ${MAX_EXTRACTS}`);

  console.log('\nResults:');
  console.log('Shop\t\t\tSoldTo\t\tItems\tCost\t\tCost/1k');
  console.log('-'.repeat(90));
  
  let totalItems = 0;
  let totalCosts = 0;

  for (const result of results) {
    if (result.error) {
      console.log(`${result.name.padEnd(15)}\t${result.soldTo.padEnd(15)}\tERROR: ${result.error}`);
    } else {
      console.log(`${result.name.padEnd(15)}\t${result.soldTo.padEnd(15)}\t${result.items.length}\t$${result.cost.toFixed(4)}\t\t$${result.costPer1k.toFixed(2)}`);
      totalItems += result.items.length;
      totalCosts += result.cost;
    }
  }

  if (totalItems > 0) {
    console.log('-'.repeat(90));
    console.log(`TOTALS\t\t\t\t\t\t${totalItems}\t$${totalCosts.toFixed(4)}\t\t$${((totalCosts/totalItems)*1000).toFixed(2)}`);
  }

  return results;
}

// Function to scrape a specific target
async function scrapeTarget(targetName = 'de_sks') {
  // API key is already configured from environment variable
  
  const selectedTarget = SCRAPING_TARGETS.find(t => t.name === targetName);
  if (!selectedTarget) {
    console.error(`Target ${targetName} not found. Available targets: ${SCRAPING_TARGETS.map(t => t.name).join(', ')}`);
    return;
  }
  
  console.log(`\n=== Scraping ${targetName} ===`);
  return await run_case(selectedTarget);
}

// Export for usage (ES modules style)
export { run, scrapeTarget, run_case, SCRAPING_TARGETS };

// If run directly, use environment variable API key
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetName = process.argv[2];
  
  if (targetName == 'working') {
    console.log('Running on shops with working=true', workingShops);
    await sleep(2000);

    const jobs = workingShops.map(it => scrapeTarget(it));
    const results = await Promise.all(jobs);

    console.log(`Finished scraping all working shops ${workingShops.join(',')}`);
    for (const { outputPath, name, result } of results) {
      console.log(`- ${name}\t${outputPath}`);

      for (const item of result.items.slice(0, 10)) {
        console.log(`\t${item.eurPerSqm} EUR / mm²`.padEnd(20) + item._url);
      }
    }

  } else if (targetName) {
    console.log(`Scraping target: ${targetName}`);
    await scrapeTarget(targetName);

  } else {
    console.log('Scraping all targets...');
    await run()
  }

  process.exit(0);
} 
