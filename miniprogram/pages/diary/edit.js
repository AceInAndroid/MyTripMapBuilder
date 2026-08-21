var repo = require("../../services/repository.js");

Page({
  data: { tripId: "", dayId: "", day: null, diary: { parentNote: "", childQuote: "", favorite: "", photoStory: "", updatedAt: "" } },
  onLoad: function (options) { var self = this; this.draftKey = "travel-book:diary-draft:" + options.tripId + ":" + options.dayId; this.setData({ tripId: options.tripId, dayId: options.dayId }); repo.getTrip(options.tripId).then(function (trip) { var day = trip.days.find(function (item) { return item.id === options.dayId; }); var draft = wx.getStorageSync(self.draftKey); self.setData({ day: day, diary: draft || day.diary || self.data.diary }); }); },
  input: function (event) { var diary = this.data.diary; diary[event.currentTarget.dataset.field] = event.detail.value; this.setData({ diary: diary }); wx.setStorageSync(this.draftKey, diary); },
  save: function () { var self = this; var diary = this.data.diary; diary.updatedAt = new Date().toISOString(); repo.saveDiary(this.data.tripId, this.data.dayId, diary).then(function () { wx.removeStorageSync(self.draftKey); wx.showToast({ title: "这一页收好了", icon: "success" }); setTimeout(function () { wx.navigateBack(); }, 600); }); }
});
