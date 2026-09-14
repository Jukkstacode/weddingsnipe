# Wedding Snipe (Bathouse Hockey League)

Fantasy hockey league site for 14 GMs. v2 rebuild in progress; v1 is frozen as a fallback.

## Layout
- `web-app/` — the site. Static HTML/CSS/JS, no build step, no framework. Deployed by Cloud Build (`cloudbuild.yaml`) via `gsutil rsync` to `gs://wedding-snipe-countdown-site`.
  - `data/player-stats.json` — written by the stats job, NOT committed; rsync excludes it so deploys don't delete it.
  - `js/scoring.js` — the league fantasy-point formula. Single source of truth.
  - `admin/` — signed-in pages (Google auth, allowlisted emails in `firestore.rules`).
  - `v1/` — the old site, untouched. Reachable at `/v1/`. Delete when v2 reaches parity.
- `stats-job/` — Cloud Run job. Reads player IDs from the Firestore `contracts` collection, hits the NHL API, writes `data/player-stats.json`. Run on a Cloud Scheduler cron.
- `firestore.rules` — public read everywhere; client writes only to `contracts` by allowlisted admins. Deploy with `npx firebase-tools deploy --only firestore:rules --project wedding-snipe`.
- `scripts/` — one-off maintenance scripts (run with `node scripts/<name>.mjs` after `npm install` in `scripts/`).
- `endpoint/` — v1 Cloud Run service (`nhl-stats-cacher`). Still serves v1 (sidebets, Gemini "Bimmbot", NHL proxies). To be trimmed to only what v2 needs.

## Conventions
- Pages `fetch()` JSON; never use the Firebase client SDK for stats. Firestore is only for human-written data (`contracts`, sidebets, matchups); pages read it with the modular SDK via `js/firebase.js`.
- Relative paths only in HTML (`css/site.css`, not `/css/site.css`).
- Shared nav is injected by `js/nav.js`; add new pages to `LINKS` there. Paths in `LINKS` are site-root-relative; the script resolves them so nested pages (e.g. `admin/`) work.
- Contract doc shape (`contracts/{nhlId}`): `{ nhlId, gm, player, position, team, years, stolen, updatedAt, updatedBy }`. GM names live in `js/league.js`.
- Keep it simple. Prefer one clear file over an abstraction.

## Commands
- Local preview: `cd web-app && python3 -m http.server 8000` (module scripts need http, not file://).
- Stats job, run locally: `cd stats-job && npm install && npm start` (needs `gcloud auth application-default login`).
- Deploy job: `gcloud run jobs deploy stats-job --source stats-job --region us-west1 --project wedding-snipe`
- Run it once: `gcloud run jobs execute stats-job --region us-west1 --project wedding-snipe`
- Scheduler: `gcloud scheduler jobs create http stats-job-hourly --schedule "0 * * * *" --uri "https://us-west1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/wedding-snipe/jobs/stats-job:run" --http-method POST --oauth-service-account-email <compute-sa>@developer.gserviceaccount.com --location us-west1 --project wedding-snipe`
