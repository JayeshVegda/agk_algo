/**
 * Signal chat parser: turns pasted trade-call text (Telegram style) into a
 * structured signal payload. Best-effort regex extraction with a live preview
 * in the composer, so the admin always sees and can correct the result.
 */

const KNOWN_PAIRS = [
  'XAUUSD', 'XAGUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD',
  'NZDUSD', 'USDCAD', 'USDCHF', 'EURJPY', 'EURGBP', 'BTCUSD', 'ETHUSD',
  'SOLUSD', 'US30', 'NAS100', 'GER40', 'SPX500',
];

export function parseSignalChatText(rawText) {
  const text = String(rawText || '').trim();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out = {
    symbol: '',
    direction: '',
    entry: '',
    stop_loss: '',
    take_profit_1: '',
    take_profit_2: '',
    notes: '',
  };
  if (!text) return out;

  const upper = text.toUpperCase();

  // Direction
  if (/\b(BUY|LONG)\b/.test(upper)) out.direction = 'BUY';
  else if (/\b(SELL|SHORT)\b/.test(upper)) out.direction = 'SELL';

  // Symbol: first known pair mentioned, else a generic TICKER-looking token
  for (const pair of KNOWN_PAIRS) {
    if (upper.includes(pair)) { out.symbol = pair; break; }
  }
  if (!out.symbol) {
    const m = upper.match(/\b([A-Z]{6}|[A-Z]{3,6}USD|[A-Z]{3,5}\d{2,3})\b/);
    if (m) out.symbol = m[1];
  }
  if (!out.symbol) out.symbol = 'XAUUSD';

  // NOTE: label patterns are wrapped in (?:...) before concatenation so any
  // '|' inside them cannot split the alternation of the full expression.
  const grab = (labelRe) => {
    const re = new RegExp('(?:' + labelRe + ')[ \t]*[:=@]?[ \t]*([0-9]+(?:[.,][0-9]+)?)', 'i');
    const m = text.match(re);
    return m && m[1] ? m[1].replace(',', '.') : '';
  };

  out.entry = grab('\\bENTRY\\b|\\bPRICE\\b|\\bOPEN\\b|\\bAT\\b|@');
  out.stop_loss = grab('\\bSL\\b|\\bSTOP ?LOSS\\b|\\bSTOPLOSS\\b');
  out.take_profit_1 = grab('\\bTP1?\\b|\\bTAKE ?PROFIT ?1?\\b|\\bTARGET ?1?\\b');
  out.take_profit_2 = grab('\\bTP2\\b|\\bTAKE ?PROFIT ?2\\b|\\bTARGET ?2\\b');

  // Notes: labeled notes line, or everything that is not a parameter line.
  const labeled = text.match(/(?:NOTES?|REASON|RATIONALE)[:= ]\s*(.+)/i);
  if (labeled) {
    out.notes = labeled[1].trim();
  } else {
    out.notes = lines
      .filter((l) => !/(entry|price|open|@|sl|stop|tp|take profit|target|buy|sell|long|short)/i.test(l) || /[a-z]{4,}\s[a-z]{4,}/i.test(l))
      .join(' ')
      .slice(0, 300)
      .trim();
  }

  return out;
}

export function parsedSignalIsValid(p) {
  return Boolean(p.symbol && p.direction && p.entry && p.stop_loss && p.take_profit_1);
}
