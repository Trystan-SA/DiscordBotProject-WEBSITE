var DrawCards = {
    InternalBehavior : {
        DisplayName : "⚙️ Configuration",
        DisplayDescription : "Global bot configuration",
        CanBeDeactivated : false,
        Header : ""
    },

    Welcome : {
        DisplayName : "🙋‍ Welcome",
        DisplayDescription : "Welcoming message for new members",
        CanBeDeactivated : true,
        Header : ""
    },

    PickATeam : { 
        DisplayName : "🚩 Pick A Team",
        DisplayDescription : "Make people choose a team for cool interaction !",
        CanBeDeactivated : true,
        Header : "Want to learn more ? <a href='https://itch.io/'> Check out the documentation. </a>"
    },

    Feedback : {
        DisplayName : "🗳 Feedback",
        DisplayDescription : "Gather the thoughts of your community.",
        CanBeDeactivated : true,
        Header : "Want to learn more ? <a href='https://itch.io/'> Check out the documentation. </a>  <br> Your feedback page is : <a href='http://localhost:8080/feedback/{guildid}'> http://localhost:8080/feedback/{guildid} </a>"
    },
}



//How configuration are generated, in that order//
var Panel = {

    InternalBehavior : {
        Prefix : {
            DisplayTitle : "Prefix",
            ToolTip : "Symbol or combination of letter used by the bot to recognize commands. I recommand using '!' so any command should start with this (ex: !help, !ban). Chance this only if you encounter problem with other bots.",
            type : "Textbox small",
            AdditionnalTypeDisplay : "",
            default_value : "!",
            colwidth : "s6"
        }
    },


    Welcome : {
        SendMSGInDM : {
            DisplayTitle : "Send private message",
            ToolTip : "If checked, will send a private message to the new user. If unchecked, will send the message publicly.",
            type: "Checkbox",
            AdditionnalTypeDisplay : "",
            default_value : false,
            colwidth: "s6"
        },

        ChannelToPost : {
            DisplayTitle : "Public Channel ID",
            ToolTip : "Select in what channel the message will be sent by the bot to welcome new users.",
            type : "ChannelsText",
            AdditionnalTypeDisplay : "",
            default_value : "",
            colwidth: "s6"
        },

        CustomMSG : {
            DisplayTitle: "Message",
            ToolTip : "The message the bot will display to the new member.",
            type: "DiscordMessages",
            AdditionnalTypeDisplay : "",
            default_value : `Hello {@User} !`,
            colwidth: "s6"
        }
    },


    PickATeam : {
        TeamList : {
            DisplayTitle : "Team List",
            ToolTip : "A list of every team your users can choose from.",
            type: "Team_List",
            AdditionnalTypeDisplay : "",
            default_value : "",
            colwidth: "s6"
        }
    },


    Feedback : {
        DrawFeedbackText : {
            DisplayTitle : "Send Feedback Discord message",
            ToolTip : "If checked, the bot will send a message in your discord server when new feedback is posted, approved or finished.",
            type: "Checkbox",
            AdditionnalTypeDisplay : "",
            default_value : false,
            colwidth: "6"
        },

        AllowComments : {
            DisplayTitle : "Allow Comments",
            ToolTip : "If checked, Your users will be able to comment any feedback suggestion.",
            type:"Checkbox",
            AdditionnalTypeDisplay : "",
            default_value : false,
            colwidth : "6"
        },

        ChannelToFeedbackText : {
            DisplayTitle : "Channel to send messages",
            ToolTip : "Select the channel where the bot will send the feedbacks messages",
            type:"ChannelsText",
            AdditionnalTypeDisplay : "",
            default_value : "",
            colwidth : "12"
        },

        CategoryChoosed : {
            DisplayTitle : "Custom Categories",
            ToolTip : "Feedback categories - Add a description to each color to organize feedbacks into categories.",
            type:"FeedBack_Category_Array",
            AdditionnalTypeDisplay : "",
            default_value : ["Edit my name !","Environment","Idea","Interface","Balance","Crafting","Monsters","Bugs","Others"],
            colwidth : "12",
        }
    },
}


if (typeof window === "undefined") {module.exports.Panel = Panel; module.exports.DrawCards = DrawCards;}
else { }


/*
#######################################
########### FORM PANEL DRAW ###########
#######################################

Thoses will draw the input forms. Like checkboxes, textarea, selectable boxes.
*/
function Draw_Checkbox(PluginName, entrytitle, displaytitle, ToolTip, FormColWidth){
    return (`
    <div class="input-field col s12 l${FormColWidth}">
        <div class="inputgraphics">
            <span class="tooltipped checkboxspan"  data-position="top" data-tooltip="${ToolTip}">${displaytitle}</span>
            <div><input class="input_checkbox" value="true" type="checkbox" form="config" name="Config[${PluginName}][${entrytitle}]"></div>
        </div>
    </div>
    `);
}

function Draw_Enum(PluginName, entrytitle, displaytitle, ToolTip, FormColWidth, AdditionnalTypeDisplay){

    AdditionnalTypeDisplay = JSON.parse(AdditionnalTypeDisplay);
    var EnumElement = '';
    var i = 1;

    AdditionnalTypeDisplay.forEach(element =>{
        EnumElement += `<option value="${i}">${element}</option>` ;
        i++
    });

    return (`
    <div class="input-field col s12 l${FormColWidth}">
        <div class="inputgraphics" id="${entrytitle}">
            <span class="tooltipped normalspan"  data-position="top" data-tooltip="${ToolTip}">${displaytitle}</span>
            <select id="${entrytitle}-select">
                <option value="" disabled selected>Select one</option>
                ${EnumElement}
            </select>
        </div>
    </div>
    `);
}


function Draw_DiscordMessage(PluginName, entrytitle, displaytitle, ToolTip, FormColWidth){
    return (`
        <div class="input-field col s12 l${FormColWidth}">
            <div class="inputgraphics" contenteditable="true">
                <span class="tooltipped normalspan"  data-position="top" data-tooltip="${ToolTip}">${displaytitle}</span>

                <div class="discordformatinghelp"> 
                    <p>
                    <span onclick="SelectDiscordMsgSpan($(this));"  >{user}</span> - Display the name of the user concerned by the action<br>
                    <span onclick="SelectDiscordMsgSpan($(this));"  >{user.tag}</span> - Display the account name and hashtag (ex: TheLegend#2742)</br>
                    <span onclick="SelectDiscordMsgSpan($(this));"  >{user.avatar}</span> - Display the URL of the user avatar</br>
                    <span onclick="SelectDiscordMsgSpan($(this));"  >{@user}</span> - Mention the user - He will receive a notification.</br>
                    <span onclick="SelectDiscordMsgSpan($(this));"  >{server}</span> - Display the name of this server<br>
                    <span onclick="SelectDiscordMsgSpan($(this));"  >{membercount}</span> - Display the number of members of this server <br>
                    <span onclick="SelectDiscordMsgSpan($(this));"  >{@channelname}</span> - Display a link to the given channel. replace 'channelname' by the name of the channel you want to link : {@rules}<br>
                    <span onclick="SelectDiscordMsgSpan($(this));"  >{@role}</span> - Mention everyone that have that role. Replace {@role} with the role name : {@admin} <br>
                    <span onclick="SelectDiscordMsgSpan($(this));"  >{@everyone}</span> - Mention @everyone, connected or disconnected. Usefull for a global announcement. But don't abuse it.. (once per week is a good rate) <br>
                    <span onclick="SelectDiscordMsgSpan($(this));"  >{@here}</span> - Mention every connected users that have the permission to see the chanel where the message is posted.<br>
                    </p> 
                </div>
                <textarea  name="Config[${PluginName}][${entrytitle}]" form="config" class="materialize-textarea discordmsgtextarea" maxlength="1800" placeholder="1800 Max length. This area will auto expand."></textarea>
            </div>
        </div>
    `);
}
function SelectDiscordMsgSpan(elem) { //Will add to the textarea the content of the span that was being clicked on.//
    var textarea = $(elem).parent().parent().next();
    textarea.val(textarea.val() + " " + $(elem).html() +" ");
}



function Draw_TextboxSmall(PluginName, entrytitle, displaytitle, ToolTip, FormColWidth){
    return (`
    <div class="input-field col s12 l${FormColWidth}">
        <div class="inputgraphics" id="${entrytitle}">
            <span class="tooltipped normalspan"  data-position="top" data-tooltip="${ToolTip}">${displaytitle}</span>
            <div><input name="Config[${PluginName}][${entrytitle}]" class="input_smalltext text" type="text" ></div>
        </div>
    </div>
    `);
}

function Draw_TextboxLarge(PluginName, entrytitle, displaytitle, ToolTip, FormColWidth){
    return (`
    <div class="input-field col s12 l${FormColWidth}">
        <div class="inputgraphics" id="${entrytitle}">
            <span class="tooltipped normalspan"  data-position="top" data-tooltip="${ToolTip}">${displaytitle}</span>
            <div><input name="Config[${PluginName}][${entrytitle}]" class="input_largetext text" type="text" ></div>
        </div>
    </div>
    `);
}

function Draw_Paragraph(PluginName, entrytitle, displaytitle, ToolTip, FormColWidth){
    return (`
        <div class="input-field col s12 l${FormColWidth}">
            <div class="inputgraphics" id="${entrytitle}">
                <span class="tooltipped normalspan"  data-position="top" data-tooltip="${ToolTip}">${displaytitle}</span>
                <textarea name="Config[${PluginName}][${entrytitle}]" class="materialize-textarea text" maxlength="1800"></textarea>
            </div>
        </div>
    `);
}

function Draw_Permissions(PluginName, entrytitle, displaytitle, ToolTip, FormColWidth){
    return (`
    <div class="input-field col s12 l${FormColWidth}">
        <div class="inputgraphics" id="${entrytitle}">
            <span class="tooltipped normalspan"  data-position="top" data-tooltip="${ToolTip}">${displaytitle}</span>
            <select id="${entrytitle}-select">
                <option value="" disabled selected>Permission level</option>
                <option value="1">Owner</option>
                <option value="2">Administrator</option>
                <option value="3">Moderator</option>
                <option value="4">Everyone</option>
            </select>
        </div>
    </div>
    `);
}

function Draw_ChannelsText(PluginName, entrytitle, displaytitle, ToolTip, FormColWidth, GuildInfo){
    return (`
    <div class="input-field col s12 l${FormColWidth}">
        <div class="inputgraphics" id="${entrytitle}">
            <span class="tooltipped normalspan"  data-position="top" data-tooltip="${ToolTip}">${displaytitle}</span>
           

            <select id="${entrytitle}-select" name="Config[${PluginName}][${entrytitle}]" form="config">
                ${Select_Channels}
            </select>

        </div>
    </div>
    `);
}


function Draw_FeedBack_Category_Array(PluginName, entrytitle, displaytitle, ToolTip, FormColWidth, AdditionnalTypeDisplay){
    return (`
        <div class="input-field col s12 l${FormColWidth}">
            <div class="inputgraphics" id="${entrytitle}">
                <span class="tooltipped normalspan"  data-position="top" data-tooltip="${ToolTip}">${displaytitle}</span>
                <br><br>


                <a class="waves-effect btn selectcolor" style="background-color:#1abc9c; width:150px !important;"> 
                    <input type="text" form="config" class="FeedbackCategoryColor" name="Config[${PluginName}][${entrytitle}][0]">
                </a>
                
                <a class="waves-effect btn selectcolor" style="background-color:#2ecc71; width:150px !important;"> 
                    <input type="text" form="config" class="FeedbackCategoryColor" name="Config[${PluginName}][${entrytitle}][1]"> 
                </a>

                <a class="waves-effect btn selectcolor" style="background-color:#3498db; width:150px !important;"> 
                <input type="text" form="config" class="FeedbackCategoryColor" name="Config[${PluginName}][${entrytitle}][2]"> 
                </a>

                <a class="waves-effect btn selectcolor" style="background-color:#9b59b6; width:150px !important;"> 
                    <input type="text" form="config" class="FeedbackCategoryColor" name="Config[${PluginName}][${entrytitle}][3]"> 
                </a>

                <a class="waves-effect btn selectcolor" style="background-color:#34495e; width:150px !important;"> 
                    <input type="text" form="config" class="FeedbackCategoryColor" name="Config[${PluginName}][${entrytitle}][4]"> 
                </a>

                <a class="waves-effect btn selectcolor" style="background-color:#f1c40f; width:150px !important;"> 
                    <input type="text" form="config" class="FeedbackCategoryColor" name="Config[${PluginName}][${entrytitle}][5]"> 
                </a>

                <a class="waves-effect btn selectcolor" style="background-color:#e67e22; width:150px !important;"> 
                    <input type="text" form="config" class="FeedbackCategoryColor" name="Config[${PluginName}][${entrytitle}][6]"> 
                </a>

                <a class="waves-effect btn selectcolor" style="background-color:#e74c3c; width:150px !important;"> 
                    <input type="text" form="config" class="FeedbackCategoryColor" name="Config[${PluginName}][${entrytitle}][7]"> 
                </a>

                <a class="waves-effect btn selectcolor" style="background-color:#95a5a6; width:150px !important;"> 
                    <input type="text" form="config" class="FeedbackCategoryColor" name="Config[${PluginName}][${entrytitle}][8]"> 
                </a>

            </div>
        </div>
    `);
}


function Draw_TeamList (PluginName, entrytitle, displaytitle, ToolTip, FormColWidth, GuildInfo){
    return (`
    <div class="input-field col s12 l${FormColWidth}">
        <div class="inputgraphics" id="${entrytitle}" rowcount="0">
            <span class="tooltipped normalspan"  data-position="top" data-tooltip="${ToolTip}">${displaytitle}</span>
            <a style="float:right;" class="waves-effect waves-light btn greenbutton" onclick="AddTeamArrayAt('${entrytitle}', '${PluginName}'); ChangesMade();"><i class="material-icons left">add</i></a>
        </div>
    </div>
    `);
}


function Draw_Roles_Selectable (PluginName, entrytitle, displaytitle, ToolTip, FormColWidth, GuildInfo){
    return(`
        <div class="input-field col s12 l${FormColWidth}">
            <div class="inputgraphics" id="${entrytitle}">
            <span class="tooltipped normalspan"  data-position="top" data-tooltip="${ToolTip}">${displaytitle}</span>
           
                    <select id="${entrytitle}-select" name="Config[${PluginName}][${entrytitle}]" form="config">
                        ${Select_Roles}
                    </select>
            </div>
        </div>
    `);
}


function Draw_Tag_Chooser (PluginName, entrytitle, displaytitle, ToolTip, FormColWidth){

    return(`
        <div class="input-field col s12 l${FormColWidth}">
            <div class="inputgraphics" id="${entrytitle}">
            <span class="tooltipped normalspan"  data-position="top" data-tooltip="${ToolTip}">${displaytitle}</span>

            <input type="text" form="config" name="Config[${PluginName}][${entrytitle}]" id="TagChooser">
        </div>
    `);
}