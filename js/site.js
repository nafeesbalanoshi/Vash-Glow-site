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

    /* Shop: category chips + live search (works together; also #hash and ?q= links). */
    var chips=document.querySelectorAll('.filter-chip'), rows=document.querySelectorAll('.shop-page .detail-row');
    if(chips.length && rows.length){
      var GROUPS={skin:['brightening','sun','acne','scar','hydration']};
      var input=document.getElementById('shop-search'), clearBtn=document.getElementById('shop-search-clear'), emptyEl=document.getElementById('shop-empty'), resetBtn=document.getElementById('shop-reset');
      var current='all', query='';
      var haystack=[].map.call(rows,function(r){return (r.textContent+' '+r.getAttribute('data-category')).toLowerCase().replace(/\s+/g,' ');});
      function inCat(row,cat){if(cat==='all')return true;var c=row.getAttribute('data-category');return GROUPS[cat]?GROUPS[cat].indexOf(c)>-1:c===cat;}
      function render(){
        var terms=query.toLowerCase().split(/\s+/).filter(Boolean), shown=0;
        rows.forEach(function(row,i){
          var ok=inCat(row,current)&&terms.every(function(t){return haystack[i].indexOf(t)>-1;});
          row.hidden=!ok; if(ok){shown++;row.classList.add('in');}
        });
        if(emptyEl) emptyEl.hidden=shown>0;
        if(clearBtn) clearBtn.hidden=!query;
      }
      function setCategory(cat,updateHash){
        var valid=false;
        chips.forEach(function(chip){
          var on=chip.getAttribute('data-filter')===cat;
          chip.classList.toggle('active',on);chip.setAttribute('aria-pressed',on?'true':'false');
          if(on){valid=true;var bar=chip.parentNode;if(bar&&bar.scrollTo)bar.scrollTo({left:chip.offsetLeft-(bar.clientWidth-chip.offsetWidth)/2,behavior:'smooth'});}
        });
        current=valid?cat:'all'; render();
        if(updateHash&&history.replaceState)history.replaceState(null,'',current==='all'?window.location.pathname:'#'+current);
      }
      chips.forEach(function(chip){chip.addEventListener('click',function(){setCategory(chip.getAttribute('data-filter')||'all',true);});});
      if(input){
        input.addEventListener('input',function(){query=input.value.trim();render();});
        input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();input.blur();}});
        if(clearBtn)clearBtn.addEventListener('click',function(){input.value='';query='';render();input.focus();});
      }
      if(resetBtn)resetBtn.addEventListener('click',function(){if(input)input.value='';query='';setCategory('all',true);});
      function fromUrl(){
        var h=window.location.hash.replace(/^#/,''), q=new URLSearchParams(window.location.search).get('q');
        if(q&&input){input.value=q;query=q.trim();}
        if(h==='search'){setCategory('all',false);if(input){setTimeout(function(){input.scrollIntoView({block:'center',behavior:'smooth'});input.focus({preventScroll:true});},250);}}
        else{ if(h&&input&&!q){input.value='';query='';} setCategory(h||'all',false); }
      }
      window.addEventListener('hashchange',fromUrl);
      fromUrl();
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

    /* Hero carousel — lightweight, 4s autoplay, pause on hover/focus/hidden tab, swipe + dots */
    (function(){
      var hs=document.querySelector('.hs'); if(!hs) return;
      var slides=[].slice.call(hs.querySelectorAll('.hs-slide')), dots=[].slice.call(hs.querySelectorAll('.hs-dots button'));
      if(slides.length<2) return;
      var i=0, timer=null, reduce=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function go(n){
        n=(n+slides.length)%slides.length; if(n===i) return;
        slides[i].classList.remove('is-active'); slides[i].setAttribute('aria-hidden','true'); dots[i].classList.remove('is-active'); dots[i].removeAttribute('aria-current');
        i=n;
        slides[i].classList.add('is-active'); slides[i].removeAttribute('aria-hidden'); dots[i].classList.add('is-active'); dots[i].setAttribute('aria-current','true');
      }
      function stop(){ if(timer){clearInterval(timer);timer=null;} }
      function start(){ stop(); if(reduce||document.hidden) return; timer=setInterval(function(){go(i+1);},4000); }
      slides.forEach(function(s,k){ if(k) s.setAttribute('aria-hidden','true'); });
      dots.forEach(function(d,k){ d.addEventListener('click',function(){go(k);start();}); });
      hs.addEventListener('mouseenter',stop); hs.addEventListener('mouseleave',start);
      hs.addEventListener('focusin',stop); hs.addEventListener('focusout',start);
      document.addEventListener('visibilitychange',function(){ document.hidden?stop():start(); });
      var x0=null;
      hs.addEventListener('touchstart',function(e){x0=e.touches[0].clientX;},{passive:true});
      hs.addEventListener('touchend',function(e){ if(x0===null) return; var dx=e.changedTouches[0].clientX-x0; x0=null; if(Math.abs(dx)>45){go(i+(dx<0?1:-1));start();} },{passive:true});
      start();
    })();
})();
