import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {handleApi,getPublishedPost,serveMedia} from '../server/core.mjs';
function database(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(fs.readFileSync(new URL('../drizzle/0000_furry_mentallo.sql',import.meta.url),'utf8'));
 return {
  prepare(sql){return {bind(...params){return {
   async first(){return sqlite.prepare(sql).get(...params)||null;},
   async all(){return {results:sqlite.prepare(sql).all(...params)};},
   async run(){const result=sqlite.prepare(sql).run(...params);return {meta:{changes:Number(result.changes)}};}
  };}};},
  async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}
 };
}

function fixture(){const bucket=new Map();return{DB:database(),CATFE_OWNER_EMAIL:'owner@example.test',BUCKET:{async put(key,value,meta){bucket.set(key,{body:value,...meta})},async get(key){return bucket.get(key)||null},async delete(key){bucket.delete(key)}}};}
const owner={'oai-authenticated-user-id':'site-owner-test','oai-authenticated-user-email':'owner@example.test','oai-authenticated-user-full-name':encodeURIComponent('Chủ CATFE'),'oai-authenticated-user-full-name-encoding':'percent-encoded-utf-8'};
function req(path,method='GET',data,headers={}){return new Request('https://catfe.test'+path,{method,headers:{Origin:'https://catfe.test','User-Agent':'Mozilla/5.0',...headers,...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});}
const post={titleVi:'Một chuyện thử',titleEn:'A test story',excerptVi:'Mô tả thử',excerptEn:'A test excerpt',bodyVi:'Một đoạn thật.\n\nĐoạn tiếp theo.',bodyEn:'An English paragraph.',cover:'/assets/hero.jpg',altVi:'Ảnh mèo',altEn:'A cat',category:'moments',branch:'tan-phu'};
test('Blog: authenticated owner, drafts, publish snapshots, revision conflict, unpublish',async()=>{
 const env=fixture();assert.equal((await handleApi(req('/api/admin/posts'),env)).status,401);
 assert.equal((await handleApi(req('/api/admin/posts','GET',undefined,{'oai-authenticated-user-id':'stranger','oai-authenticated-user-email':'stranger@example.test'}),env)).status,403);
 assert.equal((await handleApi(req('/api/admin/posts','POST',{content:post},owner),env)).status,201);
 let data=await (await handleApi(req('/api/admin/posts','GET',undefined,owner),env)).json();let saved=data.posts.find(p=>p.draft.titleVi===post.titleVi);
 assert.equal(await getPublishedPost(env.DB,saved.slug),null);
 const cross=req('/api/admin/posts/'+saved.id,'PUT',{mode:'publish',version:saved.version,content:post},{...owner,Origin:'https://evil.test'});assert.equal((await handleApi(cross,env)).status,403);
 data=await (await handleApi(req('/api/admin/posts/'+saved.id,'PUT',{mode:'publish',version:saved.version,content:post},owner),env)).json();saved=data.post;
 assert.equal((await getPublishedPost(env.DB,saved.slug)).content.bodyVi,post.bodyVi);
 assert.equal((await handleApi(req('/api/admin/posts/'+saved.id,'PUT',{mode:'draft',version:1,content:post},owner),env)).status,409);
 data=await (await handleApi(req('/api/admin/posts/'+saved.id,'PUT',{mode:'draft',version:saved.version,content:{...post,titleVi:'Bản sửa chưa đăng'}},owner),env)).json();saved=data.post;
 assert.equal((await getPublishedPost(env.DB,saved.slug)).content.titleVi,post.titleVi);
 assert.equal((await handleApi(req('/api/admin/posts/'+saved.id,'PUT',{mode:'publish',version:saved.version,content:{...post,bodyEn:''}},owner),env)).status,400);
 await handleApi(req('/api/admin/posts/'+saved.id,'PUT',{mode:'unpublish',version:saved.version},owner),env);
 assert.equal(await getPublishedPost(env.DB,saved.slug),null);
 const publicPosts=await (await handleApi(req('/api/posts'),env)).json();assert.equal(publicPosts.posts.length,3);
});
test('Uploads: JPG/PNG/WebP signatures, draft image privacy, persistent object reference',async()=>{
 const env=fixture();const form=new FormData();form.append('file',new Blob([new Uint8Array([137,80,78,71,13,10,26,10,1,2,3])],{type:'image/png'}),'cat.png');
 const upload=new Request('https://catfe.test/api/admin/media',{method:'POST',headers:{Origin:'https://catfe.test',...owner},body:form});const result=await handleApi(upload,env);assert.equal(result.status,201);const media=await result.json();
 assert.equal((await serveMedia(req(media.url),env,media.id)).status,404);
 assert.equal((await serveMedia(req(media.url,'GET',undefined,owner),env,media.id)).status,200);
 await handleApi(req('/api/admin/posts','POST',{content:{...post,cover:media.url},mode:'publish'},owner),env);
 assert.equal((await serveMedia(req(media.url),env,media.id)).status,200);
 const svg=new FormData();svg.append('file',new Blob(['<svg onload="alert(1)"></svg>'],{type:'image/svg+xml'}),'unsafe.svg');
 assert.equal((await handleApi(new Request('https://catfe.test/api/admin/media',{method:'POST',headers:{Origin:'https://catfe.test',...owner},body:svg}),env)).status,400);
});
test('Analytics: consent, deduplication, chronological journey, verified name and labelled link',async()=>{
 const env=fixture();const link=await(await handleApi(req('/api/admin/links','POST',{label:'Link gửi Bách',destination:'/'},owner),env)).json();assert.ok(link.id);
 const visitorId=crypto.randomUUID(),sessionId=crypto.randomUUID(),now=Date.now();
 const payload={consent:true,visitorId,sessionId,via:link.id,device:'desktop',referrer:'https://example.com/private?secret=abc',displayName:'Invented name',events:[
 {id:crypto.randomUUID(),at:now-2000,type:'page_view',page:'/',language:'vi',branch:'all'},
 {id:crypto.randomUUID(),at:now-1000,type:'cta_view',page:'/',ctaId:'home.location',label:'Xem nhà Tân Phú',target:'/tan-phu/',language:'vi',branch:'tan-phu'},
 {id:crypto.randomUUID(),at:now,type:'cta_click',page:'/',ctaId:'home.location',label:'Xem nhà Tân Phú',target:'/tan-phu/?private=abc',language:'vi',branch:'tan-phu'}]};
 assert.equal((await handleApi(req('/api/track','POST',{...payload,consent:false}),env)).status,400);
 assert.equal((await handleApi(req('/api/track','POST',payload),env)).status,204);
 assert.equal((await handleApi(req('/api/track','POST',payload),env)).status,204);
 let stats=await(await handleApi(req('/api/admin/analytics?internal=0','GET',undefined,owner),env)).json();assert.equal(stats.overview.pageViews,1);assert.equal(stats.overview.clicks,1);assert.equal(stats.ctas[0].viewedSessions,1);assert.equal(stats.sessions[0].displayName,null);assert.equal(stats.sessions[0].linkLabel,'Link gửi Bách');
 let journey=await(await handleApi(req('/api/admin/sessions/'+sessionId,'GET',undefined,owner),env)).json();assert.deepEqual(journey.events.map(e=>e.type),['page_view','cta_view','cta_click']);assert.equal(journey.events[2].target,'/tan-phu/');
 assert.equal((await handleApi(req('/api/track','POST',{...payload,visitorId:crypto.randomUUID()}),env)).status,409);
 const bach={'oai-authenticated-user-id':'bach-test','oai-authenticated-user-email':'bach@example.test','oai-authenticated-user-full-name':encodeURIComponent('Bách'),'oai-authenticated-user-full-name-encoding':'percent-encoded-utf-8'};
 const second={...payload,sessionId:crypto.randomUUID(),events:[{...payload.events[0],id:crypto.randomUUID(),language:'en',page:'/tan-phu/',branch:'tan-phu'}]};
 await handleApi(req('/api/track','POST',second,bach),env);stats=await(await handleApi(req('/api/admin/analytics?lang=en&branch=tan-phu','GET',undefined,owner),env)).json();assert.equal(stats.overview.visitors,1);assert.equal(stats.sessions[0].displayName,'Bách');assert.equal(stats.overview.pageViews,1);
 await handleApi(req('/api/track','POST',{...second,sessionId:crypto.randomUUID(),events:[{...second.events[0],id:crypto.randomUUID()}]},owner),env);
 const without=await(await handleApi(req('/api/admin/analytics?internal=0','GET',undefined,owner),env)).json(),withInternal=await(await handleApi(req('/api/admin/analytics?internal=1','GET',undefined,owner),env)).json();assert.equal(withInternal.overview.sessions,without.overview.sessions+1);
 assert.equal((await handleApi(req('/api/admin/analytics'),env)).status,401);
});
