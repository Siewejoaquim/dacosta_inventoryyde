// Convert number to French words for invoice
const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function belowThousand(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    if (t === 7) return 'soixante-' + ones[10 + o];
    if (t === 9) return 'quatre-vingt-' + ones[o];
    if (t === 8) return o === 0 ? 'quatre-vingts' : 'quatre-vingt-' + ones[o];
    return tens[t] + (o > 0 ? (t === 2 && o === 1 ? ' et un' : '-' + ones[o]) : '');
  }
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const hundredStr = h === 1 ? 'cent' : ones[h] + ' cent';
  return rest === 0 ? hundredStr + (h > 1 ? 's' : '') : hundredStr + ' ' + belowThousand(rest);
}

export function numberToFrenchWords(n: number): string {
  if (n === 0) return 'zéro franc CFA';
  
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const remainder = n % 1000;

  let result = '';

  if (millions > 0) {
    result += (millions === 1 ? 'un million' : belowThousand(millions) + ' millions') + ' ';
  }
  if (thousands > 0) {
    result += (thousands === 1 ? 'mille' : belowThousand(thousands) + ' mille') + ' ';
  }
  if (remainder > 0) {
    result += belowThousand(remainder);
  }

  return result.trim() + ' francs CFA';
}
