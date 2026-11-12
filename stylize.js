// Draws each project image as green outline art on a canvas over it.
// Hovering the row fades back to the original image (see .stylized in styles.css).
// If anything here fails, the images simply show as normal.
(() => {
  const GREEN = [0, 249, 0];

  function luminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Average colour of the image's outer border, treated as "background",
  // so the subject can be told apart whether the picture is light or dark.
  function backgroundColor(img) {
    const n = 32;
    const c = document.createElement("canvas");
    c.width = n; c.height = n;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, n, n);
    const d = ctx.getImageData(0, 0, n, n).data;
    let r = 0, g = 0, b = 0, k = 0;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (x > 1 && x < n - 2 && y > 1 && y < n - 2) continue;
        const i = (y * n + x) * 4;
        r += d[i]; g += d[i + 1]; b += d[i + 2]; k++;
      }
    }
    return [r / k, g / k, b / k];
  }

  // Where the image lands inside a W x H box for object-fit cover / contain.
  function fitRect(iw, ih, W, H, fit) {
    const s = fit === "contain" ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih);
    const w = iw * s, h = ih * s;
    return [(W - w) / 2, (H - h) / 2, w, h];
  }

  function blur(src, w, h) {
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0, k = 0;
        for (let j = -1; j <= 1; j++) {
          const yy = y + j; if (yy < 0 || yy >= h) continue;
          for (let i = -1; i <= 1; i++) {
            const xx = x + i; if (xx < 0 || xx >= w) continue;
            s += src[yy * w + xx]; k++;
          }
        }
        out[y * w + x] = s / k;
      }
    }
    return out;
  }

  function sobel(a, w, h) {
    const out = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx = a[i - w + 1] + 2 * a[i + 1] + a[i + w + 1] - a[i - w - 1] - 2 * a[i - 1] - a[i + w - 1];
        const gy = a[i + w - 1] + 2 * a[i + w] + a[i + w + 1] - a[i - w - 1] - 2 * a[i - w] - a[i - w + 1];
        out[i] = Math.hypot(gx, gy);
      }
    }
    return out;
  }

  // Value below which `q` of the non-zero samples fall (cheap, sampled).
  function quantile(a, q) {
    const s = [];
    for (let i = 0; i < a.length; i += 7) if (a[i] > 0) s.push(a[i]);
    if (!s.length) return 1;
    s.sort((x, y) => x - y);
    return s[Math.min(s.length - 1, Math.floor(q * s.length))];
  }

  // Otsu's method: the cut that best splits values into two groups
  // (here: "background-ish" vs "subject" by distance from the background colour).
  function otsu(a) {
    const bins = 64, hist = new Float64Array(bins);
    for (let i = 0; i < a.length; i++) hist[Math.min(bins - 1, Math.floor(a[i] * bins))]++;
    const total = a.length;
    let sumAll = 0;
    for (let b = 0; b < bins; b++) sumAll += b * hist[b];
    let wB = 0, sumB = 0, best = 0, cut = 0;
    for (let b = 0; b < bins; b++) {
      wB += hist[b]; if (!wB) continue;
      const wF = total - wB; if (!wF) break;
      sumB += b * hist[b];
      const mB = sumB / wB, mF = (sumAll - sumB) / wF;
      const between = wB * wF * (mB - mF) * (mB - mF);
      if (between > best) { best = between; cut = b; }
    }
    return (cut + 0.5) / bins;
  }

  function render(media) {
    const img = media.querySelector("img");
    if (!img || !img.naturalWidth) return;
    const W = media.clientWidth, H = media.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(W * dpr), h = Math.round(H * dpr);
    const fit = getComputedStyle(img).objectFit === "contain" ? "contain" : "cover";

    const off = document.createElement("canvas");
    off.width = w; off.height = h;
    const g = off.getContext("2d", { willReadFrequently: true });
    const bg = backgroundColor(img);
    g.fillStyle = `rgb(${bg.map(Math.round).join(",")})`;
    g.fillRect(0, 0, w, h);
    const [dx, dy, dw, dh] = fitRect(img.naturalWidth, img.naturalHeight, W, H, fit);
    g.drawImage(img, dx * dpr, dy * dpr, dw * dpr, dh * dpr);
    const px = g.getImageData(0, 0, w, h).data;

    const lum = new Float32Array(w * h), dist = new Float32Array(w * h);
    const maxDist = Math.sqrt(3) * 255;
    for (let i = 0; i < w * h; i++) {
      const r = px[i * 4], gg = px[i * 4 + 1], b = px[i * 4 + 2];
      lum[i] = luminance(r, gg, b);
      dist[i] = Math.hypot(r - bg[0], gg - bg[1], b - bg[2]) / maxDist;
    }
    const lumB = blur(lum, w, h), distB = blur(dist, w, h);
    const eL = sobel(lumB, w, h), eD = sobel(distB, w, h);
    const e = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) e[i] = Math.max(eL[i], eD[i] * 255);

    // Edge strength, log-compressed so weak edges (e.g. dark faces against a
    // similar background) still register next to strong ones.
    const top = Math.log1p(quantile(e, 0.995));
    for (let i = 0; i < w * h; i++) e[i] = Math.log1p(e[i]) / top;

    // Cap line coverage: on clean renders most pixels have no edge, so this
    // stays at 0.45; on busy photos it rises and keeps only the strongest lines.
    const sample = [];
    for (let i = 0; i < e.length; i += 5) sample.push(e[i]);
    sample.sort((a, b) => a - b);
    const t0 = Math.max(0.45, sample[Math.floor(0.88 * sample.length)]);

    // Subject mask, and its boundary: the silhouette is always drawn.
    const cut = Math.max(0.06, otsu(distB));
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) mask[i] = distB[i] > cut ? 1 : 0;
    const rim = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (!mask[i]) continue;
        if (!mask[i - 1] || !mask[i + 1] || !mask[i - w] || !mask[i + w]) rim[i] = 1;
      }
    }

    let canvas = media.querySelector("canvas.stylize");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "stylize";
      canvas.setAttribute("aria-hidden", "true");
      media.appendChild(canvas);
    }
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    const out = ctx.createImageData(w, h);
    const o = out.data;
    const edgePad = Math.round(4 * dpr);   // ignore anything hugging the frame
    for (let i = 0; i < w * h; i++) {
      const xx = i % w, yy = (i - xx) / w;
      if (xx < edgePad || yy < edgePad || xx >= w - edgePad || yy >= h - edgePad) continue;
      const t = Math.min(1, Math.max(0, (e[i] - t0) / 0.3));
      const line = t * t * (3 - 2 * t);                  // smoothstep
      const fill = mask[i] ? 0.08 : 0;                   // faint silhouette
      const a = Math.max(rim[i] ? 1 : 0, line * 0.9, fill);
      o[i * 4] = GREEN[0]; o[i * 4 + 1] = GREEN[1]; o[i * 4 + 2] = GREEN[2];
      o[i * 4 + 3] = Math.round(a * 255);
    }
    ctx.putImageData(out, 0, 0);
    media.classList.add("stylized");
  }

  function setup(media) {
    const img = media.querySelector("img");
    if (!img) return;
    const go = () => { try { render(media); } catch (e) { media.classList.remove("stylized"); } };
    if (img.complete && img.naturalWidth) go();
    else img.addEventListener("load", go, { once: true });
    let t;
    new ResizeObserver(() => { clearTimeout(t); t = setTimeout(go, 150); }).observe(media);
  }

  document.querySelectorAll(".project-media").forEach(setup);
})();
