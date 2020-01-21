var mysql = require('mysql');
var fs = require('fs');
var jwt = require('jsonwebtoken');
var localconfig = require('../public/js/pluginsconfig');

const Authentification = require('../Controller/Authentification');

var connection_Quested = mysql.createPool({
    connectionLimit : 70,
    host : process.env.MYSQL_HOST,
    user : process.env.MYSQL_USER,
    password : process.env.MYSQL_PASS,
    port : process.env.MYSQL_PORT,
    database : 'quested',
    charset : 'utf8mb4'
});
module.exports.connection_Quested = connection_Quested;



/** Check if the Owner exist -- Search by it's DiscordID 
 *  - Return true if user exist
 *  - Reject if user doesn't exist
*/
async function Exist_Owner(OwnerID){
    return new Promise((resolve, reject) =>{
        connection_Quested.query(`SELECT OwnerDiscordID FROM Owners WHERE OwnerDiscordID= ?;`, [OwnerID], function(err, result){
            if(err){reject(err)}
            else if(result != ""){
                resolve(OwnerID);
            }
            else { 
                reject(OwnerID)
            }
        })
    })
}
module.exports.Exist_Owner = Exist_Owner;



/** Check if the Guild exist -- Search by it's GuildID
 *  - Return true if guild exist
 *  - Reject if guild doesn't exist
 */
async function Exist_Guild(GuildID){
    return new Promise((resolve, reject) =>{
        connection_Quested.query(`SELECT GuildID FROM Guild WHERE GuildID='${GuildID}';`, function(err, result){
            if(err){reject(err)}
            else if (result){
                resolve(OwnerID);
            }
            else { 
                reject(OwnerID);
            }
        })
    })
}
module.exports.Exist_Guild = Exist_Guild;



/** Add the Owner to the Database (Usually when someone logged inside the Website)
 *  Take an Owner object as parameter.
 * 
 *  Resolve if created corretly.
 *  Reject if error
 */
async function Add_Owner(Owner){
    return new Promise((resolve, reject) =>{
        var owner = new Entity.Owner(Owner);
        connection_Quested.query(`INSERT INTO Owners VALUES (?, ?, ?, ?); `, [owner.DiscordOauth.id, owner.DiscordOauth.username, owner.DiscordOauth.email, owner.DiscordOauth.avatar], function(err, result){
            if(err){reject(err)}
            else if(result){
                resolve()
            }
        })
    })
}
module.exports.Add_Owner = Add_Owner;




/** Get everything related to the Guilds the Owners have the right on. (exept feedbacks object)*/
async function Get_OwnerGuild_Object(Owner){
    return new Promise((resolve, reject)=>{
        var owner = new Entity.Owner(Owner);
        owner.Guilds = [];

        connection_Quested.query(`SELECT * FROM quested.Guild inner join quested.Owners_has_Guild ON quested.Guild.GuildID = quested.Owners_has_Guild.GuildID WHERE quested.Owners_has_Guild.OwnerDiscordID = ?;`, [owner.DiscordOauth.id], function(err, Guild_Object){
            if(err){reject(err)}
            else if (Guild_Object){

                Guild_Object.forEach(function(guildelem, index){
                   
                    connection_Quested.query(`SELECT * FROM quested.PremiumSubscription WHERE PremiumSubscriptionID = ?;`, [guildelem.PremiumSubscriptionID], function(err, PremiumSubscription){
                        if(err){reject(err)}
                        else if(PremiumSubscription){

                            connection_Quested.query(`SELECT * FROM quested.Analytics WHERE GuildID = ?;`, [guildelem.GuildID], function(err, analytics){
                                if(err){reject(err)}
                                else if (analytics){

                                    if(analytics == ''){
                                        analytics = JSON.stringify(analytics);
                                        analytics = JSON.parse(analytics);
                                    }

                                    if(PremiumSubscription != ''){
                                        PremiumSubscription = PremiumSubscription[0];
                                        PremiumSubscription = JSON.stringify(PremiumSubscription);
                                        PremiumSubscription = JSON.parse(PremiumSubscription);
                                    }
            
                                    var ObjectToPush = {
                                        "GuildInfo" : JSON.parse(JSON.stringify(guildelem)),
                                        "Analytics" : JSON.parse(JSON.stringify(analytics)),
                                        "PremiumSubscription" : JSON.parse(JSON.stringify(PremiumSubscription))
                                    }
                                    
                                    owner.Guilds.push(ObjectToPush);
                                  
                                    if(index +1 == Guild_Object.length){
                                        resolve(owner);
                                    }
                                }
                            })
                        }
                    }) 
                })
            }
        })
    })
}
module.exports.Get_OwnerGuild_Object = Get_OwnerGuild_Object;



/**Get the configuration of a single Guild using it's GuildID */
async function Get_GuildConfiguration(GuildID){
    return new Promise((resolve, reject)=>{      
        connection_Quested.query(`SELECT PluginsConfig, Token, GuildName FROM Guild WHERE GuildID = '${GuildID}';`
        ,function(err, result, fields){
            if(err){reject(err)}
            else if (result){
                if(result != ''){
                    var GuildName = result[0].GuildName;
                    

                    var PluginConfigRepaired = Repair_PluginsConfig(result);
                    if(PluginConfigRepaired != false){
                        PluginConfigRepaired = JSON.stringify(PluginConfigRepaired);
                        if(result[0].PluginsConfig == PluginConfigRepaired){
                            QuerySanitize(result[0].PluginsConfig, result[0]['AccessToken'])
                        }
                        else {
                            connection_Quested.query(`UPDATE Guild SET PluginsConfig = '${PluginConfigRepaired}' WHERE GuildID = ${GuildID}`, function(err, resu){
                                if(err){reject(err)}
                                else if (resu){
                                QuerySanitize(PluginConfigRepaired, result[0]['AccessToken'])
                                }
                            })
                        }
                    }
                    //PluginConfig empty, guild couldn't be found//
                    else {reject("Guild Not found")}


                    function QuerySanitize(PluginsConf, AccessToken){
                        try{
                            var Query = JSON.parse(`{ "PluginsConfig": ${PluginsConf}, "AccessToken": "${AccessToken}", "GuildName": "${GuildName}" }`);    
                            resolve(Query);
                        } catch(err){console.warn(err); reject("[ERROR] - Mysql.js - GetGuildConfiguration(); || Can't parse the config query of the guild : " + GuildID);}
                    }
                }
                reject("Cannot retrieve Guild configuration...")
            }
            reject("Cannot retrieve Guild configuration...")
        })
    })
}
module.exports.Get_GuildConfiguration = Get_GuildConfiguration;




async function Update_Owner(Owner){
    return new Promise((resolve, reject)=>{
        if(Owner.DiscordOauth){

            //Update the Owner Table with the given Owner.DiscordOauth object.
            connection_Quested.query(`UPDATE Owners SET Username = ?, Email = ?, AvatarHash = ?, verified = ?, locale = ?, mfa_enabled = ?, discriminator = ? WHERE OwnerDiscordID = ?`,
            [Owner.DiscordOauth.username, Owner.DiscordOauth.email, Owner.DiscordOauth.avatar, Owner.DiscordOauth.verified, Owner.DiscordOauth.locale, Owner.DiscordOauth.mfa_enabled, Owner.DiscordOauth.discriminator, Owner.DiscordOauth.id],
            function(err, DoneUpdatedOauth){
                if(err){reject(err)}
                else if(DoneUpdatedOauth){}
            })


            //Check the Owner_has_Guild table for linked guild to the Owner that he doesn't own anymore. 
            //Will delete any record of this table if no match found.
            connection_Quested.query(`SELECT * FROM Owners_has_Guild WHERE OwnerDiscordID = ?`, [Owner.DiscordOauth.id], function(err, HasGuilds){
                if(err){console.error(err)}
                else if (HasGuilds){
                    HasGuilds.forEach(function(HasGuildElem, Index){
                        var FoundGuild = false;
                        Owner.DiscordGuilds.forEach(function(GuildElem, index2){
                            if(GuildElem.id == HasGuildElem.GuildID){
                                FoundGuild = true;
                            }
                        })
                        
                        if(FoundGuild !== true){
                            connection_Quested.query(`DELETE FROM Owners_has_Guild WHERE GuildID = ?`, [HasGuildElem.GuildID], function(err, DeletedResult){
                                if(err){console.error(err)}
                            })
                        }
                    })
                }
            })
        }
    })
}
module.exports.Update_Owner = Update_Owner;



/** Update the Guild Plugin configuration */
async function Update_GuildPluginConfig(GuildID, Data){
    return new Promise((resolve, reject) => {  
        connection_Quested.query(`UPDATE Guild SET PluginsConfig=? WHERE GuildID='${GuildID}' `, [Data] ,function(err, result, fields){
            if(err){reject(err)}
            else if (result){
                resolve(result);
            }
        })
    })
}
module.exports.Update_GuildPluginConfig = Update_GuildPluginConfig;




/** Will retrieve the Token of the guild to check if the Owner have the right to save plugindata
 *  Take a JWT has parameter, will decode it and get the GuildID and Token from it.
 *  Resolve if the Owner have the right, Reject if not
 */
async function CheckIfAccessTokenValid(token){
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.SECRETKEY, function(err, decoded){
            if(err){var dangeroustoken = jwt.decode(token, {json: true, complete: true});
                if(dangeroustoken){
                    console.critical("Someone try to break the Dahsboard Save Encryption : " + "Guild : " + dangeroustoken.payload.GuildID + " | Username : " + dangeroustoken.payload.username + " | Email : " + dangeroustoken.payload.email);
                }
                console.critical("Someone Try to break the Dahsboard Save encryption - Token corrupted, can't say who did it.")
            }

            else if(decoded){
                connection_Quested.query(`SELECT Token FROM Guild WHERE GuildID='${decoded.GuildID}'`, function(err, result, field){
                    if(err){console.log("error"); reject(err)}
                    else if (result){
                        if(result != ""){
                            if(decoded.AccessToken == result[0].Token){
                                resolve(decoded);
                            }
                            else {reject("AccessToken Not Valid");}
                        }
                        else {
                            reject("AccessToken Couldn't be found. Are you sure you own the right to do this ?");
                        }
                    }
                })
            }
        })
    })
}
module.exports.CheckIfAccessTokenValid = CheckIfAccessTokenValid;



/**Take the Unparsed pluginsconfig value, and repair the missing data with the default one*/
function Repair_PluginsConfig(PluginsConfig){
    if(typeof PluginsConfig[0] != 'undefined'){
        PluginsConfig = JSON.parse(PluginsConfig[0]['PluginsConfig'])

        Object.keys(localconfig.Panel).forEach(function(pluginname, pluginindex){
            var newentryarray = []
            //Plugin is present, but input missing//
            if(PluginsConfig[pluginname]){
                PluginsConfig[pluginname].forEach(function(elem){
                    newentryarray.push(elem)
                })
            }
            
            Object.keys(Object.values(localconfig.Panel)[pluginindex]).forEach(function(entryelem, indexelem){
                if(PluginsConfig[pluginname]){
                    var Found = false;
                    PluginsConfig[pluginname].forEach(function(plugconfentry, plugconfindex){
                        if(plugconfentry[0] === entryelem){
                            Found = true;     
                        }
                    })
                    //Entry not found inside the guild serverconfig. Add the default one
                    if(!Found){newentryarray.push([entryelem, Object.values(localconfig.Panel)[pluginindex][entryelem].default_value])}
                }
                else { newentryarray.push([entryelem, Object.values(Object.values(localconfig.Panel)[pluginindex])[indexelem].default_value])}
            })
            PluginsConfig[pluginname] = newentryarray
        })
        return PluginsConfig;
    }
    else {return false;}
}


/*
async function Set_subscription(GuildID, AccessToken, orderID, SubscriptionID, DiscordName, DiscordID, UserEmail, Tier){
    return new Promise((resolve, reject)=>{
  
        var CurrentDay = new Date().getDate();

        var Price = 404;
        var PlanName = "Incorrect Value"

        //console.log("MYSQL HERE");
        //console.log("TIER INFO : " + Tier);

        if(Tier == 1){
            Price = 5.99;
            PlanName = "Quested Premium Tier 1";
        }
        else if (Tier == 2){
            Price = 15.99;
            PlanName = "Quested Premium Tier 2";
        }
        

        var PremiumInformation = {
            'orderID' : orderID,
            'SubscriptionID' : SubscriptionID,
            'Buyer_Discord_Name' : DiscordName,
            'Buyer_Discord_ID': DiscordID,
            'Buyer_Email' : UserEmail,
            'DayOfPayement' : CurrentDay,
            'Price' : Price,
            'PlanName' : PlanName,
            'Status' : 'ACTIVE'
        }

        PremiumInformation = JSON.stringify(PremiumInformation);


        connection_allombriaweb.query(`UPDATE guildtable SET PremiumInfo = '${PremiumInformation}', PremiumPass='1' WHERE GuildID = '${GuildID}' AND AccessToken = '${AccessToken}';`, function(err, result, fields){
            if(err){reject(err);}
            else if (result){
                connection_allombriaweb.query(`SELECT RunningPremium FROM websiteuser WHERE UserDiscordID='${DiscordID}'`, function(err, result, fields){
                    if(err){reject(err);}
                    else if (result){
                        //console.log("QUERY RESULT OF RUNNING PREMIUM");
                        //console.log(result);

                        var RunningPremiumData = result[0]['RunningPremium'];
                       
                        if(!RunningPremiumData == ''){
                            RunningPremiumData = JSON.parse(RunningPremiumData);
                        }
                        else {RunningPremiumData = false}
                        
                        

                        //console.log("PARSED VALUE");
                        //console.log(RunningPremiumData);

                        if(RunningPremiumData){
                            var Foundoccurence = false;
                            RunningPremiumData.forEach(function(elem){
                                if(elem == GuildID){Foundoccurence = true}
                            })
                            if(Foundoccurence == false){
                                //console.log("Simply push");
                                RunningPremiumData.push(GuildID);
                            }
                        }
                        else {
                            //console.log("PUSH IF EMPTY");
                            RunningPremiumData = [""]; 
                            RunningPremiumData[0] = GuildID;
                        }

                        //console.log("QUERY OUT SAVE");
                        //console.log(RunningPremiumData);

                        RunningPremiumData = JSON.stringify(RunningPremiumData);

                        connection_allombriaweb.query(`UPDATE websiteuser SET RunningPremium='${RunningPremiumData}' WHERE UserDiscordID='${DiscordID}';`, function(err, result, fields){
                            if(err){reject(err)}
                            else if (result){resolve(true)};
                        })
                    }
                })
            }
        })
    })
}
module.exports.Set_subscription = Set_subscription;



async function CreateWebUserEntry(OauthUserBody, Token){
    return new Promise((resolve, reject)=>{
        if(OauthUserBody['id'] == undefined){ resolve(false);}
        else {
            connection_allombriaweb.query(`INSERT INTO websiteuser 
                                    (DiscordToken, DiscordRefreshToken, UserDiscordID, UserUsername, UserEmail, UserAvatarID) 
                                    VALUES 
                                    ('${Token["access_token"]}', '${Token["refresh_token"]}' , '${OauthUserBody["id"]}' , '${OauthUserBody["username"]}' , '${OauthUserBody["email"]}' , '${OauthUserBody["avatar"]}');`, function(err, 
                                    result, fields){

                if(err){reject(err)}
                else {
                    resolve(true);
                }
            });
        }
    })
}
module.exports.CreateWebUserEntry = CreateWebUserEntry;



async function LoginUsedFromDiscordID(OauthUserBody, token){
    return new Promise((resolve, reject)=>{
        if(OauthUserBody["id"] == undefined){resolve(false);}
        else {
            connection_allombriaweb.query(`UPDATE websiteuser
                                    SET DiscordToken= '${token["access_token"]}', UserUsername= '${OauthUserBody['username']}', UserEmail= '${OauthUserBody["email"]}' , UserAvatarID= '${OauthUserBody["avatar"]}'
                                    WHERE UserDiscordID = '${OauthUserBody["id"]}';`, function(err, 
                                    result, fields){
                if(err){reject(err);}
                else {
                    resolve(true);
                }
            });
        }
    });
}
module.exports.LoginUsedFromDiscordID = LoginUsedFromDiscordID;



async function GetWebsiteUserConfig(DiscordOauthID){
    return new Promise((resolve, reject)=>{
        connection_allombriaweb.query(`SELECT * FROM websiteuser WHERE UserDiscordID = ${DiscordOauthID};`, 
        function(err, result, fields){
            if(err){console.log(err);}
            else if (result){
                resolve(result);
            }
        })
    })
}
module.exports.GetWebsiteUserConfig = GetWebsiteUserConfig;


async function Get_OwnerData_RunningPremium(DiscordOauthID){
    return new Promise((resolve, reject) =>{
        connection_allombriaweb.query(`SELECT RunningPremium FROM websiteuser WHERE UserDiscordID = ${DiscordOauthID};`,
        function(err, result){
            if(err){reject(err);}
            else if (result){
                try {
                    result = JSON.parse(result[0].RunningPremium);
                } catch(err2){reject(err2);}

                resolve(result);
            }
        })
    })
}
module.exports.Get_OwnerData_RunningPremium = Get_OwnerData_RunningPremium;



async function Get_GuildPremiumInfo(guildid){
    return new Promise((resolve, reject)=>{
        connection_allombriaweb.query(`SELECT PremiumInfo, AccessToken FROM guildtable WHERE GuildID = ${guildid};`, 
        function(err, result, fields){
            if(err){reject(err)}
            else if (result){
                try{
                    var PremInfo = result[0]['PremiumInfo'];
                    var AccessToken = result[0]['AccessToken'];
                    PremInfo = JSON.stringify(PremInfo);
                    var PremInfo = PremInfo .replace(/\\"/g, '"')
                                            .replace(/\\n/g, '\\n');
                    PremInfo = PremInfo.slice(1, PremInfo.length - 1);

                    var Query = JSON.parse(`{ "PremiumInfo": ${PremInfo}, "AccessToken": "${AccessToken}"}`);    
                    resolve(Query);
                } catch{reject("[ERROR] - Mysql.js - Get_GuildPremiumInfo(); || Can't parse the Premiuminfo query of the guild : " + guildid);}
            }
        })
    })
}
module.exports.Get_GuildPremiumInfo = Get_GuildPremiumInfo;



async function Get_PremiumInfo_ByIDArray(GuildIDArray){
    return new Promise((resolve, reject)=>{
        if(GuildIDArray){
            var LenghtArray = GuildIDArray.length - 1;
            var PremiumInfo = new Map();

            GuildIDArray.forEach((ID, index )=> {
                connection_allombriaweb.query(`SELECT GuildName, GuildID, PremiumInfo, PremiumPass FROM guildtable WHERE GuildID ='${ID}'`, function(err, result, fields){
                    if(err){reject(err)}
                    else if (result){
                        
                        try { 
                            result = result[0]
                            var BuyInfo = JSON.parse(result.PremiumInfo);
    
                            var Content = {
                                'GuildID' : result.GuildID,
                                'GuildName' : result.GuildName,
                                'PremiumPass' : result.PremiumPass,
                                BuyInfo
                            };

                            PremiumInfo.set(result.GuildID, Content);

                            if(index == LenghtArray){resolve(PremiumInfo)}
                        }
                        catch {reject('Error while parsing data Premiuminfo');}
                    }
                })
            });
        }
        else {
            //Called if the user doesn't have any premium running//
            resolve(false);
        }
    })
}
module.exports.Get_PremiumInfo_ByIDArray = Get_PremiumInfo_ByIDArray;




//Will update the "DiscordRefreshToken" DB input from the WebsiteUser table//
async function Update_DiscordRefreshToken(RefreshToken, Token, UserID){
    return new Promise((resolve, reject)=>{
        connection_allombriaweb.query(`UPDATE websiteuser SET DiscordRefreshToken = '${RefreshToken}', DiscordToken = '${Token}' WHERE UserDiscordID = '${UserID}'`, function(err, result, field){
            if(err){reject(err);}
            else if (result){resolve(result);};
        });
    })
}
module.exports.Update_DiscordRefreshToken = Update_DiscordRefreshToken;


*/