var repo = require("../../services/repository.js");
var planner = require("../../services/planner.js");

Page({
  data: { trip: null, messages: [], input: "", sending: false },
  onLoad: function (options) { this.tripId = options.tripId; this.load(); },
  load: function () { var self = this; repo.getTrip(this.tripId).then(function (trip) { self.setData({ trip: trip, messages: [{ role: "assistant", text: "草案已经画好啦。你可以说：加入莎车、减少高海拔停留、某天放慢一点。" }] }); }); },
  input: function (e) { this.setData({ input: e.detail.value }); },
  useQuick: function (e) { this.setData({ input: e.currentTarget.dataset.value }); },
  send: function () {
    var self = this; var text = this.data.input.trim(); if (!text || this.data.sending) return;
    var messages = this.data.messages.concat([{ role: "user", text: text }]); self.setData({ messages: messages, input: "", sending: true });
    planner.adjust(this.data.trip, text).then(function (result) { var trip = result.draft; trip.status = "draft"; return repo.saveTrip(trip).then(function () { self.setData({ trip: trip, messages: self.data.messages.concat([{ role: "assistant", text: "我把结构化路线更新好了，请检查黄色“待核验”点。" }]) }); }); }).catch(function () { self.setData({ messages: self.data.messages.concat([{ role: "assistant", text: "这次调整没有成功，原草案没有被覆盖。可以换一种说法再试。" }]) }); }).then(function () { self.setData({ sending: false }); });
  },
  confirm: function () { var self = this; var trip = this.data.trip; trip.status = "planned"; trip.progress = 86; repo.saveTrip(trip).then(function () { wx.navigateTo({ url: "/pages/trip/detail?id=" + trip.id }); }); }
});
