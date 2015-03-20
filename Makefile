all: md5-rollup.js sha256-rollup.js lib-typedarrays.js

# FIXME: we should be able to combine the common portions of the rollups and generate a smarter importscript list for the workers

md5-rollup.js:
	curl -Lo $@ https://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/md5.js

sha256-rollup.js:
	curl -Lo $@ https://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/sha256.js

lib-typedarrays.js:
	curl -Lo $@ https://crypto-js.googlecode.com/svn/tags/3.1.2/build/components/lib-typedarrays.js

runserver:
	python3 -m http.server --bind 127.0.0.1
