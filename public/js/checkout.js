var AccessToken = document.getElementsByTagName("PremiumData")[0].getAttribute('AccessToken');
var GuildID = document.getElementsByTagName("PremiumData")[0].getAttribute('GuildID');
var SelectedServer = document.getElementsByTagName("PremiumData")[0].getAttribute('SelectedServer');
var PayInfo = document.getElementsByTagName("PremiumData")[0].getAttribute('PayInfo');
var UserDiscordName = document.getElementsByTagName("PremiumData")[0].getAttribute('UserDiscordName');
var UserDiscordID = document.getElementsByTagName("PremiumData")[0].getAttribute('UserDiscordID');
var UserEmail = document.getElementsByTagName("PremiumData")[0].getAttribute('UserEmail');



//Automaticly delete the passed data from the page for [reasons].
var elementtoDelete = document.getElementsByTagName("PremiumData")[0].parentElement;
elementtoDelete.removeChild(elementtoDelete.children[0]);



//Handle error and success message even if page reload//
$(document).ready(function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    if(vars['MSG'] === "Success"){
        $('.Success_Handler').show("slow");
        $('.Success_Handler #Success_MSG').html('Success : ' + "Succefully subscribed to Quested !" + `<span class="closespan" onclick="$('.Success_Handler').hide('slow')">X</span>`);
    }
    else if (vars['MSG'] === "Error"){
        $('.Error_Handler').show("slow");
        $('.Error_Handler #Error_MSG').html('An error occured : ' + "Error while creating subscription..." +  `<span class="closespan" onclick="$('.Error_Handler').hide('slow')" >X</span>`);
    }
})

function Error_Show(){window.location.replace($(location).attr('href') + "&MSG=Error");}
function Success_Show(){window.location.replace($(location).attr('href') + "&MSG=Success");}



//PAYPAL BASIC 5.99€ BUTTON///*
paypal.Buttons({
    style: {label:  'pay',},

    createSubscription: function(data, actions) {
        return actions.subscription.create({
            'plan_id': 'P-1R917480PJ170640ALVFRLDA',
            'auto_renewal': true
        });
    },

    onApprove: function(data, actions) {
        console.log("Pay info = " + PayInfo);
        fetch(`/paypal-transaction-complete?orderID=${data.orderID}&subscriptionID=${data.subscriptionID}&GuildID=${GuildID}&AccessToken=${AccessToken}&UserDiscordName=${UserDiscordName}&UserDiscordID=${UserDiscordID}&UserEmail=${UserEmail}&Tier=${PayInfo}`, {
            method: 'post',
            headers: {
            'content-type': 'application/x-www-form-urlencoded'
            },
        })
        .then(function(data){
            if(data.status === 200){Success_Show();}
            else if(data.status === 500){Error_Show();}
        })
        .catch(function(err){Error_Show("Unknow error - Please contact an administrator.");})  
    },

    onCancel: function(data){
    },

    onError: function(err){
    }
  }).render('#paypal-button-container');

//PAYPAL PREMIUM 15.99€ BUTTON//
paypal.Buttons({
    style: {label:  'pay',},

    createSubscription: function(data, actions) {
        return actions.subscription.create({
            'plan_id': 'P-16K96293A3835814PLVFRLJY',
            'auto_renewal': true
        });
    },

    onApprove: function(data, actions) {
        console.log("Pay info = " + PayInfo);
        fetch(`/paypal-transaction-complete?orderID=${data.orderID}&subscriptionID=${data.subscriptionID}&GuildID=${GuildID}&AccessToken=${AccessToken}&UserDiscordName=${UserDiscordName}&UserDiscordID=${UserDiscordID}&UserEmail=${UserEmail}&Tier=${PayInfo}`, {
            method: 'post',
            headers: {
            'content-type': 'application/x-www-form-urlencoded'
            },
        })
        .then(function(data){
            if(data.status === 200){Success_Show();}
            else if(data.status === 500){Error_Show();}
        })
        .catch(function(err){Error_Show("Unknow error - Please contact an administrator.");})  
    },

    onCancel: function(data){
    },

    onError: function(err){
    }
}).render('#paypal-premiumbutton-container');



$(document).ready(function(){
    if(PayInfo){
       $('.step2').show();
        if(PayInfo === 'Already'){
            $('#step2_content').html(TierAlready_HTML);
            $('.step2').addClass('GreenContainer');
            $('.step2_paragraph').html(TierAlready_Paragraph);
        }

        else if(PayInfo === '0'){
            $('#step2_content').html(Tier0_HTML); 
            $('.step2').addClass('GreenContainer');
            $('.step2_paragraph').html(Tier0_Paragraph);
        }

        else if(PayInfo === '1'){
            $('#step2_content').html(Tier1_HTML);
            $('.step2').addClass('BlueContainer');
            $('.step2_paragraph').html(Tier1_Paragraph);
        }
        else if(PayInfo === '2'){
            $('#step2_content').html(Tier2_HTML);
            $('.step2').addClass('BlueContainer');
            $('.step2_paragraph').html(Tier2_Paragraph);
        }
    }


    $("#dropdown1 a").click(function(){
        $('.loaded').show();
    });
})



var TierAlready_HTML =   
 `<h2>👍 - Subscription already payed.</h2>
<span>✔️ - Full access to premium features</span>`;

var TierAlready_Paragraph = 
`<p> This server already have a premium plan payed for this month. If you want to cancel, modify or refund your current subscription. 
Go under your Dashboard and click the "Account" button. <br><br>`;




var Tier0_HTML =    
`<h2>Free plan </h2>
<span>✔️ - Full access to premium features</span>`;

var Tier0_Paragraph = 
`<p>This server is still under the free plan of Quested. You can use all the Quested features without restriction ! <br><br>
When your server goes over 100 members, We will offer you 1 additional month to give you time to decide if you want
to pay the next plan (5.99€/month) or not. If you decide to not pay, only the premium features of Quested will be deactivated. 
But you will still keep the basics features and all the customization you've made for the bot. <br><br>`;




var Tier1_HTML =    
`<h2>Basic plan 🤗</h2>
<span>Get Quested premium features for 5.99€ per Month</span>`;

var Tier1_Paragraph =
`<p>Subscribe to Quested to get access to all premium features.  <br><br>

- 5.99€ per month <br>
- Cancel at any time <br>
- Friendly refund policy
</p>

<div id="paypal-button-container" class="center-align"></div>

`;

var Tier2_HTML = 
`<h2>Premium plan 😎</h2>
<span>Get Quested premium features for 15.99€ per Month</span>`;

var Tier2_Paragraph =
`<p>Subscribe to Quested to get access to all premium features.  <br><br>

- 15.99€ per month <br>
- Cancel at any time <br>
- Friendly refund policy
</p>

<div id="paypal-premiumbutton-container" class="center-align"></div>

`;