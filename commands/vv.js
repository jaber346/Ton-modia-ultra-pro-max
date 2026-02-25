const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
  name: "vv",
  category: "Tools",
  description: "Voir une image/vidéo view-once",

  async execute(sock, m, args, { isGroup } = {}) {
    const from = m.key.remoteJid;

    // Doit répondre à un message
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return sock.sendMessage(from, {
        text: "⚠️ Réponds à une image/vidéo view-once avec .vv"
      }, { quoted: m });
    }

    try {
      let viewOnceMsg;

      // Cas image view once
      if (quoted.viewOnceMessage?.message?.imageMessage) {
        viewOnceMsg = quoted.viewOnceMessage.message.imageMessage;

        const stream = await downloadContentFromMessage(viewOnceMsg, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }

        await sock.sendMessage(from, {
          image: buffer,
          caption: "👁️ View Once récupérée"
        }, { quoted: m });

      }

      // Cas vidéo view once
      else if (quoted.viewOnceMessage?.message?.videoMessage) {
        viewOnceMsg = quoted.viewOnceMessage.message.videoMessage;

        const stream = await downloadContentFromMessage(viewOnceMsg, "video");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }

        await sock.sendMessage(from, {
          video: buffer,
          caption: "👁️ View Once récupérée"
        }, { quoted: m });

      }

      else {
        return sock.sendMessage(from, {
          text: "❌ Ce message n’est pas un view-once valide."
        }, { quoted: m });
      }

    } catch (e) {
      return sock.sendMessage(from, {
        text: "❌ Impossible de récupérer le view-once."
      }, { quoted: m });
    }
  }
};