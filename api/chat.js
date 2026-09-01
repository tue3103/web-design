// ==============================================================================
// SMILEX WEB - LIVE CHAT API (2-WAY TELEGRAM SYNC & AI SPECIALIST)
// ==============================================================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8539622251:AAFAY3UlPj5X--2sjGwv0EtsxKUxF9GSLiU';
const TELEGRAM_GROUP_ID = process.env.TELEGRAM_GROUP_ID || '-5228273937';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

global._webChatSessions = global._webChatSessions || {};

async function sendTelegramMessage(chatId, text, messageThreadId = null) {
  try {
    const body = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    };
    if (messageThreadId) {
      body.message_thread_id = messageThreadId;
    }
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err) {
    console.error('Telegram Send Error:', err);
    return null;
  }
}

async function createTelegramForumTopic(title) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createForumTopic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_GROUP_ID,
        name: title,
        icon_custom_emoji_id: null
      })
    });
    const data = await res.json();
    if (data.ok && data.result) return data.result.message_thread_id;
    return null;
  } catch (e) {
    return null;
  }
}

async function generateWebAiResponse(userMessage, session) {
  const prompt = `Bạn là Chuyên viên Tư vấn Trực tuyến của SmileX Web Việt Nam (web.smilex.vn).
Bạn là người thật, tận tâm, chuyên nghiệp và am hiểu sâu sắc về dịch vụ làm website. Tuyệt đối KHÔNG xưng là "AI", "bot" hay "trợ lý ảo".

Thông tin cốt lõi về Dịch Vụ Thiết Kế Website 1 Triệu của SmileX Web:
1. Giá trọn gói: Đúng 1.000.000đ (KHÔNG phát sinh chi phí thiết kế).
2. Tốc độ bàn giao: 24 - 48 giờ có ngay bản web demo hoàn chỉnh.
3. Miễn phí Hosting vĩnh viễn (0đ/năm): Website chạy trên nền tảng Serverless Cloudflare & Vercel siêu tốc, bảo mật SSL tuyệt đối.
4. Chuẩn SEO Google 100%, hiển thị hoàn hảo trên điện thoại, máy tính bảng, PC.
5. Đầy đủ tính năng: Tích hợp Google Maps, Form nhận thông tin khách hàng, Tích hợp Live Chat, Nút gọi/nhắn tin, Kết nối Fanpage/Mạng xã hội.
6. Lĩnh vực phục vụ: Bán hàng, Công ty/Doanh nghiệp, Bất động sản, Spa/Thẩm mỹ, Nhà hàng/Cafe, Khách sạn/Du lịch, Dịch vụ kỹ thuật...
7. Khách hàng chỉ cần có 1 tên miền (khoảng 100k-200k/năm tại Inet, Matbao, PA...), SmileX hỗ trợ cài đặt trỏ DNS miễn phí từ A-Z.

Nội dung khách nhắn: "${userMessage}"

Quy tắc trả lời:
- Luôn chào hỏi lịch sự, tự nhiên, thân thiện (khoảng 2-4 câu).
- Trả lời đúng trọng tâm câu hỏi của khách về giá, thời gian, tên miền, tính năng.
- Nếu khách gửi thông tin đăng ký làm web, hào hứng tiếp nhận, xác nhận sẽ chuẩn bị mẫu demo theo đúng ngành nghề của khách và gửi qua khung chat này ngay.`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + (process.env.GROQ_API_KEY || ''),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.6,
        max_tokens: 220
      })
    });
    const groqData = await groqRes.json();
    const groqText = groqData.choices?.[0]?.message?.content;
    if (groqText) return groqText.trim();
  } catch (e) {
    console.error('Groq Error:', e);
  }

  return "Chào bạn! Cảm ơn bạn đã quan tâm đến dịch vụ Làm Web 1 Triệu của SmileX. Chuyên viên của chúng tôi đã nhận được yêu cầu và sẽ hỗ trợ tư vấn mẫu web phù hợp ngay cho bạn nhé!";
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // TELEGRAM WEBHOOK INCOMING (Distinguish from client chat POST)
  if (req.method === 'POST' && req.body && req.body.update_id && typeof req.body.message === 'object') {
    const tgMsg = req.body.message;
    const threadId = tgMsg.message_thread_id;
    const text = tgMsg.text;

    if (threadId && text) {
      for (const [sId, sess] of Object.entries(global._webChatSessions)) {
        if (sess.threadId === threadId) {
          sess.messages.push({
            id: 'tg_' + Date.now(),
            sender: 'admin',
            text: text,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          });
          sess.aiPaused = true;
          break;
        }
      }
    }
    return res.status(200).json({ ok: true });
  }

  const { action, sessionId, message, guestName, guestPhone } = req.body || req.query || {};

  if (!sessionId) {
    return res.status(400).json({ error: 'Thiếu sessionId' });
  }

  if (!global._webChatSessions[sessionId]) {
    global._webChatSessions[sessionId] = {
      id: sessionId,
      name: guestName || 'Khách Web',
      phone: guestPhone || '',
      threadId: null,
      aiPaused: false,
      createdAt: new Date(),
      messages: [
        {
          id: 'welcome',
          sender: 'ai',
          text: '👋 Chào bạn! Mình là Chuyên viên Tư Vấn SmileX Web. Bạn đang cần thiết kế website cho lĩnh vực nào để mình gửi mẫu demo tham khảo nhé?',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
  }

  const session = global._webChatSessions[sessionId];
  if (guestName) session.name = guestName;
  if (guestPhone) session.phone = guestPhone;

  // 1. GET MESSAGES
  if (action === 'get') {
    return res.status(200).json({
      success: true,
      messages: session.messages,
      session: {
        id: session.id,
        name: session.name,
        phone: session.phone
      }
    });
  }

  // 2. SEND MESSAGE
  if (action === 'send' && message) {
    const userMsgObj = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    session.messages.push(userMsgObj);

    // Sync to Telegram
    try {
      if (!session.threadId) {
        const topicTitle = `🌐 ${session.name || 'Khách Web'} (${session.phone || 'Chưa SĐT'})`;
        session.threadId = await createTelegramForumTopic(topicTitle);
      }

      await sendTelegramMessage(
        TELEGRAM_GROUP_ID,
        `<b>💬 Khách [${session.name || 'Khách Web'} ${session.phone ? '• ' + session.phone : ''}]:</b>\n${message}`,
        session.threadId || null
      );
    } catch (err) {
      console.error(err);
    }

    // AI Specialist response if not paused by admin
    if (!session.aiPaused) {
      try {
        const aiReplyText = await generateWebAiResponse(message, session);
        const aiMsgObj = {
          id: 'ai_' + Date.now(),
          sender: 'ai',
          text: aiReplyText,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        session.messages.push(aiMsgObj);

        await sendTelegramMessage(
          TELEGRAM_GROUP_ID,
          `<b>🤖 Tư Vấn SmileX:</b>\n${aiReplyText}`,
          session.threadId || null
        );
      } catch (e) {
        console.error('AI Reply error:', e);
      }
    }

    return res.status(200).json({
      success: true,
      messages: session.messages
    });
  }

  // 3. RESET CHAT
  if (action === 'reset') {
    delete global._webChatSessions[sessionId];
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Action không hợp lệ' });
}
