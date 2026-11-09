# MOVINCAM.ART — Quotation Studio

A focused quotation-making web app for a photography and videography studio.

## Included in this starter

- Client details and quotation dates
- Multiple events in one quotation
- Separate venue, date, timing and team counts for every event
- Photographer and videographer counts per event
- Custom line items, quantities and prices
- Standard service price catalogue
- Per-quotation price overrides (catalogue prices are not changed)
- One combined grand total in the PDF (Option 1)
- Overall discount, notes and terms
- Save, search, edit, duplicate and delete quotations
- Professional charcoal / champagne-gold PDF export
- Local browser storage fallback
- Supabase database integration scaffold
- GitHub Pages deployment configuration

## Run locally

1. Install Node.js 20 or newer.
2. Extract this ZIP.
3. Open a terminal in the project folder.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL shown by Vite.

## Connect Supabase

1. Create a Supabase project.
2. Open **Project Settings → API** and copy the Project URL and anon/public key.
3. Copy `.env.example` to `.env`.
4. Add your values:

   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   VITE_BASE_PATH=/YOUR-GITHUB-REPOSITORY/
   ```

5. Open `supabase/schema.sql`.
6. Replace `OWNER_EMAIL@example.com` with the owner's login email, then run the SQL in Supabase SQL Editor.

### Important backend note

This ZIP is a usable frontend starter with local browser saving and a Supabase database connection scaffold. It does **not yet include an admin login screen**. Before putting real client data online, implement Supabase Auth and enforce owner-only access. Never put a Supabase `service_role` key in a browser app.

The app currently uses local storage when Supabase is not configured. Local data stays in that browser/device and is not shared across devices.

## Deploy to GitHub Pages

1. Create a GitHub repository, for example `movincam-quotation`.
2. Upload the project files to the repository.
3. In `.env` / GitHub Actions environment, set `VITE_BASE_PATH=/movincam-quotation/`.
4. Build the app:

   ```bash
   npm install
   npm run build
   ```

5. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the source.
6. Add the workflow below as `.github/workflows/deploy.yml`.

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_BASE_PATH: /${{ github.event.repository.name }}/
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

7. Add GitHub repository secrets under **Settings → Secrets and variables → Actions**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Current PDF behavior

The PDF shows all event dates, locations, team counts and coverage details, then displays one combined grand total at the end. Individual event prices are intentionally not displayed (Option 1).

## Suggested next development step

Add a Supabase Auth owner login screen, then save quotations securely in the cloud so the owner can access them from any device.
