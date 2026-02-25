const axios = require("axios");
const FormData = require("form-data");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
  name: "url",
  category: "Tools",
  description: "Uploader une image/vidéo et donner un lien",

  async execute(sock, m) {
    const from = m.key.remoteJid;

    const qMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!qMsg) {
      return sock.sendMessage(from, { text: "⚠️ Réponds à une image/vidéo avec .url" }, { quoted: m });
    }

    // détecter type
    let type = null;
    let media = null;

    if (qMsg.imageMessage) {
      type = "image";
      media = qMsg.imageMessage;
    } else if (qMsg.videoMessage) {
      type = "video";
      media = qMsg.videoMessage;
    } else if (qMsg.documentMessage) {
      // optionnel: documents
      type = "document";
      media = qMsg.documentMessage;
    }

    if (!type || !media) {
      return sock.sendMessage(from, { text: "❌ Média non supporté. Réponds à une image/vidéo." }, { quoted: m });
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Upload en cours..." }, { quoted: m });

      // download buffer
      const stream = await downloadContentFromMessage(media, type === "image" ? "image" : type === "video" ? "video" : "document");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      // upload catbox
      const form = new FormData();
      form.append("reqtype", "fileupload");
      form.append("fileToUpload", buffer, {
        filename: type === "video" ? "nova.mp4" : type === "image" ? "nova.jpg" : "nova.bin"
      });

      const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders(),
        timeout: 60000
      });

      const url = String(data || "").trim();
      if (!url.startsWith("http")) throw new Error("Upload failed");

      return sock.sendMessage(from, { text: `✅ URL :\n${url}` }, { quoted: m });

    } catch (e) {
      return sock.sendMessage(from, { text: "❌ Erreur upload. Réessaie." }, { quoted: m });
    }
  }
};