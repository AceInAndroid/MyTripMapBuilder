var config = require("../config.js");
var date = require("../utils/date.js");

function splitList(value) { return String(value || "").split(/[、,，\s]+/).filter(Boolean); }
function buildLocalDraft(form) {
  var count = date.daysBetween(form.startDate, form.endDate);
  var mustGo = splitList(form.mustGo);
  var days = [];
  for (var i = 0; i < count; i += 1) {
    var current = new Date(form.startDate + "T00:00:00"); current.setDate(current.getDate() + i);
    var focus = mustGo[i] || (i === 0 ? "抵达与轻松适应" : i === count - 1 ? "返程与整理" : form.destination + "分区游览");
    days.push({
      id: "draft-day-" + (i + 1), dayNumber: i + 1, date: date.dateOnly(current), city: form.destination,
      title: focus, distance: "待导航核验", drive: "生成后请根据实时导航核验",
      warning: form.childAge ? "带儿童出行，控制节奏并预留午休与机动时间。" : "",
      places: [{ id: "draft-place-" + (i + 1), name: focus, time: i === 0 ? "抵达后" : "上午", type: "景点", description: "AI 草案占位点，保存前请补充准确地点与坐标。", verifyRequired: true }],
      diary: { parentNote: "", childQuote: "", favorite: "", photoStory: "", updatedAt: "" }, photos: []
    });
  }
  return {
    id: "trip-" + Date.now().toString(36), title: form.destination + " " + count + " 日旅行",
    subtitle: form.departure + "出发 · " + form.transport,
    status: "draft", startDate: form.startDate, endDate: form.endDate,
    dateRange: date.formatRange(form.startDate, form.endDate), dayCount: count,
    childAge: form.childAge, travelers: form.travelers, transport: form.transport,
    coverColor: "#5FAF8B", coverLabel: form.interests, representative: null,
    memory: "这趟旅行还在慢慢长成。", progress: 35, photoCount: 0, footprintCount: 0,
    aiGenerated: true, needsVerification: true, days: days,
    plannerForm: form, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
}

function parseJson(text) {
  var value = String(text || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  var parsed = JSON.parse(value);
  if (!parsed || !Array.isArray(parsed.days) || !parsed.days.length) throw new Error("AI_SCHEMA_INVALID");
  return parsed;
}

function generate(form) {
  if (!config.ai.enabled || !config.ai.group || !config.ai.model || !wx.cloud) return Promise.resolve({ draft: buildLocalDraft(form), mode: "guided" });
  return wx.cloud.callFunction({ name: config.functions.ai, data: { action: "generate", payload: { form: form } } }).then(function (result) {
    var body = result.result;
    if (!body || body.ok !== true) throw new Error((body && body.message) || "AI_FAILED");
    return { draft: typeof body.data === "string" ? parseJson(body.data) : body.data, mode: "ai" };
  });
}

function adjustLocal(draft, message) {
  var text = String(message || "");
  var next = JSON.parse(JSON.stringify(draft));
  var addMatch = text.match(/加入(.+?)(?:$|，|,)/);
  if (addMatch && next.days.length) {
    next.days[Math.min(1, next.days.length - 1)].places.push({ id: "adjusted-" + Date.now(), name: addMatch[1], time: "机动", type: "景点", description: "聊天调整新增，需核验开放与路线。", verifyRequired: true });
  }
  if (/减少高海拔|缩短高海拔/.test(text)) next.days.forEach(function (day) { day.warning = "已降低高海拔活动强度；到达后仍需根据儿童状态及时下撤。"; });
  if (/轻松|不要太赶|放慢/.test(text)) next.days.forEach(function (day) { day.drive = day.drive + "；当天只保留一个核心区域"; });
  next.updatedAt = new Date().toISOString();
  return next;
}

function adjust(draft, message) {
  if (!config.ai.enabled || !config.ai.group || !config.ai.model || !wx.cloud) return Promise.resolve({ draft: adjustLocal(draft, message), mode: "guided" });
  return wx.cloud.callFunction({ name: config.functions.ai, data: { action: "adjust", payload: { draft: draft, message: message } } }).then(function (result) {
    var body = result.result;
    if (!body || body.ok !== true) throw new Error((body && body.message) || "AI_FAILED");
    return { draft: typeof body.data === "string" ? parseJson(body.data) : body.data, mode: "ai" };
  });
}

module.exports = { generate: generate, adjust: adjust, buildLocalDraft: buildLocalDraft };
