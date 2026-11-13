#!/usr/bin/env bash
# pnpm 12 ignores registry tokens in the repo .npmrc, so give the EAS worker
# a user-level one for GitHub Packages (@intenli/ui).
set -euo pipefail
if [ -z "${NPM_TOKEN:-}" ]; then
  echo "NPM_TOKEN is not set for this EAS environment" >&2
  exit 1
fi
echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> ~/.npmrc
