const config = require("../config");

// Images random
const TAG_IMAGES = [
  "https://files.catbox.moe/k35kko.jpg",
  "https://files.catbox.moe/zxyyrr.jpg",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / (1000 * 60)) % 60;
  const h = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${d}d ${h}h ${m}m ${s}s`;
}

module.exports = {
  name: "tagall",
  category: "Group",
  description: "Mentionner tous les membres (version NOVA avancée)",

  async execute(sock, m, args, { isGroup, currentMode } = {}) {
    const from = m.key.remoteJid;

    if (!isGroup) {
      return sock.sendMessage(from, {
        text: "❌ Cette commande fonctionne uniquement en groupe."
      }, { quoted: m });
    }

    const meta = await sock.groupMetadata(from);
    const participants = meta.participants || [];
    const jids = participants.map(p => p.id);

    const reason = args.length ? args.join(" ") : "";

    const mode = (currentMode || config.MODE || "public").toUpperCase();
    const uptime = global.botStartTime
      ? formatUptime(Date.now() - global.botStartTime)
      : "N/A";

    const time = new Date().toLocaleTimeString("fr-FR");

    // 🔥 PREVIEW CHAÎNE
    const newsletterContext = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363423249667073@newsletter",
        newsletterName: config.BOT_NAME || "NOVA XMD V1",
        serverMessageId: 1
      }
    };

    const CHUNK = 40;

    for (let i = 0; i < jids.length; i += CHUNK) {
      const part = jids.slice(i, i + CHUNK);
      const tagText = part.map(j => `@${j.split("@")[0]}`).join(" ");

      const caption =
`╭━━〔 ⚛️ ${config.BOT_NAME || "NOVA XMD V1"} ⚛️ 〕━━╮
┃ 📣 TAGALL ACTIVÉ
┣━━━━━━━━━━━━━━━━━━
┃ 👥 Groupe   : ${meta.subject}
┃ 🔢 Membres  : ${participants.length}
┃ 🌐 Mode     : ${mode}
┃ ⚡ Uptime   : ${uptime}
┃ 🕒 Heure    : ${time}
┃ 👨‍💻 Dev      : ${config.OWNER_NAME || "DEV NOVA"}
┃ 🔄 Batch    : ${Math.floor(i / CHUNK) + 1}/${Math.ceil(jids.length / CHUNK)}
╰━━━━━━━━━━━━━━━━━━╯

${tagText}

${reason ? "🗣️ Message : " + reason : ""}`;

      await sock.sendMessage(
        from,
        {
          image: { url: pickRandom(TAG_IMAGES) },
          caption,
          mentions: part,
          contextInfo: newsletterContext
        },
        { quoted: m }
      );
    }
  }
};