---
name: travel-route-importer
description: Convert a computer-planned family trip into the MyTripMapBuilder route model, add it to the mini program, and safely synchronize it to CloudBase. Use when the user asks to import, add, revise, or publish a trip itinerary or route for the family travel mini program.
---

# Travel Route Importer

Use this workflow for travel plans created on the computer. The mini program is a viewer and recorder for routes, maps, photos, diaries, and shares; never add trip-creation, generative AI, or chat-planning UI to it.

## Required workflow

1. Inspect `miniprogram/data/seed.js`, `miniprogram/services/repository.js`, `cloudfunctions/travelBook/index.js`, and the trip detail map contract.
2. Read [references/trip-schema.md](references/trip-schema.md) before creating or changing route data.
3. Convert the supplied plan into one complete trip object. Ask only for missing facts that materially change dates, routing, safety, or coordinates. Mark uncertain facts with `verifyRequired: true` rather than inventing them.
4. Use a stable ID: `<region-or-theme>-<start-year>-<start-date>`. An update must retain its ID so photos and diaries remain attached. Never reuse another trip's ID.
5. Add the trip to the exported `trips` array in `miniprogram/data/seed.js`. Preserve existing trips and user-authored diary/photo fields when revising an existing trip.
6. Export the candidate trip as JSON and run `node .codex/skills/travel-route-importer/scripts/validate-trip.js <trip-json>`. Fix every error before database work.
7. Run JS syntax checks, WXML compilation for itinerary/detail pages, and `git diff --check`. In the simulator verify exactly one card, overview and daily map routes, diary/photo entry points, and absence of create-plan or AI UI.
8. Synchronize using the existing `travelBook.saveTrip` contract where possible. The `trips` document uses the trip ID as `_id`, query fields at the top level, and the complete object in `payload`.
9. Before a direct CloudBase write, resolve the target family from existing `profiles`/`families`; never guess `familyId`, overwrite another family's document, or commit credentials. Read the existing document first and preserve `createdAt`, photos, and diaries unless replacement is explicitly requested.
10. If CloudBase is unavailable or third-party-managed, keep the local fallback working, report that cloud synchronization was not verified, and stop retrying after the same authorization failure. Never claim database success from a simulator result.
11. Commit, push, upload an experience build, or submit for review only when the user requests that external action.

## Route quality rules

- Dates are continuous and `dayCount` equals `days.length`.
- Every place has a real name, finite latitude/longitude, time, type, and useful description.
- Coordinates are WGS84; the detail page converts them to GCJ-02. Do not pre-convert.
- Place order follows actual driving order. Include accommodation/transport endpoints when they explain the route.
- Driving estimates state whether stops are excluded.
- For children, flag altitude, weather, long transfers, fatigue, food/water, and fallback decisions.
- New imports normally use `status: "planned"`; only a parent action marks them `completed`.
- Planned trips appear in the itinerary list but not as completed footprints.

## Completion report

State the trip ID/title/day count, changed files, validation evidence, database synchronization result, Git/upload result if requested, and facts still requiring verification.
