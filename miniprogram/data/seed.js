var original = require("./trip.js");
var date = require("../utils/date.js");

var tripDays = original.days.map(function (day) {
  return {
    id: "south-xinjiang-day-" + day.id,
    dayNumber: day.id,
    date: "2026-10-" + (day.id + 1 < 10 ? "0" : "") + (day.id + 1),
    city: day.city,
    title: day.title,
    distance: day.distance,
    drive: day.drive,
    warning: day.warning || "",
    places: day.locations.map(function (item, index) {
      return {
        id: "south-xinjiang-place-" + day.id + "-" + index,
        name: item[0], latitude: item[1], longitude: item[2],
        time: item[3], description: item[4], type: item[5],
        verifyRequired: /开放|预约|供氧|封闭|核对|确认/.test(item[4])
      };
    }),
    diary: { parentNote: "", childQuote: "", favorite: "", photoStory: "", updatedAt: "" },
    photos: []
  };
});

var southXinjiang = {
  id: "south-xinjiang-2026-restored",
  title: "南疆 9 日亲子自驾",
  subtitle: "喀什进 · 阿克苏出",
  status: "planned",
  startDate: "2026-10-02",
  endDate: "2026-10-10",
  dateRange: date.formatRange("2026-10-02", "2026-10-10"),
  dayCount: 9,
  childAge: "5岁",
  travelers: "4位大人 + 2位5岁儿童",
  transport: "7座 MPV",
  coverColor: "#E5A75D",
  coverLabel: "帕米尔 · 沙漠 · 龟兹",
  representative: { name: "喀什古城", latitude: 39.4704, longitude: 75.9858 },
  memory: "和她一起，把雪山、沙漠和古城画进旅行绘本。",
  progress: 86,
  photoCount: 0,
  footprintCount: 0,
  aiGenerated: false,
  needsVerification: true,
  days: tripDays,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-25T00:00:00.000Z"
};

var profile = {
  familyName: "我们的家",
  childNickname: "宝贝",
  childBirthday: "2021-01-01",
  parentRole: "管理员",
  parentCount: 1,
  storage: { usedMB: 0, limitMB: 5120 },
  activeShares: 0,
  recycleCount: 0
};

module.exports = { trips: [southXinjiang], profile: profile };
