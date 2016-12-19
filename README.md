# requireDir(dir,[cb])
require 增强版。可以require整个目录或者单个文件,并返回promise对象。

## 示例

给定如下文件结构

```
dir
+ a.js
+ b.json
+ c.coffee
+ d.txt
```

`requireDir('./dir')` 将返回:

```js
Promise.resolve(
    { a: require('./dir/a.js'),
      b: require('./dir/b.json')
    }
)
```

And if CoffeeScript has been registered via `require('coffee-script/register')`,
`c.coffee` will also be returned.

## Installation

```
npm install require-dir
```

Note that this package is *not* `requireDir` — turns out that's already
[taken](https://github.com/JamesEggers1/node-requiredir)! ;)

## Usage

Basic usage that examines only directories' immediate files:

```js
var requireDir = require('require-dir');
var dir = requireDir('./path/to/dir');
```

You can optionally customize the behavior by passing an extra options object:

```js
var dir = requireDir('./path/to/dir', {recurse: true});
```

## Options

`recurse`: Whether to recursively `require()` subdirectories too.
(`node_modules` within subdirectories will be ignored.)
Default is false.

`camelcase`: Automatically add camelcase aliases for files with dash- and
underscore-separated names. E.g. `foo-bar.js` will be exposed under both the
original `'foo-bar'` name as well as a `'fooBar'` alias. Default is false.

`duplicates`: By default, if multiple files share the same basename, only the
highest priority one is `require()`'d and returned. (Priority is determined by
the order of `require.extensions` keys, with directories taking precedence
over files if `recurse` is true.) Specifying this option `require()`'s all
files and returns full filename keys in addition to basename keys.
Default is false.

E.g. in the example above, if there were also an `a.json`, the behavior would
be the same by default, but specifying `duplicates: true` would yield:

```js
{ a: require('./dir/a.js')
, 'a.js': require('./dir/a.js')
, 'a.json': require('./dir/a.json')
, b: require('./dir/b.json')
, 'b.json': require('./dir/b.json')
}
```

There might be more options in the future. ;)