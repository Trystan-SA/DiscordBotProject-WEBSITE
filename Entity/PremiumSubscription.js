module.exports = Entity.PremiumSubscription = class PremiumSubscription {
    constructor(PremiumSubscription){
        this.PremiumSubscriptionID = new String();
        this.orderID = new String();
        this.subscritionID = new String();
        this.DayOfPayement = new Number();
        this.Price = new Number();
        this.PlanName = new String();
        this.Status = new String();
    }
}