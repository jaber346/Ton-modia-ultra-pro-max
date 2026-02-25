const config = require("../config");

function newsletterCtx() {
  return {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363423249667073@newsletter",
      newsletterName: config.BOT_NAME || "NOVA XMD V1",
      serverMessageId: 1
    }
  };
}

module.exports = {
  name: "id",
  category: "Tools",
  description: "Afficher ID (avec preview chaîne)",

  async execute(sock, m, args, { isGroup } = {}) {
    const from = m.key.remoteJid;
    const sender = m.key.participant || m.sender;

    // CONTEXT
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    const mentioned = ctx?.mentionedJid?.[0];
    const quoted = ctx?.participant;
    const target = mentioned || quoted;

    // ===== GROUPE =====
    if (isGroup) {
      const meta = await sock.groupMetadata(from);

      // Si mention ou reply → ID USER
      if (target) {
        return sock.sendMessage(from, {
          text:
`╭━━〔 🆔 ${config.BOT_NAME || "NOVA XMD V1"} 〕━━╮
┃ 👤 Utilisateur : @${target.split("@")[0]}
┃ 🧾 ID : ${target}
┃ 📍 Groupe : ${meta.subject}
╰━━━━━━━━━━━━━━━━━━╯`,
          mentions: [target],
          contextInfo: newsletterCtx()
        }, { quoted: m });
      }

      // Sinon ID GROUPE
      return sock.sendMessage(from, {
        text:
`╭━━〔 🆔 ${config.BOT_NAME || "NOVA XMD V1"} 〕━━╮
┃ 📛 Groupe : ${meta.subject}
┃ 🧾 Group ID : ${from}
┃ 👥 Membres : ${meta.participants.length}
╰━━━━━━━━━━━━━━━━━━╯`,
        contextInfo: newsletterCtx()
      }, { quoted: m });
    }

    // ===== PRIVÉ =====
    return sock.sendMessage(from, {
      text:
`╭━━〔 🆔 ${config.BOT_NAME || "NOVA XMD V1"} 〕━━╮
┃ 👤 Ton numéro : ${sender.split("@")[0]}
┃ 🧾 Ton ID : ${sender}
╰━━━━━━━━━━━━━━━━━━╯`,
      contextInfo: newsletterCtx()
    }, { quoted: m });
  }
};