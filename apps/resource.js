/**
 *
 * resource.js
 *
 */
(function(){

var conf = require("../conf/config"),
    Router = require("./router").Router,
    Fs = require("fs"),
    Log = require("./log").Log,
    Utils = require("./utils");
    try{Utils.extend(conf, require('cssConfig'))}catch(e){}

/**
 * Resource(request, response)
 *
 * @param {Object} request A http.ServerRequest instance.
 * @param {Object} response A http.ServerResponse instance.
 * @return {Object} Resource
 */
var Resource = exports.Resource = function(request, response) {

    /**
     * Sets request as http.ServerRequest instance
     */
    this.req = request;

	this.referer = ' Referer:' + request.headers.referer;

    /**
     * Sets response as http.ServerResponse instance
     */
    this.res = response;

    /**
     * Definde asset
     */
    this.router = null;

    /**
     * Definde modules
     */
    this.modules = [];

    /**
     * Definde Regex require
     */
    this.regRequire = /\/\/\/\s*require\('(\w+(\.\w+)?)'\)/gi;

    /**
     * Definde Regex module.
     */
    this.regModule = /[^\w\.]+/gi;

    /**
     * Sets enable Compress
     * @const
     */
    this.enableCompress = conf.enableCompress || false;

    /**
     * Definde urlPath.
     * @const
     */
    this.urlPath = '';

    /**
     * Definde request modules.
     * @const
     */
    this.mods = [];

	/**
     * Definde release version.
     * @const
     */
    this.releaseVersion = '';

    /**
     * init
     */
    this.init();

};
/**
 *
 * Resource.init()
 *
 * Resource initialize.
 *
 */
Resource.prototype.init = function() {
    this.router = new Router(this.req, this.res);
    this.urlPath = this.getPath().slice(1); // remove '/'
    this.cssPath = conf.cssPath ? conf.cssPath + '/' : '';
    this.loadUrlInfos(this.urlPath);
}
/**
 *
 * Resource.loadUrlInfos()
 *
 * Get request modules and version information
 *
 */
Resource.prototype.loadUrlInfos = function(path) {
    var modules = [];
    modules = path.split(this.regModule);
	this.releaseVersion = modules.pop().replace(/\.css.*/gi,''); // remove last item and building release versions
    this.cssPath && modules.splice(0,1);
    this.mods = modules;
}

/**
 *
 * Resource.compress(buf)
 *
 * Set modules
 *
 *
 */
Resource.prototype.compress = function(buf) {
    if(this.enableCompress){
        Log.log('Compress enabled.');
        return buf.replace(/\n/g,'').
            replace(/\/\*[^\/]*\*\//g,'').
            replace(/\s*{\s*/g,'{').
            replace(/\s*}\s*/g,'}').
            replace(/\s*:\s*/g,':').
            replace(/\s*;\s*/g,';').
            replace(/;}\s*/g,'}');
    }else return buf;
}
/**
 *
 * Resource.addModules(module)
 *
 * Set modules
 *
 *
 */
Resource.prototype.addModules = function(module) {
    this.modules.push(module);
}

/**
 *
 * Resource.getModules()
 *
 * Get modules
 *
 * @return modules
 *
 */
Resource.prototype.getModules = function() {
    return this.modules
}

/**
 *
 * Resource.existsModules(module)
 *
 * Is exists
 *
 * @return 0 | 1
 *
 */
Resource.prototype.existsModules = function(module) {
    var property = module, module = module.replace(/\.\w+/g,'');
    var modules = this.getModules();
    for(var i=0; i<modules.length; i++){
        if(modules[i] === module || modules[i] === property){
            return 1;
        }
    }
    return 0;
}

/**
 *
 * Resource.getResource()
 *
 * Get resource
 *
 * @return resource
 *
 */
Resource.prototype.getResource = function() {
    var path = this.getRealCacheFilePath(), cacheFile = path + '/' + this.mods.join(',')+'.css', result = '', expires = new Date();
    Log.access(this.req.url + this.referer);

    if(this.mods.length === 0) return '';

    function cpress(){
        return this.compress(this.loadResource());
    }

    try{
        if(conf.enableCache) {
            result = Fs.readFileSync(cacheFile).toString();
            Log.log('load file from cache:',cacheFile);
        }else{
            result = cpress.call(this);
        }
    }catch(e){
        result = cpress.call(this);
        if(conf.enableCache && result.length > 0){
            if(!Fs.existsSync(path)){
                try{
                    Fs.mkdirSync(path);
                }catch(e){
                    Log.error('Call getResource: mkdirSync Error, ' + e + this.referer);
                };
            }
            try{
                //Fs.writeFileSync(cacheFile, result);
                Fs.writeFile(cacheFile, result, function (err) {
                    if(err) Log.error('Call getResource: writeFile Error, ' + err + this.referer);
                    else Log.log(cacheFile + ' It\'s saved!');
                });
            }catch(e){
                Log.error('Call getResource: writeFile Error, ' + e + this.referer);
            }
        }
    };
    
    this.res.setHeader("Connection", 'Close');
    this.res.setHeader("ETag", expires.getTime().toString(36));
    this.res.setHeader("Last-Modified", expires.toUTCString());
    expires.setTime(expires.getTime() + (conf.maxAge * 10000));
    this.res.setHeader("Expires", expires.toUTCString());
    this.res.setHeader("Cache-Control", 'public, max-age=' + conf.maxAge);
    return result;
}

/**
 *
 * Resource.validateModule()
 *
 * @return Boolean
 *
 */
Resource.prototype.validateModule = function(module) {
    return /^[a-z]+[\.]?[a-zA-Z_]+$/.test(module)
}

/**
 *
 * Resource.loadResource()
 *
 * Get resource
 *
 * @return resource
 *
 */
Resource.prototype.loadResource = function(modules) {
    var modules = modules || this.mods, resFiles = [], cMod;
    Log.log('loadResource -> modules',modules)
    for(var i=0; i<modules.length; i++){
        cMod = modules[i];
        if(!this.validateModule( cMod )) continue;
        Log.log('loadResource -> module', cMod);
        var requrieType = this.getRequireType( cMod );
        Log.log('loadResource -> requrieType',requrieType)
        if(1 == requrieType) // module
            resFiles.push(this.loadFiles( cMod ));
        else if(2 == requrieType) // property
            resFiles.push(this.loadFile( this.getRealFilePath( this.stringToPath( cMod ) ) + '.css' ));

    }

    return resFiles.join('');
}

/**
 *
 * Resource.loadFiles()
 *
 * Load resource
 *
 * @return module Content String
 *
 */
Resource.prototype.loadFiles = function(module) {
    if(this.existsModules(module)) return '';
    var moduleContent = this.readFiles(this.getRealFilePath(module), module);
    this.addModules(module);
    return moduleContent;
}
/**
 *
 * Resource.readFiles()
 *
 * Get files
 *
 * @return string
 *
 */
Resource.prototype.readFiles = function(path, module) {
    var files = [], moduleJs = module+'.css', idx = 0, list = [];
    Log.log('readFiles -> path',path)
    try{
        files = Fs.readdirSync(path);
    }catch(e){
        Log.error('Call readFiles: readdirSync Error, Path: ' + path +' ' + e.toString() + this.referer)
    }

    for(var i=0; i<files.length; i++){
        if(files[i] === moduleJs){
            idx = i;
            break;
        }
    }

    if(idx > 0){
        files.splice(idx, 1);
        files.unshift(moduleJs);
    }

    for(var i=0; i<files.length; i++){
        list.push(this.loadFile(path +'/'+ files[i]));
    }

    return list.join('');

}
/**
 *
 * Resource.loadFile()
 *
 * Get file
 *
 * @return string
 *
 */
Resource.prototype.loadFile = function(file) {
    var content = [], fileContent = '', newModules = [], module = this.pathToString(file); // as dom.get
    if(this.existsModules(module)) return '';
    try{
        fileContent = Fs.readFileSync(file).toString();
        this.addModules(module);
        Log.log('load file:',file);
    }catch(e){
        Log.error('Call loadFiles: readFileSync Error, File: ' + file +' ' + e.toString() + this.referer)
    }

    newModules = (fileContent) ? this.getFileFromRequire(fileContent) : [];
    if(newModules.length > 0){
        Log.log('find require:',newModules)
        content.push(this.loadResource(newModules));
    }

    content.push(fileContent);

    return content.join('');
}
/**
 *
 * Resource.getFileFromRequire()
 *
 * @return array
 *
 */
Resource.prototype.getFileFromRequire = function(content) {
    var modules = [],result;
    while((result = this.regRequire.exec(content)) != null){
        if(!this.existsModules(result[1]))
            modules.push(result[1]);
    }
    return modules;
}
/**
 *
 * Resource.getRequireType()
 *
 * Get require type , 1:module, 2:property
 *
 * @return int
 *
 */
Resource.prototype.getRequireType = function(reqString) {
    return /\./g.test(reqString) ? 2 : 1;
}
/**
 *
 * Resource.pathToString()
 *
 * Sets path to string
 *
 * @return string
 *
 */
Resource.prototype.pathToString = function(reqString) {
    return reqString.replace(this.router.getLibsFilePath()+'/', '').replace(/\//g, '.').replace(/\.css/gi,'');
}
/**
 *
 * Resource.stringToPath()
 *
 * Sets dot to path
 *
 * @return string
 *
 */
Resource.prototype.stringToPath = function(reqString) {
    return reqString.replace(/\./g, '/');
}

/**
 *
 * Resource.getPath()
 *
 * Get path
 *
 * @return path
 *
 */
Resource.prototype.getPath = function() {
    return this.router.getRealPath();
}

/**
 *
 * Resource.getHost()
 *
 * Get host
 *
 * @return host
 *
 */
Resource.prototype.getHost = function() {
    return this.router.getHost();
}


/**
 *
 * Resource.getRealFilePath(file)
 *
 * Get real file path
 *
 * @return path
 *
 */
Resource.prototype.getRealFilePath = function(file) {
    return this.router.getLibsFilePath() + '/' + file;
}

/**
 *
 * Resource.getRealCacheFilePath(file)
 *
 * Get real cache file path
 *
 * @return path
 *
 */
Resource.prototype.getRealCacheFilePath = function() {
    return this.router.getCacheFilePath() + '/' + this.getReleaseVersion();
}

/**
 *
 * Resource.getReleaseVersion()
 *
 * Get release version
 *
 * @return path
 *
 */
Resource.prototype.getReleaseVersion = function() {
	return conf.version || this.releaseVersion;
}

})();