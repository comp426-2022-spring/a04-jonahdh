import express from 'express';
import minimist from 'minimist';
import { coinFlip, coinFlips, countFlips, flipACoin } from './modules/coin.mjs';
import db from './modules/database.mjs';

const args = minimist(process.argv.slice(2));

args['port'];
args['debug'];
args['log'];
args['help'];

console.log(args);
// Help message + routine if --help is flagged
const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help);
    process.exit(0);
}

const HTTP_PORT = args.port || 5000;
const app = express();

// Start an app server
const server = app.listen(HTTP_PORT, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',HTTP_PORT))
});

if (!(args.log == "false")) {
    app.use((req, res, next) => {
        let logdata = {
            remoteaddr: req.ip,
            remoteuser: req.user,
            time: Date.now(),
            method: req.method,
            url: req.url,
            protocol: req.protocol,
            httpversion: req.httpVersion,
            status: res.statusCode,
            referer: req.headers['referer'],
            useragent: req.headers['user-agent']
        }
        const tableHeaders = '(remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent)';
        const tableValues = `(\'${logdata.remoteaddr}\', \'${logdata.remoteuser}\', 
        \'${logdata.time}\', \'${logdata.method}\', \'${logdata.url}\', \'${logdata.protocol}\', \'${logdata.httpversion}\', \'${logdata.status}\', \'${logdata.referer}\', \'${logdata.useragent}\')`;
        
        var foo = 'INSERT INTO accesslog ' + tableHeaders + ' VALUES ' + tableValues;

        const stmt = db.prepare(foo);
        stmt.run();
        next();
    })
}

app.get('/app/', (req, res) => {
    // Respond with status 200
        res.statusCode = 200;
    // Respond with status message "OK"
        res.statusMessage = 'OK';
        res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
        res.end(res.statusCode+ ' ' +res.statusMessage)
});

app.get('/app/flip/', (req, res) => {
        res.statusCode = 200;
        res.json({flip: coinFlip()});
});

app.get('/app/flips/:number/', (req, res) => {
        res.statusCode = 200;
        const flips = coinFlips(req.params.number);
        res.json({raw: flips, summary: countFlips(flips)});
});

app.get('/app/flip/call/:call(heads|tails)/', (req, res) => {
        res.statusCode = 200;
        res.json(flipACoin(req.params.call))
});

if (args.debug) {
    app.get('/app/log/access/', (req, res) => {
        res.statusCode = 200;
        const stmt = db.prepare((`SELECT * FROM accesslog;`));
        res.send(stmt.all());
    });

    app.get('/app/error/', (req, res) => {
        throw new Error('Error test successful.');
    });
}

app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});