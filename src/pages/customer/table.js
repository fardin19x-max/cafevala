import { layout } from '../ui/layout.js';

export async function pageTable(){
  const body = `
  <div class="container">
    <div class="topbar">
      <div class="brand">VALA <span class="badge">ثبت میز</span></div>
      <a class="badge" href="/">بازگشت</a>
    </div>

    <div class="card">
      <div class="h1">شماره میز</div>
      <p class="p">شماره میزت رو وارد کن تا منو باز بشه.</p>
      <div style="height:14px"></div>
      <input class="input" id="t" inputmode="numeric" placeholder="مثلاً 12" />
      <div style="height:12px"></div>
      <button class="btn primary" id="save">ثبت و ادامه</button>
    </div>
  </div>`;

  const script = `
    const el = $('#t');
    el.value = localStorage.getItem('table_no') || '';
    $('#save').addEventListener('click', ()=>{
      const v = (el.value||'').replace(/\D/g,'');
      const n = parseInt(v,10);
      if(!n || n<1 || n>999){ toast('شماره میز نامعتبر'); return; }
      localStorage.setItem('table_no', String(n));
      toast('ثبت شد');
      setTimeout(()=>location.href='/menu', 250);
    });
  `;

  return layout({ title:'ثبت میز', body, script });
}
