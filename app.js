/* =====================================================================
   STORE CONFIGURATION — the only place prices and checkout are set.
   - price: null  → shown as "Price coming soon" and cannot be added to cart.
   - paymentLink: a Stripe Payment Link (or similar) for that single product.
   - checkoutEndpoint: a server URL that accepts POST {items:[{id,qty}]}
     and responds {url} (e.g. a Stripe Checkout Session). Enables multi-item carts.
   Until one of these is set, checkout sends an order request by email.
   No purchase is ever marked complete by this page on its own.
   ===================================================================== */
var STORE = {
  currency: 'USD',
  checkoutEndpoint: '',
  orderEmail: 'sales@voxlumedia.com',
  successParam: 'order=success',   // set your processor's success URL to  ...?order=success
  products: {
    'card-black': { name: 'VoxCard Smart Business Card', variant: 'Premium Black', price: 39.99, paymentLink: '', image: 'voxcard-premium-black.png', imageClass: 'vcard black' },
    'card-white': { name: 'VoxCard Smart Business Card', variant: 'Classic White', price: 39.99, paymentLink: '', image: 'voxcard-classic-white.png', imageClass: 'vcard white' },
    'keychain':   { name: 'VoxCard Smart Keychain',      variant: 'Black',         price: 39.99,  paymentLink: '', image: 'voxcard-keychain-dua-sudut.png', imageClass: 'product-image keychain front' },
    'wristband':  { name: 'VoxCard Smart Wristband',     variant: 'Black',         price: 39.99,  paymentLink: '', image: 'voxcard-wristband-dua-tampilan.png', imageClass: 'product-image wristband closed' }
  }
};

(function(){
  var $ = function(s,r){return (r||document).querySelector(s)}, $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var money = function(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:STORE.currency}).format(n)};
  var hasCheckout = function(){ if (STORE.checkoutEndpoint) return true; var ids=Object.keys(cart); return ids.length===1 && !!STORE.products[ids[0]].paymentLink; };

  /* ---------- cart state (persists in this browser) ---------- */
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem('voxcart')||'{}') || {}; } catch(e){ cart = {}; }
  Object.keys(cart).forEach(function(k){ if(!STORE.products[k] || STORE.products[k].price==null) delete cart[k]; });
  function save(){ try{ localStorage.setItem('voxcart', JSON.stringify(cart)); }catch(e){} render(); }
  function add(id, qty){
    var p = STORE.products[id]; if(!p || p.price==null) return;
    cart[id] = Math.min(50,(cart[id]||0) + (qty||1)); save();
    toast(p.name.replace('VoxCard ','') + (p.variant? ' — '+p.variant:'') + ' added to cart'); openCart();
  }
  function setQty(id,q){ if(q<1) delete cart[id]; else cart[id]=Math.min(50,q); save(); }

  /* ---------- price + buy boxes from config ---------- */
  $$('[data-price]').forEach(function(el){ var p=STORE.products[el.dataset.price]; if(p && p.price!=null) el.textContent=money(p.price); });
  $$('[data-pricebox]').forEach(function(el){ var p=STORE.products[el.dataset.pricebox];
    el.innerHTML = p.price!=null ? '<div class="price">'+money(p.price)+'</div><div class="var">One-time purchase</div>' : '<div class="pending">Price coming soon</div>'; });
  $$('[data-buy]').forEach(function(el){
    var id=el.dataset.buy, p=STORE.products[id], compact=el.hasAttribute('data-compact');
    var label = id==='keychain'?'Shop Smart Keychain': id==='wristband'?'Shop Smart Wristband':'Add to cart';
    if(p.price!=null){
      el.innerHTML = (compact?'':'<div class="price buy-price">'+money(p.price)+'</div>') +
        '<button class="btn '+(compact?'':'dark ')+'block" data-add="'+id+'">'+label+'</button>';
    } else {
      el.innerHTML = (compact?'':'<div class="pending">Price coming soon</div>') +
        '<a class="btn '+(compact?'ghost':'dark')+' block" href="mailto:'+STORE.orderEmail+'?subject='+encodeURIComponent('Notify me: '+p.name)+'&body='+encodeURIComponent('Please let me know when the '+p.name+' is available to order.')+'">Notify me when available</a>';
    }
  });
  document.addEventListener('click', function(e){ var b=e.target.closest('[data-add]'); if(b) add(b.dataset.add,1); });

  /* ---------- flagship color + qty ---------- */
  var color='black';
  $$('.swatch').forEach(function(s){ s.addEventListener('click', function(){
    color=s.dataset.color;
    $$('.swatch').forEach(function(x){x.setAttribute('aria-pressed', x===s?'true':'false')});
    $('#flagBlack').classList.toggle('hide', color!=='black');
    $('#flagWhite').classList.toggle('hide', color!=='white');
    $('#flagVisual').classList.toggle('is-white', color==='white');
    $('#colorName').textContent = STORE.products['card-'+color].variant;
  });});
  var fq=$('#flagQty');
  $$('.flag-info .qty button').forEach(function(b){ b.addEventListener('click', function(){ fq.value=Math.max(1,Math.min(50,(parseInt(fq.value)||1)+parseInt(b.dataset.q))); }); });
  $('#flagAdd').addEventListener('click', function(){ add('card-'+color, Math.max(1,parseInt(fq.value)||1)); fq.value=1; });

  /* ---------- drawer ---------- */
  var drawer=$('#drawer'), scrim=$('#scrim');
  function openCart(){ drawer.classList.add('on'); scrim.classList.add('on'); drawer.setAttribute('aria-hidden','false'); }
  function closeCart(){ drawer.classList.remove('on'); scrim.classList.remove('on'); drawer.setAttribute('aria-hidden','true'); }
  $('#cartOpen').addEventListener('click', openCart); $('#cartClose').addEventListener('click', closeCart); scrim.addEventListener('click', closeCart);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeCart(); });

  function thumb(id){
    var product = STORE.products[id];
    var background = id === 'card-white' ? 'w' : 'k';
    return '<div class="d-thumb '+background+'"><div class="'+product.imageClass+'"><img src="assets/'+product.image+'" alt=""></div></div>';
  }

  function render(){
    var ids=Object.keys(cart), n=0, sub=0;
    ids.forEach(function(id){ n+=cart[id]; sub+=cart[id]*STORE.products[id].price; });
    var c=$('#cartCount'); c.textContent=n; c.dataset.n=n;
    if(!ids.length){
      $('#dItems').innerHTML='<div class="d-empty"><p>Your cart is empty.</p><p class="d-empty-action"><a href="#shop" class="btn dark sm" data-close-cart>Shop VoxCard</a></p></div>';
      $('#dFoot').innerHTML=''; return;
    }
    $('#dItems').innerHTML = ids.map(function(id){ var p=STORE.products[id];
      return '<div class="d-item">'+thumb(id)+'<div><h4>'+p.name+'</h4><small>'+p.variant+' · '+money(p.price)+'</small>'+
        '<div class="qty"><button data-dq="'+id+'" data-d="-1" aria-label="Decrease">−</button><input value="'+cart[id]+'" data-qi="'+id+'" aria-label="Quantity"><button data-dq="'+id+'" data-d="1" aria-label="Increase">+</button></div></div>'+
        '<div class="right">'+money(cart[id]*p.price)+'<button class="rm" data-rm="'+id+'">Remove</button></div></div>'; }).join('');
    var allCards = ids.every(function(id){return id.indexOf('card-')===0});
    $('#dFoot').innerHTML =
      '<div class="d-row"><span>Subtotal</span><span>'+money(sub)+'</span></div>'+
      '<div class="d-row"><span>Shipping</span><span>'+(allCards?'Free (US)':'Calculated at checkout')+'</span></div>'+
      '<div class="d-row total"><span>Total before tax</span><span>'+money(sub)+'</span></div>'+
      '<button class="btn dark block" id="checkoutBtn">'+(hasCheckout()?'Secure checkout':'Request my order')+'</button>'+
      (hasCheckout()? '<p class="d-note">You\'ll complete payment on our secure checkout page.</p>' :
        '<div class="d-pending"><b>Secure online payment is being connected.</b> Send your order now and our team will reply with a secure payment link and confirm delivery. Nothing is charged until you pay that link.</div>');
    $('#checkoutBtn').addEventListener('click', checkout);
  }
  $('#dItems').addEventListener('click', function(e){
    if(e.target.closest('[data-close-cart]')) { closeCart(); return; }
    var d=e.target.closest('[data-dq]'); if(d){ setQty(d.dataset.dq,(cart[d.dataset.dq]||0)+parseInt(d.dataset.d)); return; }
    var r=e.target.closest('[data-rm]'); if(r){ setQty(r.dataset.rm,0); }
  });
  $('#dItems').addEventListener('change', function(e){ var i=e.target.closest('[data-qi]'); if(i) setQty(i.dataset.qi, parseInt(i.value)||0); });

  /* ---------- checkout ---------- */
  function checkout(){
    var ids=Object.keys(cart); if(!ids.length) return;
    var btn=$('#checkoutBtn');
    if(STORE.checkoutEndpoint){
      btn.disabled=true; btn.textContent='Opening secure checkout…';
      fetch(STORE.checkoutEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:ids.map(function(id){return{id:id,qty:cart[id]}})})})
        .then(function(r){ if(!r.ok) throw 0; return r.json(); })
        .then(function(d){ if(!d.url) throw 0; window.location.href=d.url; })
        .catch(function(){ btn.disabled=false; btn.textContent='Secure checkout'; toast('Checkout is unavailable right now. Please try again or email '+STORE.orderEmail); });
      return;
    }
    if(ids.length===1 && STORE.products[ids[0]].paymentLink){
      window.location.href = STORE.products[ids[0]].paymentLink; return;
    }
    var lines = ids.map(function(id){var p=STORE.products[id]; return '- '+cart[id]+' x '+p.name+' ('+p.variant+') @ '+money(p.price);}).join('\n');
    var total = ids.reduce(function(s,id){return s+cart[id]*STORE.products[id].price},0);
    var body = 'Hi VoxCard team,\n\nI would like to order:\n'+lines+'\n\nSubtotal: '+money(total)+'\n\nName:\nShipping address:\nPhone:\n\nPlease send me a secure payment link.\n';
    window.location.href = 'mailto:'+STORE.orderEmail+'?subject='+encodeURIComponent('VoxCard order request')+'&body='+encodeURIComponent(body);
  }

  /* ---------- order confirmation (only when returning from the payment processor) ---------- */
  $('#dismissOrderBanner').addEventListener('click', function(){ $('#orderBanner').classList.remove('on'); });
  if (location.search.indexOf(STORE.successParam) !== -1) {
    cart={}; save(); $('#orderBanner').classList.add('on');
    history.replaceState(null,'',location.pathname+location.hash);
  }

  /* ---------- UI chrome ---------- */
  var toastT; function toast(m){ var t=$('#toast'); t.textContent=m; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(function(){t.classList.remove('on')},2400); }
  var nav=$('#nav'), sticky=$('#sticky'), navShop=$('#navShop');
  function onScroll(){ var y=window.scrollY; nav.classList.toggle('scrolled', y>10);
    var shop=$('#shop').getBoundingClientRect(); var inShop = shop.top<window.innerHeight && shop.bottom>0;
    sticky.classList.toggle('on', y>window.innerHeight*0.8 && !inShop);
    navShop.classList.toggle('visible', y>window.innerHeight*0.6);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  onScroll();
  $('#yr').textContent = new Date().getFullYear();
  var els=$$('.reveal');
  if('IntersectionObserver' in window){ var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){e.target.classList.add('in'); io.unobserve(e.target);} })},{threshold:.12}); els.forEach(function(el){io.observe(el)}); }
  else els.forEach(function(el){el.classList.add('in')});
  render();
})();
