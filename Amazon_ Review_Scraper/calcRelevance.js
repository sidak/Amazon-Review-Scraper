var scraper= require('./reviewScraper');
var fifaData= require('./Input_files/fifaAmazonData');
var refBase= "cm_cr_pr_btm_link_";
 
var KEY_NAME="name";
var KEY_ID="id";

var KEY_FIFA14="fifa14";
var KEY_FIFA15="fifa15";
var KEY_UVLIST="upvotesList";
var KEY_TVLIST="totalVotesList";
var KEY_RLIST="ratingList";

var upvotesList=[];
var totalVotesList=[];
var ratingList=[];

var sumTotalVotes=0;
var relevanceScores=[];

var games=["fifa14","fifa15"];


// Async task (same in all examples in this chapter)
var collectPageRatingStep= function (ct,game, idx, cb) {
	var normCt= (2-ct)+1;
	var ref=refBase+normCt;
	var pageNumber=normCt;

	console.log("let's scrap the page num "+pageNumber+"in the game " +game+ "with platform idx "+idx+'\n');
	console.log(game, " ", idx);
	console.log(fifaData[game]);
	scraper.scrape(fifaData[game][idx][KEY_NAME],fifaData[game][idx][KEY_ID], ref , pageNumber, function(err, result){
		if(err){
			console.log("there was an error ", err);
			cb(err);
		}
		else if (result!=null){
			console.log("hello");
			fifaData[game][idx][KEY_UVLIST]=fifaData[game][idx][KEY_UVLIST].concat(result[0]);
			fifaData[game][idx][KEY_TVLIST]=fifaData[game][idx][KEY_TVLIST].concat(result[1]);
			fifaData[game][idx][KEY_RLIST]=fifaData[game][idx][KEY_RLIST].concat(result[2]);
			console.log("New Data Scraped\n");
			cb(null,  result);
		}
	});

}

// Final task (same in all the examples)
function final(cb) { 
	cb(null, 'Done scraping the number of elements you said ');
	
}


function asyncTraversal(ct, game,idx, traversalStep, cb) {
  if(ct>0) {
    traversalStep( ct, game, idx, function(err, result) {
      //results.push(result);
      if(err)cb(err);
      else {
		  ct--;
		  console.log(result)
		  return asyncTraversal(ct, game, idx, traversalStep, cb);
	  }
    });
  } else {
    return final(cb);
  }
}
/*
function collectPlatformRatingStep(game){
		
		game = fifaData[KEY_FIFA14][i];
		idx =i;
		elements=[1,2];
		collectRatingForGame(elements.shift());
		
	
	}
	for(var i=0; i<4; i++){
		
		game = fifaData[KEY_FIFA14][i];
		idx =i;
		elements=[1,2];
		collectRatingForGame(elements.shift());
		
	}
	
}

function collectGameRatingStep(){
	elements=[KEY_FIFA14,KEY_FIFA15];
	asyncTraversal(elements.shift(), collectPlatformRatingStep, function(err, result){
		if(err)console.log(err);
		else if (result!=null){
			console.log(result);
		}
	});
}
*/
function main(cb){
	console.log(fifaData);
	for(var i=0; i<2; i++){
		(function(){
			var game=games[i];
			for(var j=0; j<4; j++){
				(function(){
					var idx=j;
					asyncTraversal(2,game, idx, collectPageRatingStep,function(err, result){
						if(err)cb(err);
						else if (result!=null){
							cb(null,result);
						}
					});
				})();
			}
		})();
	}
}


asyncTraversal(2,KEY_FIFA14,0,collectPageRatingStep,function(err, result){
	console.log("hey knwf");
	
	if(err)console.log(err);
	else if (result!=null){
		console.log("done calling");
		console.log(result);
		console.log(fifaData[KEY_FIFA14]);
	}
	
});

/*main(function(err, result){
	if(err)console.log(err);
	else if (result!=null){
		console.log(result);
		console.log('\n\n');
		console.log(fifaData);
	}
});
*/
// loop over the whole 
//call a method for fifa14
// call a method for fifa15

// calling a method for each calls 4 methods for different platforms
// store the relevance data in a file 
// then do the routing part
// aggregate feedback from start
