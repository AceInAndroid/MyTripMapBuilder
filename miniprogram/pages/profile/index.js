var repo = require("../../services/repository.js");

function setTabHidden(page, hidden) { var tab = page.getTabBar && page.getTabBar(); if (tab) tab.setData({ hidden: hidden }); }

Page({
  data: { profile: null, editing: false, joining: false, nickname: "", birthday: "", inviteCode: "", reviewCode: "", reviewExpiresAt: "" },
  onShow: function () {
    if (this.getTabBar()) this.getTabBar().setData({ selected: 2, hidden: true });
    var self = this;
    repo.getProfile().then(function (profile) {
      if (!profile) { setTabHidden(self, true); return self.setData({ profile: null, joining: true }); }
      setTabHidden(self, profile.canEdit === false);
      self.setData({ profile: profile, joining: false, nickname: profile.childNickname, birthday: profile.childBirthday });
    });
  },
  editChild: function () { if (!this.data.profile || this.data.profile.canEdit === false) return; setTabHidden(this, true); this.setData({ editing: true }); },
  cancelEdit: function () { setTabHidden(this, this.data.profile && this.data.profile.canEdit === false); this.setData({ editing: false }); },
  closeOverlays: function () { setTabHidden(this, this.data.profile && this.data.profile.canEdit === false); this.setData({ editing: false, joining: false }); },
  inputNickname: function (e) { this.setData({ nickname: e.detail.value }); },
  birthdayChange: function (e) { this.setData({ birthday: e.detail.value }); },
  saveChild: function () { var self = this; var profile = this.data.profile; profile.childNickname = this.data.nickname || "宝贝"; profile.childBirthday = this.data.birthday; repo.saveProfile(profile).then(function () { setTabHidden(self, false); self.setData({ profile: profile, editing: false }); wx.showToast({ title: "已经收好", icon: "success" }); }); },
  inviteParent: function () { repo.inviteParent().then(function (invite) { wx.showModal({ title: "邀请另一位家长", content: "请把这串邀请码发给对方：" + invite.code + "\n24小时内有效。对方在小程序内输入后即可加入家庭。", showCancel: false }); }).catch(function () { wx.showToast({ title: "邀请码生成失败", icon: "none" }); }); },
  inviteReviewer: function () { var self = this; repo.createReviewInvite().then(function (invite) { self.setData({ reviewCode: invite.code, reviewExpiresAt: invite.expiresAt }); wx.showModal({ title: "审核体验邀请码", content: "请将此邀请码和审核说明一起提供给微信审核老师：" + invite.code + "\n有效期72小时，仅可查看演示路线。", showCancel: false }); }).catch(function () { wx.showToast({ title: "审核邀请码生成失败", icon: "none" }); }); },
  revokeReviewer: function () { var self = this; repo.revokeReviewAccess().then(function () { self.setData({ reviewCode: "", reviewExpiresAt: "" }); wx.showToast({ title: "审核入口已撤销", icon: "success" }); }).catch(function () { wx.showToast({ title: "撤销失败", icon: "none" }); }); },
  showJoin: function () { setTabHidden(this, true); this.setData({ joining: true }); },
  inputInvite: function (e) { this.setData({ inviteCode: e.detail.value.toUpperCase() }); },
  cancelJoin: function () { setTabHidden(this, this.data.profile && this.data.profile.canEdit === false); this.setData({ joining: false }); },
  joinFamily: function () { var self = this; if (!this.data.inviteCode) return; repo.joinFamily(this.data.inviteCode).then(function (result) { var reviewer = result && result.role === "reviewer"; setTabHidden(self, reviewer); wx.showModal({ title: reviewer ? "已进入审核体验" : "已经加入家庭", content: reviewer ? "当前为只读审核账号，不会看到真实家庭数据。" : "重新打开小程序后，就能和另一位家长共同编辑旅行绘本。", showCancel: false, success: function () { wx.reLaunch({ url: "/pages/index/index" }); } }); self.setData({ joining: false }); }).catch(function () { wx.showToast({ title: "邀请码无效或已过期", icon: "none" }); }); },
  openRecycle: function () { wx.navigateTo({ url: "/pages/recycle/index" }); },
  showInfo: function (e) { wx.showToast({ title: e.currentTarget.dataset.message, icon: "none", duration: 2200 }); }
});
