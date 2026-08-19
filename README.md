# MyTripMapBuilder

南疆自驾 9 天交互式行程地图，适用于手机浏览和分享。

- 日期：2026 年 10 月 2 日—10 月 10 日
- 路线：喀什 → 塔县 → 莎车 → 和田 → 阿拉尔 → 库车/克孜尔 → 阿克苏
- 同行：4 位大人、2 位 5 岁儿童
- 地图：高德地图 JavaScript API 2.0
- 在线地址：[my-trip-map-builder.vercel.app](https://my-trip-map-builder.vercel.app/)

## 功能

- 高德原生底图、缩放和定位控件
- 总览路线与 9 个按日行程页面
- 景点、酒店、餐饮和交通标记
- 每日里程、驾驶时间与长途驾驶警告
- 儿童高海拔风险提示
- Apple Maps、Google Maps、高德地图 App 导航入口
- 小红书与大众点评搜索入口
- “导出 PDF”按钮：生成包含总览和全部 9 天行程的 A4 打印稿
- 单文件静态页面，无构建步骤

> 页面中的彩色路线是按行程点位连接的顺序示意线，不是真实道路轨迹。实际驾驶路线、封路和用时以出发当天的高德导航为准。

## 目录

```text
.
├── index.html                       # Vercel 入口和完整源码
├── 南疆自驾9天完整版攻略.html        # 可直接发送给朋友的静态副本
├── 南疆自驾9天完整版攻略.zip         # 静态副本压缩包
├── README.md
├── assets/                          # 原始旅行地图模板资源
└── references/                      # 行程研究方法与参考资料
```

## 本地运行

不要直接双击使用 `file://` 方式调试高德地图。域名校验、定位和部分浏览器权限在 HTTP/HTTPS 环境下更可靠。

```bash
python3 -m http.server 8000
```

浏览器打开：

```text
http://127.0.0.1:8000/
```

## 高德地图 Key

当前页面使用的高德 Web JS API Key：

```text
2db40ae1a1e3d333b94111e5937a8964
```

引用位置在 `index.html` 的 `<head>`：

```html
<script src="https://webapi.amap.com/maps?v=2.0&key=你的_KEY"></script>
```

Web JS API Key 会随网页源码发送到浏览器，因此它不是服务端密码。仍应通过正确的 Key 类型、域名白名单和最小权限防止滥用。不要把高德 Web 服务 REST Key、签名私钥或其他服务端凭证写进这个 HTML。

### 申请 Key

1. 登录[高德开放平台控制台](https://console.amap.com/dev/index)。
2. 创建一个应用，例如 `MyTripMapBuilder`。
3. 在应用中点击“添加 Key”。
4. 服务平台必须选择 **Web端（JS API）**。
5. 按控制台要求配置安全域名或 Referer 白名单。
6. 保存后，把生成的 Key 写入 `index.html` 中的高德 SDK 地址。

不要选择以下类型来加载网页地图：

- Web服务
- Android平台
- iOS平台
- 微信小程序

这些 Key 的用途和校验方式不同，不能直接替代 Web端（JS API）Key。

### 域名白名单

生产环境至少配置：

```text
my-trip-map-builder.vercel.app
```

本地开发按高德控制台支持的格式增加：

```text
localhost
127.0.0.1
```

填写域名时通常不要包含 `https://`、端口、路径或查询参数；以高德控制台当前提示为准。如果以后绑定自定义域名，也要把新域名加入白名单。

Vercel 的预览部署会生成变化的子域名。若高德控制台不支持合适的通配规则，建议只把正式生产域名加入白名单，并在正式域名上验收地图。

### securityJsCode 安全密钥

部分新建的高德应用会同时提供 `securityJsCode`。如果控制台要求使用安全密钥，必须在加载高德 SDK **之前** 配置：

```html
<script>
  window._AMapSecurityConfig = {
    securityJsCode: '你的_securityJsCode'
  };
</script>
<script src="https://webapi.amap.com/maps?v=2.0&key=你的_KEY"></script>
```

也可以按照高德官方方案使用安全代理 `serviceHost`，避免在前端直接配置安全密钥。是否必须配置、字段名称和代理要求以高德控制台及当前官方文档为准。

当前 Key 已在生产页面成功加载高德地图；如果以后出现 `INVALID_USER_KEY`、`INVALID_USER_DOMAIN`、白屏或安全密钥错误，优先检查：

1. Key 是否为 Web端（JS API）类型；
2. 正式域名是否在白名单；
3. `securityJsCode` 是否要求配置且位于 SDK 脚本之前；
4. Key 是否被删除、禁用、超限或应用状态异常；
5. 浏览器开发者工具 Console 和 Network 中的高德错误信息。

## 修改行程

主要数据位于 `index.html`：

- `HOTEL`：地图初始参考点
- `DAYS`：每日标题、车程、颜色和地点数组
- `overviewContent()`：总览说明、住宿、儿童高原警告

每个地点常用字段：

```js
{
  name: '地点名称',
  lat: 39.4704,
  lng: 75.9858,
  type: 'spot',
  time: '15:00',
  desc: '简短说明',
  detail: '展开后的注意事项',
  xhsKeyword: '小红书搜索词',
  dianpingKeyword: '大众点评搜索词'
}
```

支持的 `type`：

- `spot`：景点
- `hotel`：酒店
- `food`：餐饮
- `drink`：茶饮
- `transport`：交通节点

修改 `index.html` 后，同步静态分享文件：

```bash
cp index.html '南疆自驾9天完整版攻略.html'
zip -q -j -FS '南疆自驾9天完整版攻略.zip' '南疆自驾9天完整版攻略.html'
```

## 导出 PDF

打开页面后点击右下角 **⬇️ 导出 PDF**。页面会生成完整打印稿，包含总览、住宿、车程、景点、餐饮和安全提醒，并自动隐藏地图控件与 App 导航按钮。

在浏览器打印窗口中选择：

1. 目标打印机：**存储为 PDF**；
2. 纸张：A4；
3. 打开“背景图形”（如果希望保留卡片底色）；
4. 点击保存。

导出功能使用浏览器原生 `window.print()`，不依赖服务器、Node.js 或第三方 PDF 库。高德地图画布不嵌入 PDF，避免不同浏览器打印时出现空白；PDF 中保留完整文字路线，实际导航仍使用线上地图页面。

## GitHub 与 Vercel 部署

仓库：<https://github.com/AceInAndroid/MyTripMapBuilder>

Vercel 配置：

- Framework Preset：Other
- Root Directory：`./`
- Build Command：留空
- Output Directory：留空或仓库根目录
- Production Branch：`main`

推送到 `main` 后 Vercel 会自动部署：

```bash
git add .
git commit -m "update trip map"
git push origin main
```

## 上线前检查

- 正式页面能够看到 `© AutoNavi` 版权信息
- 9 个日期标签均可切换
- 景点标记和每日彩色路线能够显示
- 手机定位权限只在 HTTPS 页面申请
- 高德 App 导航按钮可以正常唤起或降级到网页
- 酒店、景点开放、边防证、盘龙古道封路及租车异地还车条件已再次核实

## 许可

MIT
