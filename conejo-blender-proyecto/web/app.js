'use strict';

/* ---------- Navegación entre páginas (slides) ---------- */
class Deck {
  constructor() {
    this.slides = [...document.querySelectorAll('.slide')];
    this.menu = document.getElementById('menu');
    this.dots = document.getElementById('dots');
    this.bar = document.getElementById('bar');
    this.count = document.getElementById('count');
    this.prevBtn = document.getElementById('prev');
    this.nextBtn = document.getElementById('next');
    this.i = 0;

    this.slides.forEach((s, n) => {
      const m = document.createElement('button');
      m.textContent = s.dataset.title;
      m.onclick = () => this.go(n);
      this.menu.appendChild(m);
      const d = document.createElement('button');
      d.setAttribute('aria-label', 'Ir a ' + s.dataset.title);
      d.onclick = () => this.go(n);
      this.dots.appendChild(d);
    });

    this.prevBtn.onclick = () => this.go(this.i - 1);
    this.nextBtn.onclick = () => this.go(this.i + 1);
    document.querySelectorAll('[data-go]').forEach(b => {
      b.onclick = () => this.go(b.dataset.go === 'first' ? 0 : this.i + 1);
    });
    document.addEventListener('keydown', e => {
      if (['INPUT', 'AUDIO', 'VIDEO'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') this.go(this.i + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') this.go(this.i - 1);
      if (e.key === 'Home') this.go(0);
      if (e.key === 'End') this.go(this.slides.length - 1);
    });
    let x0 = null;
    document.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 70) this.go(this.i + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    let start = 0;
    try { start = +localStorage.getItem('slide') || 0; } catch (_) {}
    this.go(start);
  }

  go(n) {
    this.i = Math.max(0, Math.min(this.slides.length - 1, n));
    this.slides.forEach((s, k) => {
      s.classList.toggle('active', k === this.i);
      s.classList.toggle('past', k < this.i);
      if (k === this.i) s.scrollTop = 0;
    });
    [...this.menu.children].forEach((b, k) => b.classList.toggle('on', k === this.i));
    [...this.dots.children].forEach((b, k) => b.classList.toggle('on', k === this.i));
    this.bar.style.width = ((this.i + 1) / this.slides.length * 100) + '%';
    this.count.textContent = (this.i + 1) + ' / ' + this.slides.length;
    this.prevBtn.disabled = this.i === 0;
    this.nextBtn.disabled = this.i === this.slides.length - 1;
    this.menu.children[this.i].scrollIntoView({ inline: 'center', block: 'nearest' });
    try { localStorage.setItem('slide', this.i); } catch (_) {}
  }
}

/* ---------- Selector genérico (tarjetas / pestañas) ---------- */
function selector(container, detail, items, render) {
  items.forEach((it, n) => {
    const b = document.createElement('button');
    b.innerHTML = render(it);
    b.onclick = () => {
      [...container.children].forEach(c => c.classList.remove('on'));
      b.classList.add('on');
      detail.innerHTML = '<h3>' + it.t + '</h3><p>' + it.d + '</p>';
    };
    container.appendChild(b);
    if (n === 0 && container.id !== 'medios') b.click();
  });
}

const MEDIOS = [
  { i: '📝', t: 'Texto', d: 'Títulos, guion y explicaciones. En el proyecto: el guion del corto y los textos de esta página.' },
  { i: '📊', t: 'Gráficos', d: 'Esquemas, diagramas e infografías vectoriales: por ejemplo, el flujo de producción 3D.' },
  { i: '🖼️', t: 'Imágenes', d: 'Hoja de modelo del conejo, texturas y renders fijos desde Blender.' },
  { i: '🎞️', t: 'Animación', d: 'Gráficos en movimiento: caminata, parpadeo y movimiento de orejas del conejo con fotogramas clave.' },
  { i: '🎬', t: 'Video', d: 'Imágenes en movimiento: el cortometraje final renderizado y montado en MP4.' },
  { i: '🔊', t: 'Audio', d: 'Voces, efectos y música original que dan atmósfera y emoción al corto.' }
];
const AMBITOS = [
  { t: 'Educación', d: 'Cursos interactivos, simuladores y material didáctico con video y evaluación en línea.' },
  { t: 'Empresa', d: 'Presentaciones corporativas, catálogos interactivos, capacitación y kioscos informativos.' },
  { t: 'Entretenimiento', d: 'Videojuegos, cine de animación, cortometrajes y experiencias de realidad virtual.' },
  { t: 'Comunicación', d: 'Sitios web, medios digitales, publicidad y campañas en redes sociales.' },
  { t: 'Salud y ciencia', d: 'Visualización 3D de anatomía, simulaciones y divulgación científica.' },
  { t: 'Cultura y turismo', d: 'Museos virtuales, recorridos 360° y guías multimedia.' }
];
const HERR = [
  { t: 'Entorno de trabajo gráfico (3.1)', d: 'Flash: escenario y paneles. Blender: viewport 3D, outliner, propiedades y editores intercambiables.' },
  { t: 'Propiedades de objetos (3.2)', d: 'Posición, rotación, escala, color y materiales. En Blender: panel de propiedades y atajos N / G / R / S.' },
  { t: 'Escenario y línea de tiempo (3.3)', d: 'La línea de tiempo (Timeline) organiza qué ocurre y cuándo. Blender: Timeline / Dope Sheet / Graph Editor.' },
  { t: 'Fotogramas (3.4)', d: 'Cada imagen del movimiento. El corto va a 24 fotogramas por segundo; los fotogramas clave fijan poses.' },
  { t: 'Interpolación de movimiento (3.6)', d: 'El software calcula los cuadros intermedios entre dos poses (lineal, Bezier, constante).' },
  { t: 'Transformaciones (3.7)', d: 'Mover, rotar, escalar y deformar objetos; en Blender también modificadores y shape keys.' },
  { t: 'Símbolos y botones (3.8–3.9)', d: 'Clip de película, botón y gráfico. En esta web: botones HTML con eventos de JavaScript.' },
  { t: 'Importación y exportación (3.10)', d: 'Formatos: .blend, .fbx, .obj, PNG, WAV, MP3, MP4. Elegir formato según destino.' },
  { t: 'Edición de video y música (3.11)', d: 'Cortes, transiciones, color y mezcla de audio en la postproducción.' }
];
const PASOS = [
  { t: '1. Bloqueo de formas', d: 'Esferas y cilindros para definir volumen y proporciones generales del conejo.' },
  { t: '2. Refinamiento', d: 'Ajuste de proporciones: cabeza, orejas, manos, pies y expresión.' },
  { t: '3. Topología', d: 'Malla limpia de cuadriláteros en Blender, con bucles en ojos, boca y articulaciones.' },
  { t: '4. Detalles', d: 'Esculpido de cara, ropa y pliegues; vendaje en la oreja y desgaste.' },
  { t: '5. Materiales y texturas', d: 'Pelo (fur), ojos, camisa a rayas, chaleco y pantalón de tela envejecida.' },
  { t: '6. Escena y render', d: 'Iluminación de tres puntos, cámaras y renders en Cycles.' },
  { t: '7. Rig y animación', d: 'Esqueleto, pesos y animación del corto; exportación a video.' }
];

selector(document.getElementById('medios'), document.getElementById('medios-detalle'), MEDIOS,
  m => m.i + '<span>' + m.t + '</span>');
selector(document.getElementById('ambitos-tabs'), document.getElementById('ambitos-detalle'), AMBITOS, a => a.t);
selector(document.getElementById('herr-tabs'), document.getElementById('herr-detalle'), HERR, h => h.t);
(function () {
  const ol = document.getElementById('pasos');
  const det = document.getElementById('pasos-detalle');
  PASOS.forEach(p => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.textContent = p.t.replace(/^\d\.\s*/, '');
    b.onclick = () => {
      ol.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      det.innerHTML = '<h3>' + p.t + '</h3><p>' + p.d + '</p>';
    };
    li.appendChild(b);
    ol.appendChild(li);
  });
  ol.querySelector('button').click();
})();

/* ---------- Demo de botón + animación ---------- */
(function () {
  let n = 0;
  const out = document.getElementById('demo-out');
  const rabbit = document.getElementById('demo-rabbit');
  document.getElementById('demo-btn').addEventListener('click', () => {
    n++;
    out.textContent = n;
    const max = rabbit.parentElement.clientWidth - rabbit.offsetWidth;
    rabbit.style.left = ((n * 48) % Math.max(max, 1)) + 'px';
  });
})();

new Deck();
