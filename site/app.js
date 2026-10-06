(() => {
  'use strict';
  const translations = window.CATFE_TRANSLATIONS || {};
  const storage = {get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);}catch{}}};
  const initial = new URL(location.href).searchParams.get('lang') || storage.get('catfe-language');
  let language = initial === 'en' ? 'en' : 'vi';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reducedMotion.matches || storage.get('catfe-motion') === 'paused';
  const mobileMenu = document.querySelector('#mobile-menu');
  const menuToggle = document.querySelector('.menu-toggle');
  const toast = document.querySelector('.toast');
  let toastTimer;

  function updateMotion() {
    document.body.classList.toggle('motion-paused',motionPaused);
    document.querySelectorAll('.motion-toggle').forEach(button => {
      button.textContent = language === 'en' ? (motionPaused ? 'Resume motion' : 'Pause motion') : (motionPaused ? 'Tiếp tục chuyển động' : 'Tạm dừng chuyển động');
      button.setAttribute('aria-pressed',String(motionPaused));
    });
  }
  function setLanguage(lang,persist=true) {
    language = lang === 'en' ? 'en' : 'vi';
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(node => {
      const entry = translations[node.dataset.i18n];
      if(entry) node.innerHTML = entry[language];
    });
    document.querySelectorAll('img[data-alt-vi]').forEach(node => {node.alt = node.dataset[language === 'en' ? 'altEn' : 'altVi'];});
    document.querySelectorAll('[data-lang]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.lang === language)));
    document.title = document.body.dataset[language === 'en' ? 'titleEn' : 'titleVi'];
    const description = language === 'en' ? 'CATFE — A little cat paradise in Saigon. Explore our Tân Phú, Bình Tân and Estella homes, plan your first visit and meet the cats.' : 'CATFE — Thiên đường mèo tại Sài Gòn. Chọn nhà Tân Phú, Bình Tân hoặc Estella, tìm hiểu chuyến ghé đầu tiên và làm quen với các bé.';
    document.querySelector('meta[name="description"]').content = description;
    document.querySelector('meta[property="og:description"]').content = description;
    document.querySelector('meta[property="og:title"]').content = document.title;
    document.querySelectorAll('a[href]').forEach(link => {
      const raw = link.getAttribute('href');
      if(!raw || raw.startsWith('#')) return;
      const target = new URL(raw,location.href);
      if(target.origin === location.origin && /^(https?:|file:)$/.test(target.protocol)) {
        target.searchParams.set('lang',language);
        link.href = target.href;
      }
    });
    document.querySelectorAll('.member-link').forEach(link => link.setAttribute('aria-label',link.textContent.trim() + (link.dataset.pending === 'true' ? ' — Coming soon' : '')));
    menuToggle.setAttribute('aria-label',language === 'en' ? 'Open navigation' : 'Mở menu');
    mobileMenu.setAttribute('aria-label',language === 'en' ? 'Mobile navigation' : 'Menu di động');
    updateMotion();
    window.dispatchEvent(new CustomEvent('catfe:language',{detail:language}));
    if(persist) {
      storage.set('catfe-language',language);
      const target = new URL(location.href);
      target.searchParams.set('lang',language);
      history.replaceState(null,'',target);
    }
  }
  document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click',() => setLanguage(button.dataset.lang)));
  document.querySelectorAll('.motion-toggle').forEach(button => button.addEventListener('click',() => {
    motionPaused = !motionPaused;
    storage.set('catfe-motion',motionPaused ? 'paused' : 'running');
    updateMotion();
  }));
  reducedMotion.addEventListener('change',event => {motionPaused = event.matches || storage.get('catfe-motion') === 'paused';updateMotion();});

  function toggleMenu(open,returnFocus=false) {
    mobileMenu.hidden = !open;
    menuToggle.setAttribute('aria-expanded',String(open));
    menuToggle.setAttribute('aria-label',language === 'en' ? (open ? 'Close navigation' : 'Open navigation') : (open ? 'Đóng menu' : 'Mở menu'));
    document.body.classList.toggle('menu-open',open);
    if(open) mobileMenu.querySelector('a').focus();
    else if(returnFocus) menuToggle.focus();
  }
  menuToggle.addEventListener('click',() => toggleMenu(mobileMenu.hidden));
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click',() => toggleMenu(false)));
  document.addEventListener('keydown',event => {
    if(mobileMenu.hidden) return;
    if(event.key === 'Escape') {toggleMenu(false,true);return;}
    if(event.key !== 'Tab') return;
    const links = Array.from(mobileMenu.querySelectorAll('a'));
    const first = links[0],last = links[links.length - 1];
    if(event.shiftKey && document.activeElement === first) {event.preventDefault();menuToggle.focus();}
    else if(!event.shiftKey && document.activeElement === last) {event.preventDefault();menuToggle.focus();}
    else if(document.activeElement === menuToggle) {event.preventDefault();(event.shiftKey ? last : first).focus();}
  });
  document.addEventListener('click',event => {if(!mobileMenu.hidden && !event.target.closest('.site-header')) toggleMenu(false);});
  matchMedia('(min-width: 1021px)').addEventListener('change',event => {if(event.matches) toggleMenu(false);});

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'),4500);
  }
  document.querySelectorAll('.copy-address').forEach(button => button.addEventListener('click',async() => {
    const address = button.dataset[language === 'en' ? 'copyEn' : 'copyVi'];
    try {await navigator.clipboard.writeText(address);showToast(language === 'en' ? 'Address copied. See you soon!' : 'Đã sao chép địa chỉ. Hẹn bạn ở nhà mèo!');}
    catch {showToast(address);}
  }));
  document.querySelectorAll('.faq-item').forEach(item => item.addEventListener('toggle',() => {
    if(item.open) item.parentElement.querySelectorAll('.faq-item').forEach(other => {if(other !== item) other.open = false;});
  }));
  if('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting) {entry.target.classList.add('visible');observer.unobserve(entry.target);}
    }),{threshold:.06,rootMargin:'0px 0px 35px 0px'});
    document.body.classList.add('js-motion');
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    window.addEventListener('pagehide',() => document.body.classList.remove('js-motion'));
  }
  setLanguage(language,false);
})();
