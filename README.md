# rollup-vinyl-stream
Create a vinyl stream from a Rollup bundle.

## Installation

```bash
yarn add -D rollup-vinyl-stream
```

## Basic Usage

```javascript
const gulp         = require('gulp');
const rollupStream = require('rollup-vinyl-stream');

gulp.task('rollup', () =>
  rollupStream({
    entry:  './src/index.js',
    dest:   'index.js',
    format: 'umd',
  })
  .pipe(gulp.dest('./dist'))
);
```

## Multiple Targets

```javascript
const gulp         = require('gulp');
const rollupStream = require('rollup-vinyl-stream');

gulp.task('rollup', () =>
  rollupStream({
    entry:  './src/index.js',
    targets: [
      {
        dest:   'index.umd.js',
        format: 'umd',
      },
      {
        dest:   'index.cjs.js',
        format: 'cjs',
      },
    ],
  })
  .pipe(gulp.dest('./dist'))
);
```

## Load Config File

```javascript
const gulp         = require('gulp');
const rollupStream = require('rollup-vinyl-stream');

gulp.task('rollup', () =>
  rollupStream({config: './rollup.config.js'})
  .pipe(gulp.dest('./dist'))
);
```

## Use Cache

```javascript
const gulp         = require('gulp');
const rollupStream = require('rollup-vinyl-stream');
let   cache;

gulp.task('rollup', () =>
  rollupStream({
    config: './rollup.config.js',
    cache,
  })
  .on('bundle', (bundle) => cache = bundle)
  .pipe(gulp.dest('./dist'))
);
```

## Cache Options

```javascript
const gulp         = require('gulp');
const rollupStream = require('rollup-vinyl-stream');
let   options      = {config: './rollup.config.js'};

gulp.task('rollup', () =>
  rollupStream(options)
  .on('config', (config) => options = config)
  .on('bundle', (bundle) => options.cache = bundle)
  .pipe(gulp.dest('./dist'))
);
```
