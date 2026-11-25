/* Particle Engine — hiệu ứng hạt rơi bằng HTML5 Canvas, nhẹ cho mobile.
   - requestAnimationFrame, tối đa 36 hạt mobile / 70 hạt desktop (máy đời cũ
     không giật; mobile tính theo màn hình <=640px HOẶC có cảm ứng).
   - Tự dừng khi tab ẩn (visibilitychange) và khi prefers-reduced-motion.
   - DPR cap ở 2, không resize liên tục (resize chỉ đổi lại số hạt khi
     chuyển ngưỡng mobile/desktop).
   - Vẽ bằng Canvas 2D, không tạo DOM node cho từng hạt, không gây lag Safari iOS.
   Loại: sakura (hoa đào rơi), heart (trái tim bay), snow (bông tuyết), glitter (kim tuyến). */
(function (root) {
  "use strict";

  var COLORS = {
    sakura: ["#f9a8d4", "#f472b6", "#fbcfe8", "#fda4af"],
    heart: ["#ef4444", "#f472b6", "#fb7185", "#e11d48"],
    snow: ["#ffffff", "#e0f2fe", "#f8fafc"],
    glitter: ["#facc15", "#fde68a", "#f59e0b", "#fff7cc"]
  };

  function isMobile() {
    if (typeof window === "undefined") return false;
    var narrow = window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
    var touch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    return !!(narrow || touch);
  }
  function reducedMotion() {
    return typeof window !== "undefined" && window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function ParticleEngine(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.type = (options && options.type) || "sakura";
    this.max = (options && options.max) || (isMobile() ? 36 : 70);
    this._mobile = isMobile();
    this.particles = [];
    this.running = false;
    this.rafId = 0;
    this.last = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._onResize = this.resize.bind(this);
    this._onVisibility = this._visibility.bind(this);
    window.addEventListener("resize", this._onResize);
    document.addEventListener("visibilitychange", this._onVisibility);
    this.resize();
    this._seed();
  }

  ParticleEngine.prototype.resize = function () {
    var rect = this.canvas.parentElement
      ? this.canvas.parentElement.getBoundingClientRect()
      : { width: window.innerWidth, height: window.innerHeight };
    var w = Math.max(320, rect.width || window.innerWidth);
    var h = Math.max(480, rect.height || window.innerHeight);
    this.w = w; this.h = h;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    /* Chỉ gieo lại hạt khi chuyển ngưỡng mobile/desktop (đổi số hạt
       36 <-> 70); resize thường (xoay máy, kéo khung preview) giữ nguyên
       hạt đang bay để không giật. */
    var nowMobile = isMobile();
    if (nowMobile !== this._mobile) {
      this._mobile = nowMobile;
      this.max = nowMobile ? 36 : 70;
      this._seed();
    }
  };

  ParticleEngine.prototype._seed = function () {
    var palette = COLORS[this.type] || COLORS.sakura;
    this.particles = [];
    var count = reducedMotion() ? Math.min(18, this.max) : this.max;
    for (var i = 0; i < count; i++) {
      this.particles.push(this._make(Math.random() * this.h));
    }
  };

  ParticleEngine.prototype._make = function (y) {
    var palette = COLORS[this.type] || COLORS.sakura;
    var size = this.type === "glitter" ? 2 + Math.random() * 3.5
      : this.type === "snow" ? 2 + Math.random() * 4
      : 6 + Math.random() * 9;
    return {
      x: Math.random() * this.w,
      y: typeof y === "number" ? y : -20 - Math.random() * 40,
      size: size,
      vy: this.type === "heart" ? 0.35 + Math.random() * 0.7
        : this.type === "glitter" ? 0.5 + Math.random() * 0.9
        : 0.5 + Math.random() * 1.1,
      vx: (Math.random() - 0.5) * 0.6,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.008 + Math.random() * 0.02,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      color: palette[Math.floor(Math.random() * palette.length)],
      alpha: 0.55 + Math.random() * 0.45,
      twinkle: Math.random() * Math.PI * 2
    };
  };

  ParticleEngine.prototype.setType = function (type) {
    if (!COLORS[type]) return;
    this.type = type;
    this._seed();
  };

  ParticleEngine.prototype.setMax = function (n) {
    this.max = n;
    this._seed();
  };

  ParticleEngine.prototype._visibility = function () {
    if (document.hidden) this.stop();
    else if (this._wantRun) this.start();
  };

  ParticleEngine.prototype.start = function () {
    this._wantRun = true;
    if (this.running || document.hidden) return;
    this.running = true;
    this.last = performance.now();
    var self = this;
    var tick = function (now) {
      if (!self.running) return;
      var dt = Math.min(50, now - self.last);
      self.last = now;
      self._step(dt / 16.7);
      self._draw();
      self.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  };

  ParticleEngine.prototype.stop = function () {
    this._wantRun = false;
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
  };

  ParticleEngine.prototype.destroy = function () {
    this.stop();
    window.removeEventListener("resize", this._onResize);
    document.removeEventListener("visibilitychange", this._onVisibility);
  };

  ParticleEngine.prototype._step = function (k) {
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      p.sway += p.swaySpeed * k;
      p.y += p.vy * k;
      p.x += p.vx * k + Math.sin(p.sway) * 0.5 * k;
      p.rot += p.rotSpeed * k;
      p.twinkle += 0.05 * k;
      if (p.y > this.h + 24) {
        var fresh = this._make();
        fresh.x = Math.random() * this.w;
        this.particles[i] = fresh;
      }
      if (p.x < -24) p.x = this.w + 20;
      if (p.x > this.w + 24) p.x = -20;
    }
  };

  ParticleEngine.prototype._draw = function () {
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      ctx.save();
      ctx.globalAlpha = p.alpha * (this.type === "glitter"
        ? 0.55 + 0.45 * Math.abs(Math.sin(p.twinkle)) : 1);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (this.type === "heart") this._heart(ctx, p.size);
      else if (this.type === "snow") {
        ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill();
      } else if (this.type === "glitter") {
        this._star(ctx, p.size);
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size / 2, p.size / 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  ParticleEngine.prototype._heart = function (ctx, s) {
    var k = s / 16;
    ctx.beginPath();
    ctx.moveTo(0, 5 * k);
    ctx.bezierCurveTo(-9 * k, -3 * k, -4 * k, -9 * k, 0, -4 * k);
    ctx.bezierCurveTo(4 * k, -9 * k, 9 * k, -3 * k, 0, 5 * k);
    ctx.closePath(); ctx.fill();
  };

  ParticleEngine.prototype._star = function (ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(0, 0, s, 0);
    ctx.quadraticCurveTo(0, 0, 0, s);
    ctx.quadraticCurveTo(0, 0, -s, 0);
    ctx.quadraticCurveTo(0, 0, 0, -s);
    ctx.closePath(); ctx.fill();
  };

  root.ParticleEngine = ParticleEngine;
  if (typeof module !== "undefined" && module.exports) module.exports = ParticleEngine;
})(typeof window !== "undefined" ? window : globalThis);
