const gulp = require('gulp');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const alias = require('gulp-ts-alias');
const project = require('gulp-typescript').createProject('tsconfig.base.json', {
  declaration: false,
  sourceMap: true,
});
if (project.config.exclude) {
  project.config.exclude.push('node_modules');
} else {
  project.config.exclude = ['node_modules'];
}

gulp.task('default', build);

function build(done) {
  if (process.env.NODE_ENV === 'production') {
    project.src()
      .pipe(alias({ configuration: project.config }))
      .pipe(sourcemaps.init())
      .pipe(project()).js
      .pipe(uglify({
        compress: {
          sequences: false
        }
      }))
      .pipe(sourcemaps.write('.', {
        sourceRoot: './',
        includeContent: false
      }))
      .pipe(gulp.dest("build"));
  } else {
    project.src()
      .pipe(alias({ configuration: project.config }))
      .pipe(sourcemaps.init())
      .pipe(project()).js
      .pipe(sourcemaps.write('.', {
        sourceRoot: './',
        includeContent: false
      }))
      .pipe(gulp.dest("build"));
  }
  done();
}
