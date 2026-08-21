var planner = require("../../services/planner.js");
var repo = require("../../services/repository.js");
var date = require("../../utils/date.js");

Page({
  data: { mode: "ai", form: { departure: "广州", destination: "", startDate: "2026-10-02", endDate: "2026-10-10", transport: "自驾", travelers: "4位大人 + 2位5岁儿童", childAge: "5岁", interests: "人文、历史、美食、风景", pace: "亲子舒缓", budget: "", mustGo: "" }, submitting: false },
  onLoad: function (options) { this.setData({ mode: options.mode || "ai" }); },
  input: function (event) { var field = event.currentTarget.dataset.field; var form = this.data.form; form[field] = event.detail.value; this.setData({ form: form }); },
  pickDate: function (event) { var form = this.data.form; form[event.currentTarget.dataset.field] = event.detail.value; this.setData({ form: form }); },
  submit: function () {
    var self = this; var form = this.data.form;
    if (!form.destination || !form.startDate || !form.endDate) return wx.showToast({ title: "请写目的地和日期", icon: "none" });
    self.setData({ submitting: true });
    planner.generate(form).then(function (result) { return repo.saveTrip(result.draft).then(function () { wx.navigateTo({ url: "/pages/planner/chat?tripId=" + result.draft.id }); }); }).catch(function () { wx.showToast({ title: "暂时无法生成，请稍后再试", icon: "none" }); }).then(function () { self.setData({ submitting: false }); });
  }
});
