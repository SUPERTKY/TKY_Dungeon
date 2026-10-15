/* Fixed source image + transparent effects. Coordinates use the original 1672×941 pixels. */
(() => {
  "use strict";
  const settings = {
    enabled: true,
    speed: 1,
    waterfalls: { enabled: true, intensity: 0.5 },
    river: { enabled: true, intensity: 0.35 },
    blueGlow: { enabled: true, intensity: 0.055 },
    sunbeams: { enabled: true, intensity: 0.018 },
    motes: { enabled: true, intensity: 0.2, count: 7 },
    debugMasks: false,
    maxDpr: 1.5,
    maxPixels: 2073600,
    fps: 30
  };
  const screen = document.getElementById("mainScreen");
  const canvas = document.getElementById("titleEffects");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const image = new Image();
  image.src = "./assets/start_background.png";
  let ready = false, active = false, paused = false, frame = 0;
  let time = 0, last = null, lastPaint = -Infinity;
  let width = 0, height = 0, dpr = 1;
  let view = { scale: 1, x: 0, y: 0 };
  const tiles = [];
  const lights = [];
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };
  // Traced inside the white water, not around the surrounding rocks or moss.
  const waterfallPaths = [
    [[609,578],[617,575],[621,586],[619,603],[612,607],[607,601]],
    [[637,575],[644,577],[646,588],[643,603],[637,610],[633,602]],
    [[676,647],[683,651],[688,671],[689,692],[681,694],[679,673]],
    [[710,648],[721,653],[728,675],[730,694],[720,698],[716,675]],
    [[740,647],[748,649],[755,663],[761,688],[761,698],[751,701],[748,681],[744,663]],
    [[835,650],[843,647],[848,662],[848,693],[840,699],[834,692]],
    [[858,651],[865,649],[868,666],[868,695],[858,699],[854,691]],
    [[704,732],[716,733],[725,744],[733,745],[741,738],[750,736],[754,746],
     [768,735],[778,732],[780,745],[773,758],[768,776],[754,779],[740,777],
     [729,779],[722,764],[715,756]],
    [[981,738],[988,740],[994,756],[999,778],[991,780],[985,761]],
    [[1005,738],[1014,740],[1021,753],[1026,777],[1018,782],[1011,768]]
  ];
  // Narrow open-water interiors. Foreground rocks, banks and reflected leaves are excluded below.
  const riverPaths = [
    [[897,795],[925,794],[949,798],[982,793],[1008,797],[1044,797],[1084,794],[1112,797],
     [1137,806],[1134,824],[1110,831],[1080,832],[1051,825],[1020,830],[993,823],
     [960,827],[932,821],[909,820]],
    [[812,828],[853,825],[878,831],[910,828],[940,835],[976,834],[1005,842],[1044,839],
     [1072,847],[1107,842],[1156,846],[1188,855],[1195,868],[1168,881],[1128,888],
     [1090,886],[1057,877],[1018,882],[979,873],[943,868],[913,860],[878,853],[842,850]],
    [[952,887],[978,883],[1008,891],[1030,886],[1060,891],[1080,903],[1073,916],
     [1040,919],[1010,912],[986,914],[972,905]]
  ];
  function path(points, context) {
    context.beginPath();
    points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y));
    context.closePath();
  }
  function makeTile(points, kind) {
    const x = Math.floor(Math.min(...points.map(p => p[0])));
    const y = Math.floor(Math.min(...points.map(p => p[1])));
    const w = Math.ceil(Math.max(...points.map(p => p[0]))) - x + 1;
    const h = Math.ceil(Math.max(...points.map(p => p[1]))) - y + 1;
    const mask = document.createElement("canvas"); mask.width = w; mask.height = h;
    const m = mask.getContext("2d", { willReadFrequently: true });
    m.translate(-x, -y); path(points, m); m.fillStyle = "white"; m.fill(); m.resetTransform();
    const data = m.getImageData(0, 0, w, h);
    const sample = document.createElement("canvas"); sample.width = w; sample.height = h;
    const sc = sample.getContext("2d", { willReadFrequently: true });
    sc.drawImage(image, x, y, w, h, 0, 0, w, h);
    const pixels = sc.getImageData(0, 0, w, h).data;
    const eligible = new Float32Array(w * h);
    for (let i = 0; i < eligible.length; i++) {
      const k = i * 4, r = pixels[k], g = pixels[k + 1], b = pixels[k + 2];
      // Warm moss, yellow leaves and dark rock are never displaced.
      const color = kind === "waterfalls"
        ? smooth(45, 130, Math.min(r, g, b)) * smooth(-24, 8, b - r)
        : smooth(5, 24, g - r) * smooth(-15, 10, b - r) * smooth(35, 80, g);
      eligible[i] = data.data[k + 3] / 255 * color;
    }
    // Inward erosion gives every sampled pixel a margin; no rock gets pulled into the water.
    const radius = 2;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      let a = eligible[py * w + px];
      for (let dy = -radius; dy <= radius && a > 0; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) { a = 0; break; }
          a = Math.min(a, eligible[ny * w + nx]);
        }
      }
      const k = (py * w + px) * 4;
      data.data[k] = 80; data.data[k + 1] = 220; data.data[k + 2] = 255;
      data.data[k + 3] = Math.round(a * 255);
    }
    m.putImageData(data, 0, 0);
    const output = document.createElement("canvas"); output.width = w; output.height = h;
    return { x, y, w, h, mask, output, context: output.getContext("2d"), kind };
  }
  function resize() {
    width = screen.clientWidth; height = screen.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, settings.maxDpr, Math.sqrt(settings.maxPixels / Math.max(1, width * height)));
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    const scale = Math.max(width / 1672, height / 941);
    // Same cover and object-position as the CSS background, including the portrait crop.
    const position = matchMedia("(max-aspect-ratio: 3/4)").matches ? 0.72 : 0.5;
    view = { scale, x: (width - 1672 * scale) * position, y: (height - 941 * scale) * 0.5 };
    if (active && paused) clear();
  }
  function clear() { ctx.resetTransform(); ctx.clearRect(0, 0, canvas.width, canvas.height); }
  function paintWater(tile, t) {
    const option = settings[tile.kind];
    if (!option.enabled || option.intensity <= 0) return;
    const { x, y, w, h, context: c } = tile;
    c.clearRect(0, 0, w, h);
    c.globalCompositeOperation = "source-over";
    if (tile.kind === "waterfalls") {
      // Two short, downward UV scrolls crossfade continuously, retaining the source's color.
      const phase = (t * 0.44 + x * 0.013) % 1;
      const second = (phase + 0.5) % 1;
      const weight = Math.sin(phase * Math.PI) ** 2;
      c.globalAlpha = weight;
      c.drawImage(image, x, y - phase * 1.8, w, h, 0, 0, w, h);
      // 'lighter' makes a true weighted sum instead of dimming the first sample.
      c.globalCompositeOperation = "lighter"; c.globalAlpha = 1 - weight;
      c.drawImage(image, x, y - second * 1.8, w, h, 0, 0, w, h);
    } else {
      c.globalAlpha = 1;
      for (let row = 0; row < h; row += 2) {
        const dh = Math.min(2, h - row);
        const dx = Math.sin((row + y) * 0.071 - t * 1.2) * 0.55;
        const dy = Math.sin((row + y) * 0.095 + t * 0.7) * 0.18;
        c.drawImage(image, x + dx, y + row + dy, w, dh, 0, row, w, dh);
      }
    }
    c.globalAlpha = 1; c.globalCompositeOperation = "destination-in";
    c.drawImage(tile.mask, 0, 0); c.globalCompositeOperation = "source-over";
    ctx.globalAlpha = clamp(option.intensity); ctx.drawImage(tile.output, x, y);
    ctx.globalAlpha = 1;
  }
  // Source-colored light: additive copies retain the original RGB proportions.
  // These are tight supports, further restricted by each pixel's actual color.
  const blueSupports = [
    [1224, 385, 17], [1284, 439, 17], [1296, 465, 16], [1355, 381, 19],
    [1424, 409, 15], [1466, 425, 16], [1515, 452, 21], [1556, 425, 20],
    [1230, 486, 14], [1111, 578, 18], [1080, 604, 13], [1132, 599, 15],
    [1544, 644, 18], [1522, 674, 17], [1570, 686, 17], [1618, 684, 20],
    [1657, 430, 14], [1446, 395, 31]
  ];
  const sunPaths = [
    [[567,140],[585,142],[503,420],[483,434]],
    [[623,164],[640,167],[566,431],[546,454]],
    [[664,203],[677,207],[629,403],[613,418]]
  ];
  function makeLight(points, kind, phase) {
    const x = Math.floor(Math.min(...points.map(p => p[0])));
    const y = Math.floor(Math.min(...points.map(p => p[1])));
    const w = Math.ceil(Math.max(...points.map(p => p[0]))) - x + 1;
    const h = Math.ceil(Math.max(...points.map(p => p[1]))) - y + 1;
    const mask = document.createElement("canvas"); mask.width = w; mask.height = h;
    const m = mask.getContext("2d", { willReadFrequently: true });
    m.translate(-x, -y); path(points, m); m.fillStyle = "white"; m.fill(); m.resetTransform();
    const area = m.getImageData(0, 0, w, h);
    const output = document.createElement("canvas"); output.width = w; output.height = h;
    const c = output.getContext("2d", { willReadFrequently: true });
    c.drawImage(image, x, y, w, h, 0, 0, w, h);
    const pixels = c.getImageData(0, 0, w, h);
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const k = (py * w + px) * 4;
      const r = pixels.data[k], g = pixels.data[k + 1], b = pixels.data[k + 2];
      const edge = smooth(0, 6, Math.min(px, py, w - 1 - px, h - 1 - py));
      const color = kind === "blueGlow"
        ? smooth(25, 95, b - r) * smooth(65, 150, b) * (1 - smooth(235, 255, b))
        : smooth(110, 205, (r + g + b) / 3) * smooth(-15, 30, r - b);
      const a = area.data[k + 3] / 255 * color * edge;
      pixels.data[k + 3] = Math.round(a * 255);
      area.data[k] = kind === "blueGlow" ? 80 : 255;
      area.data[k + 1] = kind === "blueGlow" ? 180 : 210;
      area.data[k + 2] = kind === "blueGlow" ? 255 : 80;
      area.data[k + 3] = Math.round(a * 255);
    }
    c.putImageData(pixels, 0, 0); m.putImageData(area, 0, 0);
    return { x, y, output, mask, kind, phase };
  }
  function paintLights(t) {
    ctx.globalCompositeOperation = "lighter";
    for (const light of lights) {
      const option = settings[light.kind];
      if (!option.enabled || option.intensity <= 0) continue;
      const pulse = light.kind === "blueGlow"
        ? 0.5 + 0.5 * Math.sin(t * 0.52 + light.phase)
        : 0.5 + 0.5 * Math.sin(t * 0.21 + light.phase);
      ctx.globalAlpha = clamp(option.intensity, 0, 0.2) * pulse;
      ctx.drawImage(light.output, light.x, light.y);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  function paintMotes(t) {
    const option = settings.motes;
    if (!option.enabled || option.intensity <= 0) return;
    const count = Math.round(clamp(option.count, 0, 12));
    for (let i = 0; i < count; i++) {
      const phase = (t / (27 + i * 2) + i * 0.61803398875) % 1;
      const x = 475 + ((i * 137.5) % 610) + Math.sin(t * 0.11 + i) * 5 + phase * 9;
      const y = 550 - ((i * 71) % 215) - phase * 35;
      ctx.globalAlpha = clamp(option.intensity, 0, 0.35) * Math.sin(phase * Math.PI) ** 2;
      ctx.fillStyle = "#eee3c0"; ctx.beginPath();
      ctx.arc(x, y, 0.65 + (i % 3) * 0.15, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function render(t) {
    clear();
    ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, dpr * view.x, dpr * view.y);
    for (const tile of tiles) paintWater(tile, t);
    paintLights(t);
    paintMotes(t);
    if (settings.debugMasks) {
      ctx.globalAlpha = 0.8;
      for (const tile of [...tiles, ...lights]) ctx.drawImage(tile.mask, tile.x, tile.y);
      ctx.globalAlpha = 1;
    }
  }
  function canRun() { return ready && active && !paused && settings.enabled && !motion.matches && !document.hidden; }
  function tick(now) {
    frame = 0;
    if (!canRun()) { last = null; canvas.style.visibility = "hidden"; clear(); return; }
    if (last !== null) time += Math.max(0, (now - last) / 1000) * clamp(settings.speed, 0, 4);
    last = now;
    if (now - lastPaint >= 1000 / Math.max(1, settings.fps)) { render(time); lastPaint = now; }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = null; lastPaint = -Infinity;
    canvas.style.visibility = canRun() ? "visible" : "hidden";
    if (canRun()) frame = requestAnimationFrame(tick); else clear();
  }
  const api = window.titleBackground = {
    settings,
    start() { active = true; paused = false; sync(); },
    pause() { paused = true; sync(); },
    resume() { paused = false; sync(); },
    stop() { active = false; time = 0; sync(); },
    refresh: sync,
    getState() { return { ready, active, paused, time, running: !!frame, view: { ...view }, maskPixels: tiles.map(tile => {
      const a = tile.mask.getContext("2d").getImageData(0, 0, tile.w, tile.h).data;
      let n = 0; for (let i = 3; i < a.length; i += 4) if (a[i]) n++;
      return { kind: tile.kind, x: tile.x, y: tile.y, pixels: n };
    }) }; }
  };
  image.onload = () => {
    for (const points of waterfallPaths) tiles.push(makeTile(points, "waterfalls"));
    for (const points of riverPaths) tiles.push(makeTile(points, "river"));
    blueSupports.forEach(([x, y, radius], i) => {
      const points = Array.from({ length: 24 }, (_, k) => {
        const angle = k / 24 * Math.PI * 2;
        return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];
      });
      lights.push(makeLight(points, "blueGlow", i * 1.73));
    });
    sunPaths.forEach((points, i) => lights.push(makeLight(points, "sunbeams", i * 1.1)));
    ready = true; resize(); sync();
  };
  image.onerror = () => { clear(); console.warn("Title effects unavailable; the static background remains enabled."); };
  new ResizeObserver(resize).observe(screen);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  window.addEventListener("pagehide", () => api.stop());
  window.addEventListener("pageshow", () => { if (screen.classList.contains("visible")) api.start(); });
})();
