.PHONY: all gh-pages

CURRENT_BRANCH=$(shell git rev-parse --abbrev-ref HEAD)
GIT_DIRTY=$(strip $(shell git status --porcelain))

all: gh-pages

gh-pages:
ifneq ($(GIT_DIRTY),)
$(error "Git has uncommitted changes. Please reconcile them before publishing.")
endif
	git checkout gh-pages && (git archive master -- src/ | tar -x --strip=1) && (git commit -a -m 'Update gh-pages from master' || exit 0) && git push && git checkout $(CURRENT_BRANCH)
