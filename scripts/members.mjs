// CATFE's supplied member boards are the source of names and personality copy.
export function memberViews({cats, t, tt, href, image, link, eyebrow, esc, arrow, paw, pageIntro}) {
  const groupTitles = {
    'maine-coon': ['Gia tộc Maine Coon', 'The Maine Coon family'],
    'short-legs': ['Hội chân ngắn', 'The little short-leg club'],
    british: ['Những gương mặt Anh quốc', 'The British cat crew'],
    scottish: ['Hội mèo Scottish', 'The Scottish crew'],
    sphynx: ['Hội không lông', 'The Sphynx crew'],
    bengal: ['Biệt đội Bengal', 'The Bengal gang'],
    persian: ['Một chút bông Ba Tư', 'A little Persian fluff'],
  };
  const portrait = (c, eager=false) => image(c.image,c.imageAlt?.vi||c.name,c.imageAlt?.en||c.name,'resident-portrait',eager);
  const facts = c => `<div class="resident-facts"><span>${tt(c.breed)}</span>${c.birthYear?`<span>${t('Sinh năm '+c.birthYear,'Born in '+c.birthYear)}</span>`:''}${c.sex?`<span>${t(c.sex==='male'?'Bé trai':'Bé gái',c.sex==='male'?'Male':'Female')}</span>`:''}${c.ageOnRoster?`<span>${t(c.ageOnRoster+' tuổi',c.ageOnRoster+' years old')}</span>`:''}</div>`;
  const memberCard = (b,c) => `<article class="member-card resident-card reveal" data-cat-name="${esc(c.name)}"><a href="${href(b.slug+'/cats/'+c.slug+'/')}"><div class="resident-portrait-wrap">${portrait(c)}</div><h2>${esc(c.name)}</h2><div class="resident-breed">${tt(c.breed)}</div><p>${tt(c.personality)}</p><span class="resident-more">${t('Làm quen với bé','Meet this cat')}${arrow}</span></a></article>`;
  function callout(b) {
    const members=cats[b.slug]||[];
    return `<div class="member-callout${members.length?' has-residents':''}">${members.length?`<div class="resident-stack" aria-hidden="true">${members.slice(0,3).map(c=>image(c.image,'','','')).join('')}</div>`:''}<div>${eyebrow('NHỮNG THÀNH VIÊN CỦA NHÀ','THE RESIDENTS OF THIS HOME')}<h3>${t('Gặp các bé '+b.short,'Meet the '+b.short+' cats')}</h3><p>${members.length?t(members.length+' gương mặt, mỗi bé một tính. Bạn muốn làm quen với ai trước?',members.length+' little faces, each with a character of their own. Who will you meet first?'):t('Ảnh, tên và tính cách riêng của từng bé sẽ sớm có mặt ở đây.','Photos, names and distinct little personalities will be here soon.')}</p>${link(b.slug+'/cats/','Tới trang thành viên','Meet the residents','text-link')}${members.length?'':'<span class="coming-label">Coming soon</span>'}</div></div>`;
  }
  function index(b) {
    const members=cats[b.slug]||[];
    const intro=pageIntro('Các bé nhà <em>'+b.short+'.</em>','The cats of <em>'+b.short+'.</em>','Mỗi bé một gương mặt. Mỗi bé một cách làm quen.','Different little faces. Different ways to become friends.','THÀNH VIÊN · '+b.name,'RESIDENTS · '+b.name);
    const groups=[...new Set(members.map(c=>c.group))];
    return intro+`<section class="section wrap residents-section"><div class="residents-intro"><a class="breadcrumb" href="${href(b.slug+'/')}">← ${b.name}</a><p>${t('Cả hội '+members.length+' gương mặt. Có bé quấn người, có bé cần một lời chào thật chậm.','A family of '+members.length+' little faces. Some love company; others prefer a slower hello.')}</p></div>${groups.map(g=>{const title=groupTitles[g]||[g,g];return `<section class="resident-group"><div class="resident-group-heading"><h2>${t(...title)}</h2><span>${members.filter(c=>c.group===g).length}</span></div><div class="member-grid resident-grid">${members.filter(c=>c.group===g).map(c=>memberCard(b,c)).join('')}</div></section>`;}).join('')}<p class="resident-note">${paw}${t('Tính cách là một lời giới thiệu. Khi ghé, hỏi nhân viên xem hôm nay bé muốn làm quen thế nào nhé.','A personality note is a first introduction. Ask the team how each cat feels about meeting you today.')}</p></section>`;
  }
  function profile(b,c) {
    const siblings=cats[b.slug]||[],i=siblings.indexOf(c),friends=[siblings[(i+1)%siblings.length],siblings[(i+2)%siblings.length],siblings[(i+3)%siblings.length]];
    return `<section class="section wrap resident-profile"><a class="breadcrumb" href="${href(b.slug+'/cats/')}">← ${t('Các bé nhà '+b.short,'The '+b.short+' residents')}</a><div class="profile-layout"><div class="profile-photo resident-profile-photo"><div class="resident-profile-orbit">${portrait(c,true)}<span class="profile-paw" aria-hidden="true">${paw}</span></div><p>${t('Một thành viên của nhà '+b.short+'.','A little member of the '+b.short+' family.')}</p></div><div class="profile-copy">${eyebrow('THÀNH VIÊN NHÀ '+b.short.toUpperCase(),b.short.toUpperCase()+' RESIDENT')}<h1>${esc(c.name)}</h1>${facts(c)}<div class="resident-personality"><h2>${t('Một chút về mình.','A little about me.')}</h2><p class="lead">${tt(c.personality)}</p></div><div class="resident-hello"><h3>${t('Mình làm quen nhé.','Let’s say hello.')}</h3><p>${t('Quan sát màu vòng cổ và hỏi nhân viên trước khi tương tác. Nếu bé đang nghỉ hoặc chưa muốn lại gần, cứ cho bé một chút không gian.','Notice the collar colour and ask the team before interacting. If this little resident is resting or keeping a distance, give them some space.')}</p></div>${link(b.slug+'/','Ghé nhà '+b.short,'Visit '+b.short,'button')}${link(b.slug+'/cats/','Gặp các bạn cùng nhà','Meet the other residents')}</div></div></section><section class="section wrap resident-friends"><div class="resident-group-heading"><h2>${t('Cùng một nhà.<br><em>Mỗi bé một tính.</em>','One little home.<br><em>A character in every cat.</em>')}</h2></div><div class="member-grid resident-grid">${friends.map(c=>memberCard(b,c)).join('')}</div></section>`;
  }
  return {callout,index,profile};
}
