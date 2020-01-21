var SiteLink = document.getElementsByTagName("secondarydata")[0].getAttribute("sitelink");
var Selected_Server = document.getElementsByTagName("secondarydata")[0].getAttribute("selectedserver");

var OwnerData = document.getElementsByTagName("passeddata")[0].getAttribute("ownerdata");
OwnerData = JSON.parse(OwnerData);
//console.log(OwnerData);

var SelectedGuild = document.getElementsByTagName("passeddata")[0].getAttribute("guildinfo");
SelectedGuild = JSON.parse(SelectedGuild);
console.log(SelectedGuild);

var ChangesHaveBeenMade = false;


//Export an form element full of <options> for a selectable with every selectable roles of the Guild//
var Select_Roles = `<optgroup label="Couldn't retrieve Guild data. Verify that the bot is connected to your server... "> </optgroup>`;
if(SelectedGuild){
    Select_Roles = "";
    SelectedGuild.Roles.forEach(element => {
        if(element.position != 0){    
            Select_Roles += `<option value="${element.id}">${element.name}</options>`;
        }
    });
}

var Select_Channels = `<optgroup label="Couldn't retrieve Guild data. Verify that the bot is connected to your server... "> </optgroup>`;
if(SelectedGuild){
    Select_Channels = "";
    SelectedGuild.Channels.forEach(element => {
        if(element.type == "category"){
            Select_Channels += '<optgroup label="' + element.name + '">';

            SelectedGuild.Channels.forEach(element2 => {
                if(element2.type == "text"){
                    if(element2.parentID == element.id){
                        Select_Channels += '<option value="' + element2.id + '">' + element2.name + '</options>';
                    }
                }
            });
            Select_Channels += '</optgroup>';
        }
    });
}



//DEBUG AREA//
$(document).ready(function(){
    $('#config').append(`
        <input name="token" type="text" value="${SelectedGuild.GuildInfo.jwtToken}" form="config" style="display:none">
    `);

    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    
    if(vars['Status'] === "Success"){
        $('.Success_Handler').show("slow");
        var DecodedMSG = decodeURI(vars['MSG']);
        $('.Success_Handler #Success_MSG').html(DecodedMSG + `<span class="closespan" onclick="$('.Success_Handler').hide('slow')">X</span>`);
    }
    else if (vars['Status'] === "Error"){
        $('.Error_Handler').show("slow");
        var DecodedMSG = decodeURI(vars['MSG']);
        $('.Error_Handler #Error_MSG').html(DecodedMSG +  `<span class="closespan" onclick="$('.Error_Handler').hide('slow')" >X</span>`);
    }
})
function Error_Show(ErrorMSG){
    var URL = (($(location).attr('href') + "&Status=Error&MSG=" + ErrorMSG).split('&')[0]);
    window.location.replace(URL + "&Status=Error&MSG=" + ErrorMSG);
}
function Success_Show(SuccessMSG){
    var URL = (($(location).attr('href') + "&Status=Success&MSG=" + SuccessMSG).split('&')[0]);
    window.location.replace(URL + "&Status=Success&MSG=" + SuccessMSG);
}



//If a server is selected//
if(Selected_Server){
    if(OwnerData){DrawBoard(); }
}

$(document).ready(function(){Update_CardVal_FromCookie(); Show_Analytics()});


//Automaticly delete the passed data from the page for [reasons].
var elementtoDelete = document.getElementsByTagName("passeddata")[0].parentElement;
elementtoDelete.removeChild(elementtoDelete.children[0]);


/*
############################################
########### MAIN PANEL CARD DRAW ###########
############################################
*/


//Function that draw the entire board. 
function DrawBoard(){
    var html_card = '';
    var html_Panels = ''; 
    var PluginConfig = Panel;

    //Will iterate every entry, get the name, the description, and will draw the HTML card//
    Object.keys(PluginConfig).forEach(function(Plugin, index){


        //Usefull variable Declaration//
        var PluginName = Plugin;
        var PluginJSONData = Object.values(PluginConfig)[index]; //Get the plugin display name, description ect...//
        var DisplayName = "Unknown";
        var DisplayDescription = "Unknown";
        var CanBeDeactivated = false;


        if(DrawCards){DisplayName = DrawCards[PluginName].DisplayName }
        if(DrawCards){DisplayDescription = DrawCards[PluginName].DisplayDescription}
        if(DrawCards){CanBeDeactivated = DrawCards[PluginName].CanBeDeactivated}
      
        //Build the Card HTML//
        html_card += `
        <div class="col s12 l6 cardcol">
            <div id="CardPanel_${PluginName}" class="card selectable" onclick="PanelSwitch('${PluginName}')">
                <div class="card-content white-text row">
                    <span class="card-title">${DisplayName}</span> ${DrawActivation(PluginName, CanBeDeactivated)}      
                </div>
                <div class="card-action">
                    <p>${DisplayDescription}</p>
                </div>
            </div>
        </div>
        `;

        html_Panels += Draw_PanelConfig(PluginName);
    });

    //Set the card inside the row element//
    $('#carddrawboard').html(html_card);

    //DRAW the panel that will be deployed on the Card click();//
}

//Get the board display config, check if "Activated" array is present//
//If yes, draw a switch. If not, draw nothing//
function DrawActivation(PluginName, CanBeDeactivated){
    if(CanBeDeactivated){
        var Draw = `  
        <!-- Switch -->
        <div class="switch">
        <label>
            <input id="${PluginName}_switch" onclick="OnSwitch_Click(this)" name="Config[${PluginName}][Activated]" value="true" type="checkbox" form="config">
            <span class="lever"></span>
        </label>
        </div>
        `;
        return Draw;
    }
    else {return ""; }
}


/*
#########################################
########### DRAW PANEL CONFIG ###########
#########################################
*/

//Will draw any plugin panel based on the BoardDisplay configuration//
function Draw_PanelConfig(PluginName){
    var Html_Return = ''
    //Global Plugin Draw options//
    var Elements = DrawCards[PluginName];
    var DisplayName = "Unknow";
    if(Elements.DisplayName){DisplayName = Elements.DisplayName;}


    for(i=0; i < Object.keys(Panel[PluginName]).length; i++){
        var element = Object.values(Panel[PluginName])[i];

        EntryTitle = Object.keys(Panel[PluginName])[i];
        DisplayTitle = element['DisplayTitle'];
        ToolTip = element['ToolTip'];
        colwidth = element['colwidth'];
        type = element['type'];
        AdditionnalTypeDisplay = element['AdditionnalTypeDisplay'];

        if(colwidth === 0 || colwidth === undefined){ colwidth = 4 }


        switch(type){
            case 'Checkbox' :
                Html_Return += Draw_Checkbox(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth);
                break;

            case 'Enum' :
                Html_Return += Draw_Enum(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth, AdditionnalTypeDisplay);
                break;

            case 'DiscordMessages':
                Html_Return += Draw_DiscordMessage(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth);
                break;

            case 'Textbox small':
                Html_Return += Draw_TextboxSmall(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth);
                break;

            case 'Textbox Large':
                Html_Return += Draw_TextboxLarge(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth);
                break;

            case 'Paragraph':
                Html_Return += Draw_Paragraph(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth);
                break;

            case 'FeedBack_Category_Array':
                Html_Return += Draw_FeedBack_Category_Array(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth, AdditionnalTypeDisplay);
                break;

            case 'Permissions':
                Html_Return += Draw_Permissions(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth);
                break;

            case 'PublicChannel':
                Html_Return += Draw_PublicChannel(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth);
                break;

            case 'ChannelsText':
                Html_Return += Draw_ChannelsText(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth, SelectedGuild);
                break;

            case 'Team_List':
                Html_Return += Draw_TeamList(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth, SelectedGuild);
                break;
                
            case 'Role_Selectable':
                Html_Return += Draw_Roles_Selectable(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth, SelectedGuild);
                break;

            case 'TagChooser' : 
                Html_Return += Draw_Tag_Chooser(PluginName, EntryTitle, DisplayTitle, ToolTip, colwidth);
                break;
        }
    }

    var Doc_page = "";
    var Header = DrawCards[PluginName]['Header'];

    if(Header){
        Doc_page = `<div class="headerplugin">${Header}</div>`;
        Doc_page = Doc_page.replace(/{guildid}/g, SelectedGuild.GuildInfo.GuildID);
    }

    $('#Panel_Configuration').append(`
        <div class="panel HiddenPanel swing-in-top-fwd" id="${PluginName}">
            <span style="padding-left:15px" class="large material-icons" onclick="ReturnMainPanel('${PluginName}')">arrow_back_ios</span>
            <h1>${DisplayName}</h1>
            <div class="content">
                ${Doc_page}
                <div class="row" id="rowcontent">
                    ${Html_Return}
                </div>
            </div>
        </div>
    `);
}




//Show a specific plugin panel and hide the main content//
function PanelSwitch(PluginName){
    $(`#MainPanelContent `).hide(10);
    $(`#Panel_Configuration #${PluginName}`).show(10);
}

//Hide the specific plugin panel and will show the main content//
function ReturnMainPanel(PluginName){
    $(`#Panel_Configuration #${PluginName}`).hide(10);
    $("#MainPanelContent").show(10);
    
}



//When you click on the "Activate" switch on a specific plugin card//
function OnSwitch_Click(t_this){
    ChangesMade();
    var card = t_this.parentElement.parentElement.parentElement.parentElement;

    if(t_this.checked === true){
        card.style.background = "var(--GradientNav)";
    }
    else if(t_this.checked === false){
        card.style.background = "var(--GradientPurpleDeactivated)";
    }
}

$('.switch').click(function(e){ //This function will stop the parent from being clicked when a children is also clicked in//
    e.stopPropagation();
})



//Function for addable array form. Will automaticly add and give the possibility to erase specific array from the list//

function AddTeamArrayAt(entrytitle, PluginName){

    var Rowcount = $(`#${entrytitle}`).attr('rowcount');
    Rowcount++;

    $(`#${entrytitle}`).attr('rowcount', Rowcount).append(`
        <div class="ArrayElement" id="${entrytitle}-${Rowcount}">  
            <div class="row">
                <div class="col s5">
                    <label>Team Name</label> <br>
                    <input class="input_largetext" name="Config[${PluginName}][${entrytitle}][${Rowcount}][TeamName]" type="text" form="config" placeholder="Team Red">
                </div>

                <div class="col s5 offset-s1">
                    <label>Team role (Create one using your discord "Role" panel). </label>
                    <select id="${entrytitle}-select" name="Config[${PluginName}][${entrytitle}][${Rowcount}][TeamDiscordID]" form="config">
                        ${Select_Roles}
                    </select>
                </div>

                <div class="col s1">
                <a class="ArrayDeletable waves-effect waves-light btn redbutton" onclick="$('#${entrytitle}-${Rowcount}').remove(); ChangesMade();"><i class="material-icons left">clear</i></a>
                </div>
            </div>

            <div class="row">
                <div class="col s11">
                    <label>Team Description</label>
                    <input class="input_largetext" name="Config[${PluginName}][${entrytitle}][${Rowcount}][TeamDescription]" type="text" form="config" placeholder="They like red. I swear.">
                </div>
            </div>

            <div class="row">
                <div class="col s11">
                    <label>Join Message</label>
                    <input class="input_largetext" name="Config[${PluginName}][${entrytitle}][${Rowcount}][TeamJoinMSG]" type="text" form="config" placeholder="You are one of us !">
                </div>
            </div>
        </div>
    `);
    M.AutoInit();
}



//Will remove one array entry if we click on it.
function RemoveArrayAt(idelem){
    $('#' + idelem).remove();
    Index_Row--;
    ChangesMade();
}


function ChangesMade(){
    if(ChangesHaveBeenMade === false){
        ChangesHaveBeenMade = true;
        document.getElementById("ChangesHelper").style.bottom = '2%';
    }
}

/*
####################################
########### LOAD CHANGES ###########
####################################
*/

//This function will only check if the plugin is activated or not
//So it will load the panel at the good color and the switch at the good position//
function Update_CardVal_FromCookie(){
    console.log(SelectedGuild.GuildInfo.PluginsConfig);
    if(SelectedGuild.GuildInfo.PluginsConfig){
        var PluginsConfig = JSON.parse(SelectedGuild.GuildInfo.PluginsConfig);
   

        for(i=0; i < Object.keys(PluginsConfig).length; i++){ //For each plugins//
        var PluginName = Object.keys(PluginsConfig)[i];
            for(y=0; y < Object.values(PluginsConfig)[i].length; y++){          //For each plugins data input with key === "Activated"//

                if(Object.values(PluginsConfig)[i][y][0] === "Activated"){  //(Update only the plugins that we can activate/deactivate)//
                    var Activated = Object.values(PluginsConfig)[i][y][1];
                    var CardPlugin = $(`#CardPanel_${PluginName}`);
                    var SwitchPlugin = $(`#${PluginName}_switch`);

                    if(Activated == 'true'){
                        $(CardPlugin[0]).removeAttr("style");
                        if(CardPlugin[0]){
                            CardPlugin[0].style.background = "var(--GradientNav)";
                            $(SwitchPlugin).prop('checked', true);
                        }
                    }
                    else { 
                        if(DrawCards[PluginName]['CanBeDeactivated'] == true){
                            $(CardPlugin[0]).removeAttr("style");
                            if(CardPlugin[0]){CardPlugin[0].style.background = "var(--GradientPurpleDeactivated)";}
                        }
                    }       
                }

                // If the Entry is Team Array (For plugin 'Pick A Team') //
                else if(Object.values(PluginsConfig)[i][y][0] === "TeamList"){
                    
                    var TeamData = Object.values(PluginsConfig)[i][y][1];
                    if(typeof TeamData === "object"){
                        //Create empty array to be populated next //
                        TeamData.forEach(element => {AddTeamArrayAt(Object.values(PluginsConfig)[i][y][0], PluginName);});
                        TeamData.forEach(function(element, index){
                            var IndexPlus = index + 1;
                            $(`input[name*='Config[${PluginName}][${Object.values(PluginsConfig)[i][y][0]}][${IndexPlus}][TeamName]']`).val(element['TeamName']);
                            $(`select[name*='Config[${PluginName}][${Object.values(PluginsConfig)[i][y][0]}][${IndexPlus}][TeamDiscordID]']`).val(element['TeamDiscordID']);
                            $(`input[name*='Config[${PluginName}][${Object.values(PluginsConfig)[i][y][0]}][${IndexPlus}][TeamDescription]']`).val(element['TeamDescription']);
                            $(`input[name*='Config[${PluginName}][${Object.values(PluginsConfig)[i][y][0]}][${IndexPlus}][TeamJoinMSG]']`).val(element['TeamJoinMSG']);
                        });
                    }
                }

                else if(Object.values(PluginsConfig)[i][y][0] === "CategoryChoosed"){
                    if(typeof  Object.values(PluginsConfig)[i][y][1] === "object"){
                        Object.values(PluginsConfig)[i][y][1].forEach(function(elem, index){
                            $(`input[name*='Config[${PluginName}][${Object.values(PluginsConfig)[i][y][0]}][${index}]']`).val(elem);
                        })
                    }
                }


                else {
                    var b = $(`input[name*='Config[${PluginName}][${Object.values(PluginsConfig)[i][y][0]}]']`);
                    var c = $(`textarea[name*='Config[${PluginName}][${Object.values(PluginsConfig)[i][y][0]}]']`);
                    console.log(PluginsConfig)
                    var d = $(`#${Object.values(PluginsConfig)[i][y][0]}-select`);


                    if(b){
                        if($(b).attr('type') == "checkbox"){
                            if(Object.values(PluginsConfig)[i][y][1] == "true" || Object.values(PluginsConfig)[i][y][1] == true){$(b).prop('checked', true);}
                        }

                        if($(b).attr('type') == "text"){
                            $(b).val(Object.values(PluginsConfig)[i][y][1]);
                        }
                    }

                    if(c){
                        if(typeof Object.values(PluginsConfig)[i][y][1].replace != 'undefined'){
                            $(c).val(Object.values(PluginsConfig)[i][y][1].replace(/\\n/g, '\n'));
                        }
                    }

                    if(d[0]){
                        //Auto init Selectable value
                        $(d).val(Object.values(PluginsConfig)[i][y][1]);
                    }
                }
            }
        }
    }
    M.AutoInit();
}


function Show_Analytics(){
    if(SelectedGuild.Analytics.length > 2){
        var Analytics_Array = JSON.parse(SelectedGuild.Analytics);
        var DateArray = [];
        var membercountArray = [];
        var BorderColorArray = [];

        Analytics_Array.forEach(function(AnalyticsElem){
            var NewDate = AnalyticsElem.Date;
            NewDate = NewDate.split('T')
            NewDate = NewDate[0];
            DateArray.push(NewDate);
            membercountArray.push(AnalyticsElem.membercount);
            BorderColorArray.push('rgba(255, 100, 132, 1)');
        });

        myChart.data.labels = DateArray;
        myChart.data.datasets[0].data = membercountArray;
        myChart.data.datasets[0].borderColor = BorderColorArray;
        myChart.update();
    }
}



/*
####################################
########### SAVE CHANGES ###########
####################################
*/

function SaveChanges(){
    document.getElementById('config').submit();
}


/*
###############################
########### DISCARD ###########
###############################
*/
function DiscardChanges(ConfirmedDiscard){
    if(ChangesHaveBeenMade === true){
        if(ConfirmedDiscard === false){
            document.getElementById("DiscardModal").style.display = "block";
        }
        else if(ConfirmedDiscard === true){
            //Visuals//
            document.getElementById("DiscardModal").style.display = "none";
            ChangesHaveBeenMade = false;
            document.getElementById("ChangesHelper").style.bottom = '-20%';
            M.toast({html:'All changes has been discarded.'})

            //Discard changes//
            Cookies.set(Selected_Server , PluginData_Server, {expires : 7});
            PluginData = JSON.parse(PluginData_Server);

            //Reload Input values//
            if($('.panel').is(":visible")){
                UpdateInputVal_FromCookie($('.panel').attr('id'));
            }
            else { 
                Update_CardVal_FromCookie()
            }

            //Reset top error//
            $('input').each(function(){
                $(this).prev().remove();
            })
        }
    }
}



/*
#########################################
########### Save Error Helper ###########
#########################################
*/
var Draw_Helper_html = "";
function SaveErrorHelper(ErrorStack){
    console.log(ErrorStack);
    Draw_Helper_html = "";
    ErrorStack = JSON.parse(ErrorStack.responseText);
    
    Draw_Helper_html  += `
    <div class="SaveErrorHelper">
    <h3 class="warnmsg">Warning. Some Incorrect values are not saved.</h3>
    `;

    ErrorStack.forEach(function(elem){
        Draw_Helper_html += `
        <div class="ErrorHelperElem">
            <span>With the plugin <b class="plugin">${elem[0]}</b>. Entry <i class="entry">${elem[1]}</i> : <b>${elem[2]}</b></span>
        </div>
        `;
    })

    Draw_Helper_html +=
    `</div>
    `;

    $('.dashboardform').prepend(Draw_Helper_html);
}



/*
###########################################
########### Modal Account Panel ###########
###########################################
*/

function Modal_account_Show(){
    $('#AccountModal').show();
}

var modal = document.getElementById('AccountModal');
$('#AccountModal').on("click", function(event){CloseModal(event);})

function CloseModal(event){
    if(event.target === modal || event.target == "CloseSpanModal"){$('#AccountModal').hide(400);}
}



var PremiumInfo_NoSubscription_HTML = `
<span>You have no premium subscription active. <br> Information and Options about current active subscriptions will be shown here. </span>
`;

if(SelectedGuild.PremiumSubscription == ''){
    $('#PremiumContent').html(PremiumInfo_NoSubscription_HTML);
}
else {
    Object.values(OwnerData.PremiumInfo).forEach(ServerSubscription =>{
        var ServerTitle = ServerSubscription.GuildName;
        var ServerID = ServerSubscription.GuildID;
        var IsPremium = ServerSubscription.PremiumPass;
        var DayOfPayement = ServerSubscription.PremiumInfo.DayOfPayement;
        var Price = ServerSubscription.PremiumInfo.Price;
        var subscriptionID = ServerSubscription.PremiumInfo.subscriptionID;
        var PlanName = ServerSubscription.PremiumInfo.PlanName;
        var Status = ServerSubscription.PremiumInfo.Status;

        if(ServerSubscription.PremiumInfo.SubscriptionID){
        
                var BillingMonth = 0;
                var datenow = new Date().getDate();
                if(ServerSubscription.PremiumInfo.DayOfPayement <= datenow){BillingMonth = new Date().getMonth() + 1;}
                else {BillingMonth = new Date().getMonth();}

                switch(BillingMonth){
                    case 0: BillingMonth = "January"; break;
                    case 1: BillingMonth = "February"; break;
                    case 2: BillingMonth = "March"; break;
                    case 3: BillingMonth = "April"; break;
                    case 4: BillingMonth = "May"; break;
                    case 5: BillingMonth = "June"; break;
                    case 6: BillingMonth = "Jully"; break;
                    case 7: BillingMonth = "August"; break;
                    case 8: BillingMonth = "September"; break;
                    case 9: BillingMonth = "October"; break; 
                    case 10: BillingMonth = "November"; break;
                    case 11: BillingMonth = "December"; break;
                }
        
            if(Status == "CANCELLED"){
                BillingMonth += "<br><i>Cancelled - The Premium membership will end at that date</i>";
                Price = 0.00;
            }

            var PremiumStatus = "";
            if(ServerSubscription.PremiumPass == 1){
                var PremiumStatus = ` <a class="btn ActivatedPremium tooltipped" data-position="top" data-tooltip="Every premium features are unlocked !">
                                        <span>✔️ - Premium Activated</span></a>`;
            }
            else if (ServerSubscription.PremiumPass == 0){
                var PremiumStatus = `  <a class="btn DeactivatedPremium tooltipped" data-position="top" data-tooltip="Premium features are locked. If you think this is an error, please contact an Administrator">
                                        <span>❌ - Premium Deactivated</span></a>`;
            }


            var HTML_SHOW = `
                <div class="SubscriptionElem">
                    <div class="row">
                        <div class="col s6">
                            <h3>${ServerSubscription.GuildName}</h3>
                            <span><b>Guild-ID :</b> ${ServerSubscription.GuildID} </span> <br><br>
                            ${PremiumStatus} 
                        </div>

                        <div class="right-align col s6">
                            <span class="Price"><b>${Price}€</b> <i>/month</i></span><br>
                            <span><b>Next paiement</b> : ${DayOfPayement} ${BillingMonth}</span>
                        </div>
                    </div>

                    <br>

                    <div class="row">
                        <div class="col s6">
                            <span><b>Plan : </b> ${ServerSubscription.PremiumInfo.PlanName}</span><br>
                            <span><b>Subscription-ID : </b> ${ServerSubscription.PremiumInfo.SubscriptionID}</span><br>
                            <span><b>Buyer Name : </b> ${ServerSubscription.PremiumInfo.Buyer_Discord_Name} </span><br>
                        </div>
                    </div>
            `;

            
            if(Status == "ACTIVE"){ HTML_SHOW +=` <br><br>
                <a class="waves-effect waves-light redbutton btn" onclick='ShowCancelPanel(${JSON.stringify(ServerSubscription)})'>Cancel Subscription</a>
                <a class="waves-effect waves-light bluebutton btn" onclick='ShowRefundPanel(${JSON.stringify(ServerSubscription)})'>Refund request</a>
            `;}

            HTML_SHOW += `</div>`;
            $('#PremiumContent').append(HTML_SHOW);
        }
    })
}



function ShowRefundPanel(ServerSubscription){
    $('#RefundPanel').show(400);
    $('#ServerInfo').val(JSON.stringify(ServerSubscription));
}

function ShowCancelPanel(ServerSubscription){
    $('#CancelPanel').show(400)
    $('#ServerInfoCancelation').val(JSON.stringify(ServerSubscription));
}

var modalRefund = document.getElementById('RefundPanel');
$('#RefundPanel').on("click", function(event){
    if(event.target === modalRefund){
        $('#RefundPanel').hide(400);
    }
})



$('#TagChooser').keydown(function(element){
    var Target = $(element.target);
    var content = $(Target).val();
    content = content.split(/,/g);
    var HTMLDraw = '';
    content.forEach(function(entries){
        HTMLDraw += `<p style="background-color:red"> ${entries} </p>`;
    })
    $(Target).parent().append(HTMLDraw);
})




/*
##########################################
########### JQUERY UPDATE DATA ###########
##########################################
*/

//Check if an "<input>" tag is being changed//
$('.UserPanel').on('click', function(event){ //DONT CHANGE THE "change" parameter at 'on'. The tagchooser depend on that (weird, bug ?).//
    //$('input').off();
    $('input[ExcludeChange!=true]').change(function(){ 
        ChangesMade();
    })

    //$('select').off();
    $('select').change(function(){
        ChangesMade();
    })

    //$('textarea').off();
    $('textarea').change(function(){
        ChangesMade();
    })
})