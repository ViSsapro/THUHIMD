// menu.js
module.exports = {
    execute: async (sock, mek, from, botLogoUrl, earnFooterText) => {
        
        // 1. මුලින්ම Logo පින්තූරය යවනවා
        await sock.sendMessage(from, { 
            image: { url: botLogoUrl }, 
            caption: `*╭────────═✪═────────╮*\n  *◄◯ 𝐓𝐇𝐔𝐇𝐈 𝐌𝐃 𝐌𝐄𝐍𝐔 ◯►*\n*╰────────═✪═────────╯*\n\n👋 හෙලෝ, පහත බොත්තම ඔබා ඔබට අවශ්‍ය විධාන ලැයිස්තුව තෝරාගන්න.${earnFooterText}`
        }, { quoted: mek });

        // 2. පසුව මෙනු ලැයිස්තුව (List Message) යවනවා
        const sections = [{
            title: "🏵 𝐓𝐡𝐮𝐡𝐢 𝐌𝐝 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗣𝗮𝗻𝗲𝗹",
            rows: [
                { title: '🏵 HELP-LIST', rowId: '.help', description: 'බෝට් එකේ මූලික විස්තර.' },
                { title: '🏵 DOWNLOAD-LIST', rowId: '.dl', description: 'Youtube, FB, Insta බාගත කිරීම්.' },
                { title: '🏵 STICKER-LIST', rowId: '.sticker', description: 'ඡායාරූප ස්ටිකර් කිරීම.' },
                { title: '🏵 WHATSAPP TOOLS', rowId: '.ovp', description: 'One-View ඡායාරූප ලබාගැනීම.' }
            ]
        }];

        await sock.sendMessage(from, {
            text: "👆 *පහත '𝗠𝗘𝗡𝗨 𝗟𝗜𝗦𝗧' බොත්තම ඔබන්න*",
            footer: '© 2026 THUHI MD',
            buttonText: '𝗠𝗘𝗡𝗨 𝗟𝗜𝗦𝗧',
            sections: sections,
            listType: 1
        }, { quoted: mek });
    }
};
