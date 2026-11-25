/* Export Engine — buildStandaloneHTML(state)
   Đóng gói toàn bộ thiệp (giao diện + dữ liệu + CSS + JS hiệu ứng) thành
   MỘT file index.html độc lập. File xuất chỉ dùng font hệ thống, không phụ
   thuộc file ngoài trừ ảnh / nhạc / bản đồ do admin nhập. Chạy được khi mở
   trực tiếp trên mobile qua Zalo / Messenger.
   Dùng được cả trong trình duyệt (window.buildStandaloneHTML) và Node
   (module.exports) để sinh thiệp mẫu trong thư mục examples/. */
(function (root) {
  "use strict";

  /* ---------- tiện ích ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function escAttr(s) { return esc(s); }
  function slugify(str) {
    var s = String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    s = s.toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-");
    return s.replace(/^-+|-+$/g, "").replace(/-+/g, "-") || "thiep-cuoi";
  }
  function coupleSlug(state) {
    var base = [state.groomName, state.brideName].filter(Boolean).join(" ");
    return slugify(base) || slugify(state.slug || "") || "thiep-cuoi";
  }
  /* Slug dùng cho đường dẫn / tên file: ưu tiên slug admin đã nhập
     (ví dụ minh-nhat-thai-ha), chưa có thì sinh từ tên cô dâu chú rể. */
  function slugFor(state) {
    if (state.slug && String(state.slug).trim()) return slugify(state.slug);
    return coupleSlug(state);
  }
  function bankCode(name) {
    var n = String(name || "").toLowerCase().replace(/\s+/g, "");
    var map = {
      vietcombank: "VCB", bidv: "BIDV", vietinbank: "CTG", agribank: "AGRIBANK",
      techcombank: "TCB", mb: "MBBANK", mbbank: "MBBANK", acb: "ACB",
      vpbank: "VPB", tpbank: "TPB", sacombank: "STB", vib: "VIB",
      shinhan: "SHBVN", seabank: "SEABANK", hdbank: "HDBANK",
      eximbank: "EIB", ocb: "OCB", msb: "MSB", vietcapitalbank: "VCCB"
    };
    if (map[n]) return map[n];
    return String(name || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "VCB";
  }
  function vietqrUrl(bank, account, accountName, amount, addInfo) {
    if (!bank || !account || !accountName) return "";
    var code = bankCode(bank);
    var acc = String(account).replace(/\s+/g, "");
    var q = "?amount=" + encodeURIComponent(amount || "");
    q += "&addInfo=" + encodeURIComponent(addInfo || "");
    q += "&accountName=" + encodeURIComponent(accountName);
    return "https://img.vietqr.io/image/" + code + "-" + acc + "-compact2.png" + q;
  }
  function mapsEmbed(query) {
    if (!query) return "";
    return "https://maps.google.com/maps?q=" + encodeURIComponent(query) + "&output=embed";
  }
  function formatDateVi(iso) {
    if (!iso) return "";
    var parts = String(iso).split("-");
    if (parts.length !== 3) return esc(iso);
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    if (isNaN(d)) return esc(iso);
    var days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    return days[d.getDay()] + ", ngày " + parts[2] + " tháng " + parts[1] + " năm " + parts[0];
  }
  function weddingTargetISO(state) {
    // Đếm ngược tới mốc đầu tiên của ngày cưới (lễ Vu Quy), giờ địa phương.
    var time = state.vuQuyTime || "09:00";
    return (state.weddingDate || "") + "T" + time + ":00";
  }

  /* ---------- 15 template: 5 gốc + 10 phong cách Hàn Quốc ---------- */
  var TEMPLATES = {
    traditional: {
      id: "traditional", name: "Truyền thống đỏ vàng",
      primary: "#B91C1C", accent: "#D4A017", bg: "#FFF7ED", surface: "#FFFFFF",
      ink: "#3F1D1D", muted: "#8A6A5A", line: "#F0D9B5", soft: "#FDEED3",
      heading: "'Playfair Display', Georgia, 'Times New Roman', serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "double"
    },
    modern: {
      id: "modern", name: "Hiện đại tối giản",
      primary: "#111827", accent: "#0F766E", bg: "#FFFFFF", surface: "#F9FAFB",
      ink: "#111827", muted: "#6B7280", line: "#E5E7EB", soft: "#F3F4F6",
      heading: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "line"
    },
    classic: {
      id: "classic", name: "Sang trọng cổ điển",
      primary: "#8C6B3E", accent: "#C9A86A", bg: "#FDFBF7", surface: "#FFFFFF",
      ink: "#2B2118", muted: "#7A6A58", line: "#E9DFCE", soft: "#F6EFE2",
      heading: "'Playfair Display', Georgia, 'Times New Roman', serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "double"
    },
    sakura: {
      id: "sakura", name: "Hoa đào hồng pastel",
      primary: "#BE185D", accent: "#F472B6", bg: "#FFF1F2", surface: "#FFFFFF",
      ink: "#4A2C3A", muted: "#9D6B7E", line: "#FBCFE8", soft: "#FCE7F3",
      heading: "'Playfair Display', Georgia, serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "round"
    },
    rustic: {
      id: "rustic", name: "Vườn xanh rustic",
      primary: "#365314", accent: "#65A30D", bg: "#F7FEE7", surface: "#FFFFFF",
      ink: "#1A2E05", muted: "#657A4A", line: "#D9F99D", soft: "#ECFCCB",
      heading: "Georgia, 'Times New Roman', serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "round"
    },
    /* --- 10 mẫu phong cách Hàn Quốc --- */
    seoul: {
      id: "seoul", name: "Seoul Minimalist (Tối giản Seoul)",
      primary: "#2B2B2B", accent: "#B08D57", bg: "#FAF8F5", surface: "#FFFFFF",
      ink: "#2B2B2B", muted: "#8A8378", line: "#E8E2D8", soft: "#F3EFE8",
      heading: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "line",
      css: ".inv .names{font-weight:500;letter-spacing:.02em}" +
        ".inv .eyebrow{letter-spacing:.42em}" +
        ".inv h2{font-weight:500}"
    },
    jeju: {
      id: "jeju", name: "Jeju Lookbook (Tạp chí Ảnh cưới)",
      primary: "#1F2937", accent: "#C08A5A", bg: "#FFFFFF", surface: "#F9FAFB",
      ink: "#1F2937", muted: "#6B7280", line: "#E5E7EB", soft: "#F3F4F6",
      heading: "'Playfair Display', Georgia, serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "line",
      css: ".inv .cover img{height:min(78vh,640px)}" +
        ".inv .cover .veil{background:linear-gradient(transparent,rgba(0,0,0,.55) 85%);padding:120px 20px 18px}" +
        ".inv .cover .names{color:#fff}" +
        ".inv .cover .muted{color:#F3F4F6}" +
        ".inv .cover .eyebrow{color:#E5E7EB}"
    },
    namsan: {
      id: "namsan", name: "Namsan Blossom (Anh đào Namsan)",
      primary: "#9D174D", accent: "#F472B6", bg: "#FDF2F4", surface: "#FFFFFF",
      ink: "#4A2C3A", muted: "#9D6B7E", line: "#FBCFE8", soft: "#FCE7F3",
      heading: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "round",
      css: ".inv .cover img{border-radius:999px 999px 0 0}" +
        ".inv .card{border-radius:20px}"
    },
    hanji: {
      id: "hanji", name: "Hanji Warmth (Giấy Dó Hàn Quốc)",
      primary: "#6B4A2B", accent: "#A97C50", bg: "#F5EFE3", surface: "#FFFBF2",
      ink: "#3E2F23", muted: "#8A7561", line: "#E3D5BC", soft: "#EFE6D2",
      heading: "Georgia, 'Times New Roman', serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "double",
      css: ".inv{background-image:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(107,74,43,.02) 3px,rgba(107,74,43,.02) 4px)}" +
        ".inv .card{border-radius:6px}"
    },
    sage: {
      id: "sage", name: "Sage & Linen (Xanh Bơ & Vải Lanh)",
      primary: "#4D5E3A", accent: "#8A9A5B", bg: "#F4F1E6", surface: "#FFFFFF",
      ink: "#2E3620", muted: "#7A7F63", line: "#DDE0C8", soft: "#EDEFE0",
      heading: "'Cormorant Garamond', Georgia, serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "line",
      css: ".inv .card{border-radius:16px}" +
        ".inv .rule{width:40px}"
    },
    champagne: {
      id: "champagne", name: "Champagne Silk (Lụa Champagne)",
      primary: "#8A6D3B", accent: "#C9A86A", bg: "#FAF6EC", surface: "#FFFFFF",
      ink: "#3A2F1D", muted: "#97835F", line: "#EADFC2", soft: "#F5EDD8",
      heading: "'Playfair Display', Georgia, serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "double",
      css: ".inv .names{letter-spacing:.04em}" +
        ".inv .card{box-shadow:0 2px 10px rgba(138,109,59,.08)}"
    },
    polaroid: {
      id: "polaroid", name: "Polaroid Diary (Nhật ký Polaroid)",
      primary: "#374151", accent: "#D97706", bg: "#FDFCF8", surface: "#FFFFFF",
      ink: "#292524", muted: "#78716C", line: "#E7E5E4", soft: "#F5F5F4",
      heading: "'Cormorant Garamond', Georgia, serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "line",
      css: ".inv .album figure{background:#fff;padding:10px 10px 30px;box-shadow:0 4px 14px rgba(0,0,0,.14);transform:rotate(-2deg)}" +
        ".inv .album figure:nth-child(even){transform:rotate(2deg)}" +
        ".inv .album img{height:170px;border-radius:2px}" +
        ".inv .album figcaption{font-family:'Great Vibes','Segoe Script',cursive;font-size:19px;color:#57534E;margin-top:8px}"
    },
    midnight: {
      id: "midnight", name: "Midnight Candle (Tiệc tối Ánh nến)",
      primary: "#E3C98F", accent: "#C9A86A", bg: "#211D1A", surface: "#2C2620",
      ink: "#F3EDE3", muted: "#B4A894", line: "#4A4238", soft: "#332C25",
      heading: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "line",
      css: ".inv .btn{color:#211D1A}" +
        ".inv .btn.ghost{color:#E3C98F}" +
        ".inv .music-btn.playing{color:#211D1A}"
    },
    lavender: {
      id: "lavender", name: "Lavender Mist (Sương tím Oải hương)",
      primary: "#6D28D9", accent: "#A78BFA", bg: "#F5F3FA", surface: "#FFFFFF",
      ink: "#3B2D4D", muted: "#8B7FA3", line: "#E4DFF2", soft: "#EDE9F7",
      heading: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "round",
      css: ".inv .card{border-radius:18px}" +
        ".inv .count div{border-radius:16px}"
    },
    editorial: {
      id: "editorial", name: "Modern Editorial (Nghệ thuật Chữ Hàn)",
      primary: "#111111", accent: "#B45309", bg: "#FFFFFF", surface: "#FFFFFF",
      ink: "#111111", muted: "#6B7280", line: "#E5E7EB", soft: "#F9FAFB",
      heading: "'Cormorant Garamond', Georgia, serif",
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      frame: "line",
      css: ".inv .names{font-size:clamp(38px,11vw,60px);letter-spacing:-.01em;text-transform:uppercase}" +
        ".inv h2{letter-spacing:.18em;text-transform:uppercase;font-size:18px}" +
        ".inv .tl .dot{display:none}" +
        ".inv .tl{border-left:2px solid #111;padding-left:14px}"
    }
  };

  /* ---------- CSS của thiệp (dùng chung cho preview + file xuất) ---------- */
  function templateCSS(t) {
    var frameBorder = t.frame === "double"
      ? "border:3px double " + t.accent + ";"
      : t.frame === "round"
      ? "border:1px solid " + t.line + ";border-radius:22px;"
      : "border:1px solid " + t.line + ";";
    return [
      "*{box-sizing:border-box}",
      "body{margin:0;font-family:" + t.body + ";background:" + t.bg + ";color:" + t.ink + ";line-height:1.6}",
      ".inv{max-width:640px;margin:0 auto;background:" + t.bg + ";position:relative;overflow:hidden}",
      ".inv canvas.fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3}",
      ".inv .cover{position:relative;text-align:center}",
      ".inv .cover img{width:100%;height:min(62vh,480px);object-fit:cover;display:block}",
      ".inv .cover .veil{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(transparent," + t.bg + " 88%);padding:70px 20px 8px}",
      ".inv .eyebrow{letter-spacing:.28em;text-transform:uppercase;font-size:11px;color:" + t.muted + "}",
      ".inv .names{font-family:" + t.heading + ";font-size:clamp(30px,8vw,44px);font-weight:700;line-height:1.15;color:" + t.primary + ";margin:6px 0}",
      ".inv .names .amp{color:" + t.accent + ";font-style:italic}",
      ".inv section{padding:26px 22px 8px;text-align:center;position:relative;z-index:1}",
      ".inv h2{font-family:" + t.heading + ";font-size:24px;color:" + t.primary + ";margin:0 0 6px}",
      ".inv .rule{width:56px;height:2px;background:" + t.accent + ";margin:12px auto}",
      ".inv .muted{color:" + t.muted + ";font-size:14px}",
      ".inv .card{" + frameBorder + "background:" + t.surface + ";border-radius:14px;padding:16px;margin:12px 0;text-align:left}",
      ".inv .card b{color:" + t.primary + "}",
      ".inv .count{display:flex;gap:8px;justify-content:center;margin:14px 0 4px}",
      ".inv .count div{background:" + t.soft + ";border:1px solid " + t.line + ";border-radius:12px;min-width:64px;padding:10px 4px}",
      ".inv .count b{display:block;font-size:24px;color:" + t.primary + ";font-family:" + t.heading + "}",
      ".inv .count span{font-size:11px;color:" + t.muted + "}",
      ".inv .tl{display:flex;gap:12px;text-align:left;margin:14px 0;align-items:flex-start}",
      ".inv .tl .time{font-family:" + t.heading + ";font-weight:700;color:" + t.primary + ";min-width:54px}",
      ".inv .tl .dot{width:11px;height:11px;border-radius:50%;background:" + t.accent + ";margin-top:6px;flex:none}",
      ".inv .story{text-align:left;border-left:2px solid " + t.line + ";margin:0 0 16px 6px;padding:0 0 4px 16px;position:relative}",
      ".inv .story:before{content:'';position:absolute;left:-6px;top:5px;width:10px;height:10px;border-radius:50%;background:" + t.primary + "}",
      ".inv .story b{color:" + t.primary + "}",
      ".inv .album{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
      ".inv .album figure{margin:0}",
      ".inv .album img{width:100%;height:150px;object-fit:cover;border-radius:12px;display:block}",
      ".inv .album figcaption{font-size:12px;color:" + t.muted + ";margin-top:4px}",
      ".inv .qr{display:block;max-width:220px;width:100%;margin:10px auto 4px;border:1px solid " + t.line + ";border-radius:12px}",
      ".inv .bank{text-align:center}",
      ".inv .btn{display:inline-block;background:" + t.primary + ";color:#fff;border:0;border-radius:999px;padding:11px 20px;font-weight:700;cursor:pointer;font-size:15px;text-decoration:none}",
      ".inv .btn.ghost{background:transparent;color:" + t.primary + ";border:1px solid " + t.primary + "}",
      ".inv .btn.small{padding:8px 14px;font-size:13px}",
      ".inv input,.inv select,.inv textarea{width:100%;border:1px solid " + t.line + ";border-radius:10px;padding:10px 12px;background:" + t.surface + ";color:" + t.ink + ";font:inherit;font-size:15px}",
      ".inv label{display:block;font-size:13px;font-weight:600;margin:12px 0 4px;text-align:left}",
      ".inv .wish{background:" + t.surface + ";border:1px solid " + t.line + ";border-radius:12px;padding:12px 14px;margin:10px 0;text-align:left}",
      ".inv .wish b{color:" + t.primary + "}",
      ".inv .wish small{color:" + t.muted + "}",
      ".inv iframe.map{width:100%;height:260px;border:0;border-radius:12px;margin-top:10px}",
      ".inv .music-btn{position:fixed;right:14px;bottom:16px;z-index:10;width:48px;height:48px;border-radius:50%;border:1px solid " + t.line + ";background:" + t.surface + ";color:" + t.primary + ";font-size:20px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.18)}",
      ".inv .music-btn.playing{background:" + t.primary + ";color:#fff}",
      ".inv .warn{background:#FEF3C7;border:1px solid #F59E0B;color:#92400E;border-radius:12px;padding:12px 14px;font-size:13px;text-align:left;margin:12px 0}",
      ".inv .rsvp-status{border-radius:12px;padding:12px 14px;font-size:14px;text-align:left;margin:12px 0;display:none}",
      ".inv .rsvp-status.show{display:block}",
      ".inv .rsvp-status.sending{background:" + t.soft + ";border:1px solid " + t.line + "}",
      ".inv .rsvp-status.ok{background:#ECFDF5;border:1px solid #34D399;color:#065F46}",
      ".inv .rsvp-status.err{background:#FEF2F2;border:1px solid #FCA5A5;color:#991B1B}",
      ".inv footer{padding:26px 22px 40px;text-align:center;color:" + t.muted + ";font-size:13px}",
      "@media (prefers-reduced-motion:reduce){.inv canvas.fx{display:none}}"
    ].join("\n") + (t.css ? "\n" + t.css : "");
  }

  /* ---------- Nội dung thiệp (dùng chung preview + file xuất) ---------- */
  function renderCardHTML(state) {
    var t = TEMPLATES[state.template] || TEMPLATES.classic;
    var slug = slugFor(state);
    var parts = [];

    parts.push('<canvas class="fx" id="fxCanvas" aria-hidden="true"></canvas>');

    // Bìa
    var cover = state.coverUrl
      ? '<img src="' + escAttr(state.coverUrl) + '" alt="Ảnh cưới ' + escAttr(state.groomName) + " &amp; " + escAttr(state.brideName) + '">'
      : "";
    parts.push('<div class="cover">' + cover +
      '<div class="veil"><div class="eyebrow">Thiệp mời cưới</div>' +
      '<div class="names">' + esc(state.groomName) + ' <span class="amp">&amp;</span> ' + esc(state.brideName) + "</div>" +
      '<div class="muted">' + esc(formatDateVi(state.weddingDate)) + "</div>" +
      "</div></div>");

    // Đếm ngược
    if (state.showCountdown) {
      parts.push('<section><h2>Đếm ngược tới ngày cưới</h2><div class="rule"></div>' +
        '<div class="count" data-countdown data-target="' + escAttr(weddingTargetISO(state)) + '">' +
        '<div><b data-cd="d">--</b><span>Ngày</span></div>' +
        '<div><b data-cd="h">--</b><span>Giờ</span></div>' +
        '<div><b data-cd="m">--</b><span>Phút</span></div>' +
        '<div><b data-cd="s">--</b><span>Giây</span></div>' +
        "</div>" +
        '<p class="muted">Hạn xác nhận tham dự: ' + esc(formatDateVi(state.rsvpDeadline)) + "</p></section>");
    }

    // Lời ngỏ + phụ huynh
    parts.push("<section><h2>Trân trọng kính mời</h2><div class=\"rule\"></div>" +
      "<p>" + esc(state.inviteText) + "</p>" +
      '<div class="card"><b>Chú rể ' + esc(state.groomName) + "</b><br>Con ông " + esc(state.groomFather) + " &amp; bà " + esc(state.groomMother) +
      (state.groomPhone ? '<br>SĐT: <a href="tel:' + escAttr(state.groomPhone.replace(/\s+/g, "")) + '">' + esc(state.groomPhone) + "</a>" : "") + "</div>" +
      '<div class="card"><b>Cô dâu ' + esc(state.brideName) + "</b><br>Con ông " + esc(state.brideFather) + " &amp; bà " + esc(state.brideMother) +
      (state.bridePhone ? '<br>SĐT: <a href="tel:' + escAttr(state.bridePhone.replace(/\s+/g, "")) + '">' + esc(state.bridePhone) + "</a>" : "") + "</div>" +
      (state.dressCode ? '<p class="muted">Dress code: ' + esc(state.dressCode) + "</p>" : "") +
      "</section>");

    // Sự kiện
    parts.push("<section><h2>Thời gian &amp; Địa điểm</h2><div class=\"rule\"></div>" +
      '<div class="card"><b>Lễ Vu Quy — ' + esc(state.vuQuyTime) + "</b><br>" + esc(state.vuQuyPlace) + "<br>" + esc(state.vuQuyAddress) +
      (state.vuQuyAddress ? '<iframe class="map" loading="lazy" title="Bản đồ lễ Vu Quy" src="' + escAttr(mapsEmbed(state.vuQuyAddress)) + '"></iframe>' : "") + "</div>" +
      '<div class="card"><b>Tiệc cưới — Đón khách ' + esc(state.partyWelcome) + " · Khai tiệc " + esc(state.partyStart) + "</b><br>" + esc(state.partyPlace) + "<br>" + esc(state.partyAddress) +
      (state.partyAddress ? '<iframe class="map" loading="lazy" title="Bản đồ tiệc cưới" src="' + escAttr(mapsEmbed(state.partyPlace + ", " + state.partyAddress)) + '"></iframe>' : "") + "</div>" +
      "</section>");

    // Lịch trình
    if (state.showSchedule && state.schedule && state.schedule.length) {
      var tl = state.schedule.map(function (it) {
        return '<div class="tl"><span class="time">' + esc(it.time) + '</span><span class="dot"></span><div><b>' + esc(it.title) + "</b><br><span class=\"muted\">" + esc(it.desc) + "</span></div></div>";
      }).join("");
      parts.push("<section><h2>Lịch trình ngày cưới</h2><div class=\"rule\"></div>" + tl + "</section>");
    }

    // Câu chuyện
    if (state.showStory && state.story && state.story.length) {
      var st = state.story.map(function (it) {
        return '<div class="story"><small class="muted">' + esc(it.date) + "</small><br><b>" + esc(it.title) + "</b><br>" + esc(it.desc) + "</div>";
      }).join("");
      parts.push("<section><h2>Câu chuyện tình yêu</h2><div class=\"rule\"></div>" + st + "</section>");
    }

    // Album
    if (state.showAlbum && state.album && state.album.length) {
      var photos = state.album.filter(function (a) { return a.url; });
      if (photos.length) {
        var al = photos.map(function (a) {
          return '<figure><img loading="lazy" src="' + escAttr(a.url) + '" alt="' + escAttr(a.caption || "Ảnh cưới") + '">' +
            (a.caption ? "<figcaption>" + esc(a.caption) + "</figcaption>" : "") + "</figure>";
        }).join("");
        parts.push('<section><h2>Album ảnh cưới</h2><div class="rule"></div><div class="album">' + al + "</div></section>");
      }
    }

    // Mừng cưới / VietQR
    if (state.showGift) {
      var gift = '<section><h2>Mừng cưới</h2><div class="rule"></div>' +
        '<p class="muted">Quý khách ở xa có thể mừng cưới qua chuyển khoản — mã QR VietQR quét là ra đúng số tài khoản.</p>';
      gift += giftBlock(state, "groom") + giftBlock(state, "bride");
      gift += "</section>";
      parts.push(gift);
    }

    // RSVP + sổ lưu bút — gửi thật về Apps Script / Formspree nếu admin
    // đã cấu hình, ngược lại chỉ lưu local và báo rõ (không báo thành công giả).
    if (state.showRsvp) {
      var rsvpCfg = state.rsvp || { mode: "local", appsScriptUrl: "", formspreeUrl: "" };
      var rsvpMode = rsvpCfg.mode || "local";
      var rsvpIntro = "Vui lòng xác nhận trước ngày " + esc(formatDateVi(state.rsvpDeadline)) + ".";
      var rsvpWarn = "";
      if (rsvpMode === "apps-script") {
        if (rsvpCfg.appsScriptUrl) rsvpIntro += " Lời chúc của bạn sẽ được gửi về Google Sheet của cô dâu chú rể.";
        else rsvpWarn = '<div class="warn"><b>Chưa cấu hình nơi nhận RSVP:</b> lời chúc của bạn tạm thời chỉ lưu trên máy này. Cô dâu chú rể vui lòng dán Apps Script URL trong Builder rồi xuất lại thiệp.</div>';
      } else if (rsvpMode === "formspree") {
        if (rsvpCfg.formspreeUrl) rsvpIntro += " Lời chúc của bạn sẽ được gửi tới cô dâu chú rể.";
        else rsvpWarn = '<div class="warn"><b>Chưa cấu hình nơi nhận RSVP:</b> lời chúc của bạn tạm thời chỉ lưu trên máy này. Cô dâu chú rể vui lòng dán Formspree endpoint trong Builder rồi xuất lại thiệp.</div>';
      } else {
        rsvpIntro += " Thông tin của bạn chỉ lưu trên trình duyệt này.";
      }
      parts.push('<section><h2>Xác nhận tham dự (RSVP)</h2><div class="rule"></div>' +
        '<p class="muted">' + rsvpIntro + "</p>" + rsvpWarn +
        '<form data-rsvp-form>' +
        '<label for="rsvpName">Họ tên của bạn</label><input id="rsvpName" name="name" required autocomplete="name">' +
        '<label for="rsvpPhone">Số điện thoại (không bắt buộc)</label><input id="rsvpPhone" name="phone" type="tel" autocomplete="tel">' +
        '<label for="rsvpAttend">Bạn có tham dự không?</label><select id="rsvpAttend" name="attend"><option value="Tham dự">Tham dự</option><option value="Không tham dự được">Không tham dự được</option></select>' +
        '<label for="rsvpCount">Số người đi cùng</label><input id="rsvpCount" name="count" type="number" min="0" max="10" value="0">' +
        '<label for="rsvpMsg">Lời chúc tới cô dâu chú rể</label><textarea id="rsvpMsg" name="message" rows="3"></textarea>' +
        '<button class="btn" type="submit" style="width:100%;margin-top:16px">Gửi xác nhận &amp; lời chúc</button>' +
        "</form>" +
        '<p class="rsvp-status" data-rsvp-status role="status"></p>' +
        '<div data-wish-list style="margin-top:18px"></div>' +
        "</section>");
    }

    parts.push("<footer>Thiệp cưới online của " + esc(state.groomName) + " &amp; " + esc(state.brideName) +
      " · " + esc(formatDateVi(state.weddingDate)) + "</footer>");

    return '<div class="inv" data-slug="' + escAttr(slug) + '">' + parts.join("") + "</div>";
  }

  function giftBlock(state, who) {
    var bank = state[who + "Bank"], acc = state[who + "Account"], name = state[who + "AccountName"];
    if (!bank || !acc || !name) return "";
    var label = who === "groom" ? "Chú rể" : "Cô dâu";
    var qr = vietqrUrl(bank, acc, name, state.giftAmount, state.giftNote || "Mung cuoi");
    var html = '<div class="card bank"><b>' + label + " — " + esc(bank) + "</b><br>" +
      "Chủ TK: " + esc(name) + "<br>STK: <b data-stk=\"" + escAttr(acc) + "\">" + esc(acc) + "</b> " +
      '<button class="btn ghost small" type="button" data-copy-stk="' + escAttr(acc) + '">Sao chép STK</button>';
    if (qr) html += '<img class="qr" loading="lazy" src="' + escAttr(qr) + '" alt="Mã QR VietQR ' + escAttr(label) + '">';
    html += "</div>";
    return html;
  }

  /* ---------- JS chạy trong file thiệp xuất (độc lập, không phụ thuộc ngoài) ---------- */
  function standaloneJS(state) {
    var cfg = {
      slug: slugFor(state),
      target: weddingTargetISO(state),
      particlesEnabled: !!state.particlesEnabled,
      particleType: state.particleType || "sakura",
      musicUrl: state.musicUrl || "",
      /* Cấu hình nơi nhận RSVP — admin nhập trong Builder, KHÔNG bịa URL.
         mode: "apps-script" | "formspree" | "local" (mặc định local). */
      rsvp: state.rsvp || { mode: "local", appsScriptUrl: "", formspreeUrl: "" }
    };
    return "(function(){\n" +
      "var CFG=" + JSON.stringify(cfg) + ";\n" +
      "var $=function(s,c){return (c||document).querySelector(s)};\n" +
      "var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};\n" +
      /* Countdown — giờ địa phương, mốc Asia/Ho_Chi_Minh khi khách ở Việt Nam */
      "function pad(n){return String(n).padStart(2,'0')}\n" +
      "function tick(){\n" +
      "  var box=$('[data-countdown]'); if(!box) return;\n" +
      "  var target=new Date(box.getAttribute('data-target'));\n" +
      "  var diff=target-new Date();\n" +
      "  if(diff<=0){ $$('[data-cd]',box).forEach(function(el){el.textContent='0'}); return; }\n" +
      "  var d=Math.floor(diff/86400000), h=Math.floor(diff%86400000/3600000),\n" +
      "      m=Math.floor(diff%3600000/60000), s=Math.floor(diff%60000/1000);\n" +
      "  var map={d:d,h:pad(h),m:pad(m),s:pad(s)};\n" +
      "  $$('[data-cd]',box).forEach(function(el){ el.textContent=map[el.getAttribute('data-cd')] });\n" +
      "}\n" +
      "tick(); setInterval(tick,1000);\n" +
      /* Copy STK */
      "$$('[data-copy-stk]').forEach(function(btn){\n" +
      "  btn.addEventListener('click',function(){\n" +
      "    var v=btn.getAttribute('data-copy-stk');\n" +
      "    function done(){ btn.textContent='Đã sao chép'; setTimeout(function(){btn.textContent='Sao chép STK'},2000); }\n" +
      "    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(v).then(done); }\n" +
      "    else { var ta=document.createElement('textarea'); ta.value=v; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy'); done();}catch(e){} ta.remove(); }\n" +
      "  });\n" +
      "});\n" +
      /* Nhạc nền — KHÔNG autoplay có tiếng: Safari iOS và Chrome Android
         bắt buộc phải có một lần chạm của người dùng mới cho phát tiếng.
         Vì vậy nhạc chỉ phát khi khách chạm nút ♪; nếu trình duyệt chặn
         (promise play() bị reject, vd NotAllowedError) thì nút quay về
         trạng thái Tắt và không báo phát thành công giả. */
      "if(CFG.musicUrl){\n" +
      "  /* KHONG autoplay co tieng: Safari iOS / Chrome Android chi cho phat tieng sau 1 lan cham — nhac chi phat khi khach cham nut. */\n" +
      "  var audio=document.createElement('audio'); audio.src=CFG.musicUrl; audio.loop=true; audio.preload='metadata';\n" +
      "  audio.addEventListener('error',function(){ btn.classList.remove('playing'); btn.textContent='♪'; btn.title='Không tải được file nhạc từ link này — kiểm tra lại link MP3.'; });\n" +
      "  var btn=document.createElement('button'); btn.className='music-btn'; btn.type='button'; btn.textContent='♪';\n" +
      "  btn.setAttribute('aria-label','Bật / tắt nhạc nền — chạm để phát nhạc');\n" +
      "  btn.title='Chạm để bật nhạc (trình duyệt không cho tự phát nhạc có tiếng)';\n" +
      "  btn.addEventListener('click',function(){\n" +
      "    if(audio.paused){ audio.play().then(function(){btn.classList.add('playing');btn.textContent='❚❚';}).catch(function(err){ btn.classList.remove('playing'); btn.textContent='♪'; btn.title='Không phát được nhạc — kiểm tra lại link MP3 ('+(err&&err.name?err.name:'')+')'; }); }\n" +
      "    else { audio.pause(); btn.classList.remove('playing'); btn.textContent='♪'; }\n" +
      "  });\n" +
      "  document.body.appendChild(btn);\n" +
      "}\n" +
      /* Particles — bản gọn nhẹ, cùng logic với assets/js/particles.js */
      "var canvas=$('#fxCanvas');\n" +
      "if(canvas && CFG.particlesEnabled && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){\n" +
      "  var ctx=canvas.getContext('2d');\n" +
      "  var PAL={sakura:['#f9a8d4','#f472b6','#fbcfe8','#fda4af'],heart:['#ef4444','#f472b6','#fb7185','#e11d48'],snow:['#ffffff','#e0f2fe','#f8fafc'],glitter:['#facc15','#fde68a','#f59e0b','#fff7cc']};\n" +
      "  var colors=PAL[CFG.particleType]||PAL.sakura;\n" +
      "  var max=(window.innerWidth<=640||('ontouchstart' in window)||navigator.maxTouchPoints>0)?36:70, parts=[], W=0, H=0, raf=0, running=false;\n" +
      "  function size(){ var r=canvas.parentElement.getBoundingClientRect(); W=r.width; H=r.height;\n" +
      "    var d=Math.min(window.devicePixelRatio||1,2); canvas.width=W*d; canvas.height=H*d; ctx.setTransform(d,0,0,d,0,0); }\n" +
      "  function mk(y){ return {x:Math.random()*W, y:(typeof y==='number'?y:-20-Math.random()*40), s:CFG.particleType==='glitter'?2+Math.random()*3.5:CFG.particleType==='snow'?2+Math.random()*4:6+Math.random()*9, vy:CFG.particleType==='heart'?0.35+Math.random()*0.7:0.5+Math.random()*1.1, vx:(Math.random()-0.5)*0.6, rot:Math.random()*6.28, rs:(Math.random()-0.5)*0.02, c:colors[Math.floor(Math.random()*colors.length)], a:0.55+Math.random()*0.45, tw:Math.random()*6.28}; }\n" +
      "  function seed(){ size(); parts=[]; for(var i=0;i<max;i++) parts.push(mk(Math.random()*H)); }\n" +
      "  function draw(){ ctx.clearRect(0,0,W,H); parts.forEach(function(p){ ctx.save(); ctx.globalAlpha=p.a; ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.c; if(CFG.particleType==='heart'){ var k=p.s/16; ctx.beginPath(); ctx.moveTo(0,5*k); ctx.bezierCurveTo(-9*k,-3*k,-4*k,-9*k,0,-4*k); ctx.bezierCurveTo(4*k,-9*k,9*k,-3*k,0,5*k); ctx.closePath(); ctx.fill(); } else if(CFG.particleType==='snow'){ ctx.beginPath(); ctx.arc(0,0,p.s/2,0,6.29); ctx.fill(); } else if(CFG.particleType==='glitter'){ ctx.beginPath(); ctx.moveTo(0,-p.s); ctx.quadraticCurveTo(0,0,p.s,0); ctx.quadraticCurveTo(0,0,0,p.s); ctx.quadraticCurveTo(0,0,-p.s,0); ctx.quadraticCurveTo(0,0,0,-p.s); ctx.closePath(); ctx.fill(); } else { ctx.beginPath(); ctx.ellipse(0,0,p.s/2,p.s/3.2,0,0,6.29); ctx.fill(); } ctx.restore(); }); }\n" +
      "  function loop(){ if(!running) return; parts.forEach(function(p,i){ p.y+=p.vy; p.x+=p.vx+Math.sin(p.tw+=0.02)*0.4; p.rot+=p.rs; if(p.y>H+24){ parts[i]=mk(); } }); draw(); raf=requestAnimationFrame(loop); }\n" +
      "  function start(){ if(running||document.hidden) return; running=true; raf=requestAnimationFrame(loop); }\n" +
      "  function stop(){ running=false; cancelAnimationFrame(raf); ctx.clearRect(0,0,W,H); }\n" +
      "  seed(); start();\n" +
      "  var rzT=0;\n" +
      "  window.addEventListener('resize',function(){ clearTimeout(rzT); rzT=setTimeout(function(){ var m=(window.innerWidth<=640||('ontouchstart' in window)||navigator.maxTouchPoints>0)?36:70; if(m!==max){ max=m; } seed(); },200); });\n" +
      "  document.addEventListener('visibilitychange',function(){ document.hidden?stop():start(); });\n" +
      "}\n" +
      /* RSVP + sổ lưu bút — GỬI THẬT về nơi admin đã cấu hình, đồng thời
         luôn lưu 1 bản localStorage để khách thấy lời chúc của mình ngay.
         - Apps Script: POST text/plain + mode no-cors tới Web App URL
           (/exec). Vì no-cors nên KHÔNG đọc được response — fetch resolve
           là coi như đã gửi đi, báo "đang ghi vào Sheet", không khẳng định
           đã ghi xong. Payload theo đúng doPost() trong docs/apps-script-full.gs:
           {name, phone, attending, guests, wish} (kèm thêm các khóa tiếng
           Việt ten/thamDu/soKhach/loiChuc/thoiGian cho tương thích).
         - Formspree: POST JSON, đọc được response.ok nên báo chắc chắn hơn.
         - mode "local" hoặc URL trống: KHÔNG báo thành công giả — chỉ lưu
           local và báo rõ là chưa cấu hình nơi nhận. */
      "var KEY='wedding-rsvp-'+CFG.slug;\n" +
      "function escH(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;'); }\n" +
      "function loadWishes(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ return []; } }\n" +
      "function saveWish(w){ var list=loadWishes(); list.unshift(w); try{ localStorage.setItem(KEY, JSON.stringify(list)); }catch(e){} }\n" +
      "function renderWishes(){ var box=$('[data-wish-list]'); if(!box) return; var list=loadWishes();\n" +
      "  if(!list.length){ box.innerHTML=''; return; }\n" +
      "  box.innerHTML='<h3 style=\"font-size:18px\">Lời chúc đã gửi</h3>'+list.map(function(w){ return '<div class=\"wish\"><b>'+escH(w.name)+'</b> <small>· '+escH(w.attend)+(w.count>0?' · '+w.count+' người đi cùng':'')+'</small><br>'+escH(w.message)+'</div>'; }).join('');\n" +
      "}\n" +
      "function rsvpStatus(kind,msg){ var el=$('[data-rsvp-status]'); if(!el) return; el.className='rsvp-status show '+kind; el.textContent=msg; }\n" +
      "function sendRsvp(w){\n" +
      "  var mode=(CFG.rsvp&&CFG.rsvp.mode)||'local';\n" +
      "  if(mode==='apps-script'){\n" +
      "    var url=CFG.rsvp.appsScriptUrl||'';\n" +
      "    if(!url) return Promise.resolve({ok:false, unconfigured:true});\n" +
      "    var body={name:w.name, phone:w.phone||'', attending:w.attend, guests:w.count, wish:w.message, ten:w.name, thamDu:w.attend, soKhach:w.count, loiChuc:w.message, thoiGian:w.at};\n" +
      "    return fetch(url,{method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain'}, body:JSON.stringify(body)}).then(function(){ return {ok:true, note:'sheet'}; });\n" +
      "  }\n" +
      "  if(mode==='formspree'){\n" +
      "    var furl=CFG.rsvp.formspreeUrl||'';\n" +
      "    if(!furl) return Promise.resolve({ok:false, unconfigured:true});\n" +
      "    return fetch(furl,{method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify({name:w.name, phone:w.phone||'', attending:w.attend, guests:w.count, message:w.message, _subject:'RSVP thiep cuoi '+CFG.slug})}).then(function(res){ return {ok:res.ok}; });\n" +
      "  }\n" +
      "  return Promise.resolve({ok:true, localOnly:true});\n" +
      "}\n" +
      "var form=$('[data-rsvp-form]');\n" +
      "if(form){ form.addEventListener('submit',function(ev){ ev.preventDefault();\n" +
      "  var name=form.name.value.trim(); if(!name){ form.name.focus(); return; }\n" +
      "  var w={name:name, phone:(form.phone?form.phone.value.trim():''), attend:form.attend.value, count:+form.count.value||0, message:form.message.value.trim(), at:new Date().toISOString()};\n" +
      "  var b=form.querySelector('button[type=submit]'); b.disabled=true; b.textContent='Đang gửi…';\n" +
      "  rsvpStatus('sending','Đang gửi lời chúc…');\n" +
      "  sendRsvp(w).then(function(r){\n" +
      "    saveWish(w); form.reset(); renderWishes(); b.disabled=false; b.textContent='Gửi xác nhận & lời chúc';\n" +
      "    if(r.unconfigured){ rsvpStatus('err','Chưa cấu hình nơi nhận RSVP — lời chúc chỉ lưu trên máy này. Cô dâu chú rể hãy dán Apps Script URL / Formspree trong Builder rồi xuất lại thiệp.'); }\n" +
      "    else if(r.ok && r.note==='sheet'){ rsvpStatus('ok','Đã gửi — lời chúc đang được ghi vào Google Sheet của cô dâu chú rể. Cảm ơn bạn!'); }\n" +
      "    else if(r.ok && r.localOnly){ rsvpStatus('ok','Đã lưu lời chúc trên máy này. Cảm ơn bạn!'); }\n" +
      "    else if(r.ok){ rsvpStatus('ok','Đã nhận lời chúc của bạn. Cảm ơn bạn!'); }\n" +
      "    else { rsvpStatus('err','Gửi chưa thành công — lời chúc đã lưu tạm trên máy này, bạn hãy thử gửi lại sau.'); }\n" +
      "  }).catch(function(){\n" +
      "    saveWish(w); form.reset(); renderWishes(); b.disabled=false; b.textContent='Gửi xác nhận & lời chúc';\n" +
      "    rsvpStatus('err','Lỗi mạng — chưa gửi được tới cô dâu chú rể. Lời chúc đã lưu tạm trên máy này, bạn hãy thử gửi lại sau.');\n" +
      "  });\n" +
      "}); }\n" +
      "renderWishes();\n" +
      "})();";
  }

  function buildStandaloneHTML(state) {
    var t = TEMPLATES[state.template] || TEMPLATES.classic;
    var title = "Thiệp cưới " + state.groomName + " & " + state.brideName + " — " + formatDateVi(state.weddingDate);
    var bodyHtml = renderCardHTML(state);
    return "<!doctype html>\n<html lang=\"vi\">\n<head>\n<meta charset=\"utf-8\">\n" +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      "<title>" + esc(title) + "</title>\n" +
      '<meta name="description" content="' + escAttr("Thiệp cưới online của " + state.groomName + " & " + state.brideName + " — " + formatDateVi(state.weddingDate)) + '">\n' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Cormorant+Garamond:wght@500;600&family=Great+Vibes&display=swap">\n' +
      "<style>\n" + templateCSS(t) + "\n</style>\n</head>\n<body>\n" +
      bodyHtml +
      "\n<script>\n" + standaloneJS(state) + "\n<\/script>\n</body>\n</html>\n";
  }

  var api = {
    TEMPLATES: TEMPLATES, esc: esc, slugify: slugify, coupleSlug: coupleSlug, slugFor: slugFor,
    bankCode: bankCode, vietqrUrl: vietqrUrl, mapsEmbed: mapsEmbed,
    formatDateVi: formatDateVi, weddingTargetISO: weddingTargetISO,
    templateCSS: templateCSS, renderCardHTML: renderCardHTML,
    buildStandaloneHTML: buildStandaloneHTML
  };
  root.WeddingExport = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
