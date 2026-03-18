
const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function fmtDate(d){
  const dt = new Date(d);
  return dt.getDate() + ' ' + months[dt.getMonth()] + ' ' + dt.getFullYear();
}

function buildCard(p) {
  return `
  <article class="card" data-tags="${p.tags.join(',')}" data-title="${p.title}">
    <div class="card-emoji">${p.emoji}</div>
    <div class="card-body">
      <div class="card-tags">
        ${p.tags.map(t=>`<span class="tag">${t}</span>`).join('')}
      </div>
      <h2><a href="posts/${p.slug}.html">${p.title}</a></h2>
      <p class="excerpt">${p.excerpt}</p>
      <div class="card-footer">
        <div class="card-meta">
          <span>📅 ${fmtDate(p.date)}</span>
          <span>⏱️ ${p.readTime} دقائق</span>
        </div>
        <a href="posts/${p.slug}.html" class="read-more">اقرأ →</a>
      </div>
    </div>
  </article>`;
}

// render all tags
const allTags = [...new Set(POSTS.flatMap(p => p.tags))];
let activeTag = null;

function renderTagsFilter() {
  const el = document.getElementById('tagsFilter');
  if (!el) return;
  el.innerHTML = `<button class="tag-btn active" onclick="filterByTag(null, this)">الكل</button>` +
    allTags.map(t => `<button class="tag-btn" onclick="filterByTag('${t}', this)">${t}</button>`).join('');
}

function filterByTag(tag, btn) {
  activeTag = tag;
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPosts();
}

function filterPosts() {
  renderPosts();
}

function renderPosts() {
  const q = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const grid = document.getElementById('postsGrid');
  const noRes = document.getElementById('noResults');
  if (!grid) return;

  const filtered = POSTS.filter(p => {
    const matchTag = !activeTag || p.tags.includes(activeTag);
    const matchQ   = !q || p.title.includes(q) || p.excerpt.includes(q);
    return matchTag && matchQ;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    noRes.style.display = 'block';
  } else {
    noRes.style.display = 'none';
    grid.innerHTML = filtered.map(buildCard).join('');
  }
}

function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', () => {
  renderTagsFilter();
  renderPosts();
});
