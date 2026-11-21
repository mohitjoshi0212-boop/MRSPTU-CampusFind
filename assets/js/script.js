const menuToggle=document.getElementById('menuToggle');
const nav=document.querySelector('.nav-links');
if(menuToggle&&nav){menuToggle.addEventListener('click',()=>nav.classList.toggle('open'));}
const searchInput=document.getElementById('searchInput');
const categoryFilter=document.getElementById('categoryFilter');
const searchButton=document.getElementById('searchButton');
const cards=[...document.querySelectorAll('.item-tile')];
const emptyState=document.getElementById('emptyState');
function filterItems(){
  const query=(searchInput?.value||'').trim().toLowerCase();
  const category=categoryFilter?.value||'';
  let visible=0;
  cards.forEach(card=>{
    const matchesName=card.dataset.name.includes(query);
    const matchesCategory=!category||card.dataset.category===category;
    const show=matchesName&&matchesCategory;
    card.style.display=show?'':'none';
    if(show)visible++;
  });
  if(emptyState)emptyState.hidden=visible!==0;
}
searchButton?.addEventListener('click',filterItems);
searchInput?.addEventListener('input',filterItems);
categoryFilter?.addEventListener('change',filterItems);
