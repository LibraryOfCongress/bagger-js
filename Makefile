all: asmcrypto.js asmcrypto.js.map

asmcrypto.js:
	curl -Lo $@ http://vibornoff.com/asmcrypto.js

asmcrypto.js.map:
	curl -Lo $@ http://vibornoff.com/asmcrypto.js.map

runserver:
	python3 -m http.server --bind 127.0.0.1
