(() => {
  const categories={moments:['KHOẢNH KHẮC NHỎ','LITTLE MOMENTS'],care:['THƯƠNG MÈO LÂU DÀI','CARE THAT CONTINUES'],visits:['NHỮNG LẦN LÀM QUEN','LITTLE CONNECTIONS'],events:['HẸN Ở CATFE','AT CATFE']};
  const lists=[...document.querySelectorAll('[data-blog-list]')];let posts=null;
  const element=(tag,className,text)=>{const node=document.createElement(tag);node.className=className;if(text)node.textContent=text;return node;};
  function refresh(){
    const lang=document.documentElement.lang,en=lang==='en';
    document.querySelectorAll('[data-post-vi]').forEach(node=>node.textContent=en?node.dataset.postEn:node.dataset.postVi);
    document.querySelectorAll('[data-vietnamese-only]').forEach(node=>node.hidden=!en);
    if(!posts)return;
    lists.forEach(list=>{
      const limit=Number(list.dataset.blogList),items=limit?posts.slice(0,limit):posts;
      list.replaceChildren();
      items.forEach(post=>{
        const p=post.content,title=en&&p.titleEn?p.titleEn:p.titleVi,excerpt=en&&p.excerptEn?p.excerptEn:p.excerptVi;
        const article=element('article','story-card visible'),link=element('a','story-card-image'),img=element('img','');
        link.href='/blog/'+post.slug+'/?lang='+lang;link.dataset.trackId='blog.'+post.id+'.cover';img.src=p.cover;img.alt=en&&p.altEn?p.altEn:p.altVi;img.loading='lazy';img.decoding='async';link.append(img,element('span','image-arrow','↗'));article.append(link);
        article.append(element('p','eyebrow',categories[p.category]?.[en?1:0]||'CATFE JOURNAL'));
        const h=element('h3',''),a=element('a','',title);a.href=link.href;a.dataset.trackId='blog.'+post.id+'.title';h.append(a);article.append(h,element('p','',excerpt));list.append(article);
      });
      if(!items.length)list.append(element('p','',en?'Stories will be here soon.':'Chuyện mới sẽ sớm có mặt ở đây.'));
    });
    window.dispatchEvent(new Event('catfe:content'));
  }
  window.addEventListener('catfe:language',refresh);refresh();
  if(lists.length)fetch('/api/posts/').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{posts=data.posts;refresh()}).catch(()=>{});
})();
