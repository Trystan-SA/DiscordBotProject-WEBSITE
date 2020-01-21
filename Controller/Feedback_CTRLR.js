const express = require('express');
const app = module.exports = express();
const Authentification = require('./Authentification');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const QuestedMysql = require('../API/Mysql')
var jwt = require('jsonwebtoken');
var request_node = require('request');
const ThisAdress = process.env.THIS_ADRESSE;



app.post('/feedback/postticket', (request, response) =>{
    if(request.session.Owner){
        var Token = request.body.Token;

        //Verify the Token Key
        jwt.verify(Token, process.env.SECRETKEY, function(err, decoded){

            //If token is invalid, gather the error and report the intrusion//
            if(err){
                var dangeroustoken = jwt.decode(Token, {json: true, complete: true});
                if(dangeroustoken){
                    console.critical("Someone try to break Feedback Encryption : " + "Guild : " + dangeroustoken.payload.guildid + " | Username : " + dangeroustoken.payload.oauth.username + " | Email : " + dangeroustoken.payload.oauth.email);
                }
                console.critical("Someone Try to break the Feedback encryption - Token corrupted, can't say who did it.")
            }

            //If token valid, process to the Ticket upload//
            else if (decoded){

                CheckIfUserBanned(decoded.oauth.id, decoded.guildid)
                .then(function(con){

                    var Error = "";
                    if(request.body.title.length > 160){response.status(406).end('Ticket title over the character limit');}
                    else if(request.body.description.length > 1000){response.status(406).end('Ticket title over the character limit');}
                    //TODO - PROPER ERROR HANDLE //


                    Upload_Ticket(decoded.guildid, decoded.oauth.username, decoded.oauth.id, decoded.oauth.avatar, request.body.title, request.body.description, request.body.category)
                    .then(function(TicketID){

                        //Send a call to the Bot 
                        var Options = {
                            url : process.env.BOT_API_DOMAIN + 'Feedback/NewTicket',
                            method: 'POST',
                            headers: {
                                'ApiPrivateKey' : process.env.APIAUTHKEY
                            },
                            body: "Wallou" 
                            
                        }
                        request_node(Options, function (err, response, body){
                            if(err){console.error(err)}
                            else if(body){
                                console.notice(body)
                            }
                        })
                        response.locals.MessageSuccess = ['Feedback posted successfully'];
                        request.flash('Success', 'Feedback posted successfully')
                        response.redirect('/feedback/' + decoded.guildid);
                    })
                    .catch(function(err){
                        request.flash('Error', 'Something went wrong with the Database. Please try again later');
                        response.redirect('/feedback')
                    })
                })
                //User is banned//
                .catch(function(err){
                    request.flash('Error', err);
                    res.redirect(request.headers.referer);
                })
            } 
        })
    }
    //Else, no Oauth found in the session, user offline
    else { 
        request.flash('Error', "You can't post feedback suggestion offline. Please login.");
        response.redirect(request.headers.referer);
    }
})



app.post('/feedback/postcomment', (request, response)=>{

    jwt.verify(request.body.Token, process.env.SECRETKEY, function(err, decoded){
        if(err){console.error(err)}
        else if (decoded){

            CheckIfUserBanned(decoded.oauth.id, decoded.guildid)
            .then(function(conti){

                var TicketInfo = JSON.parse(request.body.TicketInfo);
                var Oauth = JSON.parse(request.body.Oauth);

                if(decoded.usertoken && decoded.oauth){
                    Upload_Comment(TicketInfo.ID, request.body.comment, Oauth.username, Oauth.id, Oauth.avatar)
                    .then(function(resolve){
                        request.flash('Success', 'Comment Posted Successfully')
                        response.redirect(request.headers.referer);
                    })
                    .catch(function(err){
                        request.flash('Error', 'Something went wrong with the Database. Please try again later');
                        response.redirect('/feedback')
                    })
                }
                else {
                    response.flash('Error', "Something went wrong, Couldn't post comment");
                    response.redirect(request.headers.referer);
                }
            })
            .catch(function(err){
                request.flash('Error', err);
                response.redirect.headers.referer;
            })
        } 
        else {
            response.flash('Error', "Something went wrong, Couldn't post comment");
            response.redirect(request.headers.referer);
        }
    })
})


app.post('/feedback/upvote', (request, response) =>{
    Upvote(request.body.TicketID);
    response.status(200).end();
})

app.post('/feedback/downvote', (request, response) =>{
    Downvote(request.body.TicketID);
    response.status(200).end();
})



app.get(['/feedback', '/feedback/:id/', '/feedback/:id/:ticketid/', '/feedback/:id/:ticketid/:action'], (request, response) => {

    if(request.session.Owner){
        response.locals.FeedbackOwner = false;
    }

    if(request.params.id){
        response.locals.GuildID = `${request.params.id}`;

        //Handle additionnal actions//
        if(request.params.ticketid){
            var TicketID = request.params.ticketid;

            if(request.params.ticketid === "load"){
                LoadTickets(request.params.id, request.query.ShortBy, request.query.AscOrDesc, request.query.Startof, request.query.Archived, request.query.ShowStatus, request.query.ShowTag)
                .then(function(Tickets){
                    //If the query is empty, return a code 418 instead//
                    if(Tickets == ""){response.status(204).send("Empty");}
                    else {response.status(200).send(Tickets);}
                })
                .catch(function(err){
                    request.flash('Error', 'Something went wrong with the Database. Please try again later');
                    response.redirect('/feedback')
                })
            }



            else if(request.params.action){
                if(request.params.action === "loadcomments"){
                    LoadComments(TicketID)
                    .then(function(Comments){
                        if(Comments == ""){response.status(204).send("Empty");}
                        else {response.status(200).send(Comments);}
                    })
                    .catch(function(err){
                        request.flash('Error', 'Something went wrong with the Database. Please try again later');
                        response.redirect('/feedback')
                    })
                }



                //If asking to update the status of a ticket//
                else if(request.params.action === "updatestatus"){
                    var StatusString = request.query.statusstring;
                    var TicketID = request.query.ticketid;
                    var Encrypted = request.query.encrypted;
                    var GuildID = "";
                    jwt.verify(Encrypted, process.env.SECRETKEY, function(err, decoded){
                        Update_Ticket_Status(TicketID, StatusString)
                        .then(function(resp){response.status(200).send("Done")})
                        .catch(function(err){
                            request.flash('Error', 'Something went wrong with the Database. Please try again later');
                            response.redirect('/feedback')
                        })
                    })
                }



                else if(request.params.action === "updatetag"){
                    var TagInt = request.query.tagint;
                    var TicketID = request.query.ticketid;
                    var Encrypted = request.query.encrypted;
                    jwt.verify(Encrypted, process.env.SECRETKEY, function(err, decoded){
                        Update_Ticket_Tag(TicketID, TagInt)
                        .then(function(resp){response.status(200).send("Done")})
                        .catch(function(err){
                            request.flash('Error', 'Something went wrong with the Database. Please try again later');
                            response.redirect('/feedback')
                        })
                    })
                }



                else if(request.params.action === "DeleteTicket"){
                    jwt.verify(request.query.Encrypted, process.env.SECRETKEY, function(err, decoded){
                        if(err){console.error(err)}
                        else if(decoded){
                            DeleteTicket(request.query.TicketID, decoded.oauth.id, decoded.guildid)
                            .then(function(resolve){response.status(200).send("Done");})
                            .catch(function(err){
                                request.flash('Error', 'Something went wrong with the Database. Please try again later');
                                response.redirect('/feedback')
                            })
                        }
                    })
                }



                else if(request.params.action === "ArchiveTicket"){
                    var ArchiveOrUnachive = request.query.ArchiveBool; //If false, will archive, if true, will unarchive//
                    var TicketID = request.query.ticketid;
                    var Encrypted = request.query.encrypted;
                    var GuildID = "";

                    jwt.verify(Encrypted, process.env.SECRETKEY, function(err, decoded){
                        GuildID = decoded.guildid;
                        Archive_Ticket(TicketID, ArchiveOrUnachive)
                        .then(function(result){
                            response.status(200).send("Done");
                        })
                        .catch(function(err){
                            request.flash('Error', 'Something went wrong with the Database. Please try again later');
                            response.redirect('/feedback')
                        })
                    })
                }

                else if(request.params.action === "CloseComment"){
                    var CloseOrUnclose = request.query.CloseBool; //If false, will close, if true, will unclose//
                    var TicketID = request.query.ticketid;
                    var Encrypted = request.query.encrypted;
                    var GuildID = "";


                    jwt.verify(Encrypted, process.env.SECRETKEY, function(err, decoded){
                        GuildID = decoded.guildid;
                        Close_Comments(TicketID, CloseOrUnclose)
                        .then(function(result){
                            response.status(200).send("Done");
                        })
                        .catch(function(err){
                            request.flash('Error', 'Something went wrong with the Database. Please try again later');
                            response.redirect('/feedback')
                        })
                    })
                }
            }

            else {

                Authentification.IsLogged(request, response)
                .then(function(Logged){
                    if(Logged.DiscordGuilds.find(x => x.id === request.params.id).owner){
                        response.locals.FeedbackOwner = true;
                    }
                    Continue()
                })
                .catch(function(unlogged){Continue()})


                async function Continue(){

                    LoadSpecificTicket(request.params.id, TicketID)
                    .then(function(Ticket){
                        response.locals.LoadingTicket = Ticket;

                        QuestedMysql.Get_GuildConfiguration(request.params.id)
                        .then(function(PluginData){
                            response.locals.PluginData = PluginData;
                            var FeedbackConfig = PluginData.PluginsConfig.Feedback
                            var IsActivated = FeedbackConfig.find(function(elem){
                                if(elem[0] == "Activated"){return elem[1];}
                            })[1];

                            if(response.locals.FeedbackOwner){
                                if(IsActivated == "false"){
                                    response.locals.MessageInfo = ["This Ticket is part of a private Feedback page. You are the only one who can see it. Activate the Feedback plugin to make it public."];
                                }
                                Draw_FeedbackPage(request, response);
                            }
                            else {
                                if(IsActivated == "false"){
                                    request.flash('Error', 'The Ticket you tried to view is private.')
                                    response.redirect('/feedback');
                                }
                                else {
                                    Draw_FeedbackPage(request, response);
                                }
                            }
                        })
                        .catch(function(err){
                            request.flash('Error', "Can't find the Feedback page, Please verify you entered the URL correctly");
                            response.redirect('/feedback');
                        })
                    })
                    .catch(function(err){
                        request.flash('Error', 'Something went wrong with the Database. Please try again later');
                        response.redirect('/feedback')
                    })
                }
            }
        }


        
        //If request main page only//
        else {
            Authentification.IsLogged(request, response)
            .then(function(Logged){
                if(Logged.DiscordGuilds.find(x => x.id === request.params.id).owner){
                    response.locals.FeedbackOwner = true;
                }
                Continue()
            })
            .catch(function(unlogged){Continue()})
            
            async function Continue(){
                var GuildID = request.params.id;
                response.locals.GuildID = GuildID;

                //Get if the current request is made by the Owner of the guild//
                var GuildOwned = false;
                if(request.session.Owner){
                    request.session.Owner.Guilds.forEach(element => {
                        if(element.id == request.params.id){
                            if(element.owner == true){
                                response.locals.FeedbackOwner = true;
                            }
                        }
                    });
                }



                QuestedMysql.Get_GuildConfiguration(GuildID)
                .then(function(PluginData){

                    response.locals.PluginData = PluginData;


                    response.locals.GuildName = PluginData.GuildName
                    //Check if the Feedback plugin is activated//
                    //If not, will redirect users to the feedback main page. Owner can still view the guild feedback page, but with a non-published page hint//
                    var PluginDataParsed = PluginData.PluginsConfig.Feedback;
                    var IsPluginActivated = false;
                    Object.values(PluginDataParsed).forEach(function(elem){
                        if (elem[0] == "Activated"){
                            if(elem[1] == 'true'){
                                IsPluginActivated = true;
                            }
                        }
                    })

                    if(IsPluginActivated === false){
                        //He is Owner
                        if(response.locals.FeedbackOwner){
                            response.locals.MessageInfo = ["This page is private, You are the only one who can see it for the moment. Activate the Feedback plugin to make it public"];
                            Draw_FeedbackPage(request, response);
                        }
                        //He is User
                        else {
                            request.flash('Error', "The Feedback page you tried to access is not public.");
                            response.redirect('/feedback')
                        }
                    }
                    //If plugin activated
                    else { 
                        Draw_FeedbackPage(request, response);
                    }
                })
                .catch(function(err){
                    request.flash('Error', "Can't find the Feedback page, Please verify you entered the URL correctly");
                    response.redirect('/feedback')
                })
            }
        }
    }

    else {
        Authentification.IsLogged(request, response)
        .then(function(re){
            response.render("pages/feedback/feedback"),{},
            function(err){
                if(err){
                    console.error("["+err.name+"] " + err.message);
                    res.render(ErrorPage, {errormsg: ErrorMessage});
                }
            }; 
        })
        .catch(function(Unlogged){
            response.render("pages/feedback/feedback"),{},
            function(err){
                if(err){
                    console.error("["+err.name+"] " + err.message);
                    res.render(ErrorPage, {errormsg: ErrorMessage});
                }
            }; 
        })
    }
})



//Draw the feedback page//
async function Draw_FeedbackPage(request, response){
    var useraccesstoken = ""
    var useroauth = "";
    if(request.session.Owner){
        useraccesstoken = request.session.Owner.DiscordToken.access_token;
        useroauth = request.session.Owner.DiscordOauth
    }

    var Payload = {
        usertoken : useraccesstoken,
        guildid : request.params.id,
        oauth :  useroauth
    }

    //Encrypt important data to avoid hacking other guild feedback// 
    jwt.sign(Payload, process.env.SECRETKEY, {expiresIn:'2h'} , function(err,token){
        if(err){console.critical(err)}
        else if(token){ 
            response.locals.encrypted = token;

            response.render("pages/feedback/FeedbackGuildPage"),{},
            function(err){
                if(err){
                    console.critical("["+err.name+"] " + err.message);
                    response.render(ErrorPage, {errormsg: ErrorMessage});
                }
            }
        }
    })
}




/*
##############################
#######   Mysql ZONE  ########
##############################
*/

var connection_Quested = require('../API/Mysql').connection_Quested;


/** Load a Ticket for the Given guild with specific parameter */
async function LoadTickets(GuildID, ShortBy, AscOrDesc, Startof, Archived, ShowStatus, ShowTag){
    return new Promise((resolve, reject) =>{

        if(ShortBy === "Date"){ShortBy = "PostDate"}
        if(ShortBy === "Upvotes"){ShortBy = "Score"}
        if(ShowStatus === "none"){ShowStatus = ''}

        var ArchivedResult = 0;
        if(Archived == 'true'){
            ArchivedResult = 1;
        }

        var ShowStatusSQL = '';
        if(ShowStatus != '' && ShowStatus!= 'undefined'){
            ShowStatusSQL = `AND Status = '${ShowStatus}' `;
        }

        var ShowTagSQL = '';
        if(ShowTag != '' && ShowTag != 'undefined' && ShowTag != '0'){
            ShowTagSQL = `AND Category = '${ShowTag}' `;
        }

        
        connection_Quested.query(`SELECT * FROM Feedback WHERE GuildID = ? AND Archived = '?' ${ShowStatusSQL} ${ShowTagSQL} ORDER BY ${ShortBy} ${AscOrDesc}, ID DESC LIMIT ${Startof},10`, [GuildID, ArchivedResult], function(err, TicketData){
            if(err){console.error(err); reject(err);}
            else if (TicketData){resolve(TicketData)}
        })
    })
}


/** Load a specific Ticket by It's ID */
async function LoadSpecificTicket(GuildID, TicketID){
    return new Promise((resolve, reject)=>{
        connection_Quested.query(`SELECT * FROM Feedback WHERE GuildID = ? AND ID = ?`, [GuildID, TicketID], function(err, Ticket){
            if(err){console.error(err); reject(err);}
            else if (Ticket){resolve(Ticket[0])}
        })
    })
}



/** Load the comment of the Given TicketID for the Given GuildID */
async function LoadComments(TicketID){
    return new Promise((resolve, reject)=>{
        connection_Quested.query(`SELECT * FROM FeedBack_Comment WHERE Feedback_ID = ? ORDER BY PostDate DESC`, [TicketID], function(err, result){
            if(err){console.error(err); reject(err)}
            else if(result){resolve(result)}
        })
    })
}




/** Will upload a new Ticket */
async function Upload_Ticket(GuildID, Username, UserID, UserAvatar, Title, Description, Category){
    return new Promise((resolve, reject)=>{
        var ArticleDate = GetDate();
        connection_Quested.query(`INSERT INTO Feedback (GuildID, Title, Description, Category, AuthorName, AuthorID, AuthorAvatar, PostDate) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, STR_TO_DATE("${ArticleDate}", '%d-%m-%Y'));`,
                                     [GuildID, Title, Description, Category, Username, UserID, UserAvatar, ArticleDate], 
                                     function(err, result, fields){         
            if(err){console.error(err); reject(err);}
            else if(result){resolve(result.insertID);}
        })
    })
}



/** Will upload a new Comment */
async function Upload_Comment(TicketID, CommentText, AuthorName, AuthorID, AuthorAvatar){
    return new Promise((resolve, reject)=>{
        TicketID = Number(TicketID);
        var ArticleDate = GetDate();

        connection_Quested.query(`INSERT INTO FeedBack_Comment (Feedback_ID, Text, AuthorName, AuthorID, AuthorAvatar, PostDate)
                                    VALUES (?, ?, ?, ?, ?, STR_TO_DATE("${ArticleDate}", '%d-%m-%Y'));`,
                                    [TicketID, CommentText, AuthorName, AuthorID,  AuthorAvatar, ArticleDate]
        , function(err, result, fields){
            if(err){console.error(err); reject(err)}
            else if(result){resolve(true)}
        })
    })
}



/** Update the Ticket Status if the Owner have decided to change it */
async function Update_Ticket_Status(TicketID, StatusString){
    return new Promise((resolve, reject)=>{
        connection_Quested.query(`UPDATE Feedback SET Status = ? WHERE ID = ?`, [StatusString, TicketID], function(err, result, fields){
            if(err){console.error(err); reject(err)}
            else if(result){resolve(true);}
        })
    })
}


async function Update_Ticket_Tag(TicketID, TagInt){
    return new Promise((resolve, reject)=>{
        connection_Quested.query(`UPDATE Feedback SET Category = ? WHERE ID = ?`, [TagInt, TicketID] ,function(err, result, fields){
            if(err){console.error(err); reject(err)}
            else if(result){resolve(true);}
        })
    })
}



/** Will Archive or Unarchive the Given TicketID for the Given GuildID */
async function Archive_Ticket(TicketID, ArchiveOrUnachive){
    return new Promise((resolve, reject)=>{
        connection_Quested.query(`UPDATE Feedback SET Archived = '${ArchiveOrUnachive}' WHERE ID = ${TicketID}`, function(err, result){
            if(err){console.error(err); reject(err)}
            else if(result){resolve(true)}
        })
    })
}


async function Close_Comments(TicketID, CloseOrUnclose){
    return new Promise((resolve, reject)=>{
        connection_Quested.query(`UPDATE Feedback SET CommentOpen = '${CloseOrUnclose}' WHERE ID = ${TicketID}`, function(err, result){
            if(err){console.error(err); reject(err)}
            else if(result){resolve(true)}
        })
    })
}


async function DeleteTicket(TicketID, AuthorID, GuildID){
    return new Promise((resolve, reject)=>{
        connection_Quested.query(`DELETE FROM Feedback WHERE ID = ? AND AuthorID = ?`, [TicketID, AuthorID], function(err, result){
            if(err){console.error(err); reject(err)}
            else if(result){

                if(result.affectedRows == 0){
                    connection_Quested.query(`SELECT * FROM owners_has_guild WHERE GuildID = ? AND OwnerDiscordID = ?`, [GuildID, AuthorID], function(err, result){
                        if(err){reject(err)}
                        else if(result){
                            if(result[0] != ''){
                                connection_Quested.query(`DELETE FROM Feedback WHERE ID = ?`, [TicketID], function(err, result){
                                    if(err){reject(err)}
                                    else if(result){
                                        resolve(true);
                                    }
                                })
                            }
                        }
                    })
                } 
                else {
                    resolve(true);
                }
            }
        })
    })
}



/** Will Upvote the Given TicketID for the Given GuildID */
async function Upvote(TicketID){
    connection_Quested.query(`UPDATE Feedback SET Score=Score+1 WHERE ID = ${TicketID}`, function(err, result, fields){
        if(err){console.error(err); reject(err);}
    })
}



/** Will Downvote the Given TicketID for the Given GuildID */
async function Downvote(TicketID){
    connection_Quested.query(`UPDATE Feedback SET Score=Score-1 WHERE ID = ${TicketID}`, function(err, result, fields){
        if(err){console.error(err); reject(err);}
    })
}



/** return true if user can post something in this Feedback guild page. Reject if user banned and can't do anything */
async function CheckIfUserBanned(UserID, GuildID){
    return new Promise((resolve, reject)=>{
        connection_Quested.query(`SELECT * FROM feedback_bannedusers WHERE UserID = ? AND GuildID = ?`, [UserID, GuildID], function(err, result){
            if(err){console.error(err); resolve(true);}
            else if(result){
                if(result[0] != ''){
                    var reason = "You are banned from this feedback page. No reasons provided by the Owner of the guild.";
                    if(result[0].Reason){reason = "You are banned from this feedback page, reason : " + result[0].Reason;}
                    reject(reason);
                }
                else {resolve(true)}
            }
        })
    })
}


/** Used to set the current Data to a Mysql Code -- Will give a valid Time format for SQL to read and Store.*/
function GetDate(){
    var CurrentTime = new Date();
    var Month = CurrentTime.getMonth();
    var Day = CurrentTime.getDate();
    if(Month < 10){Month = "0" + Month}
    if(Day < 10){Day = "0" + Day};
    var MysqlDateFormat = `${Day}-${Month}-${CurrentTime.getFullYear()}`;
    // DAY, MONTH, YEAR   === %D %M %Y //
    return MysqlDateFormat;
}