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
  "days": [],
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp"
}
```

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
