# GraphQL Profile

A static single-page profile app for reboot01 students. Logs in with platform credentials, fetches personal data from the GraphQL API, and renders it as a profile page with SVG statistics graphs.

**Live:** https://backon74.github.io/graphql/

## Features

- Login with username or email + password using JWT authentication
- Profile sections: identity, XP, audits, and recently passed projects
- Two SVG graphs: cumulative XP over time and audit ratio comparison
- Session persistence — a stored JWT skips the login screen on reload
- Logout clears the session and returns to the login view

## GraphQL queries

The project uses all three required query styles:

- **Normal query** — flat user fields (id, login, firstName, lastName, email)
- **Nested query with arguments** — XP transactions joined to project object names, ordered by date
- **Query with arguments** — up/down audit transactions filtered by type

## Tech

- Vanilla HTML, CSS, and JavaScript — no frameworks, no build step
- ES modules loaded directly in the browser
- SVG graphs drawn by hand from live query data, no charting library
- Hosted on GitHub Pages

## Run locally

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
