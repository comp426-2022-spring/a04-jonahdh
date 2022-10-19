import express from 'express';
import minimist from 'minimist';
import { coinFlip, coinFlips, countFlips, flipACoin } from './modules/coin.mjs';

const args = minimist(process.argv.slice(2));

args['port'];

const HTTP_PORT = args.port || 5000;
const app = express();

// Start an app server
const server = app.listen(HTTP_PORT, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',HTTP_PORT))
});

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

app.get('/app/flip/call/heads/', (req, res) => {
        res.statusCode = 200;
        res.json(flipACoin("heads"))
});

app.get('/app/flip/call/tails/', (req, res) => {
    res.statusCode = 200;
    res.json(flipACoin("tails"))
});

app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});