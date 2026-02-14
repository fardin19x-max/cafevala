import { layout } from '../ui/layout.js';

export async function pageAdminLogin(){
  const body = `
  <div class="container">
    <div class="topbar">
      <div class="brand">VALA <span class="badge">Admin</span></div>
      <a class="badge" href="/">مشتری</a>
    </div>

    <div class="card" style="max-width:520px;margin:0 auto">
      <div class="h1">ورود مدیریت</div>
      <p class="p">نام کاربری و رمز را وارد کنید.</p>
      <div style="height:12px"></div>
      <input class="input" id="u" placeholder="username" />
      <div style="height:10px"></div>
      <input class="input" id="p" type="password" placeholder="password" />
      <div style="height:12px"></div>
      <button class="btn primary" id="login">ورود</button>
      <div style="height:10px"></div>
      <div class="small">پیش‌فرض: admin / admin123</div>
    </div>
  </div>`;

  const script = `
    $('#login').addEventListener('click', async ()=>{
      try{
        const username = ($('#u').value||'').trim();
        const password = ($('#p').value||'');
        if(!username||!password){ toast('اطلاعات ناقص'); return; }
        await api('/api/admin/login', { method:'POST', body: JSON.stringify({ username, password }) });
        location.href='/admin';
      }catch(e){ toast(e.message); }
    });
  `;

  return layout({ title:'Admin Login', body, script });
}
