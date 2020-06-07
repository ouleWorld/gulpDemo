const fs = require('fs')

import gulp from 'gulp'
import { series, watch } from 'gulp'
import babel from 'gulp-babel'
import clearLog from './plugin/gulp-clearlog'
import clearMoreLine from './plugin/gulp-clearMoreLine'

const js = () => {
    let src = ['./src/js/**/*.js']
    let build = './build/js'
    let result = gulp.src(src)
        .pipe(babel())
        .pipe(gulp.dest(build))

    return result
}

const css = () => {
    let src = ['./src/css/**/*.css',]
    let build = './build/css'
    let result = gulp.src(src)
        .pipe(gulp.dest(build))

    return result
}

const clearLogOrder = () => {
    let src = ['./src/**/*']
    // let src = ['./src/*.js']
    let build = './build'
    let result = gulp.src(src)
        .pipe(clearLog())
        .pipe(clearMoreLine())
        .pipe(gulp.dest(build))

    return result
}

const clearMoreLineOrder = () => {
    let src = ['./src/**/*']
    // let src = ['./src/*.js']
    let build = './build'
    let result = gulp.src(src)
        .pipe(clearMoreLine())
        .pipe(gulp.dest(build))

    return result
}

exports.default = series(js, css)

exports.clearLogOrder = clearLogOrder
exports.clearMoreLineOrder = clearMoreLineOrder
