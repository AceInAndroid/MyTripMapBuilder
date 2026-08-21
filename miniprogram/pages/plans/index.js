var repo = require("../../services/repository.js");
var date = require("../../utils/date.js");

Page({
  data: { loading: true, drafts: [], planned: [], aiPlansLeft: 5, aiEditsLeft: 20, features: { aiPlannerEnabled: false, aiChatEnabled: false } },
  onShow: function () {
    if (this.getTabBar()) this.getTabBar().setData({ selected: 1 });
    var self = this;
    Promise.all([repo.bootstrap(), repo.getProfile()]).then(function (results) {
      var bootstrap = results[0]; var profile = results[1];
      var trips = bootstrap.trips.map(function (trip) { trip.countdown = date.countdown(trip.startDate); return trip; });
      self.setData({ loading: false, drafts: trips.filter(function (trip) { return trip.status === "draft"; }), planned: trips.filter(function (trip) { return trip.status === "planned"; }), aiPlansLeft: profile.aiQuota.plansLeft, aiEditsLeft: profile.aiQuota.editsLeft, features: bootstrap.features || repo.currentFeatures() });
    });
  },
  openTrip: function (event) { wx.navigateTo({ url: "/pages/trip/detail?id=" + event.currentTarget.dataset.id }); },
  createAI: function () { if (!this.data.features.aiPlannerEnabled) return wx.showToast({ title: "智能规划暂未开放", icon: "none" }); wx.navigateTo({ url: "/pages/planner/form?mode=ai" }); },
  createManual: function () { wx.navigateTo({ url: "/pages/planner/form?mode=manual" }); }
});
