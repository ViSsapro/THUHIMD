module.exports = {
    name: 'menu',
    commands: ['menu', 'help', 'amenu'],
    execute: async (sock, mek, args, from, command, { botLogoUrl, getEarnFooter }) => {
        const footer = await getEarnFooter();
        
        const menuText = `*╭────────═✪═────────╮*
   *◄◯ THUHI MD MENU ◯►*
*╰────────═✪═────────╯*

👋 හෙලෝ, මම THUHI MD බෝට් එක. 
පහත බොත්තම ඔබා විධාන ලැයිස්තුව බලන්න.${footer}`;

        const sections = [{
            title: "💎 𝐓𝐇𝐔𝐇𝐈 𝐌𝐃 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐏𝐀𝐍𝐄𝐋",
            rows: [
                { title: '🏵 HELP-LIST', rowId: '.help', description: 'බෝට් එකේ මූලික විස්තර සහ උපකාර.' },
                { title: '🏵 MEDIA-LIST', rowId: '.media', description: 'වීඩියෝ සහ හඬ පට සැකසුම්.' },
                { title: '🏵 DOWNLOAD-LIST', rowId: '.dl', description: 'වීඩියෝ සහ ගීත බාගත කිරීම.' },
                { title: '🏵 ADMIN-LIST', rowId: '.admin', description: 'කණ්ඩායම් පාලන විධාන.' }
            ]
        }];

        // නිවැරදි List Message ව්‍යුහය
        await sock.sendMessage(from, {
            text: menuText,
            buttonText: 'මෙනුව බලන්න',
            sections: sections,
            listType: 1
        }, { quoted: mek });
    }
};
