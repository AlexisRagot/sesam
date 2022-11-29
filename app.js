var express = require('express');
var app = express();

var config = require('./config')

/* airbrake */
if ( config.USE_AIRBRAKE ){
    var airbrake = require('airbrake').createClient(config.AIRBRAKE_API_KEY, 'production');
    airbrake.serviceHost = config.AIRBRAKE_SERVICE_HOST;
    app.use(airbrake.expressHandler());
}

var gpio = require('rpi-gpio');
// const { RTMClient } = require('@slack/rtm-api');
var SlackBot = require('slackbots');


var pin = 11;
var doorTimeout = 3;
var relayOpen = false;
// var slack = new RTMClient(config.SLACK_TOKEN, { autoReconnect: true });
var bot = new SlackBot({
    token: config.SLACK_TOKEN,
    name: "Sesam"
});

/* gpio */
// Open pin for output
gpio.setup(pin, gpio.DIR_OUT, write);
function write(err) {
    if (err) throw err;
    gpio.write(pin, true, function(err) {
        if (err) throw err;
        console.log('Written to pin');
    });
}

app.get('/', function (req, res) {
    res.send('Hello World!')
})

var server = app.listen(3000, function () {

    var host = server.address().address
    var port = server.address().port

    console.log('Example app listening at http://%s:%s', host, port)

})

/* Slack */
bot.on('message', function(message) {
    var type = message.type,
        channel = bot.getChannelById(message.channel),
        user = bot.getUserById(message.user),
        time = message.ts,
        text = message.text,
        response = '';

    if (user === undefined){
        /* skip channel messages(skip the messages which are not sent to sesame directly) */
        return true;
    }
    console.log('Received: %s %s @%s %s "%s"', type, (channel.is_channel ? '#' : '') + channel.name, user.name, time, text);

    if (type === 'message' && user.name === 'Alexis Ragot') {
        if (text === 'open' || (text.indexOf('open ') === 0)){
            if (text === 'open') {
                doorTimeout = 3;
            } else {
                doorTimeout = parseInt(text.replace("open ", ""));
            }

            if (doorTimeout > 10) {
                doorTimeout = 3;
            }

            if (doorTimeout == 0) {
                closeRelay();
            } else {
                openDoor(doorTimeout);
            }
            response = 'ok';
            channel.send(response);
            console.log('@%s responded with "%s"', slack.self.name, response);
        }
    }
});

bot.on('error', function(error) {
    console.error('Error: %s', error);
});

// (async () => {
//     await slack.start();
// })();
bot.login();

/* /slack */
function openDoor(doorTimeout){
    doorTimeout = doorTimeout || 1;
    if(!relayOpen){
        relayOpen = true;
        console.log('open called');

        gpio.write(pin, false, function(err) {
            if (err) throw err;
            console.log('Written to pin');
        });

        setTimeout(function() {
            closeRelay();
        }, (doorTimeout * 1000));
    }
}

function closeRelay(){
    gpio.write(pin, true, function(err) {
        if (err) throw err;
        console.log('Written to pin');
    });
    console.log('closed!');
    relayOpen = false;
}
module.exports = app;
