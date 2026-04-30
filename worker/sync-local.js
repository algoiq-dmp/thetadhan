import fs from 'fs';
import { execSync } from 'child_process';

async function run() {
  console.log('Fetching Dhan Scrip Master...');
  const res = await fetch('https://images.dhan.co/api-data/api-scrip-master.csv');
  const csv = await res.text();
  
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  const idx = {};
  ['SEM_SMST_SECURITY_ID', 'SEM_TRADING_SYMBOL', 'SEM_EXM_EXCH_ID', 'SEM_SEGMENT',
   'SEM_INSTRUMENT_NAME', 'SEM_LOT_UNITS', 'SEM_EXPIRY_DATE', 'SEM_STRIKE_PRICE',
   'SEM_OPTION_TYPE', 'SEM_CUSTOM_SYMBOL', 'SEM_EXPIRY_FLAG'
  ].forEach(col => { idx[col] = headers.indexOf(col); });

  console.log('Generating SQL...');
  let sql = 'DELETE FROM instruments;\n';
  let count = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
    if (!cols[idx.SEM_SMST_SECURITY_ID]) continue;

    const exch = cols[idx.SEM_EXM_EXCH_ID] || '';
    const seg = cols[idx.SEM_SEGMENT] || '';
    if (exch !== 'NSE' || seg !== 'D') continue;
    const segment = 'NSE_FNO';

    const symbol = cols[idx.SEM_CUSTOM_SYMBOL] || cols[idx.SEM_TRADING_SYMBOL] || '';
    // Only NIFTY, BANKNIFTY, RELIANCE for local speed
    if (!symbol.startsWith('NIFTY') && !symbol.startsWith('BANKNIFTY') && !symbol.startsWith('RELIANCE')) continue;

    // Escape quotes
    const escape = (str) => typeof str === 'string' ? str.replace(/'/g, "''") : str;

    const secId = escape(cols[idx.SEM_SMST_SECURITY_ID]);
    const sym = escape(symbol);
    const tradingSym = escape(cols[idx.SEM_TRADING_SYMBOL]);
    const instName = escape(cols[idx.SEM_INSTRUMENT_NAME] || '');
    const lot = parseInt(cols[idx.SEM_LOT_UNITS]) || 1;
    const exp = escape(cols[idx.SEM_EXPIRY_DATE] || '');
    const strike = parseFloat(cols[idx.SEM_STRIKE_PRICE]) || 0;
    const optType = escape(cols[idx.SEM_OPTION_TYPE] || '');

    sql += `INSERT OR REPLACE INTO instruments (security_id, symbol, trading_symbol, exchange_segment, instrument_type, lot_size, expiry_date, strike_price, option_type) VALUES ('${secId}', '${sym}', '${tradingSym}', '${segment}', '${instName}', ${lot}, ${exp ? `'${exp}'` : 'NULL'}, ${strike ? strike : 'NULL'}, ${optType ? `'${optType}'` : 'NULL'});\n`;
    count++;
  }

  sql += `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('last_instrument_sync', '\"${new Date().toISOString()}\"', datetime('now'));\n`;

  fs.writeFileSync('sync.sql', sql);
  console.log(`Created sync.sql with ${count} instruments. Loading into D1...`);

  execSync('npx wrangler d1 execute thetadhan-db --local --file=sync.sql', { stdio: 'inherit' });
  console.log('Sync complete!');
}

run().catch(console.error);
