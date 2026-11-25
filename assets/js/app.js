/* Admin Builder — state, live preview, templates, particles, export, GitHub push.
   State lưu localStorage khóa "wedding-builder-v1" (tự lưu sau mỗi lần sửa).
   Token GitHub chỉ lưu khi người dùng tick "Lưu token trên máy này", khóa
   riêng "wedding-builder-gh-token", và chỉ gửi tới api.github.com. */
(function () {
  "use strict";

  var LS_KEY = "wedding-builder-v1";
  var GH_KEY = "wedding-builder-gh-token";
  var GH_META_KEY = "wedding-builder-gh-meta";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var ExportLib = window.WeddingExport;
  var SAMPLE = window.WEDDING_SAMPLE || {};

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function givenName(full) {
    var parts = String(full || "").trim().split(/\s+/).filter(Boolean);
    return parts.slice(-2).join(" ");
  }
  function slugOf(st) { return ExportLib.slugFor ? ExportLib.slugFor(st) : ExportLib.coupleSlug(st); }
  function blankState() {
    return {
      groomName: "", brideName: "", groomFather: "", groomMother: "",
      brideFather: "", brideMother: "", weddingDate: "", rsvpDeadline: "",
      groomPhone: "", bridePhone: "", inviteText: "", coverUrl: "",
      vuQuyTime: "09:00", vuQuyPlace: "Tư gia Nhà Gái", vuQuyAddress: "",
      partyWelcome: "11:00", partyStart: "11:30", partyPlace: "", partyAddress: "",
      dressCode: "", schedule: [{ time: "09:00", title: "Lễ Vu Quy", desc: "" }],
      story: [{ date: "", title: "", desc: "" }],
      album: [{ url: "", caption: "" }],
      groomBank: "", groomAccount: "", groomAccountName: "",
      brideBank: "", brideAccount: "", brideAccountName: "",
      giftAmount: "", giftNote: "Mừng cưới",
      template: "classic", particlesEnabled: true, particleType: "sakura",
      musicUrl: "", showCountdown: true, showAlbum: true, showRsvp: true,
      showGift: true, showStory: true, showSchedule: true, slug: "",
      /* Nơi nhận RSVP trên thiệp xuất: apps-script | formspree | local.
         URL để trống = chưa cấu hình, thiệp xuất KHÔNG báo thành công giả. */
      rsvp: { mode: "local", appsScriptUrl: "", formspreeUrl: "" }
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        var base = blankState();
        Object.keys(base).forEach(function (k) { if (s[k] !== undefined) base[k] = s[k]; });
        /* Gộp riêng object rsvp để state cũ (chưa có rsvp) không mất mặc định. */
        if (s.rsvp && typeof s.rsvp === "object") {
          base.rsvp = Object.assign(blankState().rsvp, s.rsvp);
          if (["apps-script", "formspree", "local"].indexOf(base.rsvp.mode) < 0) base.rsvp.mode = "local";
        }
        return base;
      }
    } catch (e) { /* localStorage không dùng được thì dùng dữ liệu mẫu */ }
    return clone(SAMPLE);
  }

  var state = loadState();
  var slugTouched = !!state.slug;
  var engine = null;
  var saveTimer = 0;
  var renderTimer = 0;

  /* ---------- toast + trạng thái ---------- */
  var toastEl = null;
  function toast(msg) {
    if (!toastEl) toastEl = $("#toast");
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }
  function setStatus(el, kind, html) {
    if (!el) return;
    el.className = "status-line show " + kind;
    el.innerHTML = html;
  }

  /* ---------- lưu ---------- */
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* bộ nhớ đầy */ }
    var ind = $("#saveState");
    if (ind) ind.textContent = "Đã lưu tự động · " + new Date().toLocaleTimeString("vi-VN");
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 300);
  }
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderPreview, 250);
  }

  /* ---------- preview ---------- */
  function renderPreview() {
    var styleEl = $("#previewStyle");
    var t = ExportLib.TEMPLATES[state.template] || ExportLib.TEMPLATES.classic;
    if (styleEl) styleEl.textContent = ExportLib.templateCSS(t);
    var box = $("#previewBox");
    if (!box) return;
    if (engine) { engine.destroy(); engine = null; }
    box.innerHTML = ExportLib.renderCardHTML(state);
    var slugEl = $("#previewSlug");
    if (slugEl) slugEl.textContent = slugOf(state);
    // RSVP trong preview chỉ là bản thử — KHÔNG gửi thật để tránh làm bẩn
    // Sheet / hộp thư của khách. RSVP thật chỉ chạy trên file thiệp đã xuất.
    var form = box.querySelector("[data-rsvp-form]");
    if (form) form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var mode = (state.rsvp && state.rsvp.mode) || "local";
      var dest = mode === "apps-script" ? "Google Sheet (Apps Script)"
        : mode === "formspree" ? "Formspree"
        : "chỉ lưu trên máy khách";
      toast("Bản xem trước — không gửi thật. Trên thiệp đã xuất, RSVP sẽ gửi về " + dest + ".");
    });
    // Nút sao chép STK trong preview
    $$("[data-copy-stk]", box).forEach(function (btn) {
      btn.addEventListener("click", function () {
        copyText(btn.getAttribute("data-copy-stk"), "Đã sao chép STK.");
      });
    });
    // Particles
    var canvas = box.querySelector("#fxCanvas");
    if (canvas && state.particlesEnabled) {
      engine = new window.ParticleEngine(canvas, { type: state.particleType });
      engine.start();
    }
    tickCountdown();
    // Nhạc nền trong khung preview: giữ lại thẻ <audio> thật + nút ♪ nổi,
    // gán lại src mỗi khi link đổi (xem syncPreviewMusic).
    syncPreviewMusic();
  }

  function tickCountdown() {
    var box = $("#previewBox [data-countdown]");
    if (!box) return;
    var target = new Date(box.getAttribute("data-target"));
    var diff = target - new Date();
    var vals = { d: 0, h: "00", m: "00", s: "00" };
    if (diff > 0) {
      vals.d = Math.floor(diff / 86400000);
      vals.h = String(Math.floor(diff % 86400000 / 3600000)).padStart(2, "0");
      vals.m = String(Math.floor(diff % 3600000 / 60000)).padStart(2, "0");
      vals.s = String(Math.floor(diff % 60000 / 1000)).padStart(2, "0");
    }
    $$("[data-cd]", box).forEach(function (el) {
      el.textContent = vals[el.getAttribute("data-cd")];
    });
  }
  setInterval(tickCountdown, 1000);

  function copyText(text, okMsg) {
    function done() { toast(okMsg || "Đã sao chép."); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { toast("Không sao chép được — hãy copy tay."); });
    } else {
      var ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { toast("Không sao chép được — hãy copy tay."); }
      ta.remove();
    }
  }

  /* ---------- bind form ---------- */
  function bindSimple() {
    $$("[data-bind]").forEach(function (input) {
      var key = input.getAttribute("data-bind");
      if (input.type === "checkbox") { input.checked = !!state[key]; }
      else if (state[key] !== undefined) { input.value = state[key]; }
      input.addEventListener("input", function () {
        state[key] = input.type === "checkbox" ? input.checked : input.value;
        if (key === "groomName" || key === "brideName") {
          if (!slugTouched) {
            state.slug = ExportLib.slugFor({ groomName: givenName(state.groomName), brideName: givenName(state.brideName), slug: "" });
            var slugInput = $('[data-bind="slug"]');
            if (slugInput) slugInput.value = state.slug;
          }
        }
        if (key === "slug") slugTouched = true;
        scheduleSave(); scheduleRender();
        if (key === "musicUrl") syncPreviewMusic();
        if (["groomBank", "groomAccount", "groomAccountName", "brideBank", "brideAccount", "brideAccountName", "giftAmount", "giftNote"].indexOf(key) >= 0) renderQrPreview();
      });
    });
    // Checkbox hiển thị (showCountdown...)
    $$("[data-bind-check]").forEach(function (input) {
      var key = input.getAttribute("data-bind-check");
      input.checked = !!state[key];
      input.addEventListener("change", function () {
        state[key] = input.checked;
        scheduleSave(); scheduleRender();
      });
    });
  }

  function renderTemplatePicker() {
    var wrap = $("#templatePicker");
    if (!wrap) return;
    wrap.innerHTML = "";
    Object.keys(ExportLib.TEMPLATES).forEach(function (id) {
      var t = ExportLib.TEMPLATES[id];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tpl-card";
      btn.setAttribute("aria-pressed", state.template === id ? "true" : "false");
      btn.innerHTML = '<div class="tpl-swatch" style="background:' + t.bg + ";color:" + t.primary + ";border:1px solid " + t.line + '">' +
        ExportLib.esc(state.groomName ? state.groomName.charAt(0) : "N") + " &amp; " +
        ExportLib.esc(state.brideName ? state.brideName.charAt(0) : "H") + "</div>" +
        '<div style="font-size:13px;font-weight:700">' + ExportLib.esc(t.name) + "</div>" +
        '<div style="font-size:11px;color:#6b7280">' + t.primary + " · " + t.accent + "</div>";
      btn.addEventListener("click", function () {
        state.template = id;
        renderTemplatePicker();
        scheduleSave(); renderPreview();
      });
      wrap.appendChild(btn);
    });
  }

  function renderParticleControls() {
    var toggle = $("#particleToggle");
    if (toggle) toggle.checked = !!state.particlesEnabled;
    $$("[data-particle-type]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", state.particleType === btn.getAttribute("data-particle-type") ? "true" : "false");
    });
  }

  function renderQrPreview() {
    [["groom", "qrGroom"], ["bride", "qrBride"]].forEach(function (pair) {
      var who = pair[0], boxId = pair[1];
      var box = document.getElementById(boxId);
      if (!box) return;
      var url = ExportLib.vietqrUrl(state[who + "Bank"], state[who + "Account"], state[who + "AccountName"], state.giftAmount, state.giftNote || "Mung cuoi");
      if (url) {
        box.innerHTML = '<img src="' + ExportLib.esc(url) + '" alt="QR VietQR ' + who + '">' +
          '<p style="font-size:12px;color:#6b7280;text-align:center">' + ExportLib.esc(state[who + "Bank"]) + " · " + ExportLib.esc(state[who + "Account"]) + " · " + ExportLib.esc(state[who + "AccountName"]) + "</p>";
      } else {
        box.innerHTML = '<p style="font-size:13px;color:#9ca3af;text-align:center;padding:12px">Nhập đủ Ngân hàng + Số TK + Tên chủ TK để xem mã QR VietQR.</p>';
      }
    });
    var mapFrame = $("#mapPreview");
    if (mapFrame) {
      var q = state.partyPlace ? (state.partyPlace + ", " + state.partyAddress) : state.partyAddress;
      mapFrame.src = q ? ExportLib.mapsEmbed(q) : "";
      mapFrame.style.display = q ? "" : "none";
    }
  }

  /* ---------- nhạc nền: 1 audio dùng chung cho nút Nghe thử + nút ♪ trong preview ----------
     Lỗi cũ: khung Live Preview không có thẻ <audio> nào (nút ♪ + audio chỉ tồn
     tại trong file thiệp đã xuất), nên dán link MP3 vào Builder mà không nghe
     được gì; nút "Nghe thử" thì dùng Audio riêng, đổi link khi đang phát cũng
     không đổi bài, lỗi chỉ hiện bằng toast rồi mất. */
  var previewAudioEl = null; // thẻ <audio> thật nằm trong khung preview (#previewFrame)
  var previewMusicBtn = null; // nút ♪ nổi trong khung preview
  var musicWasPlaying = false;

  // Kiểm tra nhanh link nhạc: trả về chuỗi cảnh báo, hoặc null nếu link có vẻ ổn.
  // Chỉ là gợi ý: link lạ vẫn cho bấm Nghe thử, lỗi thật sẽ hiện khi phát.
  function validateMusicUrl(raw) {
    var url = (raw || "").trim();
    if (!url) return null;
    if (/^http:\/\//i.test(url) && window.location.protocol === "https:") {
      return "Link http:// sẽ bị chặn trên trang https:// — hãy dùng link https://.";
    }
    if (/(youtube\.com|youtu\.be|zingmp3\.vn|mp3\.zing\.vn|nhaccuatui\.com|soundcloud\.com|facebook\.com|tiktok\.com)/i.test(url)) {
      return "Link này là trang web nghe nhạc, không phải file âm thanh trực tiếp — cần link file trực tiếp, ví dụ https://…/ten-bai.mp3.";
    }
    if (/drive\.google\.com/i.test(url) && !/export=download/i.test(url)) {
      return "Link Google Drive dạng xem trang không phát được — cần link tải trực tiếp (…/uc?export=download&id=…).";
    }
    var path = url.split("?")[0].split("#")[0];
    if (!/\.(mp3|m4a|aac|ogg|oga|wav|flac)$/i.test(path)) {
      return "Link không phải file âm thanh trực tiếp (.mp3/.m4a) hoặc bị chặn quyền truy cập.";
    }
    return null;
  }
  function showMusicWarn(msg) {
    var el = $("#musicWarn");
    if (!el) return;
    if (msg) { el.textContent = msg; el.hidden = false; }
    else { el.textContent = ""; el.hidden = true; }
  }
  function syncMusicButtons() {
    var playing = previewAudioEl && !previewAudioEl.paused;
    var testBtn = $("#btnTestMusic");
    if (testBtn) testBtn.textContent = playing ? "⏸ Dừng nghe thử" : "▶ Nghe thử nhạc";
    if (previewMusicBtn) {
      previewMusicBtn.textContent = playing ? "❚❚" : "♪";
      previewMusicBtn.classList.toggle("playing", !!playing);
    }
  }
  function ensurePreviewMusic() {
    var frame = $("#previewFrame");
    if (!frame) return null;
    if (!previewAudioEl || !frame.contains(previewAudioEl)) {
      previewAudioEl = document.createElement("audio");
      previewAudioEl.setAttribute("data-preview-music", "");
      previewAudioEl.loop = true;
      previewAudioEl.preload = "metadata";
      previewAudioEl.addEventListener("error", function () {
        musicWasPlaying = false;
        showMusicWarn("Không tải được file nhạc từ link này — kiểm tra lại link MP3.");
        syncMusicButtons();
      });
      previewAudioEl.addEventListener("play", function () { musicWasPlaying = true; syncMusicButtons(); });
      previewAudioEl.addEventListener("pause", function () { musicWasPlaying = false; syncMusicButtons(); });
      frame.appendChild(previewAudioEl);
    }
    if (!previewMusicBtn || !frame.contains(previewMusicBtn)) {
      previewMusicBtn = document.createElement("button");
      previewMusicBtn.type = "button";
      previewMusicBtn.className = "music-btn";
      previewMusicBtn.setAttribute("data-preview-music-btn", "");
      previewMusicBtn.setAttribute("aria-label", "Bật / tắt nhạc nền trong bản xem trước");
      previewMusicBtn.textContent = "♪";
      previewMusicBtn.style.position = "absolute";
      previewMusicBtn.style.right = "14px";
      previewMusicBtn.style.bottom = "16px";
      previewMusicBtn.addEventListener("click", togglePreviewMusic);
      frame.appendChild(previewMusicBtn);
    }
    return previewAudioEl;
  }
  // Gán lại src + load() mỗi khi link đổi; đang phát thì chuyển sang bài mới.
  function syncPreviewMusic() {
    var audio = ensurePreviewMusic();
    if (!audio) return;
    var url = (state.musicUrl || "").trim();
    showMusicWarn(validateMusicUrl(url));
    if (previewMusicBtn) previewMusicBtn.style.display = url ? "" : "none";
    if (!url) {
      if (!audio.paused) audio.pause();
      audio.removeAttribute("src");
      audio.load();
      syncMusicButtons();
      return;
    }
    if (audio.dataset.src !== url) {
      var wasPlaying = !audio.paused;
      audio.dataset.src = url;
      audio.src = url;
      audio.load();
      if (wasPlaying) {
        audio.play().then(syncMusicButtons).catch(function (err) {
          showMusicWarn("Không phát được link nhạc này" + (err && err.name ? " (" + err.name + ")" : "") + " — kiểm tra lại link MP3.");
          syncMusicButtons();
        });
      }
    }
    syncMusicButtons();
  }
  function togglePreviewMusic() {
    var url = (state.musicUrl || "").trim();
    if (!url) { toast("Chưa có link nhạc MP3."); return; }
    var audio = ensurePreviewMusic();
    if (!audio) return;
    if (audio.paused) {
      if (audio.dataset.src !== url) { audio.dataset.src = url; audio.src = url; audio.load(); }
      audio.play().then(syncMusicButtons).catch(function (err) {
        showMusicWarn("Không phát được link nhạc này" + (err && err.name ? " (" + err.name + ")" : "") + " — kiểm tra lại link MP3.");
        syncMusicButtons();
      });
    } else {
      audio.pause();
      syncMusicButtons();
    }
  }

  /* ---------- cấu hình nơi nhận RSVP ---------- */
  var rsvpBound = false;
  function rsvpHintText(cfg) {
    if (cfg.mode === "apps-script" && !cfg.appsScriptUrl) return "⚠ Đang chọn Apps Script nhưng chưa dán URL — thiệp xuất sẽ chỉ lưu lời chúc trên máy khách và báo rõ là chưa cấu hình. Xem docs/RSVP.md để deploy Web App.";
    if (cfg.mode === "formspree" && !cfg.formspreeUrl) return "⚠ Đang chọn Formspree nhưng chưa dán endpoint — thiệp xuất sẽ chỉ lưu lời chúc trên máy khách và báo rõ là chưa cấu hình.";
    if (cfg.mode === "apps-script") return "✓ Đã có Apps Script URL — thiệp xuất sẽ POST thật về Google Sheet.";
    if (cfg.mode === "formspree") return "✓ Đã có Formspree endpoint — thiệp xuất sẽ POST thật về Formspree.";
    return "Chế độ chỉ lưu trên máy khách — cô dâu chú rể sẽ không nhận được RSVP.";
  }
  function updateRsvpHint() {
    var hint = $("#rsvpHint");
    if (hint) hint.textContent = rsvpHintText(state.rsvp || { mode: "local", appsScriptUrl: "", formspreeUrl: "" });
  }
  function syncRsvpUI() {
    var cfg = state.rsvp || { mode: "local", appsScriptUrl: "", formspreeUrl: "" };
    $$('input[name="rsvpMode"]').forEach(function (radio) {
      radio.checked = radio.value === (cfg.mode || "local");
    });
    var a = $("#rsvpAppsScriptUrl");
    if (a) a.value = cfg.appsScriptUrl || "";
    var f = $("#rsvpFormspreeUrl");
    if (f) f.value = cfg.formspreeUrl || "";
    updateRsvpHint();
  }
  function bindRsvp() {
    syncRsvpUI();
    if (rsvpBound) return;
    rsvpBound = true;
    $$('input[name="rsvpMode"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        if (!state.rsvp) state.rsvp = { mode: "local", appsScriptUrl: "", formspreeUrl: "" };
        state.rsvp.mode = radio.value;
        syncRsvpUI(); scheduleSave(); scheduleRender();
      });
    });
    var a = $("#rsvpAppsScriptUrl");
    if (a) a.addEventListener("input", function () {
      if (!state.rsvp) state.rsvp = { mode: "local", appsScriptUrl: "", formspreeUrl: "" };
      state.rsvp.appsScriptUrl = a.value.trim();
      updateRsvpHint(); scheduleSave(); scheduleRender();
    });
    var f = $("#rsvpFormspreeUrl");
    if (f) f.addEventListener("input", function () {
      if (!state.rsvp) state.rsvp = { mode: "local", appsScriptUrl: "", formspreeUrl: "" };
      state.rsvp.formspreeUrl = f.value.trim();
      updateRsvpHint(); scheduleSave(); scheduleRender();
    });
  }

  /* ---------- danh sách động: lịch trình / câu chuyện / album ---------- */
  function listEditor(listId, items, fields, onChange) {
    var wrap = document.getElementById(listId);
    if (!wrap) return;
    wrap.innerHTML = "";
    items.forEach(function (item, idx) {
      var card = document.createElement("div");
      card.className = "row-card";
      var head = document.createElement("div");
      head.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px";
      head.innerHTML = "<b style='font-size:13px'>#" + (idx + 1) + "</b>";
      var del = document.createElement("button");
      del.type = "button"; del.className = "text-red-600 text-sm font-semibold";
      del.textContent = "Xoá";
      del.addEventListener("click", function () {
        items.splice(idx, 1);
        onChange(); renderAllLists(); scheduleSave(); scheduleRender();
      });
      head.appendChild(del);
      card.appendChild(head);
      fields.forEach(function (f) {
        var div = document.createElement("div");
        div.className = "field";
        div.style.marginBottom = "8px";
        var label = document.createElement("label");
        label.textContent = f.label;
        var input = f.multiline ? document.createElement("textarea") : document.createElement("input");
        input.value = item[f.key] || "";
        if (f.inputType) input.type = f.inputType;
        input.addEventListener("input", function () {
          item[f.key] = input.value;
          onChange(); scheduleSave(); scheduleRender();
        });
        div.appendChild(label); div.appendChild(input);
        card.appendChild(div);
      });
      wrap.appendChild(card);
    });
  }

  function renderAllLists() {
    listEditor("scheduleList", state.schedule,
      [{ key: "time", label: "Giờ" }, { key: "title", label: "Tên mốc" }, { key: "desc", label: "Mô tả", multiline: true }],
      function () {});
    listEditor("storyList", state.story,
      [{ key: "date", label: "Thời điểm" }, { key: "title", label: "Tiêu đề" }, { key: "desc", label: "Nội dung", multiline: true }],
      function () {});
    listEditor("albumList", state.album,
      [{ key: "url", label: "Link ảnh", inputType: "url" }, { key: "caption", label: "Chú thích" }],
      function () {});
  }

  /* ---------- xuất file ---------- */
  function downloadStandalone() {
    var html = ExportLib.buildStandaloneHTML(state);
    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (slugOf(state) || "thiep-cuoi") + ".html";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast("Đã tải file thiệp độc lập — mở file là chạy ngay.");
  }

  function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  /* ---------- push GitHub ---------- */
  function ghHeaders(token) {
    return { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json", "Content-Type": "application/json" };
  }
  function stepList(el, steps) {
    el.innerHTML = "<ul>" + steps.map(function (s) {
      return '<li class="' + (s.ok === true ? "done" : s.ok === false ? "fail" : "") + '">' +
        (s.ok === true ? "✓ " : s.ok === false ? "✗ " : "… ") + ExportLib.esc(s.text) + "</li>";
    }).join("") + "</ul>";
  }

  /* ---------- tên miền tùy chỉnh (Custom Domain) ---------- */
  function normalizeDomain(raw) {
    var d = (raw || "").trim().toLowerCase();
    d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "").split("?")[0].split("#")[0];
    return d;
  }
  // Tự nhận diện tên miền đang mở Builder: dùng khi Builder chạy trên tên miền
  // riêng hoặc bản mirror (pages.dev / vercel.app). Trên github.io hoặc mở file
  // local thì trả "" để giữ link github.io mặc định.
  function detectDomain() {
    var h = (window.location && window.location.hostname) || "";
    if (!h || h === "localhost" || h === "127.0.0.1") return "";
    if (/\.github\.io$/.test(h)) return "";
    return h.toLowerCase();
  }
  function effectiveDomain() {
    var typed = normalizeDomain($("#ghDomain") ? $("#ghDomain").value : "");
    return typed || detectDomain();
  }
  // Ghi / cập nhật file CNAME ở thư mục gốc của nhánh đang xuất bản.
  // GitHub Pages đọc file này để biết tên miền riêng của site.
  // Lỗi ở bước này không làm hỏng lần xuất bản: link github.io vẫn dùng được.
  async function syncCname(owner, repo, branch, token, domain, push) {
    // CNAME chỉ dùng cho tên miền riêng (vd thiepcuoionline.me). Không bao giờ
    // ghi tên miền của nền tảng mirror (pages.dev / vercel.app / workers.dev /
    // netlify.app / github.io) — GitHub Pages sẽ nhận đó làm tên miền riêng
    // và làm hỏng site github.io.
    if (/\.(pages\.dev|vercel\.app|workers\.dev|netlify\.app|github\.io)$/.test(domain)) {
      push({ ok: false, text: "Không ghi file CNAME cho tên miền nền tảng (" + domain + ") — CNAME chỉ dùng cho tên miền riêng." });
      return;
    }
    try {
      var url = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/CNAME?ref=" + encodeURIComponent(branch);
      var sha = null, current = "";
      var getRes = await fetch(url, { headers: ghHeaders(token) });
      if (getRes.status === 200) {
        var existing = await getRes.json();
        sha = existing.sha || null;
        try { current = decodeURIComponent(escape(atob((existing.content || "").replace(/\n/g, "")))).trim(); } catch (e) {}
      } else if (getRes.status !== 404) {
        push({ ok: false, text: "Không đọc được file CNAME (" + getRes.status + ") — link github.io vẫn dùng được." });
        return;
      }
      if (current === domain) { push({ ok: true, text: "File CNAME đã đúng tên miền — không cần ghi lại." }); return; }
      var body = { message: "Cập nhật CNAME cho tên miền " + domain, content: utf8ToBase64(domain + "\n"), branch: branch };
      if (sha) body.sha = sha;
      var putRes = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/CNAME", {
        method: "PUT", headers: ghHeaders(token), body: JSON.stringify(body)
      });
      if (!putRes.ok) {
        push({ ok: false, text: "Chưa ghi được file CNAME (" + putRes.status + ") — link github.io vẫn dùng được, kiểm tra lại quyền token." });
        return;
      }
      push({ ok: true, text: "Đã ghi file CNAME (" + domain + ") ở thư mục gốc." });
    } catch (e) {
      push({ ok: false, text: "Lỗi khi ghi file CNAME — link github.io vẫn dùng được." });
    }
  }

  async function pushToGitHub() {
    var owner = $("#ghOwner").value.trim();
    var repo = $("#ghRepo").value.trim() || "wedding-card-builder";
    var branch = $("#ghBranch").value.trim() || "main";
    var token = $("#ghToken").value.trim();
    var domain = normalizeDomain($("#ghDomain") ? $("#ghDomain").value : "");
    var saveToken = $("#ghSaveToken").checked;
    var statusEl = $("#ghStatus");
    var slug = slugOf(state);
    var path = "khach-hang/" + slug + "/index.html";
    var steps = [];
    function push(step) { steps.push(step); stepList(statusEl, steps); }

    if (!owner) { setStatus(statusEl, "err", "Chưa nhập GitHub Owner (tên tài khoản GitHub)."); return; }
    if (!token) { setStatus(statusEl, "err", "Chưa nhập Personal Access Token."); return; }

    setStatus(statusEl, "info", "Đang xuất bản thiệp cho khách…");
    steps = [];
    var btn = $("#btnPushGithub");
    if (btn) btn.disabled = true;

    try {
      if (saveToken) { try { localStorage.setItem(GH_KEY, token); } catch (e) {} }
      else { try { localStorage.removeItem(GH_KEY); } catch (e) {} }
      try {
        localStorage.setItem(GH_META_KEY, JSON.stringify({ owner: owner, repo: repo, branch: branch, domain: domain }));
      } catch (e) {}

      push({ text: "Đóng gói thiệp thành 1 file HTML độc lập…" });
      var html = ExportLib.buildStandaloneHTML(state);

      push({ text: "Kiểm tra file đã có trên repo chưa (GET contents)…" });
      var getUrl = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + path + "?ref=" + encodeURIComponent(branch);
      var sha = null;
      var getRes = await fetch(getUrl, { headers: ghHeaders(token) });
      if (getRes.status === 200) {
        var existing = await getRes.json();
        sha = existing.sha || null;
        push({ ok: true, text: "File đã có — sẽ ghi đè (sha đã lấy)." });
      } else if (getRes.status === 404) {
        push({ ok: true, text: "Chưa có file — sẽ tạo mới." });
      } else if (getRes.status === 401) {
        push({ ok: false, text: "Token sai hoặc đã hết hạn (401). Kiểm tra lại Personal Access Token." });
        throw new Error("unauthorized");
      } else if (getRes.status === 403) {
        push({ ok: false, text: "Bị từ chối (403) — token thiếu quyền hoặc hết hạn mức API." });
        throw new Error("forbidden");
      } else {
        var errText = await getRes.text();
        push({ ok: false, text: "Không đọc được repo (" + getRes.status + "): " + errText.slice(0, 200) });
        throw new Error("get-failed");
      }

      push({ text: "Đẩy file lên GitHub (PUT contents)…" });
      var body = {
        message: "Xuất bản thiệp cưới " + slug,
        content: utf8ToBase64(html),
        branch: branch
      };
      if (sha) body.sha = sha;
      var putRes = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + path, {
        method: "PUT", headers: ghHeaders(token), body: JSON.stringify(body)
      });
      if (!putRes.ok) {
        var errJson = {};
        try { errJson = await putRes.json(); } catch (e) {}
        var msg = (errJson && errJson.message) || ("HTTP " + putRes.status);
        if (putRes.status === 401) msg = "Token sai hoặc hết hạn (401).";
        if (putRes.status === 404) msg = "Repo hoặc nhánh không tồn tại (404) — kiểm tra Owner / Repo / Branch.";
        if (putRes.status === 409) msg = "Xung đột SHA (409) — file vừa bị đổi trên repo sau lúc kiểm tra, bấm Xuất bản lại để lấy sha mới.";
        if (putRes.status === 422) msg = "Dữ liệu không hợp lệ (422): " + msg;
        push({ ok: false, text: "Đẩy file thất bại: " + msg });
        throw new Error("put-failed");
      }
      var putJson = await putRes.json();
      push({ ok: true, text: "Đã đẩy file lên GitHub." });

      var autoDomain = effectiveDomain();
      // Chỉ đồng bộ CNAME cho tên miền riêng người dùng gõ tay (biến domain).
      // Tên miền tự nhận diện (autoDomain) chỉ dùng để tạo link trả về: nếu
      // Builder đang mở trên bản mirror thì autoDomain là hostname của mirror,
      // ghi nó vào CNAME sẽ làm GitHub Pages nhận nhầm đó làm tên miền riêng.
      if (domain) {
        push({ text: "Đồng bộ file CNAME cho tên miền " + domain + "…" });
        await syncCname(owner, repo, branch, token, domain, push);
      }
      var pagesUrl = autoDomain
        ? "https://" + autoDomain + "/khach-hang/" + slug + "/"
        : "https://" + owner + ".github.io/" + repo + "/khach-hang/" + slug + "/";
      var fileUrl = putJson.content ? putJson.content.html_url : ("https://github.com/" + owner + "/" + repo + "/blob/" + branch + "/" + path);
      push({ ok: true, text: "Xong! Link thiệp: " + pagesUrl });
      var domainNote = domain
        ? "<br>Tên miền riêng: DNS phải trỏ về GitHub Pages thì link mới mở được (xem docs/CUSTOM-DOMAIN.md). Sau khi DNS nhận, bật Enforce HTTPS ở repo Settings → Pages để GitHub cấp chứng chỉ."
        : "";
      setStatus(statusEl, "ok", "Đã xuất bản thành công. GitHub Pages cần 1–2 phút để cập nhật lần đầu.<br>" +
        'Link thiệp: <a class="underline font-semibold" href="' + pagesUrl + '" target="_blank" rel="noopener">' + pagesUrl + "</a><br>" +
        'File trên repo: <a class="underline" href="' + fileUrl + '" target="_blank" rel="noopener">' + fileUrl + "</a>" + domainNote + "<br>" +
        '<span class="block mt-2 p-2 rounded bg-amber-50 border border-amber-300 text-amber-800 text-sm">⚠ <b>Bảo mật token:</b> test xong hãy thu hồi token vừa dùng tại <a class="underline font-semibold" href="https://github.com/settings/tokens" target="_blank" rel="noopener">github.com/settings/tokens</a> (bấm Revoke), hoặc giới hạn lại quyền của nó — và bấm nút “Xoá token” trong mục này để gỡ token khỏi máy này.</span>');
      var copyBtn = $("#btnCopyPages");
      if (copyBtn) {
        copyBtn.hidden = false;
        copyBtn.onclick = function () { copyText(pagesUrl, "Đã sao chép link Pages."); };
      }
      toast("Đã xuất bản thiệp cho khách lên GitHub Pages.");
    } catch (err) {
      if (err && err.message === "unauthorized") { /* đã báo ở bước trên */ }
      else if (err && (err.message === "get-failed" || err.message === "put-failed" || err.message === "forbidden")) { /* đã báo */ }
      else {
        push({ ok: false, text: "Lỗi mạng hoặc lỗi không xác định: " + (err && err.message ? err.message : err) });
        setStatus(statusEl, "err", "Xuất bản thất bại. Kiểm tra mạng rồi thử lại — token chỉ gửi tới api.github.com.");
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  /* ---------- khởi tạo ---------- */
  function init() {
    bindSimple();
    bindRsvp();
    renderTemplatePicker();
    renderParticleControls();
    renderQrPreview();
    renderAllLists();
    renderPreview();

    // Chuyển Mobile / Desktop cho preview
    $$("[data-preview-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-preview-mode");
        $$("[data-preview-mode]").forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        var frame = $("#previewFrame");
        if (frame) { frame.classList.toggle("mobile", mode === "mobile"); frame.classList.toggle("desktop", mode === "desktop"); }
        if (engine) { engine.resize(); }
      });
    });

    // Tab mobile: Builder / Xem trước
    var tabB = $("#tabBuilder"), tabP = $("#tabPreview");
    var panelCol = $("#builderCol"), previewCol = $("#previewCol");
    function setMobileTab(which) {
      if (window.innerWidth >= 1024) return;
      if (tabB) tabB.setAttribute("aria-pressed", which === "builder" ? "true" : "false");
      if (tabP) tabP.setAttribute("aria-pressed", which === "preview" ? "true" : "false");
      if (panelCol) panelCol.style.display = which === "builder" ? "" : "none";
      if (previewCol) previewCol.style.display = which === "preview" ? "" : "none";
    }
    if (tabB) tabB.addEventListener("click", function () { setMobileTab("builder"); });
    if (tabP) tabP.addEventListener("click", function () { setMobileTab("preview"); renderPreview(); });

    // Hiệu ứng hạt
    var toggle = $("#particleToggle");
    if (toggle) toggle.addEventListener("change", function () {
      state.particlesEnabled = toggle.checked;
      scheduleSave(); renderPreview();
    });
    $$("[data-particle-type]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.particleType = btn.getAttribute("data-particle-type");
        renderParticleControls();
        scheduleSave(); renderPreview();
      });
    });

    // Thêm dòng lịch trình / câu chuyện / album
    var addS = $("#addSchedule");
    if (addS) addS.addEventListener("click", function () {
      state.schedule.push({ time: "", title: "", desc: "" });
      renderAllLists(); scheduleSave(); scheduleRender();
    });
    var addSt = $("#addStory");
    if (addSt) addSt.addEventListener("click", function () {
      state.story.push({ date: "", title: "", desc: "" });
      renderAllLists(); scheduleSave(); scheduleRender();
    });
    var addAl = $("#addAlbum");
    if (addAl) addAl.addEventListener("click", function () {
      if (state.album.length >= 8) { toast("Album tối đa 8 ảnh."); return; }
      state.album.push({ url: "", caption: "" });
      renderAllLists(); scheduleSave(); scheduleRender();
    });

    // Nhạc nền — nghe thử. QUAN TRỌNG: Safari iOS / Chrome Android bắt buộc
    // phải có tương tác chạm mới cho phát tiếng, nên KHÔNG autoplay. Lần bấm
    // này chính là lần chạm đó; nút dùng chung 1 audio với nút ♪ trong khung
    // preview (xem togglePreviewMusic), lỗi phát sẽ hiện cảnh báo ngay dưới
    // ô nhập link thay vì chỉ toast rồi mất.
    var musicTest = $("#btnTestMusic");
    if (musicTest) musicTest.addEventListener("click", togglePreviewMusic);

    // Nút dữ liệu mẫu / lưu / xóa
    var btnSample = $("#btnLoadSample");
    if (btnSample) btnSample.addEventListener("click", function () {
      state = clone(SAMPLE);
      slugTouched = true;
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
      bindSimple(); syncRsvpUI(); renderTemplatePicker(); renderParticleControls();
      renderQrPreview(); renderAllLists(); renderPreview();
      toast("Đã nạp dữ liệu mẫu Minh Nhật & Thái Hà (DỮ LIỆU MẪU - CẦN XÁC NHẬN).");
    });
    var btnClear = $("#btnClear");
    if (btnClear) btnClear.addEventListener("click", function () {
      if (!confirm("Xoá toàn bộ dữ liệu đã nhập và quay về form trống?")) return;
      state = blankState();
      slugTouched = false;
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
      bindSimple(); syncRsvpUI(); renderTemplatePicker(); renderParticleControls();
      renderQrPreview(); renderAllLists(); renderPreview();
      toast("Đã xoá — form trống.");
    });
    var btnSave = $("#btnSave");
    if (btnSave) btnSave.addEventListener("click", function () { save(); toast("Đã lưu vào trình duyệt này."); });

    // Xuất file
    var btnExport = $("#btnExportHtml");
    if (btnExport) btnExport.addEventListener("click", downloadStandalone);

    // GitHub: nạp meta + token đã lưu (nếu có)
    try {
      var meta = JSON.parse(localStorage.getItem(GH_META_KEY) || "{}");
      if (meta.owner) $("#ghOwner").value = meta.owner;
      if (meta.repo) $("#ghRepo").value = meta.repo;
      if (meta.branch) $("#ghBranch").value = meta.branch;
      if (meta.domain) $("#ghDomain").value = meta.domain;
      var savedToken = localStorage.getItem(GH_KEY);
      if (savedToken) { $("#ghToken").value = savedToken; $("#ghSaveToken").checked = true; }
    } catch (e) {}
    var btnPush = $("#btnPushGithub");
    if (btnPush) btnPush.addEventListener("click", pushToGitHub);
    var btnClearToken = $("#btnClearToken");
    if (btnClearToken) btnClearToken.addEventListener("click", function () {
      try { localStorage.removeItem(GH_KEY); } catch (e) {}
      $("#ghToken").value = "";
      $("#ghSaveToken").checked = false;
      toast("Đã xoá token khỏi máy này.");
    });
    var btnCopyPages = $("#btnCopyPages");
    if (btnCopyPages) btnCopyPages.hidden = true;

    // Sao chép STK nhanh trong panel mừng cưới
    $$("[data-copy-field]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = document.querySelector(btn.getAttribute("data-copy-field"));
        if (target && target.value) copyText(target.value, "Đã sao chép: " + target.value);
        else toast("Chưa có giá trị để sao chép.");
      });
    });

    window.addEventListener("beforeunload", save);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
