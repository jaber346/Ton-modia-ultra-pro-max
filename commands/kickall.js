const config = require("../config");

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// job store global
global.kickallJobs = global.kickallJobs || new Map();

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
  name: "kickall",
  category: "Group",
  description: "Purifier le groupe (kick tous les non-admins) avec stop",

  async execute(sock, m, args, { isGroup, isOwner, prefix } = {}) {
    const from = m.key.remoteJid;
    const sender = m.key.participant || m.sender;

    if (!isGroup) {
      return sock.sendMessage(from, { text: "❌ Cette commande fonctionne uniquement en groupe." }, { quoted: m });
    }

    // Sécurité: owner seulement (tu peux changer en admin si tu veux)
    if (!isOwner) {
      return sock.sendMessage(from, { text: "🚫 Commande réservée au propriétaire." }, { quoted: m });
    }

    // éviter double purge
    if (global.kickallJobs.has(from)) {
      return sock.sendMessage(from, {
        text: `⚠️ Purification déjà en cours.\nEnvoie *${prefix || "."}stop* pour arrêter.`,
        contextInfo: newsletterCtx()
      }, { quoted: m });
    }

    const meta = await sock.groupMetadata(from);
    const participants = meta.participants || [];

    // bot admin ?
    const botId = sock.user.id.includes(":")
      ? sock.user.id.split(":")[0] + "@s.whatsapp.net"
      : sock.user.id;

    const botIsAdmin = participants.find(p => p.id === botId)?.admin;
    if (!botIsAdmin) {
      return sock.sendMessage(from, {
        text: "❌ Je dois être *admin* pour purifier le groupe.",
        contextInfo: newsletterCtx()
      }, { quoted: m });
    }

    // check sender admin (optionnel mais conseillé)
    const senderIsAdmin = participants.find(p => p.id === sender)?.admin;
    if (!senderIsAdmin) {
      return sock.sendMessage(from, {
        text: "🚫 Seuls les *admins* peuvent lancer la purification.",
        contextInfo: newsletterCtx()
      }, { quoted: m });
    }

    // créer job
    const job = { stop: false, startedBy: sender };
    global.kickallJobs.set(from, job);

    // message countdown
    await sock.sendMessage(from, {
      text:
`╭━━〔 🧹 PURIFICATION 〕━━╮
┃ Groupe : ${meta.subject || "Groupe"}
┃ Début dans : 3 secondes…
┃ ✅ Pour arrêter : *${prefix || "."}stop*
╰━━━━━━━━━━━━━━━━━━━━━━╯`,
      contextInfo: newsletterCtx()
    }, { quoted: m });

    // 3 secondes avec possibilité stop
    for (let i = 3; i >= 1; i--) {
      if (job.stop) {
        global.kickallJobs.delete(from);
        return sock.sendMessage(from, {
          text: "🛑 Purification *annulée*.",
          contextInfo: newsletterCtx()
        }, { quoted: m });
      }
      await delay(1000);
    }

    if (job.stop) {
      global.kickallJobs.delete(from);
      return sock.sendMessage(from, {
        text: "🛑 Purification *annulée*.",
        contextInfo: newsletterCtx()
      }, { quoted: m });
    }

    await sock.sendMessage(from, {
      text:
`╭━━〔 🧹 PURIFICATION 〕━━╮
┃ ✅ Début de la purification…
┃ ℹ️ Les admins seront ignorés.
╰━━━━━━━━━━━━━━━━━━━━━━╯`,
      contextInfo: newsletterCtx()
    }, { quoted: m });

    // liste non-admins
    const admins = participants.filter(p => p.admin).map(p => p.id);
    const targets = participants
      .map(p => p.id)
      .filter(jid => !admins.includes(jid) && jid !== botId);

    let removed = 0;

    for (const user of targets) {
      if (job.stop) {
        global.kickallJobs.delete(from);
        return sock.sendMessage(from, {
          text: `🛑 Purification stoppée.\n✅ Membres supprimés : ${removed}/${targets.length}`,
          contextInfo: newsletterCtx()
        }, { quoted: m });
      }

      try {
        await sock.groupParticipantsUpdate(from, [user], "remove");
        removed++;
      } catch (e) {
        // ignore erreurs individuelles (réseau, droits, etc)
      }

      await delay(1100); // anti-rate-limit
    }

    global.kickallJobs.delete(from);

    return sock.sendMessage(from, {
      text:
`✅ *GROUPE PURIFIÉ AVEC SUCCÈS*
👥 Groupe : ${meta.subject || "Groupe"}
🧹 Membres supprimés : ${removed}
🛡️ Admins ignorés : ${admins.length}`,
      contextInfo: newsletterCtx()
    }, { quoted: m });
  }
};