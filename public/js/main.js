/**
 * main.js — Cargador modular de componentes (header / footer).
 * Intenta traer los parciales desde /componentes con Fetch API.
 * Si falla (p. ej. al abrir el archivo con file://), usa una copia
 * embebida para que la página nunca quede sin navegación.
 */

const FALLBACK = {
  header: `
<header class="site-header">
  <div class="container nav">
    <a class="brand" href="index.html" aria-label="Inicio">
      <span class="brand-mark">&gt;_</span> JCHUIZ<span class="accent">://lab</span>
    </a>
    <nav class="nav-links" aria-label="Principal">
      <a href="index.html" data-nav="inicio">inicio</a>
      <a href="index.html#sobre-mi">sobre mí</a>
      <a href="proyectos.html" data-nav="proyectos">proyectos</a>
    </nav>
  </div>
</header>`,
  footer: `
<footer class="site-footer">
  <div class="container footer-inner">
    <p class="mono">JCHUIZ<span class="accent">://lab</span> &mdash; bitácora de desarrollo, sistemas distribuidos y experimentación de hardware.</p>
    <p class="mono muted">prototipo v0.1 · sitio 100% estático · <span data-year></span></p>
  </div>
</footer>`
};

async function loadPartial(name) {
  try {
    const res = await fetch(`componentes/${name}.html`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    const html = await res.text();
    if (!html.trim()) throw new Error('vacío');
    return html;
  } catch {
    return FALLBACK[name];
  }
}

async function mountComponents() {
  const slots = document.querySelectorAll('[data-include]');
  await Promise.all([...slots].map(async (slot) => {
    const name = slot.getAttribute('data-include');
    if (!(name in FALLBACK)) return;
    slot.outerHTML = await loadPartial(name);
  }));

  // Marca el enlace activo según la página actual
  const page = document.body.dataset.page;
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === page) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

mountComponents();
