// ==============================================================================
// SMILEX WEB - THIẾT KẾ WEBSITE 1 TRIỆU TRỌN GÓI (web.smilex.vn)
// Form Submission & Interactive Engine
// ==============================================================================

function handleOrderSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('orderName').value;
  const phone = document.getElementById('orderPhone').value;
  const industry = document.getElementById('orderIndustry').value;
  const note = document.getElementById('orderNote').value;

  const message = `Chào SmileX Web! Tôi muốn đăng ký làm Website 1 Triệu trọn gói:\n- Khách hàng: ${name}\n- Số điện thoại / Zalo: ${phone}\n- Lĩnh vực kinh doanh: ${industry}\n- Ghi chú / Yêu cầu thêm: ${note || 'Tư vấn mẫu giao diện phù hợp'}\nNhờ SmileX tư vấn và gửi demo giúp tôi!`;

  // Redirect to Zalo Chat with prefilled text or hotline
  const zaloUrl = `https://zalo.me/0979820789?text=${encodeURIComponent(message)}`;
  window.open(zaloUrl, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
