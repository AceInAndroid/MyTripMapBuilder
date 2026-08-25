var repo = require("../../services/repository.js");
var date = require("../../utils/date.js");
var coords = require("../../utils/coords.js");

function markerFor(trip, index) {
  if (!trip.representative) return null;
  var point = coords.wgs84ToGcj02(trip.representative.longitude, trip.representative.latitude);
  return {
    id: index + 1, tripId: trip.id, latitude: point[1], longitude: point[0], width: 22, height: 22,
    label: { content: "足迹", color: "#5B4636", fontSize: 11, bgColor: "#F6C85F", borderColor: "#5B4636", borderWidth: 1, borderRadius: 12, padding: 6, anchorX: -16, anchorY: -34 },
    callout: { content: trip.title + "\n" + trip.childAge + " · " + trip.dateRange, color: "#5B4636", fontSize: 12, bgColor: "#FFFDF6", borderRadius: 8, padding: 10, display: "BYCLICK" }
  };
}

Page({
  data: { loading: true, unauthorized: false, readOnly: false, source: "local", syncError: "", trips: [], completed: [], planned: [], markers: [], latitude: 35.8617, longitude: 104.1954, scale: 3.4, greeting: "陪她把世界一页页画下来" },
  onShow: function () { if (this.getTabBar()) this.getTabBar().setData({ selected: 0, hidden: true }); this.load(); },
  load: function () {
    var self = this;
    repo.bootstrap().then(function (data) {
      var trips = data.trips.map(function (trip) {
        trip.countdown = trip.status === "planned" ? date.countdown(trip.startDate) : "";
        trip.statusLabel = trip.status === "completed" ? "已完成" : trip.status === "draft" ? "草稿" : "计划中";
        return trip;
      });
      var completed = trips.filter(function (trip) { return trip.status === "completed"; });
      var unauthorized = data.authorized === false;
      var readOnly = Boolean(data.profile && data.profile.canEdit === false);
      var tab = self.getTabBar && self.getTabBar(); if (tab) tab.setData({ selected: 0, hidden: unauthorized || readOnly });
      self.setData({ loading: false, unauthorized: unauthorized, readOnly: readOnly, source: data.source, syncError: data.syncError || "", trips: trips, completed: completed, planned: trips.filter(function (trip) { return trip.status !== "completed"; }), markers: completed.map(markerFor).filter(Boolean) });
    });
  },
  openTrip: function (event) { wx.navigateTo({ url: "/pages/trip/detail?id=" + event.currentTarget.dataset.id }); },
  markerTap: function (event) { var marker = this.data.markers.find(function (item) { return item.id === Number(event.detail.markerId); }); if (marker) wx.navigateTo({ url: "/pages/trip/detail?id=" + marker.tripId }); },
  createTrip: function () { wx.switchTab({ url: "/pages/plans/index" }); },
  joinFamily: function () { wx.switchTab({ url: "/pages/profile/index" }); }
});
