const nodemailer = require("nodemailer");
const fs = require("fs");

//Mailchimp List id : ce4763d752


async function Send_RefundRequest(Body){


    fs.readFile("./views/emails/RefundRequest.html", "utf-8", (err, refundrequest_htmlcontent)=>{
    
        if(err){console.log(err)}
        else if(refundrequest_htmlcontent){

            var ServerInfo = JSON.parse(Body.ServerInfo);
            var reasonText = Body.reasontext;
            var SelectedReason = Body.Select;

            console.log("ServerInfo");
            console.log(ServerInfo);
            console.log("Reason Text");
            console.log(reasonText);
            console.log("Selected Reason");
            console.log(SelectedReason);

            switch(SelectedReason){
                case 0:
                    SelectMessage = "NO REASON SELECTED"; break;
                case 1:
                    SelectMessage = "14 DAY REFUND"; break;
                case 2:
                    SelectMessage = "NOT SATISFIED ANYMORE"; break;
                case 3:
                    SelectMessage = "TECHNICAL ISSUES"; break;
                case 4: 
                    SelectMessage = "DIDN'T WANTED TO BUY IT"; break;
                case 5:
                    SelectMessage = "NO PARTICULAR REASONS"; break;
            }



            // create reusable transporter object using the default SMTP transport
            var transporter = nodemailer.createTransport({
                host: "ssl0.ovh.net",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                user: process.env.EMAIL_PRIVATE_ADDRESS, // generated ethereal user
                pass: process.env.EMAIL_PRIVATE_PASS // generated ethereal password
                }
            });

            var message_admin = {
                to: 'Quested Refund <support@trystan-sarrade.ovh>',
                from : 'Quested Support <support@trystan-sarrade.ovh>',
                subject : '[REFUND REQUEST] - ' + ServerInfo.PremiumInfo.Buyer_Discord_Name + ' || ' + ServerInfo.PremiumInfo.Price ,

                html: `
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html>
                <head>
                    <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                    <style>
                        table {
                            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
                            border-collapse: collapse;
                            width: 100%;
                        }
                        
                        table td, table th {
                            border: 1px solid #ddd;
                            padding: 8px;
                        }
                        
                        table tr:nth-child(even){background-color: #f2f2f2;}
                        
                        table tr:hover {background-color: #ddd;}
                        
                        table th {
                            padding-top: 12px;
                            padding-bottom: 12px;
                            text-align: left;
                            background-color: #4CAF50;
                            color: white;
                        }
                    </style>
                </head>

                <body>
                <h3> New refund request </h3>


                <table>
                    <tr>
                        <td>Selected Reason</td>
                        <td>Reason Text</td>
                    </tr>
                    
                    <tr>
                        <td>${SelectedReason}</td>
                        <td>${reasonText}</td>
                    </tr>
                </table>

                <table>
                    <tr>
                        <td>Guild</td>
                        <td>GuildID</td>
                        <td>OrderID</td>
                        <td>SubscriptionID</td>
                        <td>Buyer_Discord_Name</td>
                        <td>Buyer_Discord_ID</td>
                        <td>Buyer_Email</td>
                        <td>DayOfPayement</td>
                        <td>Price</td>
                        <td>PremiumPass</td>
                    </tr>

                    <tr>
                        <td>${ServerInfo.GuildName}</td>
                        <td>${ServerInfo.GuildID}</td>
                        <td>${ServerInfo.PremiumInfo.orderID}</td>
                        <td>${ServerInfo.PremiumInfo.SubscriptionID}</td>
                        <td>${ServerInfo.PremiumInfo.Buyer_Discord_Name}</td>
                        <td>${ServerInfo.PremiumInfo.Buyer_Discord_ID}</td>
                        <td>${ServerInfo.PremiumInfo.Buyer_Email}</td>
                        <td>${ServerInfo.PremiumInfo.DayOfPayement}</td>
                        <td>${ServerInfo.PremiumInfo.Price}</td>
                        <td>${ServerInfo.PremiumPass}</td>
                    </tr>
                </table>

                </body>
                </html>   
                `
            }

            


            var message_user = {
                to: ServerInfo.PremiumInfo.Buyer_Discord_Name + ' <' +ServerInfo.PremiumInfo.Buyer_Email + '>',
                from : 'Quested Support <support@trystan-sarrade.ovh>',
                subject : 'Your refund request has been successfully received',
                html : refundrequest_htmlcontent
            }
            
            
            /*transporter.sendMail(message_admin, (error, info)=>{
                if(error){console.log(error);}

                console.log("-- Admin EMAIL Sent --");
                //console.log(info);
                transporter.close();
            })

            transporter.sendMail(message_user, (error, info)=>{
                if(error){console.log(error);}

                console.log("-- User EMAIL sent --");
                //console.log(info);
                transporter.close();
            })*/
        }
    })


    
}
module.exports.Send_RefundRequest = Send_RefundRequest;



async function AdminReport_Cancelation(SubscriptionInfo, ReasonText, SelectableReasonMSG){

    console.log(SubscriptionInfo);
    var transporter = nodemailer.createTransport({
        host: "ssl0.ovh.net",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
        user: process.env.EMAIL_PRIVATE_ADDRESS, // generated ethereal user
        pass: process.env.EMAIL_PRIVATE_PASS // generated ethereal password
        }
    });

    var message_admin = {
        to: 'Quested Cancelation <support@trystan-sarrade.ovh>',
        from : 'Quested Cancelation <support@trystan-sarrade.ovh>',
        subject : '[CANCELATION REPORT] - ' + SubscriptionInfo.PremiumInfo.Buyer_Discord_Name + ' || ' + SubscriptionInfo.PremiumInfo.Price ,

        html: `
                <p>
                    Reason : ${SelectableReasonMSG} <br>
                    MoreInfo : ${ReasonText} <br>
                    <br>
                    GuildName : ${SubscriptionInfo.GuildName} <br>
                    BuyerEmail : ${SubscriptionInfo.PremiumInfo.Buyer_Email} <br>
                    BuyerName : ${SubscriptionInfo.PremiumInfo.Buyer_Discord_Name} <br>
                    BuyerID : ${SubscriptionInfo.PremiumInfo.Buyer_Discord_ID} <br>
                    Price : ${SubscriptionInfo.PremiumInfo.Price} <br>
                    

                </p>`
    }

    /*transporter.sendMail(message_admin, (error, info)=>{
        if(error){console.log(error);}

        console.log("-- Admin EMAIL Sent --");
        //console.log(info);
        transporter.close();
    })*/


    fs.readFile("./views/emails/CancelationConfirmation.html", "utf-8", (err, cancelationconfirmation_htmlcontent)=>{
        var message_user = {
            to: `${SubscriptionInfo.PremiumInfo.Buyer_Discord_Name} <${SubscriptionInfo.PremiumInfo.Buyer_Email}>`,
            from : 'Quested Cancelation <support@trystan-sarrade.ovh>',
            subject : SubscriptionInfo.PremiumInfo.Buyer_Discord_Name + ', Your Quested subscription has been sucessfully canceled',
    
            html: cancelationconfirmation_htmlcontent
        }
        /*transporter.sendMail(message_user, (error, info)=>{
            if(error){console.log(error);}
            console.log("-- User sent --");
            //console.log(info);
            transporter.close();
        })*/
    })
}
module.exports.AdminReport_Cancelation = AdminReport_Cancelation;