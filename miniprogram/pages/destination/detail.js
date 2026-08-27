var repo = require("../../services/repository.js");
var coords = require("../../utils/coords.js");
Page({
  data: { loading: true, destination: null, items: [], markers: [], latitude: 35.8617, longitude: 104.1954, scale: 5 },
  onLoad: function (options) { this.load(options.id); },
  load: function (id) { var self = this; repo.getDestination(id).then(function (data) { var d = data.destination; var points = (data.items || []).filter(function (item) { return Number.isFinite(item.latitude) && Number.isFinite(item.longitude); }); var first = points[0]; self.setData({ loading: false, destination: d, items: data.items || [], latitude: first ? first.latitude : 35.8617, longitude: first ? first.longitude : 104.1954, markers: points.map(function (item, index) { var p = coords.wgs84ToGcj02(item.longitude, item.latitude); return { id: index + 1, latitude: p[1], longitude: p[0], label: { content: String(index + 1), color: "#FFF", bgColor: "#0071E3", borderRadius: 12, padding: 5 } }; }) }); }).catch(function () { self.setData({ loading: false }); wx.showToast({ title: "目的地加载失败", icon: "none" }); }); },
  openLocation: function (event) { var item = this.data.items[event.currentTarget.dataset.index]; if (!item || !Number.isFinite(item.latitude)) return; wx.openLocation({ latitude: item.latitude, longitude: item.longitude, name: item.title, address: item.address || "" }); },
  openTrip: function (event) { wx.navigateTo({ url: "/pages/trip/detail?id=" + event.currentTarget.dataset.id }); }
});
