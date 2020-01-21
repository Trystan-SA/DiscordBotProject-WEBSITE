module.exports = Entity.Analytics = class Analytics {
    constructor(Analytic){
        this.GuildID = new String();
        this.Date = new Date();
        this.TotalMember = new Number();
        this.OnlineMember = new Number();
        this.TotalMessages = new Number();
    }
}