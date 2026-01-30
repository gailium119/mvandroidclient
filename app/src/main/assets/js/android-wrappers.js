// 模拟Node.js 模块缓存
var ModuleCache = {};

// 模拟 require 函数
window.require = function(moduleName) {
    if (ModuleCache[moduleName]) {
        return ModuleCache[moduleName];
    }
    
    switch(moduleName) {
        case 'fs':
            var fs = {
                // 同步读取文件
                readFileSync: function(path, options) {
                    var encoding = 'utf-8';
                    if (options && typeof options === 'string') {
                        encoding = options;
                    } else if (options && options.encoding) {
                        encoding = options.encoding;
                    }
                    var result = AndroidFS.readFileSync(path, encoding);
                    if (!result) {
                        var err = new Error('ENOENT: no such file or directory, open \'' + path + '\'');
                        err.code = 'ENOENT';
                        err.errno = -2;
                        throw err;
                    }
                    return result;
                },
                
                // 异步读取文件
                readFile: function(path, options, callback) {
                    if (typeof options === 'function') {
                        callback = options;
                        options = null;
                    }
                    
                    var encoding = options && options.encoding || 'utf-8';
                    
                    // 使用 Promise 包装
                    new Promise(function(resolve, reject) {
                        try {
                            var result = AndroidFS.readFileSync(path, encoding);
                            if (!result) {
                                var err = new Error('ENOENT: no such file or directory, open \'' + path + '\'');
                                err.code = 'ENOENT';
                                err.errno = -2;
                                throw err;
                            }
                            resolve(result);
                        } catch (err) {
                            reject(err);
                        }
                    }).then(function(data) {
                        if (callback) callback(null, data);
                    }).catch(function(err) {
                        if (callback) callback(err);
                    });
                },
                
                // 同步写入文件
                writeFileSync: function(path, data, options) {
                    var success = AndroidFS.writeFileSync(path, data);
                    if (!success) {
                        throw new Error('Failed to write file: ' + path);
                    }
                },
                
                // 异步写入文件
                writeFile: function(path, data, options, callback) {
                    if (typeof options === 'function') {
                        callback = options;
                        options = null;
                    }
                    
                    new Promise(function(resolve, reject) {
                        try {
                            var success = AndroidFS.writeFileSync(path, data);
                            if (success) {
                                resolve();
                            } else {
                                reject(new Error('Write failed'));
                            }
                        } catch (err) {
                            reject(err);
                        }
                    }).then(function() {
                        if (callback) callback(null);
                    }).catch(function(err) {
                        if (callback) callback(err);
                    });
                },
                
                // 检查文件是否存在
                existsSync: function(path) {
                    return AndroidFS.existsSync(path);
                },
                
                // 异步检查文件是否存在
                exists: function(path, callback) {
                    setTimeout(function() {
                        callback(AndroidFS.existsSync(path));
                    }, 0);
                },
                
                // 读取目录
                readdirSync: function(path) {
                    var result = AndroidFS.readdirSync(path);
                    if (!result) {
                        var err = new Error('ENOENT: no such directory, scandir \'' + path + '\'' + ': ' + result);
                        err.code = 'ENOENT';
                        throw err;
                    }
                    return JSON.parse(result);
                },
                
                // 异步读取目录
                readdir: function(path, callback) {
                    Promise.resolve().then(() => {
                        return JSON.parse(AndroidFS.readdirSync(path));
                    }).then((files) => {
                        // 确保 files 是一个数组
                        if (!Array.isArray(files)) {
                            files = [];
                        }
                        if (callback) callback(null, files);
                    }).catch((err) => {
                        if (callback) callback(err);
                    });
                },
                
                // 创建目录
                mkdirSync: function(path, options) {
                    var success = AndroidFS.mkdirSync(path);
                    if (!success) {
                        throw new Error('Failed to create directory: ' + path);
                    }
                },
                
                // 删除目录
                rmdirSync: function(path, options) {
                    var success = AndroidFS.rmdirSync(path);
                    if (!success) {
                        throw new Error('Failed to remove directory: ' + path);
                    }
                },
                
                // 异步创建目录
                mkdir: function(path, options, callback) {
                    if (typeof options === 'function') {
                        callback = options;
                        options = null;
                    }
                    
                    new Promise(function(resolve, reject) {
                        try {
                            var success = AndroidFS.mkdirSync(path);
                            if (success) {
                                resolve();
                            } else {
                                reject(new Error('Failed to create directory' + path));
                            }
                        } catch (err) {
                            reject(err);
                        }
                    }).then(function() {
                        if (callback) callback(null);
                    }).catch(function(err) {
                        if (callback) callback(err);
                    });
                },
                
                // 异步删除目录
                rmdir: function(path, options, callback) {
                    if (typeof options === 'function') {
                        callback = options;
                        options = null;
                    }
                    
                    new Promise(function(resolve, reject) {
                        try {
                            var success = AndroidFS.rmdirSync(path);
                            if (success) {
                                resolve();
                            } else {
                                reject(new Error('Failed to remove directory: ' + path));
                            }
                        } catch (err) {
                            reject(err);
                        }
                    }).then(function() {
                        if (callback) callback(null);
                    }).catch(function(err) {
                        if (callback) callback(err);
                    });
                },
                
                // 删除文件
                unlinkSync: function(path) {
                    var success = AndroidFS.unlinkSync(path);
                    if (!success) {
                        throw new Error('Failed to delete file: ' + path);
                    }
                },
                
                // 异步删除文件
                unlink: function(path, callback) {
                    new Promise(function(resolve, reject) {
                        try {
                            var success = AndroidFS.unlinkSync(path);
                            if (success) {
                                resolve();
                            } else {
                                reject(new Error('Failed to delete file'));
                            }
                        } catch (err) {
                            reject(err);
                        }
                    }).then(function() {
                        if (callback) callback(null);
                    }).catch(function(err) {
                        if (callback) callback(err);
                    });
                },
                
                // 获取文件信息
                statSync: function(path) {
                    var json = AndroidFS.statSync(path);
                    if (!json) {
                        var err = new Error('ENOENT: no such file or directory, stat \'' + path + '\'');
                        err.code = 'ENOENT';
                        throw err;
                    }
                    var stat = JSON.parse(json);
                    
                    // 添加方法
                    stat.isFile = function() { return this._isFile; };
                    stat.isDirectory = function() { return this._isDirectory; };
                    stat.isSymbolicLink = function() { return false; }; // Android 不支持符号链接
                    
                    return stat;
                },
                
                // 异步获取文件信息
                stat: function(path, callback) {
                    new Promise(function(resolve, reject) {
                        try {
                            var json = AndroidFS.statSync(path);
                            if (!json) {
                                reject(new Error('ENOENT'));
                                return;
                            }
                            var stat = JSON.parse(json);
                            stat.isFile = function() { return this._isFile; };
                            stat.isDirectory = function() { return this._isDirectory; };
                            resolve(stat);
                        } catch (err) {
                            reject(err);
                        }
                    }).then(function(stat) {
                        if (callback) callback(null, stat);
                    }).catch(function(err) {
                        if (callback) callback(err);
                    });
                },
                
                // 重命名文件
                renameSync: function(oldPath, newPath) {
                    // 简单的重命名实现
                    var content = AndroidFS.readFileSync(oldPath, 'utf-8');
                    if (content === null) {
                        throw new Error('ENOENT: no such file or directory');
                    }
                    AndroidFS.writeFileSync(newPath, content);
                    AndroidFS.unlinkSync(oldPath);
                },
                
                // 追加文件内容
                appendFileSync: function(path, data, options) {
                    var existing = AndroidFS.readFileSync(path, 'utf-8');
                    if (existing === null) {
                        existing = '';
                    }
                    AndroidFS.writeFileSync(path, existing + data);
                }
            };
            
            // 添加 constants
            fs.constants = {
                O_RDONLY: 0,
                O_WRONLY: 1,
                O_RDWR: 2,
                S_IFMT: 61440,
                S_IFREG: 32768,
                S_IFDIR: 16384,
                F_OK: 0,
                R_OK: 4,
                W_OK: 2,
                X_OK: 1
            };
            
            // 添加 promises API
            fs.promises = {
                readFile: function(path, options) {
                    return new Promise(function(resolve, reject) {
                        fs.readFile(path, options, function(err, data) {
                            if (err) reject(err);
                            else resolve(data);
                        });
                    });
                },
                writeFile: function(path, data, options) {
                    return new Promise(function(resolve, reject) {
                        fs.writeFile(path, data, options, function(err) {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                },
                stat: function(path) {
                    return new Promise(function(resolve, reject) {
                        fs.stat(path, function(err, stats) {
                            if (err) reject(err);
                            else resolve(stats);
                        });
                    });
                },
                readdir: function(path) {
                    return new Promise(function(resolve, reject) {
                        fs.readdir(path, function(err, files) {
                            if (err) reject(err);
                            else resolve(files);
                        });
                    });
                },
                mkdir: function(path, options) {
                    return new Promise(function(resolve, reject) {
                        fs.mkdir(path, options, function(err) {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                },
                unlink: function(path) {
                    return new Promise(function(resolve, reject) {
                        fs.unlink(path, function(err) {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            };
            
            ModuleCache['fs'] = fs;
            return fs;
            
        case 'path':
            var path = (function() {
                // 内部工具函数
                function isPathSeparator(code) {
                    return code === 47 || code === 92; // '/' or '\'
                }
                
                function isPosixPathSeparator(code) {
                    return code === 47; // '/'
                }
                
                function normalizeString(path, allowAboveRoot, separator) {
                    var res = '';
                    var lastSegmentLength = 0;
                    var lastSlash = -1;
                    var dots = 0;
                    var code;
                    
                    for (var i = 0; i <= path.length; ++i) {
                        if (i < path.length) {
                            code = path.charCodeAt(i);
                        } else if (isPathSeparator(code)) {
                            break;
                        } else {
                            code = 47; // '/'
                        }
                        
                        if (isPathSeparator(code)) {
                            if (lastSlash === i - 1 || dots === 1) {
                                // NOOP
                            } else if (lastSlash !== i - 1 && dots === 2) {
                                if (res.length < 2 || lastSegmentLength !== 2 || 
                                    res.charCodeAt(res.length - 1) !== 46 || // '.'
                                    res.charCodeAt(res.length - 2) !== 46) { // '.'
                                    if (res.length > 2) {
                                        var lastSlashIndex = res.lastIndexOf(separator);
                                        if (lastSlashIndex !== -1) {
                                            res = res.substring(0, lastSlashIndex);
                                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                                        } else {
                                            res = '';
                                            lastSegmentLength = 0;
                                        }
                                        lastSlash = i;
                                        dots = 0;
                                        continue;
                                    } else if (res.length === 2 || res.length === 1) {
                                        res = '';
                                        lastSegmentLength = 0;
                                        lastSlash = i;
                                        dots = 0;
                                        continue;
                                    }
                                }
                                if (allowAboveRoot) {
                                    if (res.length > 0) {
                                        res += separator + '..';
                                    } else {
                                        res = '..';
                                    }
                                    lastSegmentLength = 2;
                                }
                            } else {
                                if (res.length > 0) {
                                    res += separator + path.substring(lastSlash + 1, i);
                                } else {
                                    res = path.substring(lastSlash + 1, i);
                                }
                                lastSegmentLength = i - lastSlash - 1;
                            }
                            lastSlash = i;
                            dots = 0;
                        } else if (code === 46 && dots !== -1) { // '.'
                            ++dots;
                        } else {
                            dots = -1;
                        }
                    }
                    
                    return res;
                }
                
                // 主 path 模块实现
                return {
                    // 拼接路径
                    join: function() {
                        var paths = Array.prototype.slice.call(arguments);
                        if (paths.length === 0) return '.';
                        
                        // 过滤空路径
                        paths = paths.filter(function(p) {
                            return p && typeof p === 'string';
                        });
                        
                        if (paths.length === 0) return '.';
                        
                        var joined = '';
                        for (var i = 0; i < paths.length; i++) {
                            var arg = paths[i];
                            if (arg.length === 0) continue;
                            
                            if (joined.length === 0) {
                                joined = arg;
                            } else {
                                // 确保 joined 以分隔符结尾
                                if (!isPosixPathSeparator(joined.charCodeAt(joined.length - 1))) {
                                    joined += '/';
                                }
                                // 移除 arg 开头的分隔符
                                if (isPosixPathSeparator(arg.charCodeAt(0))) {
                                    arg = arg.substring(1);
                                }
                                joined += arg;
                            }
                        }
                        
                        return this.normalize(joined);
                    },
                    
                    // 获取目录名
                    dirname: function(p) {
                        if (typeof p !== 'string' || p.length === 0) return '.';
                        
                        // 移除末尾的分隔符
                        var end = -1;
                        for (var i = p.length - 1; i >= 0; i--) {
                            if (isPosixPathSeparator(p.charCodeAt(i))) {
                                end = i;
                            } else {
                                break;
                            }
                        }
                        
                        if (end === -1) return '.';
                        
                        // 查找上一个分隔符
                        for (var i = end - 1; i >= 0; i--) {
                            if (isPosixPathSeparator(p.charCodeAt(i))) {
                                return p.substring(0, i);
                            }
                        }
                        
                        return end === 0 ? '/' : '.';
                    },
                    
                    // 获取文件名
                    basename: function(p, ext) {
                        if (typeof p !== 'string') return '';
                        if (p.length === 0) return '';
                        
                        // 查找最后一个分隔符
                        var start = 0;
                        var end = -1;
                        var matchedSlash = true;
                        
                        for (var i = p.length - 1; i >= 0; i--) {
                            if (isPosixPathSeparator(p.charCodeAt(i))) {
                                if (!matchedSlash) {
                                    start = i + 1;
                                    break;
                                }
                            } else if (end === -1) {
                                matchedSlash = false;
                                end = i + 1;
                            }
                        }
                        
                        if (end === -1) return '';
                        var base = p.substring(start, end);
                        
                        // 移除扩展名
                        if (ext && typeof ext === 'string' && base.endsWith(ext)) {
                            return base.substring(0, base.length - ext.length);
                        }
                        
                        return base;
                    },
                    
                    // 获取扩展名
                    extname: function(p) {
                        if (typeof p !== 'string') return '';
                        if (p.length === 0) return '';
                        
                        var startDot = -1;
                        var startPart = 0;
                        var end = -1;
                        var matchedSlash = true;
                        
                        // 查找最后一个分隔符和点
                        for (var i = p.length - 1; i >= 0; i--) {
                            var code = p.charCodeAt(i);
                            if (isPosixPathSeparator(code)) {
                                if (!matchedSlash) {
                                    startPart = i + 1;
                                    break;
                                }
                            } else {
                                if (end === -1) {
                                    matchedSlash = false;
                                    end = i + 1;
                                }
                                if (code === 46) { // '.'
                                    if (startDot === -1) {
                                        startDot = i;
                                    } else if (startPart >= startDot) {
                                        startDot = i;
                                    }
                                } else if (startDot !== -1) {
                                    break;
                                }
                            }
                        }
                        
                        if (startDot === -1 || 
                            end === -1 ||
                            startPart >= startDot ||
                            startDot === end - 1 && startDot === startPart + 1) {
                            return '';
                        }
                        
                        return p.substring(startDot, end);
                    },
                    
                    // 判断是否绝对路径
                    isAbsolute: function(p) {
                        if (typeof p !== 'string' || p.length === 0) return false;
                        return p.charCodeAt(0) === 47; // '/'
                    },
                    
                    // 解析路径
                    resolve: function() {
                        var resolvedPath = '';
                        var resolvedAbsolute = false;
                        
                        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                            var path = i >= 0 ? arguments[i] : '/';
                            
                            if (typeof path !== 'string') {
                                throw new TypeError('Arguments to path.resolve must be strings');
                            }
                            
                            if (path.length === 0) {
                                continue;
                            }
                            
                            resolvedPath = path + '/' + resolvedPath;
                            resolvedAbsolute = path.charCodeAt(0) === 47; // '/'
                        }
                        
                        // 规范化路径
                        resolvedPath = this.normalize(resolvedPath);
                        
                        if (resolvedAbsolute) {
                            return resolvedPath;
                        }
                        
                        // 如果没有绝对路径，则相对于当前工作目录
                        if (resolvedPath.length === 0) {
                            return '.';
                        }
                        
                        return resolvedPath;
                    },
                    
                    // 规范化路径
                    normalize: function(p) {
                        if (typeof p !== 'string') {
                            throw new TypeError('Path must be a string');
                        }
                        
                        if (p.length === 0) return '.';
                        
                        var isAbsolute = this.isAbsolute(p);
                        var trailingSeparator = isPosixPathSeparator(p.charCodeAt(p.length - 1));
                        
                        // 规范化字符串
                        p = normalizeString(p, !isAbsolute, '/');
                        
                        if (p.length === 0 && !isAbsolute) {
                            p = '.';
                        }
                        
                        if (p.length === 0 && isAbsolute) {
                            return '/';
                        }
                        
                        if (trailingSeparator && !isPosixPathSeparator(p.charCodeAt(p.length - 1))) {
                            p += '/';
                        }
                        
                        return isAbsolute ? '/' + p : p;
                    },
                    
                    // 获取相对路径
                    relative: function(from, to) {
                        if (typeof from !== 'string' || typeof to !== 'string') {
                            throw new TypeError('Arguments must be strings');
                        }
                        
                        if (from === to) return '';
                        
                        // 规范化路径
                        from = this.resolve(from);
                        to = this.resolve(to);
                        
                        if (from === to) return '';
                        
                        // 查找共同前缀
                        var fromStart = 1;
                        var toStart = 1;
                        var fromEnd = from.length;
                        var toEnd = to.length;
                        var length = fromEnd < toEnd ? fromEnd : toEnd;
                        
                        // 查找共同前缀的长度
                        var lastCommonSep = -1;
                        var i = 0;
                        for (; i < length; i++) {
                            var fromCode = from.charCodeAt(i);
                            var toCode = to.charCodeAt(i);
                            
                            if (fromCode !== toCode) break;
                            
                            if (fromCode === 47) { // '/'
                                lastCommonSep = i;
                            }
                        }
                        
                        if (i === length) {
                            if (toEnd > length) {
                                if (to.charCodeAt(length) === 47) { // '/'
                                    return to.substring(length + 1);
                                }
                                if (length === 0) {
                                    return to.substring(length);
                                }
                            } else if (fromEnd > length) {
                                if (from.charCodeAt(length) === 47) { // '/'
                                    lastCommonSep = length;
                                }
                            }
                        }
                        
                        var out = '';
                        // 生成父目录引用
                        for (i = fromStart; i <= fromEnd; ++i) {
                            if (i === fromEnd || from.charCodeAt(i) === 47) { // '/'
                                if (lastCommonSep === -1) {
                                    out += out.length === 0 ? '..' : '/..';
                                } else if (i > lastCommonSep + 1) {
                                    out += out.length === 0 ? '..' : '/..';
                                }
                            }
                        }
                        
                        // 添加目标路径的剩余部分
                        if (out.length > 0) {
                            return out + to.substring(lastCommonSep + 1);
                        } else {
                            // 没有父目录引用
                            var toRest = to.substring(lastCommonSep + 1);
                            if (toRest.length === 0) return '.';
                            return toRest;
                        }
                    },
                    
                    // 分割路径
                    parse: function(p) {
                        if (typeof p !== 'string') {
                            throw new TypeError('Path must be a string');
                        }
                        
                        var root = '';
                        var dir = '';
                        var base = '';
                        var ext = '';
                        var name = '';
                        
                        // 检查是否为绝对路径
                        if (p.length > 0 && p.charCodeAt(0) === 47) { // '/'
                            root = '/';
                        }
                        
                        // 获取扩展名
                        ext = this.extname(p);
                        
                        // 获取 basename
                        var basename = this.basename(p, ext);
                        
                        // 获取 dirname
                        dir = this.dirname(p);
                        if (dir === '.') {
                            dir = '';
                        }
                        
                        // 组合结果
                        return {
                            root: root,
                            dir: dir,
                            base: basename + ext,
                            ext: ext,
                            name: basename
                        };
                    },
                    
                    // 格式化对象为路径
                    format: function(pathObject) {
                        if (pathObject === null || typeof pathObject !== 'object') {
                            throw new TypeError('Parameter "pathObject" must be an object, not ' + typeof pathObject);
                        }
                        
                        var root = pathObject.root || '';
                        var dir = pathObject.dir;
                        var base = pathObject.base || '';
                        
                        if (!dir) {
                            if (root) {
                                return root + base;
                            }
                            return base;
                        }
                        
                        if (dir === root) {
                            return dir + base;
                        }
                        
                        return dir + '/' + base;
                    },
                    
                    // 分隔符
                    sep: '/',
                    delimiter: ':'
                };
            })();
            
            // 添加 win32 版本（用于跨平台兼容）
            path.win32 = {
                join: function() {
                    var paths = Array.prototype.slice.call(arguments);
                    if (paths.length === 0) return '.';
                    
                    // 过滤空路径
                    paths = paths.filter(function(p) {
                        return p && typeof p === 'string';
                    });
                    
                    if (paths.length === 0) return '.';
                    
                    var joined = '';
                    for (var i = 0; i < paths.length; i++) {
                        var arg = paths[i];
                        if (arg.length === 0) continue;
                        
                        if (joined.length === 0) {
                            joined = arg;
                        } else {
                            // 确保 joined 以分隔符结尾
                            if (joined.charCodeAt(joined.length - 1) !== 92) { // '\'
                                joined += '\\';
                            }
                            // 移除 arg 开头的分隔符
                            if (arg.charCodeAt(0) === 92) { // '\'
                                arg = arg.substring(1);
                            }
                            joined += arg;
                        }
                    }
                    
                    // 规范化路径
                    return joined.replace(/\\+/g, '\\').replace(/\\$/, '') || '.';
                },
                sep: '\\',
                delimiter: ';'
            };
            
            // 添加 posix 版本
            path.posix = path;
            
            ModuleCache['path'] = path;
            return path;
            
        case 'os':
            // 简单的 os 模块实现
            var os = {
                platform: function() { return 'android'; },
                tmpdir: function() { return '/data/local/tmp'; },
                homedir: function() { return '/data/data/' + (window.packageName || 'com.example.app'); },
                type: function() { return 'Linux'; },
                arch: function() { 
                    // 尝试检测架构
                    if (typeof navigator !== 'undefined' && navigator.userAgent) {
                        var ua = navigator.userAgent.toLowerCase();
                        if (ua.indexOf('arm') !== -1) return 'arm';
                        if (ua.indexOf('x86') !== -1 || ua.indexOf('x64') !== -1) return 'x64';
                    }
                    return 'unknown'; 
                },
                cpus: function() { return []; },
                totalmem: function() { return 0; },
                freemem: function() { return 0; },
                uptime: function() { return 0; },
                networkInterfaces: function() { return {}; },
                hostname: function() { return 'android-device'; },
                loadavg: function() { return [0, 0, 0]; },
                release: function() { return ''; },
                endianness: function() { return 'LE'; },
                EOL: '\n'
            };
            ModuleCache['os'] = os;
            return os;
            
        default:
            // 尝试加载内置模块
            if (moduleName.startsWith('./') || moduleName.startsWith('../') || moduleName.startsWith('/')) {
                // 这是相对或绝对路径，尝试加载文件
                try {
                    var content = AndroidFS.readFileSync(moduleName, 'utf-8');
                    if (content === null) {
                        throw new Error('Cannot find module: ' + moduleName);
                    }
                    // 创建一个模块对象
                    var module = { exports: {} };
                    var exports = module.exports;
                    // 执行模块代码
                    eval(content);
                    ModuleCache[moduleName] = module.exports;
                    return module.exports;
                } catch (err) {
                    throw new Error('Cannot find module: ' + moduleName);
                }
            }
            
            // 其他模块抛出错误
            var err = new Error('Cannot find module: \'' + moduleName + '\'');
            err.code = 'MODULE_NOT_FOUND';
            throw err;
    }
};

console.log('Android wrappers loaded successfully');