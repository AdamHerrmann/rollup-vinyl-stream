'use strict';

const streamKeys = ['rollup', 'vinyl', 'config'];

module.exports = function rollupVinylStream(_opts = {}) {
  const {Readable} = require('stream');
  const stream     = new Readable({objectMode: true, read: () => {}});
  const streamEmit = name => obj => { stream.emit(name, obj); return obj; };
  const rollup     = _opts.rollup || require('rollup');
  const vinylOpts  = _opts.vinyl || {};
  const rollupOpts = loadOptions(_opts, rollup, streamEmit);

  rollupOpts
    .then(opts => rollup
      .rollup(opts)
      .then(streamEmit('bundle'))
      .then(bundle => {
        const bundleTarget = createTargetBundler(bundle, opts, vinylOpts);
        (opts.targets || [{}]).map(bundleTarget).forEach(file => stream.push(file));
        stream.push(null);
      })
    )
    .catch(streamEmit('error'))
  ;

  return stream;
}

function createTargetBundler(bundle, opts, vinylOpts) {
  const Vinyl = require('vinyl');
  const path  = require('path');

  return (target) => {
    const {code, map} = bundle.generate({...opts, ...target});
    const file        = new Vinyl({
      ...vinylOpts,
      path:      path.resolve(target.dest),
      contents:  new Buffer(code),
    });

    if (map) {
      file.sourceMap      = map;
      file.sourceMap.file = target.dest
    }

    return file;
  };
}

function loadOptions(_opts, rollup, streamEmit) {
  const path   = require('path');
  const config = _opts.config ? loadRollupConfig(path.resolve(_opts.config), rollup, streamEmit) : Promise.resolve({});

  return config.then(config => {
   Object
      .keys(_opts)
      .filter(key => !streamKeys.includes(key))
      .forEach(key => config[key] = overrides[key])
    ;
    return config;
  });
}

function loadRollupConfig(entry, rollup, streamEmit) {
  const ignorable = /Treating .+ as external dependency/;
  const onwarn    = message => ignorable.test(message) || console.error(message);

  return rollup
    .rollup({entry, onwarn})
    .then(bundle => requireRollupBundle(bundle, entry))
    .then(streamEmit('config'))
    .then(config => ({...config}))
  ;
}

function requireRollupBundle(bundle, entry) {
  const previousLoader = require.extensions['.js'];

  require.extensions['.js'] = (module, filename) => {
    require.extensions['.js'] = previousLoader;
    module._compile(bundle.generate({format: 'cjs'}).code, filename);
  }

  try     { return require(entry); }
  finally { require.extensions['.js'] = previousLoader; }
}
