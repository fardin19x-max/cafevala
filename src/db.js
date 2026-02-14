export async function q(env, sql, args=[]){
  const stmt = env.DB.prepare(sql);
  const res = args.length ? await stmt.bind(...args).all() : await stmt.all();
  return res.results || [];
}

export async function one(env, sql, args=[]){
  const rows = await q(env, sql, args);
  return rows[0] || null;
}

export async function run(env, sql, args=[]){
  const stmt = env.DB.prepare(sql);
  return args.length ? await stmt.bind(...args).run() : await stmt.run();
}

export async function tx(env, fn){
  await env.DB.prepare('BEGIN').run();
  try{
    const out = await fn();
    await env.DB.prepare('COMMIT').run();
    return out;
  }catch(e){
    await env.DB.prepare('ROLLBACK').run();
    throw e;
  }
}

export async function sha256Hex(str){
  const data = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const arr = [...new Uint8Array(digest)];
  return arr.map(b=>b.toString(16).padStart(2,'0')).join('');
}
