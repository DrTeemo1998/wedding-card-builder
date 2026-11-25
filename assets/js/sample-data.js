/* Dữ liệu mẫu: Trần Minh Nhật & Nguyễn Thái Hà — cưới 20/12/2026.
   CẢNH BÁO DỮ LIỆU MẪU - CẦN XÁC NHẬN trước khi gửi khách thật:
   - Tên địa điểm tiệc "Nhà Hàng Crown Tiền Hải" trong Sheet gốc chưa xác nhận
     100% có phải là Crown Palace hay không — cần gọi điện xác nhận với khách.
   - Số tài khoản cô dâu Vietcombank 376634531 chỉ có 9 chữ số, chưa xác thực.
   - Tên phụ huynh (Trần Minh A / Trần Minh B / Nguyễn Thái C / Trần Thị D),
     số điện thoại và các mốc câu chuyện là dữ liệu mẫu trong Sheet gốc.
   Không tự bịa thêm số tài khoản, địa chỉ chi tiết hay số điện thoại khác. */
(function (root) {
  var SAMPLE = {
    groomName: "Trần Minh Nhật",
    brideName: "Nguyễn Thái Hà",
    groomFather: "Trần Minh A",
    groomMother: "Trần Minh B",
    brideFather: "Nguyễn Thái C",
    brideMother: "Trần Thị D",
    weddingDate: "2026-12-20",
    rsvpDeadline: "2026-12-10",
    groomPhone: "0967156341",
    bridePhone: "0974565245",
    inviteText: "Trân trọng kính mời bạn cùng gia đình tới dự lễ thành hôn của chúng mình. Sự hiện diện của bạn là niềm hạnh phúc lớn nhất trong ngày trọng đại này.",
    coverUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop",
    vuQuyTime: "09:00",
    vuQuyPlace: "Tư gia Nhà Gái",
    vuQuyAddress: "Phố Hùng Thắng, Tiền Hải, Thái Bình",
    partyWelcome: "11:00",
    partyStart: "11:30",
    partyPlace: "Nhà Hàng Crown Tiền Hải",
    partyAddress: "Tiền Hải, Thái Bình",
    dressCode: "Trắng · Be · Vàng gold",
    schedule: [
      { time: "09:00", title: "Lễ Vu Quy", desc: "Làm lễ tại tư gia nhà gái" },
      { time: "10:30", title: "Rước dâu", desc: "Đoàn nhà trai đón cô dâu về nhà hàng" },
      { time: "11:00", title: "Đón khách", desc: "Đón khách & chụp ảnh tại sảnh tiệc" },
      { time: "11:30", title: "Khai tiệc", desc: "Làm lễ trên sân khấu & khai tiệc" },
      { time: "12:30", title: "Chụp ảnh cùng khách", desc: "Chụp ảnh lưu niệm với khách mời" }
    ],
    story: [
      { date: "Mùa thu 2021", title: "Lần đầu gặp nhau", desc: "Gặp nhau lần đầu trong một buổi chiều thu." },
      { date: "14/02/2022", title: "Chính thức yêu nhau", desc: "Ngày Valentine, hai người chính thức bắt đầu hành trình cùng nhau." },
      { date: "20/10/2025", title: "Lời cầu hôn", desc: "Một lời cầu hôn giản dị và cái gật đầu hạnh phúc." },
      { date: "20/12/2026", title: "Về chung một nhà", desc: "Ngày cưới — chương mới của câu chuyện bắt đầu." }
    ],
    album: [
      { url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80&auto=format&fit=crop", caption: "Ngày chung đôi" },
      { url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=900&q=80&auto=format&fit=crop", caption: "Khoảnh khắc yêu thương" },
      { url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=900&q=80&auto=format&fit=crop", caption: "Nhẫn cưới" },
      { url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=900&q=80&auto=format&fit=crop", caption: "Cô dâu xinh đẹp" },
      { url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=900&q=80&auto=format&fit=crop", caption: "Nắm tay nhau" },
      { url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&q=80&auto=format&fit=crop", caption: "Hạnh phúc trọn vẹn" }
    ],
    groomBank: "Vietcombank",
    groomAccount: "34098011949",
    groomAccountName: "TRAN MINH NHAT",
    brideBank: "Vietcombank",
    brideAccount: "376634531",
    brideAccountName: "NGUYEN THAI HA",
    giftAmount: "",
    giftNote: "Mừng cưới",
    template: "classic",
    particlesEnabled: true,
    particleType: "sakura",
    musicUrl: "",
    showCountdown: true,
    showAlbum: true,
    showRsvp: true,
    showGift: true,
    showStory: true,
    showSchedule: true,
    slug: "minh-nhat-thai-ha",
    /* Nơi nhận RSVP — mẫu để chế độ local (chỉ lưu trên máy khách) vì chưa
       có Apps Script URL / Formspree thật của cặp đôi. Admin dán URL thật
       trong Builder (mục Nhận RSVP) rồi xuất lại thiệp. KHÔNG bịa URL. */
    rsvp: { mode: "local", appsScriptUrl: "", formspreeUrl: "" }
  };
  root.WEDDING_SAMPLE = SAMPLE;
  if (typeof module !== "undefined" && module.exports) module.exports = SAMPLE;
})(typeof window !== "undefined" ? window : globalThis);
