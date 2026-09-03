# resume/

`William_Yen_Resume.pdf` is the public copy, linked from the nav and footer of
`index.html`.

## Keep the filename stable

Recruiters bookmark and forward this URL. Renaming the file later turns into a
404 in someone's inbox three weeks after they saved it. Replace the PDF in
place; never rename it.

## The phone number is stripped — keep it that way

The source PDF carries a phone number in the header. It has been removed from
this copy, and the three contact links plus the header centring were shifted to
match. **Re-exporting from LaTeX or Overleaf will put it back**, so strip it
again before replacing this file. This repo is public: anything committed here
is permanently scrapeable and a later deletion does not unpublish it. Email and
LinkedIn are enough for inbound.

## One canonical version

Keep this as a general resume, not a company-tailored variant. A public copy
reordered for one screener reads oddly to every other company and can
contradict what was submitted elsewhere.

## Keep it consistent with the site

The site quotes IBM routing accuracy as **33% → 97% across 14 workflows**,
matching this resume. Note the Adobe variant in `~/Downloads` says **45%** for
the same bullet — the two disagree, and only one can be right. If you correct
it, update `index.html` and `Work Experience.dc.html`, which each carry their
own copy of the experience blurbs.
