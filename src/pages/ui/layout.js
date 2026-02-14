import { THEME_CSS } from './theme.js';

export function layout({ title='VALA', body='', script='' }){
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${THEME_CSS}</style>
</head>
<body>
  ${body}
  <div class="toast" id="toast"></div>
  <script>
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  function toast(msg){
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__toastT);
    window.__toastT = setTimeout(()=>t.classList.remove('show'), 2200);
  }
  async function api(url, opts={}){
    const r = await fetch(url, { headers:{'content-type':'application/json'}, ...opts });
    let j=null; try{ j=await r.json(); }catch{}
    if(!r.ok || (j && j.ok===false)){
      throw new Error(j?.error || ('HTTP '+r.status));
    }
    return j;
  }
  function money(x){
    try{ return new Intl.NumberFormat('fa-IR').format(x); }catch{ return String(x); }
  }
  ${script}
  </script>
</body>
</html>`;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
