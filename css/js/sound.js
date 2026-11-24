/* Sound system using Howler.js — toggleable mute */
const Sound = (() => {
  let muted = localStorage.getItem('muted') === '1';
  let sounds = {};

  function init() {
    // Use base64 tones to avoid asset files
    sounds.click   = new Howl({ src: [tone(440, 0.05)], volume: 0.2 });
    sounds.success = new Howl({ src: [tone(880, 0.25)], volume: 0.3 });
    sounds.warning = new Howl({ src: [tone(220, 0.3)],  volume: 0.3 });
    sounds.tick    = new Howl({ src: [tone(1200, 0.02)], volume: 0.15 });
    sounds.pop     = new Howl({ src: [tone(600, 0.08)],  volume: 0.25 });
    sounds.ambient = new Howl({ src: [ambient()], volume: 0.15, loop: true });
  }

  // Generate a WAV tone as data URI
  function tone(freq, dur) {
    const sr = 8000, n = sr * dur;
    const buf = new ArrayBuffer(44 + n * 2);
    const view = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); view.setUint32(4, 36 + n * 2, true); w(8, 'WAVE');
    w(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, sr, true);
    view.setUint32(28, sr * 2, true); view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); w(36, 'data'); view.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) {
      const env = Math.exp(-3 * i / n);
      view.setInt16(44 + i * 2, Math.sin(2 * Math.PI * freq * i / sr) * 32767 * env, true);
    }
    const blob = new Blob([buf], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  // Soft ambient hum
  function ambient() {
    const sr = 8000, dur = 2, n = sr * dur;
    const buf = new ArrayBuffer(44 + n * 2);
    const view = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); view.setUint32(4, 36 + n * 2, true); w(8, 'WAVE');
    w(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, sr, true);
    view.setUint32(28, sr * 2, true); view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); w(36, 'data'); view.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const v = (Math.sin(2*Math.PI*110*t) + Math.sin(2*Math.PI*164*t)*.5) * 0.3;
      view.setInt16(44 + i * 2, v * 8000, true);
    }
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }

  function play(name) {
    if (muted || !sounds[name]) return;
    try { sounds[name].play(); } catch(e) {}
  }
  function toggle() {
    muted = !muted;
    localStorage.setItem('muted', muted ? '1' : '0');
    if (muted) Object.values(sounds).forEach(s => s.stop());
    return muted;
  }
  function isMuted() { return muted; }
  function startAmbient() { if (!muted && sounds.ambient) sounds.ambient.play(); }
  function stopAmbient()  { if (sounds.ambient) sounds.ambient.stop(); }

  return { init, play, toggle, isMuted, startAmbient, stopAmbient };
})();

window.addEventListener('load', () => Sound.init());
