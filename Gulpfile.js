/* global require, console */

var gulp = require('gulp'),
    sourceStream = require('vinyl-source-stream'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    eslint = require('gulp-eslint'),
    exorcist = require('exorcist'),
    sass = require('gulp-sass'),
    ghPages = require('gulp-gh-pages'),
    prettier = require('gulp-prettier');

gulp.task('browserify', function() {
    var b = browserify({
        debug: true
    });
    b.transform(babelify);
    b.add('./assets/js/main.js');
    return b
        .bundle()
        .pipe(exorcist('./dist/main.js.map'))
        .pipe(sourceStream('main.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('browserify-hash-worker', function() {
    var b = browserify({
        debug: true
    });
    b.transform(babelify);
    b.add('./assets/js/hash-worker.js');

    return b
        .bundle()
        .on('error', function(msg) {
            console.error('Browserify:', msg);
        })
        .pipe(exorcist('./dist/hash-worker.js.map'))
        .pipe(sourceStream('hash-worker.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('static', function() {
    gulp.src(['assets/html/index.html', 'assets/html/help.html']).pipe(
        gulp.dest('./dist')
    );
});

gulp.task('sass', function() {
    return gulp
        .src('assets/sass/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('default', [
    'lint',
    'browserify',
    'browserify-hash-worker',
    'static',
    'sass'
]);

gulp.task('develop', ['default'], function() {
    var watcher = gulp.watch('assets/**/*.*', ['default']);
    watcher.on('change', function(event) {
        console.log(
            'File ' + event.path + ' was ' + event.type + ', running tasks...'
        );
    });
});

gulp.task('lint', function() {
    // Note: To have the process exit with an error code (1) on
    //  lint error, return the stream and pipe to failOnError last.
    return gulp
        .src(['*.js', 'assets/js/*.js', 'assets/jsx/*.jsx'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('prettify', function() {
    gulp.src(['./assets/js/*.js', './assets/jsx/*.jsx'])
        .pipe(prettier())
        .pipe(gulp.dest(file => file.base));
});

gulp.task('deploy', function() {
    return gulp.src('./dist/**/*').pipe(ghPages());
});
