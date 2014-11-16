# virtual-fs

Abstraction for fs virtual usage

## Usage

```js
var Vfs = require('virtual-fs')
var vfs = new Vfs({
  'readme': 'hello!',
  'license': 'mit',
  'node_modules': {
    'lodash': 'lodash.js'
  }
}, 'node_modules')
vfs.readFileSync('lodash/lodash.js')
vfs.writeFile('/readme', 'damn', function(err){/**/})
```

## API Supported

- writeFile
- readFile
- unlink
- mkdir
- readdir
- rmdir
- stat
