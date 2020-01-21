const express = require('express');
const app = module.exports = express();

const TEST_LOGIN_AS_ADMIN = process.env.TEST_LOGIN_AS_ADMIN;
const chalk = require('chalk');
const DiscordAPI = require('../API/DiscordAPI');
const Mysql = require('../API/Mysql');
const request_node = require('request');
const session = require('express-session')
var jwt = require('jsonwebtoken');



app.get('/login', (req, res) => {
    DiscordAPI.login_start(req, res);
});



app.get('/logincallback', (req, res) => {
    DiscordAPI.login_callback(req, res)
    .then(function(resolve){
        Mysql.Update_Owner(req.session.Owner);
        res.redirect("/dashboard")
    })
    .catch(function(err){
        if(err){console.error(err); res.render('pages/logincallback', {callbackerror: err})}
        else {res.render('pages/logincallback', {callbackerror : "something went wrong"})}
    })
});



app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect("/");
});




//Check if the Website user is Logged. If yes, return a Owner Object.
async function IsLogged(request, response){
    return new Promise((resolve, reject)=>{
        if(request.session.Owner != undefined){
            var Owner = new Entity.Owner(request.session.Owner)

            //If a lastupdate Date has been set or not//
            if(request.session.LastUpdate){
                var LastUpdate = new Date(request.session.LastUpdate);

                if(LastUpdate < new Date()){
                    DiscordAPI.Refresh_OwnerData(Owner, request)
                    .then(function(Returned){
                        response.locals.Owner = Returned.Owner; 
                        resolve(Returned.Owner)
                    })
                    .catch(function(err){console.error(err); reject();})
                }
                else {
                    response.locals.Owner = Owner; 
                    resolve(Owner)
                }
            } 

            //If no Lastupdate, set one for the next verification//
            else { 
                DiscordAPI.Refresh_OwnerData(Owner, request)
                .then(function(Returned){
                    resolve(Returned.Owner);
                })
                .catch(function(err){console.error(err); reject();})
            }
        }
        //If the user doesn't have any data in his session, he is offline, so return a reject//
        else {reject("Not logged")}
    })
}
module.exports.IsLogged = IsLogged;


/** Retrieve Analytics, Channels, Roles, Membercount and resolve them as GuildInfo */
async function Get_GuildInfo(Owner, GuildName){
    return new Promise((resolve, reject) =>{
        var GuildInfo = {};

        DiscordAPI.VerifyUserServerOwnership(Owner.DiscordGuilds, GuildName)
        .then(function(GuildID){

            GatherGuildInfo(GuildID)
            .then(function(guildinfo){ 
                var CurrentGuild = Owner.Guilds.find(x => x.GuildInfo.GuildID === GuildID); 
                
                if(CurrentGuild){
                    CurrentGuild.Roles = guildinfo.Roles;
                    CurrentGuild.Channels = guildinfo.Channels;
                    CurrentGuild.GuildInfo.MemberCount = guildinfo.MemberCount;
                    
                    var accesstoken = CurrentGuild.GuildInfo.Token;

                    var Payload = {
                        AccessToken : accesstoken,
                        'GuildID' : GuildID,
                        'username' : Owner.DiscordOauth.username,
                        'email' : Owner.DiscordOauth.email,
                        'id' : Owner.DiscordOauth.id
                    }

                    jwt.sign(Payload, process.env.SECRETKEY, {expiresIn:'2h'} , function(err, jwtToken){
                        if(err){console.critical('Error while trying to encrypt Accesstoken for Dashboard : ' + err); reject(err);}
                        else if(jwtToken){
                            CurrentGuild.GuildInfo.jwtToken = jwtToken;
                            resolve(CurrentGuild); //GuildInfo
                        }
                    })
                } else {reject()} //Guild in not present, invite the bot first.
            })
            .catch(function(err){reject(err)})
        })
        .catch(function(err){reject()})
    })
}
module.exports.Get_GuildInfo = Get_GuildInfo;


/** Send a request to the Bot to gather information about the current guild */
async function GatherGuildInfo(GuildID){
    return new Promise((resolve, reject) =>{
        request_node(`${process.env.BOTGATHER_LINK}?ApiOauth=${process.env.APIAUTHKEY}&Guildid=${GuildID}`, function (err, response, body) {
            if(err){reject("Can't reach the Quested Discord bot. Try again later");}
            if(response){
                if(response.statusCode == 500){console.log("Response have code 500, reject"); reject(body);}
            }
            if (body){resolve(JSON.parse(body))}
        });
    })
}



//JSON PARSING 
String.prototype.escapeSpecialChars = function() {
    return  this.replace(/\f/g, '\\f')
                .replace(/\\r\\n/g, '\\n')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t')
                .replace(/\"/g, '"')
                .replace(/\\/g, '\\')
};