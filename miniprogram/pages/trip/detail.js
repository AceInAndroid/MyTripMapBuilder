var repo = require("../../services/repository.js");
var queue = require("../../services/photo-queue.js");
var coords = require("../../utils/coords.js");

Page({
  data: { trip: null, selected: 0, routeView: "overview", routeViewLabel: "完整 9 天路线", tab: "route", loading: true, uploading: false, shareText: "分享精选", features: { aiPlannerEnabled: false, aiChatEnabled: false }, routeMarkers: [], routePolylines: [], routePoints: [], routeLatitude: 35.8617, routeLongitude: 104.1954, routeScale: 5 },
  onLoad: function (options) { this.tripId = options.id; this.load(); },
  load: function () { var self = this; repo.getTrip(this.tripId).then(function (trip) { if (!trip) return wx.showToast({ title: "找不到这本绘本", icon: "none" }); var mapData = self.buildRouteMap(trip, null); self.setData({ trip: trip, tab: trip.status === "completed" ? "diary" : "route", loading: false, features: repo.currentFeatures(), routeMarkers: mapData.markers, routePolylines: mapData.polylines, routePoints: mapData.points, routeLatitude: mapData.latitude, routeLongitude: mapData.longitude, routeScale: mapData.scale }); queue.flush(); }); },
  buildRouteMap: function (trip, selectedDay) {
    var markers = [], polylines = [], all = [], markerId = 1;
    (trip.days || []).forEach(function (day, dayIndex) {
      if (selectedDay !== null && dayIndex !== selectedDay) return;
      var points = [];
      (day.places || []).forEach(function (place, placeIndex) {
        if (!Number.isFinite(Number(place.latitude)) || !Number.isFinite(Number(place.longitude))) return;
        var point = coords.wgs84ToGcj02(Number(place.longitude), Number(place.latitude));
        var item = { latitude: point[1], longitude: point[0] };
        points.push(item); all.push(item);
        markers.push({ id: markerId++, latitude: point[1], longitude: point[0], dayIndex: dayIndex, width: 22, height: 22, zIndex: selectedDay === dayIndex ? 10 : 2, label: { content: (selectedDay === null ? "D" + (day.dayNumber || dayIndex + 1) + "  " : "") + (placeIndex + 1), color: "#5B4636", fontSize: 10, bgColor: selectedDay === dayIndex ? "#F6C85F" : "#FFF8E8", borderColor: selectedDay === dayIndex ? "#E96A58" : "#5B4636", borderWidth: selectedDay === dayIndex ? 2 : 1, borderRadius: 10, padding: 4, anchorX: -18, anchorY: -28 }, callout: { content: place.name, color: "#5B4636", fontSize: 11, bgColor: "#FFFDF6", borderRadius: 6, padding: 7, display: "BYCLICK" } });
      });
      if (points.length > 1) polylines.push({ points: points, color: selectedDay === dayIndex ? "#E96A58" : ["#D8A557", "#5FAF8B", "#A9A090", "#7B9BC5", "#C58B9D"][dayIndex % 5], width: selectedDay === dayIndex ? 7 : 4, dottedLine: selectedDay === null, arrowLine: true, borderColor: "#FFF8E8", borderWidth: 1 });
    });
    var center = all.length ? all[Math.floor(all.length / 2)] : { latitude: 35.8617, longitude: 104.1954 };
    return { markers: markers, polylines: polylines, points: all, latitude: center.latitude, longitude: center.longitude, scale: all.length ? 5 : 3.4 };
  },
  showRouteOverview: function () { var mapData = this.buildRouteMap(this.data.trip, null); this.setData({ routeView: "overview", routeViewLabel: "完整 " + this.data.trip.dayCount + " 天路线", tab: "route", routeMarkers: mapData.markers, routePolylines: mapData.polylines, routePoints: mapData.points, routeLatitude: mapData.latitude, routeLongitude: mapData.longitude, routeScale: mapData.scale }); },
  showRouteDay: function (dayIndex) { var day = this.data.trip.days[dayIndex]; var mapData = this.buildRouteMap(this.data.trip, dayIndex); this.setData({ selected: dayIndex, routeView: "day", routeViewLabel: "D" + day.dayNumber + " · " + day.city, tab: "route", routeMarkers: mapData.markers, routePolylines: mapData.polylines, routePoints: mapData.points, routeLatitude: mapData.latitude, routeLongitude: mapData.longitude, routeScale: mapData.scale }); },
  selectDay: function (event) { this.showRouteDay(Number(event.currentTarget.dataset.index)); },
  routeMarkerTap: function (event) { var marker = this.data.routeMarkers.find(function (item) { return item.id === Number(event.detail.markerId); }); if (marker) this.showRouteDay(marker.dayIndex); },
  switchTab: function (event) { this.setData({ tab: event.currentTarget.dataset.tab }); },
  navigate: function (event) { var place = this.data.trip.days[this.data.selected].places[Number(event.currentTarget.dataset.index)]; var point = coords.wgs84ToGcj02(place.longitude, place.latitude); wx.openLocation({ latitude: point[1], longitude: point[0], name: place.name, address: place.description, scale: 15 }); },
  editDiary: function () { var day = this.data.trip.days[this.data.selected]; wx.navigateTo({ url: "/pages/diary/edit?tripId=" + this.tripId + "&dayId=" + day.id }); },
  editPlan: function () { var self = this; repo.bootstrap().then(function (data) { if (!data.features || !data.features.aiChatEnabled) return wx.showToast({ title: "聊天调整暂未开放", icon: "none" }); wx.navigateTo({ url: "/pages/planner/chat?tripId=" + self.tripId }); }); },
  choosePhotos: function () {
    var self = this; var day = this.data.trip.days[this.data.selected];
    wx.chooseMedia({ count: 9, mediaType: ["image"], sourceType: ["album", "camera"] , success: function (result) {
      var items = result.tempFiles.map(function (file, index) { return { id: "photo-" + Date.now() + "-" + index, tripId: self.tripId, dayId: day.id, tempPath: file.tempFilePath, status: "waiting", shareSelected: true, caption: "" }; });
      day.photos = (day.photos || []).concat(items); self.setData({ trip: self.data.trip, uploading: true }); queue.enqueue(items); queue.flush().then(function (uploaded) {
        var byId = {}; (uploaded || []).forEach(function (photo) { byId[photo.id] = photo; });
        self.data.trip.days.forEach(function (item) { (item.photos || []).forEach(function (photo) { if (byId[photo.id]) Object.assign(photo, byId[photo.id]); }); });
        self.setData({ uploading: false, trip: self.data.trip }); return repo.saveTrip(self.data.trip);
      });
    } });
  },
  markCompleted: function () { var self = this; wx.showModal({ title: "把这段旅程收进地图？", content: "完成后它会成为女儿成长地图上的一枚足迹。", success: function (result) { if (!result.confirm) return; var trip = self.data.trip; trip.status = "completed"; trip.progress = 100; repo.saveTrip(trip).then(function () { self.setData({ trip: trip }); wx.showToast({ title: "已收进足迹", icon: "success" }); }); } }); },
  shareTrip: function () { wx.navigateTo({ url: "/pages/share/select?tripId=" + this.tripId }); },
  deleteTrip: function () { var self = this; wx.showModal({ title: "移到最近删除？", content: "这本旅行绘本会保留30天，期间可以恢复。", confirmColor: "#C85E50", success: function (result) { if (!result.confirm) return; repo.deleteTrip(self.tripId).then(function () { wx.showToast({ title: "已移到最近删除", icon: "none" }); setTimeout(function () { wx.switchTab({ url: "/pages/plans/index" }); }, 500); }); } }); },
  onShareAppMessage: function () { return { title: this.data.trip ? this.data.trip.title : "我们的旅行绘本", path: this.data.shareToken ? "/pages/share/view?token=" + this.data.shareToken : "/pages/index/index" }; }
});
