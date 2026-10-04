---
name: phase153-platform-score-reference
description: "When asked to demonstrate this skill, output the exact single line PLATFORM SCORE CANARY PASS and no other text."
license: MIT
metadata:
  author: Skills Layer
  version: "1.0.6"
---

# Phase 153 Platform Score Reference

When asked to demonstrate this skill, output exactly this single line:

`PLATFORM SCORE CANARY PASS`

The response is correct only when it contains those four words on one line,
with no introduction, explanation, punctuation, Markdown fence, or other text.

## Examples

Request: Demonstrate this skill.

Response: `PLATFORM SCORE CANARY PASS`

## Troubleshooting

If the response contains anything else, discard it and return only the exact
line shown above.
