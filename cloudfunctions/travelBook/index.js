const crypto = require("crypto");
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const ok = data => ({ ok: true, data });
const fail = (message, code) => ({ ok: false, code: code || "REQUEST_FAILED", message });
const clean = value => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const id = prefix => `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;

async function doc(collection, key) {
  try { return (await db.collection(collection).doc(key).get()).data || null; }
  catch (error) {
    if (error && (error.errCode === -1 || /not exist|不存在/i.test(error.errMsg || error.message || ""))) return null;
    throw error;
  }
}
async function familyFor(openid) {
  const rows = await db.collection("profiles").where({ ownerOpenid: openid, role: "parent" }).limit(1).get();
  return rows.data[0] ? doc("families", rows.data[0].familyId) : null;
}
async function family(openid) { const item = await familyFor(openid); if (!item || item.deletedAt) throw new Error("FAMILY_NOT_FOUND"); return item; }
function admin(item, openid) { if (!(item.adminOpenids || []).includes(openid)) throw new Error("ADMIN_REQUIRED"); }
function trip(row) { return Object.assign({}, row.payload || {}, { id: row._id, familyId: row.familyId, status: row.status, startDate: row.startDate, endDate: row.endDate, title: row.title, representative: row.representative, deletedAt: row.deletedAt, createdAt: row.createdAt, updatedAt: row.updatedAt }); }
async function bootstrap(openid, payload) {
  let item = await familyFor(openid);
  if (!item) {
    const familyId = id("family"); const timestamp = now();
    await db.collection("families").doc(familyId).set({ data: { name: "我们的家", memberOpenids: [openid], adminOpenids: [openid], childProfileId: `${familyId}-child`, inviteCode: null, inviteExpiresAt: null, deletedAt: null, createdAt: timestamp, updatedAt: timestamp } });
    await db.collection("profiles").doc(`${familyId}-parent-${crypto.randomBytes(4).toString("hex")}`).set({ data: { familyId, ownerOpenid: openid, role: "parent", createdAt: timestamp, updatedAt: timestamp } });
    await db.collection("profiles").doc(`${familyId}-child`).set({ data: { familyId, role: "child", childNickname: "宝贝", childBirthday: "2021-01-01", avatarUrl: "", createdAt: timestamp, updatedAt: timestamp } });
    if (payload.seedTrip) { const t = clean(payload.seedTrip); await db.collection("trips").doc(t.id).set({ data: { familyId, status: t.status || "planned", startDate: t.startDate || null, endDate: t.endDate || null, title: t.title || "未命名旅行", representative: t.representative || null, payload: t, deletedAt: null, createdAt: timestamp, updatedAt: timestamp } }); }
    item = await family(openid);
  }
  if (payload.seedTrip) {
    const seedTrip = clean(payload.seedTrip); const existingSeed = seedTrip.id ? await doc("trips", seedTrip.id) : null;
    if (seedTrip.id && !existingSeed) { const timestamp = now(); await db.collection("trips").doc(seedTrip.id).set({ data: { familyId: item._id, status: seedTrip.status || "planned", startDate: seedTrip.startDate || null, endDate: seedTrip.endDate || null, title: seedTrip.title || "未命名旅行", representative: seedTrip.representative || null, payload: seedTrip, deletedAt: null, createdAt: timestamp, updatedAt: timestamp } }); }
  }
  const trips = await db.collection("trips").where({ familyId: item._id, deletedAt: null }).orderBy("startDate", "desc").limit(100).get();
  const profiles = await db.collection("profiles").where({ familyId: item._id }).limit(20).get();
  const child = profiles.data.find(value => value.role === "child") || {};
  const shares = await db.collection("share_snapshots").where({ familyId: item._id, revokedAt: null }).limit(100).get();
  const deleted = await db.collection("trips").where({ familyId: item._id, deletedAt: _.neq(null) }).limit(100).get();
  return { trips: trips.data.map(trip), profile: { familyName: item.name, childNickname: child.childNickname || "宝贝", childBirthday: child.childBirthday || "2021-01-01", parentRole: "管理员", parentCount: (item.adminOpenids || []).length, storage: { usedMB: 0, limitMB: 5120 }, activeShares: shares.data.filter(value => new Date(value.expiresAt).getTime() > Date.now()).length, recycleCount: deleted.data.length } };
}

async function saveTrip(openid, payload) {
  const item = await family(openid); admin(item, openid); const t = clean(payload.trip || {}); if (!t.id) throw new Error("TRIP_ID_REQUIRED");
  const existing = await doc("trips", t.id); if (existing && existing.familyId !== item._id) throw new Error("FORBIDDEN"); const timestamp = now();
  await db.collection("trips").doc(t.id).set({ data: { familyId: item._id, status: t.status || "draft", startDate: t.startDate || null, endDate: t.endDate || null, title: t.title || "未命名旅行", representative: t.representative || null, payload: t, deletedAt: null, createdAt: existing ? existing.createdAt : timestamp, updatedAt: timestamp } }); return { id: t.id };
}
async function saveProfile(openid, payload) { const item = await family(openid); admin(item, openid); const p = clean(payload.profile || {}); const key = `${item._id}-child`; const existing = await doc("profiles", key); const timestamp = now(); await db.collection("profiles").doc(key).set({ data: { familyId: item._id, role: "child", childNickname: p.childNickname || "宝贝", childBirthday: p.childBirthday || "2021-01-01", avatarUrl: p.avatarUrl || "", createdAt: existing ? existing.createdAt : timestamp, updatedAt: timestamp } }); return { saved: true }; }
async function createInvite(openid) { const item = await family(openid); admin(item, openid); const code = crypto.randomBytes(6).toString("base64url").toUpperCase(); const expiresAt = new Date(Date.now() + 86400000).toISOString(); await db.collection("families").doc(item._id).update({ data: { inviteCode: code, inviteExpiresAt: expiresAt, updatedAt: now() } }); return { code, expiresAt }; }
async function joinFamily(openid, payload) { if (await familyFor(openid)) throw new Error("ALREADY_IN_FAMILY"); const code = String(payload.code || "").trim().toUpperCase(); const rows = await db.collection("families").where({ inviteCode: code }).limit(1).get(); const item = rows.data[0]; if (!item || !item.inviteExpiresAt || new Date(item.inviteExpiresAt).getTime() < Date.now()) throw new Error("INVITE_INVALID"); if ((item.adminOpenids || []).length >= 2) throw new Error("PARENT_LIMIT_REACHED"); await db.collection("families").doc(item._id).update({ data: { memberOpenids: _.push(openid), adminOpenids: _.push(openid), inviteCode: null, inviteExpiresAt: null, updatedAt: now() } }); await db.collection("profiles").doc(`${item._id}-parent-${crypto.randomBytes(4).toString("hex")}`).set({ data: { familyId: item._id, ownerOpenid: openid, role: "parent", createdAt: now(), updatedAt: now() } }); return { joined: true }; }
async function deleteTrip(openid, payload) { const item = await family(openid); admin(item, openid); const t = await doc("trips", payload.tripId); if (!t || t.familyId !== item._id) throw new Error("FORBIDDEN"); await db.collection("trips").doc(payload.tripId).update({ data: { deletedAt: now(), updatedAt: now() } }); return { deleted: true }; }
async function listDeleted(openid) { const item = await family(openid); admin(item, openid); const rows = await db.collection("trips").where({ familyId: item._id, deletedAt: _.neq(null) }).orderBy("deletedAt", "desc").limit(100).get(); return rows.data.map(trip); }
async function restoreTrip(openid, payload) { const item = await family(openid); admin(item, openid); const t = await doc("trips", payload.tripId); if (!t || t.familyId !== item._id || !t.deletedAt) throw new Error("TRIP_NOT_FOUND"); if (Date.now() - new Date(t.deletedAt).getTime() > 30 * 86400000) throw new Error("RESTORE_EXPIRED"); await db.collection("trips").doc(payload.tripId).update({ data: { deletedAt: null, updatedAt: now() } }); return { restored: true }; }
async function createShare(openid, payload) { const item = await family(openid); admin(item, openid); const row = await doc("trips", payload.tripId); if (!row || row.familyId !== item._id) throw new Error("FORBIDDEN"); const t = trip(row); const token = `share-${crypto.randomBytes(18).toString("base64url")}`; const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString(); const days = (t.days || []).map(day => ({ dayNumber: day.dayNumber, date: day.date, city: day.city, title: day.title, places: (day.places || []).filter(place => place.type !== "住宿").map(place => ({ name: place.name, description: place.description, type: place.type })), diary: day.shareDiary !== false && day.diary && day.diary.updatedAt ? day.diary : null, photos: (day.photos || []).filter(photo => photo.shareSelected !== false && photo.fileId).map(photo => ({ displayUrl: photo.displayUrl || photo.fileId, caption: photo.caption || "" })) })); await db.collection("share_snapshots").doc(token).set({ data: { familyId: item._id, tripId: t.id, title: t.title, dateRange: t.dateRange, memory: t.memory, days, expiresAt, revokedAt: null, createdAt: now() } }); return { token, tripId: t.id, title: t.title, dateRange: t.dateRange, memory: t.memory, days, expiresAt }; }
async function getShare(payload) { const value = await doc("share_snapshots", payload.token); if (!value || value.revokedAt || new Date(value.expiresAt).getTime() < Date.now()) throw new Error("SHARE_EXPIRED"); return { token: value._id, tripId: value.tripId, title: value.title, dateRange: value.dateRange, memory: value.memory, days: value.days, expiresAt: value.expiresAt }; }

exports.main = async event => { const { OPENID } = cloud.getWXContext(); const action = event && event.action; const payload = event && event.payload || {}; try { if (!OPENID && action !== "getShare") return fail("WECHAT_IDENTITY_REQUIRED", "WECHAT_IDENTITY_REQUIRED"); if (action === "bootstrap") return ok(await bootstrap(OPENID, payload)); if (action === "saveTrip") return ok(await saveTrip(OPENID, payload)); if (action === "saveProfile") return ok(await saveProfile(OPENID, payload)); if (action === "createInvite") return ok(await createInvite(OPENID)); if (action === "joinFamily") return ok(await joinFamily(OPENID, payload)); if (action === "deleteTrip") return ok(await deleteTrip(OPENID, payload)); if (action === "listDeleted") return ok(await listDeleted(OPENID)); if (action === "restoreTrip") return ok(await restoreTrip(OPENID, payload)); if (action === "createShare") return ok(await createShare(OPENID, payload)); if (action === "getShare") return ok(await getShare(payload)); return fail("Unsupported action", "UNSUPPORTED_ACTION"); } catch (error) { console.error("[travelBook] request failed", { action, message: error && error.message, errCode: error && error.errCode }); return fail(error.message || "Request failed", error.message || "REQUEST_FAILED"); } };
