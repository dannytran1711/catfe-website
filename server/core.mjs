import seedStories from '../content/seed-stories.json' with {type:'json'};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const CATEGORIES=['moments','care','visits','events'];
const BRANCHES=['all','tan-phu','binh-tan','estella'];
const MAX_UPLOAD=6*1024*1024;
class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
const fail=(status,message)=>{throw new HttpError(status,message)};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const clean=(value,max=100)=>typeof value==='string'?value.trim().slice(0,max):'';
const statement=(db,sql,...args)=>db.prepare(sql).bind(...args);
const one=(db,sql,...args)=>statement(db,sql,...args).first();
const rows=async(db,sql,...args)=>(await statement(db,sql,...args).all()).results;
const run=(db,sql,...args)=>statement(db,sql,...args).run();
function identity(request){
  const id=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');
  if(!id||!email)return null;
  let name=request.headers.get('oai-authenticated-user-full-name')||'';
  if(request.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8'){try{name=decodeURIComponent(name)}catch{name=''}}
  return {id,email:email.trim().toLowerCase(),name:clean(name,100)};
}
export async function getMember(request,env){
  const person=identity(request);if(!person)return null;
  let member=await one(env.DB,'SELECT * FROM members WHERE user_id = ?',person.id);
  if(!member&&env.CATFE_OWNER_EMAIL&&person.email===env.CATFE_OWNER_EMAIL.trim().toLowerCase()){
    await run(env.DB,'INSERT OR IGNORE INTO members(user_id,role,display_name,created_at) VALUES(?,?,?,?)',person.id,'owner',person.name||'CATFE',Date.now());
    member=await one(env.DB,'SELECT * FROM members WHERE user_id = ?',person.id);
  }
  return member||null;
}
async function admin(request,env){const user=await getMember(request,env);if(!user)fail(identity(request)?403:401,'Bạn cần đăng nhập bằng tài khoản quản lý CATFE.');return user;}
function sameOrigin(request){const origin=request.headers.get('origin');if(origin!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')fail(403,'Yêu cầu không hợp lệ.');}
async function body(request,max=150000){if(Number(request.headers.get('content-length')||0)>max)fail(413,'Nội dung quá lớn.');const raw=await request.text();if(raw.length>max)fail(413,'Nội dung quá lớn.');try{return JSON.parse(raw)}catch{fail(400,'Dữ liệu không hợp lệ.')}}
async function seed(db){
  if(await one(db,"SELECT value FROM settings WHERE key = 'stories_seeded_v1'"))return;
  const now=Date.now();
  await db.batch([...seedStories.map(p=>statement(db,'INSERT OR IGNORE INTO posts(id,slug,draft,published,version,archived,created_at,updated_at,published_at) VALUES(?,?,?,?,1,0,?,?,?)',p.id,p.slug,JSON.stringify(p.content),JSON.stringify(p.content),now,now,now)),statement(db,"INSERT OR IGNORE INTO settings(key,value) VALUES('stories_seeded_v1','1')")]);
}
function publicPost(p,full=true){const content=JSON.parse(p.published);if(!full){delete content.bodyVi;delete content.bodyEn;}return{id:p.id,slug:p.slug,content,publishedAt:p.published_at,updatedAt:p.updated_at};}
function adminPost(p){return{id:p.id,slug:p.slug,draft:JSON.parse(p.draft),published:p.published?JSON.parse(p.published):null,version:p.version,archived:!!p.archived,updatedAt:p.updated_at,publishedAt:p.published_at};}
export async function getPublishedPost(db,slug){await seed(db);const p=await one(db,'SELECT * FROM posts WHERE slug = ? AND published IS NOT NULL AND archived = 0',slug);return p?publicPost(p):null;}
function validatePost(input,publish=false){
  const p={titleVi:clean(input.titleVi,180),titleEn:clean(input.titleEn,180),excerptVi:clean(input.excerptVi,500),excerptEn:clean(input.excerptEn,500),bodyVi:clean(input.bodyVi,40000),bodyEn:clean(input.bodyEn,40000),cover:clean(input.cover,200),altVi:clean(input.altVi,240),altEn:clean(input.altEn,240),category:input.category,branch:input.branch};
  if(!p.titleVi)fail(400,'Thêm tiêu đề tiếng Việt để lưu bài.');
  if(!CATEGORIES.includes(p.category)||!BRANCHES.includes(p.branch))fail(400,'Chọn danh mục và chi nhánh hợp lệ.');
  if(p.cover&&!/^\/assets\/[a-z0-9-]+\.(jpg|png|webp)$/i.test(p.cover)&&!/^\/media\/[a-f0-9-]{36}$/.test(p.cover))fail(400,'Vui lòng tải ảnh lên từ trình đăng bài.');
  if(publish&&(!p.bodyVi||!p.excerptVi||!p.cover||!p.altVi))fail(400,'Cần nội dung, mô tả ngắn, ảnh bìa và mô tả ảnh tiếng Việt trước khi đăng.');
  const en=[p.titleEn,p.excerptEn,p.bodyEn,p.altEn];if(publish&&en.some(Boolean)&&!en.every(Boolean))fail(400,'Hoàn thành đủ bản tiếng Anh hoặc để trống toàn bộ.');
  return p;
}
async function validCover(db,p){if(p.cover.startsWith('/media/')){const id=p.cover.slice(7);if(!await one(db,'SELECT id FROM media WHERE id = ?',id))fail(400,'Ảnh bìa không tồn tại.');}}
function slugify(value){return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100)||'chuyen-catfe';}
async function savePost(request,env,id){
  await admin(request,env);sameOrigin(request);await seed(env.DB);const data=await body(request);const mode=data.mode||'draft';
  if(!['draft','publish','unpublish','archive'].includes(mode))fail(400,'Thao tác không hợp lệ.');
  const old=id?await one(env.DB,'SELECT * FROM posts WHERE id = ?',id):null;
  if(id&&!old)fail(404,'Không tìm thấy bài viết.');
  if(old&&data.version!==old.version)fail(409,'Bài đã được chỉnh ở nơi khác. Tải lại bài trước khi lưu để tránh ghi đè.');
  if(!old&&['unpublish','archive'].includes(mode))fail(400,'Bài chưa được tạo.');
  const content=['archive','unpublish'].includes(mode)?JSON.parse(old.draft):validatePost(data.content||{},mode==='publish');await validCover(env.DB,content);
  const now=Date.now(),key=old?.id||crypto.randomUUID(),slug=old?.slug||(slugify(content.titleVi)+'-'+key.slice(0,6));
  const draft=JSON.stringify(content),published=mode==='publish'?draft:['archive','unpublish'].includes(mode)?null:old?.published||null;
  const publishedAt=mode==='publish'?old?.published_at||now:old?.published_at||null;
  if(old){const result=await run(env.DB,'UPDATE posts SET draft=?,published=?,version=version+1,archived=?,updated_at=?,published_at=? WHERE id=? AND version=?',draft,published,mode==='archive'?1:0,now,publishedAt,key,data.version);if(result.meta?.changes===0)fail(409,'Bài vừa thay đổi. Hãy tải lại trước khi lưu.');}
  else await run(env.DB,'INSERT INTO posts(id,slug,draft,published,version,archived,created_at,updated_at,published_at) VALUES(?,?,?,?,1,0,?,?,?)',key,slug,draft,published,now,now,publishedAt);
  return json({post:adminPost(await one(env.DB,'SELECT * FROM posts WHERE id=?',key))},old?200:201);
}
async function upload(request,env){
  await admin(request,env);sameOrigin(request);if(Number(request.headers.get('content-length')||0)>MAX_UPLOAD+20000)fail(413,'Ảnh tối đa 6 MB.');
  const form=await request.formData(),file=form.get('file');if(!file||typeof file==='string'||!file.size)fail(400,'Chọn một ảnh.');if(file.size>MAX_UPLOAD)fail(413,'Ảnh tối đa 6 MB.');
  const bytes=new Uint8Array(await file.arrayBuffer());let mime='',extension='';
  if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff){mime='image/jpeg';extension='jpg'}
  else if(bytes.slice(0,8).join(',')==='137,80,78,71,13,10,26,10'){mime='image/png';extension='png'}
  else if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'){mime='image/webp';extension='webp'}
  else fail(400,'Vui lòng dùng ảnh JPG, PNG hoặc WebP.');
  const id=crypto.randomUUID(),key=`blog/${id}.${extension}`;
  await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:mime}});
  try{await run(env.DB,'INSERT INTO media(id,object_key,mime,size,created_at) VALUES(?,?,?,?,?)',id,key,mime,bytes.length,Date.now())}catch(e){await env.BUCKET.delete(key);throw e}
  return json({id,url:'/media/'+id},201);
}
export async function serveMedia(request,env,id){
  if(!UUID.test(id))return new Response('Not found',{status:404});const m=await one(env.DB,'SELECT * FROM media WHERE id=?',id);if(!m)return new Response('Not found',{status:404});
  const isPublic=await one(env.DB,"SELECT id FROM posts WHERE published IS NOT NULL AND archived=0 AND json_extract(published,'$.cover')=? LIMIT 1",'/media/'+id);
  if(!isPublic&&!await getMember(request,env))return new Response('Not found',{status:404});
  const object=await env.BUCKET.get(m.object_key);if(!object)return new Response('Not found',{status:404});
  return new Response(object.body,{headers:{'Content-Type':m.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'}});
}
async function digest(value){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function pagePath(value){const p=clean(value,220).split(/[?#]/)[0];return /^\/(?:[a-z0-9\-/_\.])*$/i.test(p)&&!p.startsWith('//')&&!/^\/(api|quan-tri|signin|signout|callback)/.test(p)?p:null;}
function eventTarget(value){if(!value)return null;try{const u=new URL(value,'https://catfe.local');if(!['https:','http:','tel:'].includes(u.protocol))return null;if(u.hostname==='catfe.local')return pagePath(u.pathname);return (u.protocol==='tel:'?'tel:CATFE':u.origin+u.pathname).slice(0,250)}catch{return null}}
async function track(request,env){
  sameOrigin(request);if(/bot|crawler|spider|headless/i.test(request.headers.get('user-agent')||''))return new Response(null,{status:204});
  const data=await body(request,40000);if(!UUID.test(data.visitorId)||!UUID.test(data.sessionId)||!Array.isArray(data.events)||data.events.length>20||!data.consent)fail(400,'Dữ liệu thống kê không hợp lệ.');
  const now=Date.now(),person=identity(request),visitorId=person?'u_'+(await digest(person.id)).slice(0,32):'a_'+data.visitorId;
  const existing=await one(env.DB,'SELECT visitor_id FROM sessions WHERE id=?',data.sessionId);if(existing&&existing.visitor_id!==visitorId)fail(409,'Phiên truy cập đã thay đổi.');
  const count=await one(env.DB,'SELECT COUNT(*) AS n FROM events WHERE visitor_id=? AND received_at>?',visitorId,now-3600000);if(count.n>1000)fail(429,'Vui lòng thử lại sau.');
  const events=data.events.map(e=>{if(!UUID.test(e.id)||!['page_view','cta_view','cta_click'].includes(e.type)||!pagePath(e.page))fail(400,'Sự kiện không hợp lệ.');return{id:e.id,type:e.type,page:pagePath(e.page),at:Number.isFinite(e.at)&&e.at<now+30000&&e.at>now-86400000?Math.round(e.at):now,cta:clean(e.ctaId,150)||null,label:clean(e.label,120)||null,target:eventTarget(e.target),language:e.language==='en'?'en':'vi',branch:BRANCHES.includes(e.branch)?e.branch:'all'}});
  if(!events.length)return new Response(null,{status:204});
  let referrer=null;try{referrer=new URL(data.referrer).hostname.slice(0,100)}catch{}
  const link=typeof data.via==='string'&&/^[a-f0-9]{16}$/.test(data.via)?await one(env.DB,'SELECT id FROM tracking_links WHERE id=?',data.via):null;
  const internal=person&&((await one(env.DB,'SELECT role FROM members WHERE user_id=?',person.id))||person.email===env.CATFE_OWNER_EMAIL?.trim().toLowerCase())?1:0;
  await env.DB.batch([
    statement(env.DB,'INSERT INTO visitors(id,display_name,kind,first_seen,last_seen) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen,display_name=COALESCE(excluded.display_name,visitors.display_name)',visitorId,person?.name||null,person?'signed_in':'anonymous',now,now),
    statement(env.DB,'INSERT INTO sessions(id,visitor_id,started_at,last_at,entry_path,language,device,referrer,link_id,internal) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET last_at=excluded.last_at',data.sessionId,visitorId,now,now,events[0].page,events[0].language,['mobile','tablet','desktop'].includes(data.device)?data.device:'desktop',referrer,link?.id||null,internal),
    ...events.map(e=>statement(env.DB,'INSERT OR IGNORE INTO events(id,session_id,visitor_id,occurred_at,received_at,type,page,cta_id,label,target,language,branch) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',e.id,data.sessionId,visitorId,e.at,now,e.type,e.page,e.cta,e.label,e.target,e.language,e.branch))
  ]);
  return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
}
async function analytics(request,env){
  await admin(request,env);const u=new URL(request.url),days=[7,30,90].includes(Number(u.searchParams.get('days')))?Number(u.searchParams.get('days')):30;
  const from=Date.now()-days*86400000,to=Date.now(),include=u.searchParams.get('internal')==='1';
  const language=['vi','en'].includes(u.searchParams.get('lang'))?u.searchParams.get('lang'):null;
  const branch=BRANCHES.includes(u.searchParams.get('branch'))&&u.searchParams.get('branch')!=='all'?u.searchParams.get('branch'):null;
  const where='e.occurred_at >= ? AND e.occurred_at <= ?'+(include?'':' AND s.internal=0')+(language?' AND e.language=?':'')+(branch?' AND e.branch=?':'');
  const args=[from,to,...(language?[language]:[]),...(branch?[branch]:[])];
  const overview=await one(env.DB,`SELECT COUNT(DISTINCT e.visitor_id) AS visitors,COUNT(DISTINCT e.session_id) AS sessions,SUM(e.type='page_view') AS pageViews,SUM(e.type='cta_view') AS impressions,SUM(e.type='cta_click') AS clicks FROM events e JOIN sessions s ON s.id=e.session_id WHERE ${where}`,...args);
  const ctas=await rows(env.DB,`SELECT e.cta_id AS id,e.page AS page,MAX(e.label) AS label,MAX(e.target) AS target,SUM(e.type='cta_view') AS impressions,SUM(e.type='cta_click') AS clicks,COUNT(DISTINCT CASE WHEN e.type='cta_view' THEN e.session_id END) AS viewedSessions,COUNT(DISTINCT CASE WHEN e.type='cta_click' THEN e.session_id END) AS clickedSessions FROM events e JOIN sessions s ON s.id=e.session_id WHERE ${where} AND e.cta_id IS NOT NULL GROUP BY e.cta_id,e.page ORDER BY clicks DESC,impressions DESC LIMIT 100`,...args);
  const pages=await rows(env.DB,`SELECT e.page AS page,COUNT(*) AS views,COUNT(DISTINCT e.visitor_id) AS visitors FROM events e JOIN sessions s ON s.id=e.session_id WHERE ${where} AND e.type='page_view' GROUP BY e.page ORDER BY views DESC LIMIT 50`,...args);
  const recent=await rows(env.DB,`SELECT s.id,s.visitor_id AS visitorId,v.display_name AS displayName,v.kind,s.started_at AS startedAt,s.last_at AS lastAt,s.entry_path AS entryPath,s.device,s.language,s.internal,l.label AS linkLabel,COUNT(*) AS eventCount,SUM(e.type='cta_click') AS clicks,SUM(e.type='page_view') AS views FROM events e JOIN sessions s ON s.id=e.session_id JOIN visitors v ON v.id=s.visitor_id LEFT JOIN tracking_links l ON l.id=s.link_id WHERE ${where} GROUP BY s.id ORDER BY s.last_at DESC LIMIT 100`,...args);
  return json({days,overview,ctas,pages,sessions:recent});
}
async function trackingLinks(request,env){
  await admin(request,env);
  if(request.method==='GET')return json({links:await rows(env.DB,'SELECT l.*,COUNT(DISTINCT s.id) AS sessions,COUNT(DISTINCT s.visitor_id) AS visitors FROM tracking_links l LEFT JOIN sessions s ON s.link_id=l.id GROUP BY l.id ORDER BY l.created_at DESC LIMIT 100')});
  sameOrigin(request);const data=await body(request,2000),label=clean(data.label,80),destination=pagePath(data.destination);
  if(!label||!destination||!['/','/cac-nha/','/tan-phu/','/binh-tan/','/estella/','/chuyen-catfe/','/lan-dau-ghe/'].includes(destination))fail(400,'Thêm nhãn và chọn trang đích hợp lệ.');
  const id=crypto.randomUUID().replaceAll('-','').slice(0,16);await run(env.DB,'INSERT INTO tracking_links(id,label,destination,created_at) VALUES(?,?,?,?)',id,label,destination,Date.now());return json({id,label,destination,url:destination+'?via='+id},201);
}
export async function handleApi(request,env){
  try{
    if(!env.DB)fail(503,'Kho dữ liệu chưa sẵn sàng.');const path=new URL(request.url).pathname.replace(/\/$/,'');
    if(path==='/api/track'&&request.method==='POST')return await track(request,env);
    if(path==='/api/session'&&request.method==='GET'){const member=await getMember(request,env);return json({authorized:!!member,displayName:member?.display_name||null});}
    if(path==='/api/posts'&&request.method==='GET'){await seed(env.DB);return json({posts:(await rows(env.DB,'SELECT * FROM posts WHERE published IS NOT NULL AND archived=0 ORDER BY published_at DESC,id')).map(p=>publicPost(p,false))});}
    if(path==='/api/admin/posts'&&request.method==='GET'){await admin(request,env);await seed(env.DB);return json({posts:(await rows(env.DB,'SELECT * FROM posts WHERE archived=0 ORDER BY updated_at DESC')).map(adminPost)});}
    if(path==='/api/admin/posts'&&request.method==='POST')return await savePost(request,env,null);
    const post=path.match(/^\/api\/admin\/posts\/([a-zA-Z0-9-]+)$/);if(post&&request.method==='PUT')return await savePost(request,env,post[1]);
    if(path==='/api/admin/media'&&request.method==='POST')return await upload(request,env);
    if(path==='/api/admin/analytics'&&request.method==='GET')return await analytics(request,env);
    const session=path.match(/^\/api\/admin\/sessions\/([a-f0-9-]{36})$/);if(session&&request.method==='GET'){await admin(request,env);const s=await one(env.DB,'SELECT * FROM sessions WHERE id=?',session[1]);if(!s)fail(404,'Không tìm thấy phiên này.');return json({events:await rows(env.DB,'SELECT occurred_at AS at,type,page,label,target,language,branch FROM events WHERE session_id=? ORDER BY occurred_at,received_at,id LIMIT 1000',session[1])});}
    if(path==='/api/admin/links'&&['GET','POST'].includes(request.method))return await trackingLinks(request,env);
    return json({error:'Không tìm thấy đường dẫn.'},404);
  }catch(error){if(error instanceof HttpError)return json({error:error.message},error.status);console.error('CATFE API failure',error?.stack||String(error));return json({error:'Chưa thể xử lý. Vui lòng thử lại.'},500);}
}
