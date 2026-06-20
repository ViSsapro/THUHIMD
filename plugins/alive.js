module.exports = {
    name: 'alive',
    aliases: ['alive'],
    execute: async (sock, mek, from, args) => {
        // ඔබේ බොට් ලෝගෝ එකේ URL එක මෙතැනට ඇතුලත් කරන්න
        const botLogoUrl = "https://i.ibb.co/FkvLpDYZ/1781795691025.png"; 
        
        const aliveMsg = `👋 *Dark Matter XMD IS ALIVE NOW*

*OWNER* - Vimukthi Thuhina × White Dragon
*VERSION* - 1.0.0
*STATUS* - Online ✅

💬 සියලුම විධානයන් බැලීමට .menu ලෙස ටයිප් කරන්න!`;

        await sock.sendMessage(from, { 
            image: { url: botLogoUrl }, 
            caption: aliveMsg 
        }, { quoted: mek });
    }
};
