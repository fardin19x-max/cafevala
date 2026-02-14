export function html(body, status=200, headers={}){
  return new Response(body, {
    status,
    headers: {
      'content-type':'text/html; charset=utf-8',
      'cache-control':'no-store',
      ...headers,
    }
  });
}

export function json(obj, status=200, headers={}){
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store',
      ...headers,
    }
  });
}

export function redirect(to, status=302){
  return new Response(null, { status, headers: { Location: to } });
}

export function text(body, status=200, headers={}){
  return new Response(body, { status, headers: { 'content-type':'text/plain; charset=utf-8', ...headers } });
}

export function badRequest(msg='Bad Request'){
  return json({ ok:false, error: msg }, 400);
}

export function unauthorized(msg='Unauthorized'){
  return json({ ok:false, error: msg }, 401);
}

export function notFound(){
  return json({ ok:false, error: 'Not Found' }, 404);
}

export function parseCookies(req){
  const h = req.headers.get('cookie') || '';
  const out = {};
  h.split(';').map(s=>s.trim()).filter(Boolean).forEach(kv=>{
    const i = kv.indexOf('=');
    if(i>-1) out[kv.slice(0,i)] = decodeURIComponent(kv.slice(i+1));
  });
  return out;
}

export function setCookie(name, value, opts={}){
  const { path='/', httpOnly=true, secure=true, sameSite='Lax', maxAge } = opts;
  let c = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if(httpOnly) c += '; HttpOnly';
  if(secure) c += '; Secure';
  if(typeof maxAge==='number') c += `; Max-Age=${maxAge}`;
  return c;
}
