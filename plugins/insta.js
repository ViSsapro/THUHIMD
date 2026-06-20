if (command === 'instagram' || command === 'ig') {
const url = args[0];

if (!url) return await sock.sendMessage(from, {
    text: '❌ IG link එක දාපන්\n\n.ig https://instagram.com/reel/...'
}, { quoted: mek });

await sock.sendMessage(from, {
    text: '⏳ Instagram Video Download කරනවා...'
}, { quoted: mek });

try {
    const res = await axios.get(
        `http://dl.dnuz.top:2168/dl?url=${encodeURIComponent(url)}&api_key=${DNUZ_API_KEY}`
    );

    const dl = res.data.url || res.data.result?.url;

    await sock.sendMessage(from, {
        video: { url: dl },
        caption: '📥 Instagram Download Complete!'
    }, { quoted: mek });

} catch {
    await sock.sendMessage(from, {
        text: '❌ Instagram Download Failed'
    }, { quoted: mek });
}

return;

}