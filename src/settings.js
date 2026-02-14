import { q, one, run, tx } from './db.js';

export async function getSettingsMap(env){
  const rows = await q(env, 'SELECT key,value FROM settings');
  const m = {};
  for(const r of rows) m[r.key]=r.value;
  return m;
}

export async function getSetting(env, key, def=''){
  const row = await one(env, 'SELECT value FROM settings WHERE key=?1', [key]);
  return row ? row.value : def;
}

export async function setSetting(env, key, value){
  await run(env, 'INSERT INTO settings(key,value) VALUES(?1,?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [key, String(value)]);
}

export function todayKey(){
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,'0');
  const day = String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

export async function nextReceiptCode(env, tableNo){
  return tx(env, async ()=>{
    const day = todayKey();
    const prefix = await getSetting(env, 'receipt_prefix', 'T');
    const lastDay = await getSetting(env, 'receipt_day', '');
    let counter = parseInt(await getSetting(env, 'receipt_counter', '0') || '0', 10);
    if(lastDay !== day){
      counter = 0;
      await setSetting(env, 'receipt_day', day);
    }
    counter += 1;
    await setSetting(env, 'receipt_counter', String(counter));
    const t = String(tableNo).replace(/\D/g,'');
    return `${prefix}${t}-${String(counter).padStart(3,'0')}`;
  });
}
