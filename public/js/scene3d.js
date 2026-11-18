/**
 * scene3d.js — Nodo topológico poliédrico con Three.js.
 * - Se carga de forma diferida (no bloquea el renderizado inicial).
 * - Si Three.js o WebGL no están disponibles, la página sigue funcionando
 *   y se muestra un texto de respaldo dentro del contenedor.
 */

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const COLORS = {
  edges: 0x8a8d8f,
  vertices: 0xf6c945,
  core: 0xf6c945
};

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

async function initScene(container) {
  if (!container || !hasWebGL()) return;

  let THREE;
  try {
    THREE = await import(THREE_URL);
  } catch (err) {
    console.warn('[scene3d] No se pudo cargar Three.js; se mantiene el respaldo.', err);
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  // Poliedro exterior
  const outerGeo = new THREE.IcosahedronGeometry(1.75, 1);
  const outerEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(outerGeo),
    new THREE.LineBasicMaterial({ color: COLORS.edges, transparent: true, opacity: 0.75 })
  );
  group.add(outerEdges);

  // Vértices únicos del poliedro
  const pos = outerGeo.getAttribute('position');
  const seen = new Set();
  const verts = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const key = `${x.toFixed(3)}|${y.toFixed(3)}|${z.toFixed(3)}`;
    if (!seen.has(key)) { seen.add(key); verts.push(x, y, z); }
  }
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  const points = new THREE.Points(
    pointsGeo,
    new THREE.PointsMaterial({ color: COLORS.vertices, size: 0.11, sizeAttenuation: true })
  );
  group.add(points);

  // Núcleo interno
  const inner = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.6, 0)),
    new THREE.LineBasicMaterial({ color: COLORS.core, transparent: true, opacity: 0.55 })
  );
  group.add(inner);

  // Ajuste de tamaño
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight || w;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  if ('ResizeObserver' in window) {
    new ResizeObserver(resize).observe(container);
  } else {
    window.addEventListener('resize', resize);
  }

  // Reacción al cursor
  const target = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // Pausar cuando no es visible
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(container);
  }

  let tilt = { x: 0, y: 0 };
  let spin = 0;
  const clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduceMotion) spin += dt * 0.25;

    tilt.x += (target.y * 0.5 - tilt.x) * 0.05;
    tilt.y += (target.x * 0.7 - tilt.y) * 0.05;

    group.rotation.x = tilt.x + spin * 0.4;
    group.rotation.y = tilt.y + spin;
    inner.rotation.x = -spin * 1.6;
    inner.rotation.z = spin * 1.2;

    renderer.render(scene, camera);
  }
  frame();

  container.classList.add('is-ready');
}

function start() {
  const container = document.getElementById('scene3d');
  const run = () => initScene(container);
  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 1500 });
  } else {
    setTimeout(run, 200);
  }
}

if (document.readyState === 'complete') {
  start();
} else {
  window.addEventListener('load', start, { once: true });
}
