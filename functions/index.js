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

// Helper constants / functions
const TOK_RE = /^(Expo(nent)?PushToken)\[.+\]$/; // ExpoPushToken[...] veya ExponentPushToken[...]

function toDateSafe(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value === "number") return new Date(value);
  return null;
}

function isSameDay(a, b) {
  return a && b && a.toDateString() === b.toDateString();
}

// Ana is: her kullanicinin bitkilerini kontrol et, sulama vakti gelenleri bildir.
async function processDueWaterings() {
  const db = getFirestore();
  const now = new Date();
  const nowTs = Timestamp.fromDate(now);

  console.log("[process] start", { now: now.toISOString() });

  const usersSnap = await db.collection("users").get();

  // userId -> { userRef, tokens[], plants[] }
  const groups = new Map();

  for (const userDoc of usersSnap.docs) {
    const userRef = userDoc.ref;
    const userData = userDoc.data() || {};

    // Token oku (dizi + tekil alan)
    let rawTokens = Array.isArray(userData.expoPushTokens)
      ? userData.expoPushTokens
      : [];
    if (!rawTokens.length && typeof userData.expoPushToken === "string") {
      rawTokens = [userData.expoPushToken];
    }
    const tokens = rawTokens
      .map((t) => (typeof t === "string" ? t.trim() : ""))
      .filter((t) => TOK_RE.test(t));

    if (!tokens.length) continue;

    // Kullanici sulama bildirimi acik mi?
    let wateringEnabled = true;
    try {
      const notifSnap = await userRef
        .collection("settings")
        .doc("notification_settings")
        .get();
      if (notifSnap.exists) {
        const nd = notifSnap.data() || {};
        if (typeof nd.wateringReminder === "boolean") {
          wateringEnabled = nd.wateringReminder;
        }
      }
    } catch (err) {
      console.error("[process] notif settings fetch error", userRef.id, err);
      // hata halinde default true tutuyoruz
    }
    if (!wateringEnabled) {
      console.log("[process] skip user (watering off)", userRef.id);
      continue;
    }

    const plantsSnap = await userRef.collection("plants").get();
    if (plantsSnap.empty) continue;

    const duePlants = [];
    for (const plantDoc of plantsSnap.docs) {
      const plant = plantDoc.data() || {};
      const lastWatered = toDateSafe(plant.lastWatered);
      const lastNotifiedAt = toDateSafe(plant.lastNotifiedAt);

      // lastWatered yoksa atla; ayni gun bildirim gonderildiyse atla
      if (!lastWatered) continue;
      if (isSameDay(lastNotifiedAt, now)) continue;

      const hoursSinceWatered =
        (now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60);

      // 24 saatten fazla olduysa bildirim icin isaretle
      if (hoursSinceWatered >= 24) {
        duePlants.push({
          ref: plantDoc.ref,
          name: plant.name || "Bitki",
        });
      }
    }

    if (!duePlants.length) continue;

    groups.set(userRef.id, { userRef, tokens, plants: duePlants });
  }

  // Tek bildirim uretme: kullanici basina 1 push
  const messages = [];
  const tokenOwners = []; // receipts icin token->user eslemesi
  const plantsToUpdate = []; // push denemesi yapilan tum bitkiler

  for (const [, group] of groups) {
    if (!group.tokens.length || !group.plants.length) continue;

    const count = group.plants.length;
    const names = group.plants.map((p) => p.name).slice(0, 5);
    const rest = count - names.length;

    const title = "Bitkilerini Sulamayi Unutma!";
    const body = `${names.join(", ")}${
      rest > 0 ? ` ve ${rest} daha` : ""
    } icin sulama vakti...`;

    const data = {
      kind: "WATER_DUE",
      userId: group.userRef.id,
      plantIds: group.plants.slice(0, 10).map((p) => p.ref.id),
      count,
    };

    for (const to of group.tokens) {
      messages.push({ to, sound: "default", title, body, data });
      tokenOwners.push({ to, userRef: group.userRef });
    }

    plantsToUpdate.push(...group.plants);
  }

  console.log("[process] users:", groups.size, "toSend:", messages.length);

  // Expo push gonderimi (tickets)
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

  // Receipt'ler (gecersiz token temizligi)
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

  // Bildirim gonderilen bitkiler icin lastNotifiedAt guncelle
  const updatePromises = plantsToUpdate.map((p) =>
    p.ref.update({
      lastNotifiedAt: nowTs,
      updatedAt: nowTs,
    })
  );
  await Promise.allSettled(updatePromises);

  console.log("[process] done");
  return {
    dueCount: plantsToUpdate.length,
    toSend: messages.length,
    updatedDocs: updatePromises.length,
  };
}

// Saglik kontrolu
exports.ping = onRequest({ region: "europe-west1" }, (req, res) => {
  res.send("functions up");
});

// CRON: her gun 09:00 ve 18:00
exports.notifyDueWaterings = onSchedule(
  {
    schedule: "0 9,18 * * *",
    timeZone: "Europe/Istanbul",
    region: "europe-west1",
  },
  async () => processDueWaterings()
);

// Manuel test (JSON dondurur)
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

// Custom bildirim gonderme (Web panelden kullanilacak)
// POST body: { title: string, body: string, userIds?: string[] }
// userIds verilmezse tum kullanicilara gonderir
exports.sendCustomNotification = onRequest(
  { region: "europe-west1", cors: true },
  async (req, res) => {
    // Sadece POST kabul et
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed. Use POST." });
      return;
    }

    try {
      const { title, body, userIds } = req.body;

      // Validasyon
      if (!title || !body) {
        res.status(400).json({ error: "title ve body zorunludur." });
        return;
      }

      const db = getFirestore();
      let usersSnap;

      // Belirli kullanicilar mi yoksa hepsi mi?
      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        // Belirli kullanicilari cek
        const userRefs = userIds.map((uid) => db.collection("users").doc(uid));
        const userDocs = await Promise.all(userRefs.map((ref) => ref.get()));
        usersSnap = userDocs.filter((doc) => doc.exists);
      } else {
        // Tum kullanicilari cek
        usersSnap = (await db.collection("users").get()).docs;
      }

      console.log("[customNotify] userCount:", usersSnap.length);

      // Token'lari topla
      const messages = [];
      const tokenOwners = [];

      for (const userDoc of usersSnap) {
        const userData = userDoc.data() || {};

        // Token'lari oku (dizi + tekil alan)
        let rawTokens = Array.isArray(userData.expoPushTokens)
          ? userData.expoPushTokens
          : [];
        if (!rawTokens.length && typeof userData.expoPushToken === "string") {
          rawTokens = [userData.expoPushToken];
        }

        // Kabul edilen formatlar
        const tokens = rawTokens
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter((t) => TOK_RE.test(t));

        if (tokens.length === 0) continue;

        const data = {
          kind: "CUSTOM_NOTIFICATION",
          userId: userDoc.id,
          sentAt: new Date().toISOString(),
        };

        for (const to of tokens) {
          messages.push({ to, sound: "default", title, body, data });
          tokenOwners.push({ to, userRef: userDoc.ref });
        }
      }

      console.log("[customNotify] toSend:", messages.length);

      if (messages.length === 0) {
        res.json({
          success: true,
          message: "Gonderilecek token bulunamadi.",
          sent: 0,
        });
        return;
      }

      // Expo push gonderimi
      const tickets = [];
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          const tk = await expo.sendPushNotificationsAsync(chunk);
          console.log("[customNotify] tickets:", tk);
          tickets.push(...tk);
        } catch (e) {
          console.error("[customNotify] send error:", e);
        }
      }

      // Gecersiz token temizligi (opsiyonel, arka planda)
      const receiptIds = tickets.filter((t) => t.id).map((t) => t.id);
      if (receiptIds.length > 0) {
        // Async olarak receipts kontrol et (response bekletmeden)
        setImmediate(async () => {
          try {
            const receiptIdChunks =
              expo.chunkPushNotificationReceiptIds(receiptIds);
            for (const chunk of receiptIdChunks) {
              const receipts = await expo.getPushNotificationReceiptsAsync(
                chunk
              );
              for (const [id, r] of Object.entries(receipts)) {
                if (r.status === "ok") continue;
                console.warn("[customNotify][receipt] error:", id, r);
                if (r.details?.error === "DeviceNotRegistered") {
                  const idx = tickets.findIndex((t) => t.id === id);
                  const failedToken = tokenOwners[idx]?.to;
                  const failedUserRef = tokenOwners[idx]?.userRef;
                  if (failedToken && failedUserRef) {
                    console.log("[customNotify][token] remove:", failedToken);
                    await failedUserRef.update({
                      expoPushTokens: FieldValue.arrayRemove(failedToken),
                    });
                  }
                }
              }
            }
          } catch (e) {
            console.error("[customNotify][receipt] fetch error:", e);
          }
        });
      }

      res.json({
        success: true,
        message: `${tickets.length} bildirim gonderildi.`,
        sent: tickets.length,
        userCount: usersSnap.length,
      });
    } catch (e) {
      console.error("[customNotify] error:", e);
      res.status(500).json({ error: e?.message || "internal error" });
    }
  }
);
