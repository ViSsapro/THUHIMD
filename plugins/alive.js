module.exports = {
    name: 'alive',
    aliases: ['alive'],
    execute: async (sock, mek, from, args) => {
        // ඔබේ බොට් ලෝගෝ එකේ URL එක මෙතැනට ඇතුලත් කරන්න
        const botLogoUrl = "https://i.ibb.co/Z6gnPvV2/file-000009be47207afef1535933c3f19.png"; 
        
        const aliveMsg = `👋 *Thuhi MD IS ALIVE NOW*

*OWNER* - Vimukthi Thuhina
*VERSION* - 1.0.0
*STATUS* - Online ✅

💬 සියලුම විධානයන් බැලීමට .menu ලෙස ටයිප් කරන්න!`;

        await sock.sendMessage(from, { 
            image: { url: botLogoUrl }, 
            caption: aliveMsg 
        }, { quoted: mek });
    }
};
