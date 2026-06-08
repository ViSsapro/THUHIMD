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

const app = express(); 
const PORT = process.env.PORT || 3000;

// ðŸ–¼ï¸ THUHI MD Logo Link
const botLogoUrl = "https://i.ibb.co/Z6gnPvV2/file-000000009be47207afef1535933c3f19.png";

// ðŸ’° SHRINKME CONFIGURATION
const shrinkmeApi = "81bd69560df8d7ed1f3042d7bed34037908d4998"; 
const targetUrl = "https://youtube.com/@VimukthiThuhina"; 

// ðŸ”— à¶½à·’à¶±à·Šà¶šà·Š à¶‘à¶š à·ƒà·„ à¶‘à¶º à¶´à·à·€à·’à¶ à·Šà¶ à·’ à¶šà¶»à¶± à¶´à·’à¶ºà·€à¶»à·€à¶½à·Š à·ƒà¶»à¶½à·€ à·ƒà·’à¶‚à·„à¶½à·™à¶±à·Š à·ƒà¶šà·ƒà¶± à¶šà·œà¶§à·ƒ
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
    
    return `\n\nðŸ’µ *à¶”à¶¶à¶­à·Š à¶šà·à¶¸à¶­à·’à¶¯ à¶¸à·”à¶¯à¶½à·Š à¶‹à¶´à¶ºà¶±à·Šà¶± à¶¸à·™à¶¸ link à¶‘à¶šà·™à¶±à·Š à¶ºà¶±à·Šà¶±:*
ðŸ‘‰ ${shortUrl}

*ðŸ“Œ à¶½à·’à¶±à·Šà¶šà·Š à¶‘à¶šà·™à¶±à·Š à¶‰à¶¯à·’à¶»à·’à¶ºà¶§ à¶ºà¶± à·ƒà¶»à¶½ à¶´à·’à¶ºà·€à¶» 3:*
1ï¸âƒ£ à¶½à·’à¶±à·Šà¶šà·Š à¶‘à¶šà¶§ à¶œà·œà·ƒà·Š à¶‰à·„à·…à·’à¶±à·Š à¶‘à¶± *'CLOSE'* à·„à· *'X'* à¶”à¶¶à¶±à·Šà¶±.
2ï¸âƒ£ à¶´à·„à·…à¶§ à¶œà·œà·ƒà·Š à¶±à·’à¶½à·Š à¶´à·à¶§ *'Click here to continue'* à¶”à¶¶à¶±à·Šà¶±.
3ï¸âƒ£ à¶­à¶­à·Šà¶´à¶» 5à¶šà·Š à¶»à·à¶³à·“ à·ƒà·’à¶§ *'Get Link'* à¶”à¶¶à¶±à·Šà¶±.`;
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

    // ðŸ”— CONNECTION UPDATE SYSTEM
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startThuhiMD();
        } else if (connection === 'open') {
            console.log('=================================================');
            console.log('ðŸŽ‰ THUHI MD IS RUNNING AND READY NOW!');
            console.log('=================================================');

            try {
                const myNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                const welcomeMsg = `âœ¨ *THUHI MD à·ƒà¶¸à·Šà¶¶à¶±à·Šà¶° à·€à·™à¶¸à·’à¶±à·Š à¶´à·€à¶­à·“...*

à¶¯à·à¶±à·Š à¶”à¶¶à¶œà·š inbox à¶‘à¶šà·™à·„à·’ \`.alive\` à¶½à·™à·ƒ Type à¶šà¶» à¶¶à·à¶§à·Š à¶šà·Šâ€à¶»à·’à¶ºà·à¶šà·à¶»à·“à¶¯à·à¶ºà·’ à¶´à¶»à·“à¶šà·Šà·‚à· à¶šà¶»à¶±à·Šà¶±!

_Powered by Vimukthi Thuhina_`;
                
                await sock.sendMessage(myNumber, { image: { url: botLogoUrl }, caption: welcomeMsg });
            } catch (e) {
                console.log("Error sending welcome message: ", e);
            }
        }
    });

    // à¶¸à·à·ƒà·šà¶¢à·Š à¶½à·à¶¶à·™à¶± à·€à·’à¶§ à¶šà·Šâ€à¶»à·’à¶ºà·à¶­à·Šà¶¸à¶š à·€à¶± à¶´à¶¯à·Šà¶°à¶­à·’à¶º
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            if (chatUpdate.type !== 'notify') return;
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            const from = mek.key.remoteJid;
            const msgId = mek.key.id;
            
            messageStore[msgId] = mek;

            const isViewOnce = mek.message.viewOnceMessageV2 || mek.message.viewOnceMessage || mek.message.viewOnceMessageV2Extension;
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
                    const aliveMsg = `ðŸ‘‹ *THUHI MD IS ALIVE NOW*

*OWNER* - THUHI MD
*VERSION* - 1.0.0
*PREFIX* - [ . ]

ðŸ’¬ à·ƒà·’à¶ºà¶½à·”à¶¸ à·€à·’à¶°à·à¶±à¶ºà¶±à·Š à¶¶à·à¶½à·“à¶¸à¶§ \`.menu\` à¶½à·™à·ƒ à¶§à¶ºà·’à¶´à·Š à¶šà¶»à¶±à·Šà¶±!${earnFooterText}`;
                    await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: aliveMsg }, { quoted: mek });
                }

                // 2. MENU COMMAND
                if (command === 'menu' || command === 'help') {
                    const menuText = `âœ¨ *THUHI MD WHATSAPP BOT MENU* âœ¨

ðŸ‘‹ à·„à·™à¶½à· à¶ºà·à·…à·”à·€à·, à¶¸à¶¸ THUHI MD à¶¶à·„à·”à¶šà·à¶»à·Šà¶º à¶¶à·à¶§à·Š.

*ðŸ“¥ DOWNLOAD COMMANDS:*
â€¢ \`.dl [link]\` - TikTok, FB, Insta, YouTube à·€à·“à¶©à·’à¶ºà· à¶¶à·à¶œà¶±à·Šà¶±.

*ðŸ–¼ï¸ STICKER COMMANDS:*
â€¢ \`.sticker\` / \`.s\` - à¶¡à·à¶ºà·à¶»à·–à¶´à¶ºà¶šà¶§ Reply à¶šà¶» à·ƒà·Šà¶§à·’à¶šà¶»à·Š à·ƒà·à¶¯à¶±à·Šà¶±.

*ðŸ”“ WHATSAPP TOOLS:*
â€¢ \`.ovp\` - One-View à¶¡à·à¶ºà·à¶»à·–à¶´à¶ºà¶šà¶§/à·€à·“à¶©à·’à¶ºà·à·€à¶šà¶§ Reply à¶šà¶» à¶‘à¶º à¶½à¶¶à·à¶œà¶±à·Šà¶±.

---
*ðŸš¨ AUTOMATIC FEATURES:*
â€¢ *Anti-Delete:* à¶šà·€à·”à¶»à·”à·„à¶»à·’ à¶¸à¶šà¶± à¶¸à·à·ƒà·šà¶¢à·Š à¶”à¶§à·à¶¸à·à¶§à·’à¶šà·€ à¶±à·à·€à¶­ à¶½à¶¶à·à¶¯à·š.

_Powered by Vimukthi Thuhina_${earnFooterText}`;
                    await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: menuText }, { quoted: mek });
                }

                // 3. ONE-VIEW RECOVERY (.ovp) - FIXED
                if (command === 'ovp') {
                    const quotedMsg = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;
                    const quotedMsgId = mek.message.extendedTextMessage?.contextInfo?.stanzaId;
                    
                    let targetMek = null;

                    if (quotedMsgId && viewOnceStore[quotedMsgId]) {
                        targetMek = viewOnceStore[quotedMsgId];
                    } else if (quotedMsg?.viewOnceMessageV2 || quotedMsg?.viewOnceMessage || quotedMsg?.viewOnceMessageV2Extension) {
                        targetMek = { key: { remoteJid: from, id: quotedMsgId }, message: quotedMsg };
                    }

                    if (targetMek) {
                        try {
                            await sock.sendMessage(from, { text: "â³ *One-View à¶¸à·à¶°à·Šâ€à¶º à¶¶à·à¶§à·Š à¶¸à¶Ÿà·’à¶±à·Š à·ƒà¶šà·ƒà¶¸à·’à¶±à·Š à¶´à·€à¶­à·“...*" }, { quoted: mek });
                            const buffer = await downloadMediaMessage(targetMek, 'buffer', {}, { logger: pino() });
                            
                            const viewOnceContent = targetMek.message?.viewOnceMessageV2?.message || 
                                                    targetMek.message?.viewOnceMessage?.message || 
                                                    targetMek.message?.viewOnceMessageV2Extension?.message || 
                                                    targetMek.message;
                            
                            const isVideo = viewOnceContent?.videoMessage !== undefined;

                            if (isVideo) {
                                await sock.sendMessage(from, { video: buffer, caption: `ðŸ”“ *THUHI MD: One-View Video Saved Successfully!*${earnFooterText}` }, { quoted: mek });
                            } else {
                                await sock.sendMessage(from, { image: buffer, caption: `ðŸ”“ *THUHI MD: One-View Photo Saved Successfully!*${earnFooterText}` }, { quoted: mek });
                            }
                        } catch (err) {
                            console.log("Error downloading viewOnce message:", err);
                            await sock.sendMessage(from, { text: `âŒ à¶¯à·à·‚à¶ºà¶šà·Š: à¶¸à·à¶°à·Šâ€à¶º à¶¶à·à¶œà¶­ à¶šà·’à¶»à·“à¶¸à¶§ à¶±à·œà·„à·à¶šà·’ à·€à·’à¶º.${earnFooterText}` }, { quoted: mek });
                        }
                    } else {
                        await sock.sendMessage(from, { text: `âŒ à¶šà¶»à·”à¶«à·à¶šà¶» à·€à¶½à¶‚à¶œà·” One-View à¶¡à·à¶ºà·à¶»à·–à¶´à¶ºà¶šà¶§ à·„à· à·€à·“à¶©à·’à¶ºà·à·€à¶šà¶§ à¶´à¶¸à¶«à¶šà·Š \`.ovp\` à¶½à·™à·ƒ Reply à¶šà¶»à¶±à·Šà¶±.${earnFooterText}` }, { quoted: mek });
                    }
                }

                // 4. STICKER COMMAND (.s / .sticker)
                if (command === 'sticker' || command === 's') {
                    const isQuotedImage = msgType === 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo?.quotedMessage?.imageMessage;
                    const isImage = msgType === 'imageMessage';

                    if (isImage || isQuotedImage) {
                        await sock.sendMessage(from, { text: "â³ *à·ƒà·Šà¶§à·’à¶šà¶»à¶º à·ƒà·à¶¯à¶¸à·’à¶±à·Š à¶´à·€à¶­à·“...*" }, { quoted: mek });
                        let targetMekForSticker = mek;
                        if (isQuotedImage) {
                            targetMekForSticker = { message: mek.message.extendedTextMessage.contextInfo.quotedMessage };
                        }

                        try {
                            const buffer = await downloadMediaMessage(targetMekForSticker, 'buffer', {}, { logger: pino() });
                            const sticker = new Sticker(buffer, {
                                pack: 'THUHI MD Pack',       
                                author: 'Vimukthi Thuhina',  
                                type: StickerTypes.FULL,     
                                quality: 70                  
                            });
                            const stickerBuffer = await sticker.toBuffer();

                            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });
                            await sock.sendMessage(from, { text: `ðŸŽ‰ *à¶”à¶¶à·š à·ƒà·Šà¶§à·’à¶šà¶»à¶º à·ƒà·à¶»à·Šà¶®à¶šà·€ à·ƒà¶šà·ƒà· à¶‡à¶­!*${earnFooterText}` }, { quoted: mek });
                        } catch (err) {
                            console.log("Sticker error:", err);
                            await sock.sendMessage(from, { text: `âŒ à·ƒà·Šà¶§à·’à¶šà¶»à¶º à·ƒà·‘à¶¯à·“à¶¸à·šà¶¯à·“ à¶¯à·à·‚à¶ºà¶šà·Š à¶‡à¶­à·’ à·€à·’à¶º.${earnFooterText}` }, { quoted: mek });
                        }
                    } else {
                        await sock.sendMessage(from, { text: `âŒ à¶šà¶»à·”à¶«à·à¶šà¶» à¶¡à·à¶ºà·à¶»à·–à¶´à¶ºà¶šà¶§ (Photo) à¶´à¶¸à¶«à¶šà·Š \`.s\` à·„à· \`.sticker\` à¶½à·™à·ƒ Reply à¶šà¶»à¶±à·Šà¶±.${earnFooterText}` }, { quoted: mek });
                    }
                }

                // 5. SOCIAL MEDIA DOWNLOADER WITH BRAND NEW FAST API (100% FIXED)
                if (command === 'dl' || command === 'download') {
                    const url = args[0];
                    if (!url) return await sock.sendMessage(from, { text: `âŒ à¶šà¶»à·”à¶«à·à¶šà¶» à·€à·“à¶©à·’à¶ºà· à¶½à·’à¶±à·Šà¶šà·Š à¶‘à¶šà¶šà·Š à¶‡à¶­à·”à·…à¶­à·Š à¶šà¶»à¶±à·Šà¶±.${earnFooterText}` }, { quoted: mek });

                    await sock.sendMessage(from, { text: "â³ *à·€à·“à¶©à·’à¶ºà·à·€ à·ƒà¶šà·ƒà¶¸à·’à¶±à·Š à¶´à·€à¶­à·“...*" }, { quoted: mek });

                    try {
                        let videoUrl = null;

                        // API 1: BK9 Site (Very Reliable for All-in-One)
                        try {
                            const res1 = await axios.get(`https://bk9.fun/api/download/alldl?url=${encodeURIComponent(url)}`);
                            if (res1.data && res1.data.status && res1.data.BK9) {
                                videoUrl = res1.data.BK9.url || res1.data.BK9.video || res1.data.BK9; 
                            }
                        } catch (e1) {
                            console.log("BK9 API error, trying next...");
                        }

                        // API 2: Giftedtech (Fallback)
                        if (!videoUrl) {
                            try {
                                const res2 = await axios.get(`https://api.giftedtech.my.id/api/download/allinone?url=${encodeURIComponent(url)}`);
                                if (res2.data && res2.data.result) {
                                    videoUrl = res2.data.result.url || res2.data.result.videoUrl || res2.data.result.mp4 || res2.data.result.hd;
                                }
                            } catch (e2) {
                                console.log("Giftedtech API error");
                            }
                        }

                        // API 3: Simple Axios fetch if it's already a direct link (Optional but useful fallback)
                        if (!videoUrl && url.endsWith('.mp4')) {
                            videoUrl = url;
                        }

                        if (videoUrl && typeof videoUrl === 'string') {
                            const captionText = `ðŸ“¥ *Downloaded by THUHI MD*${earnFooterText}`;
                            await sock.sendMessage(from, { video: { url: videoUrl }, caption: captionText }, { quoted: mek });
                        } else {
                            await sock.sendMessage(from, { text: `âŒ à·€à·“à¶©à·’à¶ºà·à·€ à·ƒà¶»à·Šà·€à¶»à·Š à¶‘à¶šà·™à¶±à·Š à¶½à¶¶à· à¶œà·à¶±à·“à¶¸à¶§ à¶±à·œà·„à·à¶šà·’ à·€à·’à¶º. à¶½à·’à¶±à·Šà¶šà·Š à¶‘à¶š à¶±à·’à·€à·à¶»à¶¯à·’à¶¯à·à¶ºà·’ à¶´à¶»à·“à¶šà·Šà·‚à· à¶šà¶»à¶±à·Šà¶±.${earnFooterText}` }, { quoted: mek });
                        }
                    } catch (e) {
                        console.log("Downloader Error: ", e);
                        await sock.sendMessage(from, { text: `âŒ à¶©à·€à·”à¶±à·Šà¶½à·à¶©à¶»à·Š à·ƒà¶»à·Šà·€à¶»à·Š à¶‘à¶šà·™à·„à·’ à¶¯à·à·‚à¶ºà¶šà·’. à¶šà¶»à·”à¶«à·à¶šà¶» à¶´à·ƒà·”à·€ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±.${earnFooterText}` }, { quoted: mek });
                    }
                }
            }
        } catch (err) {
            console.log("Error inside upsert: ", err);
        }
    });

    // ðŸš¨ ANTI-DELETE DETECTOR SYSTEM
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
                    else if (innerType === 'imageMessage') deletedText = innerMsg.imageMessage.caption || 'ðŸ–¼ï¸ (à¶¡à·à¶ºà·à¶»à·–à¶´à¶ºà¶š caption à¶‘à¶šà¶šà·Š à¶±à·œà¶¸à·à¶­)';
                    else if (innerType === 'videoMessage') deletedText = innerMsg.videoMessage.caption || 'ðŸ“¹ (à·€à·“à¶©à·’à¶ºà·à·€à¶š caption à¶‘à¶šà¶šà·Š à¶±à·œà¶¸à·à¶­)';
                    else if (innerType === 'audioMessage') deletedText = 'ðŸŽµ (à·„à¶¬ à¶´à¶§à¶ºà¶šà·’ / Audio File)';
                    else if (innerType === 'documentMessage') deletedText = `ðŸ“„ Document: ${innerMsg.documentMessage.fileName || 'File'}`;
                    else deletedText = 'ðŸ“¦ (à¶¸à·“à¶©à·’à¶ºà· à·„à· à·€à·™à¶±à¶­à·Š à¶¸à·à·ƒà·šà¶¢à·Š à¶‘à¶šà¶šà·’)';

                    const earnFooterText = await getEarnFooter();
                    const antiDeleteAlert = `*Â°â¤ï¸ðŸ›‘ ANTI DELETE DETECTED ðŸ›‘â¤ï¸Â°*

â€¢ *Deleted By:* @${senderNum}

ðŸ’¬ *Message:* ${deletedText}

| Â© *THUHI MD MINI BOT*${earnFooterText}`;

                    await sock.sendMessage(from, { text: antiDeleteAlert, mentions: [participant] });

                    const hasMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(innerType);
                    if (hasMedia) {
                        try {
                            const buffer = await downloadMediaMessage(oldMessage, 'buffer', {}, { logger: pino() });
                            if (innerType === 'imageMessage') {
                                await sock.sendMessage(from, { image: buffer, caption: 'ðŸ”º *à¶¸à¶šà·à¶¯à·à¶¸à·– à¶¡à·à¶ºà·à¶»à·–à¶´à¶º (Recovered)*' });
                            } else if (innerType === 'videoMessage') {
                                await sock.sendMessage(from, { video: buffer, caption: 'ðŸ”º *à¶¸à¶šà·à¶¯à·à¶¸à·– à·€à·“à¶©à·’à¶ºà·à·€ (Recovered)*' });
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
