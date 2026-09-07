# MyTripMapBuilder trip schema

The client trip object is also stored as the CloudBase `trips.payload` value.

## Trip

Required structure:

```json
{
  "id": "yunnan-2027-02-03",
  "title": "云南 7 日亲子旅行",
  "subtitle": "昆明进 · 丽江出",
  "status": "planned",
  "startDate": "2027-02-03",
  "endDate": "2027-02-09",
  "dateRange": "2027.02.03 — 2027.02.09",
  "dayCount": 7,
  "childAge": "6岁",
  "travelers": "4位大人 + 2位儿童",
  "transport": "7座 MPV",
  "coverColor": "#E5A75D",
  "coverLabel": "古城 · 雪山 · 湖泊",
  "representative": { "name": "丽江古城", "latitude": 26.8721, "longitude": 100.2325 },
  "memory": "一句首页回忆文案。",
  "progress": 80,
  "photoCount": 0,
  "footprintCount": 0,
  "aiGenerated": false,
  "needsVerification": true,
  "foodNotes": [],
  "notes": [],
  "days": [],
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp"
}
```

## Trip notes

Use `notes` for rich reference material that belongs to the whole trip but must not
become a daily route stop, map marker, or navigation waypoint:

```json
{
  "id": "kashgar-bazaar-guide",
  "region": "喀什",
  "title": "喀什各乡镇巴扎指南",
  "summary": "巴扎是当地乡民买卖、交换物资的传统集市。",
  "blocks": [{ "type": "paragraph", "html": "通常约10:00—20:00，建议11:30左右到达。" },
    { "type": "table", "columns": ["星期", "巴扎"], "rows": [["周日", "喀什牛羊大巴扎"]] }],
  "verifyRequired": true,
  "updatedAt": "ISO-8601 timestamp"
}
```

Notes are informational only. Never copy them into `days[].places` unless the
user explicitly promotes one item into the itinerary.

## Food notes

Use `foodNotes` for food guides that remain separate from the daily route. They
use the same structured `blocks` as trip notes, including headings, paragraphs,
lists, tables, and callouts. A food recommendation is not a map marker or
navigation waypoint unless the user explicitly adds it to `days[].places`.
Prices, opening times, addresses, stall descriptions, and availability should
normally set `verifyRequired: true`.

## Day and place

```json
{
  "id": "yunnan-2027-02-03-day-1",
  "dayNumber": 1,
  "date": "2027-02-03",
  "city": "昆明",
  "title": "抵达与轻松适应",
  "distance": "约35 km",
  "drive": "纯驾驶约50分钟，不含用餐和停车",
  "tip": "不生成独立地图点位的当日路线提示，可选。",
  "warning": "儿童当天只安排低强度活动。",
  "places": [{
    "id": "yunnan-2027-02-03-day-1-place-1",
    "name": "昆明长水国际机场",
    "latitude": 25.1019,
    "longitude": 102.9292,
    "time": "按航班",
    "description": "取车并检查儿童安全座椅。",
    "type": "交通",
    "verifyRequired": false
  }],
  "diary": { "parentNote": "", "childQuote": "", "favorite": "", "photoStory": "", "updatedAt": "" },
  "photos": []
}
```

Recommended place types: `交通`, `住宿`, `景点`, `美食`, `活动`.

## CloudBase document

`trips` stores `_id` equal to the trip ID, resolved `familyId`, `status`, `startDate`, `endDate`, `title`, `representative`, the complete `payload`, `deletedAt`, `createdAt`, and `updatedAt`. Preserve `createdAt` on updates. The cloud function derives `familyId` from authenticated WeChat identity; direct administrative writes must resolve the correct family first.
