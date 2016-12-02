/**
 * Created by frank on 2016/12/2.
 */

'use strict';

const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const Promise = require('bluebird')

const readStats = Promise.promisify(fs.stat)
const readDir = Promise.promisify(fs.readdir)

const DEFAULT_OPTIONS = {
    depth: 10,
    filter: /(.+)$/,
    excludeDirs: /^\.(git|svn)$/,
    camelcase: false,
    filenameReplacer: (n) => n,
    execute: true
}

module.exports = function requireDir (options, cb) {
    let opts = options
    if (typeof options === 'string') {
        opts = { dirPath: options }
    }
    opts = _.assign({}, DEFAULT_OPTIONS, opts)
    const hasCallback = cb && _.isFunction(cb)
    try {
        validateOptions(opts)
    } catch (err) {
        return hasCallback ? cb(err) : Promise.reject(err)
    }

    // 开始递归构建文件树，开始目录深度为0
    const promise = _walk(opts.dirPath, 0)

    // 如果没有回调直接返回promise
    if (!hasCallback) return promise
    promise.then(files => cb(null, files)).catch(cb)

    /**
     *  递归构建文件树
     * @param dirPath 文件路径
     * @param currentDepth  当前深度
     * @returns {Promise|Promise.<Object>|*}
     */
    function _walk (dirPath, currentDepth) {

        return readStats(dirPath).then(stats => {
            if (stats.isFile()) {
                let file = opts.execute ? require(dirPath) : dirPath
                return Promise.resolve(file)
            }
            if (stats.isDirectory()) {
                currentDepth += 1
                const filesStats = readDir(dirPath).then(files => {
                    let props = {}
                    _.forEach(files, file => {
                        props[ file ] = readStats(path.resolve(dirPath, file))
                    })
                    return Promise.props(props)
                })
                return filesStats.then(filesStats => {
                    let props = {}
                    _.forEach(filesStats, (stats, file) => {
                        let canPass = false
                        let name = opts.camelcase ? toCamelCase(file) : file
                        if (stats.isFile()) {
                            canPass = opts.filter.test(file)
                            name = opts.filenameReplacer(file)
                        } else if (stats.isDirectory() && currentDepth < opts.depth) {
                            canPass = !opts.excludeDirs.test(file)
                        }
                        if (canPass) {
                            props[ name ] = _walk(path.resolve(dirPath, file), currentDepth)
                        }
                    })
                    return Promise.props(props)
                })
            }
            return Promise.reject(new TypeError('UnSupported file type'))
        })
    }
}

function validateOptions ({ dirPath, filter, excludeDirs, depth, filenameReplacer }) {
    if (!dirPath && !_.isString(dirPath)) {
        throw new Error('options must have dirPath')
    }
    if (!_.isRegExp(filter)) {
        throw new TypeError('filter must be regexp type')
    }
    if (!_.isRegExp(excludeDirs)) {
        throw new TypeError('excludeDirs must be regexp type')
    }
    if (!_.isInteger(depth) || depth < 0) {
        throw new Error('depth must be integer type')
    }
    if (!_.isFunction(filenameReplacer)) {
        throw new TypeError('filenameReplacer must be function')
    }
}

function toCamelCase (str) {
    return str.replace(/[_-][a-z]/ig, s => s.substring(1).toUpperCase())
}
