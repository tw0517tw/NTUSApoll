//$('#token').val('7568zgwm7243csiw');
var voted = 0;
var vote_data = [];
function checkToken(){
  $.getJSON('http://localhost:8080/token/validate?token='+$('#token').val(), function(data){
    if(!data.error){
      $('#vote_title').text(data.vote_class.chiname);
      $('#vote_entitle').text(data.vote_class.engname);
      var row_no = [];
      var row_img = [];
      var row_name = [];
      var row_ename = [];
      var row_action = [];
      for(var i in data.candies){
        var c = data.candies[i];
        row_no.push('<span class="vno">'+c.no+'</span>');
        row_img.push("<img width='150' src='/avatar/"+c._id+".jpg' onerror='this.src=\"/img/default.jpg\"' />");
        row_name.push('<span class="cname">'+c['cname']+'</span>');
        row_ename.push('<span class="ename">'+c['ename']+'</span>');
        if(data.vote_class.agree != "on"){
          row_action.push('<br /><button class="btn btn-default" data-value="'+c._id+'" onclick="vote(this)">投</button>');
        }else{
          row_action.push('<br /><button class="btn btn-default agr" data-value="'+c._id+'" onclick="agree(this)">同意</button> <button class="btn btn-default disagr" data-value="'+c._id+'" onclick="disagree(this)">不同意</button>');
        }
      }
      var all = "<tr><td>"+[row_no.join("</td><td>"),row_img.join("</td><td>"),row_name.join("</td><td>"),row_ename.join("</td><td>"),row_action.join("</td><td>")].join('</td></tr><tr><td>')+"</td></tr>";
      vote_data = data.vote_class;
      if(vote_data.votemax) $('#votemax').text(vote_data.votemax);
      $('#tbl').html("<table width='100%'>"+all+"</table>");
      gotoProg(2);
    }else{
      alert(data.error);
    }
  });
}

function vote(btn){
  if($(btn).attr('data-selected')!="true"){
    if(voted < vote_data.votemax){
      voted ++;
      $(btn).attr('data-selected', "true");
      $(btn).removeClass('btn-default').addClass('btn-primary');
    }
  }else if($(btn).attr('data-selected')=="true"){
    voted --;
    $(btn).attr('data-selected', "false");
    $(btn).addClass('btn-default').removeClass('btn-primary');
  }
}

function render_agree(select,o){
  if(select)
    o.removeClass('btn-default').addClass('btn-primary');
  else
    o.addClass('btn-default').removeClass('btn-primary');
}

function agree(btn){
  if($(btn).parent().attr("data-agree")=="true"){
    $(btn).parent().attr("data-disagree","false");
    $(btn).parent().attr("data-agree","false");
  }else{
    $(btn).parent().attr("data-disagree","false");
    $(btn).parent().attr("data-agree","true");
  }
  render_agree($(btn).parent().attr('data-agree')=="true", $(btn).parent().find('.agr'));
  render_agree($(btn).parent().attr('data-disagree')=="true", $(btn).parent().find('.disagr'));
}

function disagree(btn){
  if($(btn).parent().attr("data-disagree")=="true"){
    $(btn).parent().attr("data-disagree","false");
    $(btn).parent().attr("data-agree","false");
  }else{
    $(btn).parent().attr("data-disagree","true");
    $(btn).parent().attr("data-agree","false");
  }
  render_agree($(btn).parent().attr('data-agree')=="true", $(btn).parent().find('.agr'));
  render_agree($(btn).parent().attr('data-disagree')=="true", $(btn).parent().find('.disagr'));
}

function checkVote(){
  var candies = [];
  var dis_candies = [];
  if(vote_data.agree=="on"){
    $(".agr.btn-primary").each(function(){
      candies.push($(this).attr('data-value'));
    });
    $(".disagr.btn-primary").each(function(){
      dis_candies.push($(this).attr('data-value'));
    });
  }else{
    $(".btn[data-selected=true]").each(function(){
      candies.push($(this).attr('data-value'));
    });
  }
  $.getJSON('/do_vote?token='+$('#token').val()+'&candy[]='+candies.join('&candy[]=')+'&dis_candy[]='+dis_candies.join('&dis_candy[]=')+'&classid='+vote_data._id,voteCallback);
}

function voteCallback(resp){
  console.log(resp);
  $('#token').val('');
  voted = 0;
  vote_data = null;
  gotoProg(1);
  if(resp.success){
    alert('投票成功!');
  }else{
    alert(resp.error);
  }
}

function gotoProg(a){
  $('.container').hide();
  setTimeout(function(){$('#prog'+a).fadeIn('slow')},100);
  if(a==1){
    $('.alert').hide();
  }else{
    $('.alert').fadeIn();
  }
}

gotoProg(1);