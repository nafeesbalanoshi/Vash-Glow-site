/* ============================================================
   VASH GLOW — Multi-Product "Add to Cart" + WhatsApp Checkout
   ------------------------------------------------------------
   • localStorage state  -> cart survives page refresh
   • [data-add-to-cart]  -> pushes item into cart array
   • Slide-in drawer UI  -> live render of added items
   • Checkout            -> loops cart, builds WhatsApp message,
                            URL-encodes it and opens wa.me link
   No dependencies. Safe to include on every page.
   ============================================================ */
(function () {
  'use strict';

  /* -------- configuration -------- */
  var WHATSAPP_NUMBER = '923317070775';       /* Vash Glow WhatsApp */
  var STORAGE_KEY     = 'vashglow_cart_v1';
  var CURRENCY        = 'Rs. ';

  /* -------- state (loaded from localStorage) -------- */
  var cart = readStore();
  var drawer = null, overlay = null;

  /* =========================================================
     STATE HELPERS
     ========================================================= */
  function readStore() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (i) {
        return i && i.id && typeof i.price === 'number' && typeof i.qty === 'number';
      });
    } catch (e) { return []; }
  }
  function writeStore() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {}
  }
  function indexOf(id) {
    for (var i = 0; i < cart.length; i++) { if (cart[i].id === id) return i; }
    return -1;
  }
  function addItem(item) {
    var i = indexOf(item.id);
    if (i > -1) { cart[i].qty += item.qty; }
    else {
      cart.push({
        id: item.id, name: item.name, price: item.price,
        img: item.img || '', qty: item.qty
      });
    }
    writeStore(); render(); openDrawer(); bumpIcon();
  }
  function removeItem(id) {
    var i = indexOf(id);
    if (i > -1) { cart.splice(i, 1); writeStore(); render(); }
  }
  function changeQty(id, delta) {
    var i = indexOf(id);
    if (i < 0) return;
    cart[i].qty += delta;
    if (cart[i].qty < 1) cart.splice(i, 1);
    writeStore(); render();
  }
  function cartTotal() {
    return cart.reduce(function (t, i) { return t + (i.price * i.qty); }, 0);
  }
  function cartCount() {
    return cart.reduce(function (c, i) { return c + i.qty; }, 0);
  }

  /* =========================================================
     FORMATTING / SAFETY
     ========================================================= */
  function money(n) { return CURRENCY + Number(n || 0).toLocaleString('en-US'); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* =========================================================
     RENDER — drawer contents + badges
     ========================================================= */
  function render() {
    var list  = document.getElementById('vg-cart-items');
    var empty = document.getElementById('vg-cart-empty');
    var foot  = document.getElementById('vg-cart-foot');
    var totalEl = document.getElementById('vg-cart-total');
    var headCount = document.getElementById('vg-cart-head-count');
    var checkout = document.getElementById('vg-cart-checkout');
    if (!list) return;

    list.innerHTML = '';
    cart.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'vg-cart-item';
      li.setAttribute('data-id', item.id);

      var thumb = item.img
        ? '<img class="vg-ci-thumb" src="' + esc(item.img) + '" alt="" loading="lazy" ' +
          'onerror="this.style.visibility=\'hidden\'">'
        : '<span class="vg-ci-thumb vg-ci-thumb--ph" aria-hidden="true"></span>';

      li.innerHTML =
        thumb +
        '<div class="vg-ci-main">' +
          '<div class="vg-ci-top">' +
            '<span class="vg-ci-name">' + esc(item.name) + '</span>' +
            '<span class="vg-ci-line">' + money(item.price * item.qty) + '</span>' +
          '</div>' +
          '<span class="vg-ci-price">' + money(item.price) + ' each</span>' +
          '<div class="vg-ci-controls">' +
            '<div class="vg-ci-qty">' +
              '<button type="button" data-ci="dec" aria-label="Decrease quantity">\u2212</button>' +
              '<span data-ci="qty">' + item.qty + '</span>' +
              '<button type="button" data-ci="inc" aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<button type="button" class="vg-ci-remove" data-ci="remove">Remove</button>' +
          '</div>' +
        '</div>';

      list.appendChild(li);
    });

    var has = cart.length > 0;
    if (empty) empty.style.display = has ? 'none' : 'flex';
    list.style.display = has ? 'block' : 'none';
    if (foot) foot.style.display = has ? 'block' : 'none';
    if (totalEl) totalEl.textContent = money(cartTotal());
    if (headCount) headCount.textContent = String(cartCount());
    if (checkout) checkout.disabled = !has;

    var count = cartCount();
    document.querySelectorAll('.vg-cart-count').forEach(function (b) {
      b.textContent = String(count);
      b.classList.toggle('is-visible', count > 0);
    });
  }

  /* =========================================================
     DRAWER OPEN / CLOSE
     ========================================================= */
  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.classList.add('is-open');
    document.body.classList.add('vg-cart-open');
    var t = document.querySelector('.vg-cart-toggle');
    if (t) t.setAttribute('aria-expanded', 'true');
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.classList.remove('is-open');
    document.body.classList.remove('vg-cart-open');
    var t = document.querySelector('.vg-cart-toggle');
    if (t) t.setAttribute('aria-expanded', 'false');
  }
  function bumpIcon() {
    var t = document.querySelector('.vg-cart-toggle');
    if (!t) return;
    t.classList.remove('is-bump');
    void t.offsetWidth; /* reflow to restart animation */
    t.classList.add('is-bump');
  }

  /* =========================================================
     CHECKOUT — WhatsApp multi-order message parser
     ========================================================= */
  function checkout() {
    if (!cart.length) return;

    /* Body loop: "- [Qty]x [Product Name] (Rs. [Price])" */
    var lines = cart.map(function (i) {
      return '- ' + i.qty + 'x ' + i.name + ' (' + money(i.price) + ')';
    });

    var message =
      'Hi Vash Glow, I would like to place an order for the following routines:\n\n' +
      lines.join('\n') +
      '\n\nTotal Order Amount: ' + money(cartTotal());

    var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener');
  }

  /* =========================================================
     EVENT DELEGATION (works for static + dynamic buttons)
     ========================================================= */
  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!target || !target.closest) return;

    /* --- ADD TO CART --- */
    var addBtn = target.closest('[data-add-to-cart]');
    if (addBtn) {
      e.preventDefault();
      var id    = addBtn.getAttribute('data-id');
      var name  = addBtn.getAttribute('data-name') || 'Product';
      var price = parseInt(addBtn.getAttribute('data-price'), 10) || 0;
      var img   = addBtn.getAttribute('data-img') || '';

      /* read quantity from the product-page stepper if present */
      var qty = 1;
      var scope = addBtn.closest('.pd-info, .pd2, .bundle-card, .card, .detail-body') || document;
      var qtyVal = scope.querySelector('.qty-stepper .qty-val');
      if (qtyVal) { qty = parseInt(qtyVal.textContent, 10) || 1; }

      addItem({ id: id, name: name, price: price, img: img, qty: qty });

      /* button feedback */
      var label = addBtn.querySelector('.vg-add-label');
      if (label && !addBtn.classList.contains('is-added')) {
        var prev = label.textContent;
        label.textContent = 'ADDED \u2713';
        addBtn.classList.add('is-added');
        window.setTimeout(function () {
          label.textContent = prev;
          addBtn.classList.remove('is-added');
        }, 1400);
      }
      return;
    }

    /* --- drawer toggle --- */
    var toggle = target.closest('.vg-cart-toggle');
    if (toggle) {
      e.preventDefault();
      if (drawer && drawer.classList.contains('is-open')) closeDrawer(); else openDrawer();
      return;
    }

    /* --- close button --- */
    if (target.closest('#vg-cart-close')) { e.preventDefault(); closeDrawer(); return; }

    /* --- overlay click --- */
    if (overlay && target === overlay) { closeDrawer(); return; }

    /* --- checkout --- */
    if (target.closest('#vg-cart-checkout')) { e.preventDefault(); checkout(); return; }

    /* --- item qty / remove --- */
    var ctrl = target.closest('[data-ci]');
    if (ctrl) {
      var li = ctrl.closest('.vg-cart-item');
      if (!li) return;
      var itemId = li.getAttribute('data-id');
      var act = ctrl.getAttribute('data-ci');
      if (act === 'inc') changeQty(itemId, 1);
      else if (act === 'dec') changeQty(itemId, -1);
      else if (act === 'remove') removeItem(itemId);
      return;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  /* =========================================================
     UI SHELL — inject drawer + header icon if missing
     ========================================================= */
  function drawerMarkup() {
    return '' +
      '<div class="vg-cart-overlay" id="vg-cart-overlay" aria-hidden="true"></div>' +
      '<aside class="vg-cart-drawer" id="vg-cart-drawer" role="dialog" aria-modal="true" ' +
             'aria-label="Shopping cart" aria-hidden="true">' +
        '<div class="vg-cart-head">' +
          '<h2 class="vg-cart-title">Your Cart ' +
            '<span class="vg-cart-head-count" id="vg-cart-head-count">0</span></h2>' +
          '<button type="button" class="vg-cart-close" id="vg-cart-close" aria-label="Close cart">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="vg-cart-body">' +
          '<div class="vg-cart-empty" id="vg-cart-empty">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true">' +
              '<path d="M3 4h2l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L21 8H6"/>' +
              '<circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/></svg>' +
            '<p>Your cart is empty</p>' +
            '<span>Add your favourite formulas to get started.</span>' +
            '<a class="vg-cart-shop-link" href="shop">Browse Products</a>' +
          '</div>' +
          '<ul class="vg-cart-items" id="vg-cart-items"></ul>' +
        '</div>' +
        '<div class="vg-cart-foot" id="vg-cart-foot">' +
          '<div class="vg-cart-total-row">' +
            '<span class="vg-cart-total-label">Total</span>' +
            '<span class="vg-cart-total-value" id="vg-cart-total">Rs. 0</span>' +
          '</div>' +
          '<p class="vg-cart-note">Shipping &amp; delivery details confirmed on WhatsApp.</p>' +
          '<button type="button" class="vg-cart-checkout" id="vg-cart-checkout">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true">' +
              '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99 0-1.42.75-2.12 1.01-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .54.01.17.01.41-.07.64.49.24.57.81 1.99.88 2.13.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.69-.81.88-1.09.19-.28.38-.23.63-.14.26.09 1.63.77 1.91.91.28.14.47.21.54.33.07.12.07.68-.17 1.36z"/>' +
            '</svg>' +
            '<span>Proceed to WhatsApp Checkout</span>' +
          '</button>' +
        '</div>' +
      '</aside>';
  }
  function iconMarkup() {
    return '' +
      '<button type="button" class="ic-btn vg-cart-toggle" aria-label="Open cart" ' +
              'aria-controls="vg-cart-drawer" aria-expanded="false">' +
        '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" ' +
             'stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M3 4h2l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L21 8H6"/>' +
          '<circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/></svg>' +
        '<span class="vg-cart-count" aria-hidden="true">0</span>' +
      '</button>';
  }
  function ensureUI() {
    drawer  = document.getElementById('vg-cart-drawer');
    overlay = document.getElementById('vg-cart-overlay');
    if (!drawer) {
      var wrap = document.createElement('div');
      wrap.innerHTML = drawerMarkup();
      while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
      drawer  = document.getElementById('vg-cart-drawer');
      overlay = document.getElementById('vg-cart-overlay');
    }
    if (!document.querySelector('.vg-cart-toggle')) {
      var navRight = document.querySelector('header .nav-right');
      var host = navRight || document.querySelector('header .nav') || document.querySelector('header');
      if (host) host.insertAdjacentHTML('beforeend', iconMarkup());
    }
  }

  /* =========================================================
     INIT
     ========================================================= */
  function init() {
    ensureUI();
    render();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
