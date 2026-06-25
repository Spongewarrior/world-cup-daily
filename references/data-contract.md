# Data contracts

## `profile.json`

```json
{
  "version": 1,
  "favoriteTeams": ["Argentina"],
  "favoritePlayers": ["Lionel Messi"],
  "timezone": "Asia/Shanghai",
  "dailyDeliveryTime": "08:00",
  "reminderMinutes": 30,
  "density": "balanced",
  "updatedAt": "2026-06-23T00:00:00.000Z"
}
```

Requirements:

- Use IANA timezone names.
- Use `HH:mm` local wall-clock format.
- Allow `compact`, `balanced`, or `deep`.
- Keep team/player names as user-facing strings; matching is case-insensitive.
- Set reminder minutes to an integer from 0 through 1440.

## Match-fetch envelope

```json
{
  "meta": {
    "source": "football-data.org",
    "sourceUrl": "https://api.football-data.org/v4/competitions/WC/matches",
    "fetchedAt": "ISO-8601",
    "isCached": false,
    "cacheReason": null
  },
  "data": {}
}
```

`data` is the unmodified API response. Keeping the original response supports audits.

## `news.json`

```json
{
  "fetchedAt": "ISO-8601",
  "items": [
    {
      "title": "Article title",
      "summary": "An original Chinese paraphrase.",
      "source": "FIFA",
      "publishedAt": "ISO-8601",
      "url": "https://example.com/article",
      "relatedTeams": [],
      "relatedPlayers": [],
      "verification": "confirmed"
    }
  ]
}
```

`verification` is `confirmed` or `unconfirmed`. Use `unconfirmed` only when the story itself is relevant and the uncertainty is explicitly stated.

## Normalized digest

The normalizer emits:

- `meta`: local date, timezone, generation timestamp, data freshness and sources.
- `profile`: the public preference values used by the HTML settings panel.
- `headline`: personalized title and summary.
- `yesterdayResults`, `todayMatches`, `tomorrowMatches`.
- `news`: validated and ranked news entries.

Each match contains a stable `uid`, UTC kickoff, local display values, teams, score, stage, venue, status, recommendation reason, source name, and source URL. `homeTeam` and `awayTeam` should be Chinese display names when a known translation is available; fall back to the upstream name only when the team is not covered by the translation table.
