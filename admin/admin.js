
/* ════════════════════════════════════════════════
   ARABIC STATIC BLOG — Admin Panel Logic
   Password stored as SHA-256 hash in localStorage
   ════════════════════════════════════════════════ */

const DEFAULT_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // "admin"
const STORAGE_KEY  = 'blog_posts_v1';
const HASH_KEY     = 'blog_admin_hash';
const SESSION_KEY  = 'blog_session';

// ── Utils ─────────────────────────────────────────────────────────────────────
async function sha256(msg) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function getHash()  { return localStorage.getItem(HASH_KEY) || DEFAULT_HASH; }
function getPosts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [...POSTS]; }
  catch { return [...POSTS]; }
}
function savePosts(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

function toast(msg, dur=2800) {
  let t = document.getElementById('toastEl');
  if (!t) { t = document.createElement('div'); t.id='toastEl'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function isLoggedIn() { return sessionStorage.getItem(SESSION_KEY) === '1'; }

async function doLogin(e) {
  e.preventDefault();
  const pass = document.getElementById('passInput').value;
  const hash = await sha256(pass);
  const errEl = document.getElementById('loginError');
  if (hash === getHash()) {
    sessionStorage.setItem(SESSION_KEY, '1');
    errEl.classList.remove('show');
    showDashboard();
  } else {
    errEl.textContent = '⚠️ كلمة المرور غير صحيحة، حاول مجدداً.';
    errEl.classList.add('show');
    document.getElementById('passInput').value = '';
  }
}

function doLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('loginScreen').style.display = '';
}

function togglePass() {
  const i = document.getElementById('passInput');
  i.type = i.type === 'password' ? 'text' : 'password';
}
function togglePwd(id) {
  const i = document.getElementById(id);
  i.type = i.type === 'password' ? 'text' : 'password';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = '';
  renderStats();
  renderTagFilter();
  renderTable();
}

window.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) showDashboard();
});

// ── Change Password ───────────────────────────────────────────────────────────
function openPwdModal() { document.getElementById('pwdOverlay').classList.add('open'); }
function closePwdModal(e) {
  if (!e || e.target === document.getElementById('pwdOverlay'))
    document.getElementById('pwdOverlay').classList.remove('open');
}
async function changePwd() {
  const p1 = document.getElementById('newPwd1').value;
  const p2 = document.getElementById('newPwd2').value;
  const errEl = document.getElementById('pwdError');
  if (!p1 || p1.length < 4) { errEl.textContent='كلمة المرور يجب أن تكون 4 أحرف على الأقل'; errEl.classList.add('show'); return; }
  if (p1 !== p2) { errEl.textContent='كلمتا المرور غير متطابقتين'; errEl.classList.add('show'); return; }
  const h = await sha256(p1);
  localStorage.setItem(HASH_KEY, h);
  closePwdModal();
  toast('✅ تم تغيير كلمة المرور بنجاح');
  document.getElementById('newPwd1').value = '';
  document.getElementById('newPwd2').value = '';
  errEl.classList.remove('show');
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function renderStats() {
  const posts = getPosts();
  const allTags = [...new Set(posts.flatMap(p => p.tags))];
  const avgRead = posts.length ? Math.round(posts.reduce((s,p)=>s+p.readTime,0)/posts.length) : 0;
  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card"><div class="ico">📝</div><div class="num">${posts.length}</div><div class="lbl">إجمالي المقالات</div></div>
    <div class="stat-card"><div class="ico">🏷️</div><div class="num">${allTags.length}</div><div class="lbl">وسوم مختلفة</div></div>
    <div class="stat-card"><div class="ico">⏱️</div><div class="num">${avgRead}</div><div class="lbl">متوسط وقت القراءة</div></div>
    <div class="stat-card"><div class="ico">🔑</div><div class="num" style="font-size:1rem;padding-top:.4rem">
      <button onclick="openPwdModal()" style="background:var(--primary-lt);color:var(--primary);border:none;padding:.4rem 1rem;border-radius:8px;cursor:pointer;font-family:var(--font);font-weight:600">تغيير كلمة المرور</button>
    </div><div class="lbl">الأمان</div></div>
  `;
}

// ── Tag Filter ────────────────────────────────────────────────────────────────
function renderTagFilter() {
  const sel = document.getElementById('tagFilter');
  const tags = [...new Set(getPosts().flatMap(p => p.tags))];
  sel.innerHTML = '<option value="">كل الوسوم</option>' +
    tags.map(t => `<option value="${t}">${t}</option>`).join('');
}

// ── Table ─────────────────────────────────────────────────────────────────────
const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function fmtDate(d) {
  const dt = new Date(d);
  return isNaN(dt) ? d : `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

function renderTable() {
  const q   = (document.getElementById('adminSearch')?.value || '').toLowerCase();
  const tag = document.getElementById('tagFilter')?.value || '';
  let posts = getPosts().filter(p => {
    const mq  = !q   || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
    const mtg = !tag || p.tags.includes(tag);
    return mq && mtg;
  });

  const tbody = document.getElementById('postsTableBody');
  if (!posts.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-table"><span>🔍</span>لا توجد نتائج</div></td></tr>`;
    return;
  }
  tbody.innerHTML = posts.map(p => `
    <tr>
      <td>
        <div class="post-title-cell">${p.emoji || '📄'} ${p.title}</div>
        <div class="post-excerpt-cell">${p.excerpt.substring(0,80)}...</div>
      </td>
      <td>${p.tags.map(t=>`<span class="tag-chip">${t}</span>`).join('')}</td>
      <td style="white-space:nowrap;font-size:.88rem;color:var(--muted)">${fmtDate(p.date)}</td>
      <td style="text-align:center;color:var(--muted);font-size:.9rem">${p.readTime} د</td>
      <td><div class="actions-cell">
        <button class="btn-edit" onclick='editPost("${p.slug}")'>✏️ تعديل</button>
        <button class="btn-del"  onclick='openDelete("${p.slug}","${p.title.replace(/"/g,'\\"')}")'>🗑️ حذف</button>
        <a href="../posts/${p.slug}.html" target="_blank" class="btn-view">👁 عرض</a>
      </div></td>
    </tr>`).join('');
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(slug=null) {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('editSlug').value = '';
  document.getElementById('fTitle').value   = '';
  document.getElementById('fSlug').value    = '';
  document.getElementById('fAuthor').value  = 'صاحب المدوّنة';
  document.getElementById('fDate').value    = today;
  document.getElementById('fReadTime').value= '5';
  document.getElementById('fTags').value    = '';
  document.getElementById('fEmoji').value   = '📄';
  document.getElementById('fExcerpt').value = '';
  document.getElementById('fContent').value = '';
  document.getElementById('livePreviewPane').innerHTML = '';
  document.getElementById('livePreviewPane').style.display = 'none';
  document.getElementById('modalTitle').textContent = 'مقال جديد ✨';
  document.getElementById('modalOverlay').classList.add('open');

  // Auto-slug from title
  document.getElementById('fTitle').addEventListener('input', autoSlug);
}

function autoSlug() {
  const slug = document.getElementById('fSlug');
  if (!slug.dataset.manual) {
    slug.value = document.getElementById('fTitle').value
      .toLowerCase().trim()
      .replace(/\s+/g,'-')
      .replace(/[^\w\-]/g,'')
      .substring(0,50);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fSlug')?.addEventListener('input', function(){
    this.dataset.manual = '1';
  });
});

function editPost(slug) {
  const p = getPosts().find(x => x.slug === slug);
  if (!p) return;
  document.getElementById('editSlug').value  = slug;
  document.getElementById('fTitle').value    = p.title;
  document.getElementById('fSlug').value     = p.slug;
  document.getElementById('fSlug').dataset.manual = '1';
  document.getElementById('fAuthor').value   = p.author || '';
  document.getElementById('fDate').value     = p.date;
  document.getElementById('fReadTime').value = p.readTime;
  document.getElementById('fTags').value     = p.tags.join(', ');
  document.getElementById('fEmoji').value    = p.emoji || '📄';
  document.getElementById('fExcerpt').value  = p.excerpt;
  document.getElementById('fContent').value  = p.content || '';
  document.getElementById('modalTitle').textContent = '✏️ تعديل المقال';
  livePreview();
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  delete document.getElementById('fSlug').dataset.manual;
}
function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function savePost() {
  const title    = document.getElementById('fTitle').value.trim();
  const slug     = document.getElementById('fSlug').value.trim().replace(/[^\w\-]/g,'');
  const author   = document.getElementById('fAuthor').value.trim() || 'صاحب المدوّنة';
  const date     = document.getElementById('fDate').value;
  const readTime = parseInt(document.getElementById('fReadTime').value) || 5;
  const tags     = document.getElementById('fTags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const emoji    = document.getElementById('fEmoji').value.trim() || '📄';
  const excerpt  = document.getElementById('fExcerpt').value.trim();
  const content  = document.getElementById('fContent').value.trim();
  const editSlug = document.getElementById('editSlug').value;

  if (!title || !slug || !excerpt || !content) {
    toast('⚠️ يرجى ملء جميع الحقول المطلوبة'); return;
  }

  const posts = getPosts();
  const post = { slug, title, excerpt, date, author, tags, readTime, emoji, content };

  if (editSlug) {
    const idx = posts.findIndex(p => p.slug === editSlug);
    if (idx > -1) posts[idx] = post; else posts.unshift(post);
  } else {
    if (posts.find(p => p.slug === slug)) { toast('⚠️ الـ slug مستخدم مسبقاً، غيّره'); return; }
    posts.unshift(post);
  }

  savePosts(posts);
  closeModal();
  renderStats();
  renderTagFilter();
  renderTable();
  toast(editSlug ? '✅ تم تحديث المقال!' : '✅ تمت إضافة المقال!');
}

// ── Delete ────────────────────────────────────────────────────────────────────
let pendingDelete = null;
function openDelete(slug, title) {
  pendingDelete = slug;
  document.getElementById('deletePostTitle').textContent = title;
  document.getElementById('deleteOverlay').classList.add('open');
}
function closeDelete(e) {
  if (!e || e.target === document.getElementById('deleteOverlay')) {
    document.getElementById('deleteOverlay').classList.remove('open');
    pendingDelete = null;
  }
}
function confirmDelete() {
  if (!pendingDelete) return;
  const posts = getPosts().filter(p => p.slug !== pendingDelete);
  savePosts(posts);
  closeDelete();
  renderStats();
  renderTagFilter();
  renderTable();
  toast('🗑️ تم حذف المقال');
}

// ── Editor Helpers ────────────────────────────────────────────────────────────
const snippets = {
  h2:  ['<h2>', '</h2>'],
  h3:  ['<h3>', '</h3>'],
  p:   ['<p>', '</p>'],
  b:   ['<strong>', '</strong>'],
  code:['<code>', '</code>'],
  pre: ['<pre><code>', '</code></pre>'],
  ul:  ['<ul>\n  <li>', '</li>\n</ul>'],
  bq:  ['<blockquote>', '</blockquote>'],
  a:   ['<a href="', '">نص الرابط</a>'],
};
function ins(type) {
  const ta = document.getElementById('fContent');
  const [o, c] = snippets[type];
  const s = ta.selectionStart, e = ta.selectionEnd;
  const sel = ta.value.substring(s, e) || 'النص هنا';
  ta.value = ta.value.substring(0, s) + o + sel + c + ta.value.substring(e);
  ta.focus();
  livePreview();
}
function livePreview() {
  const pane = document.getElementById('livePreviewPane');
  if (pane.style.display !== 'none') pane.innerHTML = document.getElementById('fContent').value;
}
function togglePreview() {
  const pane = document.getElementById('livePreviewPane');
  const ta   = document.getElementById('fContent');
  if (pane.style.display === 'none') {
    pane.style.display = 'block';
    pane.style.flex = '1';
    ta.style.flex = '1';
    livePreview();
  } else {
    pane.style.display = 'none';
  }
}

// ── Export posts.js ───────────────────────────────────────────────────────────
function exportPostsJS() {
  const posts = getPosts();
  // Strip content field from posts.js (it's in HTML files)
  const light = posts.map(({content, ...rest}) => rest);
  const js = 'const POSTS = ' + JSON.stringify(light, null, 2) + ';\n';
  download('posts.js', js, 'text/javascript');
  toast('⬇️ تم تنزيل posts.js');
}

// ── Export all HTML post pages ────────────────────────────────────────────────
const postTemplate = (p) => {
const months2=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const dt = new Date(p.date);
const dateAr = isNaN(dt) ? p.date : `${dt.getDate()} ${months2[dt.getMonth()]} ${dt.getFullYear()}`;
const tagsHtml = p.tags.map(t=>`<span class="tag">${t}</span>`).join('');
return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${p.title}</title>
  <link rel="stylesheet" href="../assets/style.css">
</head>
<body>
<nav>
  <a href="../index.html" class="logo">📝 مدوّنتي</a>
  <div class="nav-links">
    <a href="../index.html">الرئيسية</a>
    <a href="../about.html">عن المدوّنة</a>
    <a href="../archive.html">الأرشيف</a>
  </div>
  <button class="menu-btn" onclick="toggleMenu()">☰</button>
</nav>
<div class="mobile-menu" id="mobileMenu">
  <a href="../index.html">الرئيسية</a>
  <a href="../about.html">عن المدوّنة</a>
  <a href="../archive.html">الأرشيف</a>
</div>
<div class="post-hero">
  <div class="post-hero-inner">
    <div class="post-tags">${tagsHtml}</div>
    <h1>${p.title}</h1>
    <div class="post-meta">
      <span>📅 ${dateAr}</span>
      <span>✍️ ${p.author}</span>
      <span>⏱️ ${p.readTime} دقائق قراءة</span>
    </div>
  </div>
</div>
<div class="container">
  <div class="post-content">
${p.content}
  </div>
  <div class="post-nav">
    <a href="../index.html">← العودة للرئيسية</a>
    <a href="../archive.html">الأرشيف ←</a>
  </div>
</div>
<footer>
  <div class="footer-inner">
    <div class="footer-logo">📝 مدوّنتي</div>
    <div class="footer-links">
      <a href="../index.html">الرئيسية</a>
      <a href="../about.html">عن المدوّنة</a>
      <a href="../archive.html">الأرشيف</a>
    </div>
    <p class="copy">© <span id="yr"></span> جميع الحقوق محفوظة</p>
  </div>
</footer>
<script>
  document.getElementById("yr").textContent=new Date().getFullYear();
  function toggleMenu(){document.getElementById("mobileMenu").classList.toggle("open");}
<\/script>
</body>
</html>`;
};

async function exportAllHTML() {
  const posts = getPosts().filter(p => p.content);
  if (!posts.length) { toast('⚠️ لا توجد مقالات تحتوي على محتوى'); return; }

  // Use JSZip if available, otherwise download one by one
  for (const p of posts) {
    download(`${p.slug}.html`, postTemplate(p), 'text/html');
    await new Promise(r => setTimeout(r, 200));
  }
  toast(`⬇️ تم تنزيل ${posts.length} ملف HTML`);
}

function download(filename, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], {type}));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
