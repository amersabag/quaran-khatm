Khatmat = new Mongo.Collection('khatmat');
Periods = new Mongo.Collection('periods');
Parts = new Mongo.Collection('parts');

if (Meteor.isClient) {

  Meteor.startup(function(){
    var url = _.object(_.compact(_.map(location.search.slice(1).split('&'), function(item) {  if (item) return item.split('='); })));
    if(url['khatmaId'])
    {
      Session.set('currentKhatmaId', url['khatmaId']);
    }
    if(url['periodId'])
    {
      Session.set('currentPeriodId', url['periodId']);
    }
  });
  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
  });
  Template.body.helpers({
    currentKhatma: function(){
      return Khatmat.findOne({_id: Session.get('currentKhatmaId')});
    }
  });
  Template.listKhatmat.helpers({
    khatmat: function(){
      return Khatmat.find();
    },
    creatorName: function(){
      var owner = Meteor.users.findOne({_id: this.createdBy});
      return owner && owner.username;
    }
  });
  Template.listKhatmat.events({
    'click .khatmaLink':function(){
      Session.set('currentKhatmaId', this._id);
      return false;
    }
  });
  Template.createKhatma.events({
    'submit .createKhatmaForm': function(event){
      if(!('' + event.target.name.value).length)
      {
        alert('name cannot be empty.');
        return false;
      }
      var startDate =new Date(event.target.start.value);
      if(isNaN(startDate.getTime()))
      {
        alert('date is not valid, it should be like: 2015-04-20.');
        return false;
      }
      if(isNaN(event.target.period.value))
      {
        alert('period is not valid, it should be integer');
        return false;
      }
      Khatmat.insert({
        name: event.target.name.value,
        period: event.target.period.value,
        startDate: startDate,
        createdAt: new Date(),
        createdBy: Meteor.userId()
      });
      return false;
    }
  });
  Template.khatma.helpers({
    currentPeriod: function(){
      return Periods.findOne({_id: Session.get('currentPeriodId')});
    }
  });
  Template.khatma.events({
    'click .listKhatmat': function(){
      Session.set('currentKhatmaId', null);
      Session.set('currentPeriodId', null);
      return false;
    }
  });
  Template.createPeriod.events({
    'submit .createPeriod': function(){
      var currentKhatma = Khatmat.findOne({_id: Session.get('currentKhatmaId')});
      var currentKhatmaPeriodCount = Periods.find({khatmaId: Session.get('currentKhatmaId')}).count();
      var startDate = currentKhatma.startDate;
      if(currentKhatmaPeriodCount)
      {
        startDate.setDate(
            startDate.getDate() + currentKhatmaPeriodCount * currentKhatma.period
        );
      }
      var periodId = Periods.insert({
        khatmaId: Session.get('currentKhatmaId'),
        startDate: startDate
      });
      var previousPeriod = Periods.findOne({
        khatmaId: this._id,
        startDate: {$lt: startDate}
      }, {
        $sort: {startDate: -1}
      });
      var previousPeriodParts = [];
      if(previousPeriod)
      {
        previousPeriodParts = Parts.find({
          khatmaId: this._id,
          periodId: previousPeriod._id
        }, {
          $sort: {partNumber: 1}
        }).fetch();
      }
      for(var i = 1; i <= 30; ++i)
      {
        var previousPartIndex = i - 2;
        if(previousPartIndex == -1)
        {
          previousPartIndex = 29;
        }
        Parts.insert({
          khatmaId: currentKhatma._id,
          periodId: periodId,
          partNumber: i,
          ownerId:
              (
                previousPeriodParts[previousPartIndex]
                && previousPeriodParts[previousPartIndex].ownerId
              )
              ? previousPeriodParts[previousPartIndex].ownerId
              : null,
          done: false
        });
      }
      return false;
    }
  });
  Template.listPeriods.helpers({
    periods: function(){
      return Periods.find({khatmaId: Session.get('currentKhatmaId')});
    }
  });
  Template.listPeriods.events({
    'click .periodLink': function()
    {
      Session.set('currentPeriodId', this._id);
      return false;
    }
  });
  Template.period.helpers({
    parts: function(){
      return Parts.find({
        khatmaId: Session.get('currentKhatmaId'),
        periodId: Session.get('currentPeriodId')
      });
    }
  });
  Template.period.events({
    'click .listPeriods': function(){
      Session.set('currentPeriodId', null);
      return false;
    }
  });
  Template.part.helpers({
    test: function(){
      console.log('test');
    },
    ownerName: function(){
      var owner = Meteor.users.findOne({_id: this.ownerId});
      return owner && owner.username;
    },
    currentUserIsTheOwner: function(){
      return Meteor.userId() == this.ownerId;
    }
  });
  Template.part.events({
    'click .setOwner': function(){
      Parts.update(
          {_id: this._id},
          {$set: {ownerId: Meteor.userId()}}
      );
      return false;
    },
    'click .removeOwner': function(){
      Parts.update(
          {_id: this._id},
          {$set: {ownerId: null}}
      );
      return false;
    },
    'click .setDone': function(event){
      Parts.update(
          {_id: this._id},
          {$set: {done: !!event.target.checked}}
      );
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
