# Userscript: GitHub Repo Size Badge

中文说明见 [README.md](README.md)。

Shows the repository size as a small badge next to the repo name on GitHub repo pages,
repo lists (a user's or org's `repositories` tab) and star lists (`stars` tab). The size
comes from the `size` field (in KB) of the GitHub REST API's `repos/{owner}/{repo}`
endpoint.

## Install

Tampermonkey / Violentmonkey: import `dist/gh-repo-size-badge.user.js` via "Install from
file", or open the URL below directly:

```
https://raw.githubusercontent.com/bhxch/user-scripts/main/github/gh-repo-size-badge/dist/gh-repo-size-badge.user.js
```

The metadata carries `@downloadURL` / `@updateURL`, so the script manager updates the
script by version on its own.

## Build

```sh
bun github/gh-repo-size-badge/build.ts   # -> github/gh-repo-size-badge/dist/gh-repo-size-badge.user.js
```

## Test

```sh
bun test github/gh-repo-size-badge/      # page parsing, size formatting, token resolution, API error mapping
```

## Features

- **Repo pages**: a `· 12.4 MB` badge next to the repo title; hovering shows the size and
  the auth mode (`Token (owner)` or "匿名请求" / anonymous request).
- **Repo lists / star lists**: the same, more compact, badge next to every list entry.
- **Per-owner tokens**: configure a fine-grained PAT per owner (user or org, case
  insensitive); owners without their own token fall back to the `*` catch-all token and
  then to anonymous requests. The script manager menu can add, delete and list tokens
  (listed masked).
- **Rate-limit protection**: successful results are cached for 5 minutes; on list pages at
  most 10 anonymous requests are made (repos with a token are not limited); failures are
  cached for 60 seconds so the same error is not requested over and over.
- **Error badges**: when the size cannot be fetched, a red `· ?` badge shows; hovering
  gives the reason (missing/private repo, expired token, API rate limit, network error…).
- **SPA-aware**: GitHub is a turbo/pjax single-page app, so turbo/pjax events plus a
  MutationObserver track route and DOM changes and recompute the badges; insertion is
  retried while GitHub is still rendering the title.
- **Menus**: the script manager menu offers token setup, deletion, listing and a
  "diagnose current page" command (prints the page type, title anchor, token source and
  one API result).

## Manual verification

1. Open `github.com/zai-org/ZCode` with the script installed: the size badge appears next
   to the repo title; hovering shows `仓库大小` and `认证方式`.
2. Open `github.com/zai-org?tab=repositories` and `?tab=stars`: small badges appear next
   to the list entries.
3. Without a token, open a private repo: a red `· ?` badge shows and hovering mentions
   "仓库不存在，或为私有仓库".
4. Configure a token for `zai-org` from the menu: the badge comes back and hovering shows
   `Token (zai-org)`.
5. Open `github.com/settings/profile`: no badge at all (the path is in `@exclude`).

(These scenarios need a regression run against the live site; re-run the checklist after
GitHub redesigns.)
