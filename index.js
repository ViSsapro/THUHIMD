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
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

// menu.js file එක උඩම import කරගන්නවා - මේක අනිවාර්යයි
const menuCmd = require('./menu.js');

const app = express();
const PORT = process.env.PORT || 3000;

// 🖼️ THUHI MD Logo Link
const botLogoUrl = "https://i.ibb.co/Z6gnPvV2/file-000009be47207afef1535933c3f19.png";

// 💰 SHRINKME CONFIGURATION
const shrinkmeApi = "81bd69560df8d7ed1f3042d7bed34037908d4998";
const targetUrl = "https://youtube.com/@VimukthiThuhina";

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

            // Menu reply system - 1 ඉඳන් 9 වෙනකන් number reply handle කරනවා
            if (!isCmd && ['1','2','3','4','5','6','7','8','9'].includes(body)) {
                const earnFooterText = await getEarnFooter();
                await menuCmd.execute(sock, mek, from, botLogoUrl, earnFooterText);
                return; // මේක අනිවාර්යයි
            }

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

                // 2. MENU COMMAND
                if (command === 'menu' || command === 'help' || command === 'dp') {
                    await menuCmd.execute(sock, mek, from, botLogoUrl, earnFooterText);
                }

                // 3. ONE-VIEW RECOVERY
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

                // 4. STICKER COMMAND
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

                        const buffer = await downloadMediaMessage(targetMekForSticker, 'buffer', {}, { logger: pino() });

                        const sticker = new Sticker(buffer, {
                            pack: 'THUHI MD Pack',
                            author: 'Vimukthi Thuhina',
                            type: StickerTypes.FULL,
                            quality: 70
                        });

                        const stickerBuffer = await sticker.toBuffer();
                        await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });
                        await sock.sendMessage(from, { text: `🎉 *ඔබේ ස්ටිකරය සාර්ථකව සකසා ඇත!*${earnFooterText}` }, { quoted: mek });
                    } else {
                        await sock.sendMessage(from, { text: `❌ කරුණාකර ඡායාරූපයකට (Photo) පමණක් \`.s\` හෝ \`.sticker\` ලෙස Reply කරන්න.${earnFooterText}` }, { quoted: mek });
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
                            const captionText = `📥 *Downloaded by THUHI MD*${earnFooterText}`;
                            await sock.sendMessage(from, { video: { url: videoUrl }, caption: captionText }, { quoted: mek });
                        } else {
                            await sock.sendMessage(from, { text: `❌ වීඩියෝව ලබා ගැනීමට නොහැකි විය.${earnFooterText}` });
                        }
                    } catch (e) {
                        await sock.sendMessage(from, { text: `❌ ඩවුන්ලෝඩර් සර්වර් දෝෂයකි.${earnFooterText}` });
                    }
                }

                // 6. GROUP COMMANDS
                if (command === 'tagall') {
                    if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group එකේ විතරක් වැඩ' }, { quoted: mek });
                    const metadata = await sock.groupMetadata(from);
                    let members = metadata.participants.map(p => `@${p.id.split('@')[0]}`).join('\n');
                    await sock.sendMessage(from, { text: `📢 *THUHI MD Tag All*\n\n${members}${earnFooterText}`, mentions: metadata.participants.map(p => p.id) }, { quoted: mek });
                }

                if (command === 'kick') {
                    if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group එකේ විතරක් වැඩ' }, { quoted: mek });
                    const mentioned = mek.message.extendedTextMessage?.contextInfo?.mentionedJid;
                    if (!mentioned) return await sock.sendMessage(from, { text: '❌ Member කෙනෙක් tag කරන්න' }, { quoted: mek });
                    await sock.groupParticipantsUpdate(from, mentioned, 'remove');
                    await sock.sendMessage(from, { text: '✅ Kick කරන ලදී' }, { quoted: mek });
                }

                if (command === 'promote') {
                    if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group එකේ විතරක් වැඩ' }, { quoted: mek });
                    const mentioned = mek.message.extendedTextMessage?.contextInfo?.mentionedJid;
                    if (!mentioned) return await sock.sendMessage(from, { text: '❌ Member කෙනෙක් tag කරන්න' }, { quoted: mek });
                    await sock.groupParticipantsUpdate(from, mentioned, 'promote');
                    await sock.sendMessage(from, { text: '✅ Promote කරන ලදී' }, { quoted: mek });
                }

                if (command === 'demote') {
                    if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group එකේ විතරක් වැඩ' }, { quoted: mek });
                    const mentioned = mek.message.extendedTextMessage?.contextInfo?.mentionedJid;
                    if (!mentioned) return await sock.sendMessage(from, { text: '❌ Member කෙනෙක් tag කරන්න' }, { quoted: mek });
                    await sock.groupParticipantsUpdate(from, mentioned, 'demote');
                    await sock.sendMessage(from, { text: '✅ Demote කරන ලදී' }, { quoted: mek });
                }

                if (command === 'group' && args[0] === 'open') {
                    if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group එකේ විතරක් වැඩ' }, { quoted: mek });
                    await sock.groupSettingUpdate(from, 'not_announcement');
                    await sock.sendMessage(from, { text: '🔓 Group එක open කරන ලදී' }, { quoted: mek });
                }

                if (command === 'group' && args[0] === 'close') {
                    if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group එකේ විතරක් වැඩ' }, { quoted: mek });
                    await sock.groupSettingUpdate(from, 'announcement');
                    await sock.sendMessage(from, { text: '🔒 Group එක close කරන ලදී' }, { quoted: mek });
                }
            }
        } catch (err) {
            console.log("Error inside upsert: ", err);
        }
    });

    // ANTI-DELETE
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
                    else if (innerType === 'imageMessage') deletedText = innerMsg.imageMessage.caption || '🖼️ (caption නැත)';
                    else if (innerType === 'videoMessage') deletedText = innerMsg.videoMessage.caption || '📹 (caption නැත)';
                    else deletedText = '📦 Media';

                    const earnFooterText = await getEarnFooter();
                    const antiDeleteAlert = `*°❤️🛑 ANTI DELETE DETECTED 🛑❤️°*\n\n• *Deleted By:* @${senderNum}\n💬 *Message:* ${deletedText}\n\n| © *THUHI MD MINI BOT*${earnFooterText}`;

                    await sock.sendMessage(from, { text: antiDeleteAlert, mentions: [participant] });

                    const hasMedia = ['imageMessage', 'videoMessage'].includes(innerType);
                    if (hasMedia) {
                        try {
                            const buffer = await downloadMediaMessage(oldMessage, 'buffer', {}, { logger: pino() });
                            if (innerType === 'imageMessage') {
                                await sock.sendMessage(from, { image: buffer, caption: '🔺 *මකාදැමූ ඡායාරූපය*' });
                            } else if (innerType === 'videoMessage') {
                                await sock.sendMessage(from, { video: buffer, caption: '🔺 *මකාදැමූ වීඩියෝව*' });
                            }
                        } catch (mediaErr) {}
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
