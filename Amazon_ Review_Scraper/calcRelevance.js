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
var NUM_VERSIONS=2;
var NUM_PLATFORMS=4;
var NUM_PAGES_TO_SCRAPE=2;

var upvotesList=[];
var totalVotesList=[];
var ratingList=[];

var sumTotalVotes=0;
var relevanceScores=[];

var games=["fifa14","fifa15"];


// Async task for collecting the reviews on a page 
// numbered as (2-ct)+1 for game and idx as the platform

var collectPageRatingStep= function (ct,game, idx, cb) {
	var normCt= (NUM_PAGES_TO_SCRAPE-ct)+1;
	var ref=refBase+normCt;
	var pageNumber=normCt;

	console.log("let's scrap the page num "+pageNumber+"in the game " +game+ "with platform idx "+idx+'\n');
	//console.log(fifaData[game]);
	scraper.scrape(fifaData[game][idx][KEY_NAME],fifaData[game][idx][KEY_ID], ref , pageNumber, function(err, result){
		if(err){
			console.log("there was an error ", err);
			cb(err);
		}
		else if (result!=null){
			//console.log("before adding the result\n");
			//console.log(fifaData[game][idx]);
			
			//Concatenate the initial votes list with the one scraped now
			fifaData[game][idx][KEY_UVLIST]=fifaData[game][idx][KEY_UVLIST].concat(result[0]);
			fifaData[game][idx][KEY_TVLIST]=fifaData[game][idx][KEY_TVLIST].concat(result[1]);
			fifaData[game][idx][KEY_RLIST]=fifaData[game][idx][KEY_RLIST].concat(result[2]);
			console.log("after adding the result\n");
			console.log(fifaData[game][idx]);
			//console.log('Now going to my cb \n\n');
			cb(null,  result);
		}
	});

}

// Final task 
function final(cb) { 
	cb(null, 'Done scraping the number of elements you said ');
	
}

// Async traversal of given "ct" of pages for "game" 
// with platform as "idx" and scrape the most helpful reviews
// on these pages
function asyncTraversal(ct, game,idx, traversalStep, cb) {
  if(ct>0) {
    traversalStep( ct, game, idx, function(err, result) {
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
// Collect ratings for all versions
// of the game and for the different platforms it runs on
function collectGameRatings(cb){
	
	// There are 2 versions that we are considering
	// Fifa14 and Fifa15
	for(var i=0; i<NUM_VERSIONS; i++){
		(function(){
			var game=games[i];
			collectPlatformRatings (game, function(err, result){
				if(err)cb(err);
				else if (result!=null){
					cb(null, result);
				}
			});
						
		})();
	}
}

// Collect ratings for the different platforms
// for the given game
function collectPlatformRatings(game, cb){
	for(var j=0; j<NUM_PLATFORMS; j++){
		(function(){
			var idx=j;
			// Collect reviews on only 2 pages for 
			// given game and platform as idx 
			asyncTraversal(NUM_PAGES_TO_SCRAPE,game, idx, collectPageRatingStep,function(err, result){
				if(err)cb(err);
				else if (result!=null){
					cb(null,result);
				}
			});
		})();
	}
}

collectGameRatings(function(err, result){
	if(err)console.log(err);
	else if (result!=null){
		console.log(result);
		console.log('\n\n');
		console.log(fifaData[KEY_FIFA14]);
		console.log(fifaData[KEY_FIFA15]);
	}
});


// then do the routing part
// aggregate feedback from start
