Component({
  data: {
    selected: 0,
    hidden: false,
    tabs: [
      { pagePath: "/pages/index/index", text: "足迹", mark: "○" },
      { pagePath: "/pages/plans/index", text: "计划", mark: "△" },
      { pagePath: "/pages/profile/index", text: "我的", mark: "□" }
    ]
  },
  methods: {
    switchTab: function (event) {
      if (this.data.hidden) return;
      var index = Number(event.currentTarget.dataset.index);
      wx.switchTab({ url: this.data.tabs[index].pagePath });
    }
  }
});
