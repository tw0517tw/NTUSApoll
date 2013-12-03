var total_vote = 0;
var total_candidate = 1;
var Candidate = Backbone.Model.extend({
  that: null,
  constructor: function() {
    Backbone.Model.apply(this, arguments);
    if(!this.attributes['_id']) this.attributes['_id'] = null;
  },
  validate: function() {
  	return true;
  },
  log: function() {
    console.log(this.attributes.cname + " " + this.attributes.ename);
  },
  save: function(){
  	that = this;
    if(this.attributes._id&&this.attributes._id!="")
  	 $.getJSON('/admin/candy/update?_id='+this.attributes._id+'&cname='+this.attributes.cname+'&ename='+this.attributes.ename+'&no='+this.attributes.no,this.update_data);
    else
     $.getJSON('/admin/candy/add?cname='+this.attributes.cname+'&ename='+this.attributes.ename+'&classid='+the_vote._id+'&no='+this.attributes.no,this.update_data);
  },
  calc_rate: function(){
    total_vote = 0;
    total_candidate = 0;
    for(var i in candidates_view.collection.models){
      var vote_count = candidates_view.collection.models[i].attributes.vote;
      if(vote_count) total_vote += vote_count;
      total_candidate += 1;
    }
    if(total_vote){
      return Math.floor(this.attributes.vote*100/total_vote);
    }else{
      return Math.floor(100/total_candidate);
    }
  },
  update_data: function(data){
  	console.log(data[0]);
  	that.set(data[0]);
  }
});

var CandidateCollection = Backbone.Collection.extend({
  model: Candidate
});

var CandidateView = Backbone.View.extend({
  tagName: "div",
  className: "vote_block",
  events:{'click .delete':'delete','click .edit':'edit'},
  template: _.template(
  		"<b><%= no %> <%= cname %> <%=ename%></b> 得票數: <%=vote%>\
  		 <a href='#' class='edit'>編輯</a> \
  		 <a href='#' class='delete'>刪除</a>"+
       '<div class="vote_rate"><span class="vote_rate">得票率 <%=rate%>%</span><div class="progress-striped progress"> \
        <div class="progress-bar  progress-bar-info" role="progressbar" aria-valuenow="<%=rate%>" aria-valuemin="0" aria-valuemax="100" style="width: <%=rate%>%;"> \
          <span class="sr-only"><%=rate%>% Complete</span> \
        </div> \
      </div> \
      </div>'),
  that_cv:null,
  initialize: function () {
  	_.bindAll(this,'render');
    this.model.bind('change', this.render);
  },
  render: function(){
    console.log("Ready to render", this.model.attributes);
    var candy = {no:this.model.attributes.no,ename:this.model.attributes.ename,vote:this.model.attributes.vote,cname:this.model.attributes.cname, rate: this.model.calc_rate()};
  	$(this.el).html(this.template(candy));
  	return this;
  },
  delete: function(){
  	this.model.collection.remove(this.model);
  	$(this.el).fadeOut();
  	$.getJSON('/admin/candy/remove?_id='+this.model.attributes._id);
  },
  edit: function(){
    showCandidateForm(this.model);
  }
});

var CandidateCollectionView = Backbone.View.extend({
  that_yo: null,
  _views: [],
  initialize : function() {
    _.bindAll(this,'add', 'remove', 'render','render_without_append');
    that = this;
    this._views = [];
    _(this.collection.models).each(this.add);
    this.collection.bind('add',this.add);
    this.collection.bind('remove',this.remove);
  },
  remove: function(){
    this.render_without_append();
  },
  add: function(model){
  	var vv = new CandidateView({model: model});
  	this._views.push(vv);
    if (this._rendered) {
      $(this.el).append(vv.render().el);
      this.render_without_append();
    }
  },
  render_without_append : function() {
    _(this._views).each(function(candidate_view) {
      candidate_view.render();
    });
  },
  render : function() {
    // Clear out this element.
    $(this.el).empty();
    this._rendered = true;
    var that = this;
    // Render each sub-view and append it to the parent view's element.
    _(this._views).each(function(candidate_view) {
      $(that.el).append(candidate_view.render().el);
    });
  },

  update: function(){
  	that = this;
  	$.getJSON('/admin/candy/all?classid='+vid,function(data){
		that.collection = new CandidateCollection(data);
  		that.initialize();
  		that.render();
  	});
  }
});

function showCandidateForm(model){
	$('#candidate_modal').modal('show');
  if(model){
    $('#candy_img').fadeIn();
    $('#avatar').attr('src',"/avatar/" + model.attributes._id+".jpg");
    $('#cname').val(model.attributes.cname);
    $('#ename').val(model.attributes.ename);
    $('#no').val(model.attributes.no);
    $('#object_id_img').val(model.attributes._id);
    $('#object_id').val(model.attributes._id);
  }else{
    $('#candy_img').fadeOut();
    $('#object_id').val('');
    $('#object_id_img').val('');
    $('#cname').val('');
    $('#ename').val('');
    $('#no').val('');
  }
}

function addCandidate(){
	var v = new Candidate({no:$('#no').val(),cname:$('#cname').val(),ename:$('#ename').val(),_id:$('#object_id').val()});
	v.save();
  vid = v.attributes._id;
	if(vid&&vid!=""){
    for(var i in candidates_view.collection.models){
      //console.log(candidates_view.collection.models[i].attributes['_id'],v._id);
      if(candidates_view.collection.models[i].attributes['_id']==vid){
        candidates_view.collection.models[i].set(v.attributes);
      }
    }
  }else{
    candidates_view.collection.push(v);  
  }
	$('#candidate_modal').modal('hide');
}

