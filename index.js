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
const { Sticker, StickerTypes } = require('wa-sticker-formatter'); // 🖼️ Added for sticker conversion

const app = express(); // Fallback directly to express if 'report' is undefined
const PORT = process.env.PORT || 3000;

// 🖼️ THUHI MD Logo Link
const botLogoUrl = "https://i.ibb.co/Z6gnPvV2/file-000009be47207afef1535933c3f19.png";

// 💰 SHRINKME CONFIGURATION
const shrinkmeApi = "81bd69560df8d7ed1f3042d7bed34037908d4998";
const targetUrl = "https://youtube.com/@VimukthiThuhina";

// 🔗 ලින්ක් එක සහ එය පාවිච්චි කරන පියවරවල් සරලව සිංහලෙන් සකසන කොටස
async function getEarnFooter() {
    let shortUrl = targetUrl;
    try {
        const shortRes = await axios.get(`https://shrinkme.io/api?api=${shrinkmeApi}&url=${encodeURIComponent(targetUrl)}`);
        if (shortRes.data && shortRes.data.status === "success") {
            shortUrl = shortRes.data.shortenedUrl;
        }
    } catch (shortErr) {
        console.log("Shrinkme API error, bypassing...");
    }

    return `\n\n💵 *ඔබත් කැමතිද මුදල් උපයන්න මෙම link එකෙන් යන්න:*
👉 ${shortUrl}

*📌 ලින්ක් එකෙන් ඉදිරියට යන සරල පියවර 3:*
1️⃣ ලින්ක් එකට ගොස් ඉහළින් එන *'CLOSE'* හෝ *'X'* ඔබන්න.
2️⃣ පහළට ගොස් නිල් පාට *'Click here to continue'* ඔබන්න.
3️⃣ තත්පර 5ක් රැඳී සිට *'Get Link'* ඔබන්න.`;
}

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

    // 🔗 CONNECTION UPDATE SYSTEM - PAIRING CODE FIX ADDED
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, pairingCode } = update;

        // Pairing code එක WhatsApp එකට send කරන එක - මේක අලුතෙන් එකතු කලේ
        if (pairingCode) {
            console.log('Pairing Code:', pairingCode);

            // ❗ උඹේ WhatsApp number එක මෙතන දාපන් - 94 වලින් පටන් ගන්න
            const ownerNumber = '94701153310@s.whatsapp.net';

            try {
                await sock.sendMessage(ownerNumber, {
                    text: `🔐 THUHI MD Bot Pairing Code\nCode: ${pairingCode}\n\nWhatsApp → Settings → Linked Devices → Link with phone number → මේ code එක ගහන්න\n⏰ Code එක විනාඩි 2කින් expire වෙනවා`
                });
                console.log('✅ Code එක WhatsApp එකට send කලා:', ownerNumber);
            } catch(e) {
                console.log('Code send error:', e);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut;
            if (shouldReconnect) startThuhiMD();
        } else if (connection === 'open') {
            console.log('=================================================');
            console.log('🎉 THUHI MD IS RUNNING AND READY NOW!');
            console.log('=================================================');

            try {
                const myNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                const welcomeMsg = `✨ *THUHI MD සම්බන්ධ වෙමින් පවතී...*

දැන් ඔබගේ inbox එකෙහි \`.alive\` ලෙස Type කර බෝට් ක්‍රියාකාරීදැයි පරීක්ෂා කරන්න!

_Powered by Vimukthi Thuhina_`;

                await sock.sendMessage(myNumber, { image: { url: botLogoUrl }, caption: welcomeMsg });
            } catch (e) {
                console.log("Error sending welcome message: ", e);
            }
        }
    });

    // මැසේජ් ලැබෙන විට ක්‍රියාත්මක වන පද්ධතිය
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            if (chatUpdate.type!== 'notify') return;
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            const from = mek.key.remoteJid;
            const msgId = mek.key.id;

            messageStore[msgId] = mek;

            const isViewOnce = mek.message.viewOnceMessageV2 || mek.message.viewOnceMessage;
            if (isViewOnce) {
                viewOnceStore[msgId] = mek;
            }

            let msgType = Object.keys(mek.message)[0];
            if (msgType === 'ephemeralMessage') {
                mek.message = mek.message.ephemeralMessage.message;
                msgType = Object.keys(mek.message)[0];
            }

            let body = '';
            if (msgType === 'conversation') body = mek.message.conversation;
            else if (msgType === 'extendedTextMessage') body = mek.message.extendedTextMessage.text;
            else if (msgType === 'imageMessage') body = mek.message.imageMessage.caption;
            else if (msgType === 'videoMessage') body = mek.message.videoMessage.caption;

            const prefix = '.';
            const isCmd = body.startsWith(prefix);
            const command = isCmd? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : undefined;
            const args = body.trim().split(/ +/).slice(1);

            if (isCmd) {
                const earnFooterText = await getEarnFooter();

                // 1. ALIVE COMMAND
                if (command === 'alive') {
                    const aliveMsg = `👋 *THUHI MD IS ALIVE NOW*

*OWNER* - THUHI MD
*VERSION* - 1.0.0
*PREFIX* - [. ]

💬 සියලුම විධානයන් බැලීමට \`.menu\` ලෙස ටයිප් කරන්න!${earnFooterText}`;
                    await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: aliveMsg }, { quoted: mek });
                }

               // මුලින්ම ගොනුව අමතන්න (File එකේ උඩම කොටසේ)
const menuCmd = require('./menu.js');

//... (මැසේජ් ලැබෙන තැන - messages.upsert තුල)

// 2. MENU COMMAND - මෙය පෙර තිබූ කොටස ඉවත් කර දමන්න
if (command === 'menu' || command === 'help' || command === 'dp') {
    const earnFooterText = await getEarnFooter();
    await menuCmd.execute(sock, mek, from, botLogoUrl, earnFooterText);
}

                // 3. ONE-VIEW RECOVERY (.ovp)
                if (command === 'ovp') {
                    const quotedMsgId = mek.message.extendedTextMessage?.contextInfo?.stanzaId;
                    if (quotedMsgId && viewOnceStore[quotedMsgId]) {
                        await sock.sendMessage(from, { text: "⏳ *One-View ඡායාරූපය බෝට් මඟින් සකසමින් පවතී...*" }, { quoted: mek });
                        const targetMek = viewOnceStore[quotedMsgId];

                        const buffer = await downloadMediaMessage(targetMek, 'buffer', {}, { logger: pino() });
                        await sock.sendMessage(from, { image: buffer, caption: `🔓 *THUHI MD: One-View Photo Saved Successfully!*${earnFooterText}` }, { quoted: mek });
                    } else {
                        await sock.sendMessage(from, { text: `❌ කරුණාකර වලංගු One-View ඡායාරූපයකට පමණක් \`.ovp\` ලෙස Reply කරන්න.${earnFooterText}` }, { quoted: mek });
                    }
                }

                // 4. STICKER COMMAND (.s /.sticker) - FIXED SECTION
                if (command === 'sticker' || command === 's') {
                    const isQuotedImage = msgType === 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo?.quotedMessage?.imageMessage;
                    const isImage = msgType === 'imageMessage';

                    if (isImage || isQuotedImage) {
                        await sock.sendMessage(from, { text: "⏳ *ස්ටිකරය සාදමින් පවතී...*" }, { quoted: mek });

                        let targetMekForSticker = mek;
                        if (isQuotedImage) {
                            targetMekForSticker = {
                                message: mek.message.extendedTextMessage.contextInfo.quotedMessage
                            };
                        }

                        // Download the image buffer
                        const buffer = await downloadMediaMessage(targetMekForSticker, 'buffer', {}, { logger: pino() });

                        // Process and build the proper WebP Sticker with Metadata
                        const sticker = new Sticker(buffer, {
                            pack: 'THUHI MD Pack',
                            author: 'Vimukthi Thuhina',
                            type: StickerTypes.FULL,
                            quality: 70
                        });

                        const stickerBuffer = await sticker.toBuffer();

                        // Send the processed sticker webp buffer
                        await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });
                        await sock.sendMessage(from, { text: `🎉 *ඔබේ ස්ටිකරය සාර්ථකව සකසා ඇත!*${earnFooterText}` }, { quoted: mek });
                    } else {
                        await sock.sendMessage(from, { text: `❌ කරුණාකර ඡායාරූපයකට (Photo) පමණක් \`.s\` හෝ \`.sticker\` ලෙස Reply කරන්න.${earnFooterText}` }, { quoted: mek });
                    }
                }

                // 5. SOCIAL MEDIA DOWNLOADER WITH SHRINKME SYSTEM
                if (command === 'dl' || command === 'download') {
                    const url = args[0];
                    if (!url) return await sock.sendMessage(from, { text: "❌ කරුණාකර වීඩියෝ ලින්ක් එකක් ඇතුළත් කරන්න." }, { quoted: mek });

                    await sock.sendMessage(from, { text: "⏳ *වීඩියෝව සකසමින් පවතී...*" });

                    try {
                        const res = await axios.get(`https://api.dreaded.site/api/download?url=${encodeURIComponent(url)}`);
                        if (res.data && res.data.result) {
                            const videoUrl = res.data.result.download_url || res.data.result.url;
                            const captionText = `📥 *Downloaded by THUHI MD*${earnFooterText}`;

                            await sock.sendMessage(from, { video: { url: videoUrl }, caption: captionText }, { quoted: mek });
                        } else {
                            await sock.sendMessage(from, { text: `❌ වීඩියෝව ලබා ගැනීමට නොහැකි විය.${earnFooterText}` });
                        }
                    } catch (e) {
                        await sock.sendMessage(from, { text: `❌ ඩවුන්ලෝඩර් සර්වර් දෝෂයකි.${earnFooterText}` });
                    }
                }
            }
        } catch (err) {
            console.log("Error inside upsert: ", err);
        }
    });

    // 🚨 ANTI-DELETE DETECTOR SYSTEM
    sock.ev.on('messages.update', async chatUpdate => {
        for (const { key, update } of chatUpdate) {
            if (update.messageStubType === 68 || update.revoke) {
                const deletedMsgId = key.id;
                const oldMessage = messageStore[deletedMsgId];

                if (oldMessage) {
                    const from = key.remoteJid;
                    const participant = key.participant || key.remoteJid;
                    const senderNum = participant.split('@')[0];

                    let innerMsg = oldMessage.message;
                    let innerType = Object.keys(innerMsg)[0];
                    if (innerType === 'ephemeralMessage') {
                        innerMsg = innerMsg.ephemeralMessage.message;
                        innerType = Object.keys(innerMsg)[0];
                    }

                    let deletedText = '';
                    if (innerType === 'conversation') deletedText = innerMsg.conversation;
                    else if (innerType === 'extendedTextMessage') deletedText = innerMsg.extendedTextMessage.text;
                    else if (innerType === 'imageMessage') deletedText = innerMsg.imageMessage.caption || '🖼️ (ඡායාරූපයක caption එකක් නොමැත)';
                    else if (innerType === 'videoMessage') deletedText = innerMsg.videoMessage.caption || '📹 (වීඩියෝවක caption එකක් නොමැත)';
                    else if (innerType === 'audioMessage') deletedText = '🎵 (හඬ පටයකි / Audio File)';
                    else if (innerType === 'documentMessage') deletedText = `📄 Document: ${innerMsg.documentMessage.fileName || 'File'}`;
                    else deletedText = '📦 (මීඩියා හෝ වෙනත් මැසේජ් එකකි)';

                    const earnFooterText = await getEarnFooter();
                    const antiDeleteAlert = `*°❤️🛑 ANTI DELETE DETECTED 🛑❤️°*

• *Deleted By:* @${senderNum}
• *Message From:* @${senderNum}

💬 *Message:* ${deletedText}

| © *THUHI MD MINI BOT*${earnFooterText}`;

                    await sock.sendMessage(from, { text: antiDeleteAlert, mentions: [participant] });

                    const hasMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(innerType);
                    if (hasMedia) {
                        try {
                            const buffer = await downloadMediaMessage(oldMessage, 'buffer', {}, { logger: pino() });
                            if (innerType === 'imageMessage') {
                                await sock.sendMessage(from, { image: buffer, caption: '🔺 *මකාදැමූ ඡායාරූපය (Recovered)*' });
                            } else if (innerType === 'videoMessage') {
                                await sock.sendMessage(from, { video: buffer, caption: '🔺 *මකාදැමූ වීඩියෝව (Recovered)*' });
                            } else if (innerType === 'audioMessage') {
                                await sock.sendMessage(from, { audio: buffer, mimetype: innerMsg.audioMessage.mimetype, ptt: innerMsg.audioMessage.ptt });
                            } else if (innerType === 'documentMessage') {
                                await sock.sendMessage(from, { document: buffer, mimetype: innerMsg.documentMessage.mimetype, fileName: innerMsg.documentMessage.fileName });
                            }
                        } catch (mediaErr) {
                            console.log("Media download error on anti-delete:", mediaErr);
                        }
                    }
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
