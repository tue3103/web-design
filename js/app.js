// ==============================================================================
// SMILEX WEB - THIẾT KẾ WEBSITE 1 TRIỆU TRỌN GÓI (web.smilex.vn)
// Form Submission & Interactive Engine
// ==============================================================================

function handleOrderSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('orderName').value.trim();
  const phone = document.getElementById('orderPhone').value.trim();
  const industry = document.getElementById('orderIndustry').value;
  const note = document.getElementById('orderNote').value.trim();

  localStorage.setItem('smilex_guest_name', name);
  localStorage.setItem('smilex_guest_phone', phone);

  const message = `🚀 [ĐĂNG KÝ LÀM WEB 1 TRIỆU]\n- Khách hàng: ${name}\n- SĐT / Zalo: ${phone}\n- Lĩnh vực: ${industry}\n- Yêu cầu: ${note || 'Tư vấn mẫu giao diện phù hợp'}\nNhờ chuyên viên gửi demo và tư vấn giúp mình nhé!`;

  // Open Live Chat and send message directly
  if (typeof openChatWithMessage === 'function') {
    openChatWithMessage(message, name, phone);
  } else {
    alert('Cảm ơn bạn! Chuyên viên SmileX Web sẽ phản hồi ngay qua khung chat trực tuyến.');
  }

  // Reset form
  document.getElementById('orderNote').value = '';
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
