# A thin router over the real commands. The logic lives in scripts/ and the
# package.json scripts, so CI and a local shell run the same implementation and
# nothing is reachable only through Make.

.PHONY: help install build verify verify-local shots serve check-all clean

help:
	@echo "install       install Node deps and the Chromium Playwright needs"
	@echo "build         src/ -> dist/"
	@echo "serve         serve dist/ on :8000"
	@echo "verify        check dist/ at 8 viewport widths (Playwright; the CI gate)"
	@echo "verify-local  the same checks via Windows Chrome (this WSL box)"
	@echo "shots         screenshots of dist/ into tmp/final/"
	@echo "check-all     build + verify — run before opening a PR"
	@echo "clean         remove dist/ and tmp/"

install:
	npm ci
	npx playwright install --with-deps chromium

build:
	npm run build

serve:
	npm run build && npm run serve

verify:
	npm run verify

verify-local:
	npm run verify:local

shots:
	npm run shots

# The CI gate. On this WSL box run `make build verify-local` instead —
# Playwright's browser cannot start here.
check-all: build verify

clean:
	rm -rf dist tmp
