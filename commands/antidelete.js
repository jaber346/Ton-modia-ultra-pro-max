const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../data/antidelete.json");

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ enabled: false, mode: "chat" }, null, 2));
  }
}

function readDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch {
    return { enabled: false, mode: "chat" };
  }
}

module.exports = async (sock, chatUpdate) => {
  try {
    const db = readDb();
    if (!db.enabled) return;

    const key = chatUpdate?.key;
    const update = chatUpdate?.update;
    if (!key || !update) return;

    const pm = update.protocolMessage;
    if (!pm || pm.type !== 0) return;

    const deletedId = pm.key?.id;
    if (!deletedId) return;

    const originMsg = global.msgStore?.[deletedId];
    if (!originMsg) {
      // ✅ utile pour debug (sans casser)
      console.log("[ANTIDELETE] Message supprimé introuvable:", deletedId);
      return;
    }

    const from = key.remoteJid;

    // ✅ sender safe
    let sender =
      originMsg.key?.participant ||
      originMsg.participant ||
      originMsg.key?.remoteJid ||
      from;

    sender = String(sender);

    // destination
    const ownerNumber = require("../config").OWNER_NUMBER || "";
    const ownerJid = String(ownerNumber).replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    const destination = db.mode === "inbox" ? ownerJid : from;

    const mentionList = sender.includes("@") ? [sender] : [];

    await sock.sendMessage(
      destination,
      {
        text:
`🚫 *ANTIDELETE DÉTECTÉ* 🚫

👤 De : ${sender.includes("@") ? "@" + sender.split("@")[0] : "Inconnu"}
📍 Lieu : ${from.endsWith("@g.us") ? "Groupe" : "Privé"}`,
        mentions: mentionList
      },
      { quoted: originMsg } // ✅ meilleur que quoted: m (car m est update)
    );

    await sock.copyNForward(destination, originMsg, true);

    delete global.msgStore[deletedId];
  } catch (e) {
    console.log("ANTIDELETE HANDLER ERROR:", e?.message || e);
  }
};