/* MRSPTU CampusFind - Supabase-powered frontend */
const CF = {
  supabase: null,
  items: [],
  user: null,
  ready: false,
  esc(s = '') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },
  date(s) { if (!s) return 'Date not provided'; try { return new Date(s + 'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}); } catch { return s; } },
  async init() {
    const url = window.CAMPUSFIND_SUPABASE_URL;
    const key = window.CAMPUSFIND_SUPABASE_KEY;
    if (!window.supabase || !url || !key || url.includes('PASTE_YOUR') || key.includes('PASTE_YOUR')) {
      this.showSetupWarning(); return;
    }
    this.supabase = window.supabase.createClient(url, key);
    const { data: { session } } = await this.supabase.auth.getSession();
    this.user = session?.user || null;
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.user = session?.user || null;
      this.refreshNav();
    });
    this.refreshNav();
    await this.loadItems();
    this.ready = true;
    this.bindSearch(); this.bindReport(); this.bindAuth(); this.bindDashboard();
  },
  showSetupWarning() {
    const warning = document.createElement('div');
    warning.style.cssText='margin:12px auto;padding:12px 16px;max-width:1100px;background:#fff3cd;color:#664d03;border:1px solid #ffecb5;border-radius:10px;font:14px sans-serif';
    warning.textContent='CampusFind setup is not complete yet. Add your Supabase Project URL and Publishable key in assets/js/supabase-config.js.';
    document.body.prepend(warning);
    this.refreshNav();
  },
  refreshNav() {
    document.querySelectorAll('[data-auth-label]').forEach(a => a.textContent = this.user ? 'My account' : 'Log in');
    document.querySelectorAll('[data-auth-href]').forEach(a => a.href = this.user ? 'dashboard.html' : 'login.html');
  },
  mapRow(row) { return { id: row.id, type: row.type, itemName: row.item_name, category: row.category, location: row.location, date: row.item_date, description: row.description || '', contactName: row.contact_name || '', contact: row.contact || '', photo: row.photo_url || '', createdAt: row.created_at, owner: row.user_id, status: row.status || 'Open' }; },
  async loadItems() {
    const { data, error } = await this.supabase.from('items').select('*').order('created_at',{ascending:false});
    if (error) { console.error(error); this.toast('Could not load reports: ' + error.message); return; }
    this.items = (data || []).map(row => this.mapRow(row));
    this.renderCurrentPage();
  },
  async loadMyItems() {
    if (!this.user) return [];
    const { data, error } = await this.supabase.from('items').select('*').eq('user_id',this.user.id).order('created_at',{ascending:false});
    if (error) { this.toast(error.message); return []; }
    return (data || []).map(row => this.mapRow(row));
  },
  tile(item) {
    const palette=['tile-purple','tile-yellow','tile-green','tile-blue'];
    const emoji=({Electronics:'🎧',Documents:'🪪',Accessories:'👛',Books:'📘',Clothing:'👕',Keys:'🔑',Other:'📦'}[item.category]||'📦');
    return `<article class="item-tile cf-item" data-id="${this.esc(item.id)}" data-category="${this.esc(item.category)}" data-name="${this.esc((item.itemName||'').toLowerCase())}">
      <div class="tile-image ${palette[(item.category||'').length%4]}"><span class="status ${item.type==='Found'?'status-found':'status-lost'}">${this.esc(item.type).toUpperCase()}</span>${item.photo?`<img src="${this.esc(item.photo)}" alt="${this.esc(item.itemName)}" style="max-width:100%;max-height:100%;object-fit:cover">`:`<span class="tile-emoji">${emoji}</span>`}</div>
      <div class="tile-info"><div class="tile-category">${this.esc(item.category||'Other').toUpperCase()}</div><h3>${this.esc(item.itemName)}</h3><p>📍 ${this.esc(item.location)} · ${this.date(item.date)}</p><p class="cf-status">${item.status==='Returned'?'✅ Returned':'Open report'}</p><button class="btn btn-light cf-details" type="button">View details</button></div></article>`;
  },
  renderCards(target, list) { if (!target) return; target.innerHTML=list.map(item=>this.tile(item)).join(''); this.bindCardDetails(target); },
  bindCardDetails(target) { target.querySelectorAll('.cf-details').forEach(btn=>btn.onclick=()=>this.showDetails(btn.closest('.cf-item').dataset.id)); target.querySelectorAll('.cf-item').forEach(card=>card.onclick=e=>{if(!e.target.closest('button'))this.showDetails(card.dataset.id);}); },
  showDetails(id) {
    const item=this.items.find(i=>String(i.id)===String(id)); if(!item)return;
    let modal=document.getElementById('cfModal'); if(!modal){modal=document.createElement('div');modal.id='cfModal';modal.className='cf-modal';document.body.appendChild(modal);}
    const contact=item.contact||'', email=contact.includes('@'), phone=/^[+\d\s()-]+$/.test(contact);
    const contactAction=email?`<a class="btn btn-dark" href="mailto:${this.esc(contact)}?subject=${encodeURIComponent('MRSPTU CampusFind: '+item.itemName)}">Contact reporter</a>`:phone?`<a class="btn btn-dark" href="tel:${this.esc(contact)}">Call reporter</a>`:'';
    modal.innerHTML=`<div class="cf-modal-box"><button class="cf-close" aria-label="Close">×</button><h2>${this.esc(item.itemName)}</h2><span class="status ${item.type==='Found'?'status-found':'status-lost'}">${this.esc(item.type).toUpperCase()}</span><p><b>Category:</b> ${this.esc(item.category)}</p><p><b>Location:</b> ${this.esc(item.location)}</p><p><b>Date:</b> ${this.date(item.date)}</p><p><b>Description:</b> ${this.esc(item.description)}</p>${item.photo?`<img class="cf-modal-photo" src="${this.esc(item.photo)}" alt="Item photo">`:''}<p><b>Reported by:</b> ${this.esc(item.contactName||'Campus user')}</p><p><b>Contact:</b> ${this.esc(contact||'Not provided')}</p>${contactAction}<button class="btn btn-light cf-claim" type="button">I think this is my item</button><p class="cf-modal-note">For safety, verify ownership by asking for identifying details not shown in this report.</p></div>`;
    modal.style.display='flex'; modal.querySelector('.cf-close').onclick=()=>modal.remove(); modal.onclick=e=>{if(e.target===modal)modal.remove();}; modal.querySelector('.cf-claim').onclick=()=>{if(!contact){alert('Reporter did not provide contact details.');return;}if(!email){alert('Please contact the reporter using the contact details shown above.');return;}location.href=`mailto:${encodeURIComponent(contact)}?subject=${encodeURIComponent('Claim inquiry: '+item.itemName)}&body=${encodeURIComponent(`Hello ${item.contactName||'reporter'},\n\nI believe this ${item.type.toLowerCase()} item may be mine. Can we verify it?\nItem: ${item.itemName}\nLocation: ${item.location}\n\nThank you.`)}`;};
  },
  renderCurrentPage() { this.bindSearch(); },
  bindSearch() {
    const grid=document.getElementById('itemGrid'); if(!grid)return;
    const isListing=document.body.dataset.listType;
    const input=document.getElementById('searchInput'), category=document.getElementById('categoryFilter'), empty=document.getElementById('emptyState');
    const run=()=>{let list=this.items.filter(i=>!isListing||i.type.toLowerCase()===isListing.toLowerCase());const q=(input?.value||'').trim().toLowerCase(),cat=category?.value||'';list=list.filter(i=>{const t=`${i.itemName} ${i.description} ${i.location} ${i.category}`.toLowerCase();return(!q||t.includes(q))&&(!cat||i.category===cat);});this.renderCards(grid,list);if(empty)empty.hidden=list.length>0;};
    if(input)input.oninput=run;if(category)category.onchange=run;const btn=document.getElementById('searchButton');if(btn)btn.onclick=run;run();
  },
  bindReport() {
    const form=document.getElementById('reportForm');if(!form)return;
    const qs=new URLSearchParams(location.search);if(qs.get('type')?.toLowerCase()==='found'){const r=form.querySelector('input[value="Found"]');if(r)r.checked=true;}
    form.onsubmit=async e=>{e.preventDefault();if(!this.user){alert('Please log in before submitting a report.');location.href='login.html';return;}
      const data=new FormData(form),file=form.photo?.files?.[0];let photoUrl='';
      if(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type)){alert('Please upload a JPG, PNG, or WebP image.');return;}if(file.size>5*1024*1024){alert('Photo must be 5 MB or smaller.');return;}const ext=file.type==='image/jpeg'?'jpg':file.type.split('/')[1];const path=`${this.user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;const {error:uploadError}=await this.supabase.storage.from('item-photos').upload(path,file,{contentType:file.type,upsert:false});if(uploadError){alert('Photo upload failed: '+uploadError.message);return;}photoUrl=this.supabase.storage.from('item-photos').getPublicUrl(path).data.publicUrl;}
      const row={user_id:this.user.id,type:data.get('type'),item_name:data.get('itemName').trim(),category:data.get('category'),location:data.get('location').trim(),item_date:data.get('date')||null,description:data.get('description').trim(),contact_name:data.get('contactName').trim(),contact:data.get('contact').trim(),photo_url:photoUrl,status:'Active'};
      const {error}=await this.supabase.from('items').insert(row);if(error){alert('Report could not be saved: '+error.message);return;}const message=document.getElementById('formMessage');if(message){message.textContent='✓ Report submitted successfully!';message.style.display='block';}form.reset();if(qs.get('type')?.toLowerCase()==='found'){const r=form.querySelector('input[value="Found"]');if(r)r.checked=true;}await this.loadItems();setTimeout(()=>location.href=row.type==='Found'?'found-items.html':'lost-items.html',700);
    };
  },
  bindAuth() {
    const form = document.querySelector('[data-auth-form]');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();

        const email = form.querySelector('[name="email"]')?.value?.trim().toLowerCase();
        const password = form.querySelector('[name="password"]')?.value;
        const name = form.querySelector('[name="name"]')?.value?.trim();

        if (!email || !password) {
            alert("Please enter email and password.");
            return;
        }

        const kind = form.dataset.authForm;

        if (kind === "register") {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            if (error) {
                alert(error.message);
                return;
            }

            alert("Account created successfully! Please check your email if confirmation is required.");
            location.href = "login.html";
        } else {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                alert(error.message);
                return;
            }

            this.user = data.user;
            location.href = "dashboard.html";
        }
    };
},
  async bindDashboard() {
    const grid=document.getElementById('myReports');if(!grid)return;
    if(!this.user){location.href='login.html';return;}
    const welcome=document.getElementById('welcomeName');if(welcome)welcome.textContent=this.user.user_metadata?.full_name||this.user.email;
    const logout=document.getElementById('logoutBtn');if(logout)logout.onclick=async()=>{await this.supabase.auth.signOut();location.href='index.html';};
    const render=async()=>{const own=await this.loadMyItems();grid.innerHTML=own.length?own.map(item=>`<div class="cf-manage-card"><div><b>${this.esc(item.itemName)}</b><span class="status ${item.type==='Found'?'status-found':'status-lost'}">${this.esc(item.type).toUpperCase()}</span><p>${this.esc(item.location)} · ${this.date(item.date)} · ${this.esc(item.status)}</p></div><div class="cf-manage-actions"><button class="btn btn-light" data-edit="${this.esc(item.id)}">Edit</button><button class="btn btn-light" data-status="${this.esc(item.id)}">${item.status==='Returned'?'Reopen':'Mark returned'}</button><button class="btn btn-dark" data-delete="${this.esc(item.id)}">Delete</button></div></div>`).join(''):'<p>You have not submitted any reports yet.</p>';
      grid.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this report?'))return;const {error}=await this.supabase.from('items').delete().eq('id',b.dataset.delete).eq('user_id',this.user.id);if(error)alert(error.message);else{await this.loadItems();render();}});
      grid.querySelectorAll('[data-status]').forEach(b=>b.onclick=async()=>{const item=own.find(x=>String(x.id)===b.dataset.status);if(!item)return;const status=item.status==='Returned'?'Open':'Returned';const {error}=await this.supabase.from('items').update({status}).eq('id',item.id).eq('user_id',this.user.id);if(error)alert(error.message);else{await this.loadItems();render();}});
const status=item.status==='Returned'?'Active':'Returned';    };await render();
  },
  toast(message){console.warn(message);},
};
document.addEventListener('DOMContentLoaded',()=>CF.init());