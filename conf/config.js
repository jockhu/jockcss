/**
 * @name app config for Nodejs framework
 * @version undefined
 * @author Jock
 *
 * The main configuration file is some constant,
 * for the basic configuration of the framework.
 *
 *
 * example
 *
 *         node service.js
 *
 */


/**
 * Default config path, rewrite app conf
 * @const
 */
exports.userConfigPath = process.argv[2] || '';

/**
 * Default port
 * @const
 */
exports.port = 8089;

/**
 * Default debug
 * @const
 */
exports.debug = true;

/**
 * Default enable compression
 * @const
 */
exports.enableCompress = false;

/**
 * Default version
 * @const
 */
exports.version = '';

/**
 * Default root path
 * @const
 */
exports.root = 'libs';

/**
 * Default cache path
 * @const
 */
exports.cache = 'cache';

/**
 * Default log path
 * @const
 */
exports.logPath = 'log';

/**
 * Default style hosts
 * @const
 */
exports.cssHost = '';

/**
 * Default style path
 * @const
 */
exports.cssPath = 'css';

/**
 * Default enable access log
 * @const
 */
exports.enableAccessLog = false;

/**
 * Default enable error log
 * @const
 */
exports.enableErrorLog = false;

/**
 * Default mineType
 * @const
 */
exports.mineType = 'text/css';

/**
 * Default transfer Encoding
 * @const
 */
exports.transferEncoding = 'UTF-8';

/**
 * Default enable gzip
 * @const
 */
exports.enableGzip = true;

/**
 * Default enable cache
 * @const
 */
exports.enableCache = false;

/**
 * Default expires maxAge 1 years
 * @const
 */
exports.maxAge = 60*60*24*365;

/**
 * Default except -> uglify object property
 * @const
 */
exports.except = ['#'];
