# Issue #1360 — Pagination Skip Bug: Investigation, Fix, and Validation

**Issue:** [actions/stale#1360](https://github.com/actions/stale/issues/1360)
**Branch:** `test/issue-1360-pagination` (fork: `chiranjib-swain/stale`)
**Final commit:** `10f6df38bfe1ae062d6cb4de35e189bb69bd1276`
**Test repository:** `chiranjib-swain/labeler-test`

---

## 1. The Bug

`IssuesProcessor.processIssues()` always advanced to `page + 1` after processing a page,
regardless of whether closures had shrunk the underlying paginated list.

GitHub's `state: open` list is a live view. Closing items on one page removes them from
that view, which shifts later items forward into earlier positions. If the action blindly
requests `page + 1`, it skips whatever shifted into the range it already consumed.

### Real-world example

25 open PRs, page size 10:

```
Page 1: PR #35 ... PR #26   (closes 16 of them across the run)
Page 2: requested next, but the list has shrunk — items that should
        still be on page 2 have shifted backward into page 1's range
Result: those shifted items are never fetched again
```

### Original reproduction (unfixed `main` + reduced page size for testing)

Run: https://github.com/chiranjib-swain/labeler-test/actions/runs/32324478607

```
25 initially eligible PRs
Closed: 16
Skipped (never inspected): 9
Operations budget: 1000 (only 51 used)
Action reported: "No more issues found to process. Exiting..."
```

The action declared completion while 9 eligible PRs were still open and never inspected —
despite having 949 operations left in budget. This is the bug.

---

## 2. Root Cause

```ts
// original code
return this.processIssues(page + 1);
```

There was no check for whether the current page had changed as a result of processing.
The recursive call always advanced, unconditionally.

---

## 3. The Fix

File: `src/classes/issues-processor.ts`

### 3.1 Same-page retry

After processing a page, check whether any item **closed during this run** is still
visible in that page's fetched result. If so, re-fetch the **same page number** instead
of advancing — because GitHub's list hasn't yet reflected all the closures, and items
may still be shifting into view.

```ts
return this.processIssues(pageContainsClosedIssue ? page : page + 1);
```

### 3.2 Deduplication via state

Items already processed (this run, from a previous retry of the same page, or from a
previous run's persisted cache) are tracked via `state.isIssueProcessed()` and skipped,
so nothing is double-processed across retries.

### 3.3 Exponential backoff

Same-page retries wait between attempts instead of polling immediately:

```
retry 1: 500ms
retry 2: 1000ms
retry 3: 2000ms
retry 4: 4000ms
retry 5+: 5000ms (capped)
```

This reduces API call frequency while GitHub's backend catches up (eventual consistency).

### 3.4 Cross-run skip visibility

If items were already marked processed in a **previous run** (restored from the
persisted state cache), this is logged once per page, on that page's first fetch this run:

```
[#35]            pull request skipped due being processed during the previous run
```

Same-run retries (waiting on GitHub) do **not** repeat this per item — only the
aggregate counts change.

### 3.5 Fetch-shrink clarification

When a page's fetched item count drops below its own first-fetch count within the same
run (because GitHub has now reflected more closures), a dedicated line explains why:

```
Page #3 shrank as GitHub reflected the closures.
```

Without this, a smaller count on a later retry could look like a bug rather than expected
eventual-consistency behavior.

### 3.6 Simplified, gapless logs

Earlier iterations displayed a raw retry-attempt number (`pass #1`, `pass #2`, `pass #4` —
with gaps when a silent retry was suppressed). This looked broken. The final design
removes the pass number entirely — repeated announcements are already self-explanatory
from their position in the log and their `(N previously processed)` counts.

---

## 4. Final Log Format

```
Processing page  #3 :  10 new items out of  10 fetched (0 previously processed)...
[#14] Closing pull request for being stale
[#13] Closing pull request for being stale
[#12] Closing pull request for being stale
[#11] Closing pull request for being stale
Page  #3  processed.
4 previously closed items still visible on page  #3. Waiting 500ms for GitHub to catch up with closures.

Processing page  #3 :  2 new items out of  9 fetched (7 previously processed)...
Page  #3  shrank as GitHub reflected the closures.
Page  #3  processed.
1 previously closed item still visible on page  #3. Waiting 1000ms for GitHub to catch up with closures.

Page  #3  is stable. Advancing to page  #4.
```

### Comparison with `main`

| | `main` (unfixed) | Fixed branch |
|---|---|---|
| Line 1 | `Processing the batch of issues #1 containing 10 issues...` | `Processing page #1 : 10 new items out of 10 fetched (0 previously processed)...` |
| Line 2 | `Batch #1 processed.` | `Page #1 processed.` |
| Line 3 | *(none — advances unconditionally)* | `Page #1 is stable. Advancing to page #2.` |
| Line 4 | `Processing the batch of issues #2 containing 10 issues...` | `Processing page #2 : ...` |

**Explanation for reviewers:**

1. **Terminology** — "batch" → "page" is just clearer naming (it's a paginated API request).
   No functional change.
2. **New breakdown** ("X new items out of Y fetched (Z previously processed)") — main never
   exposed whether a fetch contained duplicates or already-handled items. This number is
   what makes the bug (and the fix) auditable.
3. **New line** ("Page #N is stable. Advancing to page #N+1.") — this is the fix, made
   visible. Main advanced **silently and unconditionally**; that's the root cause of #1360.
   This line only appears once the safety check (no closed items still visible) passes.

When nothing is being closed, the two versions are **functionally identical** — same
items, same completion, same cache behavior. That is intentional: it proves the fix
introduces no regression when there's nothing to fix. The extra logging becomes critical
specifically in the scenario the bug occurs in (active closures), where `main` would
advance blindly and skip items while the fixed version proves it's safe first.

---

## 5. Local Validation

```
Test Suites: 30 passed, 30 total
Tests:       1364 passed, 1364 total
```

Dedicated pagination regressions added in `__tests__/pagination.spec.ts`:
- Full-page closures — later pages still fully processed
- Partial-page closures — page correctly refreshes before advancing
- Repeated stale pages (simulated GitHub eventual consistency) — no double-processing
- Mixed issues/PRs sharing the same paginated result

Format/lint/build all pass on every commit.

---

## 6. Live Validation (`chiranjib-swain/labeler-test`)

Fixture: 25 real PRs (+ 7 unrelated regular issues also returned by GitHub's combined
`issues.listForRepo` endpoint), `per_page` temporarily reduced to 10 to make pagination
observable with a small fixture.

### 6.1 Baseline reproduction (unfixed `main` + `per_page: 10` only, commit `da02705`)

| Scenario | Run |
|---|---|
| Original bug reproduction (25 PRs, 16 closed, 9 skipped) | https://github.com/chiranjib-swain/labeler-test/actions/runs/32324478607 |
| Caching run 1 (ops=2) | https://github.com/chiranjib-swain/labeler-test/actions/runs/32988399715 |
| Caching run 2 (ops=3) | https://github.com/chiranjib-swain/labeler-test/actions/runs/32988524874 |
| Caching run 3 (ops=4) | https://github.com/chiranjib-swain/labeler-test/actions/runs/32988687698 |
| Caching run 4 (ops=5, completion) | https://github.com/chiranjib-swain/labeler-test/actions/runs/32990122451 |

### 6.2 Fixed branch — partial closure on page 1 (original #1360 scenario)

4 closable PRs (`#32–#35`) + 21 exempt PRs. Result: exactly 4 closed, 21 untouched.

- First validation: https://github.com/chiranjib-swain/labeler-test/actions/runs/33134637509
- Retest on final commit `10f6df3`: https://github.com/chiranjib-swain/labeler-test/actions/runs/33380823284

### 6.3 Fixed branch — partial closure on page 3

Proves the retry mechanism is not page-1-specific. 4 closable PRs (`#11–#14`, landing on
page 3) + 21 exempt. Pages 1–2 traverse with zero retries (nothing closes there); page 3
exhibits the retry/backoff pattern. Also demonstrated the total-item-count shrinking
below a page boundary, causing page 4 to come back empty naturally.

- Initial run: https://github.com/chiranjib-swain/labeler-test/actions/runs/33366466738
- Rerun with corrected fixture (all 4 PRs' stale label refreshed after reopen): https://github.com/chiranjib-swain/labeler-test/actions/runs/33370831384
- Rerun on shrink-clarification commit: https://github.com/chiranjib-swain/labeler-test/actions/runs/33370074776 → https://github.com/chiranjib-swain/labeler-test/actions/runs/33370831384
- Retest on final commit `10f6df3` (simplified log format): https://github.com/chiranjib-swain/labeler-test/actions/runs/33376103180

### 6.4 Fixed branch — operations-per-run + caching (4-run sequence)

Same 25 PRs, no staling (`days-before-pr-stale: -1`), page size 10, operations-per-run
tuned per run to land exactly on page boundaries:

| Run | ops-per-run | Result |
|---|---|---|
| 1 | 2 | Page 1 (10) processed, cached, blocked page 2 |
| 2 | 3 | Skip 10, page 2 (10) processed, cache→20, blocked page 3 |
| 3 | 4 | Skip 20, page 3 (10: 4 PRs+6 issues) processed, cache→30, blocked page 4 |
| 4 | 5 | Skip 30, page 4 (2) processed, page 5 empty → completed, cache reset |

- First pass (log-order fix): https://github.com/chiranjib-swain/labeler-test/actions/runs/32994156207 · https://github.com/chiranjib-swain/labeler-test/actions/runs/32994359597 · https://github.com/chiranjib-swain/labeler-test/actions/runs/32994582089 · https://github.com/chiranjib-swain/labeler-test/actions/runs/32994861599
- Final retest on commit `10f6df3`: https://github.com/chiranjib-swain/labeler-test/actions/runs/33383586955 · https://github.com/chiranjib-swain/labeler-test/actions/runs/33383681613 · https://github.com/chiranjib-swain/labeler-test/actions/runs/33383770213 · https://github.com/chiranjib-swain/labeler-test/actions/runs/33383873772

---

## 7. Notable Findings During Testing

- **Reopening a PR bumps its `updated_at`.** If a PR's stale label was applied *before*
  a reopen, the action correctly treats it as "updated since marked stale" and removes
  the stale label instead of closing it. This is correct `stale` action behavior, not a
  pagination bug — but it means test fixtures must refresh the stale label *after*
  reopening a PR, not before.
- **GitHub eventual consistency causes real run-to-run variance** in exactly how many
  items a retry fetch returns (e.g., one run showed `8 fetched` where another showed
  `9 fetched` for an equivalent retry) — this reflects backend replication lag at the
  moment of the API call, not a bug in the fix. The shrink-detection logic only checks
  "fewer than this page's own baseline," which is robust to this variance.
- **`operations-per-run` interacts with the retry mechanism**: every page fetch
  (including same-page consistency retries) consumes 1 operation. With staling disabled,
  each item itself costs 0 operations, so `operations-per-run` acts purely as "how many
  page-fetches are allowed" in that scenario — useful for designing deterministic
  multi-run cache tests.

---

## 8. Conclusion

- No eligible PR was skipped in any live test, across three different closure
  positions (page 1, page 3, and a full-list closure scenario).
- Operations-per-run and state-caching semantics are unchanged from `main` when no
  closures occur (verified across a full 4-run cache lifecycle, twice).
- Logs are accurate, non-noisy, and self-explanatory for every scenario tested: stable
  pages, same-page retries, shrinking pages, and cross-run resumption.
- All 30 local test suites (1364 tests) pass; format, lint, and build are clean at the
  final commit.

**Status: fix complete, validated locally and live. Ready for PR submission against
upstream `actions/stale`.**
