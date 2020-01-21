const express = require('express');
const app = module.exports = express();
const Authentification = require('./Authentification');
const blog_config = require('../API/configuration_files/blog-config');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const ThisAdress = process.env.THIS_ADRESSE;


//MIDDLEWARE//
var jsonParser = bodyParser.json()


app.get('/bloger/writearticle', (request, response) => {
    Authentification.IsLogged(request, response)
    .then(function(result){
        if(response.locals.OwnerData.oauth.id == "106034269914144768"){  
            response.locals.blogconfig = JSON.stringify(blog_config.blog_config);

            if(request.query.EditID != undefined){
                connection_blog.query(`SELECT * FROM articles WHERE ID=${request.query.EditID}`, function(err, result, fields){
                    if(err){console.log(err)}
                    else if (result){response.locals.Edit = result;}
                    LoadContinue();
                })
            }
            else {LoadContinue();}

            function LoadContinue(){
                LoadArticles('ifzpeiUDiudjelzkej154687564')
                .then(function(Articles){
                    response.locals.Articles = Articles;
                    response.render("pages/blog/writearticle"),{},
                    function(err){
                        if(err){
                            console.log("["+err.name+"] " + err.message);
                            res.render(ErrorPage, {errormsg: ErrorMessage});
                        }
                    }
                })
                .catch(function(err){
                    console.log(err);
                    response.render("pages/blog/writearticle"),{},
                    function(err){
                        if(err){
                            console.log("["+err.name+"] " + err.message);
                            res.render(ErrorPage, {errormsg: ErrorMessage});
                        }
                    }
                })
            }
        }
        else { response.redirect('/404'); }
    })
    .catch(function(err){response.redirect('/404');})
});


app.post('/bloger/publish', jsonParser, function(request, response){
    Authentification.IsLogged(request, response)
    .then(function(result){
        if(response.locals.oauth.id == "106034269914144768"){

            var Form = request.body;
    
            if(Form.publish == "edit"){ //Need to modify the article only//
                var ImageName = Form.ArticleTitle.replace(/[^a-zA-Z ]/g, "")
                                                 .replace(/\s+/g, "_");
                var ArticleDate = GetDate();


                Form.Markdown = Form.Markdown.replace(/'/g, "''")

                var SQL = `UPDATE articles SET lastmodified_date = STR_TO_DATE("${ArticleDate}", '%d-%m-%Y'), Title = '${Form.ArticleTitle}', Description = '${Form.ArticleDescription}', Content = '${Form.Markdown}' , Category = '${Form.Category}', ImagePath = '${ImageName}' WHERE ID=${Form.ID};`
                connection_blog.query(SQL, function(err, result, fields){
                    if(err){console.log(err);}
                    else if (result){
                        response.redirect("/blog");
                    }
                })
            }
            else { //Need to create a new Article//
                if(Form.publish == "save"){Form.Status = "Draft";}
                else if(Form.publish == "publish"){Form.Status = "Published";}


                Mysql_PostArticle(Form)
                .then(function(result){response.redirect("/blog");})
                .catch(function(err){console.log(err); response.status(501); response.end();});
            }
        }
        else { response.redirect('/404'); }
    })
    .catch(function(err){console.log(err); response.redirect('/404');})
})


app.get('/bloger/publish', function(request, response){
    Authentification.IsLogged(request, response)
    .then(function(result){
        if(response.locals.OwnerData.oauth.id == "106034269914144768"){
            var Value = request.query.value;
            var ID = request.query.ID;
            if(Value == 'true'){
                connection_blog.query(`UPDATE articles SET Status = 'Published' WHERE ID='${ID}'`, function(err, result, fields){
                    if(err){console.log(err);}
                    else if(result){response.redirect('/bloger/writearticle');}
                });
            }
            else if (Value == 'false'){
                connection_blog.query(`UPDATE articles SET Status = 'Draft' WHERE ID='${ID}'`, function(err, result, fields){
                    if(err){console.log(err)}
                    else if(result){response.redirect('/bloger/writearticle');}
                });
            }
        }
        else { response.redirect('/404'); }
    })
    .catch(function(err){
        response.redirect('/404');
    })
})

app.get('/bloger/article_not_found', (request, response)=>{
    Authentification.IsLogged(request, response)
    
    response.render('pages/blog/articlenotfound');
})







app.get(['/blog' ,'/blog/:Category/', '/blog/:Category/:Article'], function(request, response) { 
    Authentification.IsLogged(request, response)
    .then(function(OwnerData){
    
        //Breadcrumb generator//
        BreadCrumbGenerator(request.params.Category, request.params.Article)
        .then(function(resolve){response.locals.Breadcrumb = resolve})
        .catch(function(err){console.log(err)})

        response.locals.query = undefined;
        if(request.params.Category){response.locals.query = request.params.Category} //The Category parameter that can be found inside the URL after the /blog/ address//

        response.locals.Categories = blog_config.blog_config.Categories; //Every data about the Categories//

        response.locals.articleread = undefined;
        if((request.params.Article != "favicon.png") && (request.params.Article != undefined)){

            response.locals.articleread = request.params.Article
            var ArticleToRead = decodeURI(request.params.Article);
            ReadArticle(ArticleToRead)
            .then(function(ArticleToRead){
                response.locals.ArticleToRead = ArticleToRead;

                ArticleGenerator(request.params.Category, request.params.Article ,ArticleToRead[0])
                .then(function(ArticleGenerator){

                    response.locals.ArticleGenerator = ArticleGenerator;

                    response.render('pages/blog/ArticleReader'), {}, 
                    function(err){
                        if(err){
                            console.log("["+err.name+"] " + err.message);
                            res.render(ErrorPage, {errormsg: ErrorMessage});
                        }
                    }
                })
                .catch(function(err){console.log(err)})
            })
            .catch(function(err){response.redirect("/bloger/article_not_found")})
        }
        else {
            LoadArticles(response.locals.query)
            .then(function(Articles){
                response.locals.Articles = Articles; 
                response.render("pages/blog/blog"),{},
                    function(err){
                    if(err){
                        console.log("["+err.name+"] " + err.message);
                        res.render(ErrorPage, {errormsg: ErrorMessage});
                    }
                };
            })
            .catch(function(err){
                console.log(err);
                response.render("pages/blog/blog"),{},
                    function(err){
                    if(err){
                        console.log("["+err.name+"] " + err.message);
                        res.render(ErrorPage, {errormsg: ErrorMessage});
                    }
                }
            });
        }
    })
});






async function BreadCrumbGenerator(Category, Article){
    return new Promise((resolve, reject)=>{

        var BreadCrumbCode = "";
        if(Category){
            BreadCrumbCode += `
            <script type="application/ld+json">
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",

                "itemListElement": [{
                    "@type": "ListItem",
                    "position": 1,
                    "name": "${Category}",
                    "item": "${ThisAdress}blog/${Category}"
                }`;
        }
        if(Article && Article != "favicon.png"){
            BreadCrumbCode += `
            ,{
                "@type": "ListItem",
                "position": 2,
                "name": "${Article}",
                "item": "${ThisAdress}blog/${Category}/${Article}"
            }
            
            `;
        }
        BreadCrumbCode += ']} </script>';
        if(BreadCrumbCode.length > 15){
            resolve(BreadCrumbCode);
        }
        else { resolve("");}
    })
}

async function ArticleGenerator(Category, Article, ArticleToRead){
    return new Promise((resolve, reject) =>{
        var ArticleGeneratorCode = "";
        if(ArticleToRead){
            ArticleGeneratorCode += `
            <script type="application/ld+json">
                {
                    "@context": "https://schema.org",
                    "@type": "NewsArticle",
                    "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": "${process.env.THIS_ADRESSE}blog/${Category}/${Article}"
                    },
                    "headline": "${ArticleToRead.author}",
                    "image": [
                        "https://example.com/photos/1x1/photo.jpg",
                        "https://example.com/photos/4x3/photo.jpg",
                        "https://example.com/photos/16x9/photo.jpg"
                     ],
                    "datePublished": "${ArticleToRead.post_date}",
                    "dateModified": "${ArticleToRead.lastmodified_date}",
                    "author": {
                        "@type": "Person",
                        "name": "${ArticleToRead.author}"
                    },
                        "publisher": {
                            "@type": "Organization",
                            "name": "Quested",
                            "logo": {
                                "@type": "ImageObject",
                                "url": "https://upload.wikimedia.org/wikipedia/fr/thumb/0/05/Discord.svg/220px-Discord.svg.png"
                            }
                        },
                    "description": "${ArticleToRead.Description}"
                }
            </script>
            `;
            resolve(ArticleGeneratorCode);
        }
        resolve("");
    })
}









/*
##############################
#######   Mysql ZONE  ########
##############################
*/

var connection_blog = mysql.createConnection({
    host : process.env.MYSQL_HOST,
    user : process.env.MYSQL_USER,
    password : process.env.MYSQL_PASS,
    port : process.env.MYSQL_PORT,
    database : 'quested' 
});


async function LoadArticles(Category){
    return new Promise((resolve, reject)=>{

        if(Category == "ifzpeiUDiudjelzkej154687564"){
            connection_blog.query(`SELECT * FROM articles ORDER BY ID DESC`, function(err, result, fields){
                if(err){reject(err);}
                else if (result){resolve(result);}
            })
        }

        if(Category == undefined){
            connection_blog.query(`SELECT * FROM articles WHERE Status='Published' ORDER BY ID DESC LIMIT 5`, function(err, result, fields){
                if(err){reject(err);}
                else if (result){resolve(result);}
            })
        }
        else {
            connection_blog.query(`SELECT * FROM articles WHERE Status='Published' AND Category = ? ORDER BY ID DESC LIMIT 5`, [Category], function(err, result, fields){
                if(err){reject(err);}
                else if (result){resolve(result);}
            });
        }
    })
}

async function ReadArticle(Title){
    return new Promise((resolve, reject)=>{
        connection_blog.query(`SELECT * FROM articles WHERE Title = ? AND Status='Published'`, [Title] , function(err, result, fields){
            if(err){reject(err)}
            else if (result){resolve(result)}
        })
    })
}

async function Mysql_PostArticle(Form){
    return new Promise((resolve ,reject)=>{    
        var ArticleDate = GetDate();
        console.log(Form);
        var ImageName = Form.ArticleTitle.replace(/[^a-zA-Z ]/g, "")
                                         .replace(/\s+/g, "_");

        Form.Category = Form.Category.replace(/[^a-zA-Z ]/g, "")
                                    .replace(/\s+/g, "_");

        Form.ArticleTitle = mysql_real_escape_string(Form.ArticleTitle);
        Form.ArticleDescription = mysql_real_escape_string(Form.ArticleDescription);
        Form.Markdown = mysql_real_escape_string(Form.Markdown);

        connection_blog.query(`INSERT INTO articles (author, post_date, lastmodified_date, Title, Description, Content, Category, ImagePath, Status) 
        VALUES ('Tryall', STR_TO_DATE("${ArticleDate}", '%d-%m-%Y'), STR_TO_DATE("${ArticleDate}", '%d-%m-%Y'), '${Form.ArticleTitle}', '${Form.ArticleDescription}', '${Form.Markdown}', '${Form.Category}', '${ImageName}', '${Form.Status}');`
        , function(err, result, fields){

            if(err){reject(err)}
            else if (result){
                resolve(true);
            }
        })
    })
}

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

function mysql_real_escape_string (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char;
        }
    });
}