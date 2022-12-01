var express = require('express');
var app = express();

var config = require('./config')

/* airbrake */
if ( config.USE_AIRBRAKE ){
    var airbrake = require('airbrake').createClient(config.AIRBRAKE_API_KEY, 'production');
    airbrake.serviceHost = config.AIRBRAKE_SERVICE_HOST;
    app.use(airbrake.expressHandler());
}

// var gpio = require('rpi-gpio');
// const { RTMClient } = require('@slack/rtm-api');
var SlackBot = require('slackbots');
const util = require("util");


var pin = 11;
var doorTimeout = 3;
const botResponses = [
    'Vos désirs sont des ordres <@%s>',
    'J\'éxécute de ce pas <@%s>',
    'Je ne suis fait que pour ça maitre-sse <@%s>',
    'J\'étais sur qu\'on allait me demander ça, c\'est fait <@%s>',
    'Et si tu le faisait toi même <@%s> ? Non c\'est bon, j\'y vais...'
]
var relayOpen = false;
// var slack = new RTMClient(config.SLACK_TOKEN, { autoReconnect: true });
var bot = new SlackBot({
    token: config.SLACK_TOKEN,
    name: "Sesam"
});

/* gpio */
// Open pin for output
// gpio.setup(pin, gpio.DIR_OUT, write);
// function write(err) {
//     if (err) throw err;
//     gpio.write(pin, true, function(err) {
//         if (err) throw err;
//         console.log('Written to pin');
//     });
// }

app.get('/', function (req, res) {
    res.send('Hello World!')
})

var server = app.listen(3000, function () {

    var host = server.address().address
    var port = server.address().port

    console.log('Example app listening at http://%s:%s', host, port)

})

/* Slack */
bot.on('message', async function (message) {
    var type = message.type,
        user = message.user,
        channel = message.channel,
        time = message.ts,
        text = message.text,
        response = '';

    if (['hello', 'user_typing', 'error'].includes(type)) {
        return true;
    }

    try {
        console.log(message.type);
        channel = await bot.getChannelById(message.channel)
        user = await bot.getUserById(message.user);
    } catch (e) {
        return true
    }

    if (user === undefined || channel=== undefined) {
        return true;
    }

    console.log('Received: %s %s @%s %s "%s"', type, (channel.is_channel ? '#' : '') + channel.name, user.name, time, text);

    if (type === 'message' && user.name === 'alexis.ragot') {
        if (['open', 'ouvre', 'sesam'].some((item) => text.toLowerCase().indexOf(item) > -1)){

            console.log("fake openDoor call : " + doorTimeout)
            openDoor(doorTimeout);

            response = util.format(botResponses[Math.floor(Math.random() * botResponses.length)], user.name)
            await bot.postMessageToChannel(channel.name, response)
            // channel.send(response);
            console.log('@%s responded with "%s"', bot.self.name, response);
        }
    }
});

bot.on('error', function(error) {
    console.error('Error: %s', error);
});

// (async () => {
//     await slack.start();
// })();
// bot.login();

/* /slack */
function openDoor(doorTimeout){
    doorTimeout = doorTimeout || 1;
    if(!relayOpen){
        relayOpen = true;
        console.log('open called');

        // gpio.write(pin, false, function(err) {
        //     if (err) throw err;
        //     console.log('Written to pin');
        // });

        setTimeout(function() {
            console.log("fake closeRelay call by timeout")
            // closeRelay();
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
