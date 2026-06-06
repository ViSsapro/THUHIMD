const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    delay,
    downloadMediaMessage
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// 🖼️ THUHI MD Logo Link
const botLogoUrl = "https://i.ibb.co/Z6gnPvV2/file-000000009be47207afef1535933c3f19.png";

let sock = null;

// දත්ත තාවකාලිකව තබා ගන්නා මතක ගබඩාවන් (Memory Stores)
const messageStore = {};
const viewOnceStore = {}; 

app.use(express.static(path.join(__dirname)));

async function startThuhiMD() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logLevel: 'silent',
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startThuhiMD();
        } else if (connection === 'open') {
            console.log('=================================================');
            console.log('🎉 THUHI MD IS NATURALLY WORKING NOW!');
            console.log('=================================================');
        }
    });

    // මැසේජ් ලැබෙන විට ක්‍රියාත්මක වන පද්ධතිය
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            if (chatUpdate.type !== 'notify') return;
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            const from = mek.key.remoteJid;
            const msgId = mek.key.id;
            
            // 🛑 ANTI-DELETE සඳහා ලැබෙන හැම මැසේජ් එකක්ම මතක තබා ගැනීම
            messageStore[msgId] = mek;

            // 🔓 ONE-VIEW PHOTO එකක් ආවොත් රහසින් මතක තබා ගැනීම
            const isViewOnce = mek.message.viewOnceMessageV2 || mek.message.viewOnceMessage;
            if (isViewOnce) {
                viewOnceStore[msgId] = mek;
            }

            // Ephemeral පිරිසිදු කිරීම
            let msgType = Object.keys(mek.message)[0];
            if (msgType === 'ephemeralMessage') {
                mek.message = mek.message.ephemeralMessage.message;
                msgType = Object.keys(mek.message)[0];
            }
            
            // Text එක නිවැරදිව ලබා ගැනීම
            let body = '';
            if (msgType === 'conversation') body = mek.message.conversation;
            else if (msgType === 'extendedTextMessage') body = mek.message.extendedTextMessage.text;
            else if (msgType === 'imageMessage') body = mek.message.imageMessage.caption;
            else if (msgType === 'videoMessage') body = mek.message.videoMessage.caption;

            const prefix = '.';
            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : undefined;
            const args = body.trim().split(/ +/).slice(1);

            if (isCmd) {
                // 1. ALIVE COMMAND
                if (command === 'alive') {
                    const aliveMsg = `👋 *THUHI MD IS ALIVE NOW*

*OWNER* - THUHI MD
*VERSION* - 1.0.0
*PREFIX* - [ . ]

💬 සියලුම විධානයන් බැලීමට \`.menu\` ලෙස ටයිප් කරන්න!`;
                    await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: aliveMsg }, { quoted: mek });
                }

                // 2. MENU COMMAND
                if (command === 'menu' || command === 'help') {
                    const menuText = `✨ *THUHI MD WHATSAPP BOT MENU* ✨

👋 හෙලෝ යාළුවා, මම THUHI MD බහුකාර්ය බෝට්.

*📥 DOWNLOAD COMMANDS:*
• \`.dl [link]\` - TikTok, FB, Insta, YouTube වීඩියෝ බාගන්න.

*🖼️ STICKER COMMANDS:*
• \`.sticker\` / \`.s\` - ඡායාරූපයකට Reply කර ස්ටිකර් සාදන්න.

*🔓 WHATSAPP TOOLS:*
• \`.ovp\` - One-View ඡායාරූපයකට Reply කර එය ලබාගන්න.

---
*🚨 AUTOMATIC FEATURES:*
• *Anti-Delete:* කවුරුහරි මකන මැසේජ් ඔටෝමැටිකව නැවත ලබාදේ.

_Powered by Vimukthi Thuhina_`;
                    await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: menuText }, { quoted: mek });
                }

                // 3. ONE-VIEW RECOVERY (.ovp)
                if (command === 'ovp') {
                    const quotedMsgId = mek.message.extendedTextMessage?.contextInfo?.stanzaId;
                    if (quotedMsgId && viewOnceStore[quotedMsgId]) {
                        await sock.sendMessage(from, { text: "⏳ *One-View ඡායාරූපය බෝට් මඟින් සකසමින් පවතී...*" }, { quoted: mek });
                        const targetMek = viewOnceStore[quotedMsgId];
                        
                        // ආරක්ෂිතව මීඩියා ඩවුන්ලෝඩ් කිරීම
                        const buffer = await downloadMediaMessage(targetMek, 'buffer', {}, { logger: pino() });
                        await sock.sendMessage(from, { image: buffer, caption: '🔓 *THUHI MD: One-View Photo Saved Successfully!*' }, { quoted: mek });
                    } else {
                        await sock.sendMessage(from, { text: "❌ කරුණාකර වලංගු One-View ඡායාරූපයකට පමණක් \`.ovp\` ලෙස Reply කරන්න." }, { quoted: mek });
                    }
                }

                // 4. STICKER COMMAND (.s / .sticker) - සම්පූර්ණයෙන්ම ස්ථාවර කරන ලදී
                if (command === 'sticker' || command === 's') {
                    const isQuotedImage = msgType === 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo?.quotedMessage?.imageMessage;
                    const isImage = msgType === 'imageMessage';

                    if (isImage || isQuotedImage) {
                        await sock.sendMessage(from, { text: "⏳ *ස්ටිකරය සාදමින් පවතී...*" }, { quoted: mek });
                        
                        let targetMekForSticker = mek;
                        if (isQuotedImage) {
                            // Quoted මැසේජ් එකක් නම් ඒක වෙනම object එකක් විදියට සැකසීම
                            targetMekForSticker = {
                                message: mek.message.extendedTextMessage.contextInfo.quotedMessage
                            };
                        }

                        // ආරක්ෂිතව Baileys ඩවුන්ලෝඩරය හරහා Image Buffer එක ගැනීම
                        const buffer = await downloadMediaMessage(targetMekForSticker, 'buffer', {}, { logger: pino() });
                        
                        // WhatsApp වෙත කෙලින්ම sticker buffer එක යැවීම (Baileys auto-handles raw image to sticker format conversion)
                        await sock.sendMessage(from, { sticker: buffer }, { quoted: mek });
                    } else {
                        await sock.sendMessage(from, { text: "❌ කරුණාකර ඡායාරූපයකට (Photo) පමණක් \`.s\` හෝ \`.sticker\` ලෙස Reply කරන්න." }, { quoted: mek });
                    }
                }

                // 5. SOCIAL MEDIA DOWNLOADER
                if (command === 'dl' || command === 'download') {
                    const url = args[0];
                    if (!url) return await sock.sendMessage(from, { text: "❌ කරුණාකර වීඩියෝ ලින්ක් එකක් ඇතුළත් කරන්න." }, { quoted: mek });

                    await sock.sendMessage(from, { text: "⏳ *වීඩියෝව සකසමින් පවතී...*" });

                    try {
                        const res = await axios.get(`https://api.dreaded.site/api/download?url=${encodeURIComponent(url)}`);
                        if (res.data && res.data.result) {
                            const videoUrl = res.data.result.download_url || res.data.result.url;
                            await sock.sendMessage(from, { video: { url: videoUrl }, caption: "📥 *Downloaded by THUHI MD*" }, { quoted: mek });
                        } else {
                            await sock.sendMessage(from, { text: "❌ වීඩියෝව ලබා ගැනීමට නොහැකි විය." });
                        }
                    } catch (e) {
                        await sock.sendMessage(from, { text: "❌ ඩවුන්ලෝඩර් සර්වර් දෝෂයකි." });
                    }
                }
            }
        } catch (err) {
            console.log("Error inside upsert: ", err);
        }
    });

    // 🚨 ANTI-DELETE DETECTOR SYSTEM (නැවත සකස් කරන ලද ක්‍රමවේදය)
    sock.ev.on('messages.update', async chatUpdate => {
        for (const { key, update } of chatUpdate) {
            if (update.messageStubType === 68 || update.revoke) {
                const deletedMsgId = key.id;
                const oldMessage = messageStore[deletedMsgId];

                if (oldMessage) {
                    const from = key.remoteJid;
                    const participant = key.participant || key.remoteJid;
                    
                    await sock.sendMessage(from, { text: `🚨 *ANTI-DELETE DETECTED!* \n\n*එවපු කෙනා:* @${participant.split('@')[0]} මැසේජ් එකක් මැකුවා. මකාදැමූ මැසේජ් එක පහතින් දැක්වේ:`, mentions: [participant] });
                    await sock.copyNForward(from, oldMessage, true);
                }
            }
        }
    });
}

// Web API Endpoint
app.get('/code', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: "Number is required" });
    num = num.replace(/[^0-9]/g, ""); 
    try {
        if (!sock) return res.status(500).json({ error: "Server not ready" });
        await delay(2000);
        let code = await sock.requestPairingCode(num.trim());
        return res.json({ code: code });
    } catch (error) {
        return res.status(500).json({ error: "Error getting code" });
    }
});

app.listen(PORT, () => {
    startThuhiMD();
});
