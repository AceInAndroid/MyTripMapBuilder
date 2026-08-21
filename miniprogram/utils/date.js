function pad(value) { return value < 10 ? "0" + value : String(value); }

function dateOnly(value) {
  var date = value instanceof Date ? value : new Date(value);
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

function daysBetween(start, end) {
  var a = new Date(start + "T00:00:00");
  var b = new Date(end + "T00:00:00");
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

function countdown(start) {
  var today = new Date();
  today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var target = new Date(start + "T00:00:00");
  var value = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  if (value > 0) return "还有 " + value + " 天出发";
  if (value === 0) return "今天出发";
  return "旅程已开始";
}

function formatRange(start, end) {
  return start.replace(/-/g, ".") + " — " + end.replace(/-/g, ".");
}

function expiresIn(days) {
  var date = new Date(Date.now() + days * 86400000);
  return date.toISOString();
}

function ageAt(birthday, dateValue) {
  var birth = new Date(birthday + "T00:00:00"); var at = new Date(dateValue + "T00:00:00");
  if (isNaN(birth.getTime()) || isNaN(at.getTime())) return "";
  var years = at.getFullYear() - birth.getFullYear();
  if (at.getMonth() < birth.getMonth() || (at.getMonth() === birth.getMonth() && at.getDate() < birth.getDate())) years -= 1;
  return Math.max(0, years) + "岁";
}

module.exports = { dateOnly: dateOnly, daysBetween: daysBetween, countdown: countdown, formatRange: formatRange, expiresIn: expiresIn, ageAt: ageAt };
