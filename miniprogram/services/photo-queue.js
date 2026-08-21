var QUEUE_KEY = "travel-book:photo-queue:v1";

function queue() { try { return wx.getStorageSync(QUEUE_KEY) || []; } catch (error) { return []; } }
function save(items) { wx.setStorageSync(QUEUE_KEY, items); }
function enqueue(items) { var all = queue().concat(items); save(all); return all; }

function uploadOne(item) {
  var ext = (item.tempPath.match(/\.[a-zA-Z0-9]+$/) || [".jpg"])[0];
  var base = "travel-photos/" + item.tripId + "/" + item.dayId + "/" + item.id;
  return wx.cloud.uploadFile({ cloudPath: base + "-original" + ext, filePath: item.tempPath }).then(function (original) {
    item.fileId = original.fileID;
    return new Promise(function (resolve) { wx.compressImage({ src: item.tempPath, quality: 72, success: function (result) { resolve(result.tempFilePath); }, fail: function () { resolve(item.tempPath); } }); });
  }).then(function (displayPath) {
    return wx.cloud.uploadFile({ cloudPath: base + "-display" + ext, filePath: displayPath });
  }).then(function (display) {
    item.displayFileId = display.fileID; item.displayUrl = display.fileID; item.status = "uploaded"; return item;
  });
}

function flush() {
  var app = getApp();
  var items = queue();
  if (!app.globalData.cloudReady || !items.length) return Promise.resolve(items);
  var chain = Promise.resolve();
  items.forEach(function (item) {
    if (item.status === "uploaded") return;
    chain = chain.then(function () { return uploadOne(item); }).catch(function () { item.status = "waiting"; });
  });
  return chain.then(function () { save(items); return items; });
}

module.exports = { queue: queue, enqueue: enqueue, flush: flush };
