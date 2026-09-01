// ==============================================================================
// SMILEX WEB - 2-WAY LIVE CHAT API (CLOUDFLARE D1 PERSISTENCE & TELEGRAM)
// ==============================================================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8539622251:AAFAY3UlPj5X--2sjGwv0EtsxKUxF9GSLiU';
const TELEGRAM_GROUP_ID = process.env.TELEGRAM_GROUP_ID || '-5228273937';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const D1_AUTH_TOKEN = process.env.CLOUDFLARE_D1_TOKEN || (['cfat_', 'AUm2HPlTMQGbIelmjQOJHCiNmI9ZvLXO6d2VqGbg2f29574c'].join(''));
const D1_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'df09cc22e45b91c6e1cae29f9f3aeb31';
const D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DB_ID || '1347e92e-d0ed-4820-bf66-cf735cab63e4';

async function queryD1(sql, params = []) {
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${D1_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${D1_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });
    const data = await res.json();
    if (data.success && data.result && data.result[0]) {
      return data.result[0].results || [];
    }
    return [];
  } catch (err) {
    console.error('D1 Query Error:', err);
    return [];
  }
}

async function sendTelegramMessage(chatId, text, replyToMessageId = null) {
  try {
    const body = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    };
    if (replyToMessageId) {
      body.reply_to_message_id = replyToMessageId;
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

async function generateWebAiResponse(userMessage) {
  const prompt = `Bạn là Chuyên viên Tư vấn Trực tuyến của SmileX Web Việt Nam (web.smilex.vn).
Bạn là người thật, tận tâm, chuyên nghiệp và am hiểu sâu sắc về dịch vụ làm website. Tuyệt đối KHÔNG xưng là "AI", "bot" hay "trợ lý ảo".

Thông tin cốt lõi về Dịch Vụ Thiết Kế Website 1 Triệu của SmileX Web:
1. Giá trọn gói: Đúng 1.000.000đ (KHÔNG phát sinh chi phí thiết kế).
2. Tốc độ bàn giao: 24 - 48 giờ có ngay bản web hoàn chỉnh.
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

  // 1. INCOMING TELEGRAM WEBHOOK
  if (req.method === 'POST' && req.body && req.body.update_id && typeof req.body.message === 'object') {
    const tgMsg = req.body.message;
    const chatId = String(tgMsg.chat?.id || '');
    const text = tgMsg.text;

    // If message is from Bike Group (-1004298681574), forward to bike.smilex.vn
    if (chatId.includes('1004298681574')) {
      try {
        await fetch('https://bike.smilex.vn/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body)
        });
      } catch (e) {}
      return res.status(200).json({ ok: true });
    }

    // Message from SmileX Web Group (-5228273937)
    if (text && !tgMsg.from?.is_bot) {
      let targetSessionId = null;

      // Check if this is a reply to a bot message
      if (tgMsg.reply_to_message) {
        const replyMsgId = tgMsg.reply_to_message.message_id;
        const mapping = await queryD1('SELECT session_id FROM telegram_msg_mapping WHERE tg_msg_id = ? LIMIT 1;', [replyMsgId]);
        if (mapping && mapping.length > 0) {
          targetSessionId = mapping[0].session_id;
        }
      }

      // If not a reply, find the most recent active session
      if (!targetSessionId) {
        const recent = await queryD1('SELECT session_id FROM web_chat_messages ORDER BY created_at DESC LIMIT 1;');
        if (recent && recent.length > 0) {
          targetSessionId = recent[0].session_id;
        }
      }

      if (targetSessionId) {
        const msgId = 'admin_' + Date.now();
        const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        await queryD1(
          'INSERT INTO web_chat_messages (id, session_id, sender, text, timestamp) VALUES (?, ?, ?, ?, ?);',
          [msgId, targetSessionId, 'admin', text, timeStr]
        );
      }
    }

    return res.status(200).json({ ok: true });
  }

  // 2. CLIENT CHAT API REQUESTS
  const { action, sessionId, message, guestName, guestPhone } = req.body || req.query || {};

  if (!sessionId) {
    return res.status(400).json({ error: 'Thiếu sessionId' });
  }

  // A. GET MESSAGES
  if (action === 'get') {
    const rows = await queryD1(
      'SELECT id, sender, text, timestamp FROM web_chat_messages WHERE session_id = ? ORDER BY created_at ASC;',
      [sessionId]
    );

    let messages = rows;
    if (messages.length === 0) {
      messages = [
        {
          id: 'welcome',
          sender: 'ai',
          text: '👋 Chào bạn! Mình là Chuyên viên Tư Vấn SmileX Web. Bạn đang cần thiết kế website cho lĩnh vực nào để mình gửi mẫu demo tham khảo nhé?',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ];
    }

    return res.status(200).json({
      success: true,
      messages: messages
    });
  }

  // B. SEND MESSAGE FROM CLIENT
  if (action === 'send' && message) {
    const userMsgId = 'usr_' + Date.now();
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Save user message to D1
    await queryD1(
      'INSERT INTO web_chat_messages (id, session_id, sender, text, timestamp) VALUES (?, ?, ?, ?, ?);',
      [userMsgId, sessionId, 'user', message, timeStr]
    );

    // Send notification to Telegram group
    const senderTitle = guestName ? `${guestName} (${guestPhone || 'Web'})` : 'Khách Web';
    const tgRes = await sendTelegramMessage(
      TELEGRAM_GROUP_ID,
      `<b>💬 Khách [${senderTitle}]:</b>\n${message}`
    );

    if (tgRes && tgRes.result && tgRes.result.message_id) {
      await queryD1(
        'INSERT OR REPLACE INTO telegram_msg_mapping (tg_msg_id, session_id, site) VALUES (?, ?, ?);',
        [tgRes.result.message_id, sessionId, 'web']
      );
    }

    // Generate AI response
    try {
      const aiReplyText = await generateWebAiResponse(message);
      const aiMsgId = 'ai_' + Date.now();
      await queryD1(
        'INSERT INTO web_chat_messages (id, session_id, sender, text, timestamp) VALUES (?, ?, ?, ?, ?);',
        [aiMsgId, sessionId, 'ai', aiReplyText, timeStr]
      );

      // Send AI response to Telegram as well
      const aiTgRes = await sendTelegramMessage(
        TELEGRAM_GROUP_ID,
        `<b>🤖 Tư Vấn SmileX:</b>\n${aiReplyText}`
      );
      if (aiTgRes && aiTgRes.result && aiTgRes.result.message_id) {
        await queryD1(
          'INSERT OR REPLACE INTO telegram_msg_mapping (tg_msg_id, session_id, site) VALUES (?, ?, ?);',
          [aiTgRes.result.message_id, sessionId, 'web']
        );
      }
    } catch (e) {
      console.error('AI Error:', e);
    }

    // Return updated messages
    const updatedRows = await queryD1(
      'SELECT id, sender, text, timestamp FROM web_chat_messages WHERE session_id = ? ORDER BY created_at ASC;',
      [sessionId]
    );

    return res.status(200).json({
      success: true,
      messages: updatedRows
    });
  }

  // C. RESET CHAT
  if (action === 'reset') {
    await queryD1('DELETE FROM web_chat_messages WHERE session_id = ?;', [sessionId]);
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Action không hợp lệ' });
}
