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
const cors = require("cors"); // 🖼️ CORS එකතු කරන ලදී
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const menuCmd = require('./menu.js'); // මෙතැනට ගෙන ආවා

const app = express();
app.use(cors()); // CORS සක්‍රිය කිරීම
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
const botLogoUrl = "https://i.ibb.co/Z6gnPvV2/file-000000009be47207afef1535933c3f19.png";
const shrinkmeApi = "81bd69560df8d7ed1f3042d7bed34037908d4998"; 
const targetUrl = "https://youtube.com/@VimukthiThuhina"; 

async function getEarnFooter() {
    let shortUrl = targetUrl; 
    try {
        const shortRes = await axios.get(`https://shrinkme.io/api?api=${shrinkmeApi}&url=${encodeURIComponent(targetUrl)}`);
        if (shortRes.data && shortRes.data.status === "success") shortUrl = shortRes.data.shortenedUrl; 
    } catch (e) { console.log("Shrinkme API error"); }
    return `\n\n💵 *මුදල් උපයන්න මෙම link එකෙන් යන්න:* 👉 ${shortUrl}`;
}

let sock = null;

async function startThuhiMD() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
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
        if (chatUpdate.type !== 'notify') return;
        const mek = chatUpdate.messages[0];
        if (!mek.message) return;

        const from = mek.key.remoteJid;
        const body = mek.message.conversation || mek.message.extendedTextMessage?.text || "";
        const prefix = '.';
        
        if (body.startsWith(prefix)) {
            const command = body.slice(prefix.length).split(/ +/)[0].toLowerCase();
            const earnFooterText = await getEarnFooter();

            if (command === 'menu') {
                await menuCmd.execute(sock, mek, from, botLogoUrl, earnFooterText);
            }
            if (command === 'alive') {
                await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: `*THUHI MD IS ALIVE*` });
            }
        }
    });
}

app.get('/code', async (req, res) => {
    const num = req.query.number;
    if (!num) return res.status(400).json({ error: "Number is required" });
    try {
        if (!sock) return res.status(500).json({ error: "Server not ready" });
        const code = await sock.requestPairingCode(num.replace(/[^0-9]/g, ""));
        res.json({ code: code });
    } catch (e) {
        res.status(500).json({ error: "Error getting code" });
    }
});

app.listen(PORT, () => { startThuhiMD(); });
