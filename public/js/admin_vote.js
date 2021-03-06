var Vote = Backbone.Model.extend({
  that: null,
  validate: function() {
  	return true;
  },
  log: function() {
    console.log(this.attributes.chiname + " " + this.attributes.engname);
  },
  save: function(){
  	that = this;
  	$.getJSON('/admin/class/add?'+$('#vote_modal form').serialize(),this.update_data);
  },
  update_data: function(data){
  	console.log(data[0]);
  	that.set(data[0]);
  }
});

var VoteCollection = Backbone.Collection.extend({
  model: Vote
});

var VoteView = Backbone.View.extend({
  tagName: "div",
  className: "vote_block",
  events:{'click .delete':'delete'},
  template: _.template(
  		"<%= chiname %> <%=engname%> \
        <% if(start_at){ %><span class='date label label-default'><%=start_at%> ~ <%=end_at%><% }else{ %> \
        <span class='label label-warning'>未設定投票日期<% } %></span>\
  		 <a href='/admin/vote/<%=_id%>' class='edit'>編輯</a> \
  		 <a href='#' class='delete'>刪除</a>"),
  initialize: function () {
  	this.model.on('change', this.render, this);
  },
  render: function(){
    var attr = this.model.attributes;
    if(!attr['start_at']) attr['start_at'] = '';
    if(!attr['end_at']) attr['end_at'] = '';
  	$(this.el).html(this.template(attr));
    if(new Date()>new Date(attr['start_at']) && new Date() < new Date(attr['end_at']))
      $(this.el).find('.date.label').removeClass('label-default').addClass('label-info');
  	return this;
  },
  delete: function(){
    if(confirm("確定刪除?")){
    	this.model.collection.remove(this.model);
    	$(this.el).fadeOut();
    	$.getJSON('/admin/class/remove?_id='+this.model.attributes._id);
    }
  }
});

var VoteCollectionView = Backbone.View.extend({
  that: null,
  _vote_views: [],
  initialize : function() {
    _(this).bindAll('add', 'remove');
    that = this;
    this._vote_views = [];
 	console.log("Yo",this.collection.models);
    _(this.collection.models).each(function(vote) {
      vote.log();
      var view_obj = new VoteView({model: vote});
      that._vote_views.push(view_obj);
    });
    this.collection.bind('add',this.add);
  },

  add: function(model){
  	var vv = new VoteView({model: model});
  	this._vote_views.push(vv);
  	$(this.el).append(vv.render().el);
  },
 
  render : function() {
    that = this;
    // Clear out this element.
    $(this.el).empty();
 
    // Render each sub-view and append it to the parent view's element.
    _(this._vote_views).each(function(vote) {
      $(that.el).append(vote.render().el);
    });
  },

  update: function(){
  	that = this;
  	$.getJSON('/admin/class/all',function(data){
		that.collection = new VoteCollection(data);
  		that.initialize();
  		that.render();
  	});
  }
});

function showTokenForm(){
  $('#token_modal').modal('show');
}

function showVoteForm(edit_mode){
	$('#vote_modal').modal('show');
  if(edit_mode){
    for(var i in the_vote){
      $('#vote_modal input[name='+i+']').val(the_vote[i]);
    }
    $('#agree').val(the_vote['agree']);
  }else{
    $('#vote_modal input').each(function(){$(this).val('');});
    $('#votemax').val('1');
  }
}

function addVote(){
	var v = new Vote({chiname:$('#chiname').val(),engname:$('#engname').val()});
	v.save();
	votes_view.collection.add(v);
	$('#vote_modal').modal('hide');
}

function editVote(){
  if($('#vote_modal #_id').val()!=""){
    var v = {};
    $.post('/admin/class/update',$('#vote_modal form').serialize());
    $('#vote_chiname').text($('#vote_modal input[name=chiname]').val()+' ');
    $('#vote_engname').text($('#vote_modal input[name=engname]').val());
    $('#vote_time').text($('#vote_modal input[name=start_at]').val()+" ~ "+$('#vote_modal input[name=end_at]').val());
    $('#vote_modal').modal('hide');
  }else addVote();
}