module.exports = {
    execute: async (sock, mek, from, botLogoUrl, earnFooterText) => {

        const date = new Date().toLocaleDateString('en-GB');
        const time = new Date().toLocaleTimeString('en-GB');

        const menu = `
╭┈୨💕୧┈╮
      𝐓𝐇𝐔𝐇𝐈 𝐌𝐃 𝐌𝐈𝐍𝐈
╰┈୨💕୧┈╯

🌸 Hey Bestie~!

Welcome to your favorite bot menu 🎀

♡ ${date}
♡ ${time}

─────────────

🩷 Reply with number:

1️⃣ ♡ 🛠️ System
2️⃣ ♡ 👥 Group
3️⃣ ♡ 🖼️ Media
4️⃣ ♡ 📥 Download
5️⃣ ♡ 🫧 Anime
6️⃣ ♡ 🌐 Info
7️⃣ ♡ 🎯 Fun
8️⃣ ♡ 🔞 NSFW
9️⃣ ♡ 🎥 Movie

─────────────

🎀 Web:
https://v2-ew6n.onrender.com

─────────────

💌 Made With Love

> 🌸 THUHI-OFC MD MINI BOT
`;

        await sock.sendMessage(from, {
            image: { url: botLogoUrl },
            caption: menu
        }, { quoted: mek });

        const systemMenu = `
╭───❀ 𝓢𝓨𝓢𝓣𝓔𝓜 ❀───╮

❶ ⚡ *.ping* - Check Speed
❷ 🔥 *.alive* - Bot Status
❸ 👑 *.owner* - Owner Contact
❹ 🆔 *.jid* - Your WhatsApp ID

> 🌸 THUHI-OFC MD MINI BOT
`;

        const groupMenu = `
╭───❀ 𝓖𝓡𝓞𝓤𝓟 ❀───╮

❶ ➕ *.add 94xxx* - Add Member
❷ ❌ *.kick @tag* - Kick Member
❸ ⬆️ *.promote @tag* - Make Admin
❹ ⬇️ *.demote @tag* - Remove Admin
❺ 🔓 *.group open* - Open Group
❻ 🔒 *.group close* - Close Group
❼ 📢 *.tagall* - Tag All Members

> 🌸 THUHI-OFC MD MINI BOT
`;

        const mediaMenu = `
╭───❀ 𝓜𝓔𝓓𝓘𝓐 ❀───╮

❶ 🎨 *.sticker* - Image→Sticker
❷ 🔓 *.ovp* - Save View Once
❸ 📷 *.toimg* - Sticker→Image

> 🌸 THUHI-OFC MD MINI BOT
`;

        const downloadMenu = `
╭───❀ 𝓓𝓞𝓦𝓝𝓛𝓞𝓐𝓓 ❀───╮

❶ 📘 *.facebook url*
❷ 🎵 *.tiktok url*
❸ 📸 *.instagram url*
❹ 🎧 *.song name*
❺ 🎬 *.video url*
❻ 🔗 *.csend*
❼ 📦 *.apk*
❽ 📎 *.comicdl*
❾ 🏷️ *.mangadl*

> 🌸 THUHI-OFC MD MINI BOT
`;

        const animeMenu = `
╭───❀ 𝓐𝓝𝓘𝓜𝓔 ❀───╮

❶ 🐱 *.neko*
❷ 🦊 *.waifu*
❸ 🌸 *.anime*
❹ 🎭 *.cosplay*

> 🌸 THUHI-OFC MD MINI BOT
`;

        const infoMenu = `
╭───❀ 𝓘𝓝𝓕𝓞 ❀───╮

❶ ℹ️ *.botinfo*
❷ 📊 *.status*
❸ 🕐 *.runtime*
❹ 🌍 *.ip*

> 🌸 THUHI-OFC MD MINI BOT
`;

        const funMenu = `
╭───❀ 𝓕𝓤𝓝 ❀───╮

❶ 🎲 *.dice*
❷ 🪙 *.coinflip*
❸ 😂 *.joke*
❹ 🎮 *.truth*

> 🌸 THUHI-OFC MD MINI BOT
`;

        const nsfwMenu = `
╭───❀ 𝓝𝓢𝓕𝓦 ❀───╮

🔞 *This Menu is NSFW*
🔞 *Use in Private Only*

❶ 🔞 *.nsfw1*
❷ 🔞 *.nsfw2*

> 🌸 THUHI-OFC MD MINI BOT
`;

        const movieMenu = `
╭───❀ 𝓜𝓞𝓥𝓘𝓔 ❀───╮

❶ 🎬 *.movie name*
❷ ⭐ *.rating name*
❸ 📅 *.upcoming*
❹ 🎭 *.genre*

> 🌸 THUHI-OFC MD MINI BOT
`;

        const replyText = mek.message?.conversation || mek.message?.extendedTextMessage?.text || '';

        if (replyText === '1') return await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: systemMenu }, { quoted: mek });
        if (replyText === '2') return await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: groupMenu }, { quoted: mek });
        if (replyText === '3') return await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: mediaMenu }, { quoted: mek });
        if (replyText === '4') return await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: downloadMenu }, { quoted: mek });
        if (replyText === '5') return await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: animeMenu }, { quoted: mek });
        if (replyText === '6') return await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: infoMenu }, { quoted: mek });
        if (replyText === '7') return await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: funMenu }, { quoted: mek });
        if (replyText === '8') return await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: nsfwMenu }, { quoted: mek });
        if (replyText === '9') return await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: movieMenu }, { quoted: mek });
    }
};
