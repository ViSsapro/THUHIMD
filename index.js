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
const ytdl = require('@dark-yasiya/yt-dl.js'); 

const app = express();
const PORT = process.env.PORT || 3000;

const botLogoUrl = "https://i.ibb.co/Z6gnPvV2/file-000000009be47207afef1535933c3f19.png";
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
    return `\n\n💵 *ඔබත් කැමතිද මුදල් උපයන්න මෙම link එකෙන් යන්න:*\n👉 ${shortUrl}\n\n*📌 ලින්ක් එකෙන් ඉදිරියට යන සරල පියවර 3:*\n1️⃣ ලින්ක් එකට ගොස් ඉහළින් එන *'CLOSE'* හෝ *'X'* ඔබන්න.\n2️⃣ පහළට ගොස් නිල් පාට *'Click here to continue'* ඔබන්න.\n3️⃣ තත්පර 5ක් රැඳී සිට *'Get Link'* ඔබන්න.`;
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
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startThuhiMD();
        } else if (connection === 'open') {
            console.log('🎉 THUHI MD IS RUNNING!');
        }
    });

    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            if (chatUpdate.type !== 'notify') return;
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            const from = mek.key.remoteJid;
            const msgId = mek.key.id;
            messageStore[msgId] = mek;

            const isViewOnce = mek.message.viewOnceMessageV2 || mek.message.viewOnceMessage;
            if (isViewOnce) viewOnceStore[msgId] = isViewOnce.message.imageMessage ? isViewOnce : mek;

            let msgType = Object.keys(mek.message)[0];
            if (msgType === 'ephemeralMessage') {
                mek.message = mek.message.ephemeralMessage.message;
                msgType = Object.keys(mek.message)[0];
            }
            
            let body = (msgType === 'conversation') ? mek.message.conversation : 
                       (msgType === 'extendedTextMessage') ? mek.message.extendedTextMessage.text :
                       (msgType === 'imageMessage') ? mek.message.imageMessage.caption : '';

            const prefix = '.';
            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : undefined;
            const args = body.trim().split(/ +/).slice(1);

            if (isCmd) {
                const earnFooterText = await getEarnFooter();

                if (command === 'alive') {
                    await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: `👋 *THUHI MD IS ALIVE*${earnFooterText}` }, { quoted: mek });
                } else if (command === 'menu') {
                    await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: `✨ *MENU* ✨\n\n• \`.dl [link]\` - බාගත කිරීමට\n• \`.ovp\` - ViewOnce ලබාගැනීමට\n• \`.s\` - ස්ටිකර්${earnFooterText}` }, { quoted: mek });
                } else if (command === 'ovp') {
                    const quotedMsgId = mek.message.extendedTextMessage?.contextInfo?.stanzaId;
                    if (quotedMsgId && viewOnceStore[quotedMsgId]) {
                        const buffer = await downloadMediaMessage(viewOnceStore[quotedMsgId], 'buffer', {}, { logger: pino() });
                        await sock.sendMessage(from, { image: buffer, caption: `🔓 *Recovered!*${earnFooterText}` }, { quoted: mek });
                    }
                } else if (command === 's' || command === 'sticker') {
                    const buffer = await downloadMediaMessage(mek, 'buffer', {}, { logger: pino() });
                    const sticker = new Sticker(buffer, { pack: 'THUHI MD', author: 'Vimukthi', type: StickerTypes.FULL });
                    await sock.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: mek });
                } else if (command === 'dl') {
                    const url = args[0];
                    if (!url) return sock.sendMessage(from, { text: "❌ ලින්ක් එකක් දෙන්න." }, { quoted: mek });
                    await sock.sendMessage(from, { text: "⏳ *වීඩියෝව සකසමින් පවතී...*" }, { quoted: mek });
                    try {
                        const res = await ytdl.dl(url);
                        if (res && res.video) await sock.sendMessage(from, { video: { url: res.video }, caption: `📥 *Done*${earnFooterText}` }, { quoted: mek });
                    } catch (e) { await sock.sendMessage(from, { text: "❌ දෝෂයකි." }, { quoted: mek }); }
                }
            }
        } catch (err) { console.log(err); }
    });

    sock.ev.on('messages.update', async chatUpdate => {
        // Anti-delete code logic here...
    });
}

app.get('/code', async (req, res) => {
    try {
        let code = await sock.requestPairingCode(req.query.number.replace(/[^0-9]/g, ""));
        res.json({ code });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.listen(PORT, () => { startThuhiMD(); });
