import { configure, crawl, extract } from 'fetchfox-sdk';
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
configure({ apiKey: api_key });

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
  'residential_cdp': '',        // Residential IPs
  'residential_cdp_assets': '',  // Most expensive, loads assets
};

// TRANSFORM METHODS - For reducing AI context and cost
// Mark with 'x' to select which transform method to use
const TRANSFORM_OPTIONS = {
  'reduce': '',        // Reduces content intelligently (similar to SDK default)
  'text_only': '',      // Extracts only text content
  'slim_html': '',      // Removes unnecessary HTML
  'reduce,slim_html': '',      // Reduce + remove unnecessary HTML
  'reduce,text_only': 'x',      // Reduce + text only
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
const MAX_VISITS = 50;        // Maximum pages to visit during crawl
const MAX_EXTRACTS = 100;      // Limit URLs for extraction (cost control)

// ============================================================================
// SCRAPING TARGETS - Enhanced with pagination templates and customer info
// ============================================================================

const SCRAPING_TARGETS = [
  {
    name: 'de_sks',
    customer: 'SKS',
    pattern: 'https://www.shop-sks.com/:*',
    startUrls: [
      'https://www.shop-sks.com/3M/Kleben-und-Verbinden/Einseitige-Klebebaender/?p={{0..20}}',
      'https://www.shop-sks.com/3M/Kleben-und-Verbinden/Doppelseitige-Klebebaender/?p={{0..20}}',
      'https://www.shop-sks.com/tesa/Einseitige-Klebebaender/?p={{0..20}}',
      'https://www.shop-sks.com/tesa/Doppelseitige-Klebebaender/?p={{0..20}}',
      'https://www.shop-sks.com/tesa/Klischeebaender/?p={{0..10}}',
      'https://www.shop-sks.com/tesa/Lasergravurfolie/?p={{0..10}}',
    ],
  },
  {
    name: 'pl_semicon',
    customer: 'Semicon',
    pattern: 'https://sklep.semicon.com.pl/shop2/,*',
    startUrls: [
      'https://sklep.semicon.com.pl/shop2/,c1481,page-{{1..10}}',
    ],
  },
  {
    name: 'de_seyffer',
    customer: 'Seyffer',
    pattern: 'https://seyffer.shop/de/*.html',
    startUrls: [
      'https://seyffer.shop/de/kleben/einseitige-klebebaender/?view_mode=tiled&listing_sort=&listing_count=72&page={{0..30}}',
      'https://seyffer.shop/de/kleben/doppelseitige-klebebaender/?view_mode=tiled&listing_sort=&listing_count=72&page={{0..30}}',
    ],
  },
  {
    name: 'ch_ibz',
    customer: 'IBZ',
    pattern: 'https://www.ibzag.ch/*~p*',
    startUrls: [
      'https://www.ibzag.ch/de/shop/einseitig-klebende-klebebaender~c1217?page={{1..15}}',
      'https://www.ibzag.ch/de/shop/doppelseitig-klebende-klebebaender~c1298?page={{1..15}}',
      'https://www.ibzag.ch/de/shop/warnbaender-kennzeichung~c677347?page={{1..10}}',
      'https://www.ibzag.ch/de/shop/magnetbaender~c1376?page={{1..10}}',
    ],
  },
  {
    name: 'cz_adect',
    customer: 'Adect',
    pattern: 'https://www.adecteshop.cz/:*/',
    startUrls: [
      'https://www.adecteshop.cz/maskovaci-pasky/strana-{{1..15}}/',
      'https://www.adecteshop.cz/oznacovaci-barevne-pasky/strana-{{1..15}}/',
    ],
  },
  {
    name: 'fr_manutan',
    customer: 'Manutan',
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
    customer: 'Maillaj',
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
    name: 'fr_gd_industrie',
    customer: 'GD Industrie',
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
    name: 'int_rs_components',
    customer: 'RS Components',
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
    name: 'int_rubix',
    customer: 'Rubix',
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
    name: 'de_klebetechnik_und_mehr',
    customer: 'Krückemeyer',
    pattern: 'https://www.klebetechnik-und-mehr.de/epages/63672978.sf/de_DE/*',
    startUrls: [
      // Main adhesive tapes category with pagination
      'https://www.klebetechnik-und-mehr.de/epages/63672978.sf/de_DE/?ObjectPath=/Shops/63672978/Categories/Klebebaender&PageSize=100&ViewMode=Grid&Page={{1..20}}',
    ],
  },
  {
    name: 'de_kahmann_ellerbrock',
    customer: 'Kahmann & Ellerbrock',
    pattern: 'https://www.ke.de/*',
    startUrls: [
      // Main adhesive tapes category with pagination
      'https://www.ke.de/Klebebaender?page={{1..20}}',
    ],
  },
  {
    name: 'at_kaindl',
    customer: 'KAINDL',
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
    name: 'de_moosmann',
    customer: 'Moosmann',
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
    name: 'de_mueth_tapes',
    customer: 'Müth Tapes',
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
    name: 'de_selmundo',
    customer: 'Selmundo',
    pattern: 'https://www.selmundo.com/selmundo:*',
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
    name: 'de_roeckelein',
    customer: 'Röckelein',
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
    name: 'uk_austen_direct',
    customer: 'Austen Tapes',
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
    name: 'se_ahlsell',
    customer: 'Ahlsell',
    pattern: 'https://www.ahlsell.se/*',
    startUrls: [
      // Main category
      'https://www.ahlsell.se/category/forbrukningsvaror/tejp-och-tatningslister',
    ],
  },
  {
    name: 'cz_aztech',
    customer: 'Aztech',
    pattern: 'https://eshop.aztech.cz/*',
    startUrls: [
      // Main category
      'https://eshop.aztech.cz/lepeni/',
    ],
  },
  {
    name: 'cz_dr_tapes',
    customer: 'Dr. Tapes',
    pattern: 'https://drtapes.com/it/*',
    startUrls: [
      // Main categories
      'https://drtapes.com/it/5-monoadesivi',
      'https://drtapes.com/it/7-biadesivi',
    ],
  },
  {
    name: 'it_tapes_store',
    customer: 'Biemme Adesivi',
    pattern: 'https://www.tapes-store.com/it/*',
    startUrls: [
      // Main categories
      'https://www.tapes-store.com/it/nastri-monoadesivi.html',
      'https://www.tapes-store.com/it/nastri-biadesivi.html',
    ],
  },
  {
    name: 'se_boxon',
    customer: 'Boxon',
    pattern: 'https://www.boxon.se/*',
    startUrls: [
      // Main category
      'https://www.boxon.se/produkter/forslutning/tejp',
    ],
  },
  {
    name: 'uk_castletis',
    customer: 'Castle Tapes',
    pattern: 'https://castletis.co.uk/*',
    startUrls: [
      // Main category
      'https://castletis.co.uk/15-tapes',
    ],
  },
  {
    name: 'it_dpm',
    customer: 'Dipiemme',
    pattern: 'https://dpmtapes.com/*',
    startUrls: [
      // Main categories
      'https://dpmtapes.com/buisness/monoadesivi/',
      'https://dpmtapes.com/buisness/biadesivi/',
      'https://dpmtapes.com/biadesivi/',
    ],
  },
  {
    name: 'de_hahn_kolb',
    customer: 'Hahn + Kolb',
    pattern: 'https://www.hahn-kolb.de/*',
    startUrls: [
      // Main category
      'https://www.hahn-kolb.de/All-categories/Adhesive-tapes-insulating-tapes/1521AC04_1907362.cyid/1521.cgid/en/US/EUR/',
    ],
  },
  {
    name: 'at_hostra',
    customer: 'Hostra',
    pattern: 'https://shop.hostra.at/*',
    startUrls: [
      // Main category
      'https://shop.hostra.at/Klebebaender/',
    ],
  },
  {
    name: 'it_firenze',
    customer: 'Nuova Firenze',
    pattern: 'https://www.firenzenastri.it/it/*',
    startUrls: [
      // Main category
      'https://www.firenzenastri.it/it/vendita-nastri-adesivi-professionali-tesa.html',
    ],
  },
  {
    name: 'ro_papyrus',
    customer: 'Papyrus',
    pattern: 'https://www.papyrus.com/roRO/*',
    startUrls: [
      // Main category
      'https://www.papyrus.com/roRO/catalog/benzi-adezive-materiale-sigilare--c16?mya=0&query=::allCategories:16',
    ],
  },
  {
    name: 'uk_shandhigson',
    customer: 'Shand Higson',
    pattern: 'https://www.shandhigson.co.uk/*',
    startUrls: [
      // Main category
      'https://www.shandhigson.co.uk/tapes',
    ],
  },
  {
    name: 'es_solbi_mural',
    customer: 'Solbi Mural',
    pattern: 'https://solbi-mural.com/en/*',
    startUrls: [
      // Main categories
      'https://solbi-mural.com/en/22-one-sided-adhesive-tapes',
      'https://solbi-mural.com/en/15-double-sided-adhesive-tapes',
    ],
  },
  {
    name: 'hr_tahea',
    customer: 'Tahea',
    pattern: 'https://www.spooling.hr/*',
    startUrls: [
      // Main category
      'https://www.spooling.hr/proizvodi',
    ],
  },
  {
    name: 'no_tess',
    customer: 'Tess',
    pattern: 'https://www.tess.no/*',
    startUrls: [
      // Main category
      'https://www.tess.no/produkter/festemateriell/tape-og-merkeband/',
    ],
  },
  {
    name: 'it_tapes_point',
    customer: 'Tapes Point',
    pattern: 'https://tapespoint.com/en/*',
    startUrls: [
      // Main categories
      'https://tapespoint.com/en/12-single-sided-adhesive-tapes',
      'https://tapespoint.com/en/13-double-sided-adhesive-tapes',
      'https://tapespoint.com/en/50-packing-tapes',
    ],
  },
  {
    name: 'se_swedol',
    customer: 'Swedol',
    pattern: 'https://www.swedol.se/*',
    startUrls: [
      // Main category
      'https://www.swedol.se/produktsortiment/montering-skruv-och-las/tejpa-och-hafta/tejpa.html?mcprod_swedol_sek_sv_products%5BhierarchicalMenu%5D%5Bcategories.level0%5D%5B0%5D=Produktsortiment&mcprod_swedol_sek_sv_products%5BhierarchicalMenu%5D%5Bcategories.level0%5D%5B1%5D=Montering%2C%20skruv%20och%20l%C3%A5s&mcprod_swedol_sek_sv_products%5BhierarchicalMenu%5D%5Bcategories.level0%5D%5B2%5D=Tejpa%20och%20h%C3%A4fta&mcprod_swedol_sek_sv_products%5BhierarchicalMenu%5D%5Bcategories.level0%5D%5B3%5D=Tejpa&mcprod_swedol_sek_sv_products%5Bpage%5D=2&',
    ],
  },
  {
    name: 'es_trayma',
    customer: 'Trayma',
    pattern: 'https://www.trayma.es/*',
    startUrls: [
      // Main categories
      'https://www.trayma.es/cintas-adhesivas-de-una-cara/',
      'https://www.trayma.es/cinta-adhesiva-doble-cara/',
      'https://www.trayma.es/espumas-epdm-pvc-adhesivo/',
    ],
  },
];

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
  const { name, customer, pattern, startUrls } = targetData;

  const template = 'Extract name, price, categories, and all technical details for the products. price should be a dictionary of amount and currency, amount is a decimal field with two decimals. Include fields for dimensions if available. Include a place for general technical details in case different products have more or fewer technical details. If there are variants on any aspect, for example variants in color, dimensions, or other attributes, include those in an array and specify what is varying.';

  console.log(`\n=== Processing ${name} (${customer}) ===`);

  // Get selected configuration options
  const selectedProxy = getSelectedOption(PROXY_OPTIONS);
  const selectedTransform = getSelectedOption(TRANSFORM_OPTIONS);
  const selectedExtractMode = getSelectedOption(EXTRACT_MODES);

  // SDK Configuration object (SDK handles pagination templates natively)
  const crawlConfig = {
    pattern,
    startUrls: startUrls,
    maxVisits: MAX_VISITS,
    maxDepth: MAX_DEPTH,
    proxy: selectedProxy,
    crawlPriority: 'random',
  };

  // Add transform if not 'none'
  if (selectedTransform !== 'none') {
    crawlConfig.contentTransform = [selectedTransform];
  }

  try {
    // Step 1: Crawl to get URLs using SDK
    console.log(`Run crawl with proxy: ${selectedProxy}, transform: ${selectedTransform}`);
    const crawlResult = await crawl(crawlConfig);
    const urls = (crawlResult.results && crawlResult.results.hits) || [];
    
    console.log('Found URLs:', urls.length);
    console.log('First few URLs:', urls.slice(0, 10));

    // Step 2: Extract from limited URLs (cost control) using SDK
    const limitedUrls = urls.slice(0, MAX_EXTRACTS);
    
    const extractConfig = {
      urls: limitedUrls,
      template,
      proxy: selectedProxy,
      extractMode: selectedExtractMode,
    };

    // Add transform if not 'none'
    if (selectedTransform !== 'none') {
      extractConfig.contentTransform = selectedTransform;
    }

    console.log(`Run extract with ${limitedUrls.length} URLs, mode: ${selectedExtractMode}`);
    const extractResult = await extract(extractConfig);
    const items = (extractResult.results && extractResult.results.items) || [];

    console.log('Items extracted:', items.length);

    console.log('First few items:');
    console.log(items.slice(0, 3));

    // Step 3: Calculate costs and metrics (in-memory analysis)
    const crawlCost = crawlResult.metrics?.cost?.total || 0;
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
      crawlMetrics: crawlResult.metrics,
      extractMetrics: extractResult.metrics,
    };

    // Step 4: Save to JSONL file (persistent storage)
    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const outputPath = path.join(resultsDir, `results_${name}.jsonl`);
    const fileHandle = fs.createWriteStream(outputPath, { flags: 'w' });

    for (const item of items) {
      fileHandle.write(JSON.stringify(item) + '\n');
    }
    fileHandle.end();

    console.log(`\n=== Results for ${name} ===`);
    console.log(`Customer: ${customer}`);
    console.log(`URLs found: ${urls.length}`);
    console.log(`Items extracted: ${items.length}`);
    console.log(`Total cost: $${totalCost.toFixed(4)} (crawl: $${crawlCost.toFixed(4)}, extract: $${extractCost.toFixed(4)})`);
    console.log(`Cost per 1k items: $${costPer1k.toFixed(2)}`);
    console.log(`Output saved to: ${outputPath}`);

    return result;

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
  console.log('Shop\t\t\tCustomer\t\tItems\tCost\t\tCost/1k');
  console.log('-'.repeat(90));
  
  let totalItems = 0;
  let totalCosts = 0;

  for (const result of results) {
    if (result.error) {
      console.log(`${result.name.padEnd(15)}\t${result.customer.padEnd(15)}\tERROR: ${result.error}`);
    } else {
      console.log(`${result.name.padEnd(15)}\t${result.customer.padEnd(15)}\t${result.items.length}\t$${result.cost.toFixed(4)}\t\t$${result.costPer1k.toFixed(2)}`);
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
  
  if (targetName) {
    console.log(`Scraping target: ${targetName}`);
    scrapeTarget(targetName).catch(console.error);
  } else {
    console.log('Scraping all targets...');
    run().catch(console.error);
  }
} 
