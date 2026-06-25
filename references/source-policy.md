# Source policy

## Match data

Use football-data.org competition code `WC` as the primary structured feed. Fetch only through the local script so the API token stays out of HTML.

Use the FIFA tournament scores and fixtures page for manual cross-checking when:

- a kickoff changes;
- a match is postponed, cancelled, or suspended;
- the structured feed conflicts with a recent trusted report.

Never fill missing goals, scorers, lineups, venues, or statuses from inference. Preserve the raw response in the cache envelope.

## News

Priority order:

1. FIFA, national federations, teams, and official tournament statements.
2. Reuters and AP.
3. BBC, ESPN, and similarly edited sports desks.

Every story needs a working URL, source, publication time, title, and original summary. Prefer sources published or materially updated within the previous 48 hours.

For injury, suspension, selection, or lineup claims, prefer an official statement or two independent edited sources. Otherwise mark the claim unconfirmed in both the data and visible summary.

Do not use search-result snippets as the sole evidence. Do not reproduce article bodies or use publisher images without permission.
