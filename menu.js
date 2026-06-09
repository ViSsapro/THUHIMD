module.exports = {
    execute: async (sock, mek, from, botLogoUrl, earnFooterText) => {
        
        const menuText = `*╭────────═✪═────────╮*
  *◄◯ 𝐓𝐇𝐔𝐇𝐈 𝐌𝐃 𝐌𝐄𝐍𝐔  ◯►*
*╰────────═✪═────────╯*

👋 හෙලෝ, මම THUHI MD බෝට්. පහත විධාන භාවිතා කරන්න:

*📥 SOCIAL MEDIA DOWNLOAD*
• \`.dl [link]\` - වීඩියෝ බාගත කිරීම.

*🖼️ STICKER & PHOTO TOOLS*
• \`.s\` හෝ \`.sticker\` - පින්තූරයකට Reply කර ස්ටිකර් සාදන්න.
• \`.pic\` - ස්ටිකරයකට Reply කර පින්තූරයක් සාදන්න.
• \`.vid\` - ස්ටිකරයකට Reply කර වීඩියෝවක් සාදන්න.

*🔓 WHATSAPP TOOLS*
• \`.ovp\` - One-View පින්තූරයක් ලබාගැනීම.
• \`.ovv\` - One-View හඬ පටයක් (Voice) ලබාගැනීම.
• \`.dp\` - Profile පින්තූර ලබාගැනීම.

${earnFooterText}

_Powered by Vimukthi Thuhina_`;

        await sock.sendMessage(from, { 
            image: { url: botLogoUrl }, 
            caption: menuText 
        }, { quoted: mek });
    }
};
