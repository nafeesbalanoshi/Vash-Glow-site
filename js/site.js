// Header shrink on scroll
window.addEventListener('scroll', function(){
  const h = document.querySelector('header');
  if(!h) return;
  if(window.scrollY > 40) h.classList.add('shrink');
  else h.classList.remove('shrink');
});

// Reveal on scroll (kept in case a page doesn't already have it)
if(!window.__vgReveal){
  window.__vgReveal = true;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{threshold:0.15});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}

// Product gallery slider
document.querySelectorAll('.pd-gallery').forEach(function(gallery){
  const track = gallery.querySelector('.pg-track');
  const slides = gallery.querySelectorAll('.pg-slide');
  const dots = gallery.querySelectorAll('.pg-dot');
  const prev = gallery.querySelector('.pg-arrow.prev');
  const next = gallery.querySelector('.pg-arrow.next');
  let i = 0;
  function go(n){
    i = (n + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + (i*100) + '%)';
    dots.forEach((d,idx)=> d.classList.toggle('active', idx===i));
  }
  if(prev) prev.addEventListener('click', ()=>go(i-1));
  if(next) next.addEventListener('click', ()=>go(i+1));
  dots.forEach((d,idx)=> d.addEventListener('click', ()=>go(idx)));
  // swipe support
  let startX = null;
  track.addEventListener('touchstart', e=>{ startX = e.touches[0].clientX; });
  track.addEventListener('touchend', e=>{
    if(startX===null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if(dx > 40) go(i-1);
    else if(dx < -40) go(i+1);
    startX = null;
  });
});

// Quantity stepper -> updates WhatsApp order link with quantity
document.querySelectorAll('.qty-stepper').forEach(function(stepper){
  const minus = stepper.querySelector('.qty-minus');
  const plus = stepper.querySelector('.qty-plus');
  const display = stepper.querySelector('.qty-val');
  const waLink = document.querySelector('.pd-order-link');
  let qty = 1;
  function update(){
    display.textContent = qty;
    if(waLink){
      const base = waLink.getAttribute('data-base-text');
      waLink.href = waLink.getAttribute('data-base-url') + '?text=' + base + '%20Quantity%3A%20' + qty + '.';
    }
  }
  if(minus) minus.addEventListener('click', ()=>{ if(qty>1) qty--; update(); });
  if(plus) plus.addEventListener('click', ()=>{ qty++; update(); });
});

// Share button
document.querySelectorAll('.share-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    const url = window.location.href;
    const title = document.title;
    if(navigator.share){
      navigator.share({title, url}).catch(()=>{});
    } else {
      navigator.clipboard.writeText(url).then(()=>{
        const orig = btn.textContent;
        btn.textContent = 'Link Copied!';
        setTimeout(()=>{ btn.textContent = orig; }, 1800);
      });
    }
  });
});

// Shop category filter
document.querySelectorAll('.filter-chip').forEach(function(chip){
  chip.addEventListener('click', function(){
    document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    const cat = chip.getAttribute('data-filter');
    document.querySelectorAll('.detail-row').forEach(function(row){
      if(cat === 'all' || row.getAttribute('data-category') === cat){
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  });
});
