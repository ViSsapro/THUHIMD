const axios = require('axios');

module.exports = {
    name: 'twitter',
    aliases: ['x'],
    execute: async (sock, mek, from, args) => { // මෙහි args පරාමිතිය නිවැරදිව ලබා දී ඇත
        const DNUZ_API_KEY = "08a9f539145a09d4846c8e75c08d5a87ed04e9ad";

        const url = args[0];

        if (!url) return await sock.sendMessage(from, {
            text: '❌ X/Twitter link එක දාපන්'
        }, { quoted: mek });

        await sock.sendMessage(from, {
            text: '⏳ X Video Download කරනවා...'
        }, { quoted: mek });

        try {
            const res = await axios.get(
                `http://dl.dnuz.top:2168/dl?url=${encodeURIComponent(url)}&api_key=${DNUZ_API_KEY}`
            );

            // API එකෙන් එන ප්‍රතිචාරය මත මෙය රඳා පවතී
            const dl = res.data.url || res.data.result?.url;

            if (!dl) throw new Error("Video link not found");

            await sock.sendMessage(from, {
                video: { url: dl },
                caption: '🐦 X Download Complete!'
            }, { quoted: mek });

        } catch (error) {
            console.error("X DL Error:", error);
            await sock.sendMessage(from, {
                text: '❌ X Download Failed'
            }, { quoted: mek });
        }
    } 
};
