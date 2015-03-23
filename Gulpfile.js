/* jslint indent: 4 */

(function () {
    "use strict";
  
    var gulp = require('gulp');
    var source = require("vinyl-source-stream");
    var browserify = require('browserify');
    
    gulp.task('browserify', function(){
        var b = browserify();
        b.add('./assets/js/main.js');
        return b.bundle()
            .pipe(source('main.js'))
            .pipe(gulp.dest('./dist'));
    });

    gulp.task('browserify-hash-worker', function(){
        var b = browserify();
        b.add('./assets/js/hash-worker.js');
        return b.bundle()
            .pipe(source('hash-worker.js'))    
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
  
    gulp.task('default', ['browserify', 'browserify-hash-worker', 'static', 'css']);

    gulp.task('develop', ['default'], function() {
        var watcher = gulp.watch('assets/**/*.*', ['default']);
        watcher.on('change', function(event) {
            console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
        });    
        
    });

})();
