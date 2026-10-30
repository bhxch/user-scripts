# Userscript: Zread ↔ GitHub Jump

中文说明见 [README.md](README.md)。

Cross-links GitHub repo pages with their [Zread](https://zread.ai) pages: a "Zread"
button in the GitHub repo action area, and a GitHub icon in the Zread page header. Any
subpath, query, hash or SPA route is reduced to the `owner/repo` pair and leads to the
other site's repo home (e.g. `github.com/zai-org/ZCode` ↔ `zread.ai/zai-org/ZCode`).

## Install

Tampermonkey / Violentmonkey: import `dist/zread-jump.user.js` via "Install from file"
(this repo has no remote yet, so the metadata omits `@updateURL`/`@downloadURL`; add them
back once hosted). `@grant none`: no manager APIs needed.

## Build

```sh
bun github/zread-jump/build.ts   # -> github/zread-jump/dist/zread-jump.user.js
```

## Test

```sh
bun test github/zread-jump/      # unit tests for the URL-mapping pure functions
```

## Features

- **GitHub repo pages** (overview / tree): a "Zread" button next to the Star button; on
  code views without a Star button (blob etc.) it falls back to the breadcrumb repo link.
  Ships light/dark styles (follows the system preference).
- **Zread repo pages**: a GitHub icon in the header action group next to the repo-name
  dropdown (`currentColor`, adapts to the site theme).
- Both buttons open the other site in a new tab (`target="_blank"` +
  `rel="noreferrer"`), keeping the current page.
- **`owner/repo` only**: `/o/r/blob/main/src/x.ts?plain=1#L12`, Zread's `/o/r/chat/…` and
  the like all lead to `/o/r` on the other site; GitHub top-level fixed routes
  (`/settings`, `/explore`, `/orgs/…`), fixed user-page subroutes (`/u/repos`,
  `/u/packages`, …) and Zread app routes (`/login`, `/explore`, …) are excluded.
- **SPA-aware**: GitHub (turbo/pjax) and Zread (Next.js) are single-page apps; a
  MutationObserver with a short polling fallback keeps the button's position and target
  in sync, and the button disappears when leaving a repo page.
- **Safe degradation**: on GitHub the presence of a Star-button/breadcrumb anchor is the
  "this really is a repo page" check — if a redesign removes the anchors, the button
  hides itself instead of mis-injecting.

## Manual verification

1. Open `github.com/zai-org/ZCode/blob/main/README.md` with the script installed: a
   Zread button appears in the breadcrumb, linking to `https://zread.ai/zai-org/ZCode`;
   letting the page sit for a while must not accumulate stray nodes.
2. Click the breadcrumb repo name to reach the tree view: the button moves next to the
   Star button; `pushState` to `/explore`: button and its wrapper are removed.
3. Open `zread.ai/zai-org/ZCode`: a GitHub icon appears in the header action group,
   pointing at `github.com/zai-org/ZCode`; on `zread.ai/` home and `github.com/explore`
   no button appears.

(All scenarios were regression-tested against the live sites with agent-browser; re-run
this checklist after GitHub redesigns.)
