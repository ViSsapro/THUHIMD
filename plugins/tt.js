const axios = require('axios');

module.exports = {
    name: 'tiktok',
    aliases: ['tiktok', 'tt'],
    execute: async (sock, mek, from, args) => {
        const DNUZ_API_KEY = "08a9f539145a09d4846c8e75c08d5a87ed04e9ad";
        const url = args[0];

        if (!url) return await sock.sendMessage(from, {
            text: '❌ TikTok link එක දාපන්'
        }, { quoted: mek });

        await sock.sendMessage(from, {
            text: '⏳ TikTok Download කරනවා...'
        }, { quoted: mek });

        try {
            const res = await axios.get(
                `http://dl.dnuz.top:2168/dl?url=${encodeURIComponent(url)}&api_key=${DNUZ_API_KEY}`
            );

            const dl = res.data.url || res.data.result?.url;

            await sock.sendMessage(from, {
                video: { url: dl },
                caption: '🎵 TikTok Download Complete!'
            }, { quoted: mek });

        } catch (e) {
            await sock.sendMessage(from, {
                text: '❌ TikTok Download Failed'
            }, { quoted: mek });
        }
    }
};
