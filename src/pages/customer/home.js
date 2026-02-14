import { layout } from '../ui/layout.js';

export async function pageHome(){
  const body = `
  <div class="container">
    <div class="topbar">
      <div class="brand">VALA <span class="badge">ROYAL MENU</span></div>
      <div id="tableBadge" class="badge" style="display:none"></div>
    </div>

    <div class="card">
      <div class="h1">سفارش سریع داخل کافه</div>
      <p class="p">☕ قرارهای خوب از اینجا شروع میشن!</p>
      <div style="height:14px"></div>
      <div class="row">
        <button class="btn primary" id="go">ورود به منو</button>
        <button class="btn" id="clear">پاک کردن میز و سبد</button>
      </div>
      <div style="height:10px"></div>
      <p class="small">اگر قبلاً سفارش ثبت کردی، کد سفارش رو در صفحه پیگیری می‌بینی.</p>
    </div>
  </div>`;

  const script = `
    const tableNo = localStorage.getItem('table_no');
    if(tableNo){
      const b = $('#tableBadge');
      b.style.display='inline-flex';
      b.textContent = 'میز: ' + tableNo;
    }

    $('#go').addEventListener('click', ()=>{
      const t = localStorage.getItem('table_no');
      location.href = t ? '/menu' : '/table';
    });

    $('#clear').addEventListener('click', ()=>{
      localStorage.removeItem('table_no');
      localStorage.removeItem('cart');
      localStorage.removeItem('last_order_code');
      toast('پاک شد');
      setTimeout(()=>location.reload(), 400);
    });
  `;

  return layout({ title:'VALA', body, script });
}
