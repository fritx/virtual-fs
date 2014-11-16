var path = require('path')
var _ = require('lodash')

module.exports = Vfs

function Vfs(store, curr){
  /*{
    dir1: {
      file2: '',
      dir2: {
        file3: '',
        file4: ''
      }
    },
    file1: ''
  }*/
  this._store = store
  this._curr = p(curr || '.')
}

Vfs.prototype.statSync = function(pth){
  pth = p(pth)
  var f = get(this, pth)
  var stats = {}
  stats.isDirectory = _.constant(isDir(f.v))
  stats.isFile = _.constant(isFile(f.v))
  return stats
}
Vfs.prototype.stat = asy(Vfs.prototype.statSync)

Vfs.prototype.existsSync = function(pth){
  pth = p(pth)
  var f = get(this, pth)
  var stats = {}
  stats.isDirectory = _.constant(isDir(f.v))
  stats.isFile = _.constant(isFile(f.v))
  return stats
}
Vfs.prototype.exists = asy(Vfs.prototype.existsSync)

// EEXIST, file already exists 'F:\test\a'
Vfs.prototype.mkdirSync = function(pth){
  pth = p(pth)
  var f = get(this, pth)
  if (f.v) {
    throw new Error('file already exists')
  }
  f.p[f.k] = {}
}
Vfs.prototype.mkdir = asy(Vfs.prototype.mkdirSync)

// ENOTDIR, not a directory 'F:\test\virtual-fs\index.js'
Vfs.prototype.readdirSync = function(pth){
  pth = p(pth)
  var f = get(this, pth)
  if (!isDir(f.v)) {
    throw new Error('not a directory')
  }
  return Object.keys(f.v)
}
Vfs.prototype.readdir = asy(Vfs.prototype.readdirSync)

Vfs.prototype.rmdirSync = function(pth){
  pth = p(pth)
  var f = get(this, pth)
  if (!isDir(f.v)) {
    throw new Error('not a directory')
  }
  f.p[f.k] = null
  delete f.p[f.k]
}
Vfs.prototype.rmdir = asy(Vfs.prototype.rmdirSync)

Vfs.prototype.writeFileSync = function(pth, ctn){
  pth = p(pth)
  if (expsDir(pth)) {
    throw new Error('not a file')
  }
  var f = get(this, pth)
  if (ctn instanceof Buffer) ctn = ctn.toString()
  f.p[f.k] = ctn  // writes a string
}
Vfs.prototype.writeFile = asy(Vfs.prototype.writeFileSync)

Vfs.prototype.readFileSync = function(pth){
  pth = p(pth)
  if (expsDir(pth)) {
    throw new Error('not a file')
  }
  var f = get(this, pth)
  return f.v
}
Vfs.prototype.readFile = asy(Vfs.prototype.readFileSync)

Vfs.prototype.unlinkSync = function(pth){
  pth = p(pth)
  if (expsDir(pth)) {
    throw new Error('not a file')
  }
  var f = get(this, pth)
  if (!isFile(f.v)) {
    throw new Error('not a file')
  }
  f.p[f.k] = null
  delete f.p[f.k]
}
Vfs.prototype.unlink = asy(Vfs.prototype.unlinkSync)


function asy(fn){
  return function(/* [*args], cb */){
    var self = this
    var arr = _.toArray(arguments)
    var args = _.first(arr, 1)
    var cb = _.last(arr)
    _.defer(function(){
      try {
        cb(null, fn.apply(self, args))
      } catch(err) {
        cb(err)
      }
    })
  }
}

// ENOENT, no such file or directory 'F:\test\a'
function get(vfs, pth){
  if (/^\//.test(pth)) {  // abs path
    pth = pth.replace(/^\//, '')
  } else {  // rel path
    pth = vfs._curr.replace(/\/?$/, '/') + pth
  }
  var segs = pth ? pth.replace(/\/$/, '').split('/') : []
  if (segs[0] === '..') {
    throw new Error('path overflow')
  }

  var c = [null, vfs._store]
  var k = null  // root
  for (var i = 0; i < segs.length; i++) {
    if (!c[1]) {
      throw new Error('no such file or directory')
    }
    k = segs[i]
    c[0] = c[1]
    c[1] = c[1][k]
  }

  var f = {
    k: k,
    p: c[0],
    v: c[1]
  }
  return f
}

function isDir(v){
  return v && v.constructor === Object
}
function isFile(v){
  return v && v.constructor === String
}

function expsDir(pth){ // expects a dir
  return /\/$/.test(pth)
}

function p(pth){
  pth = pth.replace(/([\\\/])\.$/, '$1') // hacks against path.normalize bug?
  pth = path.normalize(pth)
  pth = pth.replace(/^(\w+):[\\\/]/, '\\\\$1\\\\') // win abs path
  pth = pth.replace(/\\+/g, '/')
  pth = pth.replace(/^\.\//, '')
  return pth
}
