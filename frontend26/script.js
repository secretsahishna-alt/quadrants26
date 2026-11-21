/* ========== IMAGE HELPERS ==========
   Images load from an "images" folder next to index.html (e.g. images/banana.jpg).
   You can also paste any full image URL instead. If a file is missing, a colored
   tile showing the item's name appears automatically (never an empty grey box). */
function photo(name) { return "images/" + name + ".jpg"; }

// Builds a pastel tile (as an SVG picture) with the item's name on it
function tile(name) {
    const hue = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360;
    const label = name.slice(0, 22).replace(/&/g, "&amp;");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
    <rect width='300' height='300' fill='hsl(${hue},60%,90%)'/>
    <text x='150' y='158' font-family='Arial' font-size='24' font-weight='700' text-anchor='middle' fill='hsl(${hue},45%,28%)'>${label}</text></svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// Builds an <img> tag; if the picture fails to load it switches to tile()
function img(src, alt, cls) {
    return `<img class="${cls || ""}" src="${src}" alt="${alt}" loading="lazy" onerror="this.onerror=null;this.src=tile(this.alt)">`;
}

/* ========== DATA ==========
   stores: shops (rating + distance shown in the shop header).
   categories: big groups.  products: each has ONE category and ONE store (storeId). */
const stores = [
    { id: 1, name: "FreshMart Kirana", time: "10 mins", rating: 4.3, km: 1.2, img: photo("store-freshmart") },
    { id: 2, name: "GreenLeaf Organics", time: "12 mins", rating: 4.6, km: 2.0, img: photo("store-greenleaf") },
    { id: 3, name: "City MedPlus Pharmacy", time: "8 mins", rating: 4.4, km: 0.9, img: photo("store-medplus") },
    { id: 4, name: "Daily Dairy & Bakery", time: "10 mins", rating: 4.5, km: 1.5, img: photo("store-dairy") },
    { id: 5, name: "Bengaluru Superstore", time: "15 mins", rating: 4.1, km: 3.4, img: photo("store-superstore") },
    { id: 6, name: "QuickBite Snacks", time: "9 mins", rating: 4.0, km: 1.1, img: photo("store-quickbite") }
];

const categories = [
    { id: "fruits", name: "Fruits & Vegetables", img: photo("cat-fruits") },
    { id: "dairy", name: "Dairy Products", img: photo("cat-dairy") },
    { id: "drinks", name: "Cold Drinks & Juices", img: photo("cat-drinks") },
    { id: "snacks", name: "Snacks & Munchies", img: photo("cat-snacks") },
    { id: "bakery", name: "Bakery & Eggs", img: photo("cat-bakery") },
    { id: "care", name: "Personal Care", img: photo("cat-care") }
];

const products = [
    { id: 1, cat: "fruits", storeId: 2, name: "Fresh Bananas", unit: "1 dozen", price: 49, img: photo("banana") },
    { id: 2, cat: "fruits", storeId: 2, name: "Organic Tomatoes", unit: "500 g", price: 35, img: photo("tomato") },
    { id: 3, cat: "fruits", storeId: 1, name: "Green Apples", unit: "1 kg", price: 120, img: photo("apple") },
    { id: 4, cat: "fruits", storeId: 2, name: "Fresh Spinach", unit: "250 g", price: 25, img: photo("spinach") },
    { id: 5, cat: "dairy", storeId: 4, name: "Farm Milk", unit: "500 ml", price: 32, img: photo("milk") },
    { id: 6, cat: "dairy", storeId: 4, name: "Fresh Paneer", unit: "200 g", price: 90, img: photo("paneer") },
    { id: 7, cat: "dairy", storeId: 1, name: "Thick Curd", unit: "400 g", price: 45, img: photo("curd") },
    { id: 8, cat: "dairy", storeId: 4, name: "Salted Butter", unit: "100 g", price: 58, img: photo("butter") },
    { id: 9, cat: "drinks", storeId: 5, name: "Orange Juice", unit: "1 L", price: 110, img: photo("orange-juice") },
    { id: 10, cat: "drinks", storeId: 5, name: "Cola", unit: "750 ml", price: 40, img: photo("cola") },
    { id: 11, cat: "drinks", storeId: 1, name: "Coconut Water", unit: "200 ml", price: 35, img: photo("coconut-water") },
    { id: 12, cat: "snacks", storeId: 6, name: "Classic Chips", unit: "52 g", price: 20, img: photo("chips") },
    { id: 13, cat: "snacks", storeId: 6, name: "Cream Biscuits", unit: "120 g", price: 30, img: photo("biscuits") },
    { id: 14, cat: "snacks", storeId: 5, name: "Spicy Namkeen", unit: "200 g", price: 55, img: photo("namkeen") },
    { id: 15, cat: "bakery", storeId: 4, name: "Whole Wheat Bread", unit: "400 g", price: 45, img: photo("bread") },
    { id: 16, cat: "bakery", storeId: 1, name: "Brown Eggs", unit: "12 pcs", price: 78, img: photo("eggs") },
    { id: 17, cat: "care", storeId: 3, name: "Herbal Soap", unit: "100 g", price: 58, img: photo("soap") },
    { id: 18, cat: "care", storeId: 3, name: "Mint Toothpaste", unit: "150 g", price: 89, img: photo("toothpaste") }
];

/* ========== APP STATE ==========
   cart: list of { id, qty }.
   viewScope: category id being viewed (null = search across all products).
   viewText: current search text. viewOpen: true while product view is showing. */
let cart = [];
let viewScope = null;
let viewText = "";
let viewOpen = false;
let openStoreId = null;   // which store popup is open (null = none)

/* ========== HELPERS ========== */
function getProduct(id) { return products.find(p => p.id === id); }
function getStore(id) { return stores.find(s => s.id === id); }
function getQty(id) {
    const item = cart.find(c => c.id === id);
    return item ? item.qty : 0;
}

/* ========== ADD / +/- CONTROLS ==========
   stepper(): green  - 2 +  control used inside cart and popup.
   qtyControl(): "ADD" button, or the stepper once the item is in the cart. */
function stepper(id, qty) {
    return `<div class="qty-ctrl"><button onclick="changeQty(${id}, -1)">−</button><span>${qty}</span><button onclick="changeQty(${id}, 1)">+</button></div>`;
}
function qtyControl(id) {
    const qty = getQty(id);
    return qty === 0 ? `<button class="add-outline" onclick="changeQty(${id}, 1)">ADD</button>` : stepper(id, qty);
}
// Round "+" button shown on the product image (becomes stepper when added)
function overlayControl(id) {
    const qty = getQty(id);
    return qty === 0 ? `<button class="plus-btn" onclick="changeQty(${id}, 1)" aria-label="Add">+</button>` : stepper(id, qty);
}

/* ========== HOMEPAGE ROWS ==========
   Category cards and store cards. */
function renderCategories() {
    document.getElementById("categoryRow").innerHTML = categories.map(c => `
    <button class="card" onclick="showCategory('${c.id}')">
      <div class="card-img">${img(c.img, c.name)}</div>
      <div class="card-name">${c.name}</div>
    </button>`).join("");
}
function renderStores() {
    document.getElementById("storeRow").innerHTML = stores.map(s => `
    <button class="card store" onclick="openStore(${s.id})">
      <div class="card-img">${img(s.img, s.name)}</div>
      <div class="card-name">${s.name}</div>
      <span class="badge">${s.time}</span>
    </button>`).join("");
}

/* ========== SHOP SECTIONS (the main new part) ==========
   1) Pick products in the current scope (category or all).
   2) Keep those matching the search text (product name OR shop name).
   3) Group them by shop: header on top, row of product cards below. */
function renderShopSections() {
    const text = viewText.trim().toLowerCase();
    const list = products.filter(p =>
        (viewScope === null || p.cat === viewScope) &&
        (p.name.toLowerCase().includes(text) || getStore(p.storeId).name.toLowerCase().includes(text))
    );

    let html = "";
    stores.forEach(s => {
        const items = list.filter(p => p.storeId === s.id);
        if (items.length === 0) return;   // skip shops with no matching products
        html += `
      <div class="shop-section">
        <div class="shop-header">
          ${img(s.img, s.name, "shop-logo")}
          <div>
            <div class="shop-title">${s.name}</div>
            <div class="shop-meta"><span class="rating">★ ${s.rating}</span> • ${s.time} • ${s.km} km</div>
          </div>
        </div>
        <div class="shop-products">
          ${items.map(p => `
            <div class="p-card">
              <div class="p-img">${img(p.img, p.name)}<div class="p-ctrl">${overlayControl(p.id)}</div></div>
              <div class="p-name">${p.name}</div>
              <div class="p-unit">${p.unit}</div>
              <div class="p-price">₹${p.price}</div>
            </div>`).join("")}
        </div>
      </div>`;
    });
    document.getElementById("shopSections").innerHTML = html || "<p class='cart-empty'>No products or shops found.</p>";
}

/* ========== SWITCH BETWEEN HOME AND PRODUCT VIEW ========== */
function showProductView(title) {
    viewOpen = true;
    document.getElementById("homeView").classList.add("hidden");
    document.getElementById("productView").classList.remove("hidden");
    document.getElementById("productViewTitle").textContent = title;
    renderShopSections();
}
function showHome() {
    viewOpen = false;
    viewScope = null;
    viewText = "";
    document.getElementById("searchInput").value = "";
    document.getElementById("viewSearch").value = "";
    document.getElementById("productView").classList.add("hidden");
    document.getElementById("homeView").classList.remove("hidden");
}

/* ========== OPEN A CATEGORY ==========
   Runs when a category card is clicked. */
function showCategory(catId) {
    viewScope = catId;
    viewText = "";
    document.getElementById("viewSearch").value = "";
    document.getElementById("searchInput").value = "";
    showProductView(categories.find(c => c.id === catId).name);
}

/* ========== SEARCH BOXES ==========
   Navbar search: searches ALL products (empty = back to home).
   In-view search: filters inside the category you are viewing. */
function handleNavSearch() {
    const text = document.getElementById("searchInput").value.trim();
    if (text === "") { showHome(); return; }
    viewScope = null;
    viewText = text;
    document.getElementById("viewSearch").value = text;
    showProductView("Search results");
}
function handleViewSearch() {
    viewText = document.getElementById("viewSearch").value;
    renderShopSections();
}

/* ========== STORE POPUP ==========
   Runs when a store card on the homepage is clicked. */
function openStore(id) {
    openStoreId = id;
    const s = getStore(id);
    const rows = products.filter(p => p.storeId === id).map(p => `
    <div class="modal-row">
      <div class="left">${img(p.img, p.name, "thumb")}<span>${p.name}<br><small>${p.unit} · ₹${p.price}</small></span></div>
      ${qtyControl(p.id)}
    </div>`).join("");
    document.getElementById("modalContent").innerHTML =
        `<h2>${s.name}</h2><span class="badge">${s.time}</span>${rows || "<p class='cart-empty'>No items yet.</p>"}`;
    document.getElementById("modal").classList.add("open");
}
function closeModal() {
    openStoreId = null;
    document.getElementById("modal").classList.remove("open");
}

/* ========== CHANGE QUANTITY ==========
   delta is +1 or -1. Quantity 0 removes the item. Then refresh the screen. */
function changeQty(id, delta) {
    const item = cart.find(c => c.id === id);
    if (item) { item.qty += delta; } else { cart.push({ id: id, qty: 1 }); }
    cart = cart.filter(c => c.qty > 0);
    refreshAll();
}

/* ========== REFRESH SCREEN ==========
   Redraws the cart, the shop sections (if open) and the store popup (if open)
   so every + button and quantity matches the cart. */
function refreshAll() {
    renderCart();
    if (viewOpen) renderShopSections();
    if (openStoreId !== null) openStore(openStoreId);
}

/* ========== DRAW THE CART ==========
   Right panel: image, name, SHOP NAME, price x qty, total, navbar count. */
function renderCart() {
    const box = document.getElementById("cartItems");
    let total = 0, count = 0;
    if (cart.length === 0) {
        box.innerHTML = "<p class='cart-empty'>Your cart is empty.</p>";
    } else {
        box.innerHTML = cart.map(c => {
            const p = getProduct(c.id);
            total += p.price * c.qty;
            count += c.qty;
            return `
        <div class="cart-item">
          <div class="cart-info">
            ${img(p.img, p.name, "thumb")}
            <span>${p.name}<small>${getStore(p.storeId).name}</small><small>₹${p.price} × ${c.qty} = ₹${p.price * c.qty}</small></span>
          </div>
          ${stepper(c.id, c.qty)}
        </div>`;
        }).join("");
    }
    document.getElementById("cartTotal").textContent = "₹" + total;
    document.getElementById("navCartCount").textContent = count;
}

/* ========== START THE PAGE ==========
   Runs once: draws the homepage and connects buttons. */
function init() {
    renderCategories();
    renderStores();
    renderCart();
    document.getElementById("searchInput").addEventListener("input", handleNavSearch);
    document.getElementById("viewSearch").addEventListener("input", handleViewSearch);
    document.getElementById("backBtn").addEventListener("click", showHome);
    document.getElementById("modalClose").addEventListener("click", closeModal);
    document.getElementById("modal").addEventListener("click", e => {
        if (e.target.id === "modal") closeModal();
    });
    document.getElementById("navCartBtn").addEventListener("click", () => {
        document.getElementById("cartPanel").scrollIntoView({ behavior: "smooth" });
    });
}
init();