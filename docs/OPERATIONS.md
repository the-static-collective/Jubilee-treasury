# Jubilee landing page — provisional operations

Case JUB-HON-001. This is a static conditional-pledge intake page, not a payment service or authenticated Treasury record.

## Release
1. Obtain permission from the beneficiary to circulate the public-safe appeal; keep personal details, land documents and exact locations private.
2. In repository Settings > Pages choose Deploy from a branch, main, /docs. Verify the generated Pages URL over HTTPS.
3. If using jubilee.abundent.org, configure the custom domain in Pages and its CNAME at the authoritative DNS provider (target: the-static-collective.github.io). Check for existing records and verify domain ownership before changing DNS. Enable HTTPS after certificate issuance. Test the resulting URL on mobile before adding it to outreach emails.
4. The initial page has noindex,nofollow while verification and consent are pending. Keep this until public discovery is appropriate. This is not access control; repository and Pages may be public.

## Intake
- Form prepares a mailto message to humkinmusic@gmail.com with subject JUBILEE PLEDGE. A click is not a submitted pledge; only emails actually received can be reviewed.
- Apply the existing workbook intake workflow. Deduplicate replies and forwarding, record currency, keep personal data private, and honor withdrawal requests. No payment details in the inbox. Do not count offers of assistance as monetary pledges.
- Publish reviewed aggregate USD pledges only: edit REVIEW.reviewedUSD and REVIEW.asOf in docs/index.html; use a documented conversion date/rate for non-USD pledges. Null means not yet published. Pledges are not receipts.
- Never request funds or promise business/ownership rights through this page. Obtain independent property verification, authorization and an appropriate receiving organization before any separate payment phase. If the reported deadline passes, suspend intake until updated terms are confirmed.
- A volunteer should test the email link, copy and forwarding buttons, languages, mobile layout, and consent checkbox before broad distribution. No backend or live email synchronization is currently connected.
