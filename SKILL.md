---
name: kalodata-authorized-export
description: Export Kalodata product-detail data through the account's normal web UI when the user supplies a Kalodata product URL and an authorized current Cookie file. Use for requests to export product, creator, video/advertising, or livestream Excel data (especially Top N for a stated date range), then clean the exported spreadsheets. Never use for bypassing credits, paywalls, anti-bot checks, or download restrictions.
---

# Kalodata Authorized Export

Use only a Cookie file the user explicitly supplies for the current task. Never place Cookie values in logs, source files, outputs, or this skill.

Run `scripts/kalodata_batch_export.cjs` instead of creating new probe or export scripts in the workspace. It uses CommonJS Playwright, a visible isolated session, real mouse clicks, and system-temp downloads. Supply a Cookie JSON path and a newline-delimited URL file; keep only final Excel deliverables under `D:\kalodata`.

## Workflow

1. Accept a current Cookie file and one or more Kalodata product URLs. Unless the user specifies otherwise, use the URL's market, the past 90 days, transaction amount descending, and Top 10 creators plus Top 10 videos/advertising. State that each exported row consumes allowance.
2. Validate the Cookie locally without printing values. Require JSON cookie entries for a Kalodata domain and check expiry.
3. Use the bundled Playwright browser visibly (`headless: false`) in one isolated browser context; do not attach to or alter the user's existing browser profile. Use CommonJS loading (`const { chromium } = require('playwright')`), not Node ESM imports. Import the supplied Cookies into this context and keep the same browser, context, and page for the entire batch.
4. Open the first product page and ask the user to manually close the Kalodata activity popup once. Continue only after the user replies that it is closed. Before each export and after each export confirmation, check for a visible activity popup. If it reappears, locate its normal visible top-right X, obtain its viewport bounding box, and use `page.mouse.click(x, y)` at its center; do not use DOM `.click()` for this popup. If the popup remains or has no visible normal X, pause and ask the user to close it manually, then resume the same browser session.
5. Stop if a CAPTCHA, login, missing entitlement, or other security verification prevents normal interaction. Do not bypass or solve verification challenges automatically.
6. For each product, read the authorized product page to obtain its exact product name and store name. Sanitize both for Windows paths, then create `D:\kalodata\<product-name>\<store-name>\`.
7. For each requested list, select its visible Data Export then Excel menu. In the platform confirmation dialog, set the range to `1` through the requested Top N, verify the remaining allowance, and click the dialog's normal export confirmation.
8. Wait for downloads to finish. Save exactly three deliverables in the product/store directory:
   - `01_visible_page_structured_result.xlsx`: exactly one worksheet with authorized visible product and store fields, period, ranking, source URL, and Top N summary rows.
   - `02_creator_top10.xlsx`: retain only the official creator export's relevant data worksheet; remove extra or blank worksheets.
   - `03_video_ads_top10.xlsx`: retain only the official video/advertising export's relevant data worksheet; remove extra or blank worksheets.
9. Use the spreadsheet workflow when creating or rewriting workbooks. Preserve typed numbers and dates, include the source URL and query date in the structured result, and verify all three workbooks have exactly one worksheet.
10. Repeat steps 6-9 for later URLs in the same session. Report the exported count, output directory, and allowance change shown by the UI. Stop the isolated browser and delete its temporary profile after saving deliverables.

## Guardrails

- Do not call undocumented APIs or replay private export endpoints.
- Do not remove, suppress, or script around CAPTCHA, paywall, credit, export-limit, or access-control UI.
- Do not click a default range larger than the user requested.
- Treat an activity popup with no normal close route as a blocker.
- If the URL's product does not match the user's description, report the mismatch before spending export allowance.
