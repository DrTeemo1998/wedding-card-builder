/* Build bản test 1 file cho repo wcb-dev-test: gộp index.html + CSS/JS nội bộ.
   Chạy: node tools/build-test-bundle.js
   Kết quả: ~/workspace/wcb-dev-test.html — đẩy lên repo DrTeemo1998/wcb-dev-test
   làm index.html để có link test lâu dài (https://drteemo1998.github.io/wcb-dev-test/).
   Lưu ý: file JS nội bộ không được chứa chuỗi "</script>" (phải viết "<\/script>")
   vì sẽ làm vỡ thẻ <script> khi inline. */
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

let html = read("index.html");
html = html.replace(
  '<link rel="stylesheet" href="assets/css/style.css">',
  "<style>\n" + read("assets/css/style.css") + "\n</style>"
);
["particles.js", "export-template.js", "sample-data.js", "app.js"].forEach(function (f) {
  const tag = '<script src="assets/js/' + f + '"></script>';
  if (!html.includes(tag)) throw new Error("Không tìm thấy thẻ script: " + tag);
  const code = read("assets/js/" + f);
  if (code.includes("</script>")) throw new Error("File " + f + " chứa chuỗi </script> — sẽ vỡ HTML khi inline!");
  /* QUAN TRỌNG: phải dùng hàm thay thế, KHÔNG dùng chuỗi thay thế — vì
     String.replace() hiểu "$$" trong chuỗi thay thế là ký tự "$" (đặc biệt),
     sẽ biến mọi "$$" trong code (helper querySelectorAll) thành "$" và làm
     vỡ toàn bộ Builder (picker trống, preview trắng, ExportLib lỗi). */
  html = html.replace(tag, function () { return "<script>\n" + code + "\n</script>"; });
});
if (/(src|href)=["']assets\//.test(html)) throw new Error("Còn tham chiếu file nội bộ chưa inline!");
const out = path.resolve(process.env.HOME, "workspace/wcb-dev-test.html");
fs.writeFileSync(out, html);
console.log("Wrote " + out + " (" + html.length + " bytes)");
