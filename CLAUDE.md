# Wedding Snipe (Bathouse Hockey League)

Fantasy hockey league site for 14 GMs. v2 rebuild in progress; v1 is frozen as a fallback.

## Layout
- `web-app/` — the site. Static HTML/CSS/JS, no build step, no framework. Deployed by Cloud Build (`cloudbuild.yaml`) via `gsutil rsync` to `gs://wedding-snipe-countdown-site`.
  - `data/*.json` — league data committed to the repo (`contracts.json` = rosters, source of NHL player IDs).
  - `data/player-stats.json` — written by the stats job, NOT committed; rsync excludes it so deploys don't delete it.
  - `js/scoring.js` — the league fantasy-point formula. Single source of truth.
  - `v1/` — the old site, untouched. Reachable at `/v1/`. Delete when v2 reaches parity.
- `stats-job/` — Cloud Run job. Reads `data/contracts.json` from the bucket, hits the NHL API, writes `data/player-stats.json`. Run on a Cloud Scheduler cron.
- `endpoint/` — v1 Cloud Run service (`nhl-stats-cacher`). Still serves v1 (sidebets, Gemini "Bimmbot", NHL proxies). To be trimmed to only what v2 needs.

## Conventions
- Pages `fetch()` JSON; never use the Firebase client SDK for stats. Firestore is only for human-written data (sidebets, matchups).
- Relative paths only in HTML (`css/site.css`, not `/css/site.css`).
- Shared nav is injected by `js/nav.js`; add new pages to `LINKS` there.
- Keep it simple. Prefer one clear file over an abstraction.

## Commands
- Local preview: `cd web-app && python3 -m http.server 8000` (module scripts need http, not file://).
- Stats job, run locally: `cd stats-job && npm install && npm start` (needs `gcloud auth application-default login`).
- Deploy job: `gcloud run jobs deploy stats-job --source stats-job --region us-west1 --project wedding-snipe`
- Run it once: `gcloud run jobs execute stats-job --region us-west1 --project wedding-snipe`
- Scheduler: `gcloud scheduler jobs create http stats-job-hourly --schedule "0 * * * *" --uri "https://us-west1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/wedding-snipe/jobs/stats-job:run" --http-method POST --oauth-service-account-email <compute-sa>@developer.gserviceaccount.com --location us-west1 --project wedding-snipe`
