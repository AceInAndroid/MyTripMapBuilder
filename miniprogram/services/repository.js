var config = require("../config.js");
var seed = require("../data/seed.js");
var date = require("../utils/date.js");

var TRIPS_KEY = "travel-book:trips:v2";
var PROFILE_KEY = "travel-book:profile:v2";
var DELETED_KEY = "travel-book:deleted:v1";
var PENDING_KEY = "travel-book:pending-mutations:v1";
var DESTINATIONS_KEY = "travel-book:destinations:v1";

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function read(key, fallback) {
  try { return wx.getStorageSync(key) || clone(fallback); } catch (error) { return clone(fallback); }
}
function write(key, value) { wx.setStorageSync(key, value); return value; }
function enqueueMutation(action, payload) { var pending = read(PENDING_KEY, []); pending.push({ id: Date.now() + "-" + Math.random(), action: action, payload: clone(payload) }); write(PENDING_KEY, pending); }
function restoreSeedTrips(trips) { return (trips || []).slice(); }

function callCloud(action, data) {
  var app = getApp();
  if (!app.globalData.cloudReady) {
    console.error("[travelBook] CloudBase unavailable", { action: action, envId: config.envId });
    return Promise.reject(new Error("CLOUD_UNAVAILABLE"));
  }
  return wx.cloud.callFunction({ name: config.functions.book, data: { action: action, payload: data || {} } }).then(function (result) {
    var body = result && result.result;
    if (!body || body.ok !== true) {
      var businessError = new Error((body && body.message) || "CLOUD_CALL_FAILED");
      businessError.code = body && body.code || "CLOUD_CALL_FAILED";
      console.error("[travelBook] Cloud function rejected", { action: action, code: businessError.code, message: businessError.message, result: result });
      throw businessError;
    }
    return body.data;
  }).catch(function (error) {
    console.error("[travelBook] Cloud call failed", {
      action: action,
      envId: config.envId,
      functionName: config.functions.book,
      errCode: error && (error.errCode || error.code),
      errMsg: error && (error.errMsg || error.message),
      error: error
    });
    throw error;
  });
}

function bootstrap() {
  var local = { trips: restoreSeedTrips(read(TRIPS_KEY, [])), profile: read(PROFILE_KEY, seed.profile), source: "local" };
  return flushPending().then(function () { return callCloud("bootstrap", {}); }).then(function (data) {
    var cloudTrips = restoreSeedTrips(data.trips || []);
    cloudTrips.forEach(function (trip) { trip.childAge = date.ageAt(data.profile.childBirthday, trip.startDate) || trip.childAge; });
    if (cloudTrips.length) write(TRIPS_KEY, cloudTrips);
    if (data.profile) write(PROFILE_KEY, data.profile);
    return { trips: cloudTrips, profile: data.profile || local.profile, source: "cloud", authorized: true };
  }).catch(function (error) {
    local.trips.forEach(function (trip) { trip.childAge = date.ageAt(local.profile.childBirthday, trip.startDate) || trip.childAge; });
    local.syncError = [error && (error.errCode || error.code), error && (error.errMsg || error.message)].filter(Boolean).join(": ") || "CLOUD_SYNC_FAILED";
    console.error("[travelBook] Bootstrap fell back to local draft", { syncError: local.syncError, error: error });
    local.authorized = false;
    local.trips = []; local.profile = null;
    if (error && (error.code === "ACCESS_DENIED" || error.message === "ACCESS_DENIED")) {
      try { wx.removeStorageSync(TRIPS_KEY); wx.removeStorageSync(PROFILE_KEY); wx.removeStorageSync(DELETED_KEY); wx.removeStorageSync(PENDING_KEY); } catch (clearError) { console.warn("[travelBook] Unable to clear unauthorized cache", clearError); }
    }
    return local;
  });
}

function flushPending() {
  var seedIds = (seed.trips || []).map(function (trip) { return trip.id; }); var pending = read(PENDING_KEY, []).filter(function (mutation) { var tripId = mutation && mutation.payload && mutation.payload.trip && mutation.payload.trip.id; return !tripId || seedIds.indexOf(tripId) < 0; }); var remaining = []; var chain = Promise.resolve();
  pending.forEach(function (mutation) { chain = chain.then(function () { return callCloud(mutation.action, mutation.payload).catch(function () { remaining.push(mutation); }); }); });
  return chain.then(function () { write(PENDING_KEY, remaining); return remaining; });
}

function listTrips() { return bootstrap().then(function (data) { return data.trips; }); }
function getTrip(id) { return listTrips().then(function (trips) { return trips.find(function (trip) { return trip.id === id; }) || null; }); }
function saveTrip(trip) {
  var trips = read(TRIPS_KEY, seed.trips);
  var index = trips.findIndex(function (item) { return item.id === trip.id; });
  trip.updatedAt = new Date().toISOString();
  if (index >= 0) trips[index] = trip; else trips.unshift(trip);
  write(TRIPS_KEY, trips);
  return callCloud("saveTrip", { trip: trip }).catch(function () { enqueueMutation("saveTrip", { trip: trip }); return { queued: true }; }).then(function () { return trip; });
}
function saveDiary(tripId, dayId, diary) {
  return getTrip(tripId).then(function (trip) {
    if (!trip) throw new Error("TRIP_NOT_FOUND");
    var day = trip.days.find(function (item) { return item.id === dayId; });
    if (!day) throw new Error("DAY_NOT_FOUND");
    day.diary = diary;
    return saveTrip(trip);
  });
}
function getProfile() { return bootstrap().then(function (data) { return data.profile; }); }
function saveProfile(profile) {
  write(PROFILE_KEY, profile);
  return callCloud("saveProfile", { profile: profile }).catch(function () { enqueueMutation("saveProfile", { profile: profile }); return { queued: true }; }).then(function () { return profile; });
}
function createShare(trip) {
  return callCloud("createShare", { tripId: trip.id });
}
function deleteTrip(id) {
  var trips = read(TRIPS_KEY, seed.trips); var deleted = read(DELETED_KEY, []);
  var index = trips.findIndex(function (trip) { return trip.id === id; });
  if (index >= 0) { var trip = trips.splice(index, 1)[0]; trip.deletedAt = new Date().toISOString(); deleted.unshift(trip); write(TRIPS_KEY, trips); write(DELETED_KEY, deleted); }
  return callCloud("deleteTrip", { tripId: id }).catch(function () { enqueueMutation("deleteTrip", { tripId: id }); return { queued: true }; });
}
function listDeleted() { return callCloud("listDeleted", {}).catch(function () { return read(DELETED_KEY, []); }); }
function restoreTrip(id) {
  var deleted = read(DELETED_KEY, []); var trips = read(TRIPS_KEY, seed.trips);
  var index = deleted.findIndex(function (trip) { return trip.id === id; });
  if (index >= 0) { var trip = deleted.splice(index, 1)[0]; delete trip.deletedAt; trips.unshift(trip); write(DELETED_KEY, deleted); write(TRIPS_KEY, trips); }
  return callCloud("restoreTrip", { tripId: id }).catch(function () { enqueueMutation("restoreTrip", { tripId: id }); return { queued: true }; });
}
function getShare(token) {
  return callCloud("getShare", { token: token });
}
function revokeShare(token) { return callCloud("revokeShare", { token: token }); }
function listShares() { return callCloud("listShares", {}); }

function inviteParent() {
  return callCloud("createInvite", {});
}
function createReviewInvite() { return callCloud("createReviewInvite", {}); }
function revokeReviewAccess() { return callCloud("revokeReviewAccess", {}); }
function joinFamily(code) { return callCloud("joinFamily", { code: String(code || "").trim().toUpperCase() }); }
function listDestinations(status) { return callCloud("listDestinations", status ? { status: status } : {}).catch(function () { var items = read(DESTINATIONS_KEY, seed.destinations || []); return status ? items.filter(function (item) { return item.status === status; }) : items; }); }
function getDestination(destinationId) { return callCloud("getDestination", { destinationId: destinationId }).catch(function () { var destination = (seed.destinations || []).find(function (item) { return item.id === destinationId; }); if (!destination) throw new Error("DESTINATION_NOT_FOUND"); var items = []; (seed.trips || []).forEach(function (trip) { (trip.days || []).forEach(function (day) { (day.locations || []).forEach(function (place, index) { items.push({ id: trip.id + "-" + day.id + "-" + index, destinationId: destination.id, type: place[5] === "美食" ? "food" : place[5] === "景点" ? "attraction" : place[5] === "住宿" ? "hotel" : "transport", title: place[0], summary: place[4], latitude: place[1], longitude: place[2], status: trip.status === "completed" ? "visited" : "planned", verifyRequired: /开放|预约|供氧|封闭|核验|确认/.test(place[4]) }); }); }); }); return { destination: destination, items: items }; }); }

module.exports = { bootstrap: bootstrap, flushPending: flushPending, listTrips: listTrips, getTrip: getTrip, saveTrip: saveTrip, saveDiary: saveDiary, getProfile: getProfile, saveProfile: saveProfile, createShare: createShare, getShare: getShare, listShares: listShares, revokeShare: revokeShare, inviteParent: inviteParent, createReviewInvite: createReviewInvite, revokeReviewAccess: revokeReviewAccess, joinFamily: joinFamily, deleteTrip: deleteTrip, listDeleted: listDeleted, restoreTrip: restoreTrip, listDestinations: listDestinations, getDestination: getDestination };
