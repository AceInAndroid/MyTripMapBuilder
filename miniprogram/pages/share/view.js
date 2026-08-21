var repo = require("../../services/repository.js");

Page({ data: { share: null, expired: false }, onLoad: function (options) { var self = this; repo.getShare(options.token).then(function (share) { if (!share) return self.setData({ expired: true }); self.setData({ share: share, expired: new Date(share.expiresAt).getTime() < Date.now() }); }).catch(function () { self.setData({ expired: true }); }); } });
