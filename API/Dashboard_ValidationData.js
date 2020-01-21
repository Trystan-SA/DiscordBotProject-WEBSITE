const mysql = require('./Mysql');
const fs = require('fs');
const PluginConfig = require('../public/js/pluginsconfig.js');


async function Validate(Data, decoded_token){
    return new Promise((resolve, reject)=>{

        var GuildID = decoded_token.GuildID;
        var Config = Data.Config;
        var ErrorStack = [];

        //For each config entry sent//
        Object.values(Config).forEach(function(ElemPlugin, IndexA){
            var PluginconfigElem = PluginConfig.Panel[Object.keys(Config)[IndexA]];

            Object.values(ElemPlugin).forEach(function(Input, IndexB){
                var Pluginconfigentry = PluginconfigElem[Object.keys(ElemPlugin)[IndexB]];
                if(Pluginconfigentry){
                    
                    ValidateInput(Input, Pluginconfigentry.type, Object.keys(Config)[IndexA], Object.keys(ElemPlugin)[IndexB])
                    .then(function(Errors){
                        if(Errors.length > 10){
                            reject(Errors);
                        }
                    })
                    .catch(function(error){console.error("[ERROR] - " + error);})
                }
            })
        })

        if(ErrorStack.length != 0){
            //If inputs have obvious error, return it to the user//
            reject(ErrorStack);
        }


        try {
           
            var SavablePluginConfig = `{`;
            Object.values(PluginConfig.Panel).forEach(function(LocalPlugin, index_Plugin){
                var PluginName = Object.keys(PluginConfig.Panel)[index_Plugin];
                SavablePluginConfig += `"${PluginName}":[`;

                if(Config[PluginName]) {
                    if(Config[PluginName]["Activated"]){
                        SavablePluginConfig += `["Activated", "${Config[PluginName]["Activated"]}"],`;
                    }
                    else {
                        SavablePluginConfig += `["Activated", "false"],`;
                    }
                }
                else {
                    SavablePluginConfig += `["Activated", "false"],`;
                }

                
                Object.values(LocalPlugin).forEach(function(LocalEntry, index_Entry){
                    var EntryName = Object.keys(LocalPlugin)[index_Entry];
                    SavablePluginConfig += `["${EntryName}",`;
                    

                    if(Config[PluginName]){      
                        if(Config[PluginName][EntryName]){
                            var Escaped = Config[PluginName][EntryName];
                            Escaped = JSON.stringify(Config[PluginName][EntryName]);
                            Escaped = Escaped.escapeSpecialChars();
                            SavablePluginConfig += `${Escaped}`;
                        }
                        else  {
                            if(LocalEntry.type == "Checkbox"){SavablePluginConfig += `"false"`;}
                            else { SavablePluginConfig += `""`;}  
                        }
                    }
                    else {  
                        if(LocalEntry.type == "Checkbox"){ SavablePluginConfig += `"false"`;}
                        else { SavablePluginConfig += `""`;} 
                    }
                    SavablePluginConfig += `],`;
                    
                    
                })
                SavablePluginConfig = SavablePluginConfig.slice(0, SavablePluginConfig.length - 1);
                SavablePluginConfig += `],`;
            })
            SavablePluginConfig = SavablePluginConfig.slice(0, SavablePluginConfig.length - 1);
            SavablePluginConfig += `}`;
            try { 
                ValidJSON = SavablePluginConfig;
                var JSONIFIED = JSON.parse(ValidJSON);
                resolve(ValidJSON);
            } catch {
                reject("PARSING ERROR : " + ValidJSON)
            }
        }
        catch(err){console.error(err); }
    })
}

module.exports.Validate = Validate;


async function ValidateInput(Input, Type, PluginName, PluginEntry){
    return new Promise((resolve, reject)=>{
        var Errors = [] 
        if(Input && Type){

            //console.log("GOT INPUT : " + Input + "  Got Type : " + Type);
            //console.log("PluginName : " + PluginName + "  PluginEntry : " + PluginEntry);

            if(Type === "Checkbox"){
                if(Input != true){Errors.push(PluginName, PluginEntry, "Invalid Data type. Did you tried to break something ?")}
            }
            if(Type === "DiscordMessages"){
                if(Input.length > 2000){Errors.push(PluginName, PluginEntry, "You've exceeded the limit of 2000 characters")}
            }

            if(Type === "Textbox small"){
                if(Input.length > 12){Errors.push(PluginName, PluginEntry, "You've exceeded the limit of 12 characters")}
            }

            if(Type === "Paragraph"){
                if(Input.length > 2000){Errors.push(PluginName, PluginEntry, "You've exceeded the limit of 2000 characters")}
            }

            resolve(Errors);
        }
    })
}