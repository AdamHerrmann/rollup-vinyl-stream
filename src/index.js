  'use strict';

const streamKeys        = ['rollup', 'vinyl', 'config'];
const dependencyWarning = message => /Treating .+ as external dependency/.test(message);

module.exports = rollupVinylStream;

function rollupVinylStream(options = {}) {
  const Readable      = require('stream').Readable;
  const path          = require('path');
  const Vinyl         = require('vinyl');
  const rollup        = options.rollup || require('rollup');
  const vinylOptions  = options.vinyl || {};
  const config        = options.config && path.resolve(options.config);
  const rollupOptions = config ? loadConfigOptions(rollup, config) : Promise.resolve({});
  const stream        = new Readable({objectMode: true, read: () => {}});

  rollupOptions
    .then(rollupOptions => Object
      .keys(options)
      .filter(key => !streamKeys.includes(key))
      .reduce((rollupOptions, key) => rollupOptions[key] = options[key], rollupOptions)
    )
    .then(options => rollup.rollup(options).then(bundle => ({options, bundle})))
    .then(({options, bundle}) => {
      stream.emit('options', {...options, cache: bundle});

      (options.targets.map(target => ({...options, ...target})) || [options])
        .map(target => ({target, result: bundle.generate(target)}))
        .map(({target: {dest}, result: {code, map}}) => new Vinyl({
          ...vinylOptions,
          path:      path.resolve(dest),
          contents:  new Buffer(code),
          sourceMap: map,
        }))
        .forEach(file => stream.push(file))
      ;

      stream.push(null);
    })
    .catch(error => stream.emit('error', error))
  ;

  return stream;
}

function loadConfigOptions(rollup, config) {
  return rollup
    .rollup({
      entry:  config,
      onwarn: (message) => dependencyWarning(message) || console.error(message),
    })
    .then((bundle) => {
      const loader = require.extensions['.js'];

      require.extensions['.js'] = (module, filename) => {
        require.extensions['.js'] = loader;
        module._compile(bundle.generate({format: 'cjs'}).code, filename)
      };

      return require(config);
    })
  ;
}
