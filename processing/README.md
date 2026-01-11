These are all of the Python scripts I used for scraping. These aren't maintained or meant to be regularly usable; in fact I built this all fairly out of order.

My initial approach was to use Supabase, their internal pg-vector, and Cloudinary. I ended up ripping these out and instead using Turbopuffer and Cloudflare R2. The reason was:
- Cloudinary was super expensive! I was paying $100/mo for personal use when I went over their free plan. 
- Embeddings were really slow in the old setup. I was using a Supabase edge function that would calculate embeddings with their `Supabase/gte-small` model. I could've spun up something on a GPU somewhere to serve these queries, but I think this would've been overbuilt / I didn't want to build an inference pipeline, so I was restricted to models people already have severless endpoints for — none having `Supabase/gte-small`. Together.ai serves`BAAI/bge-base-en-v1.5` and I have had good experiences with it before, so I swapped / re-embedded everything with it.
- I integrated Turbopuffer elsewhere and was really impressed by its performance characteristics and how ergonomic the APIs were. Their founder [Simon](https://sirupsen.com/) has given [great talks](https://www.youtube.com/watch?v=_yb6Nw21QxA) and is clearly really sharp. As such, I decided to migrate, adding a  `uploaded_to_turbopuffer_at` column on the page table in Supabase, running a batch job on my laptop to upload them all up, and then removing Supabase entirely.


A bit of a guide to this directory:
- `scrape-and-download.py` traverses the Whole Earth Index site to download each issue PDF.
- `issue-metadata.py` gets the links / description from the Whole Earth Index site.
- `check-complete.py` would check how many PDFs had been scraped.
- `upload-images.py` would extract each individual page from a PDF, create a page row, and upload it to Cloudinary.
- `percent-complete.py` would check the page splitting process progres.
- `make_pages.py` and `fix-page-numbers.py` would add the total `num_pages` to each `issue` record. The first pass of scraping didn't get everything.
- `generate-embeddings.js` was my initial embedding pass locally/on CPU with the `Supabase/gte-small` model.
- `generate-bge-embeddings.py` was my second embedding pass, using Together.ai and the `BAAI/bge-base-en-v1.5` model
- `migrate-page-to-r2.py` would temp download the Cloudinary page images and upload them to R2. A nice optimization here probably would've just been to fetch the id (the `r2_object_id` is just `pages/{page_id}`), but I wanted to keep the whole thing in the DB to verify I'd uploaded everything.
- `turbopuffer-page.py` fetches a batch of page records, uploads them to R2, and marks them as uploaded in the database. 

All of these are 'ephemeral' scripts, not really meant to be run multiple times, basically all are AI generated. Many of them follow 'meh' code practices, i.e. many will not check certain environment variables exist, make a lot of assumptions about the underlying data, etc. Use at your own risk! 
