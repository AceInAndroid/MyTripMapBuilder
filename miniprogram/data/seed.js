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
        verifyRequired: /开放|预约|供氧|封闭|核对|核验|确认/.test(item[4])
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
  notes: [{
    id: "kashgar-bazaar-guide",
    region: "喀什",
    title: "喀什各乡镇巴扎指南",
    summary: "巴扎就是当地乡民买卖、交换物资的传统集市。这里记录各乡镇巴扎日期、距离和交通，作为到喀什后的机动参考，不纳入固定路线。",
    blocks: [
      { type: "heading", text: "巴扎是什么、有什么" },
      { type: "paragraph", html: "巴扎是当地乡民买卖、交换物资的传统集市。牛羊交易之外，还有烤鱼、肉串、包子等本地小吃；夏季常见山桃、无花果、老汉瓜，秋冬常见各类干果；也有羊皮、牛肉、土特产、日用品和小商品。" },
      { type: "table", columns: ["星期", "巴扎", "距离", "参考车程"], rows: [["周一", "英吾斯坦乡", "约27km", "约40分钟"], ["周二", "牙甫泉镇", "约36km", "约55分钟"], ["周三", "阿瓦提乡", "约16km", "约30分钟"], ["周四", "巴合齐乡", "约21km", "约40分钟"], ["周五", "木什乡", "约35km", "约50分钟"], ["周六", "伯什克然木乡", "约17km", "约40分钟"], ["周日", "喀什牛羊大巴扎", "约11km", "约25分钟"]] },
      { type: "heading", text: "时间与交通" },
      { type: "list", items: ["通常约10:00—20:00开放，建议11:30左右到达，预留1—2小时。", "周一、周三、周六、周日可能有公交直达。", "出租车或拼车经验价约20—40元单程；周日游客最多。"] },
      { type: "callout", tone: "warning", text: "活畜区域照看好儿童；日期、开市时间、公交班次、价格和节假日安排均需出发前核验。" }
    ],
    verifyRequired: true,
    updatedAt: "2026-09-01T00:00:00.000Z"
  }, {
    id: "hotan-deep-day-reference", region: "和田", title: "古于阗深度一日参考", summary: "适合愿意为和田多留一晚时采用，不直接叠加到当前9天路线。",
    blocks: [
      { type: "table", columns: ["时段", "安排", "建议时长"], rows: [["上午", "和田博物馆与免费讲解", "约2小时"], ["午餐", "玫瑰花烤肉", "机动"], ["下午", "团城；与玉龙喀什河捡石体验二选一", "约2–3小时"], ["傍晚", "约特干故城日落及夜间演出", "约3小时"]] },
      { type: "callout", tone: "warning", text: "采用此方案需同步减少库车或阿克苏内容；博物馆开放、河道安全、演出与票务均需核验。" }
    ], verifyRequired: true, updatedAt: "2026-09-01T00:00:00.000Z"
  }, {
    id: "kuqa-extra-day-reference", region: "库车", title: "库车行程取舍与加时方案", summary: "当前行程只选最重要内容；若增加完整一天，可在人文线和自然地貌线中选择。",
    blocks: [
      { type: "heading", text: "当前D6–D7怎么选" },
      { type: "list", items: ["D6晚到库车，以晚餐和休息为主；19:30前到店且孩子状态好，可就近尝大馕或手工冰淇淋。", "D7上午短走热斯坦路/龟兹小巷，龟兹魏晋古墓遗址博物馆与库车王府二选一。", "最晚11:00离开市区，下午以克孜尔千佛洞为核心后转场阿克苏。"] },
      { type: "table", columns: ["完整加一天方案", "参考顺序"], rows: [["自然地貌线", "天山神秘大峡谷 → 克孜尔千佛洞 → 视条件考虑红石林 → 独库公路终点碑"], ["龟兹人文线", "龟兹博物馆/魏晋古墓二选一 → 热斯坦路与龟兹小巷 → 库车王府 → 乌恰巴扎夜市"]] },
      { type: "callout", tone: "info", text: "各点距离较远，按当天导航与孩子状态删减，不默认全部完成。" }
    ], verifyRequired: true, updatedAt: "2026-09-01T00:00:00.000Z"
  }, {
    id: "kizil-caves-guide", region: "库车", title: "龟兹石窟与克孜尔特窟攻略", summary: "先分清四个区域，再按预约结果选择普通窟或特窟；本次D7不叠加外围石窟。",
    blocks: [
      { type: "table", columns: ["区域", "定位", "本次建议"], rows: [["克孜尔千佛洞", "主景区，普通窟与特窟", "D7核心"], ["库木吐喇", "外围石窟", "另约时间"], ["森木塞姆", "外围石窟", "另约时间"], ["克孜尔尕哈", "外围石窟", "另约时间"]] },
      { type: "heading", text: "普通窟与特窟参考" },
      { type: "paragraph", html: "普通参观游客经验票价为70元，常见开放8、10、27、32、34、38窟，38窟“音乐窟”是重点。特窟可优先申请谷东178、179、180、188、189组合；17窟与171窟只在现场开放、保护条件和讲解老师允许时礼貌问询。" },
      { type: "heading", text: "预约执行清单" },
      { type: "list", items: ["从官方公众号、文旅渠道或游客中心确认当期申请方式、窟号、年龄限制与收费。", "准备日期时段、6人姓名及证件、联系人、首选与备选窟号，并说明有两名5岁儿童。", "提交不等于成功，等待讲解老师或景区明确确认并记录集合信息。", "出发前7天和前1天复核；未确认就按普通窟执行。", "当天提前30–60分钟到场，不因临时加窟影响16:00离开的硬截止。"] },
      { type: "callout", tone: "warning", text: "特窟每窟讲解约20分钟，还要计算步行、等候和谷东往返。票价、开放窟与政策以2026年官方信息为准；不向未经核实的私人账户支付大额费用。" }
    ], verifyRequired: true, updatedAt: "2026-09-01T00:00:00.000Z"
  }, {
    id: "kuqa-food-reference", region: "库车", title: "库车美食参考", summary: "按住宿位置和排队情况顺路选择，不为某一家店跨城绕行。",
    blocks: [
      { type: "list", items: ["库车大馕：适合现烤分食，也可作路餐。", "喀尔博瓦爷手工冰淇淋：可选原味或巴旦木坚果味。", "烤包子、过油肉拌面、阿克苏苹果辣子鸡：按营业与顺路程度选择。"] },
      { type: "callout", tone: "info", text: "高强度驾驶日儿童优先热食、少辣与充足饮水；门店营业和位置出发前核验。" }
    ], verifyRequired: true, updatedAt: "2026-09-01T00:00:00.000Z"
  }],
  days: tripDays,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z"
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

var destinations = [{
  id: "destination-south-xinjiang",
  name: "南疆",
  slug: "south-xinjiang",
  status: "planned",
  coverColor: "#5FAF8B",
  summary: "喀什、帕米尔、莎车、和田、龟兹与阿克苏的家庭旅行资料。",
  representativeLatitude: 39.4704,
  representativeLongitude: 75.9858,
  tags: ["人文", "美食", "风景", "亲子"],
  updatedAt: "2026-08-27T00:00:00.000Z"
}];

module.exports = { trips: [southXinjiang], destinations: destinations, profile: profile };
