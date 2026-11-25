/**
 * Apps Script đầy đủ cho thiệp cưới online — thay cho mã rút gọn ở sheet 8_MA_KET_NOI
 * File mẫu: mau-google-sheet-thiep-cuoi
 * Cặp đôi mẫu: Trần Minh Nhật & Nguyễn Thái Hà — cưới 20/12/2026, hạn RSVP 10/12/2026
 *
 * CÁCH DÙNG (mỗi Sheet của khách làm một lần):
 *  1. Mở Sheet của khách → Extensions → Apps Script, xóa mã cũ, dán toàn bộ file này.
 *  2. Đổi múi giờ của Spreadsheet sang Asia/Ho_Chi_Minh:
 *     File → Settings → Locale: Vietnam, Time zone: (GMT+07:00) Ho Chi Minh.
 *     (Mã cũ để America/Los_Angeles nên đếm ngược có thể lệch ~15 giờ.)
 *  3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 *     Copy link .../exec, dán vào ô "Link Apps Script Web App" ở tab Cài đặt & Xuất
 *     trong file thiep-cuoi-online-ban-html.html.
 *  4. Bấm "Đọc dữ liệu từ Sheet" để kiểm tra: phải trả về đủ lichTrinh, cauChuyen,
 *     album, mungCuoi, caiDat — không chỉ sheet 1 như mã cũ.
 *
 * KHÁC BIỆT SO VỚI MÃ CŨ (sheet 8):
 *  - Mã cũ: doGet chỉ đọc 1_THONG_TIN, doPost chỉ ghi RSVP về 5_RSVP_KHACH_MOI.
 *  - Mã này: doGet đọc cả 7 sheet dữ liệu (1–7), doPost ghi RSVP theo đúng
 *    tiêu đề cột của sheet 5 (không ghi cứng thứ tự cột), thời gian ghi theo
 *    giờ Việt Nam (Asia/Ho_Chi_Minh).
 *  - Không tạo thêm sheet sổ lưu bút: file mẫu không có sheet riêng cho lời chúc,
 *    nên lời chúc của khách vẫn ghi vào cột lời chúc của sheet 5 như mã cũ.
 *  - Không đổi dữ liệu mẫu trong Sheet: tên bố mẹ giả, SĐT thiếu số 0, số tài
 *    khoản cô dâu 9 số vẫn phải sửa tay trong Sheet trước khi công bố.
 */

var TZ = 'Asia/Ho_Chi_Minh';
var SHEET_INFO = '1_THONG_TIN';
var SHEET_SCHEDULE = '2_LICH_TRINH';
var SHEET_STORY = '3_CAU_CHUYEN';
var SHEET_ALBUM = '4_ALBUM_ANH';
var SHEET_RSVP = '5_RSVP_KHACH_MOI';
var SHEET_GIFT = '6_MUNG_CUOI';
var SHEET_SETTINGS = '7_CAI_DAT';

function getSheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function getValues_(name) {
  var sh = getSheet_(name);
  if (!sh) return [];
  return sh.getDataRange().getValues();
}

/* Đọc dạng Khóa | Giá trị (sheet 1 và sheet 7) — giữ tương thích với mã cũ. */
function kvFromSheet_(name) {
  var out = {};
  getValues_(name).forEach(function (r) {
    if (r[0] !== '' && r[0] != null) out[String(r[0])] = r[1];
  });
  return out;
}

/* Đọc dạng bảng: hàng 1 là tiêu đề, các hàng sau là dữ liệu, bỏ hàng trống. */
function tableFromSheet_(name) {
  var values = getValues_(name);
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) { return String(h || '').trim(); });
  var rows = [];
  values.slice(1).forEach(function (r) {
    var empty = r.every(function (c) { return c === '' || c == null; });
    if (empty) return;
    var obj = {};
    headers.forEach(function (h, i) { if (h) obj[h] = r[i]; });
    rows.push(obj);
  });
  return rows;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function nowVn_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');
}

function doGet(e) {
  var info = kvFromSheet_(SHEET_INFO);
  var settings = kvFromSheet_(SHEET_SETTINGS);
  var rsvpRows = tableFromSheet_(SHEET_RSVP);

  /* Tổng hợp RSVP — dùng đúng dữ liệu đang có trong sheet 5. */
  var attending = 0, notAttending = 0, pending = 0, guestsComing = 0;
  rsvpRows.forEach(function (r) {
    var text = JSON.stringify(r).toLowerCase();
    var guests = 0;
    Object.keys(r).forEach(function (k) {
      if (/số người|so nguoi|khách|guests/i.test(k)) guests = Number(r[k]) || 0;
    });
    if (/không tham dự|không đến|khong tham du|từ chối|tu choi/.test(text)) {
      notAttending++;
    } else if (/tham dự|tham du|đến|den|đồng ý|dong y|yes/.test(text)) {
      attending++;
      guestsComing += guests || 1;
    } else {
      pending++;
    }
  });

  var data = {
    /* Giữ nguyên các trường sheet 1 ở cấp cao nhất để bản HTML cũ vẫn đọc được. */
    lichTrinh: tableFromSheet_(SHEET_SCHEDULE),
    cauChuyen: tableFromSheet_(SHEET_STORY),
    album: tableFromSheet_(SHEET_ALBUM),
    mungCuoi: tableFromSheet_(SHEET_GIFT),
    rsvp: rsvpRows,
    caiDat: settings,
    rsvpSummary: {
      total: rsvpRows.length,
      attending: attending,
      notAttending: notAttending,
      pending: pending,
      guestsComing: guestsComing
    },
    meta: { timezone: TZ, generatedAt: nowVn_() }
  };
  Object.keys(info).forEach(function (k) { data[k] = info[k]; });
  Object.keys(settings).forEach(function (k) { if (!(k in data)) data[k] = settings[k]; });
  return jsonOut_(data);
}

/* Tìm cột theo tiêu đề, ví dụ cột "Tên khách" cho tên, "SĐT" cho điện thoại. */
function findCol_(headers, patterns) {
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || '').toLowerCase();
    for (var j = 0; j < patterns.length; j++) {
      if (h.indexOf(patterns[j]) !== -1) return i;
    }
  }
  return -1;
}

function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var sh = getSheet_(SHEET_RSVP);
  if (!sh) return jsonOut_({ ok: false, error: 'Không tìm thấy sheet ' + SHEET_RSVP });

  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  /* Ghi theo tiêu đề cột thật của sheet 5; nếu không khớp tiêu đề nào thì
     dùng thứ tự cũ: Tên, SĐT, Tham dự, Số người, Lời chúc, Thời gian. */
  var row = new Array(headers.length).fill('');
  var map = [
    { col: findCol_(headers, ['tên', 'ten', 'khách', 'name']), val: d.name || '' },
    { col: findCol_(headers, ['điện thoại', 'dien thoai', 'sđt', 'sdt', 'phone']), val: d.phone || '' },
    { col: findCol_(headers, ['tham dự', 'tham du', 'dự', 'attending']), val: d.attending || '' },
    { col: findCol_(headers, ['số người', 'so nguoi', 'số khách', 'guests']), val: d.guests == null ? '' : d.guests },
    { col: findCol_(headers, ['lời chúc', 'loi chuc', 'chúc', 'ghi chú', 'wish', 'note']), val: d.wish || '' },
    { col: findCol_(headers, ['thời gian', 'thoi gian', 'ngày', 'date']), val: nowVn_() }
  ];
  var fallback = [d.name || '', d.phone || '', d.attending || '', d.guests == null ? '' : d.guests, d.wish || '', nowVn_()];
  var anyMapped = false;
  map.forEach(function (m, i) {
    if (m.col >= 0) { row[m.col] = m.val; anyMapped = true; }
  });
  if (!anyMapped) row = fallback.slice(0, headers.length);
  sh.appendRow(row);
  return jsonOut_({ ok: true, savedAt: nowVn_() });
}
