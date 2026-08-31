import type { Products } from './types';

// Row order matches lib/schema.json exactly. Shared between the card shell
// (labels for the Q12 pickers) and the voice pipeline (labels in the
// extraction prompt and the confirmation card's plain-language summary).
export const PRODUCT_ROWS: { key: keyof Products; label: string }[] = [
  { key: 'otc_medicated_shampoos', label: 'OTC/Medicated Shampoos' },
  { key: 'hair_oils_serums', label: 'Hair Oils/Serums' },
  { key: 'topical_minoxidil', label: 'Topical Minoxidil' },
  { key: 'oral_minoxidil', label: 'Oral Minoxidil' },
  { key: 'supplements', label: 'Supplements' },
];
