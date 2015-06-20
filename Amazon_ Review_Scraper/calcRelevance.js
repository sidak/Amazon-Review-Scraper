var scraper= require('./reviewScraper');
var fifaData= require('./Input_files/fifaAmazonData');
var fs = require('fs');

var refBase= "cm_cr_pr_btm_link_";
		
var KEY_NAME="name";
var KEY_ID="id";

var KEY_FIFA14="fifa14";
var KEY_FIFA15="fifa15";
var KEY_UVLIST="upvotesList";
var KEY_TVLIST="totalVotesList";
var KEY_RLIST="ratingList";
var KEY_ReLIST="relevanceList";
var KEY_GAME_PLATFORM_NAME="name";
var KEY_PAGES="pages";
var NUM_VERSIONS=2;
var NUM_PLATFORMS=4;
var NUM_PAGES_TO_SCRAPE=2;
var BASE_SCORE=2.5;

var upvotesList=[];
var totalVotesList=[];
var ratingList=[];

var sumTotalVotes=0;
var relevanceScores=[];

var games=["fifa14","fifa15"];

// Final data to be written in a file
var data=[];

// Async task for collecting the reviews on a page 
// numbered as (2-ct)+1 for game and idx as the platform

var collectPageRatingStep= function (ct,game, idx, cb) {
	var normCt= (fifaData[game][idx][KEY_PAGES]-ct)+1;
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
function final(cb, game, idx) { 
	calculateRelevance(game, idx, function(err, result){
		if(err)cb(err);
		else if (result!=null){
			console.log('Done scraping the number of elements you said and also calculated the relevance scores for them ');
			// write the data to file
			writeDataForGamePlatform(game, idx, function(err, result){
				if(err)cb(err);
				else if(result!=null){
					cb(null, result);
				}
			});
		}
		
	});
	
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
    return final(cb,game, idx);
  }
}
// Collect ratings for all versions
// of the game and for the different platforms it runs on
function collectGameRatings(cb){
	// write the metadata in the file
	data.push(
				{ 
						name:"meta",						
						root:"fifa",
				}
			);
	
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
			asyncTraversal(fifaData[game][idx][KEY_PAGES],game, idx, collectPageRatingStep,function(err, result){
				if(err)cb(err);
				else if (result!=null){
					cb(null,result);
				}
			});
		})();
	}
}
function writeDataForGamePlatform(game, idx, cb){
	var gamePlatform= fifaData[game][idx];
	console.log("In writing data for game platform");
	console.log(gamePlatform);
	var parent;
	var children=[];
	var ratings_char;
	var ratings_int=[];
	var relevance;
	var name;
	if(game==KEY_FIFA14){
		parent=KEY_FIFA14;
	}
	else {
		parent=KEY_FIFA15;
	}
	
	name =gamePlatform[KEY_GAME_PLATFORM_NAME];
	ratings_char = gamePlatform[KEY_RLIST];
	for(var i=0; i<ratings_char.length; i++){
		ratings_int.push(ratings_char[i]-'0');
	}
	relevance= gamePlatform[KEY_ReLIST];
	var obj = createNewServiceObject(parent, name, ratings_int, relevance, children);
	console.log(obj);
	//data.push(JSON.stringify(obj));
	data.push(obj);
	cb(null, 'data obj written to file');
	
}
function createNewServiceObject(parent, name, ratings, relevance, children){
	var obj = {
					"name":name,
					"agg_rating_score":0,
					"own_rating_cont":0,
					"children_rating_cont":0,
					"own_wmean_rating":0,						
					"universe_wmean_rating":0,
					"consumer_ratings":ratings,
					"consumer_relevance":relevance,
					"consumer_feedback_count":0,
					"rating_trust_value":0,
					"trust_votes":0,
					"children":children,
					"parent":[parent]
			}
	return obj;
}
// check for characters in the list
function performScaling(reList){
	var numReviews= reList.length;
	var maxRelevance=0;
	for(var i=0; i<numReviews; i++){
		if(platform[KEY_ReLIST][i]>maxRelevance){
			maxRelevance=platform[KEY_ReLIST][i];
		}
	}
	
	// perform Scaling
	for(var i=0; i<numReviews; i++){
		var scaledRelevance= (platform[KEY_ReLIST][i]/maxRelevance)*5;
		platform[KEY_ReLIST][i]=scaledRelevance;
	}
		
} 
function calcAvgUniversalRelevance(iReList, uvList, tvList){
	var universeRelevanceSum=0;
	for(var i=0; i<uvList.length; i++){
		universeRelevanceSum+=iReList[i];
	}
	var avgURe= universeRelevanceSum/uvList.length;
	return avgURe;
}

function calcAvgUniversalRelevance1(iReList, uvList, tvList){
	var sumUv=0;
	var sumDv=0;
	var sumTv=0;
	
	for(var i=0; i<uvList.length; i++){
		sumUv+= uvList[i];
		sumDv+= tvList[i]-uvList[i];
		sumTv+= tvList[i];
	}
	var avgURe = 2.5 + (2.5*((sumUv- sumDv)/sumTv));
	return avgURe;
}
function calcWt(tvList){
	var maxTv=0;
	for(var i=0;i<tvList.length; i++){
		if(tvList[i]>maxTv){
			maxTv=tvList[i];
		}
	}
	var wtList=[];
	for(var i=0; i<tvList.length; i++){
		wtList.push(tvList[i]/maxTv);
	}
	return wtList;
}

function calculateAdjustedRelevance(reList, uvList, tvList, wtList,avgURe){
	var numReviews = uvList.length;
	for(var i=0; i<numReviews; i++){
		if(uvList[i]!=0 || tvList[i]!=0){
			var iRe= reList[i];
			var adRe= (1-wtList[i])*avgURe;
			adRe+= wtList[i]*iRe;
			reList[i]=adRe;
		}
		else {
			// if it is a ZHR
			reList[i]=avgURe;
		}
	}
}
function calculateRelevance(game, idx,cb){
	console.log("in calc relevance");
	console.log(game);
	console.log(idx);
	var platform = fifaData[game][idx];
	var zeroHelpfulReviews=0;
	var numReviews= platform[KEY_RLIST].length;
	var sumUpvotes=0;
	var sumDownvotes=0;
	var sumTotalVotes=0;
	var maxTotalVotes=0;
	// Calculate sum of upvotes, downvotes, totalvotes
	// , num of ZHR and also calculate the maxvotes
	
	for(var i=0; i<numReviews; i++){
		if(platform[KEY_UVLIST][i]==0 && platform[KEY_TVLIST][i]==0)zeroHelpfulReviews++;
		sumUpvotes+=(platform[KEY_UVLIST][i]-'0');
		sumDownvotes+= (platform[KEY_TVLIST][i]-'0')-(platform[KEY_UVLIST][i]-'0');
		sumTotalVotes+= (platform[KEY_TVLIST][i]-'0');
		if(maxTotalVotes<(platform[KEY_TVLIST][i]-'0')){
			maxTotalVotes=(platform[KEY_TVLIST][i]-'0');
		}
		
	}
	var avgUpvotes= sumUpvotes/(numReviews-zeroHelpfulReviews);
	var avgDownvotes= sumDownvotes/(numReviews-zeroHelpfulReviews);
	var avgTotalVotes= (sumTotalVotes/(numReviews-zeroHelpfulReviews));
	
	var fracZHR= zeroHelpfulReviews/numReviews;
	
	var importanceZHR= 1-fracZHR;
	
	//var avgZHRRelevance=BASE_SCORE* ( 1 + importanceZHR*((avgUpvotes-avgDownvotes)/avgTotalVotes));
	var avgConstZHRRelevance=2.5;
	
	console.log('\n numReviews',numReviews,'\n sumUpvotes',sumUpvotes,
				'\n sumDownvotes',sumDownvotes,'\n sumTotalVotes',sumTotalVotes,
				'\n zeroHelpfulReviews',zeroHelpfulReviews,'\n avgConstZHRRelevance', avgConstZHRRelevance);
	
	// calc initial relevance
	
	for(var i=0; i<numReviews; i++){
		if(platform[KEY_UVLIST][i]==0 && platform[KEY_TVLIST][i]==0){
			platform[KEY_ReLIST].push(avgConstZHRRelevance);
		}
		else {
			platform[KEY_ReLIST].push(BASE_SCORE* ( 1 + (2*(platform[KEY_UVLIST][i]-'0')-(platform[KEY_TVLIST][i]-'0'))/platform[KEY_TVLIST][i]));
		}
	}
	
	var avgUniverseRelevance= calcAvgUniversalRelevance(platform[KEY_ReLIST], platform[KEY_UVLIST], platform[KEY_TVLIST]);
	// calculate mean universe relevance
	/*
	var universeRelevanceSum=0;
	for(var i=0; i<numReviews; i++){
		universeRelevanceSum+=platform[KEY_ReLIST][i];
	}
	var avgUniverseRelevance=universeRelevanceSum/numReviews;
	*/
	console.log("avgTotalVotes ", avgTotalVotes);
	console.log("avgUniverseRelevance ", avgUniverseRelevance);
	// calculate the adjusted relevance scores for each of them
	
	
	// getWt
	var wtList = calcWt(platform[KEY_TVLIST]);
	
	// keep faith on pass by value (call by sharing)
	calculateAdjustedRelevance(platform[KEY_ReLIST], platform[KEY_UVLIST], 
								platform[KEY_TVLIST], wtList,avgUniverseRelevance);
	
	/*
	for(var i=0; i<numReviews; i++){
		if(platform[KEY_UVLIST][i]!=0 || platform[KEY_TVLIST][i]!=0){
			var initRelevance=platform[KEY_ReLIST][i];
			var adjRelevance= ((maxTotalVotes-(platform[KEY_TVLIST][i]-'0'))/maxTotalVotes)*avgUniverseRelevance;
			adjRelevance+= ((platform[KEY_TVLIST][i]-'0')/(maxTotalVotes))*initRelevance;
			platform[KEY_ReLIST][i]=adjRelevance;
		}
		else {
			platform[KEY_ReLIST][i]=avgUniverseRelevance;
		}
	}
	*/
	performScaling(platform[KEY_ReLIST]);
	/*
	var maxRelevance=0;
	for(var i=0; i<numReviews; i++){
		if(platform[KEY_ReLIST][i]>maxRelevance){
			maxRelevance=platform[KEY_ReLIST][i];
		}
	}
	
	// perform Scaling
	for(var i=0; i<numReviews; i++){
		var scaledRelevance= (platform[KEY_ReLIST][i]/maxRelevance)*5;
		platform[KEY_ReLIST][i]=scaledRelevance;
	}
	
	*/
	
	/*
	// this the second way 
	for(var i=0; i<numReviews; i++){
		if(platform[KEY_UVLIST][i]!=0 || platform[KEY_TVLIST][i]!=0){
			var initRelevance=platform[KEY_ReLIST][i];
			console.log("initRelevance  ", initRelevance);
			var adjRelevance= (avgTotalVotes/((platform[KEY_TVLIST][i]-'0') +avgTotalVotes))*avgUniverseRelevance;
			console.log("adjRelevance 1 ", adjRelevance);
			
			adjRelevance+= (platform[KEY_TVLIST][i]/((platform[KEY_TVLIST][i]-'0') +avgTotalVotes))*initRelevance;
			console.log("adjRelevance 2 ", adjRelevance);
			
			platform[KEY_ReLIST][i]=adjRelevance;
		}
		else {
			platform[KEY_ReLIST][i]=avgUniverseRelevance;
		}
	}
	*/
	
	// the third way using lower bound of wilson confidence interval
	/*
	var n=0, r=0, p=0, q=0, l95a=0, u95a=0, num=0, denom=0;

	var z = 1.95996;
	var zsq = z*z;

	for(var i=0; i<numReviews; i++){
		if(platform[KEY_UVLIST][i]!=0 || platform[KEY_TVLIST][i]!=0){
			r = platform[KEY_UVLIST][i]-'0';
			n = platform[KEY_TVLIST][i]-'0';
			if(n<r) {
				console.log("r cannot be greater than n.")
			}
			if(Math.floor(r)<r) {console.log("r must be an integer value.")};
			if(Math.floor(n)<n) {console.log("n must be an integer value.")};

			p = Math.round((r/n)*10000)/10000;
			q = 1-p;

			// begin l95a
			num = (2*n*p)+zsq-(z*Math.sqrt(zsq+(4*n*p*q)));
			denom = 2*(n+zsq);
			l95a = num/denom;
			if(p==0) {l95a = 0};

			// begin u95a
			num = (2*n*p)+zsq+(z*Math.sqrt(zsq+(4*n*p*q)));
			denom = 2*(n+zsq);
			u95a = num/denom;
			if(p==1) {u95a = 1};
			platform[KEY_ReLIST][i]=l95a*5;
		}
		else {
			platform[KEY_ReLIST][i]=avgUniverseRelevance;
		}
	}
	*/
	cb(null, platform[KEY_ReLIST]);
}
		


// The main function that scraps the relevance data
// , calculates relevance for each of them and then
// writes them to a file for use in aggregation
// of feedback
collectGameRatings(function(err, result){
	if(err)console.log(err);
	else if (result!=null){
		//console.log(result);
		console.log('\n\n');
		//console.log(fifaData[KEY_FIFA14]);
		//console.log(fifaData[KEY_FIFA15]);
		
		console.log('abt to write');
		console.log(data);
		// It is important to convert the JSON Object into
		// string before writing to the file 
		// otherwise you will have only 'object' written in the output file
		fs.writeFile('fifaReviewData1.txt',JSON.stringify(data) , function (err) {
		  if (err) console.log(err);
		  else console.log('Written to file');
		});
	}
});
