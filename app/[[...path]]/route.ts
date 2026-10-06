/// <reference types="vite/client" />
import { env } from 'cloudflare:workers';
import { getMember, getPublishedPost, serveMedia } from '../../server/core.mjs';
const pages=import.meta.glob('../../site-pages/**/*.html',{query:'?raw',eager:true,import:'default'}) as Record<string,string>;
const escape=(value:unknown)=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const text=(vi:string,en:string)=>`<span data-post-vi="${escape(vi)}" data-post-en="${escape(en||vi)}">${escape(vi)}</span>`;
const response=(html:string,status=200)=>new Response(html,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
const read=(path:string)=>pages['../../site-pages/'+path];
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const url=new URL(request.url),path=url.pathname;
 if(path.startsWith('/media/'))return serveMedia(request,env,path.slice(7).replace(/\/$/,''));
 if(!path.endsWith('/')&&!path.split('/').pop()?.includes('.')){url.pathname+='/';return Response.redirect(url,308);}
 if(path.startsWith('/quan-tri/')){
  const user=await getMember(request,env);
  if(!user){if(!request.headers.get('oai-authenticated-user-id'))return Response.redirect(new URL('/signin-with-chatgpt?return_to=%2Fquan-tri%2F',url),302);return response('<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Quản lý CATFE</title><link rel="stylesheet" href="/style.css"><main class="section wrap"><h1>Khu vực quản lý CATFE</h1><p class="lead" style="margin:25px 0">Tài khoản này chưa được cấp quyền quản lý bài viết và thống kê.</p><a class="button" href="/">Về CATFE</a><p style="margin-top:25px"><a href="/signout-with-chatgpt?return_to=/quan-tri/" target="_top">Dùng tài khoản khác</a></p></main></html>',403);}
  return response(read('quan-tri/index.html'));
 }
 const legacy=path.match(/^\/chuyen-catfe\/(chiec-ao-vit|mot-loi-chao-cham|mot-mai-nha-lau-dai)\/$/);
 if(legacy){url.pathname='/blog/'+legacy[1]+'/';return Response.redirect(url,308);}
 const blog=path.match(/^\/blog\/([a-z0-9-]+)\/$/);
 if(blog){
  const post=await getPublishedPost(env.DB,blog[1]);if(!post)return response(read('404.html').replace('<head>','<head><base href="/">'),404);
  const p=post.content,enAvailable=!!p.titleEn&&!!p.bodyEn;
  const content=`<a class="breadcrumb" href="/chuyen-catfe/">← ${text('Chuyện CATFE','CATFE stories')}</a><p class="eyebrow">CATFE JOURNAL</p><h1>${text(p.titleVi,p.titleEn)}</h1><p class="lead">${text(p.excerptVi,p.excerptEn)}</p><p class="blog-meta">${text('Chuyện từ CATFE','Stories from CATFE')}</p>${enAvailable?'':'<p class="blog-language-note" data-vietnamese-only hidden>This story is currently available in Vietnamese.</p>'}<img class="blog-cover" src="${escape(p.cover)}" alt="${escape(p.altVi)}" data-alt-vi="${escape(p.altVi)}" data-alt-en="${escape(p.altEn||p.altVi)}" fetchpriority="high"><div class="blog-body">${text(p.bodyVi,p.bodyEn)}</div><div class="blog-end"><a class="text-link" href="/cac-nha/">${text('Hẹn một buổi ở nhà mèo →','Plan a CATFE visit →')}</a></div>`;
  let html=read('blog/template/index.html').replace('<!--BLOG_CONTENT-->',content).replace('<title>Chuyện CATFE</title>',`<title>${escape(p.titleVi)} — CATFE</title>`).replace('data-title-vi="Chuyện CATFE"',`data-title-vi="${escape(p.titleVi)} — CATFE"`).replace('data-title-en="CATFE stories"',`data-title-en="${escape(p.titleEn||p.titleVi)} — CATFE"`);
  return response(html);
 }
 const key=path==='/'?'index.html':path.slice(1)+(path.endsWith('/')?'index.html':'');
 if(key==='blog/template/index.html')return response(read('404.html').replace('<head>','<head><base href="/">'),404);
 const html=read(key);return html?response(html):response(read('404.html').replace('<head>','<head><base href="/">'),404);
}
