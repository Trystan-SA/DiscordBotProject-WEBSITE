const express = require('express');
const app = module.exports = express();
const DiscordAPI = require('../API/DiscordAPI');
const Authentification = require('./Authentification');
const Mysql = require('../API/Mysql');
const fetch = require("node-fetch");
const schedule = require('node-schedule');
const bodyParser = require('body-parser');
const Mailer =require('../API/Mailer');
var request = require("request");

var PaypalOauth = ""


var ErrorPage = "pages/404"; 
var ErrorMessage = 'An error occured : Can\'t find the page due to incorrect routing. Please contact me at trystansarrade@gmail.com !';

app.use(bodyParser.json());

//Princing Page//
app.get("/pricing", (req, res) =>{
    Authentification.IsLogged(req, res)
    .then(function(result){
        res.render("pages/pricing"), 
        { },
        function(err){
            if(err){
                console.log("["+err.name+"] " + err.message);
                res.render(ErrorPage, {errormsg: ErrorMessage});
            }
        };
    })
    .catch(function(err){
        res.render("pages/pricing"), 
        { },
        function(err){
            if(err){
                console.log("["+err.name+"] " + err.message);
                res.render(ErrorPage, {errormsg: ErrorMessage});
            }
        };
    })
})


//Checkout page//
app.get('/checkout', function(req, res){
    Authentification.IsLogged(req, res)
    .then(function(result){
        DiscordAPI.VerifyUserServerOwnership(req.session.guilds, req.query.server)
        .then(function(GuildID){
            Mysql.Get_GuildPremiumInfo(GuildID)
            .then(function(GuildPremiumInfo){
                SetWhatUserShouldPay(GuildPremiumInfo, req.session.guilds, GuildID)
                .then(function(PayInfo){ 
                    res.locals.AccessToken = GuildPremiumInfo['AccessToken'];
                    res.locals.PayInfo = PayInfo;
                    res.locals.GuildID = GuildID;
                    res.locals.SelectedServer = req.query.server;
                    res.locals.UserDiscordName =  req.session.oauth.username;
                    res.locals.UserDiscordID = req.session.oauth.id;
                    res.locals.UserEmail = req.session.oauth.email;
                    res.render('pages/checkout');
                })
                .catch(function(err){
                    res.locals.error = err;
                    res.render('pages/checkout')
                })
            })
            .catch(function(err){console.log(err); res.render('pages/checkout');})
        })
        .catch(function(err){res.render('pages/checkout');})
    })
    .catch(function(err){console.log("Not loggin"); res.redirect('login');})
})


//Called when someone sucessfully done a subscription transaction//
app.post('/paypal-transaction-complete', function(req, res){
    Mysql.Set_subscription(req.query.GuildID, req.query.AccessToken, req.query.orderID, req.query.subscriptionID, req.query.UserDiscordName, req.query.UserDiscordID, req.query.UserEmail, req.query.Tier)
    .then(function(result){
        //Now send a request to the bot to get the guild updating his value
        fetch(process.env.BOTREFRESH_LINK, {
            method:'POST',
            body: JSON.stringify({"GuildID":req.query.GuildID}),
            headers: {'Content-Type': 'application/json'}
        })
        
        res.status(200).send("Successfully Subscribed to Quested !"); //Response gived to the User//
    })
    .catch(function(err){res.status(500).send("Error while creating Subscription...");})
})


//Will get the number of people in this server to see what plan the user should pay for.
//Will also get if a premium is already payed or not.
async function SetWhatUserShouldPay(GuildPremiumInfo, GuildInfo, GuildID){
    return new Promise((resolve, reject)=>{
        var PremiumInfo = GuildPremiumInfo['PremiumInfo'];

        //If the PremiumInfo is empty, so no premium subscription is currently happenning//
        if(PremiumInfo === 0){  
            fetch(process.env.BOTGATHER_LINK + "/?Guildid=" + GuildID + "&ApiOauth=" + process.env.APIAUTHKEY , {method: 'GET',headers: {}})
            .then(res => res.json())
            .then(function(GuildMemberCount){
                GuildMemberCount = GuildMemberCount.MemberCount;
                GuildMemberCount = 255 //------------------------------------------------------------ DELETE THIS ------------------------------------------ DELETE THIS ---------
                if(GuildMemberCount <= 100){ resolve(0);}
                else if(GuildMemberCount > 100 && GuildMemberCount <= 2500){resolve(1);}
                else if(GuildMemberCount > 2500){resolve(2);} 
            })
            .catch(function(err){reject("Cannot establish connection with the Discord services. Please try again later.");})
        }
        //Premium subscription still hapenning.
        else{
            resolve("Already");
        }
    })
}




//TRIGGER THE PREMIUM VERIFICATION EVERY DAY AT THAT TIME//
var rule = new schedule.RecurrenceRule();
rule.hour = 15;
rule.minute = 22;
rule.second = 05;
schedule.scheduleJob(rule, function(){
    GuildVerification();
});


async function GuildVerification(){
    console.log(new Date(), 'Running Premium plan verification...');

    return new Promise((resolve, reject)=>{
        fetch(process.env.PREMIUMVERIFICATION_LINK + "?ApiOauth=" + process.env.APIAUTHKEY , {method: 'GET',headers: {}})
        .then(res => res.json())
        .then(function(GuildMemberCount){
            console.log(new Date(), 'Finished Premium plan verification');
            resolve();
        })
        .catch(function(err){console.log(err);})
    })
}
module.exports.GuildVerification = GuildVerification;





async function Paypal_GetBearerToken(){
    return new Promise((resolve, reject)=>{
        try{
            var Key = 'Basic ' + Buffer.from('ATs8D4ekzioCA2W5XqCJgLM1E_3_FXadPsr6KRQhyK0zvDzXvuynilPYTF2fHlMHTwpqpSh4wXrZ6Wy8:ENU9fzAZlCRX4y_ICFu2vPghKkJD1LX3erWj9gJWME72aVvZMstWjDODOQ_Phe79uAKf5KlCry8VSzM3').toString('base64');
            var options = {
                method : 'POST', 
                url: 'https://api.sandbox.paypal.com/v1/oauth2/token',
                headers: {
                    'Authorization': Key,
                    'Content-Type':'application/x-www-form-urlencoded'
                },
                form:{grant_type: 'client_credentials'}
            }
            
            request(options, function(err, response, body){
                if(err){reject(err);}
                else if(body){ body = JSON.parse(body); resolve(body.access_token)}
            })

        } catch(error){reject(error);}
    })
}

async function Cancel_Subscription(RequestBody){
    return new Promise((resolve, reject)=>{

        var Serverinfo = JSON.parse(RequestBody.ServerInfo);
        var SelectCancelation = RequestBody.SelectCancelation;
        var ReasonText = RequestBody.reasontext;

        var SelectCancelationMSG = "Nothing matched the Switch/Case statement";

       if(!SelectCancelation){SelectCancelation = '0';}
        switch (SelectCancelation){
            case '0':
                SelectCancelationMSG = "No selected Reasons"; break;
            case '1':
                SelectCancelationMSG = "I found a better bot somewhere else"; break;
            case '2':
                SelectCancelationMSG = "I am not satisfied anymore by the updates"; break;
            case '3':
                SelectCancelationMSG = "I had technical issues, the support wasn't useful"; break;
            case '4':
                SelectCancelationMSG = "I buyed the premium by error"; break;
            case '5': 
                SelectCancelationMSG = "No particular reason"; break;
        }

        console.log("ServerInfo");
        console.log(Serverinfo);
        console.log(ReasonText);
        console.log(SelectCancelation);
        console.log(SelectCancelationMSG);
        console.log("");
        console.log("");

        var subscriptionID = Serverinfo.PremiumInfo.SubscriptionID;

        Mailer.AdminReport_Cancelation(Serverinfo, ReasonText, SelectCancelationMSG);

        Paypal_GetBearerToken()
        .then(function(BearerToken){
            var options = {
                method : 'POST', 
                url: `https://api.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionID}/cancel`,
                headers: {
                    'Authorization': `Bearer ${BearerToken}`,
                    'Content-Type':'application/json'
                },
                body : '{ "reason" : " ' + SelectCancelationMSG + '"}'
            }
            
            request(options, function(err, response, body){
                if(err){console.log("REJECTION REQUEST"); reject(err);}
                else if(response){ 

                    setTimeout(function(){
                        //console.log("PAYPAL RESPONSE CANCELLATION");
                        fetch(process.env.BOTREFRESH_LINK, {
                            method:'POST',
                            body:`{"GuildID":"${Serverinfo.GuildID}"}`,
                            headers: {'Content-Type': 'application/json'}
                        })

                        resolve(true);
                    }, 5000);
                }
            })
        })
        .catch(function(err){console.log("REJECTION HERE"); reject(err)});
    })
}
module.exports.Cancel_Subscription = Cancel_Subscription;


async function RefundAndCancelSubscription(SubscriptionID){
    return new Promise((resolve, reject)=>{
        Paypal_GetBearerToken()
        .then(function(BearerToken){

            var EndTime = new Date();
            var StartTime = new Date();
            StartTime = StartTime.setDate(EndTime.getDate() - 29);
            StartTime = new Date(StartTime)

            var options = {
                method: 'GET',
                url : `https://api.sandbox.paypal.com/v1/billing/subscriptions/${SubscriptionID}/transactions`,
                qs: {
                    start_time : StartTime,
                    end_time : EndTime
                },
                headers : {
                    'Authorization': `Bearer ${BearerToken}`,
                    'Content-Type':'application/json'
                }
            }


            //Retrieve this month last transaction of this Subscription to get the Payement ID//
            request(options, function(err, response, body){
                if(err){reject(err);}
                else if(body){
                    var ParsedBody = JSON.parse(body);
                    PayementID = ParsedBody.transactions[0].id;
                    PayementStatus = ParsedBody.transactions[0].status;
                    console.log("");
                    console.log("GOT TRANSACTION TICKET");
                    console.log(PayementID);
                    console.log(PayementStatus);
                    console.log("");

                    //If the payement status have been already COMPLETED//
                    if(PayementStatus == "COMPLETED"){  
                        //Will proceed to the refund of this last payement for the choosed subscription//
                        var options_Refund = {
                            method: 'POST',
                            url : `https://api.sandbox.paypal.com/v2/payments/captures/${PayementID}/refund`,
                            headers : {
                                'Authorization': `Bearer ${BearerToken}`,
                                'Content-Type':'application/json'
                            }
                        }
                        request(options_Refund, function(err, response, body){if(err){reject(err)}})



                        //Will proceed to a cancelation of the current subscription.
                        var options_Cancel= {
                            url : `https://api.sandbox.paypal.com/v1/billing/subscriptions/${SubscriptionID}/suspend`,
                            method: 'POST',
                            headers : {
                                'Authorization': `Bearer ${BearerToken}`,
                                'Content-Type':'application/json'
                            },
                        }

                

                        request(options_Cancel, function(error, res, body){
                            if(error){reject(error);}
                            else if (res){
                                console.log("SUCCESS RESPOND OPTION CANCEL");
                                resolve(true);
                            }
                        })
                    }
                }
            })
        })
        .catch(function(err){reject(err)})
    })
}
module.exports.RefundAndCancelSubscription = RefundAndCancelSubscription;