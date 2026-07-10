---
name: kalodata-authorized-export
description: Export Kalodata product-detail data through the account's normal web UI when the user supplies a Kalodata product URL and an authorized current Cookie file. Use for requests to export product, creator, video/advertising, or livestream Excel data (especially Top N for a stated date range), then clean the exported spreadsheets. Never use for bypassing credits, paywalls, anti-bot checks, or download restrictions.
---

# Kalodata Authorized Export

Use only a Cookie file the user explicitly supplies for the current task. Never place Cookie values in logs, source files, outputs, or this skill.

## Workflow

1. Accept a current Cookie file and a Kalodata product URL. Unless the user specifies otherwise, use the URL's market, the past 90 days, transaction amount descending, and Top 10 creators plus Top 10 videos/advertising. State that each exported row consumes allowance.
2. Validate the Cookie locally without printing values. Require JSON cookie entries for a Kalodata domain and check expiry.
3. Launch an isolated Chrome or Edge profile under the workspace with a temporary remote-debugging port. Do not attach to, read, or operate the user's existing browser profile. Import the supplied Cookies into this isolated session.
4. Navigate to the supplied product detail URL. Use only normal page controls to select the period and ranking. Stop if a CAPTCHA, login, missing entitlement, or non-dismissible page block prevents normal interaction.
5. Read the authorized product page to obtain its exact product name and store name. Sanitize both for Windows paths, then create `D:\kalodata\<product-name>\<store-name>\`.
6. For each requested list, select its visible Data Export then Excel menu. In the platform confirmation dialog, set the range to `1` through the requested Top N, verify the remaining allowance, and click the dialog's normal export confirmation.
7. Wait for downloads to finish. Save exactly three deliverables in the product/store directory:
   - `01_visible_page_structured_result.xlsx`: exactly one worksheet with authorized visible product and store fields, period, ranking, source URL, and Top N summary rows.
   - `02_creator_top10.xlsx`: retain only the official creator export's relevant data worksheet; remove extra or blank worksheets.
   - `03_video_ads_top10.xlsx`: retain only the official video/advertising export's relevant data worksheet; remove extra or blank worksheets.
8. Use the spreadsheet workflow when creating or rewriting workbooks. Preserve typed numbers and dates, include the source URL and query date in the structured result, and verify all three workbooks have exactly one worksheet.
9. Report the exported count, output directory, and allowance change shown by the UI. Stop the isolated browser and delete its temporary profile after saving deliverables.

## Guardrails

- Do not call undocumented APIs or replay private export endpoints.
- Do not remove, suppress, or script around CAPTCHA, paywall, credit, export-limit, or access-control UI.
- Do not click a default range larger than the user requested.
- Treat an activity popup with no normal close route as a blocker.
- If the URL's product does not match the user's description, report the mismatch before spending export allowance.
