const express = require('express');
const app = module.exports = express();

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    serveClient: false,
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie:false
});



/**************************/
//         Bot MSG        //
/**************************/

//A map that store the Client object of the Quested Administrator//
var Conversation = new Map();

io.on('connect', function(client){
    //Client joined Chat support --> Owner data.//
    client.on('join', function(Owner) {
        client.Owner = Owner;

        //New user joined Support channel. Draw default Message
        Conversation.set(Owner.DiscordOauth.id)
        client.emit("SendMSG", [
            {type:"msg", content:"BipBop ~ I'm the Quested Bot. What can I do for you ?", timeout:1000},
            {type:"button", content:"What is Quested Exaclty?", id:1, timeout:0},
            {type:"button", content:"What can I do with Quested?", id:2, timeout:0},
            {type:"button", content:"What is the price of Quested?", id:3, timeout:0},
            {type:"OpenTicket", content:"Contact a Human", id:4, timeout:0}
            ]  
        )

    });


    client.on("SendMSG", function(Message){
        if(Message === "What is Quested?"){
            client.emit("SendMSG", ["Quested is a Bot thinked to improve your Discord server attractivity. You can use a great variaty of tools to customize the bot behavior. We have an API, a Feedback tools, a Score system... ", 
                                    "You can read this article to get an overview of everything"]);
        }
        if(Message === "What can I do with Quested?"){
            client.emit("SendMSG", ["A lot of great things ! You can start by creating automatic Welcome messages for your users.", 
                                    "To a choose-a-side system so you users can pick the faction they want",
                                    "And finish by integrating the Quested API in your own game/application.", 
                                    "If you need something we haven't developped yet, you can visit the Quested Feedback page and ask for what you need !"])
        }
        if(Message === "Does Quested will cost anything?"){
            client.emit("SendMSG", ["Quested is completly free if your Discord server is under 100 members.", 
                                    "Between 100 to 2500 members, Quested will cost you 5.99€ per month if you want to keep the Premium functionnalities.",
                                    "If your server have over 2500 members, Quested will cost you 15.99€ per month.",
                                    "You can create a Test server and play with all the features of the bot if you want :)"])
        }
        if(Message === "I want to speak to the Manager"){
            client.emit("SendMSG", ["The best way to speak to a human is to contact us by Email : //TODO",
                                    "Or if you have twitter : //TODO"])
        }
        //Server received the MSG, so tell the client to draw it//
        client.emit('DrawMSG', Message);
    })
    client.on('disconnect', function(Reason){})
})

server.listen(3000);
