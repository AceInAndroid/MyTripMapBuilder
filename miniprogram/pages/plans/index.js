var repo = require("../../services/repository.js");
var date = require("../../utils/date.js");

Page({
  data: { loading: true, unauthorized: false, drafts: [], planned: [] },
  onShow: function () {
    if (this.getTabBar()) this.getTabBar().setData({ selected: 1, hidden: true });
    var self = this;
    repo.bootstrap().then(function (bootstrap) {
      var unauthorized = bootstrap.authorized === false;
      var readOnly = Boolean(bootstrap.profile && bootstrap.profile.canEdit === false);
      var tab = self.getTabBar && self.getTabBar(); if (tab) tab.setData({ selected: 1, hidden: unauthorized || readOnly });
      var trips = bootstrap.trips.map(function (trip) { trip.countdown = date.countdown(trip.startDate); return trip; });
      self.setData({ loading: false, unauthorized: unauthorized, drafts: trips.filter(function (trip) { return trip.status === "draft"; }), planned: trips.filter(function (trip) { return trip.status === "planned"; }) });
    });
  },
  joinFamily: function () { wx.switchTab({ url: "/pages/profile/index" }); },
  openTrip: function (event) { wx.navigateTo({ url: "/pages/trip/detail?id=" + event.currentTarget.dataset.id }); }
});
