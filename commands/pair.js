const config = require("../config");

module.exports = {
  name: "pair",
  category: "Owner",
  description: "Générer un code de pairing WhatsApp",

  async execute(sock, m, args, { isOwner } = {}) {
    const from = m.key.remoteJid;

    if (!isOwner) {
      return sock.sendMessage(from, {
        text: "🚫 Commande réservée au propriétaire."
      }, { quoted: m });
    }

    const number = args[0]?.replace(/[^0-9]/g, "");
    if (!number || number.length < 8) {
      return sock.sendMessage(from, {
        text: "⚠️ Utilisation :\n.pair 226XXXXXXXX\n(Sans +)"
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(from, {
        text: "⏳ Génération du code..."
      }, { quoted: m });

      const code = await sock.requestPairingCode(number);

      return sock.sendMessage(from, {
        text:
`╭━━〔 🔐 PAIRING • ${config.BOT_NAME || "NOVA XMD V1"} 〕━━╮
┃ 📱 Numéro : ${number}
┃ 🔑 Code   : ${code}
╰━━━━━━━━━━━━━━━━━━╯`
      }, { quoted: m });

    } catch (e) {
      return sock.sendMessage(from, {
        text: "❌ Impossible de générer le code.\nAssure-toi que la session est prête."
      }, { quoted: m });
    }
  }
};