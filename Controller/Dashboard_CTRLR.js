const express = require('express');
const app = module.exports = express();

const DiscordAPI = require('../API/DiscordAPI');
const mysql = require('../API/Mysql');
const Authentification = require('./Authentification');
const DashboardValidation = require('../API/Dashboard_ValidationData');
const Mailer = require('../API/Mailer');
const PaypalAPI = require('./Paypal_CTRLR');
const bodyParser = require('body-parser');
const expressSanitizer = require('express-sanitizer');
const request_node = require('request');



//MIDDLEWARE//
var jsonParser = bodyParser.json()
app.use(expressSanitizer());



app.get('/dashboard', (request, response) => { 

    var Selected_GuildName = request.query.server;
    if(Selected_GuildName){
        response.locals.serverselected = Selected_GuildName;
    }
    response.locals.sitelink = process.env.THIS_ADRESSE;

    Authentification.IsLogged(request, response)
    .then(function(Owner){

        Authentification.Get_GuildInfo(Owner, Selected_GuildName)
        .then(function(GuildInfo){

            response.locals.SelectedGuildInfo = GuildInfo;
            LoadUserpanelPage(request, response)
        })
        .catch(function(err){ //Authentification.Get_GuildInfo failed//
            response.locals.MessageError = [err];
            response.locals.Owner = Owner;
            LoadUserpanelPage(request, response)
        })
    })
    //If the user is offline//
    .catch(function(err){console.log("unlogged"); response.redirect('login');})
})



app.post('/save', (request, response) =>{

    mysql.CheckIfAccessTokenValid(request.body.token)
    .then(function(decoded_token){
        
       
        DashboardValidation.Validate(request.body, decoded_token)
        .then(function(DataValidated){
   
            mysql.Update_GuildPluginConfig(decoded_token.GuildID , DataValidated)
            .then(function(resu){

                //Apply the saved guild plugin configuration to the session without having to reload the whole session of the user//
                request.session.Owner.Guilds.find(x => x.GuildInfo.GuildID === decoded_token.GuildID).GuildInfo.PluginsConfig = DataValidated 
                request.session.save();

                var Options = { 
                    method : 'POST',
                    url : process.env.BOTREFRESH_LINK,
                    headers : {
                        "AuthorizationPassAPI" : process.env.APIAUTHKEY,
                        "Content-Type" : "application/json"
                    },
                    body : {GuildID: decoded_token.GuildID},
                    json: true
                };
                
                request_node(Options, function (error, resp, body) {
                    if(error){console.error('error:', error);}// Print the error if one occurred
                    else if(resp){response.redirect('dashboard?server=' + request.query.server);}
                });
            })
            .catch(function(err){console.error(err);});
        })
        .catch(function(ErrorStack){
            console.error("Dashboard Data verification returned ErrorStack of Input Validation");
            console.error(ErrorStack);
        })
    })
    .catch(function(err){console.error(err);});
});


app.get('/reloadOauthData', (request, response) =>{
    Authentification.IsLogged(request, response)
    .then(function(result){
        DiscordAPI.Get_DiscordOauth(response.locals.token['access_token'])
        .then(function(OauthBody){
            DiscordAPI.Get_DiscordGuilds(response.locals.token['access_token'])
            .then(function(GuildsBody){

                request_node(process.env.BOTGATHER_LINK + '?ApiOauth=' + process.env.APIAUTHKEY + '&Guildid=' + request.query.Guildid, function(error, response, body){
                    if(error){console.error('error:', error)}
                    else if (body){
                        var ParsedBody = JSON.parse(body);
                        request.session.MemberCount = ParsedBody.MemberCount;
                        request.session.Channels = ParsedBody.Channels;
                        request.session.Roles = ParsedBody.Roles;
                    }
                })

                request.session.oauth = OauthBody;
                request.session.guilds = GuildsBody;
                response.redirect("../dashboard");
            })
            .catch(function(err){console.error(err); response.redirect('/dashboard');})
        })
        .catch(function(err){console.error(err); response.redirect('/dashboard');})
    })
    .catch(function(err){console.error(err); response.redirect('/dashboard');})
})


//This URL refresh all the session data of the Owner//
//Once finished, it will redirect where the user came from//
//This function is usually launched from any "IsLogged" function//
app.get('/refresh', (request, response) =>{
    var URL_CameFrom = request.headers.referer;
    if(URL_CameFrom == undefined){URL_CameFrom = "/"}

    Authentification.IsLogged(request, response)
    .then(function(Owner){
        var owner = new Entity.Owner(Owner);
        DiscordAPI.Refresh_OwnerData(owner, request)
        .then(function(Returned){
            console.log("Done refresh")
            response.redirect(URL_CameFrom);
        })
        .catch(function(err){console.log(err); response.redirect(URL_CameFrom);})
    })
    .catch(function(err){console.error(err); response.redirect(URL_CameFrom);})
})


function LoadUserpanelPage(req , res){
    res.locals.selectedPanel = req.query.panel;
    res.locals.serverselected = req.query.server;
    res.render("pages/dashboard");
}

app.post('/SendRefundRequest', (request, response) =>{
    Mailer.Send_RefundRequest(request.body);
    response.redirect('/dashboard');
})

app.post('/SendCancelationRequest', (request, response) =>{
    console.error(request.body);
    PaypalAPI.Cancel_Subscription(request.body)
    .then(function(result){response.redirect('/dashboard') })
    .catch(function(err){console.error(err); response.redirect('/dashboard')})
})