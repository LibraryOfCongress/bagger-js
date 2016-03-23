# bagger-js

<p align="center">
  <a href="https://travis-ci.org/LibraryOfCongress/bagger-js">
    <img src="https://travis-ci.org/LibraryOfCongress/bagger-js.svg?branch=master"
         alt="build status">
  </a>
  <a href="https://david-dm.org/libraryofcongress/bagger-js#info=devDependencies" title="devDependency status">
     <img src="https://david-dm.org/libraryofcongress/bagger-js/dev-status.svg"/>
  </a>
</p>

An experiment with a pure JavaScript implementation of the BagIt specification
and a simple web application which allows bagging and transferring local content


## Major Features

* [x] File drag and drop or selection
* [x] [Recursive directory drag and drop or selection](https://github.com/loc-rdc/bagger-js/pull/1) (currently supported only in Chrome; see #1)
* [x] Incremental hashing
* [ ] Multi-threading
* [ ] Uploads to S3
* [ ] Ability to resume interrupted transfers
* [ ] Ability to download the generated bag rather than individual files

## Docker

To build and run via [Docker](https://www.docker.com) v1.9.1+(exclude sudo if running on mac):

    % sudo docker build --tag bagger:dev .
    % sudo docker run -p 8000:8000 -d -t bagger:dev

## Quickstart

The build system requires [npm](https://npmjs.org) and [gulp](http://gulpjs.com). If you don't already have Gulp installed:

    % npm install -g gulp


### Install dependencies

    % npm install

### Compile the sources

    % gulp

At this point the compiled JavaScript, CSS and HTML is in the `dist/` directory and ready for use.

### Run the local webserver on http://127.0.0.1:8000/

    % npm start

### Run the test suite

    % npm test

### Have Gulp watch for file changes and re-compile the sources

    % gulp develop


## Contributor Guidelines

The included .eslintrc documents the basic JavaScript requirements. These requirements are checked as part of the gulp lint target - which is included in the default target. Use of a Git pre-commit hook such as
https://gist.github.com/acdha/8717683/ can be helpful, as well.

