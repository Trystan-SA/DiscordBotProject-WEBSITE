const fetch = require('node-fetch');
const FormData = require('form-data');
var mysql = require('./Mysql');
const app = require('../app_website');

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const redirect = process.env.REDIRECTURLCALLBACK;
const BOTURL = process.env.BOTURL;


/** Connect with the Discord APi to retrieve a set of Oauth data
 *  AccessToken from the DiscordToken Object.
 */
async function Get_DiscordOauth(AccessToken){
    return new Promise((resolve, reject)=>{
        fetch('https://discordapp.com/api/users/@me', {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${AccessToken}`,
                "Content-Type": "application/x-www-form-urlencoded" 
            }
        })
        .then(res => res.json())
        .then(function(OauthDataBody){
            if(OauthDataBody.message != "401: Unauthorized"){
                resolve(OauthDataBody);
            }
            else {
                reject("Invalid Oauth Authorization. 401 ERROR");
            }
            
        })
    })
}
module.exports.Get_DiscordOauth = Get_DiscordOauth;


/** Connect with the Discord API to retrieve an array of Guild
 *  This function will only return an array of OWNED guilds
 *  Accesstoken from DiscordToken object.
 */
async function Get_DiscordGuilds(AccessToken){
    return new Promise((resolve, reject)=>{
        fetch('https://discordapp.com/api/users/@me/guilds', {
            method:'GET',
            headers:{
                "Authorization": `Bearer ${AccessToken}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })
        .then(res => res.json())
        .then(function(GuildsDataBody){
            var DiscordGuildsOwned = [];

            if(GuildsDataBody){
                GuildsDataBody.forEach(element => {
                    if(element.owner == true){
                        DiscordGuildsOwned.push(element);
                    }
                });
                resolve(DiscordGuildsOwned);
            }
            else { resolve(DiscordGuildsOwned);}
        })
        .catch(function(err){reject(err)})
    })
}
module.exports.Get_DiscordGuilds = Get_DiscordGuilds;



/** Refresh The Owner object with new retrieve discord info
 *  Will also automaticly update database if info changed.
 *  Reassign automaticly the Session and the LastUpdate Date() token with the new info
 *  Resolve LastUpdate and Owner
 */
async function Refresh_OwnerData(Owner, request){
    return new Promise((resolve, reject)=>{
        var owner = new Entity.Owner(Owner);

        Get_DiscordOauth(owner.DiscordToken.access_token)
        .then(function(DiscordOauth){
            
            Get_DiscordGuilds(owner.DiscordToken.access_token)
            .then(function(DiscordGuilds){

                owner.DiscordOauth = DiscordOauth;
                owner.DiscordGuilds = DiscordGuilds;

                //If Old and new are different, update the Database//
                if(JSON.stringify(Owner) !== JSON.stringify(owner)){
                    mysql.Update_Owner(owner);
                }

                //Set a new Lastupdate Date() Token for the next update verification//
                var LastUpdate = new Date();
                LastUpdate.setHours(LastUpdate.getHours() + 1);
                //LastUpdate.setSeconds(LastUpdate.getSeconds() + 15);
                //console.log("LAST UPDATE REFRESH EVERY 15 SECONDS")

                mysql.Get_OwnerGuild_Object(owner)
                .then(function(Newowner){
                    request.session.LastUpdate = LastUpdate;
                    request.session.Owner = Newowner;
                    request.session.save(function(err){
                        resolve({'LastUpdate' : LastUpdate, 'Owner' : Newowner});
                    });
                })
                .catch(function(err){console.error(err); reject("Error while trying to get RunningPremium : " + err);}) 
            })
            .catch(function(err){reject(err)})
        })
        .catch(function(err){reject(err)})
    })
}
module.exports.Refresh_OwnerData = Refresh_OwnerData;



async function login_start(req, res) { 
        res.redirect(BOTURL);
};



async function login_callback(req, res){
    return new Promise((resolve, reject)=>{
        var Owner = new Entity.Owner();

        //If the user doesn't have the code
        if(req.query.code == undefined){
            reject('ERROR - No access token found. Please return to the main page and try again. If the error persist, contact me at trystansarrade@gmail.com');
        }
        else { //If the user have the code
            const codequerry = req.query.code;
            const data = new FormData();

            data.append('client_id', CLIENT_ID);
            data.append('client_secret', CLIENT_SECRET);
            data.append('grant_type', 'authorization_code');
            data.append( 'code', codequerry);
            data.append('redirect_uri',redirect);
            data.append('scope', 'identify email guild');

            fetch('https://discordapp.com/api/oauth2/token', {
                method: 'POST',
                body: data
            })
            .then(res=> res.json())
            .then(function(token){ //GET The user info with the token to check if the user isn't already in the database//
                if(token['access_token'] != undefined){
                    var AccessToken = token['access_token'];
                    Owner.DiscordToken = token;
                    Get_DiscordGuilds(AccessToken)
                    .then(function(GuildsValue){
                        var OwnedGuildsValue = [];
                        for(i=0; i < GuildsValue.length; i++){
                            if(GuildsValue[i].owner == true){
                                OwnedGuildsValue.push(GuildsValue[i]);
                            }
                        }
                        Owner.DiscordGuilds = OwnedGuildsValue
                       

                        Get_DiscordOauth(AccessToken, req)
                        .then(function(OauthValue){
                            Owner.DiscordOauth = OauthValue;

                            CheckIfUserExist(Owner, token)
                            .then(function(result){
                                req.session.Owner = Owner;
                                req.session.save();
                                resolve(true);
                            })
                            .catch(function(err){reject(err);})
                        })
                        .catch(function(err){reject(err);})
                    })
                    .catch(function(err){reject(err);})
                }
                //Token is undefined, reject
                else {reject('Oauth Token is not defined')}
            })
            .catch(function(err){reject(err);})
        }
    })
};


/** Check if the Owner exist inside the Database.
 *  Take Owner object as parameter.
 * 
 *  If it exist, create entry and resolve.
 *  Else, Just resolve.
 * 
 *  Reject in case of error.
 */
async function CheckIfUserExist(Owner){
    return new Promise((resolve, reject)=>{
        var owner = new Entity.Owner(Owner);

        mysql.Exist_Owner(owner.DiscordOauth.id)
        .then(function(Exist){
            //If user don't exist in DB.
            resolve("User already in DB - Don't need to create a new DB user entry.");
        })

        //If the user already exist
        .catch(function(DoesnotExist){
            mysql.Add_Owner(owner)
            .then(function(result, err){
                if(err){reject(err);}
                else{resolve(`New user : ${owner.DiscordOauth.username} created at `);}
            })
            .catch(function(err){reject(err);})
        })
    })
}
module.exports.CheckIfUserExist = CheckIfUserExist;


//Verify if the Owner really owns the selected discord guild.
async function VerifyUserServerOwnership(DiscordGuilds, GuildName){
    return new Promise((resolve, reject)=>{
        if(GuildName){
            for (i in DiscordGuilds){
                if(DiscordGuilds[i].name === GuildName){
                    if(DiscordGuilds[i].owner === true){
                        resolve(DiscordGuilds[i].id);
                    }
                }
            }
        }
        else {reject()}
    })
};

module.exports.login_start = login_start;
module.exports.login_callback = login_callback;
module.exports.VerifyUserServerOwnership = VerifyUserServerOwnership;


