# Skill integrity

The skills in this catalog teach an agent to do things with money and keys: sign a USDC top-up and send it to a `payTo` address, hold `WALLET_KEY`, create and delete API keys, and push raw JSON-RPC to mainnets. The documented install is one clone symlinked into four runtimes, so a `git pull` in that clone changes every agent on the machine at once.

`sync.yml` tells us when the API moved and a skill lags. Nothing tells us when a skill changed after review. A pull request that swaps the top-up host, or adds a second call to a new endpoint, reads like an ordinary edit. [`skill-integrity.yml`](../.github/workflows/skill-integrity.yml) closes that gap with [eyebrow](https://github.com/alexverify/eyebrow), and does it without failing on wording changes.

## What is recorded

[`eyebrow.discover.json`](../eyebrow.discover.json) tells eyebrow where the skills live: every directory under `skills/` that holds a `SKILL.md`, with `scripts/*` in each as harvest files. [`eyebrowlock.json`](../eyebrowlock.json) then records, per skill, a content hash of the whole directory and the set of hosts it reaches. Hosts come from two places: `curl`, `wget`, and `WebFetch` lines in `SKILL.md`, and every URL in the harvest files. A link in prose does not count. `AGENTS.md` is recorded too, as agent instructions.

## What the gate fails on

On every pull request that touches a skill, the workflow re-derives the fingerprint and, per [`eyebrow.policy.json`](../eyebrow.policy.json), fails only when a skill, compared with the lockfile:

- gains a host it did not reach before (`failOnCapabilityExpansion`), or
- introduces a new critical finding, such as a `curl` piped to a shell (`failOnSeverity: critical`).

A wording change passes and is reported in the job log (`allowContentDrift: true`). The bot-authored sync PRs keep merging without a lockfile refresh.

## What it does not catch

The fingerprint is line based and host granular. Checked against this catalog with eyebrow 0.4.7 and this policy:

| Edit to a skill | Result |
|---|---|
| Wording change in `venice-x402/SKILL.md` | passes, reported as content drift |
| Top-up `curl` host changed to a new domain | fails, `gained network` |
| `scripts/refresh_routing.py` gains a line that posts to a new host | fails, `gained network` |
| `payTo` placeholder replaced with a real address | passes, reported as content drift |

The last row is the limit to know. An address is a string inside `SKILL.md`, so a changed receiver is content drift, and this policy lets content drift through. A policy without `allowContentDrift` fails that edit, and also fails every wording change, which this catalog makes often. Review the `eyebrowlock.json` diff and the `venice-x402` changes by hand until eyebrow records addresses as a capability of their own.

Fourteen findings exist in the baseline: thirteen `SENSITIVE-PATH-READ` on `process.env` reads inside SDK examples, and one `WALLET-THEFT` on the sentence in `venice-auth` that tells developers never to ship a raw private key. All are rated high, below the critical threshold, so they do not block. They are recorded in the lockfile as the accepted state.

## Refreshing the lockfile

When a skill legitimately gains a host, or a new skill is added, regenerate the lockfile in the same PR:

```bash
eyebrow scan --path . --lockfile eyebrowlock.json
git add eyebrowlock.json
```

The diff on `eyebrowlock.json` shows which skill's reach changed, next to the skill change itself. A new skill listed in `skills.json` with no lockfile entry fails the coverage step, because a skill with no baseline has nothing to expand against.

Install eyebrow with `brew install alexverify/tap/eyebrow` or from the [releases page](https://github.com/alexverify/eyebrow/releases). The action is pinned by commit SHA; the `version` input selects the release, and its published checksums guard the download.
