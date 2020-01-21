var LoadingRange = 0;
PluginData = PluginData.PluginsConfig.Feedback;
var Color_Category = ["#16a085", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#f1c40f", "#e67e22", "#e74c3c", "#95a5a6"];
var PluginMap = new Map();
var Tickets_Data = new Map();
for(i=0; i<PluginData.length; i++){
    PluginMap.set(PluginData[i][0], PluginData[i][1]);
}


//LAST SELECTED TICKED ID//
var TicketID = "";

//Used for the ASC or DESC expression of loading tickets query//
var ShortBy = "Date";
var AscOrDesc = "DESC";
var ShowStatus = "";
var ShowTag = "";
var Archived = false;
var ScrolledDown_Load = false;



M.AutoInit();
$(document).ready(function(){ 
    //Initialize the options of the selectable input inside the "Suggest something" pannel//
    for(i=0; i < PluginMap.get('CategoryChoosed').length; i++){
        var Elem = PluginMap.get('CategoryChoosed')[i];
        if(Elem){
            $('#categoryselect').append(`<option style="color: ${Color_Category[i]}" value=${i}> ${Elem} </option>`)
            $('#Tag_Change').append(`<span onclick="UpdateTicketTag('${i}')" style="background-color:${Color_Category[i]}" class="Pastille" id="${i}">${Elem}</span>`)
            $('#Shorter_Tag').find('form').append(`
                <label><input onclick="ShortBy_Function(undefined , undefined,'${i}')" name="group_status" type="radio"/><span style="color:${Color_Category[i]}">${Elem}</span></label><br>
            `);
        }
    }
    ChangeMainSelectColor($('#categoryselect'));

    if(LoadingTicket){
        InspectTicket(LoadingTicket);
    }
    else {
        var URL = new String(window.location.pathname);
        URL = URL.split('/');
        if(URL.length > 3){
            URL.pop();
            URL = URL.join();
            URL = URL.replace(/,/g, '/');
            window.history.pushState(null, null, URL);
        }
    }
    
    LoadTickets();
})



$('#categoryselect').on('change', function(event){ChangeMainSelectColor(event.target);})
//Change the color of the selected Category (from the "Create ticket" panel) depending of the color of the selected option//
function ChangeMainSelectColor(target){
    $(target).css('color', Color_Category[$(target).val()]);
}  
   


$(window).on("scroll", function() {
	var scrollHeight = $(document).height();
	var scrollPosition = $(window).height() + $(window).scrollTop();
	if ((scrollHeight - scrollPosition) / scrollHeight === 0) {

        if(ScrolledDown_Load === false){
          
            ScrolledDown_Load = true;
            $('.TicketContent').append(`
                <div id="LoadedTicket" class="progress">
                    <div class="indeterminate"></div>
                </div>
            `);
            LoadTickets();
        }
	}
});



function LoadTickets(){
    
    var URL = window.location.href.split('/');
    if(URL[5] != undefined){URL.pop();}
    URL = URL.join();
    URL = URL.replace(/,/g, '/')
    URL = URL + '/load';
    URL = URL.replace(/\/\//g, "/").replace(/http:/g, 'http://');

    $.ajax({
        url : URL +`?ShortBy=${ShortBy}&AscOrDesc=${AscOrDesc}&Startof=${LoadingRange}&Archived=${Archived}&ShowStatus=${ShowStatus}&ShowTag=${ShowTag}`
    })
    .done(function(msg){
        if(msg === undefined){
            $('#loader').hide(400, function(){$('#loader').remove();});
            $('.TicketContent').append(`
                <div id="NoMoreTicketFound" class="swing-in-top-fwd">
                    <img style="display: block; margin-top:75px; margin-left:auto; margin-right:auto; width:75px; " src="/images/icons/NoMoreTickets.png">
                    <div style="margin-top:25px;> 
                        <span id="sorrytext" class="center-align">No more tickets. </span> 
                    </div>
                </div>
            `);
        }

        else {
            LoadingRange = LoadingRange + msg.length
            DrawTickets(msg);
            ScrolledDown_Load = false;
        }
    })
}



function DrawTickets(Tickets){

    $('#loader').hide(400);
    $('#LoadedTicket').hide(400, function(){$('#LoadedTicket').remove();});
    var CategoryChoosed = PluginMap.get('CategoryChoosed');

    for(i=0; i<Tickets.length; i++){

        Tickets_Data.set(Tickets[i].ID, Tickets[i]);
        var CategoryID = Number(Tickets[i].Category);
        var ColorCode = Color_Category[CategoryID];
        var CategoryTitle = CategoryChoosed[CategoryID];
        var AuthorName = Tickets[i].AuthorName;
        var Description = Tickets[i].Description;
        var Title = Tickets[i].Title;
        var Score = Tickets[i].Score;
        

        var PostDate = "";
        var PostDateOBJ = new Date(Tickets[i].PostDate);
        var Month = PostDateOBJ.getMonth();
        if(Month < 10){Month = "0" + Month}
        var Day = PostDateOBJ.getDate();
        if(Day < 10){Day = "0" + Day}
        PostDate = Day + "/" + Month + "/" + PostDateOBJ.getFullYear();

        //Set the color of the Status//
        var ColorStatus = Set_ColorStatus_Variables(Tickets[i])


        var TicketElem = $(`
        <div class="Ticket z-depth-2 row swing-in-top-fwd" TicketID="${Tickets[i].ID}">
            <div class="col s9">
                <div class="category" id="CardStatus" style="background-color:${ColorStatus.DisplayColor};"> 
                    <span style="color:#ffffff">${ColorStatus.DisplayText}</span>
                </div>
                
                <br><br>
                <h1>${Title}</h1> 
                <span>${AuthorName}</span> <span style="padding:0px 5px;">-</span>  <span>${PostDate} </span> <span style="padding:0px 5px;">-</span>

                <div class="Category_Bottom"> 
                    <span style="color:${ColorCode}">${CategoryTitle}</span>
                </div>      

                <div id="INFO" style="display:none">
                ${Description}
                </div>      

            </div>
            <div class="col s3 right-align upvote">
                <a id="upvote" class="waves-effect waves-blue btn"><i id="upvote_i" class="material-icons left">keyboard_arrow_up</i> <score id="upvote_i">${Score}</score></a>          
            </div>
        </div>
        `).appendTo('.TicketContent');

        if(Tickets[i].Archived === 1){
            $(TicketElem).css('filter', 'opacity(40%)')
        }

        Upvote_Init(TicketElem, Score, Tickets[i].ID);
        ScrolledDown_Load = false;
    }
}



function DeleteTickets(){
    $('#NoMoreTicketFound').remove();
    LoadingRange = 0;
    var LoaderAdded = false;
    var DeleteTickets = $('div .TicketContent').find('.Ticket')
    $(DeleteTickets).hide(0, function(){
        $(DeleteTickets).remove();

        if(LoaderAdded === false){
            LoaderAdded = true;
            $('#loader').show(400);
        }
    })
}



//Upvote system init//
function Upvote_Init(TicketElem, Score, ID){
    var Info = Tickets_Data.get(ID);
    var UpvoteInfo = window.localStorage.getItem(Info.ID + "-" + GuildID);

    if(UpvoteInfo != null){
        var Upvote = $(TicketElem).find('#upvote');
        $(Upvote).css('background-color', 'var(--green)');
        $(Upvote).find('score').html(Info.Score);
    }
}



/** Inspect a Ticket by the Given Ticket Object */
function InspectTicket(TicketObject){
    TicketID = TicketObject.ID
    var Category_Config = PluginMap.get('CategoryChoosed');
    var ProfilePictureLink = "";
    var ColorStatus = Set_ColorStatus_Variables(TicketObject);

    if(TicketObject.AuthorAvatar){var ProfilePictureLink = "https://cdn.discordapp.com/avatars/" + TicketObject.AuthorID + "/" + TicketObject.AuthorAvatar + ".png";
    } else { ProfilePictureLink = "../../images/unknown-user.png"}

    $(TicketPanel).find('#Title').html(TicketObject.Title);
    $(TicketPanel).find('#AuthorName').html(TicketObject.AuthorName);
    $(TicketPanel).find('#Description').html(TicketObject.Description);
    $(TicketPanel).find('#UserProfile').attr('src', ProfilePictureLink);
    $(TicketPanel).find('#Category_Text').css('color', Color_Category[TicketObject.Category]).html(Category_Config[TicketObject.Category]);
    $(TicketPanel).find('#CardStatus').css('background-color', ColorStatus.DisplayColor);
    $(TicketPanel).find('#CardStatus span').css('color', ColorStatus.DisplayColor).html(ColorStatus.DisplayText);
    $(TicketPanel).show(0);

    $('#Status_Change .Pastille').css("opacity", "0.30");
    $(`#Status_Change #Status_${TicketObject.Status}`).css("opacity", "1");

    var ArchiveTicketButton = $('#ArchiveTicket')
    if(TicketObject.Archived == 1){
        $(ArchiveTicketButton).html("Unarchive Feedback").css('opacity', 0.5)
        TicketObject.Archived = 1;
    }
    else {
        $(ArchiveTicketButton).html("Archive Feedback").css('opacity', 1)
        TicketObject.Archived = 0;
    }

    //Add postdate//
    var PostDate = "";
    var PostDateOBJ = new Date(TicketObject.PostDate);
    var Month = PostDateOBJ.getMonth();
    if(Month < 10){Month = "0" + Month}
    var Day = PostDateOBJ.getDate();
    if(Day < 10){Day = "0" + Day}
    PostDate = Day + "/" + Month + "/" + PostDateOBJ.getFullYear();
    $(TicketPanel).find('#PostDate').html(PostDate);


    //Style of Tag changer pastelle//
    var TagChanger = $('#Tag_Change span')
    for(i=0; i<TagChanger.length; i++){
        if($(TagChanger[i]).attr('id') != TicketObject.Category){
            $(TagChanger[i]).css('opacity', '0.3')
        }
    }


    //Display Delete Ticket button if Owner or User author of ticket//
    $('#EditableTicket').hide();

    if(Oauth && TicketObject){
        if(Oauth.id == TicketObject.AuthorID){
            $('#EditableTicket').show(200);
        }
    }
    



    //Initialize the Comments section if the comments are enabled//
    if(PluginMap.get('AllowComments') === 'true'){     
        var StringifiedInfo = JSON.stringify(TicketObject).replace(/'/g, "&#39;");
        var StringifiedOauth = JSON.stringify(Oauth);
        
        $('#Comment_Posting').html(`
            <form method="post" action="/feedback/postcomment" id="CommentPost" style="margin:50px 15px 25px;">
                <label>Write your comment...</label>
                <textarea class="materialize-textarea" type="text" name="comment" required minlength="5" maxlength="1000" autocomplete="off"></textarea>
                <div style="display:none"><input type="text" name="Token" value="${Encrypted}"></div>
                <div style="display:none"><input type="text" name="TicketInfo" value='${StringifiedInfo}'></div>
                <div style="display:none"><input type="text" name="Oauth" value='${StringifiedOauth}'></div>
                <p style="color:#919191; font-size:0.9em">By publishing a Comment. You agree that your Username and your Profile picture will be shared on this page publicly.</p>
                <br>
                <input class="submit" type="submit" value="Publish Comment">
            </form>

            <div id="CommentsClosedInfo" class="center" style="padding-top:25px;"> 
                Comments Are closed 
                <img src="../../images/Icons/CommentClosed.png" style="display:block; margin-left:auto; margin-right:auto; width:75px; margin-top:25px; margin-bottom:25px;">
            </div>
            
        `);
        
        if(TicketObject.CommentOpen == 0){
            $('#CommentsClosedInfo ').show();
            $('#Comment_Posting form').hide();
        }
        else { 
            $('#CommentsClosedInfo ').hide();
            $('#Comment_Posting form').show();
        }
            
        Draw_Comments_Area(TicketID, TicketObject);
    }
    else {
        $('#Comment_Posting').parent().hide();
    }
}





function DeleteTicket(){
    $('#DeleteTicketConfirm').show();
}

function ConfirmedDeleteTicket(){
    $.ajax({
        url : window.location.href + `/DeleteTicket?TicketID=${TicketID}&Encrypted=${Encrypted}`
    })
    .done(function(msg){
        DeleteTickets();
        LoadTickets();
        $('#TicketPanel').hide(400);
        M.toast({html: 'Ticket Deleted'})

        var URL = new String(window.location.pathname);
        URL = URL.split('/');
        URL.pop();
        URL = URL.join();
        URL = URL.replace(/,/g, '/');
        window.history.pushState(null, null, URL);
    })
}







//On Ticket Clicked
$('.TicketContent').on('click', '.Ticket', function(event){
    //Upvote or Downvote the ticket//
    if($(event.target)[0].id == "upvote" || $(event.target)[0].id == "upvote_i"){
        var Upvote  = $(event.target).closest("#upvote");
        var Ticket = $(event.target).closest(".Ticket");
        TicketID = $(Ticket).attr('ticketid');
        TicketID = Number(TicketID);
        var Info = Tickets_Data.get(TicketID);
        var UpvoteInfo = window.localStorage.getItem(Info.ID + "-" + GuildID);
        var Score = $(Upvote).find('score')
        
        if(UpvoteInfo == null){
            window.localStorage.setItem(Info.ID + "-" + GuildID, ""); 
            $.post("./upvote", {'TicketID' : Info.ID, 'GuildID' : GuildID}, function(data, status){})
            $(Upvote).css('background-color', 'var(--green)');
            $(Score).html(parseInt(Score.text()) + 1)
        }
        else {
            window.localStorage.removeItem(Info.ID + "-" + GuildID);
            $.post("./downvote", {'TicketID' : Info.ID, 'GuildID' : GuildID}, function(data, status){})
            $(Upvote).css('background-color', 'var(--grey)');
            $(Score).html(parseInt(Score.text()) - 1)
        }
    }

    //Open Ticket Panel//
    else { 
        var Ticket = $(event.target).closest(".Ticket");
        TicketID = $(Ticket).attr('ticketid');
        TicketID = Number(TicketID); 

        if(window.location.href.slice(window.location.href.length - 1) == '/'){window.history.pushState(null, null, window.location.pathname + TicketID)}
        else {window.history.pushState(null, null, window.location.pathname + '/' + TicketID)}
        InspectTicket(Tickets_Data.get(TicketID))
    }
})



//When the Admin press a pastille, will update the ticket status to the clicked pastille status//
function UpdateTicketStatus(StatusString){
    var ticketid = TicketID;
    $.ajax({
        url : window.location.href + `/updatestatus?statusstring=${StatusString}&ticketid=${ticketid}&encrypted=${Encrypted}`
    })
    .done(function(msg){
        //Received server response//
        Tickets_Data.get(TicketID).Status = StatusString;
        $('#Status_Change .Pastille').css("opacity", "0.30");
        $(`#Status_Change #Status_${StatusString}`).css("opacity", "1");
        var ColorStatus = Set_ColorStatus_Variables(Tickets_Data.get(ticketid));
        var Ticketidelem = $(`.Ticket[ticketid=${ticketid}]`);
        $(Ticketidelem).find('#CardStatus').css('background-color', ColorStatus.DisplayColor).html(ColorStatus.DisplayText).css('color', '#fffff')

        $('#TicketPanel #CardStatus span').html(ColorStatus.DisplayText);
        $('#TicketPanel #CardStatus').css('background-color', ColorStatus.DisplayColor)
    })
}


function UpdateTicketTag(TagInt){
    var ticketid = TicketID;
    $.ajax({
        url : window.location.href + `/updatetag?tagint=${TagInt}&ticketid=${ticketid}&encrypted=${Encrypted}`
    })
    .done(function(msg){
        Tickets_Data.get(TicketID).Category = TagInt;
        $('#Tag_Change .Pastille').css("opacity", "0.30");
        $(`#Tag_Change #${TagInt}`).css("opacity", "1");
        var ColorStatus = Set_ColorStatus_Variables(Tickets_Data.get(ticketid));
        var Ticketidelem = $(`.Ticket[ticketid=${ticketid}]`);
        $(Ticketidelem).find('.Category_Bottom').html(PluginData[4][1][TagInt]).css('color', Color_Category[TagInt])

        $('#Category_Text').html(PluginData[4][1][TagInt]).css('color', Color_Category[TagInt])
    })
}


function ShowArchivedFunc(){
    $('#NoMoreTicketFound').hide(400, function(){$('#NoMoreTicketFound').remove();});

    if(Archived){ 
        Archived = false;
        $('#ShowArchived').css('color', '#757575');
        DeleteTickets()
        LoadTickets();
    }
    else {
        Archived = true;
        $('#ShowArchived').css('color', '#e2e2e2');
        DeleteTickets()
        LoadTickets();
    }
}



/** On "Archive Ticket" button clicked, Switch between Archive and Unarchive status of the ticket */
function ArchiveTicket(){
    var ticketid = TicketID;
    var ArchivedBool = 0;
    if(Tickets_Data.get(ticketid).Archived === 0){ArchivedBool = 1;}
   
    $.ajax({
        url : window.location.href + `/ArchiveTicket?ArchiveBool=${ArchivedBool}&ticketid=${ticketid}&encrypted=${Encrypted}`
    })
    .done(function(msg){
        var ArchiveTicketButton = $('#ArchiveTicket')
        if(ArchivedBool == 1){
            $(ArchiveTicketButton).html("Unarchive Feedback").css('opacity', 0.5)
            Tickets_Data.get(ticketid).Archived = 1;
            M.toast({html: 'The selected Feedback is now Archived.'})
        }
        else {
            $(ArchiveTicketButton).html("Archive Feedback").css('opacity', 1)
            Tickets_Data.get(ticketid).Archived = 0;
            M.toast({html: 'The selected Feedback is now Visible again.'})
        }
    })

    DeleteTickets();
    LoadTickets();
}


//Store in a variable the "Switch" state of the ShortBy options//
//False means short by DESC, True means short by ASC//
//At start, everything is false, but not active, the first click will load the desired expession by ASC first//
function ShortBy_Function(Shortby_Expression,  ShowOnlyStatus_Expression, ShowOnlyTag_Expression){
    ScrolledDown_Load = false;
    if(Shortby_Expression != undefined){ShortBy = Shortby_Expression}
    if(ShowOnlyStatus_Expression != undefined){ShowStatus = ShowOnlyStatus_Expression}
    if(ShowOnlyTag_Expression != undefined){ShowTag = ShowOnlyTag_Expression}
    DeleteTickets();


    $('#Showby_Tag').html('Tag');
    $('#Showby_Status').html('Status');
    $('#Showby_Date').html('Date');
    $('#Showby_Upvotes').html('Upvotes');


    //Color of Status Text//
    if(ShowStatus == "none"){ $('#Showby_Status').css('color', '#e0e0e0')}
    if(ShowStatus == "default"){ $('#Showby_Status').css('color', '#7f8c8d')}
    if(ShowStatus == "declined"){ $('#Showby_Status').css('color', '#e74c3c')}
    if(ShowStatus == "selected"){ $('#Showby_Status').css('color', '#3498db')}
    if(ShowStatus == "inprogress"){ $('#Showby_Status').css('color', '#e67e22')}
    if(ShowStatus == "completed"){ $('#Showby_Status').css('color', '#27ae60')}


    if(Shortby_Expression){
        if (ShortBy === "Date"){
            if(AscOrDesc == "ASC"){
                AscOrDesc = "DESC";
                $('#Showby_Date').html('Date <i class="material-icons">keyboard_arrow_down</i>');
            }
            else { 
                AscOrDesc = "ASC";
                $('#Showby_Date').html('Date <i class="material-icons">keyboard_arrow_up</i>');
            }
        }

        else if (ShortBy === "Upvotes"){
            if(AscOrDesc == "ASC"){
                AscOrDesc = "DESC";
                $('#Showby_Upvotes').html('Upvotes <i class="material-icons">keyboard_arrow_down</i>');
            }
            else {
                AscOrDesc = "ASC";
                $('#Showby_Upvotes').html('Upvotes <i class="material-icons">keyboard_arrow_up</i>');
            }
        }
    }


    LoadTickets();
}



function CloseComments() {
    var ticketid = TicketID;
    var CloseBool = 0;
    console.warn(Tickets_Data.get(ticketid).CommentOpen)
    if(Tickets_Data.get(ticketid).CommentOpen === 0){CloseBool = 1;}
   
    $.ajax({
        url : window.location.href + `/CloseComment?CloseBool=${CloseBool}&ticketid=${ticketid}&encrypted=${Encrypted}`
    })
    .done(function(msg){
        if(CloseBool == 1){
            Tickets_Data.get(ticketid).CommentOpen = 1;
            M.toast({html: 'Comments are openned'})
            $('#Comment_Posting form').show(400);
            $('#CommentsClosedInfo').hide(400);
        }
        else {
            Tickets_Data.get(ticketid).CommentOpen = 0;
            M.toast({html: 'Comments are closed'})
            $('#Comment_Posting form').hide(400);
            $('#CommentsClosedInfo').show(400);
        }
    })
}


//Modal Close//
var modal = document.getElementById('TicketPanel');
$('#TicketPanel').on("click", function(event){CloseModal(event);})
function CloseModal(event){if(event.target === modal || event.target == "CloseSpanModal"){
    $('#TicketPanel').hide(100);
    var URL = new String(window.location.pathname);
    URL = URL.split('/');
    URL.pop();
    URL = URL.join();
    URL = URL.replace(/,/g, '/');

    window.history.pushState(null, null, URL);
}}

var modal2 = document.getElementById('DeleteTicketConfirm');
function CloseModal2(event){if(event.target === modal2 || event.target == "CloseSpanModal2"){
    $('#DeleteTicketConfirm').hide(100);
}}



//Give the ColorStatus.DisplayText and ColorStatus.DisplayColor depending on the status text given//
function Set_ColorStatus_Variables(TicketsI){
    var ColorStatus_Array = ["#7f8c8d", "#e74c3c", "#3498db", "#e67e22", "#27ae60"]
    var ColorStatus = TicketsI.Status
    var ColorStatus_TextDisplay = ''
    var ColorStatus_ID = 0;


    switch(ColorStatus){
        case 'default' :
            ColorStatus_ID = 0;
            ColorStatus_TextDisplay = "Pending";
        break;
        case 'declined' : 
            ColorStatus_ID = 1;
            ColorStatus_TextDisplay = "Declined";
        break;
        case 'selected' :
            ColorStatus_ID = 2;
            ColorStatus_TextDisplay = "Selected";
        break;
        case 'inprogress' : 
            ColorStatus_ID = 3;
            ColorStatus_TextDisplay = "In Progress";
        break;
        case 'completed' :
            ColorStatus_ID = 4;
            ColorStatus_TextDisplay = "Completed";
        break;
    }
    var ColorStatus_Code = ColorStatus_Array[ColorStatus_ID];

    var Returned = {
        'DisplayText' : ColorStatus_TextDisplay,
        'DisplayColor' : ColorStatus_Code
    }
    return Returned;
}






function Draw_Comments_Area(TicketID, Info){
    
  
    $('#CommentArea').html(`
    <div class="progress">
        <div class="indeterminate"></div>
    </div>
    `)

    var URL = window.location.href.split('/');
    if(URL[6] != undefined){URL.pop();}
    URL = URL.join();
    URL = URL.replace(/,/g, '/')
    URL = URL + '/loadcomments';

    $.ajax({
        url : URL
    })
    .done(function(Comments){
        $('#CommentArea').html("");

        if(Comments){
            for(i=0; i < Comments.length; i++){
                //Get Profile picture//
                var ProfilePictureLink = "../../images/unknown-user.png"
                if(Comments[i].AuthorAvatar){ProfilePictureLink = "https://cdn.discordapp.com/avatars/" + Comments[i].AuthorID + "/" + Comments[i].AuthorAvatar + ".png";}


                //Get Date//
                var PostDate = "";
                var PostDateOBJ = new Date(Comments[i].PostDate);
                var Month = PostDateOBJ.getMonth();
                if(Month < 10){Month = "0" + Month}
                var Day = PostDateOBJ.getDate();
                if(Day < 10){Day = "0" + Day}
                PostDate = Day + "/" + Month + "/" + PostDateOBJ.getFullYear();
                $(TicketPanel).find('#PostDate').html(PostDate);
    

                $('#CommentArea').append(`
                    <div class="comment row">
                        <div class="col s1">
                            <img id="UserProfile" class="circle profilepicture" style="float:right !important; width:45px" src="${ProfilePictureLink}">
                        </div>

                        <div class="col s11">
                            <p>${Comments[i].Text}</p>
                            <span style="color:rgb(167, 167, 167)">${Comments[i].AuthorName} - ${PostDate} </span>
                        </div>
                    </div>
                `);
            }
        }
        else { 
            $('#CommentArea').html("<p style='margin-top:15px; text-align: center;'> No comments posted... </p>")
        }
    })
}