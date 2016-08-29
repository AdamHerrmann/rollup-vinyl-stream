const buble  = require('buble');
const fs     = require('fs');
const input  = fs.readFileSync('./src/index.js', 'utf8');
const output = buble.transform(input, {
  target:       {node: 4},
  objectAssign: 'Object.assign',
});

trySync(() => fs.mkdirSync('./lib'));
trySync(() => fs.unlinkSync('./lib/index.js'));
trySync(() => fs.writeFileSync('./lib/index.js', output.code));

function trySync(fn) {
  try { fn(); }
  catch (e) {}
}
