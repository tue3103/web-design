// ==============================================================================
// SMILEX WEB - LIVE CHAT FRONTEND CONTROLLER
// ==============================================================================

let currentSessionId = localStorage.getItem('smilex_web_chat_session') || '';
if (!currentSessionId) {
  currentSessionId = 'web_' + Math.random().toString(36).substring(2, 9);
  localStorage.setItem('smilex_web_chat_session', currentSessionId);
}

let isChatOpen = false;
let pollingInterval = null;

function toggleChat() {
  const win = document.getElementById('chatWindow');
  if (!win) return;
  isChatOpen = !isChatOpen;
  if (isChatOpen) {
    win.classList.add('open');
    loadMessages();
    startPolling();
    setTimeout(() => {
      document.getElementById('chatInput')?.focus();
    }, 200);
  } else {
    win.classList.remove('open');
    stopPolling();
  }
}

function openChatWithMessage(initialMsg, name = '', phone = '') {
  const win = document.getElementById('chatWindow');
  if (!win) return;
  isChatOpen = true;
  win.classList.add('open');
  if (initialMsg) {
    sendChatMessage(initialMsg, name, phone);
  } else {
    loadMessages();
  }
  startPolling();
}

async function loadMessages() {
  try {
    const res = await fetch(`/api/chat?action=get&sessionId=${currentSessionId}`);
    const data = await res.json();
    if (data.success && data.messages) {
      renderMessages(data.messages);
    }
  } catch (err) {
    console.error('Load chat error:', err);
  }
}

function renderMessages(messages) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  container.innerHTML = messages.map(m => {
    let author = '';
    if (m.sender === 'ai') author = '🌟 Chuyên Viên SmileX';
    else if (m.sender === 'admin') author = '👨‍💻 Tư Vấn Viên Trực Tiếp';

    return `
      <div class="msg-bubble ${m.sender}">
        ${author ? `<span class="msg-author-tag">${author}</span>` : ''}
        <div>${escapeHtml(m.text)}</div>
        <span class="msg-time">${m.timestamp || ''}</span>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

async function handleChatSubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  await sendChatMessage(text);
}

async function sendChatMessage(text, guestName = '', guestPhone = '') {
  // Append temporary local message
  const container = document.getElementById('chatMessages');
  if (container) {
    const tempDiv = document.createElement('div');
    tempDiv.className = 'msg-bubble user';
    tempDiv.innerHTML = `<div>${escapeHtml(text)}</div><span class="msg-time">Đang gửi...</span>`;
    container.appendChild(tempDiv);
    container.scrollTop = container.scrollHeight;
  }

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        sessionId: currentSessionId,
        message: text,
        guestName: guestName || localStorage.getItem('smilex_guest_name') || 'Khách Web',
        guestPhone: guestPhone || localStorage.getItem('smilex_guest_phone') || ''
      })
    });
    const data = await res.json();
    if (data.success && data.messages) {
      renderMessages(data.messages);
    }
  } catch (err) {
    console.error('Send error:', err);
  }
}

function startPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(loadMessages, 3000);
}

function stopPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}
