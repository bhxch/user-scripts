// ==UserScript==
// @name         GitHub Repo Size Viewer
// @name:zh-CN   GitHub 仓库体积徽标
// @namespace    bhxch.userscript.gh-repo-size-badge
// @version      2.7.0
// @description  Show repository size beside repo titles and repo lists on GitHub; supports per-owner fine-grained tokens.
// @description:zh-CN 在 GitHub 仓库页、仓库列表页与星标页显示仓库体积，支持按 Owner 配置 Fine-grained Token。
// @author       bhxch
// @homepageURL  https://github.com/bhxch/user-scripts
// @supportURL   https://github.com/bhxch/user-scripts/issues
// @match        https://github.com/*
// @exclude      https://github.com/settings*
// @exclude      https://github.com/notifications*
// @exclude      https://github.com/marketplace*
// @exclude      https://github.com/login*
// @exclude      https://github.com/signup*
// @exclude      https://github.com/join*
// @exclude      https://github.com/orgs/*/dashboard*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      api.github.com
// @run-at       document-idle
// @noframes
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @license      MIT
// @downloadURL  https://raw.githubusercontent.com/bhxch/user-scripts/main/github/gh-repo-size-badge/dist/gh-repo-size-badge.user.js
// @updateURL    https://raw.githubusercontent.com/bhxch/user-scripts/main/github/gh-repo-size-badge/dist/gh-repo-size-badge.user.js
// ==/UserScript==
function D(e){let{request:n}=e,t=e.now??(()=>Date.now()),o=e.cacheTtlMs??300000,r=e.timeoutMs??15000,s=new Map;function i(c,a,l){let d=`${c}/${a}`.toLowerCase(),g=s.get(d);if(g&&t()-g.timestamp<o)return Promise.resolve({sizeKB:g.sizeKB,tokenSource:g.tokenSource});let V=`https://api.github.com/repos/${encodeURIComponent(c)}/${encodeURIComponent(a)}`,O={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};if(l.token)O.Authorization=`Bearer ${l.token}`;return new Promise((W,u)=>{n({method:"GET",url:V,headers:O,timeout:r,onload:(P)=>{let p=P.status;if(p===200){let G;try{G=JSON.parse(P.responseText)}catch{u(Error("解析 API 响应失败"));return}let R=G.size;if(typeof R!=="number"){u(Error("API 响应中缺少 size 字段"));return}s.set(d,{sizeKB:R,tokenSource:l.source,timestamp:t()}),W({sizeKB:R,tokenSource:l.source});return}if(p===404){u(Error(l.source?`仓库不存在，或 Owner "${l.source}" 的 Token 无权访问`:`仓库不存在，或为私有仓库（请为 Owner "${c}" 配置 Token）`));return}if(p===403||p===429){u(Error(`API 速率限制${l.source?`（Token: ${l.source}）`:"（匿名）"}`));return}if(p===401){u(Error(`Token 无效或已过期（来源: ${l.source??"匿名"}）`));return}u(Error(`API 请求失败: HTTP ${p}`))},onerror:()=>u(Error("网络请求失败")),ontimeout:()=>u(Error("请求超时"))})})}return{fetchRepoSize:i,clearCache:()=>s.clear()}}var b=new Set(["settings","notifications","explore","topics","trending","marketplace","pricing","features","enterprise","login","logout","join","signup","search","new","orgs","users","apps","sponsors","collections","events","codespaces","dashboard","account","site","security","about","contact","team","sessions","password_reset","issues","pulls","stars","watching","pulse","home"]);function C(e){let n=e.split("/").filter(Boolean);if(n.length<2)return null;if(b.has(n[0].toLowerCase()))return null;return{owner:n[0],repo:n[1]}}function h(e,n){let t=e.split("/").filter(Boolean),o=new URLSearchParams(n).get("tab");if(t[0]==="orgs"&&t.length>=2){if(t[2]==="repositories"||o==="repositories")return{type:"repo-list",user:t[1]}}if(t.length===1&&o==="repositories")return{type:"repo-list",user:t[0]};if(t.length===1&&o==="stars")return{type:"star-list",user:t[0]};let r=C(e);if(r)return{type:"repo",owner:r.owner,repo:r.repo};return{type:"unknown"}}var f="gh-repo-size-badge",x="gh-repo-size-badge",m="data-gh-repo-size-badge",J=`
  display: inline-block; margin-left: 8px; padding: 2px 8px;
  font-size: 12px; font-weight: 500;
  color: var(--fgColor-muted, #656d76);
  background-color: var(--bgColor-neutral-muted, #f6f8fa);
  border-radius: 999px; vertical-align: middle; cursor: default;
`,X=`
  display: inline-block; margin-left: 8px; padding: 2px 8px;
  font-size: 12px; font-weight: 600;
  color: #cf222e; background-color: #ffebe9;
  border: 1px solid #ff8182; border-radius: 999px;
  vertical-align: middle; cursor: help;
`,Q=`
  display: inline-block; margin-left: 6px; padding: 1px 6px;
  font-size: 11px; font-weight: 500;
  color: var(--fgColor-muted, #656d76);
  background-color: var(--bgColor-neutral-muted, #f6f8fa);
  border-radius: 999px; vertical-align: middle; cursor: default;
`;function k(e,n){let t=CSS.escape(e),o=CSS.escape(n),r=`/${e}/${n}`.toLowerCase(),s=document.querySelector('[data-testid="repo-name-link"]');if(s&&s.getAttribute("href")?.toLowerCase()===r)return s;let i=document.querySelector("h1");if(i){let a=i.querySelector("a");if(a&&a.getAttribute("href")?.toLowerCase().startsWith(r))return a;if(i.textContent.toLowerCase().includes(n.toLowerCase()))return i}let c=document.querySelectorAll(`a[href="/${t}/${o}"]`);for(let a of c)if(a.closest("h1")||a.closest('[data-testid="repository-container-header"]')||a.closest(".AppHeader-context-item"))return a;return c[0]??null}function y(){document.querySelectorAll(`#${f}`).forEach((e)=>e.remove()),document.querySelectorAll(`[${m}]`).forEach((e)=>e.remove())}function L(e){let n=C(location.pathname);if(!n)return!1;let t=k(n.owner,n.repo);if(!t)return!1;return t.insertAdjacentElement("afterend",e),!0}function q(e,n){let t=document.createElement("span");return t.id=f,t.className=x,t.textContent=`· ${e}`,t.title=`仓库大小: ${e}
认证方式: ${n?`Token (${n})`:"匿名请求"}`,t.style.cssText=J,t}function A(e){let n=document.getElementById(f);if(n&&n.dataset.state==="error"&&n.dataset.error===e)return;y();let t=document.createElement("span");t.id=f,t.className=x,t.textContent="· ?",t.title=`仓库大小获取失败：${e}`,t.dataset.state="error",t.dataset.error=e,t.style.cssText=X,L(t)}function v(){let e=[],n=new Set,t=document.querySelectorAll('li, div.col-12, [data-testid="results-list"] > div');for(let o of t){let r=null;for(let i of o.querySelectorAll("a[href]")){let c=i.getAttribute("href");if(!c)continue;let a=c.match(/^\/([^/]+)\/([^/?#]+)\/?$/);if(!a)continue;let[,l,d]=a;if(b.has(l.toLowerCase()))continue;if(i.closest("nav, header, .AppHeader, .Sidebar"))continue;if(i.closest("h3")||i.classList.contains("Link--primary")||i.parentElement?.tagName==="H3"){r={owner:l,repo:d,link:i};break}if(!r)r={owner:l,repo:d,link:i}}if(!r)continue;let s=`${r.owner}/${r.repo}`.toLowerCase();if(n.has(s))continue;if(n.add(s),o.querySelector(`[${m}="${CSS.escape(s)}"]`))continue;e.push({...r,key:s})}return e}function H(e,n,t){let o=document.createElement("span");return o.className=x,o.setAttribute(m,t),o.textContent=`· ${e}`,o.title=`仓库大小: ${e}
认证方式: ${n?`Token (${n})`:"匿名请求"}`,o.style.cssText=Q,o}function _(e){if(typeof e!=="number"||!Number.isFinite(e)||e<0)return null;if(e===0)return"0 KB";let n=e*1024,t=["B","KB","MB","GB","TB"],o=0,r=n;while(r>=1024&&o<t.length-1)r/=1024,o+=1;return`${r.toFixed(1)} ${t[o]}`}function N(e){if(!e||typeof e!=="object"||Array.isArray(e))return{tokens:{}};let n=e.tokens;if(!n||typeof n!=="object"||Array.isArray(n))return{tokens:{}};let t={};for(let[o,r]of Object.entries(n)){if(typeof r!=="string")continue;let s=r.trim();if(!s)continue;t[o.trim().toLowerCase()]=s}return{tokens:t}}function K(e,n){let t=(n??"").trim().toLowerCase();if(t&&e[t])return{token:e[t],source:t};if(e["*"])return{token:e["*"],source:"*"};return{token:"",source:null}}var U="github_repo_size_tokens",Z=300000,ee=60000,te=10,ne=1000,oe=150,re=5,se=500,z=(e)=>new Promise((n)=>setTimeout(n,e)),E=D({request:(e)=>GM_xmlhttpRequest(e),cacheTtlMs:Z}),T=new Map;function w(){try{return N(GM_getValue(U,null))}catch{return{tokens:{}}}}function F(e){GM_setValue(U,e),E.clearCache(),T.clear()}function M(e){return K(w().tokens,e)}function ie(){GM_registerMenuCommand("\uD83D\uDD11 设置 / 更新 Owner Token",()=>{let e=w(),n=Object.keys(e.tokens).join(", ")||"（暂无）",t=prompt(`输入 Owner（用户名或组织名，大小写不敏感）。
输入 * 表示兜底 Token。

`+`已配置: ${n}`,"");if(t===null)return;let o=t.trim().toLowerCase();if(!o)return alert("Owner 不能为空。");let r=prompt(`输入 ${o} 的 Fine-grained PAT。
（留空并确定 = 删除该配置）`,e.tokens[o]??"");if(r===null)return;let s=r.trim();if(s)e.tokens[o]=s;else delete e.tokens[o];F(e),alert(`已保存。当前配置的 Owner 数量: ${Object.keys(e.tokens).length}`)}),GM_registerMenuCommand("\uD83D\uDDD1️ 删除某个 Owner Token",()=>{let e=w(),n=Object.keys(e.tokens);if(n.length===0)return alert("尚未配置任何 Token。");let t=prompt(`输入要删除的 Owner（或 *）：
已配置: ${n.join(", ")}`,"");if(t===null)return;let o=t.trim().toLowerCase();if(!e.tokens[o])return alert(`未找到 ${o} 的配置。`);if(!confirm(`确认删除 ${o} 的 Token？`))return;delete e.tokens[o],F(e),alert("已删除。")}),GM_registerMenuCommand("\uD83D\uDCCB 查看 Token 配置",()=>{let e=w(),n=Object.keys(e.tokens);if(n.length===0)return alert("尚未配置任何 Token。");let t=n.map((o)=>{let r=e.tokens[o],s=r.length>12?`${r.slice(0,8)}…${r.slice(-4)}`:"***";return`${o} → ${s}`});alert(`当前 Token 配置：

${t.join(`
`)}`)}),GM_registerMenuCommand("\uD83E\uDDEA 诊断当前页面",async()=>{let e=h(location.pathname,location.search),n={url:location.href,ctx:e};if(e.type==="repo"){let t=k(e.owner,e.repo);n.titleLinkFound=Boolean(t),n.titleLinkTag=t?t.outerHTML.slice(0,150):null;let o=M(e.owner);n.tokenSource=o.source??"（匿名）";try{n.apiResult=await E.fetchRepoSize(e.owner,e.repo,o)}catch(r){n.apiResult={error:r.message}}}else if(e.type==="repo-list"||e.type==="star-list"){let t=v();n.itemsFound=t.length,n.sampleItems=t.slice(0,5).map((o)=>o.key)}alert(JSON.stringify(n,null,2)),console.log("[GitHub Repo Size][诊断]",n)})}async function ce(e){let n=`${e.owner}/${e.repo}`.toLowerCase(),t=T.get(n);if(t&&Date.now()-t.timestamp<ee){A(t.message);return}try{let o=M(e.owner),{sizeKB:r,tokenSource:s}=await E.fetchRepoSize(e.owner,e.repo,o),i=_(r);if(!i)return;y();for(let c=0;c<re;c++){if(L(q(i,s)))break;await z(se)}}catch(o){let r=o.message;console.debug("[GitHub Repo Size]",r),T.set(n,{message:r,timestamp:Date.now()}),A(r)}}async function ae(){await z(ne);let e=v();if(e.length===0)return;let n=location.href,t=0;for(let o of e){if(location.href!==n)return;let r=M(o.owner);if(!r.token){if(t>=te)continue;t+=1}try{let{sizeKB:s,tokenSource:i}=await E.fetchRepoSize(o.owner,o.repo,r),c=_(s);if(c&&!document.querySelector(`[${m}="${CSS.escape(o.key)}"]`))o.link.insertAdjacentElement("afterend",H(c,i,o.key))}catch{}await z(oe)}}async function S(){try{let e=h(location.pathname,location.search);if(e.type==="repo")await ce(e);else if(e.type==="repo-list"||e.type==="star-list")await ae()}catch(e){console.error("[GitHub Repo Size] processPage 异常:",e)}}var B=location.href,Y,j;function I(){if(location.href===B)return;B=location.href,y(),T.clear(),setTimeout(()=>void S(),600)}document.addEventListener("turbo:load",I);document.addEventListener("pjax:end",I);var le=new MutationObserver(()=>{try{if(location.href!==B){I();return}let e=h(location.pathname,location.search);if(e.type==="repo"){if(!document.getElementById(f)&&k(e.owner,e.repo))clearTimeout(Y),Y=setTimeout(()=>void S(),1000)}else if(e.type==="repo-list"||e.type==="star-list")clearTimeout(j),j=setTimeout(()=>void S(),2000)}catch(e){console.error(e)}});le.observe(document.body,{childList:!0,subtree:!0});try{ie()}catch(e){console.error(e)}S();
