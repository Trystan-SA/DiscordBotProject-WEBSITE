module.exports = Entity.DiscordToken = class DiscordToken {
    constructor(DiscordToken){
        this.access_token = new String(); 
        this.scope = new String();
        this.token_type = new String();
        this.expires_in = new Number(); 
        this.refresh_token = new String();
    }
}