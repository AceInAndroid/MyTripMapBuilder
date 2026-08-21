var planner = require("../../services/planner.js");
var repo = require("../../services/repository.js");
var date = require("../../utils/date.js");

Page({
  data: { mode: "ai", form: { departure: "广州", destination: "", startDate: "2026-10-02", endDate: "2026-10-10", transport: "自驾", travelers: "4位大人 + 2位5岁儿童", childAge: "5岁", interests: "人文、历史、美食、风景", pace: "亲子舒缓", budget: "", mustGo: "" }, submitting: false },
  onLoad: function (options) {
    var mode = options.mode || "ai"; this.setData({ mode: mode });
    if (mode === "ai") {
      var self = this;
      repo.bootstrap().then(function (data) { if (!data.features || !data.features.aiPlannerEnabled) { wx.showToast({ title: "智能规划暂未开放", icon: "none" }); setTimeout(function () { wx.navigateBack(); }, 500); } });
    }
  },
  input: function (event) { var field = event.currentTarget.dataset.field; var form = this.data.form; form[field] = event.detail.value; this.setData({ form: form }); },
  pickDate: function (event) { var form = this.data.form; form[event.currentTarget.dataset.field] = event.detail.value; this.setData({ form: form }); },
  submit: function () {
    var self = this; var form = this.data.form;
    if (!form.destination || !form.startDate || !form.endDate) return wx.showToast({ title: "请写目的地和日期", icon: "none" });
    self.setData({ submitting: true });
    if (this.data.mode === "ai" && !repo.currentFeatures().aiPlannerEnabled) { self.setData({ submitting: false }); wx.showToast({ title: "智能规划暂未开放", icon: "none" }); return; }
    var operation = this.data.mode === "manual" ? Promise.resolve({ draft: planner.buildLocalDraft(form) }) : planner.generate(form);
    operation.then(function (result) { var draft = result.draft; if (self.data.mode === "manual") { draft.status = "planned"; draft.aiGenerated = false; return repo.saveTrip(draft).then(function () { wx.navigateBack(); }); } return repo.saveTrip(draft).then(function () { wx.navigateTo({ url: "/pages/planner/chat?tripId=" + draft.id }); }); }).catch(function () { wx.showToast({ title: self.data.mode === "manual" ? "暂时无法保存，请稍后再试" : "暂时无法生成，请稍后再试", icon: "none" }); }).then(function () { self.setData({ submitting: false }); });
  }
});
