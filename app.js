const express = require('express');
const app = express();
const config = require('./config')
const util = require("util");
const SlackBot = require('slackbots');
const Gpio = require('onoff').Gpio;

/* airbrake */
if ( config.USE_AIRBRAKE ){
    var airbrake = require('airbrake').createClient(config.AIRBRAKE_API_KEY, 'production');
    airbrake.serviceHost = config.AIRBRAKE_SERVICE_HOST;
    app.use(airbrake.expressHandler());
}

const botResponses = [
    'Vos désirs sont des ordres <@%s>',
    'J\'éxécute de ce pas <@%s>',
    'Je ne suis fait que pour ça maitre-sse <@%s>',
    'J\'étais sur qu\'on allait me demander ça, c\'est fait <@%s>',
    'Et si tu le faisait toi même <@%s> ? Non c\'est bon, j\'y vais...'
]
const relay = new Gpio(17, 'out');
const doorTimeout = 3;
var relayOpen = false;

var bot = new SlackBot({
    token: config.SLACK_TOKEN,
    name: "Sesam"
});

relay.writeSync(1)

app.get('/', function (req, res) {
    res.send('Hello World!')
})

const server = app.listen(3000, function () {
    const host = server.address().address;
    const port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port)
});

/* Slack */
bot.on('message', async function (message) {
    let type = message.type,
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
    console.log("fake openDoor call : " + doorTimeout)
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
    // gpio.write(pin, true, function(err) {
    //     if (err) throw err;
    //     console.log('Written to pin');
    // });
    console.log('closed!');
    relayOpen = false;
}
module.exports = app;
