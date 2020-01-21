module.exports = Entity.DiscordOauth = class DiscordOauth {
    constructor(DiscordOauth){
        this.username = new String();
        this.verified = new Boolean();
        this.locale = new String();
        this.mfa_enabled = new Boolean();
        this.id = new String();
        this.flags = new Number();
        this.avatar = new String();
        this.discriminator = new String();
        this.email = new String();
    }
}
