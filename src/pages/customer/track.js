import { layout } from '../ui/layout.js';

export async function pageTrack(){
  const body = `
  <div class="container">
    <div class="topbar">
      <div class="brand">VALA <span class="badge">پیگیری</span></div>
      <a class="badge" href="/menu">بازگشت به منو</a>
    </div>

    <div class="card">
      <div class="h1" style="font-size:18px">وضعیت سفارش</div>
      <div class="small" id="code"></div>
      <div style="height:12px"></div>
      <div id="status" class="badge"></div>
      <div style="height:12px"></div>
      <div id="detail"></div>
    </div>
  </div>`;

  const script = `
    const url = new URL(location.href);
    const code = url.searchParams.get('code') || localStorage.getItem('last_order_code') || '';
    if(!code){ toast('کد سفارش نیست'); location.href='/'; }
    $('#code').textContent = 'کد: ' + code;

    function statusText(s){
      if(s==='pending_waiter') return 'منتظر تایید گارسون';
      if(s==='accepted_waiter') return 'تایید شد — ارسال به صندوق';
      if(s==='paid') return 'پرداخت تایید شد ✅';
      if(s==='rejected') return 'رد شد';
      return s;
    }

    async function tick(){
      try{
        const j = await api('/api/orders/'+encodeURIComponent(code));
        const o = j.order;
        $('#status').textContent = statusText(o.status);
        const lines = (o.lines||[]).map(ln=>`<tr><td>${ln.name}</td><td>${ln.qty}</td><td>${money(ln.line_total)}</td></tr>`).join('');
        $('#detail').innerHTML = `
          <table class="table"><thead><tr><th>آیتم</th><th>تعداد</th><th>جمع</th></tr></thead><tbody>${lines}</tbody></table>
          <div class="row" style="justify-content:space-between;align-items:center">
            <div class="badge">مبلغ: ${money(o.totals.total)} تومان</div>
            <div class="small">میز: ${o.table_no}</div>
          </div>
          ${o.reject_reason?`<div style="margin-top:10px" class="badge" style="border-color:rgba(255,90,122,.45)">دلیل رد: ${o.reject_reason}</div>`:''}
        `;
      }catch(e){
        toast(e.message);
      }
    }

    tick();
    setInterval(tick, 3000);
  `;

  return layout({ title:'پیگیری', body, script });
}
