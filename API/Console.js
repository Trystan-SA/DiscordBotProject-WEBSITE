
const pino = require('pino')
const chalk = require('chalk')

var log = ""
if(process.env.NODE_ENV === 'dev'){
    log = pino({
        prettyPrint :{
            colorize: true,
            crlf: false,
            levelFirst : false,
            timestampKey : 'false',
            translateTime: true,
            ignore: 'pid,hostname'
        },
        level: "trace"
    })

    var Time = new Date();
    var DisplayTime = chalk.cyan('[' + Time.getHours() + ':' + Time.getMinutes() + ':' + Time.getSeconds() + ']' ) + chalk.cyan('[' + Time.getDate() + '/' + Time.getMonth() + '/' + Time.getFullYear() + ']');

    var INFO_PREFIX = DisplayTime + chalk.blue(" [INFO]");
    var NOTICE_PREFIX = DisplayTime + chalk.green(" [NOTICE]");
    var ERROR_PREFIX = DisplayTime + chalk.yellow(" [ERROR]");
    var WARN_PREFIX = DisplayTime + chalk.red(" [WARN]  ");
    var CRITICAL_PREFIX = DisplayTime + chalk.red.bgYellow.bold(" [CRITICAL]");

    console.info = function(){
        var args = Array.prototype.slice.call(arguments);
        args.unshift(INFO_PREFIX + " ");
        console.log.apply(console, args);
    }

    console.notice = function(){
        var args = Array.prototype.slice.call(arguments);
        args.unshift(NOTICE_PREFIX + " ");
        console.log.apply(console, args);
    }

    console.error = function(){
        var args = Array.prototype.slice.call(arguments);
        args.unshift(ERROR_PREFIX + " ");
        console.log.apply(console, args);
    }

    console.warn = function(){
        var args = Array.prototype.slice.call(arguments);
        args.unshift(WARN_PREFIX + " ");
        console.log.apply(console, args);
    }

    console.critical = function(){
        var args = Array.prototype.slice.call(arguments);
        args.unshift(CRITICAL_PREFIX + " ");
        console.log.apply(console, args);
    }
}



else {
    log = pino({
        name: "Quested",
        level: "info"
    })

    console.log = async function(){
        var args = Array.prototype.slice.call(arguments);
        log.debug(args[0]);
    }

    console.info = async function(){
        var args = Array.prototype.slice.call(arguments);
        log.info(args[0]);
    }

    console.notice = async function(){
        var args = Array.prototype.slice.call(arguments);
        log.trace(args[0])
    }

    console.error = async function(){
        var args = Array.prototype.slice.call(arguments);
        log.error(args[0])
    }

    console.warn = async function(){
        var args = Array.prototype.slice.call(arguments);
        log.warn(args[0]);
    }

    console.critical = async function(){
        var args = Array.prototype.slice.call(arguments);
        log.fatal(args[0])
    }
}





