/* Vash Glow — lightweight site interactions, no external JS dependencies. */
(function () {
  'use strict';
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    var header=document.querySelector('header'), backTop=document.querySelector('.back-top');
    function onScroll(){
      if(header) header.classList.toggle('shrink', window.scrollY>40);
      if(backTop) backTop.classList.toggle('show', window.scrollY>500);
    }
    window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

    /* Reveal is optional; older browsers simply show the content. */
    var revealEls=document.querySelectorAll('.reveal');
    if('IntersectionObserver' in window){
      var observer=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){ entry.target.classList.add('in'); observer.unobserve(entry.target); }
        });
      },{threshold:0.15});
      revealEls.forEach(function(el){observer.observe(el);});
    } else revealEls.forEach(function(el){el.classList.add('in');});

    /* Product gallery */
    document.querySelectorAll('.pd-gallery').forEach(function(gallery){
      var track=gallery.querySelector('.pg-track'), slides=gallery.querySelectorAll('.pg-slide');
      if(!track || !slides.length) return;
      var dots=gallery.querySelectorAll('.pg-dot'), prev=gallery.querySelector('.pg-arrow.prev'), next=gallery.querySelector('.pg-arrow.next'), index=0;
      function go(n){
        index=(n+slides.length)%slides.length;
        track.style.transform='translateX(-'+(index*100)+'%)';
        dots.forEach(function(dot,i){dot.classList.toggle('active',i===index);});
      }
      if(prev) prev.addEventListener('click',function(){go(index-1);});
      if(next) next.addEventListener('click',function(){go(index+1);});
      dots.forEach(function(dot,i){dot.addEventListener('click',function(){go(i);});});
      var startX=null;
      track.addEventListener('touchstart',function(e){if(e.touches.length) startX=e.touches[0].clientX;},{passive:true});
      track.addEventListener('touchend',function(e){
        if(startX===null || !e.changedTouches.length) return;
        var dx=e.changedTouches[0].clientX-startX;
        if(dx>40) go(index-1); else if(dx<-40) go(index+1); startX=null;
      },{passive:true});
    });

    /* Quantity -> WhatsApp order text */
    document.querySelectorAll('.qty-stepper').forEach(function(stepper){
      var minus=stepper.querySelector('.qty-minus'), plus=stepper.querySelector('.qty-plus'), display=stepper.querySelector('.qty-val');
      var container=stepper.closest('.pd-info') || document, waLink=container.querySelector('.pd-order-link');
      if(!display) return;
      var quantity=1;
      function update(){
        display.textContent=String(quantity);
        if(waLink){
          var baseUrl=waLink.getAttribute('data-base-url') || waLink.href.split('?')[0];
          var baseText=waLink.getAttribute('data-base-text') || '';
          waLink.href=baseUrl+'?text='+baseText+'%20Quantity%3A%20'+quantity+'.';
        }
      }
      if(minus) minus.addEventListener('click',function(){if(quantity>1){quantity--;update();}});
      if(plus) plus.addEventListener('click',function(){quantity++;update();});
    });

    /* Share */
    document.querySelectorAll('.share-btn').forEach(function(button){
      button.addEventListener('click',function(){
        var url=window.location.href, title=document.title;
        if(navigator.share){navigator.share({title:title,url:url}).catch(function(){});return;}
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(url).then(function(){
            var original=button.textContent; button.textContent='Link Copied!';
            window.setTimeout(function(){button.textContent=original;},1800);
          }).catch(function(){});
        }
      });
    });

    /* Shop filters — category chips, drawer links and #hash links all use this. */
    var chips=document.querySelectorAll('.filter-chip'), rows=document.querySelectorAll('.shop-page .detail-row');
    if(chips.length && rows.length){
      var GROUPS={skin:['brightening','sun','acne','scar','hydration']};
      var LABELS={};chips.forEach(function(c){LABELS[c.getAttribute('data-filter')]=c.textContent.trim();});
      var countEl=document.getElementById('shop-count'), firstRun=true;
      function matches(row,category){
        if(category==='all') return true;
        var c=row.getAttribute('data-category');
        return GROUPS[category]?GROUPS[category].indexOf(c)>-1:c===category;
      }
      function applyFilter(category,updateHash,scroll){
        var valid=false;
        chips.forEach(function(chip){
          var active=chip.getAttribute('data-filter')===category;
          chip.classList.toggle('active',active);chip.setAttribute('aria-pressed',active?'true':'false');
          if(active){valid=true;
            if(chip.parentNode && chip.parentNode.scrollTo){var bar=chip.parentNode;bar.scrollTo({left:chip.offsetLeft-(bar.clientWidth-chip.offsetWidth)/2,behavior:firstRun?'auto':'smooth'});}
          }
        });
        if(!valid) category='all';
        var shown=0;
        rows.forEach(function(row){
          var ok=matches(row,category); row.hidden=!ok;
          if(ok){shown++; row.classList.add('in');}
        });
        if(countEl){countEl.textContent=category==='all'?('Showing all '+shown+' products'):('Showing '+shown+' '+(shown===1?'product':'products')+' in '+LABELS[category]);}
        if(updateHash && history.replaceState) history.replaceState(null,'',category==='all'?window.location.pathname:'#'+category);
        if(scroll){var bar2=document.querySelector('.filter-bar');if(bar2){var h=(document.querySelector('header')||{offsetHeight:0}).offsetHeight;window.scrollTo({top:Math.max(0,bar2.getBoundingClientRect().top+window.pageYOffset-h-12),behavior:'smooth'});}}
        firstRun=false;
      }
      chips.forEach(function(chip){chip.addEventListener('click',function(){applyFilter(chip.getAttribute('data-filter')||'all',true,false);});});
      function fromHash(scroll){var h=window.location.hash.replace(/^#/,'');applyFilter(h||'all',false,scroll&&!!h);}
      window.addEventListener('hashchange',function(){fromHash(true);});
      fromHash(false);
      if(window.location.hash){window.addEventListener('load',function(){fromHash(true);});}
    }

    /* Mobile navigation — independent of optional browser APIs. */
    var menu=document.getElementById('mobile-menu'), openButton=document.querySelector('.menu-btn');
    if(menu && openButton){
      var closeElements=menu.querySelectorAll('[data-menu-close]'), menuLinks=menu.querySelectorAll('a');
      function setMenu(open){
        menu.classList.toggle('is-open',open);
        menu.setAttribute('aria-hidden',open?'false':'true');
        openButton.setAttribute('aria-expanded',open?'true':'false');
        openButton.setAttribute('aria-label',open?'Close menu':'Open menu');
        document.body.classList.toggle('menu-open',open);
      }
      openButton.addEventListener('click',function(e){e.preventDefault();setMenu(!menu.classList.contains('is-open'));});
      closeElements.forEach(function(el){el.addEventListener('click',function(){setMenu(false);});});
      menuLinks.forEach(function(link){link.addEventListener('click',function(){setMenu(false);});});
      document.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false);});
      window.addEventListener('resize',function(){if(window.innerWidth>1024 && !(window.matchMedia && window.matchMedia('(pointer:coarse)').matches))setMenu(false);},{passive:true});
    }
  });
})();
