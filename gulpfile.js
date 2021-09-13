'use strict'
const { task, dest, src, series } = require('gulp')
const htmlmin = require('gulp-htmlmin')
const jsonminify = require('gulp-jsonminify')
const uglify = require('gulp-uglify-es').default

task('wxml', function () {
    // https://kangax.github.io/html-minifier/
    return src('dist/**/*.wxml').pipe(htmlmin({
        caseSensitive: true,     // 大小写敏感
        removeComments: true,    // 删除HTML注释
        keepClosingSlash: true,  // 单标签上保留斜线
        collapseWhitespace: true,// 压缩HTML
        ignoreCustomFragments: [
            // /<wxs([\s\S]*?)<\/wxs>/,
            /<input([\s\S]*?)<\/input>/,
            // /<wxs( *(src|module)=\s*)* *\/>/,
            // /<import( *(src)=\s*)**\/>/,
            // /{{([\s\S]*?)}}/,
        ],
    })).pipe(dest('dist/'))
})

task('json', function () {
    return src('dist/**/*.json')
        .pipe(jsonminify())
        .pipe(dest('dist/'))
})

task('wxs', function () {
    // https://github.com/terser/terser#compress-options
    // https://try.terser.org/
    return src(['dist/**/*.wxs', '!dist/components/vant/wxs/add-unit.wxs'])
        .pipe(uglify({
            compress: {
                ie8: true,       // 支持 ie8，为了禁止 a === undefined 自动转换为 void 0 === a
                join_vars: false // 禁止合并 var
            }
        }))
        .pipe(dest('dist/'))
})

task(
    'default',
    series([
        'wxml',
        'json',
        'wxs'
    ])
)