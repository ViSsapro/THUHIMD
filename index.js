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
const botLogoUrl = "https://i.ibb.co/Z6gnPvV2/file-000000009be47207afef1535933c3f19.png";

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

    // 🔗 CONNECTION UPDATE SYSTEM
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
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
            if (chatUpdate.type !== 'notify') return;
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
            const command = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : undefined;
            const args = body.trim().split(/ +/).slice(1);

            if (isCmd) {
                const earnFooterText = await getEarnFooter();

                // 1. ALIVE COMMAND
                if (command === 'alive') {
                    const aliveMsg = `👋 *THUHI MD IS ALIVE NOW*

*OWNER* - THUHI MD
*VERSION* - 1.0.0
*PREFIX* - [ . ]

💬 සියලුම විධානයන් බැලීමට \`.menu\` ලෙස ටයිප් කරන්න!${earnFooterText}`;
                    await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: aliveMsg }, { quoted: mek });
                }

                module.exports = {
    name: 'menu',
    commands: ['menu', 'help', 'amenu'],
    execute: async (sock, mek, args, from, command, { botLogoUrl, getEarnFooter }) => {
        const footer = await getEarnFooter();
        
        // මෙනුවේ ප්‍රධාන පෙළ (Aesthetic Formatting)
        const menuText = `*╭──────────═✪═──────────╮*
    *◄◯  💎 𝐓𝐇𝐔𝐇𝐈 𝐌𝐃 𝐌𝐄𝐍𝐔  ◯►*
*╰──────────═✪═──────────╯*

👋 *හෙලෝ, මම THUHI MD බෝට් එක.* 
පහත බොත්තම ඔබා ඔබට අවශ්‍ය සියලුම විධාන ලැයිස්තු (Command List) පරීක්ෂා කළ හැක.

*┌───────────────┈⊷*
*│◈ 𝚄𝚜𝚎𝚛:* @${mek.pushName}
*│◈ 𝙿𝚛𝚎𝚏𝚒𝚡:* [ . ]
*│◈ 𝙼𝚘𝚍𝚎:* Public
*└───────────────┈⊷*

${footer}

*Powered by THUHI MD*`;

        // සම්පූර්ණ විධාන ලැයිස්තුව (Full Categories)
        const sections = [
            {
                title: "🏵️ 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎 & 𝐇𝐄𝐋𝐏",
                rows: [
                    { title: '🏵 HELP-LIST', rowId: '.help', description: 'බෝට් එකේ මූලික තොරතුරු සහ උපකාර.' },
                    { title: '🏵 SYSTEM-STATUS', rowId: '.status', description: 'බෝට් එකේ ක්‍රියාකාරීත්වය පරීක්ෂා කරන්න.' }
                ]
            },
            {
                title: "🎬 𝐌𝐄𝐃𝐈𝐀 & 𝐄𝐃𝐈𝐓𝐈𝐍𝐆",
                rows: [
                    { title: '🏵 MP4-ENHANCE', rowId: '.mp4enhance', description: 'වීඩියෝ වල ගුණාත්මකභාවය වැඩි කරන්න.' },
                    { title: '🏵 GIF-MAKER', rowId: '.gif', description: 'වීඩියෝ GIF බවට පත් කරන්න.' },
                    { title: '🏵 STICKER-PACK', rowId: '.sticker', description: 'පින්තූර ස්ටිකර් බවට පත් කරන්න.' }
                ]
            },
            {
                title: "📥 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 𝐂𝐄𝐍𝐓𝐄𝐑",
                rows: [
                    { title: '🏵 YOUTUBE-DL', rowId: '.yt', description: 'Youtube වීඩියෝ සහ සින්දු බාගන්න.' },
                    { title: '🏵 TIKTOK-DL', rowId: '.tiktok', description: 'Tiktok වීඩියෝ ලින්ක් එකෙන් බාගන්න.' },
                    { title: '🏵 FB-DOWNLOAD', rowId: '.fb', description: 'Facebook වීඩියෝ බාගත කරන්න.' }
                ]
            },
            {
                title: "🛡️ 𝐀𝐃𝐌𝐈𝐍 𝐂𝐎𝐍𝐓𝐑𝐎𝐋𝐒",
                rows: [
                    { title: '🏵 GROUP-KICK', rowId: '.kick', description: 'කණ්ඩායමෙන් සාමාජිකයින් ඉවත් කරන්න.' },
                    { title: '🏵 GROUP-PROMOTE', rowId: '.promote', description: 'සාමාජිකයෙකු ඇඩ්මින් කරන්න.' },
                    { title: '🏵 GROUP-SETTINGS', rowId: '.settings', description: 'ගෲප් සෙටින්ග්ස් වෙනස් කරන්න.' }
                ]
            }
        ];

        // පණිවිඩය පින්තූරය සමඟ යැවීම
        await sock.sendMessage(from, {
            image: { url: botLogoUrl }, // ඔබේ Logo එක පින්තූරය ලෙස
            caption: menuText,           // මෙනු විස්තරය Caption එක ලෙස
            footer: '© 2024 VIMUKTHI THUHINA',
            buttonText: 'මෙනුව විවෘත කරන්න',
            sections: sections,
            headerType: 4 // Image header type
        }, { quoted: mek });
    }
};
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
