const cloud = require("wx-server-sdk");
const tcb = require("@cloudbase/node-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function response(ok, data, message) { return { ok, data: data || null, message: message || "" }; }
function monthKey() { return new Date().toISOString().slice(0, 7); }

function schemaPrompt() {
  return "只输出JSON，不要Markdown。结构必须包含 title,subtitle,startDate,endDate,dateRange,dayCount,childAge,travelers,transport,coverColor,coverLabel,memory,progress,photoCount,footprintCount,aiGenerated,needsVerification,days。days每项必须包含 id,dayNumber,date,city,title,distance,drive,warning,places,diary,photos；places每项包含 id,name,latitude,longitude,time,type,description,verifyRequired。无法确认的信息写进description并把verifyRequired设为true。";
}

async function familyFor(openid) {
  const result = await db.collection("families").where({ memberOpenids: openid }).limit(1).get();
  return result.data[0] || null;
}

async function featureEnabled(action) {
  try {
    const value = (await db.collection("app_config").doc("client_features").get()).data || {};
    return action === "generate" ? value.aiPlannerEnabled === true : action === "adjust" ? value.aiChatEnabled === true : false;
  } catch (error) {
    console.error("[tripAI] feature config unavailable; denying request", { action, message: error && error.message, errCode: error && error.errCode });
    return false;
  }
}

async function reserveQuota(family, action) {
  const isPlan = action === "generate"; const field = isPlan ? "plansUsed" : "editsUsed"; const limitField = isPlan ? "plansLimit" : "editsLimit";
  const quota = family.aiQuota || {}; if (quota.month !== monthKey()) { quota.month = monthKey(); quota.plansUsed = 0; quota.editsUsed = 0; }
  if ((quota[field] || 0) >= (quota[limitField] || (isPlan ? 5 : 20))) throw new Error("AI_QUOTA_EXHAUSTED");
  quota[field] = (quota[field] || 0) + 1; await db.collection("families").doc(family._id).update({ data: { aiQuota: quota, updatedAt: db.serverDate() } });
}

exports.main = async (event) => {
  try {
    const action = event && event.action;
    if (!await featureEnabled(action)) throw new Error("AI_FEATURE_DISABLED");
    const { OPENID } = cloud.getWXContext(); const family = await familyFor(OPENID);
    if (!family || family.adminOpenids.indexOf(OPENID) < 0) throw new Error("ADMIN_REQUIRED");
    const group = process.env.AI_GROUP; const modelId = process.env.AI_MODEL;
    if (!group || !modelId) throw new Error("AI_NOT_CONFIGURED");
    const app = tcb.init({ env: process.env.TCB_ENV || "mytripmap-d3gvmwvxd5dba118e" });
    const model = app.ai().createModel(group);
    const payload = event.payload || {};
    const userContent = action === "generate" ? "为这个家庭生成亲子旅行草案：" + JSON.stringify(payload.form) : "根据家长要求调整已有结构化草案。要求：" + String(payload.message || "") + "。原草案：" + JSON.stringify(payload.draft);
    const result = await model.generateText({ model: modelId, messages: [{ role: "system", content: schemaPrompt() }, { role: "user", content: userContent }], temperature: 0.3 });
    const text = String(result.text || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
    const parsed = JSON.parse(text); if (!parsed || !Array.isArray(parsed.days) || !parsed.days.length) throw new Error("AI_SCHEMA_INVALID");
    await reserveQuota(family, action);
    return response(true, parsed);
  } catch (error) { return response(false, null, error.message || "AI_FAILED"); }
};
