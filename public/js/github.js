/**
 * github.js — Cliente de la API pública de GitHub para JCHUIZ10.
 * - Lista repositorios originales (sin forks).
 * - Guarda una copia en sessionStorage para no agotar el límite
 *   de 60 peticiones/hora de la API sin autenticación.
 * - Todo el contenido se inserta con textContent (sin innerHTML con datos externos).
 */

const USER = 'JCHUIZ10';
const API = `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`;
const CACHE_KEY = 'jchuiz-repos-v1';
const CACHE_TTL = 10 * 60 * 1000; // 10 min

const LANG_COLORS = {
  JavaScript: '#F6C945',
  TypeScript: '#D9D9D6',
  Python: '#FFF6E0',
  HTML: '#8A8D8F',
  CSS: '#8A8D8F'
};

const grid = document.getElementById('repo-grid');
const toolbar = document.getElementById('repo-filters');
const counter = document.getElementById('repo-count');

let allRepos = [];
let activeLang = 'Todos';

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    return Date.now() - at < CACHE_TTL ? data : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch { /* almacenamiento no disponible: se ignora */ }
}

async function fetchRepos() {
  const cached = readCache();
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(API, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal
    });
    if (res.status === 403) throw new Error('rate-limit');
    if (!res.ok) throw new Error(`http-${res.status}`);
    const json = await res.json();
    const repos = (Array.isArray(json) ? json : [])
      .filter((r) => !r.fork)
      .map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        url: r.html_url,
        stars: r.stargazers_count,
        updated: r.pushed_at || r.updated_at
      }));
    writeCache(repos);
    return repos;
  } finally {
    clearTimeout(timer);
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

function isSafeGithubUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === 'github.com';
  } catch {
    return false;
  }
}

function repoCard(repo) {
  const card = el('article', 'card');

  const meta = el('div', 'card-meta');
  const lang = el('span', 'tag lang');
  const dot = el('span', 'dot');
  dot.style.background = LANG_COLORS[repo.language] || 'var(--mid-gray)';
  lang.append(dot, document.createTextNode(repo.language || 'sin lenguaje'));
  meta.append(lang, el('span', 'card-date', formatDate(repo.updated)));

  const title = el('h3', 'repo-name');
  if (isSafeGithubUrl(repo.url)) {
    const a = el('a', null, repo.name);
    a.href = repo.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    title.append(a);
  } else {
    title.textContent = repo.name;
  }

  const desc = el('p', null, repo.description || 'Repositorio sin descripción por ahora.');

  const foot = el('div', 'card-foot');
  foot.append(el('span', null, `★ ${repo.stars ?? 0}`), el('span', null, 'github ↗'));

  card.append(meta, title, desc, foot);
  return card;
}

function renderStatus(html) {
  grid.replaceChildren();
  const box = el('div', 'status-box');
  box.innerHTML = html; // solo texto estático propio
  grid.append(box);
}

function renderFilters() {
  const langs = ['Todos', ...new Set(allRepos.map((r) => r.language).filter(Boolean))];
  toolbar.replaceChildren(...langs.map((l) => {
    const b = el('button', `filter-btn${l === activeLang ? ' active' : ''}`, l);
    b.type = 'button';
    b.addEventListener('click', () => { activeLang = l; renderFilters(); renderRepos(); });
    return b;
  }));
}

function renderRepos() {
  const list = activeLang === 'Todos' ? allRepos : allRepos.filter((r) => r.language === activeLang);
  if (counter) counter.textContent = `${list.length} repositorio${list.length === 1 ? '' : 's'}`;
  if (!list.length) {
    renderStatus('No hay repositorios para mostrar en esta categoría.');
    return;
  }
  grid.replaceChildren(...list.map(repoCard));
}

async function init() {
  if (!grid) return;
  try {
    allRepos = await fetchRepos();
    if (!allRepos.length) {
      if (counter) counter.textContent = '0 repositorios';
      renderStatus('Aún no hay repositorios públicos originales. <strong>Pronto habrá novedades.</strong>');
      return;
    }
    renderFilters();
    renderRepos();
  } catch (err) {
    const msg = err && err.message === 'rate-limit'
      ? 'Se alcanzó el límite temporal de la API de GitHub. <strong>Vuelve a intentarlo en unos minutos.</strong>'
      : 'No se pudo conectar con GitHub en este momento. <strong>Inténtalo de nuevo más tarde.</strong>';
    if (counter) counter.textContent = 'sin conexión';
    renderStatus(msg);
  }
}

init();
