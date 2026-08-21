var repo = require("../../services/repository.js");

Page({
  data: { profile: null, editing: false, joining: false, nickname: "", birthday: "", inviteCode: "" },
  onShow: function () { if (this.getTabBar()) this.getTabBar().setData({ selected: 2 }); var self = this; repo.getProfile().then(function (profile) { self.setData({ profile: profile, nickname: profile.childNickname, birthday: profile.childBirthday }); }); },
  editChild: function () { this.setData({ editing: true }); }, cancelEdit: function () { this.setData({ editing: false }); }, closeOverlays: function () { this.setData({ editing: false, joining: false }); }, inputNickname: function (e) { this.setData({ nickname: e.detail.value }); }, birthdayChange: function (e) { this.setData({ birthday: e.detail.value }); },
  saveChild: function () { var self = this; var profile = this.data.profile; profile.childNickname = this.data.nickname || "宝贝"; profile.childBirthday = this.data.birthday; repo.saveProfile(profile).then(function () { self.setData({ profile: profile, editing: false }); wx.showToast({ title: "已经收好", icon: "success" }); }); },
  inviteParent: function () { repo.inviteParent().then(function (invite) { wx.showModal({ title: "邀请另一位家长", content: "请把这串邀请码发给对方：" + invite.code + "\n24小时内有效。对方在小程序内输入后即可加入家庭。", showCancel: false }); }).catch(function () { wx.showToast({ title: "邀请码生成失败", icon: "none" }); }); },
  showJoin: function () { this.setData({ joining: true }); }, inputInvite: function (e) { this.setData({ inviteCode: e.detail.value.toUpperCase() }); }, cancelJoin: function () { this.setData({ joining: false }); },
  joinFamily: function () { var self = this; if (!this.data.inviteCode) return; repo.joinFamily(this.data.inviteCode).then(function () { wx.showModal({ title: "已经加入家庭", content: "重新打开小程序后，就能和另一位家长共同编辑旅行绘本。", showCancel: false }); self.setData({ joining: false }); }).catch(function () { wx.showToast({ title: "邀请码无效或已过期", icon: "none" }); }); },
  openRecycle: function () { wx.navigateTo({ url: "/pages/recycle/index" }); }, showInfo: function (e) { wx.showToast({ title: e.currentTarget.dataset.message, icon: "none", duration: 2200 }); }
});
