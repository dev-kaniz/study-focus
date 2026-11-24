/* Particle background + bubbles + helper animations */

// ---------- Particle background ----------
(function particles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let W, H, parts = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  function make(n = 70) {
    parts = [];
    for (let i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        hue: [180, 270, 320][Math.floor(Math.random() * 3)],
        a: Math.random() * 0.6 + 0.2
      });
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.a})`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 65%)`;
      ctx.shadowBlur = 8;
      ctx.fill();
    });
    // Connect nearby
    for (let i = 0; i < parts.length; i++)
      for (let j = i + 1; j < parts.length; j++) {
        const dx = parts[i].x - parts[j].x, dy = parts[i].y - parts[j].y;
        const d = Math.hypot(dx, dy);
        if (d < 110) {
          ctx.strokeStyle = `hsla(200,100%,70%,${0.15 * (1 - d / 110)})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(parts[i].x, parts[i].y);
          ctx.lineTo(parts[j].x, parts[j].y);
          ctx.stroke();
        }
      }
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', () => { resize(); make(); });
  resize(); make(); draw();
})();

// ---------- Bubbles (anime.js) ----------
const Bubbles = (() => {
  const container = document.getElementById('bubbles');
  const data = [
    { label: 'Min', size: 70, color: '#00f0ff' },
    { label: 'Pomo', size: 55, color: '#b14dff' },
    { label: 'XP', size: 50, color: '#ff2e88' },
    { label: 'Streak', size: 45, color: '#2effa0' }
  ];

  function render(values) {
    container.innerHTML = '';
    data.forEach((d, i) => {
      const el = document.createElement('div');
      el.className = 'bubble';
      el.style.width = el.style.height = d.size + 'px';
      el.style.background =
        `radial-gradient(circle at 30% 30%, rgba(255,255,255,.5), transparent 60%),
         linear-gradient(135deg, ${d.color}, #b14dff)`;
      el.style.left = (12 + i * 22) + '%';
      el.style.top  = (5 + (i % 2) * 55) + '%';
      el.textContent = (values?.[i] ?? 0) + (i === 0 ? '' : '');
      el.title = d.label + ': ' + (values?.[i] ?? 0);
      el.addEventListener('mouseenter', () => {
        Sound.play('pop');
        anime({ targets: el, scale: [1, 1.25, 1], duration: 400, easing: 'easeOutQuad' });
      });
      container.appendChild(el);
      // Float loop
      anime({
        targets: el,
        translateY: [{ value: -8 }, { value: 8 }],
        translateX: [{ value: -4 }, { value: 4 }],
        duration: 2500 + i * 300,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine'
      });
    });
  }
  return { render };
})();

// ---------- XP bar ----------
const XP = (() => {
  let xp = +(localStorage.getItem('xp') || 0);
  let lvl = +(localStorage.getItem('lvl') || 1);
  const max = 100;

  function update() {
    if (xp >= max) { xp -= max; lvl++; localStorage.setItem('lvl', lvl); }
    localStorage.setItem('xp', xp);
    document.getElementById('lvlNum').textContent = lvl;
    document.getElementById('xpNow').textContent = xp;
    document.getElementById('xpMax').textContent = max;
    gsap.to('#xpFill', { width: (xp / max) * 100 + '%', duration: 0.6, ease: 'power2.out' });
  }
  function add(n) {
    xp += n;
    Sound.play('success');
    if (xp >= max) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.4 } });
    }
    update();
  }
  function getLevel() { return lvl; }
  update();
  return { add, update, getLevel };
})();

// ---------- Badges ----------
const Badges = (() => {
  const list = ['🥉','🥈','🥇','💎','🔥','🧠','⏰','🌙'];
  const el = document.getElementById('badges');
  function render(unlocked = []) {
    el.innerHTML = '';
    list.forEach((b, i) => {
      const d = document.createElement('div');
      d.className = 'badge-item' + (unlocked.includes(i) ? ' on' : '');
      d.textContent = b;
      d.title = 'Badge ' + (i + 1);
      el.appendChild(d);
    });
  }
  function unlock(i) {
    const target = el.children[i];
    if (!target) return;
    target.classList.add('on');
    anime({ targets: target, scale: [0, 1.4, 1], duration: 700, easing: 'easeOutElastic(1,.5)' });
    Sound.play('success');
  }
  return { render, unlock };
})();

// ---------- Typewriter ----------
function typeWriter(el, text, speed = 18) {
  el.textContent = '';
  let i = 0;
  return new Promise(res => {
    const id = setInterval(() => {
      el.textContent += text[i++] || '';
      if (i >= text.length) { clearInterval(id); res(); }
    }, speed);
  });
}
