// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");
const { Expo } = require("expo-server-sdk");

initializeApp();
const expo = new Expo();

// Küçük yardımcılar
const TOK_RE = /^(Expo(nent)?PushToken)\[.+\]$/; // ExpoPushToken[...] veya ExponentPushToken[...]

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 1));
  return d;
}

// ---- ANA İŞ ----
// 1) due (nextWateringAt <= now) bitkileri çek
// 2) user bazında grupla (tek bildirim)
// 3) Expo push gönder (token hatalarını reçetelerden temizle)
// 4) Her due bitki için lastNotifiedAt ve nextWateringAt güncelle
async function processDueWaterings() {
  const db = getFirestore();
  const now = new Date();
  const nowTs = Timestamp.fromDate(now);

  console.log("[process] start", { now: now.toISOString() });

  // Index: plants (collection group) + nextWateringAt ASC
  const snap = await db
    .collectionGroup("plants")
    .where("nextWateringAt", "<=", nowTs)
    .orderBy("nextWateringAt", "asc")
    .limit(3000)
    .get();

  console.log("[process] dueCount:", snap.size);
  if (snap.empty) return { dueCount: 0, toSend: 0, updatedDocs: 0 };

  // userId -> { userRef, tokens[], plants[] }
  const groups = new Map();

  for (const docSnap of snap.docs) {
    const plant = docSnap.data();
    const plantRef = docSnap.ref;
    const userRef = plantRef.parent.parent;
    if (!userRef) continue;

    // Aynı gün tekrar bildirim atma
    if (plant.lastNotifiedAt) {
      const last = plant.lastNotifiedAt.toDate();
      if (last.toDateString() === now.toDateString()) continue;
    }

    const uid = userRef.id;
    let g = groups.get(uid);
    if (!g) {
      const userDoc = await userRef.get();
      const u = userDoc.data() || {};
      // Token’ları oku (dizi + tekil alan)
      let rawTokens = Array.isArray(u.expoPushTokens) ? u.expoPushTokens : [];
      if (!rawTokens.length && typeof u.expoPushToken === "string") {
        rawTokens = [u.expoPushToken];
      }
      // Kabul edilen formatlar
      const tokens = rawTokens
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter((t) => TOK_RE.test(t));

      g = { userRef, tokens, plants: [] };
      groups.set(uid, g);
    }

    // Bu kullanıcı için due bitkiler listesine ekle
    g.plants.push({
      ref: plantRef,
      name: plant.name || "Bitki",
      wateringInterval: Number(plant.wateringInterval || 1),
      nextWateringAt: plant.nextWateringAt,
      lastWatered: plant.lastWatered,
    });
  }

  // Tek bildirim üretme: kullanıcı başına 1 push
  const messages = [];
  const tokenOwners = []; // receipts için token->user eşlemesi
  let plantsToUpdate = []; // push denemesi yapılan tüm bitkiler

  for (const [, g] of groups) {
    if (!g.tokens.length || g.plants.length === 0) continue;

    const count = g.plants.length;
    // Metin: 1 ise isimli, birden çok ise sayılı + kısa isim listesi
    const topNames = g.plants.slice(0, 3).map((p) => p.name);
    const rest = count - topNames.length;

    const title = "🌿 Sulama Zamanı";
    const body =
      count === 1
        ? `${topNames[0]} için sulama vakti!`
        : `${count} bitki için sulama zamanı: ${topNames.join(", ")}${
            rest > 0 ? ` ve ${rest} daha` : ""
          }`;

    // Data: küçük tut (ilk 10 plantId)
    const data = {
      kind: "WATER_DUE",
      userId: g.userRef.id,
      plantIds: g.plants.slice(0, 10).map((p) => p.ref.id),
      count,
    };

    for (const to of g.tokens) {
      messages.push({ to, sound: "default", title, body, data });
      tokenOwners.push({ to, userRef: g.userRef });
    }

    // Bu kullanıcıdaki due bitkileri (push denemesi yapılanlar) güncelleme listesine al
    plantsToUpdate.push(...g.plants);
  }

  console.log("[process] users:", groups.size, "toSend:", messages.length);

  // Expo push gönderimi (tickets)
  const tickets = [];
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const tk = await expo.sendPushNotificationsAsync(chunk);
      console.log("[push] tickets:", tk);
      tickets.push(...tk);
    } catch (e) {
      console.error("[push] send error:", e);
    }
  }

  // Reçeteler (geçersiz token temizliği)
  const receiptIds = tickets.filter((t) => t.id).map((t) => t.id);
  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  for (const chunk of receiptIdChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const [id, r] of Object.entries(receipts)) {
        if (r.status === "ok") continue;
        console.warn("[receipt] error:", id, r);
        if (r.details?.error === "DeviceNotRegistered") {
          const idx = tickets.findIndex((t) => t.id === id);
          const failedToken = tokenOwners[idx]?.to;
          const failedUserRef = tokenOwners[idx]?.userRef;
          if (failedToken && failedUserRef) {
            console.log("[token] remove DeviceNotRegistered:", failedToken);
            await failedUserRef.update({
              expoPushTokens: FieldValue.arrayRemove(failedToken),
            });
          }
        }
      }
    } catch (e) {
      console.error("[receipt] fetch error:", e);
    }
  }

  // Due bitkileri ileri tarihe al (push denendiği kullanıcılar için)
  const dbUpdates = [];
  const nowTs2 = Timestamp.fromDate(now);
  for (const p of plantsToUpdate) {
    // baz alınacak tarih
    const base =
      (p.nextWateringAt?.toDate?.() ??
        (p.nextWateringAt ? new Date(p.nextWateringAt) : null)) ||
      p.lastWatered?.toDate?.() ||
      (p.lastWatered ? new Date(p.lastWatered) : now);

    const next = addDays(base, p.wateringInterval);

    dbUpdates.push(
      p.ref.update({
        lastNotifiedAt: nowTs2,
        nextWateringAt: Timestamp.fromDate(next),
        updatedAt: nowTs2,
      })
    );
  }
  await Promise.allSettled(dbUpdates);

  console.log("[process] done");
  return {
    dueCount: snap.size,
    toSend: messages.length,
    updatedDocs: dbUpdates.length,
  };
}

// Sağlık kontrolü
exports.ping = onRequest({ region: "europe-west1" }, (req, res) => {
  res.send("functions up");
});

// CRON: **4 saatte bir**
exports.notifyDueWaterings = onSchedule(
  {
    schedule: "0 */9 * * *",
    timeZone: "Europe/Istanbul",
    region: "europe-west1",
  },
  async () => processDueWaterings()
);

// Manuel test (JSON döndürür)
exports.runNotifyNow = onRequest(
  { region: "europe-west1" },
  async (req, res) => {
    try {
      const r = await processDueWaterings();
      res.json(r);
    } catch (e) {
      console.error("[runNotifyNow] error:", e);
      res.status(500).send(e?.message || "internal error");
    }
  }
);
