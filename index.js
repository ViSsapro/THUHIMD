const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, delay, downloadMediaMessage } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const fs = require('fs');
const path = require('path');
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// ප්ලගින් පද්ධතිය
const plugins = {};
const pluginPath = path.join(__dirname, 'plugins');
if (!fs.existsSync(pluginPath)) fs.mkdirSync(pluginPath);
const pluginFiles = fs.readdirSync(pluginPath).filter(file => file.endsWith('.js'));
for (const file of pluginFiles) {
    const plugin = require(`./plugins/${file}`);
    plugins[plugin.name] = plugin;
}

const botLogoUrl = "https://i.ibb.co/Z6gnPvV2/file-000000009be47207afef1535933c3f19.png";
const shrinkmeApi = "81bd69560df8d7ed1f3042d7bed34037908d4998";
const targetUrl = "https://youtube.com/@VimukthiThuhina";

async function getEarnFooter() {
    let shortUrl = targetUrl;
    try {
        const shortRes = await axios.get(`https://shrinkme.io/api?api=${shrinkmeApi}&url=${encodeURIComponent(targetUrl)}`);
        if (shortRes.data && shortRes.data.status === "success") shortUrl = shortRes.data.shortenedUrl;
    } catch (e) { console.log("Shrinkme API error"); }
    return `\n\n💵 *මුදල් උපයන්න මෙතැනින්:* 👉 ${shortUrl}`;
}

let sock = null;
const messageStore = {}; // Anti-delete සඳහා
const viewOnceStore = {}; // OVP සඳහා

async function startThuhiMD() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), printQRInTerminal: false });
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startThuhiMD();
        } else if (connection === 'open') {
            console.log('🎉 THUHI MD IS RUNNING!');
        }
    });

    // 1. මැසේජ් ගබඩා කිරීම සහ Command ක්‍රියාත්මක කිරීම
    sock.ev.on('messages.upsert', async chatUpdate => {
        if (chatUpdate.type !== 'notify') return;
        const mek = chatUpdate.messages[0];
        if (!mek.message) return;
        
        const from = mek.key.remoteJid;
        const msgId = mek.key.id;
        messageStore[msgId] = mek; // ගබඩා කිරීම

        if (mek.message.viewOnceMessageV2 || mek.message.viewOnceMessage) viewOnceStore[msgId] = mek;

        let msgType = Object.keys(mek.message)[0];
        let body = (msgType === 'conversation') ? mek.message.conversation : 
                   (msgType === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';

        const prefix = '.';
        const command = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : undefined;
        const args = body.trim().split(/ +/).slice(1);

        if (command) {
            for (const p in plugins) {
                if (plugins[p].commands && plugins[p].commands.includes(command)) {
                    await plugins[p].execute(sock, mek, args, from, command, { downloadMediaMessage, pino, getEarnFooter, botLogoUrl, messageStore, viewOnceStore });
                    break;
                }
            }
        }
    });

    // 2. Anti-Delete පද්ධතිය
    sock.ev.on('messages.update', async chatUpdate => {
        for (const { key, update } of chatUpdate) {
            if (update.messageStubType === 68 || update.revoke) {
                const oldMessage = messageStore[key.id];
                if (oldMessage) {
                    const from = key.remoteJid;
                    const footer = await getEarnFooter();
                    await sock.sendMessage(from, { text: `🛑 *මකාදැමූ මැසේජ් එකක් හමු විය!* \n\n_Powered by THUHI MD_${footer}` });
                    await sock.sendMessage(from, { forward: oldMessage });
                }
            }
        }
    });
}

app.listen(PORT, () => { startThuhiMD(); });
