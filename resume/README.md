# resume/

Drop the public resume here as **`William_Yen_Resume.pdf`** — exactly that name.

The nav item and footer link in `index.html` both point at
`resume/William_Yen_Resume.pdf`. Until that file exists, **both links 404**, so
add it before deploying.

## Keep the filename stable

Recruiters bookmark and forward this URL. Renaming the file later turns into a
404 in someone's inbox three weeks after they saved it. Update the PDF in place;
never rename it.

## Which version

One canonical general resume — not a company-tailored variant. A public copy
reordered for one screener reads oddly to every other company and can contradict
what was submitted elsewhere. Closest current source is the Adobe build
(`William_Yen_Resume_Adobe_MLE_Intern.pdf`).

**Strip the phone number before publishing.** This repo is public; anything
committed here is permanently scrapeable and cannot be unpublished by a later
deletion. Email + LinkedIn are enough for inbound.

## Keep it consistent with the site

The site quotes IBM routing accuracy as **45% → 97% across 14 workflows**,
matching the resume. If one changes, change both — `index.html` and
`Work Experience.dc.html` each carry their own copy of the experience blurbs.
