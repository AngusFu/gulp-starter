var gulp = require('gulp'),
    filter = require('gulp-filter'),
    addSrc = require('gulp-add-src'),
    rimraf = require('gulp-rimraf'),
    sourcemaps = require('gulp-sourcemaps');

/**
 * deal with js
 */
 var uglify = require('gulp-uglify'),
     concat = require('gulp-concat');

/**
 * deal with scss
 */
var sass = require('gulp-ruby-sass'),
    minifycss = require('gulp-minify-css'),
    autoprefixer = require('gulp-autoprefixer');

/**
 * add header and footer
 */
var header = require('gulp-header'),
    footer = require('gulp-footer');

/**
 * deal with static resource hash
 */
var rev = require('gulp-rev'),
    revReplace = require('gulp-rev-replace'),
    override = require('gulp-rev-css-url');

/**
 * compile dot templates
 */
var dotCompile = require('gulp-dotjs-compiler');

//////////////////////////////////////////////////////////////////////////////////////////
///
//////////////////////////////////////////////////////////////////////////////////////////


/**
 * clean dirs
 */
gulp.task('clean', function(done) {
    return gulp.src(['./dist', './build', '.sass-cache'], {
        read: false
    }).pipe(rimraf({
        force: true
    }));
});



/**
 * compile scss files
 */
gulp.task('scss', function() {
    sass(['./src/scss/**'], {sourcemap: true})
        .on('error', sass.logError)
        .pipe(autoprefixer('last 4 version', 'safari 5', 'firefox', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(minifycss())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./src/css'));
});



/**
 * add md5 to resources
 */
gulp.task('md5', ['clean', 'scss'], function(){
    return gulp.src(['./src/**/**'])
        .pipe(rev())
        .pipe(override())
        .pipe(gulp.dest('./build/'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./build/'));
});



/**
 * replace html url
 */
gulp.task('rev', ['md5'], function () {
    var manifest = gulp.src('./build/rev-manifest.json');

    gulp.src("./src/*.html")
        .pipe(revReplace({manifest: manifest}))
        .pipe(gulp.dest('./build'));
});


/**
 * compile templates and concat them into one file
 */
gulp.task('dot', function () {
    var wrapper = moduleWrap('dotTempl');

    // 自定义
    var custom = ['./src/templates/notice.html', './src/templates/doc.html'];
    
    gulp.src(custom || ['./src/templates/**/*.html', '!./src/templates/layout.html'])
        .pipe(dotCompile({
            // it: {data: [2, 4, 5,6]},  // 如果传了it 则认为是编译为 html
            // def: {xxx: 2222222222},   // 传过去的 snippet
            // ext: 'html',              // 文件后缀
            dict: 'dotTempl',
            // layout: './src/templates/layout.html'
        }))
        .pipe(concat('dotTempl.js'))
        .pipe(header(wrapper[0] + 'var dotTempl = {};'))
        .pipe(footer('module.exports = dotTempl;' + wrapper[1]))
        .pipe(uglify())
        .pipe(gulp.dest('./build/'));
});


///////////////////////////////////////////////////////////////////////////////
///
///////////////////////////////////////////////////////////////////////////////

/**
 * 生成兼容 AMD CMD COMMONJS 等方式的 wrapper
 * @param  {String} modName 模块名称
 * @return {Array}          头部尾部字符串数组
 */
function moduleWrap(modName) {
    var begin = '' +
                '!(function(global, factory) {'+
                    'if (typeof define === \'function\' && (define.cmd || define.amd)) {'+
                        'define(factory);'+
                    '} else if (typeof exports !== \'undefined\' && typeof module !== \'undefined\'){'+
                        'factory(require, exports, module);'+
                    '} else {'+
                        'var mod = {'+
                                'exports: {}'+
                            '},'+
                            'require = function(name) {'+
                                'return global[name];'+
                            '};'+
                        'factory(require, mod.exports, mod);'+
                        'global.' + modName + '= mod.exports;'+
                    '}'+
                '})(this, function(require, exports, module) {',

        end =   '});'

    return [begin, end];
}