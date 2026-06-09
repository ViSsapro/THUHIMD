const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, delay, downloadMediaMessage } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// ලින්ක් සහ අනෙකුත් දත්ත
const botLogoUrl = "https://i.ibb.co/Z6gnPvV2/file-000000009be47207afef1535933c3f19.png";
const shrinkmeApi = "81bd69560df8d7ed1f3042d7bed34037908d4998"; 
const targetUrl = "https://youtube.com/@VimukthiThuhina"; 

async function getEarnFooter() {
    let shortUrl = targetUrl; 
    try {
        const shortRes = await axios.get(`https://shrinkme.io/api?api=${shrinkmeApi}&url=${encodeURIComponent(targetUrl)}`);
        if (shortRes.data && shortRes.data.status === "success") shortUrl = shortRes.data.shortenedUrl; 
    } catch (e) { console.log("Shrinkme API error"); }
    return `\n\n💵 *මුදල් උපයන්න ලින්ක් එක:* ${shortUrl}\n\n📌 *පියවර 3:* 1️⃣ Close/X ඔබන්න 2️⃣ 'Click here to continue' ඔබන්න 3️⃣ තත්පර 5ක් ඉඳලා 'Get Link' ඔබන්න.`;
}

const menuCmd = require('./menu.js');
const mediaCmd = require('./media.js');

let sock = null;
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

async function startThuhiMD() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }), printQRInTerminal: true });
    
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => { if (update.connection === 'close') startThuhiMD(); });

    sock.ev.on('messages.upsert', async chatUpdate => {
        if (chatUpdate.type !== 'notify') return;
        const mek = chatUpdate.messages[0];
        if (!mek.message) return;
        const from = mek.key.remoteJid;
        
        const body = mek.message.conversation || mek.message.extendedTextMessage?.text || "";
        const isCmd = body.startsWith('.');
        const command = isCmd ? body.slice(1).trim().split(/ +/).shift().toLowerCase() : undefined;
        const args = body.trim().split(/ +/).slice(1);

        if (!isCmd) return;
        const footer = await getEarnFooter();

        // විධාන පාලනය
        if (command === 'menu' || command === 'help') {
            await menuCmd.execute(sock, mek, from, botLogoUrl, footer);
        } 
        // ඩවුන්ලෝඩ් එකේදී මෙනුවෙන් එන '.dl-final' සඳහා
        else if (command === 'dl-final') {
            await mediaCmd.downloadFinal(sock, mek, from, args[0]);
        }
        // අනෙකුත් සියලුම කමාන්ඩ්ස් සඳහා
        else if (['dl', 's', 'sticker', 'pic', 'vid', 'ovp', 'ovv', 'dp'].includes(command)) {
            await mediaCmd.execute(sock, mek, from, command, args, botLogoUrl, footer);
        }
    });
}

app.listen(PORT, () => startThuhiMD());
