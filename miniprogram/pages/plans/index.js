var repo = require("../../services/repository.js");
var date = require("../../utils/date.js");

function statusLabel(status) {
  return status === "completed" ? "已去过" : status === "planned" ? "已计划" : "规划中";
}

function decorateTrip(trip) {
  var item = Object.assign({}, trip);
  item.statusLabel = statusLabel(item.status);
  item.countdown = item.status === "planned" ? date.countdown(item.startDate) : "";
  item.daysLabel = (item.dayCount || (item.days || []).length || 0) + "天";
  item.progress = Math.max(0, Math.min(100, Number(item.progress) || (item.status === "completed" ? 100 : 0)));
  var days = item.days || [];
  item.routeSummary = days.length ? [days[0].city, days[days.length - 1].city].filter(Boolean).join(" → ") : (item.subtitle || "路线待 AI 生成");
  return item;
}

Page({
  data: {
    loading: true,
    unauthorized: false,
    status: "all",
    trips: [],
    filteredTrips: [],
    statusLabels: [
      { key: "all", label: "全部" },
      { key: "draft", label: "规划中" },
      { key: "planned", label: "已计划" },
      { key: "completed", label: "已去过" }
    ]
  },
  onShow: function () {
    if (this.getTabBar()) this.getTabBar().setData({ selected: 1, hidden: true });
    this.load();
  },
  load: function () {
    var self = this;
    repo.bootstrap().then(function (result) {
      var unauthorized = result.authorized === false;
      var trips = unauthorized ? [] : (result.trips || []).map(decorateTrip);
      var tab = self.getTabBar && self.getTabBar();
      if (tab) tab.setData({ selected: 1, hidden: unauthorized || Boolean(result.profile && result.profile.canEdit === false) });
      self.setData({ loading: false, unauthorized: unauthorized, trips: trips, filteredTrips: self.filterTrips(trips, self.data.status) });
    });
  },
  filterTrips: function (trips, status) {
    return status === "all" ? trips : trips.filter(function (trip) { return trip.status === status; });
  },
  filterStatus: function (event) {
    var status = event.currentTarget.dataset.status;
    this.setData({ status: status, filteredTrips: this.filterTrips(this.data.trips, status) });
  },
  openTrip: function (event) {
    wx.navigateTo({ url: "/pages/trip/detail?id=" + event.currentTarget.dataset.id });
  },
  joinFamily: function () {
    wx.switchTab({ url: "/pages/profile/index" });
  }
});
