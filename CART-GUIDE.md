# Vash Glow — Multi-Product Cart + WhatsApp Checkout

Ye guide batati hai ke aapki static GitHub Pages website mein naya
**"Multi-Product Add to Cart with WhatsApp Checkout"** system kaise kaam
karta hai aur ise kaise customize karna hai.

---

## 1. Kya add hua? (What's new)

| File | Kaam |
|------|------|
| `cart.css` | Cart Drawer ka poora design (slide-in sidebar, buttons, rows). |
| `cart.js` | Cart logic — localStorage state, add-to-cart, drawer, WhatsApp checkout. |
| `*.html` (30 pages) | Header mein cart icon + drawer block + script link add hua, aur product buttons `ADD TO CART` ban gaye. |

Koi external library nahi — 100% lightweight vanilla JavaScript.

---

## 2. Cart Drawer UI (HTML + CSS)

Har page ke `</body>` se pehle ye **HTML block** inject hua hai:

```html
<div class="vg-cart-overlay" id="vg-cart-overlay" aria-hidden="true"></div>
<aside class="vg-cart-drawer" id="vg-cart-drawer" role="dialog" aria-modal="true"
       aria-label="Shopping cart" aria-hidden="true">
  <div class="vg-cart-head">
    <h2 class="vg-cart-title">Your Cart <span class="vg-cart-head-count" id="vg-cart-head-count">0</span></h2>
    <button type="button" class="vg-cart-close" id="vg-cart-close" aria-label="Close cart">…</button>
  </div>
  <div class="vg-cart-body">
    <div class="vg-cart-empty" id="vg-cart-empty">…</div>
    <ul class="vg-cart-items" id="vg-cart-items"></ul>
  </div>
  <div class="vg-cart-foot" id="vg-cart-foot">
    <div class="vg-cart-total-row">
      <span class="vg-cart-total-label">Total</span>
      <span class="vg-cart-total-value" id="vg-cart-total">Rs. 0</span>
    </div>
    <button type="button" class="vg-cart-checkout" id="vg-cart-checkout">
      <span>Proceed to WhatsApp Checkout</span>
    </button>
  </div>
</aside>
```

**Design specs (jaisa aapne maanga):**

- Drawer background: **Pure White `#FFFFFF`**
- Borders: **`1px solid #E5E7EB`**
- Title color: **Midnight Slate `#1E293B`**
- Checkout button: **full-width, Deep Obsidian Black `#111827`, white UPPERCASE text**
- Default hidden → cart icon click par **right side se smoothly slide-in** (CSS `transform: translateX`)

Header ke right corner mein cart icon hai:

```html
<button type="button" class="ic-btn vg-cart-toggle" aria-label="Open cart">
  <svg>…cart icon…</svg>
  <span class="vg-cart-count">0</span>   <!-- live item count badge -->
</button>
```

---

## 3. Dynamic Product Actions

Pehle jo **"Order on WhatsApp"** button tha, wo product cards aur product
detail pages par ab **"ADD TO CART"** hai:

```html
<button type="button" class="btn btn-primary btn-shine vg-add-btn"
        data-add-to-cart
        data-id="advanced-brightening-face-wash"
        data-name="Advanced Brightening Face Wash"
        data-price="1250"
        data-img="images/face-wash.jpg">
  <svg class="vg-add-icon">…</svg>
  <span class="vg-add-label">ADD TO CART</span>
</button>
```

**Kaam kaise karta hai:** button click → item cart array mein push →
`localStorage` mein save → drawer open → item live show + total update.

> Note: Footer aur mobile-menu ke generic "Order on WhatsApp" buttons
> (jo kisi ek product se related nahi) waise hi rakhe gaye hain.

---

## 4. JavaScript Logic Matrix (WhatsApp Multi-Order Parser)

### Local State Management
Cart `localStorage` key `vashglow_cart_v1` mein save hota hai, is liye
**page refresh par data remove nahi hota**. Format:

```json
[
  { "id": "skin-brightening-cream", "name": "Skin Brightening Cream",
    "price": 1450, "img": "images/brightening-cream.jpg", "qty": 2 }
]
```

### Checkout message generator
Checkout button par click → cart read → loop → message string:

```
Hi Vash Glow, I would like to place an order for the following routines:

- 2x Skin Brightening Cream (Rs. 1,450)
- 1x Sun Defense Cream (Rs. 1,150)
- 1x ANAEXO Anti Hair Fall & Hair Growth Serum (Rs. 2,260)

Total Order Amount: Rs. 6,310
```

- **Header:** `Hi Vash Glow, I would like to place an order for the following routines:`
- **Body loop:** `- [Qty]x [Product Name] (Rs. [Price])`
- **Footer:** `Total Order Amount: Rs. [Total_Sum]`

Phir poora string `encodeURIComponent()` se URL-encode ho kar direct
WhatsApp par redirect karta hai:

```
https://wa.me/923317070775?text=<Encoded_Message_String>
```

---

## 5. Customize karna (How to change things)

### WhatsApp number badalna
`cart.js` ki pehli lines mein:

```js
var WHATSAPP_NUMBER = '923317070775';   // <-- apna number (country code ke saath, no +)
```

### Naya product add karna
Kisi bhi page par simple button likh dein:

```html
<button type="button" class="btn btn-primary vg-add-btn"
        data-add-to-cart data-id="my-product"
        data-name="My Product" data-price="999" data-img="images/my-product.jpg">
  <span class="vg-add-label">ADD TO CART</span>
</button>
```

### Drawer colors badalna
`cart.css` mein values edit karein (`#FFFFFF`, `#E5E7EB`, `#1E293B`, `#111827`).

### Cart clear karna (testing)
Browser console mein: `localStorage.removeItem('vashglow_cart_v1')`

---

## 6. GitHub Pages par deploy

1. `vashglow/` folder ki saari files apne repo mein push karein
   (`cart.css`, `cart.js` include karna na bhoolein).
2. Jekyll permalinks (`permalink: /shop` waghera) waise hi rahenge,
   is liye extension-less links (`href="shop"`) GitHub Pages par theek chalenge.
3. `Settings → Pages` se branch select karein. Bas! ✅

> `CART-GUIDE.md` ko aap repo mein rakh sakte hain ya delete kar sakte hain —
> website par koi asar nahi padega.
