/* jslint indent: 4 */
/* global require, console */

var gulp = require('gulp'),
    sourceStream = require('vinyl-source-stream'),
    transform = require('vinyl-transform'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    eslint = require('gulp-eslint'),
    exorcist = require('exorcist'),
    replace = require('gulp-replace');

gulp.task('browserify', function(){
    var b = browserify({debug: true});
    b.transform(babelify);
    b.add('./assets/js/main.js');
    return b.bundle()
        .pipe(sourceStream('main.js'))
        .pipe(transform(function () { return exorcist('dist/main.js.map'); }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('browserify-hash-worker', function(){
    var b = browserify({debug: true});
    b.transform(babelify);
    b.add('./assets/js/hash-worker.js');
    return b.bundle()
        .pipe(sourceStream('hash-worker.js'))
    // A better solution would be running Browserify on the entire asmCrypto
    // module but since we're not debugging that module we'll just strip the
    // sourceMapping comment to avoid 404 warnings when opening the debugger
        .pipe(replace('//# sourceMappingURL=asmcrypto.js.map', ''))
        .pipe(transform(function () { return exorcist('dist/hash-worker.js.map'); }))
        .pipe(gulp.dest('./dist'));
});


gulp.task('static', function () {
    gulp.src(['assets/html/index.html'])
        .pipe(gulp.dest('./dist'));
});

gulp.task('css', function () {
    gulp.src('assets/css/*.css')
        .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['lint', 'browserify', 'browserify-hash-worker', 'static', 'css']);

gulp.task('develop', ['default'], function() {
    var watcher = gulp.watch('assets/**/*.*', ['default']);
    watcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });

});

gulp.task('lint', function () {
    // Note: To have the process exit with an error code (1) on
    //  lint error, return the stream and pipe to failOnError last.
    return gulp.src(['*.js', 'assets/js/*.js', 'assets/jsx/*.jsx'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});
