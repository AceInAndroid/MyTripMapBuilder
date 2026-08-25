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
  if (!openid) return null;
  const rows = await db.collection("families").where({ memberOpenids: openid, deletedAt: null }).limit(1).get();
  if (rows.data[0]) return rows.data[0];
  const profiles = await db.collection("profiles").where({ ownerOpenid: openid, role: "parent" }).limit(1).get();
  return profiles.data[0] ? doc("families", profiles.data[0].familyId) : null;
}
async function family(openid) { const item = await familyFor(openid); if (!item || item.deletedAt) throw new Error("FAMILY_NOT_FOUND"); return item; }
function admin(item, openid) { if (!(item.adminOpenids || []).includes(openid)) throw new Error("ADMIN_REQUIRED"); }
function trip(row) { return Object.assign({}, row.payload || {}, { id: row._id, familyId: row.familyId, status: row.status, startDate: row.startDate, endDate: row.endDate, title: row.title, representative: row.representative, deletedAt: row.deletedAt, createdAt: row.createdAt, updatedAt: row.updatedAt }); }
function reviewTrip(row) {
  const source = trip(row);
  const safe = clean(source);
  safe.id = `review-${source.id}`;
  safe.familyId = null;
  safe.title = `${source.title || "家庭旅行"}（审核演示）`;
  safe.travelers = "家庭亲子出行";
  safe.childAge = "5 岁";
  safe.memory = "这是一份不含真实家庭隐私的只读审核示例。";
  safe.readOnly = true;
  safe.days = (safe.days || []).map(day => {
    day.places = (day.places || []).filter(place => place.type !== "住宿" && !/酒店|民宿/.test(place.name || ""));
    day.photos = [];
    day.diary = {
      parentNote: "今天沿着计划路线慢慢出发，把一路的风景收进旅行绘本。",
      childQuote: "女儿说：我最喜欢和爸爸妈妈一起看远方。",
      favorite: "一起在路上的时光",
      updatedAt: now()
    };
    return day;
  });
  return safe;
}
async function reviewAccessFor(openid) {
  if (!openid) return null;
  const profiles = await db.collection("profiles").where({ ownerOpenid: openid, role: "reviewer" }).limit(20).get();
  for (const profile of profiles.data) {
    const invite = profile.inviteId ? await doc("family_invites", profile.inviteId) : null;
    if (invite && invite.role === "reviewer" && invite.usedByOpenid === openid && !invite.revokedAt && new Date(invite.expiresAt).getTime() > Date.now()) return { profile, invite };
  }
  return null;
}
async function bootstrap(openid, payload) {
  const item = await familyFor(openid);
  if (!item || item.deletedAt) {
    const review = await reviewAccessFor(openid);
    if (!review) throw new Error("ACCESS_DENIED");
    return {
      trips: review.invite.reviewSnapshot ? [review.invite.reviewSnapshot] : [],
      profile: {
        familyName: "旅行绘本审核体验",
        childNickname: "旅行小主角",
        childBirthday: "2021-01-01",
        parentRole: "审核体验员",
        parentCount: 0,
        accessRole: "reviewer",
        canEdit: false,
        reviewExpiresAt: review.invite.expiresAt,
        storage: { usedMB: 0, limitMB: 0 },
        activeShares: 0,
        recycleCount: 0
      }
    };
  }
  const trips = await db.collection("trips").where({ familyId: item._id, deletedAt: null }).orderBy("startDate", "desc").limit(100).get();
  const profiles = await db.collection("profiles").where({ familyId: item._id }).limit(20).get();
  const child = profiles.data.find(value => value.role === "child") || {};
  const shares = await db.collection("share_snapshots").where({ familyId: item._id, revokedAt: null }).limit(100).get();
  const deleted = await db.collection("trips").where({ familyId: item._id, deletedAt: _.neq(null) }).limit(100).get();
  const reviewInvites = await db.collection("family_invites").where({ familyId: item._id, role: "reviewer", revokedAt: null }).limit(100).get();
  return { trips: trips.data.map(trip), profile: { familyName: item.name, childNickname: child.childNickname || "宝贝", childBirthday: child.childBirthday || "2021-01-01", parentRole: "管理员", parentCount: (item.adminOpenids || []).length, accessRole: "admin", canEdit: true, activeReviewInvites: reviewInvites.data.filter(value => new Date(value.expiresAt).getTime() > Date.now()).length, activeReviewers: reviewInvites.data.filter(value => value.usedAt && new Date(value.expiresAt).getTime() > Date.now()).length, storage: { usedMB: 0, limitMB: 5120 }, activeShares: shares.data.filter(value => new Date(value.expiresAt).getTime() > Date.now()).length, recycleCount: deleted.data.length } };
}

async function saveTrip(openid, payload) {
  const item = await family(openid); admin(item, openid); const t = clean(payload.trip || {}); if (!t.id) throw new Error("TRIP_ID_REQUIRED");
  const existing = await doc("trips", t.id); if (existing && existing.familyId !== item._id) throw new Error("FORBIDDEN"); const timestamp = now();
  await db.collection("trips").doc(t.id).set({ data: { familyId: item._id, status: t.status || "draft", startDate: t.startDate || null, endDate: t.endDate || null, title: t.title || "未命名旅行", representative: t.representative || null, payload: t, deletedAt: null, createdAt: existing ? existing.createdAt : timestamp, updatedAt: timestamp } }); return { id: t.id };
}
async function saveProfile(openid, payload) { const item = await family(openid); admin(item, openid); const p = clean(payload.profile || {}); const key = `${item._id}-child`; const existing = await doc("profiles", key); const timestamp = now(); await db.collection("profiles").doc(key).set({ data: { familyId: item._id, role: "child", childNickname: p.childNickname || "宝贝", childBirthday: p.childBirthday || "2021-01-01", avatarUrl: p.avatarUrl || "", createdAt: existing ? existing.createdAt : timestamp, updatedAt: timestamp } }); return { saved: true }; }
function digest(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }
async function createInvite(openid) { const item = await family(openid); admin(item, openid); if ((item.adminOpenids || []).length >= 2) throw new Error("PARENT_LIMIT_REACHED"); const code = crypto.randomBytes(6).toString("base64url").toUpperCase(); const expiresAt = new Date(Date.now() + 86400000).toISOString(); await db.collection("family_invites").add({ data: { familyId: item._id, codeHash: digest(code), role: "admin", expiresAt, usedAt: null, usedByOpenid: null, createdByOpenid: openid, createdAt: now() } }); return { code, expiresAt }; }
async function createReviewInvite(openid) {
  const item = await family(openid); admin(item, openid);
  const rows = await db.collection("trips").where({ familyId: item._id, deletedAt: null }).limit(100).get();
  const source = rows.data.find(value => value._id === "south-xinjiang-2026-restored") || rows.data.find(value => /南疆/.test(value.title || "")) || rows.data[0];
  if (!source) throw new Error("REVIEW_DEMO_TRIP_REQUIRED");
  await db.collection("family_invites").where({ familyId: item._id, role: "reviewer", revokedAt: null }).update({ data: { revokedAt: now() } });
  const code = crypto.randomBytes(6).toString("base64url").toUpperCase();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  const result = await db.collection("family_invites").add({ data: { familyId: item._id, codeHash: digest(code), role: "reviewer", reviewSnapshot: reviewTrip(source), expiresAt, usedAt: null, usedByOpenid: null, revokedAt: null, createdByOpenid: openid, createdAt: now() } });
  return { code, expiresAt, inviteId: result._id };
}
async function revokeReviewAccess(openid) { const item = await family(openid); admin(item, openid); const result = await db.collection("family_invites").where({ familyId: item._id, role: "reviewer", revokedAt: null }).update({ data: { revokedAt: now() } }); return { revoked: result.stats ? result.stats.updated : 0 }; }
async function joinFamily(openid, payload) {
  if (await familyFor(openid)) throw new Error("ALREADY_IN_FAMILY");
  const code = String(payload.code || "").trim().toUpperCase();
  const rows = await db.collection("family_invites").where({ codeHash: digest(code), usedAt: null }).limit(1).get();
  const candidate = rows.data[0]; if (!candidate) throw new Error("INVITE_INVALID");
  if (candidate.role === "reviewer") {
    await db.runTransaction(async transaction => {
      const inviteResult = await transaction.collection("family_invites").doc(candidate._id).get(); const invite = inviteResult.data;
      if (!invite || invite.usedAt || invite.revokedAt || new Date(invite.expiresAt).getTime() < Date.now()) throw new Error("INVITE_INVALID");
      await transaction.collection("family_invites").doc(invite._id).update({ data: { usedAt: now(), usedByOpenid: openid } });
    });
    await db.collection("profiles").doc(`${candidate.familyId}-reviewer-${digest(openid).slice(0, 12)}`).set({ data: { familyId: candidate.familyId, ownerOpenid: openid, role: "reviewer", inviteId: candidate._id, expiresAt: candidate.expiresAt, createdAt: now(), updatedAt: now() } });
    return { joined: true, role: "reviewer", expiresAt: candidate.expiresAt };
  }
  await db.runTransaction(async transaction => { const inviteResult = await transaction.collection("family_invites").doc(candidate._id).get(); const invite = inviteResult.data; if (!invite || invite.usedAt || new Date(invite.expiresAt).getTime() < Date.now()) throw new Error("INVITE_INVALID"); const familyResult = await transaction.collection("families").doc(invite.familyId).get(); const item = familyResult.data; if (!item || (item.adminOpenids || []).length >= 2) throw new Error("PARENT_LIMIT_REACHED"); await transaction.collection("family_invites").doc(invite._id).update({ data: { usedAt: now(), usedByOpenid: openid } }); await transaction.collection("families").doc(item._id).update({ data: { memberOpenids: _.push(openid), adminOpenids: _.push(openid), updatedAt: now() } }); });
  await db.collection("profiles").doc(`${candidate.familyId}-parent-${crypto.randomBytes(4).toString("hex")}`).set({ data: { familyId: candidate.familyId, ownerOpenid: openid, role: "parent", createdAt: now(), updatedAt: now() } }); return { joined: true, role: "admin" };
}
async function deleteTrip(openid, payload) { const item = await family(openid); admin(item, openid); const t = await doc("trips", payload.tripId); if (!t || t.familyId !== item._id) throw new Error("FORBIDDEN"); await db.collection("trips").doc(payload.tripId).update({ data: { deletedAt: now(), updatedAt: now() } }); return { deleted: true }; }
async function listDeleted(openid) { const item = await family(openid); admin(item, openid); const rows = await db.collection("trips").where({ familyId: item._id, deletedAt: _.neq(null) }).orderBy("deletedAt", "desc").limit(100).get(); return rows.data.map(trip); }
async function restoreTrip(openid, payload) { const item = await family(openid); admin(item, openid); const t = await doc("trips", payload.tripId); if (!t || t.familyId !== item._id || !t.deletedAt) throw new Error("TRIP_NOT_FOUND"); if (Date.now() - new Date(t.deletedAt).getTime() > 30 * 86400000) throw new Error("RESTORE_EXPIRED"); await db.collection("trips").doc(payload.tripId).update({ data: { deletedAt: null, updatedAt: now() } }); return { restored: true }; }
async function createShare(openid, payload) { const item = await family(openid); admin(item, openid); const row = await doc("trips", payload.tripId); if (!row || row.familyId !== item._id) throw new Error("FORBIDDEN"); const t = trip(row); const token = `share-${crypto.randomBytes(18).toString("base64url")}`; const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString(); const days = (t.days || []).map(day => ({ dayNumber: day.dayNumber, date: day.date, city: day.city, title: day.title, places: (day.places || []).filter(place => place.type !== "住宿").map(place => ({ name: place.name, description: place.description, type: place.type })), diary: day.shareDiary !== false && day.diary && day.diary.updatedAt ? day.diary : null, photos: (day.photos || []).filter(photo => photo.shareSelected !== false && photo.fileId).map(photo => ({ displayUrl: photo.displayUrl || photo.fileId, caption: photo.caption || "" })) })); const tokenHash = digest(token); await db.collection("share_snapshots").doc(tokenHash).set({ data: { familyId: item._id, tripId: t.id, tokenHash, createdByOpenid: openid, title: t.title, dateRange: t.dateRange, memory: t.memory, days, expiresAt, revokedAt: null, createdAt: now() } }); return { token, tripId: t.id, title: t.title, dateRange: t.dateRange, memory: t.memory, days, expiresAt }; }
async function getShare(payload) { const token = String(payload.token || ""); const value = await doc("share_snapshots", digest(token)); if (!value || value.revokedAt || new Date(value.expiresAt).getTime() < Date.now()) throw new Error("SHARE_EXPIRED"); return { token, tripId: value.tripId, title: value.title, dateRange: value.dateRange, memory: value.memory, days: value.days, expiresAt: value.expiresAt }; }
async function revokeShare(openid, payload) { const item = await family(openid); admin(item, openid); const key = payload.shareId || digest(payload.token); const value = await doc("share_snapshots", key); if (!value || value.familyId !== item._id) throw new Error("FORBIDDEN"); await db.collection("share_snapshots").doc(value._id).update({ data: { revokedAt: now() } }); return { revoked: true }; }
async function listShares(openid) { const item = await family(openid); admin(item, openid); const rows = await db.collection("share_snapshots").where({ familyId: item._id }).orderBy("createdAt", "desc").limit(100).get(); return rows.data.map(value => ({ shareId: value._id, tripId: value.tripId, title: value.title, expiresAt: value.expiresAt, revokedAt: value.revokedAt, createdAt: value.createdAt, active: !value.revokedAt && new Date(value.expiresAt).getTime() > Date.now() })); }

exports.main = async event => { const { OPENID } = cloud.getWXContext(); const action = event && event.action; const payload = event && event.payload || {}; try { if (!OPENID && action !== "getShare") return fail("WECHAT_IDENTITY_REQUIRED", "WECHAT_IDENTITY_REQUIRED"); if (action === "bootstrap") return ok(await bootstrap(OPENID, payload)); if (action === "saveTrip") return ok(await saveTrip(OPENID, payload)); if (action === "saveProfile") return ok(await saveProfile(OPENID, payload)); if (action === "createInvite") return ok(await createInvite(OPENID)); if (action === "createReviewInvite") return ok(await createReviewInvite(OPENID)); if (action === "revokeReviewAccess") return ok(await revokeReviewAccess(OPENID)); if (action === "joinFamily") return ok(await joinFamily(OPENID, payload)); if (action === "deleteTrip") return ok(await deleteTrip(OPENID, payload)); if (action === "listDeleted") return ok(await listDeleted(OPENID)); if (action === "restoreTrip") return ok(await restoreTrip(OPENID, payload)); if (action === "createShare") return ok(await createShare(OPENID, payload)); if (action === "getShare") return ok(await getShare(payload)); if (action === "listShares") return ok(await listShares(OPENID)); if (action === "revokeShare") return ok(await revokeShare(OPENID, payload)); return fail("Unsupported action", "UNSUPPORTED_ACTION"); } catch (error) { console.error("[travelBook] request failed", { action, message: error && error.message, errCode: error && error.errCode }); return fail(error.message || "Request failed", error.message || "REQUEST_FAILED"); } };
