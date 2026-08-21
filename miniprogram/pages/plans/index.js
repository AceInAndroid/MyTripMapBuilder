var repo = require("../../services/repository.js");
var date = require("../../utils/date.js");

Page({
  data: { loading: true, drafts: [], planned: [], aiPlansLeft: 5, aiEditsLeft: 20 },
  onShow: function () {
    if (this.getTabBar()) this.getTabBar().setData({ selected: 1 });
    var self = this;
    Promise.all([repo.listTrips(), repo.getProfile()]).then(function (results) {
      var trips = results[0].map(function (trip) { trip.countdown = date.countdown(trip.startDate); return trip; });
      self.setData({ loading: false, drafts: trips.filter(function (trip) { return trip.status === "draft"; }), planned: trips.filter(function (trip) { return trip.status === "planned"; }), aiPlansLeft: results[1].aiQuota.plansLeft, aiEditsLeft: results[1].aiQuota.editsLeft });
    });
  },
  openTrip: function (event) { wx.navigateTo({ url: "/pages/trip/detail?id=" + event.currentTarget.dataset.id }); },
  createAI: function () { wx.navigateTo({ url: "/pages/planner/form?mode=ai" }); },
  createManual: function () { wx.navigateTo({ url: "/pages/planner/form?mode=manual" }); }
});
