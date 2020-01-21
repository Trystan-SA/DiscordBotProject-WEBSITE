module.exports = Entity.Guilds = class Guilds {
    constructor(Guilds){
        this.owner = new Boolean();
        this.GuildID = new String();
        this.GuildName = new String();
        this.Icon = new String();
        this.PluginsConfig = new String();
        this.PremiumSubscription = new Entity.PremiumSubscription();
        this.Analytics = new Entity.Analytics();
    }
}