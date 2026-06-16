module.exports = {
    execute: async (sock, mek, from, botLogoUrl, earnFooterText) => {
        const pushname = mek.pushName || 'User';
        const date = new Date().toLocaleDateString('en-GB');
        const time = new Date().toLocaleTimeString('en-GB');

        const menu = `

╭─────♡◉◉◉♡─────⌬
💖 *Hello User...!* 🌸  
🌷 *Welcome to 𝐓𝐇𝐔𝐇𝐈 𝐌𝙳 𝐌𝙸𝙽𝙸 Menu* ✨  
╰─────♡◉◉◉♡─────⌬

┆ ➤ 🌸
┆   ➤ 💫
┆     ➤ 🌷

📅 *Date:* 16/06/2026 📆  
⌚ *Time:* 19:10:15 ⏳  

─────────────── 💗

✨ *Select a category:* ✨  

❶ 🛠️ System  
❷ 👥 Group  
❸ 🖼️ Media  
❹ 📥 Download  
❺ 🫧 Anime  
❻ 🌐 Info  
❼ 🎯 Fun  
❽ 🔞 NSFW 
❾ 🎥 Movie

─────────────── 🌸

🌐 *THUHI-MD Mini Bot Web* 💕  
> https://v2-ew6n.onrender.com/

┆ ✦ 🌷
┆   ➤ 💖
┆     ➤ 🌸

> © ᴛʜᴜʜɪ-ᴏꜰᴄ 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃

`;

        await sock.sendMessage(from, { image: { url: botLogoUrl }, caption: menu }, { quoted: mek });
    }
};
