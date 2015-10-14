/**
 * d3_maps
 */
var gulp        = require('gulp');
var browserSync = require('browser-sync');


gulp.task('default', ['browser-sync']);

gulp.task('browser-sync', function() {

    browserSync({
        port: 9000,
        files: [
            'gists/**/*.*'
        ],
        notify: false,
        watchOptions: {
            ignoreInitial: true
        },
        server: {
            baseDir: 'gists'
        }
    });

});
