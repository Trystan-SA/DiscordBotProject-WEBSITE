module.exports = Entity.DiscordGuilds = class DiscordGuilds {
    constructor(DiscordGuilds){
        this.owner = new Boolean();
        this.id = new String();
        this.name = new String();
        this.icon = new String();
        this.permissions = new Number();
        this.features = new Array();
    }
}