(() => {
  if(location.pathname.startsWith('/quan-tri'))return;
  const prefKey='catfe-analytics-consent',visitorKey='catfe-visitor';
  const get=(key)=>{try{return localStorage.getItem(key)}catch{return null}};
  const put=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
  let enabled=get(prefKey)==='yes'&&navigator.doNotTrack!=='1',queue=[],started=false,observer=null,timer=null;
  let visitorId=get(visitorKey)||crypto.randomUUID(),session,notice,impressed=new WeakSet();
  try{session=JSON.parse(sessionStorage.getItem('catfe-visit')||'null')}catch{}
  function sessionInfo(){
    const now=Date.now();if(!session||now-session.last>30*60*1000)session={id:crypto.randomUUID(),last:now,via:null};
    const via=new URL(location.href).searchParams.get('via');if(via&&/^[a-f0-9]{16}$/.test(via))session.via=via;
    session.last=now;try{sessionStorage.setItem('catfe-visit',JSON.stringify(session))}catch{}return session;
  }
  function flush(beacon=false){
    if(!enabled||!queue.length)return;
    clearTimeout(timer);const batch=queue.splice(0,20),s=sessionInfo();
    const payload=JSON.stringify({consent:true,visitorId,sessionId:s.id,via:s.via,referrer:document.referrer,device:innerWidth<700?'mobile':innerWidth<1050?'tablet':'desktop',events:batch});
    if(beacon&&navigator.sendBeacon&&navigator.sendBeacon('/api/track/',new Blob([payload],{type:'application/json'})))return;
    fetch('/api/track/',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true}).then(r=>{if(r.status===409){session=null;sessionInfo()}else if(r.status>=500){queue.unshift(...batch);queue=queue.slice(0,40)}}).catch(()=>{queue.unshift(...batch);queue=queue.slice(0,40)});
  }
  function record(type,element){
    if(!enabled)return;sessionInfo();
    const target=element?new URL(element.href,location.href):null;
    const branch=['tan-phu','binh-tan','estella'].find(x=>(target?.pathname||location.pathname).includes('/'+x+'/'))||'all';
    queue.push({id:crypto.randomUUID(),at:Date.now(),type,page:location.pathname,language:document.documentElement.lang==='en'?'en':'vi',branch,ctaId:element?.dataset.trackId||null,label:element?(element.textContent.trim()||element.querySelector('img')?.alt||element.getAttribute('aria-label')||'CTA').replace(/\s+/g,' ').slice(0,120):null,target:target?(target.origin===location.origin?target.pathname:target.origin+target.pathname):null});
    clearTimeout(timer);timer=setTimeout(()=>flush(),1100);if(queue.length>=15)flush();
  }
  const eligible=a=>a.href&&!a.getAttribute('href').startsWith('#')&&!/\/(quan-tri|signin-with-chatgpt|signout-with-chatgpt)/.test(a.href)&&!a.classList.contains('skip-link');
  function scan(){
    if(!enabled)return;
    document.querySelectorAll('a[href]').forEach((a,i)=>{if(!eligible(a))return;if(!a.dataset.trackId)a.dataset.trackId=location.pathname.replace(/[^a-z0-9]/gi,'_')+'.dynamic.'+i;if(observer&&!impressed.has(a))observer.observe(a)});
  }
  function start(){
    if(started||!enabled)return;started=true;put(visitorKey,visitorId);record('page_view');
    if('IntersectionObserver'in window)observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&entry.intersectionRatio>=.5&&!impressed.has(entry.target)){impressed.add(entry.target);record('cta_view',entry.target);observer.unobserve(entry.target)}}),{threshold:.5});
    scan();
  }
  document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(a&&eligible(a)&&enabled){if(!impressed.has(a)){impressed.add(a);record('cta_view',a)}record('cta_click',a);flush(true)}});
  function choice(value){put(prefKey,value);enabled=value==='yes'&&navigator.doNotTrack!=='1';notice?.remove();notice=null;if(enabled)start();else{queue=[];clearTimeout(timer);observer?.disconnect();started=false;impressed=new WeakSet()}}
  function showNotice(){
    notice?.remove();const en=document.documentElement.lang==='en';notice=document.createElement('aside');notice.className='analytics-consent';notice.setAttribute('aria-label',en?'Analytics preferences':'Tùy chọn thống kê');
    const h=document.createElement('h2');h.textContent=en?'Help us understand your visit?':'Giúp CATFE hiểu buổi ghé của bạn?';
    const p=document.createElement('p');p.textContent=en?'With your permission, CATFE records pages viewed and links tapped. Your display name may appear if signed in. No form text or IP addresses are stored.':'Nếu bạn đồng ý, CATFE ghi nhận trang đã xem và nút đã bấm; có thể kèm tên hiển thị khi đăng nhập. Không lưu nội dung bạn nhập hoặc địa chỉ IP.';
    const actions=document.createElement('div'),yes=document.createElement('button'),no=document.createElement('button');yes.className='button';no.className='text-link';yes.type=no.type='button';yes.textContent=en?'Allow analytics':'Cho phép thống kê';no.textContent=en?'Just browse':'Chỉ xem thôi';yes.addEventListener('click',()=>choice('yes'));no.addEventListener('click',()=>choice('no'));actions.append(yes,no);notice.append(h,p,actions);document.body.append(notice);
    if(navigator.doNotTrack==='1'){yes.disabled=true;p.textContent=en?'Do Not Track is enabled in your browser. Visit analytics are paused.':'Trình duyệt đang bật Do Not Track. CATFE đang tắt thống kê cho bạn.';no.textContent=en?'Close':'Đóng'}
  }
  document.querySelectorAll('.analytics-preferences').forEach(button=>button.addEventListener('click',showNotice));
  window.addEventListener('catfe:language',()=>{if(notice)showNotice()});window.addEventListener('catfe:content',scan);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush(true)});window.addEventListener('pagehide',()=>flush(true));
  if(enabled)start();else if(!get(prefKey)&&navigator.doNotTrack!=='1')setTimeout(showNotice,1200);
})();
