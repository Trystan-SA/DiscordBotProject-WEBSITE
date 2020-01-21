module.exports = Entity.Owner = class {
    constructor(variable){

        /** Discord Oauth container - Everything to know about the Owner */
        this.DiscordOauth = new Entity.DiscordOauth();

        /** Discord Token container */
        this.DiscordToken = new Entity.DiscordToken();
        
        /** Discord Guilds container */
        this.DiscordGuilds = new Entity.DiscordGuilds();

        /** An array containing PremiumInformation. Key = GuildID */
        this.Guilds = new Array(new Entity.Guilds());


        if(variable){
            if(variable.DiscordOauth){
                this.DiscordOauth = variable.DiscordOauth;
            }
            if(variable.DiscordToken){
                this.DiscordToken = variable.DiscordToken;
            }
            if (variable.DiscordGuilds){
                this.DiscordGuilds = variable.DiscordGuilds;
            }
            if (variable.Guilds){
                this.Guilds = variable.Guilds;
            }
        }
    }

}
