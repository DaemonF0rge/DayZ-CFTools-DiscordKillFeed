const express = require('express');
const { Webhook } = require('discord-webhook-node');
const bodyParser = require('body-parser');
const app = express();
var crypto = require('crypto');
const config = require('./config.json');

app.use(bodyParser.json());

app.use('/DiscordKillfeed/:name', (req,res)=>{
    sendDiscord(req.body, res, req.params.name)
});

app.listen(config.port, function () {
    console.log('API Webservice listening on port "' + config.port + '"!')
});

function sendDiscord(Data, res, name){
    var hookdata = GetWebhook(name);
    const hash = crypto.createHash('sha256').update(Data.invoked+":"+hookdata.Secret).digest('hex');
    if (hash == Data.signature){
        if (Data.event == "player_kill"){
            const hook = new Webhook(hookdata.Webhook);
            var eventdata = Data.payload;
            var victim = eventdata.names.victim;
            var killer = eventdata.names.murderer;
            var weapon = eventdata.weapon;
			var distance = "";
			if (config.ShowDistance){
				distance = " at " + eventdata.distance + "m";
			}
            var message = ":skull: " + killer + " killed " + victim + " with a " + weapon + distance;
            console.log("Server: " + name + " Event: " + Data.event + " Killfeed Event Sent to Discord: " + ":skull: " + killer + " killed " + victim + " with a " + weapon + distance);
            hook.send(message);
        } else {
            console.log("Server: " + name + " Event: " + Data.event);
        }
        res.send("OK");
    } else {
        console.log("Server: " + name + " Sent Invalid Data" );
		res.status(401);
        res.send("BAD");
    }
}

function GetWebhook(name){
    const KillfeedsArray = config.Killfeeds;
    for (var value of KillfeedsArray) {
        if(value.Name === name){
            return value;
        }
    }
}