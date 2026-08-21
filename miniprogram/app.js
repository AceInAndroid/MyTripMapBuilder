var ENV_ID = "mytripmap-d3gvmwvxd5dba118e";
var photoQueue = require("./services/photo-queue.js");
var repository = require("./services/repository.js");

App({
  globalData: {
    envId: ENV_ID,
    cloudReady: false,
    reduceMotion: false
  },

  onLaunch: function () {
    var self = this;
    try {
      var system = wx.getSystemInfoSync();
      self.globalData.reduceMotion = Boolean(system && system.reduceMotionEnabled);
    } catch (error) {
      self.globalData.reduceMotion = false;
    }

    if (wx.cloud) {
      wx.cloud.init({ env: ENV_ID, traceUser: true });
      self.globalData.cloudReady = true;
      wx.onNetworkStatusChange(function (status) { if (status.isConnected) { photoQueue.flush(); repository.flushPending(); } });
    }
  }
});
