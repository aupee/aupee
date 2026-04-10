# PulseScalp Pro

Professional crypto scalping analysis dashboard for Netlify.

## What it does
- Frontend: premium dark dashboard in pure HTML, CSS, and vanilla JS
- Backend: Netlify Functions in Node.js
- Click-to-analyze only
- Futures/perpetual market focus
- Multi-exchange fallback using official public market-data endpoints
- Coin list loading for many USDT futures pairs

## Deployment
1. Upload to GitHub
2. Connect repository to Netlify
3. Netlify will auto-deploy on every push

## Files
- `index.html`
- `styles.css`
- `app.js`
- `netlify/functions/analyze.js`
- `netlify/functions/symbols.js`
- `netlify.toml`

## Notes
This version does not try to bypass exchange protections or spoof requests. It uses official public endpoints and graceful fallback.
