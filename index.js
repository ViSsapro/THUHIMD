const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    delay 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 🖼️ THUHI MD Logo Link
const botLogoUrl = "https://i.ibb.co/Z6gnPvV2/file-000000009be47207afef1535933c3f19.png";

let sock = null;

// Static files (Web Panel එක පෙන්වීමට)
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
            console.log('සම්බන්ධතාවය බිඳ වැටුණි. නැවත සම්බන්ධ වෙමින්...', shouldReconnect);
            if (shouldReconnect) startThuhiMD();
        } else if (connection === 'open') {
            console.log('=================================================');
            console.log('🎉 THUHI MD සාර්ථකව සම්බන්ධ විය! (CONNECTED)');
            console.log('=================================================');
            
            const welcomeText = `✨ *THUHI MD සම්බන්ධ වෙමින් පවතී...* \n\nදැන් ඔබගේ inbox එකෙහි \`.alive\` ලෙස Type කර බෝට් ක්‍රියාකාරීදැයි පරීක්ෂා කරන්න!`;
            await sock.sendMessage(sock.user.id, { 
                image: { url: botLogoUrl }, 
                caption: welcomeText 
            });
        }
    });

    // 💬 Commands පද්ධතිය
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message)[0];
            const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';
            
            const prefix = '.';
            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : undefined;

            if (isCmd) {
                // 1. ALIVE COMMAND
                if (command === 'alive') {
                    const aliveMsg = `👋 *I AM ALIVE NOW*

*OWNER* - THUHI MD
*VERSION* - 1.0.0
*PREFIX* - [ . ]

💬 *Reply Number:*
*1* 🟩 MAIN MENU
*2* 🟩 CREATE BOT
*3* 🟩 CHECK PING`;
                    await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: aliveMsg }, { quoted: mek });
                }

                // 2. MENU COMMAND
                if (command === 'menu' || body === '1') {
                    const menuMsg = `🏡 *MAIN MENU*

*OWNER* - THUHI MD
*VERSION* - 1.0.0

*Reply Number* ⤵️
1️⃣ OWNER MENU
2️⃣ SOCIAL MENU
3️⃣ AI MENU
4️⃣ GROUP MENU
5️⃣ TOOLS MENU
6️⃣ EDUCATION MENU
7️⃣ CHANNEL MENU`;
                    await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: menuMsg }, { quoted: mek });
                }

                // 3. SOCIAL MENU
                if (command === 'social' || body === '2') {
                    const socialMsg = `☠️ *SOCIAL MENU*
─────────────────
┌  「 *.song* 🎧 」
└  *Download Youtube Audio*
─────────────────
┌  「 *.video* 🎥 」
└  *Download Youtube Video*`;
                    await sock.sendMessage(from, { text: socialMsg }, { quoted: mek });
                }
            }
        } catch (err) {
            console.log(err);
        }
    });
}

// 🌐 Web API Endpoint - HTML එකේ තියෙන `/code` ලින්ක් එකට හරියන්න මෙන්න හැදුවා
app.get('/code', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: "Number is required" });

    // ඉලක්කම් විතරක් ඉතිරි කර 9 ඇතුළු අනෙක් සියලු දේ සුද්ද කිරීම (0-9 දක්වා හැදුවා)
    num = num.replace(/[^0-9]/g, ""); 

    try {
        // බෝට් සකස් වී නැත්නම් initialize කිරීම
        if (!sock) {
            return res.status(500).json({ error: "සර්වර් එක තවමත් සූදානම් නැත. කරුණාකර තත්පර කිහිපයකින් නැවත උත්සාහ කරන්න." });
        }
        
        await delay(2000);
        // Baileys හරහා WhatsApp සර්වර් එකෙන් ලේසියෙන්ම pairing code එක ඉල්ලනවා
        let code = await sock.requestPairingCode(num.trim());
        return res.json({ code: code });
    } catch (error) {
        console.log("Pairing Error:", error);
        return res.status(500).json({ error: "කේතය ලබා ගැනීමට නොහැකි විය." });
    }
});

// Web Server එක Start කිරීම
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
    startThuhiMD();
});
