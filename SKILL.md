---
name: world-cup-daily
description: Create personalized Chinese FIFA World Cup daily briefings from current, sourced match and news data, render mobile-friendly standalone HTML, add matches to calendars, manage team/player preferences, and set up or update a Codex daily automation. Use when a user asks for World Cup scores, schedules, viewing recommendations, a daily football digest, match reminders, or wants to initialize or change their World Cup preferences.
---

# World Cup Daily

Build a sourced, personalized World Cup morning briefing without inventing scores, schedules, injuries, lineups, or news.

## Route the request

- If `.world-cup-daily/profile.json` is missing, run **First use**.
- If the user asks to change teams, players, timezone, delivery time, reminder time, or density, run **Change preferences**.
- If the user asks for today's briefing or an automation is running, run **Generate a digest**.
- If the user asks for daily delivery, run **Set up the automation** after the profile exists.

## First use

Ask for these values, grouping questions naturally:

1. Favorite teams, allowing multiple entries or none.
2. Followed players, allowing multiple entries or none.
3. IANA timezone. Detect the system timezone, then ask the user to confirm it.
4. Daily delivery time, default `08:00`.
5. Reminder lead time in minutes, default `30`.
6. Density: `compact`, `balanced`, or `deep`; default `balanced`.

Create `.world-cup-daily/cache/` and `.world-cup-daily/digests/` in the user's chosen workspace. Write `.world-cup-daily/profile.json` using the contract in [references/data-contract.md](references/data-contract.md). Never put an API token in this file.

Tell the user to define `FOOTBALL_DATA_API_TOKEN` in the environment used by the automation. If it is unavailable, do not claim that current match data was fetched.

## Change preferences

Treat preference editing as a supported primary workflow, not a reinstall.

- Read the existing profile and show only the fields the user wants to change.
- Preserve all unspecified fields and update `updatedAt`.
- Accept changes initiated from the digest's “修改偏好” panel. The panel can save or download a replacement `profile.json`, and can copy a ready-to-send Codex instruction.
- When `dailyDeliveryTime` or `timezone` changes, explain that the existing automation schedule must also change. Inspect and update the existing automation only after the user confirms the new schedule.
- Regenerate the digest when the user asks to preview the effect immediately.

## Generate a digest

Read [references/source-policy.md](references/source-policy.md) and [references/editorial-policy.md](references/editorial-policy.md) before researching.

1. Determine the profile's local yesterday, today, and tomorrow boundaries.
2. Fetch match data:

   ```bash
   node scripts/fetch-matches.mjs \
     --profile .world-cup-daily/profile.json \
     --cache .world-cup-daily/cache/matches.json \
     --out .world-cup-daily/cache/matches-latest.json
   ```

3. Research 3–5 current stories with web access. Prefer official FIFA, team, and federation sources, followed by Reuters, AP, BBC, and ESPN. Write `.world-cup-daily/cache/news.json` to the news contract. Use fewer stories when reliable stories are unavailable. Do not copy article bodies.
4. Normalize and rank:

   ```bash
   node scripts/normalize-data.mjs \
     --profile .world-cup-daily/profile.json \
     --matches .world-cup-daily/cache/matches-latest.json \
     --news .world-cup-daily/cache/news.json \
     --out .world-cup-daily/cache/digest-data.json
   ```

5. Render and validate:

   ```bash
   node scripts/render-digest.mjs \
     --data .world-cup-daily/cache/digest-data.json \
     --template assets/digest-template.html \
     --out .world-cup-daily/digests/YYYY-MM-DD.html

   node scripts/validate-digest.mjs \
     --html .world-cup-daily/digests/YYYY-MM-DD.html
   ```

6. Return a clickable link to the HTML file and a compact text summary. State whether the match feed is live or cached and include its fetch time.

Only put `FINISHED` matches from the user's local yesterday in “昨日战况”. Show postponed, cancelled, or suspended matches prominently in today/tomorrow sections. Convert UTC kickoff times with the profile's IANA timezone.

## Set up the automation

Propose one Codex daily automation per user after first-use setup. Use the profile's timezone and delivery time. The automation prompt must:

- invoke `$world-cup-daily`;
- generate the current day's digest in the configured workspace;
- research current news with citations;
- validate the HTML;
- return the HTML link and disclose live versus cached data.

Do not create or change an automation without user confirmation. Prefer updating an existing matching automation over creating a duplicate.

## Failure behavior

- If the live match request fails and a cache exists, use it and label the digest “缓存数据” with its timestamp.
- If no live data or cache exists, stop match rendering and clearly report the missing data. Never create substitute fixtures.
- If fewer than three reliable news stories are found, render fewer stories.
- Never expose `FOOTBALL_DATA_API_TOKEN`, local secrets, or article body text in HTML.

