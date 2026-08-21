#!/usr/bin/env node
"use strict";

const fs = require("fs");
const file = process.argv[2];
if (!file) { console.error("Usage: node validate-trip.js <trip.json>"); process.exit(2); }
let trip;
try { trip = JSON.parse(fs.readFileSync(file, "utf8")); }
catch (error) { console.error("Invalid JSON:", error.message); process.exit(2); }

const errors = [];
const required = (object, keys, label) => keys.forEach(key => { if (object[key] === undefined || object[key] === null || object[key] === "") errors.push(`${label}.${key} is required`); });
const isoDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const dateAt = (start, offset) => { const value = new Date(`${start}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + offset); return value.toISOString().slice(0, 10); };

required(trip, ["id", "title", "status", "startDate", "endDate", "dayCount", "representative", "days"], "trip");
if (!/^[a-z0-9-]+$/.test(String(trip.id || ""))) errors.push("trip.id must use lowercase letters, numbers, and hyphens");
if (!isoDate(trip.startDate) || !isoDate(trip.endDate)) errors.push("trip dates must use YYYY-MM-DD");
if (!Array.isArray(trip.days)) errors.push("trip.days must be an array");
else {
  if (trip.dayCount !== trip.days.length) errors.push("trip.dayCount must equal trip.days.length");
  trip.days.forEach((day, index) => {
    const label = `trip.days[${index}]`;
    required(day, ["id", "dayNumber", "date", "city", "title", "distance", "drive", "places", "diary", "photos"], label);
    if (day.dayNumber !== index + 1) errors.push(`${label}.dayNumber must be ${index + 1}`);
    if (isoDate(trip.startDate) && day.date !== dateAt(trip.startDate, index)) errors.push(`${label}.date must be ${dateAt(trip.startDate, index)}`);
    if (!Array.isArray(day.places) || !day.places.length) errors.push(`${label}.places must contain at least one place`);
    else day.places.forEach((place, placeIndex) => {
      const placeLabel = `${label}.places[${placeIndex}]`;
      required(place, ["id", "name", "latitude", "longitude", "time", "description", "type", "verifyRequired"], placeLabel);
      if (!Number.isFinite(Number(place.latitude)) || Number(place.latitude) < -90 || Number(place.latitude) > 90) errors.push(`${placeLabel}.latitude is invalid`);
      if (!Number.isFinite(Number(place.longitude)) || Number(place.longitude) < -180 || Number(place.longitude) > 180) errors.push(`${placeLabel}.longitude is invalid`);
    });
  });
}
if (isoDate(trip.startDate) && Array.isArray(trip.days) && trip.days.length && trip.endDate !== dateAt(trip.startDate, trip.days.length - 1)) errors.push("trip.endDate must match the last day");
if (errors.length) { errors.forEach(error => console.error("ERROR", error)); process.exit(1); }
console.log(`OK ${trip.id}: ${trip.days.length} days, ${trip.days.reduce((sum, day) => sum + day.places.length, 0)} places`);
