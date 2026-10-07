// Catalogue + editorial content.
// Names, taglines and descriptions are drafted from @trinityby_ob captions.
// PRICES ARE PLACEHOLDERS (CAD) — confirm with the brand before launch.
// `draft: true` marks a product whose name was not published by the brand.

export const IG_URL = 'https://www.instagram.com/trinityby_ob/';

export const HUES = {
  brown: { label: 'Brown', hex: '#b06a33', note: 'Grounded. Rooted. Warm.' },
  green: { label: 'Green', hex: '#3fae8f', note: 'Growth in full colour.' },
  white: { label: 'White', hex: '#efe9df', note: 'Quiet confidence.' },
  blue: { label: 'Blue', hex: '#2f5bff', note: 'Sunday best, every day.' }
};

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const products = [
  {
    id: 'nahar-brown-set',
    ref: 'TRN-FL-01',
    name: 'Nahar Brown Set',
    price: 185,
    category: 'Sets',
    hue: 'brown',
    images: ['nahar-brown-set', 'nahar-detail'],
    tagline: 'Effortless elegance, comfort & main-character energy.',
    description: 'The two-piece set you’ll never want to take off. A gathered off-shoulder blouse with full balloon sleeves, paired with a fluid wide-leg trouser in warm Flourish brown. Modest doesn’t mean boring — it means making a statement differently.',
    meaning: 'Nahar — Hebrew for “river”. Abundance that keeps moving.',
    details: ['Off-shoulder blouse with gathered neckline', 'Full balloon sleeves, gathered at the wrist', 'High-rise wide-leg trouser', 'Sold as a two-piece set'],
    fit: 'Relaxed, unisex sizing'
  },
  {
    id: 'wisdom-armless-top',
    ref: 'TRN-FL-02',
    name: 'Wisdom Armless Top',
    price: 65,
    category: 'Tops',
    hue: 'white',
    images: ['wisdom-top', 'wisdom-detail'],
    tagline: 'Wisdom speaks softly.',
    description: 'Textured white cotton, cut clean and sleeveless with a dropped shoulder. Styled with pearls and gold — quiet confidence with nothing to prove.',
    meaning: 'Wisdom — it speaks softly, and carries the most weight.',
    details: ['Waffle-textured cotton', 'Sleeveless with dropped armhole', 'Clean crew neckline', 'Boxy, unisex cut'],
    fit: 'Boxy, unisex sizing'
  },
  {
    id: 'havilah-pinstripe-shirt',
    ref: 'TRN-FL-03',
    name: 'Havilah Pinstripe Shirt & Tie',
    price: 125,
    category: 'Shirts',
    hue: 'blue',
    images: ['havilah-shirt', 'havilah-shirt-2', 'havilah-shirt-3'],
    tagline: 'Designed to make you look and feel like the star you are.',
    description: 'A bold cobalt pinstripe shirt in an oversized cut, finished with a matching tie and the Trinity woven label at the hem. Made for Sunday, styled for every day after — the perfect piece for any event.',
    meaning: 'Havilah — the land of gold in Genesis 2.',
    details: ['Cobalt & white pinstripe', 'Oversized, dropped-shoulder fit', 'Matching pinstripe tie included', 'Signature woven Trinity hem label'],
    fit: 'Oversized, unisex sizing'
  },
  {
    id: 'cedar-longsleeve',
    ref: 'TRN-FL-04',
    name: 'Cedar Longsleeve — Sunday Best',
    price: 60,
    category: 'Tops',
    hue: 'blue',
    images: ['cedar-longsleeve', 'cedar-longsleeve-2', 'look-trio'],
    tagline: '2 will always be better than 1.',
    description: 'A fitted cobalt rib longsleeve with the SUNDAY BEST arc print across the chest. Pair it with the Havilah shirt and you’ll understand why two is better than one.',
    meaning: 'Cedar — “they will grow like a cedar of Lebanon.” Psalm 92:12',
    details: ['Fine rib knit', 'Fitted, cropped silhouette', 'SUNDAY BEST chest print', 'Pairs with the Havilah shirt'],
    fit: 'Fitted — size up for a relaxed look'
  },
  {
    id: 'eden-dress',
    ref: 'TRN-FL-05',
    name: 'Eden Dress',
    price: 160,
    category: 'Dresses',
    hue: 'green',
    images: ['eden-dress'],
    tagline: 'Where bold colour meets effortless elegance.',
    description: 'From green to glory — an off-shoulder ruched dress that moves from deep emerald to soft mint. This isn’t just a dress… it’s a whole statement.',
    meaning: 'Eden — the garden where everything began to flourish.',
    details: ['Off-shoulder neckline', 'Ruched long sleeves', 'Green ombré print', 'Body-skimming ruched silhouette'],
    fit: 'Body-skimming — true to size'
  },
  {
    id: 'sky-zip-polo',
    ref: 'TRN-FL-06',
    name: 'Sky Zip Polo',
    draft: true,
    price: 95,
    category: 'Shirts',
    hue: 'blue',
    images: ['sky-shirt', 'look-group'],
    tagline: 'Structured ease for every season.',
    description: 'Powder-blue short sleeve with a crisp white collar and half-zip placket. Easy, structured and made to layer over the Cedar longsleeve or wear on its own.',
    meaning: 'Sky — room to grow upward.',
    details: ['Contrast white collar', 'Half-zip placket', 'Boxy short sleeve', 'Chest pocket'],
    fit: 'Boxy, unisex sizing'
  },
  {
    id: 'strength-jorts',
    ref: 'TRN-FL-07',
    name: 'Strength Jorts',
    soon: true,
    price: null,
    category: 'Bottoms',
    hue: 'blue',
    images: ['studio-hall'],
    tagline: 'Simple. Bold. TRINITY.',
    description: 'The Strength Jorts Variation — made to pair with the Wisdom Armless Top. Unveiling soon.',
    meaning: 'Strength — the combo you didn’t know you needed.',
    details: [],
    fit: ''
  }
];

export const getProduct = (id) => products.find((p) => p.id === id);
export const categories = ['All', ...new Set(products.map((p) => p.category))];

export const heroSlides = [
  { img: 'look-duo', title: 'Havilah × Cedar', sub: 'Sunday Best', link: '#/product/havilah-pinstripe-shirt' },
  { img: 'nahar-brown-set', title: 'Nahar Brown Set', sub: 'Flourish — Sets', link: '#/product/nahar-brown-set' },
  { img: 'wisdom-top', title: 'Wisdom Armless Top', sub: 'Flourish — Tops', link: '#/product/wisdom-armless-top' },
  { img: 'look-trio', title: 'Sunday Best', sub: 'Editorial 02', link: '#/lookbook' }
];

// From the “Why Flourish?” carousel — the meaning behind the collection.
export const story = [
  { k: 'Hidden', t: 'There is a season where you feel *hidden.* Not forgotten. But *planted.*' },
  { k: 'Waiting', t: 'The quiet season. The *waiting* season. The *pruning* season — where God does His deepest work in obscurity.' },
  { k: 'Pressed', t: 'An olive must be *crushed* to make oil. A seed must remain *buried* before it grows.' },
  { k: 'Prepared', t: 'What if the waiting season was never punishment? What if it was *preparation?*' },
  { k: 'Shaped', t: 'Flourishing doesn’t start when people notice you. It starts when *God finishes shaping you.*' },
  { k: 'Becoming', t: 'Flourish was created for this in-between. Pieces designed to move with you *as you evolve.*' }
];

export const psalm = {
  text: 'The righteous will flourish like a palm tree, they will grow like a cedar of Lebanon; planted in the house of the Lord, they will flourish in the courts of our God.',
  ref: 'Psalm 92:12–13'
};

export const lookbook = [
  { img: 'look-group', title: 'Flourish is live', meta: 'Editorial 01 — Mood Studios' },
  { img: 'look-duo', title: 'Two is better than one', meta: 'Havilah × Cedar' },
  { img: 'nahar-brown-set', title: 'Main-character energy', meta: 'Nahar Brown Set' },
  { img: 'look-trio', title: 'Sunday Best', meta: 'Editorial 02' },
  { img: 'wisdom-top', title: 'Wisdom speaks softly', meta: 'Wisdom Armless Top' },
  { img: 'eden-dress', title: 'From green to glory', meta: 'Eden Dress — BTS' },
  { img: 'bts-collage', title: 'Behind the frame', meta: 'BTS' },
  { img: 'studio-hall', title: 'The walk in', meta: 'Mood Studios, Toronto' }
];

export const credits = [
  ['Photography', '@dappyshots · @davdkuko'],
  ['Location', '@moodstudios.ca'],
  ['Styling', '@_bridesandmore'],
  ['Makeup', '@moriellabeauty'],
  ['Content', '@thekinnex']
];

export const values = [
  { n: '01', t: 'Unisex', d: 'Cut to move with every body. One collection, shared.' },
  { n: '02', t: 'Modest', d: 'Coverage without compromise. Modesty’s appeal, made modern.' },
  { n: '03', t: 'Intentional', d: 'Luxurious ready-to-wear, designed slowly and prayed over.' },
  { n: '04', t: 'Belonging', d: 'A safe space for faith expression — welcome to the Trinity Fam.' }
];

export const FREE_SHIP = 200;
export const money = (n) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n).replace('CA', '');
