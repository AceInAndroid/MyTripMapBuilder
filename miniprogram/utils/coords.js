function outOfChina(lng, lat) { return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271; }

function wgs84ToGcj02(lng, lat) {
  if (outOfChina(lng, lat)) return [lng, lat];
  var a = 6378245.0;
  var ee = 0.00669342162296594323;
  var pi = Math.PI;
  var dLat = -100 + 2 * lng + 3 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  dLat += (20 * Math.sin(6 * lng * pi) + 20 * Math.sin(2 * lng * pi)) * 2 / 3;
  dLat += (20 * Math.sin(lat * pi) + 40 * Math.sin(lat * pi / 3)) * 2 / 3;
  dLat += (160 * Math.sin(lat * pi / 12) + 320 * Math.sin(lat * pi / 30)) * 2 / 3;
  var dLng = 300 + lng + 2 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  dLng += (20 * Math.sin(6 * lng * pi) + 20 * Math.sin(2 * lng * pi)) * 2 / 3;
  dLng += (20 * Math.sin(lng * pi) + 40 * Math.sin(lng * pi / 3)) * 2 / 3;
  dLng += (150 * Math.sin(lng * pi / 12) + 300 * Math.sin(lng * pi / 30)) * 2 / 3;
  var radLat = lat / 180 * pi;
  var magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  var sqrtMagic = Math.sqrt(magic);
  dLat = dLat * 180 / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
  dLng = dLng * 180 / (a / sqrtMagic * Math.cos(radLat) * pi);
  return [lng + dLng, lat + dLat];
}

module.exports = { wgs84ToGcj02: wgs84ToGcj02 };
