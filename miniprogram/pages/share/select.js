var repo = require("../../services/repository.js");
Page({
  data: { trip: null, selectedPhotos: 0, selectedDiary: 0 },
  onLoad: function (options) { var self = this; this.tripId = options.tripId; repo.getTrip(options.tripId).then(function (trip) { self.setData({ trip: trip, selectedPhotos: (trip.days || []).reduce(function (n, d) { return n + (d.photos || []).filter(function (p) { return p.shareSelected !== false; }).length; }, 0), selectedDiary: (trip.days || []).filter(function (d) { return d.diary && d.diary.updatedAt; }).length }); }); },
  togglePhoto: function (e) { var day = this.data.trip.days[Number(e.currentTarget.dataset.day)]; var photo = day.photos[Number(e.currentTarget.dataset.index)]; photo.shareSelected = photo.shareSelected === false; this.setData({ trip: this.data.trip, selectedPhotos: this.data.selectedPhotos + (photo.shareSelected ? 1 : -1) }); },
  toggleDiary: function (e) { var day = this.data.trip.days[Number(e.currentTarget.dataset.day)]; day.shareDiary = day.shareDiary === false; this.setData({ trip: this.data.trip, selectedDiary: this.data.selectedDiary + (day.shareDiary ? 1 : -1) }); },
  generate: function () { var self = this; repo.saveTrip(this.data.trip).then(function () { return repo.createShare(self.data.trip); }).then(function (share) { wx.showModal({ title: "精选分享已生成", content: "有效7天 · 已选照片 " + self.data.selectedPhotos + " 张 · 日记 " + self.data.selectedDiary + " 天。点击右上角转发。", showCancel: false }); self.shareToken = share.token; }).catch(function () { wx.showToast({ title: "连接云端后才能生成分享", icon: "none" }); }); },
  onShareAppMessage: function () { return { title: this.data.trip ? this.data.trip.title : "我们的旅行绘本", path: this.shareToken ? "/pages/share/view?token=" + this.shareToken : "/pages/index/index" }; }
});
