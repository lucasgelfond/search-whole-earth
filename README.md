Welcome to the source! This repo is broken up into three folders
- `backend/` which is a light server that embeds queries (with Together.ai) and makes calls out to Turbopuffer, which I use for the db here
- `frontend/` which is a Svelte client / interface for search and navigation around the issues.
- `processing/` which has all of the ephemeral scripts I used to process  and scrape data here. There's a separate README there that explains many of the decisions here.

The frontend and backend are both deployed on Cloudflare Workers through the GitHub Actions on here.

Thanks again to [Barry Threw](https://barrythrew.com/) and [Hannah Scott](https://hannahmscott.github.io/) at Gray Area for their help, and much credit to [Jon Gacnik](https://jongacnik.com/) and [Mindy Seu](https://mindyseu.com/) for their design on the original site, [wholeearth.info](https://wholeearth.info/). 