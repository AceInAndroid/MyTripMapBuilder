var repo = require("../../services/repository.js");
var date = require("../../utils/date.js");

Page({
  data: { loading: true, drafts: [], planned: [] },
  onShow: function () {
    if (this.getTabBar()) this.getTabBar().setData({ selected: 1 });
    var self = this;
    repo.bootstrap().then(function (bootstrap) {
      var trips = bootstrap.trips.map(function (trip) { trip.countdown = date.countdown(trip.startDate); return trip; });
      self.setData({ loading: false, drafts: trips.filter(function (trip) { return trip.status === "draft"; }), planned: trips.filter(function (trip) { return trip.status === "planned"; }) });
    });
  },
  openTrip: function (event) { wx.navigateTo({ url: "/pages/trip/detail?id=" + event.currentTarget.dataset.id }); }
});
