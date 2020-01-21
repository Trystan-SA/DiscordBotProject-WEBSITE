const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('./API/Console');

const express = require('express');
const helmet = require('helmet');
const app = express();
const session = require('express-session');
const MysqlStore = require('express-mysql-session')(session);
const fs = require('fs');
const bodyParser = require('body-parser')
const mysql = require('./API/Mysql');
const mailer = require('./API/Mailer');
const flash = require('connect-flash');
const cookieparser = require('cookie-parser');

//Import Entity//
Entity = {}
require('./Entity');


//Moteur de template//
app.set('view engine', 'ejs');


var StoreOptions= { 
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user:  process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: "express_session_store",
    clearExpired: true, //Will destroy expired session//
    checkExpirationInterval: 7200000, //Check expired session Every 2 hours (7 200 000 milliseconds)//
    expiration: 2419200000, //Time a session will stay valid : 4 weeks (2 419 200 000 milliseconds)//
    createDatabaseTable: true,
    connectionLimit: 5,
    endConnectionOnClose: true,
    charset: 'utf8mb4'
};
var sessionStore = new MysqlStore(StoreOptions);


//Mysql session store//
function BootMysqlSession(){
    return new Promise((resolve, reject)=>{
        var connection_Quested = require('./API/Mysql').connection_Quested;
        connection_Quested.getConnection(function(err, connection){
            if(err){reject('MYSQL SERVER DOWN');}
            else { 
                resolve("BootMysql done");
            }
        })
    })
}
BootMysqlSession().then((Resolve)=>{}).catch((err)=>{console.critical(err)})


//MiddleWare //
app.use(helmet());
app.use(express.static('public'))
app.use(cookieparser('4f74z87zfkblakxnb87e2'))
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json())



/** If session down, tell that the whole service is down */
async function ServicesDown(req, res, next){
    if(!req.session){
        BootMysqlSession()
        .then(function(done){
            next();
        })
        .catch(function(err){
            console.critical("MYSQL SERVICES DOWN");
            res.render('pages/servicesDown');  
        })
    }
}
app.use(ServicesDown);


/** Handle in case session can't connect to Mysql server */
app.use(session({
    resave: false, 
    saveUninitialized: false, 
    secret: 'p4JxzmDxBGdTS4PqgTg0iyVrdzTQBicttJ3bu97fSC', 
    store: sessionStore,
    unset : 'destroy',
    cookie: { 
        maxAge: 2419200000, 
        secure : false, //TODO : Set that to true in production
        httpOnly: false //TODO : Set that to true in production
    }
}));

app.use(flash());
function FlashMessage(req, res, next){
    res.locals.MessageInfo = req.flash('Info');
    res.locals.MessageError = req.flash('Error');
    res.locals.MessageSuccess = req.flash('Success');
    next();
}
app.use(FlashMessage);




//Import Controllers//
const Authentification = require('./Controller/Authentification');
app.use(Authentification);

const Dashboard_CTRLR = require('./Controller/Dashboard_CTRLR');
app.use(Dashboard_CTRLR);

const Paypal_CTRLR = require('./Controller/Paypal_CTRLR');
app.use(Paypal_CTRLR);

const Blog_CTRLR = require('./Controller/Blog_CTRLR');
app.use(Blog_CTRLR);

const FeedBack_CTRLR = require('./Controller/Feedback_CTRLR');
app.use(FeedBack_CTRLR);

const Support_CTRLR = require('./Controller/Support_CTRLR');
app.use(Support_CTRLR);


//Users will be redirected here if an error occure with routes//
var ErrorPage = "pages/404"; 
var ErrorMessage = 'An error occured : Can\'t find the page due to incorrect routing. Please contact me at trystansarrade@gmail.com !';








app.get('/', (request, response) => { 
    Authentification.IsLogged(request, response)
    .then(function(resolve, reject){
        if(resolve){ //If the user is logged//
            response.render("pages/index"),{},

            function(err){
                if(err){
                    console.error(err.message);
                    response.render(ErrorPage, {errormsg: ErrorMessage});
                }
            };
        }

        else { //If the user is offline//
            response.render("pages/index"), 
            { },
            function(err){
                if(err){
                    console.error(err.message);
                    response.render(ErrorPage, {errormsg: ErrorMessage});
                }
            };
        }
    })
    .catch(function(err){
        console.error(err);
        response.render("pages/index"),{},
        function(err){
            if(err){
                console.error(err.message);
                response.render(ErrorPage, {errormsg: ErrorMessage});
            }
        };
    })
})



app.get('/about_me', (request, response)=>{
    Authentification.IsLogged(request, response)
    .then(function(result){
        response.render("pages/aboutme"),{},
        function(err){if(err){response.render(ErrorPage, {errormsg: ErrorMessage});}};
    })
})



app.get('/FAQ&Guides', (request, response)=>{
    Authentification.IsLogged(request, response)
    .then(function(result){
        response.render("pages/FAQ&Guides"),{},
        function(err){if(err){response.render(ErrorPage, {errormsg: ErrorMessage});}};
    })
})



//Admin Panel//
app.get("/adminpanel", (req, res) =>{
    Authentification.IsLogged(req, res)
    .then(function(resolve){
        if(res.locals.Owner.DiscordOauth['id'] === '106034269914144768'){
            res.render('pages/adminpanel');
        }
    })
});



app.get("/adminpanel/updatedb", (req, res) => {
   mysql.Update_Missing_PluginData_Fields()
   .then(function(result){console.log(result); res.redirect('/adminpanel');})
   .catch(function(err){console.error(err); res.redirect('/adminpanel');})
});




//Run the Daily premium verification when triggerring this.
app.get('/adminpanel/LaunchPremiumDailyVerification', function(req, res){
    PaypalAPI.GuildVerification();
    res.redirect('/adminpanel');
})



app.get('/adminpanel/TestingEmail', function(req, res){
    mailer.Send_RefundRequest();
    res.redirect('/adminpanel');
})



app.post('/adminpanel/CancelAndRefund', function(req, res){
    PaypalAPI.RefundAndCancelSubscription(req.body.SubscriptionID)
    .then(function(result){
        res.redirect('/adminpanel');
    })
    .catch(function(err){console.error(err)})
})





app.get('/meta/logo', function(request, response){
    response.sendFile(__dirname + "/public/images/meta/QuestedLogo.jpg");
})



app.get('/404', function(request, response){
    response.render(ErrorPage, {errormsg: "404 - Page not found"});
});



app.use(function(req, res, next){
    res.redirect('/404');
});



app.listen(8080, () =>{
    console.info('Running Web Server');
});
