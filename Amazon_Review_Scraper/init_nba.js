var fs = require('fs');
var data = require('./Input_files/nbaAmazonDataFormat_Feb2016_Rep_Verified');
var BigNumber = require('bignumber.js');

var outputFileName = './' + process.argv[2];
var currentDate = Date.parse ("March 1, 2016");

var inpFileBaseName = "./Input_files/Review_Scraping_More_Contents/Nba/All_Data/"
var reviewerRatingFileBaseName = "Input_files/Review_Scraping_More_Contents/Nba/Reviewer_Ratings/Complete/reviewerRating_"

var NUM_VERSIONS = 2;
var NUM_PLATFORMS = 4;

var KEY_NBA14 = "nba14";
var KEY_NBA15 = "nba15";

var KEY_PS3 = "ps3";
var KEY_PS4 = "ps4";
var KEY_XBOX1 = "xbox1";
var KEY_XBOX360 = "xbox360";

var KEY_NAME="name";

var KEY_RATING_LIST = "ratingList";
var KEY_UPVOTES_LIST = "upvotesList";
var KEY_TOTAL_VOTES_LIST = "totalVotesList";
var KEY_REVIEW_DATES_LIST = "reviewDatesList";
var KEY_VERIFIED_LIST= "verifiedList";
var KEY_REVIEWER_RANKING_LIST = "reviewerRankingList";
var KEY_RELEVANCE_LIST = "relevanceList";

var ONLY_VERIFIED = 0;
var ONLY_NONVERIFIED = 1;
var BOTH_VERIFIED_NONVERIFIED = 2;
var BASE_SCORE=2.5;

var KEY_GAME_PLATFORM_NAME="name";

var outputData =[];

var MEAN_UNIVERSAL_REVIEWER_RANK = 13493337.5494;
var MEAN_FIFA_REVIEWER_RANK = 14594956.832;
var MEAN_NBA_REVIEWER_RANK = 12405643.7581;

var INT_MEAN_UNIVERSAL_REVIEWER_RANK = 13493338;

var versions = [KEY_NBA14, KEY_NBA15];
var platforms= [KEY_PS3, KEY_PS4, KEY_XBOX1, KEY_XBOX360];

var IS_SCALING = true;
var IS_ZHR_TIME_ADJUSTMENT = false;
var FILTER_ZHR = true;

var propertyNames = [KEY_RATING_LIST, KEY_UPVOTES_LIST, KEY_TOTAL_VOTES_LIST, KEY_REVIEW_DATES_LIST, KEY_VERIFIED_LIST, KEY_REVIEWER_RANKING_LIST, KEY_RELEVANCE_LIST];

function platformFinalStep(game, idx, cb) { 
	console.log("In plaform final step for game "+ game + " and idx is "+ idx);
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


function calcGameRelevance(cb){
	// write the metadata in the file
	var gameScraped = 0;
	outputData.push(
				{ 
						name:"meta",						
						root:"nba",
				}
			);
	
	// There are 2 versions that we are considering
	// Fifa14 and Fifa15
	for(var i=0; i<NUM_VERSIONS; i++){
		(function(){
			var game=versions[i];
			calcPlatformRelevance (game, function(err, result){
				if(err)cb(err);
				else if (result!=null){
					gameScraped ++;
					if(gameScraped == NUM_VERSIONS){
						cb(null, result);	
 					}
				}
			});
						
		})();
	}
}

function calcPlatformRelevance(game, cb){
	var platformScraped = 0;
	for(var j=0; j<NUM_PLATFORMS; j++){
		(function(){
			var idx=j;
			platformFinalStep(game, idx, function(err, result){
				if(err)cb(err);
				else if (result!=null){
					platformScraped ++;
 					if(platformScraped == NUM_PLATFORMS){ 
 						cb(null,result);
 					}
				}
			});
		})();
	}
}
function updateZeroReviewerRankings(game, idx, cb){
	var gamePlatform= data[game][idx];
	for(var i=0; i<gamePlatform[KEY_REVIEWER_RANKING_LIST].length; i++){
		if(gamePlatform[KEY_REVIEWER_RANKING_LIST][i] == 0){
			gamePlatform[KEY_REVIEWER_RANKING_LIST][i] = INT_MEAN_UNIVERSAL_REVIEWER_RANK;
		}

		if(i== (gamePlatform[KEY_REVIEWER_RANKING_LIST].length-1)){
			cb(null, gamePlatform[KEY_REVIEWER_RANKING_LIST]);
		}
	}
}
function writeDataForGamePlatform(game, idx, cb){
	// uncomment lines for relevance and dates

	var gamePlatform= data[game][idx];
	console.log("In writing data for game platform");
	console.log(gamePlatform);
	var parent;
	var children=[];
	var ratings_int;
	var relevance=[];
	var reviewerRanking;
	var name;
	var dates;

	if(game==KEY_NBA14){
		parent=KEY_NBA14;
	}
	else {
		parent=KEY_NBA15;
	}
	
	name =gamePlatform[KEY_GAME_PLATFORM_NAME];
	ratings_int = gamePlatform[KEY_RATING_LIST];
	

	relevance= gamePlatform[KEY_RELEVANCE_LIST];
	
	// dates are required for sampling the data at different intervals by RaaS API
	dates= gamePlatform[KEY_REVIEW_DATES_LIST];
	
	updateZeroReviewerRankings(game, idx, function(err, result){
		if(err)cb(err);
		else{
			console.log(result);
			reviewerRanking = result;
			var obj = createNewServiceObject(parent, name, ratings_int, relevance, reviewerRanking, dates, children);
			console.log(obj);
			outputData.push(obj);
			cb(null, 'data obj written to file');
		}
	});
	
}

function createNewServiceObject(parent, name, ratings, relevance, reviewerRanking, dates, children){
	var obj = {
					"name":name,
					"agg_rating_score":0,
					"own_rating_cont":0,
					"children_rating_cont":0,
					"own_wmean_rating":0,						
					"universe_wmean_rating":0,
					"consumer_ratings":ratings,
					"consumer_relevance":relevance,
					"reviewer_ranking": reviewerRanking,
					"review_dates":dates,
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
		if(reList[i]>maxRelevance){
			maxRelevance=reList[i];
		}
	}
	
	for(var i=0; i<numReviews; i++){
		var scaledRelevance= (reList[i]/maxRelevance)*5;
		reList[i]=scaledRelevance;
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

function calcAvgUniversalRelevance2(iReList, uvList, tvList){
	var sumVoteFraction=0;
	var numNormalReviews=0;
	var numZHR=0;
	for(var i=0; i<uvList.length; i++){
		if(uvList[i]==0 && tvList[i]==0){
			numZHR++;
		}
		else {
			console.log("iReList i ", iReList[i]);
			sumVoteFraction+=(iReList[i]-2.5);
		}
	}
	numNormalReviews= uvList.length - numZHR;
	
	console.log("numNormal Reviews are");
	console.log(numNormalReviews);
	console.log("sumVoteFraction ", sumVoteFraction);
	var avgURe= 2.5 + (sumVoteFraction/numNormalReviews);
	console.log("avgURe is ",avgURe);
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
function doTimeAdjustment(reList, uvList, tvList, dList, timeStep){
	if(timeStep===-1){
		timeStep= calcTimeStep(reList, uvList, tvList, dList);
	}
	var numReviews=uvList.length;

	for(var i=0;  i<numReviews; i++){
		// if it is ZHR
		if(uvList[i]===0 && tvList[i]===0){
			//console.log("before ta ", reList[i]);
			var daysPassed = (currentDate-dList[i])/86400000
			if(Math.ceil(daysPassed/timeStep) > 1 ){
				reList[i]= reList[i]/((daysPassed/timeStep));
			}
			console.log("after ta for ZHR", reList[i], " with daysPassed = ", daysPassed);
		}
	}
}
function calcTimeStep(reList, uvList, tvList, dList){
	var numReviews=uvList.length;
	var daysPassed=[];
	var numZHR=0;
	for(var i=0; i<numReviews; i++){
		daysPassed[i]= (currentDate-dList[i])/86400000;
		if(uvList[i]===0 && tvList[i]===0)numZHR++;
	}
	console.log("number of zhr is ", numZHR);
	var sumVoteTime=0;
	for(var i=0; i<numReviews; i++){
		if(tvList[i]!==0){
			sumVoteTime+= (daysPassed[i]/tvList[i]);
		} 
	}
	
	console.log("sumVoteTime " , sumVoteTime);
	var avgVoteTime = sumVoteTime/(numReviews-numZHR);
	console.log("avgVoteTime " , avgVoteTime);
	
	return avgVoteTime;
}
function calculateRelevance(game, idx,cb){
	console.log("in calc relevance");
	console.log(game);
	console.log(idx);
	var platform = data[game][idx];
	var zeroHelpfulReviews=0;
	var numReviews= platform[KEY_RATING_LIST].length;
	var sumUpvotes=0;
	var sumDownvotes=0;
	var sumTotalVotes=0;
	var maxTotalVotes=0;
	
	/*
	for(var i=0; i<numReviews; i++){
		
		platform[KEY_RATING_LIST][i] = platform[KEY_RATING_LIST][i]-'0';
		platform[KEY_TOTAL_VOTES_LIST][i] = platform[KEY_TOTAL_VOTES_LIST][i]-'0';
		platform[KEY_UPVOTES_LIST][i] = platform[KEY_UPVOTES_LIST][i]-'0';
	}
	*/
	// Calculate sum of upvotes, downvotes, totalvotes
	// , num of ZHR and also calculate the maxvotes
	
	if(FILTER_ZHR){
		var filteredRatingList = [];
		var filteredUpvotesList = [];
		var filteredTotalVotesList = [];
		var filteredReviewDatesList = [];
		var filteredReviewerRankingList = [];
		var filteredVerifiedList=[];
		var filteredNumReviews = 0;

		for(var i=0; i<numReviews; i++){
			if(!(platform[KEY_UPVOTES_LIST][i]==0 && platform[KEY_TOTAL_VOTES_LIST][i]==0)){
				filteredNumReviews ++;
				filteredRatingList.push(platform[KEY_RATING_LIST][i]);
				filteredUpvotesList.push(platform[KEY_UPVOTES_LIST][i]);
				filteredTotalVotesList.push(platform[KEY_TOTAL_VOTES_LIST][i]);
				filteredReviewDatesList.push(platform[KEY_REVIEW_DATES_LIST][i]);
				filteredReviewerRankingList.push(platform[KEY_REVIEWER_RANKING_LIST][i]);
				filteredVerifiedList.push(platform[KEY_VERIFIED_LIST][i]);
			}
		}

		numReviews = filteredNumReviews;
		platform[KEY_RATING_LIST] = filteredRatingList;
		platform[KEY_UPVOTES_LIST] = filteredUpvotesList;
		platform[KEY_TOTAL_VOTES_LIST] = filteredTotalVotesList;
		platform[KEY_REVIEW_DATES_LIST] = filteredReviewDatesList;
		platform[KEY_REVIEWER_RANKING_LIST] = filteredReviewerRankingList;
		platform[KEY_VERIFIED_LIST] = filteredVerifiedList;
			
	}

	for(var i=0; i<numReviews; i++){
		if(platform[KEY_UPVOTES_LIST][i]==0 && platform[KEY_TOTAL_VOTES_LIST][i]==0)zeroHelpfulReviews++;
		sumUpvotes+= platform[KEY_UPVOTES_LIST][i];
		sumDownvotes+= platform[KEY_TOTAL_VOTES_LIST][i]-platform[KEY_UPVOTES_LIST][i];
		sumTotalVotes+= platform[KEY_TOTAL_VOTES_LIST][i];
		if(maxTotalVotes<platform[KEY_TOTAL_VOTES_LIST][i]){
			maxTotalVotes=platform[KEY_TOTAL_VOTES_LIST][i];
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
		if(platform[KEY_UPVOTES_LIST][i]==0 && platform[KEY_TOTAL_VOTES_LIST][i]==0){
			platform[KEY_RELEVANCE_LIST].push(avgConstZHRRelevance);
		}
		else {
			platform[KEY_RELEVANCE_LIST].push(BASE_SCORE* ( 1 + 
					(2*platform[KEY_UPVOTES_LIST][i]-platform[KEY_TOTAL_VOTES_LIST][i])/platform[KEY_TOTAL_VOTES_LIST][i]));
		}
	}
	
	var avgUniverseRelevance= calcAvgUniversalRelevance1(platform[KEY_RELEVANCE_LIST], platform[KEY_UPVOTES_LIST], platform[KEY_TOTAL_VOTES_LIST]);
	
	console.log("avgTotalVotes ", avgTotalVotes);
	console.log("avgUniverseRelevance ", avgUniverseRelevance);
	// calculate the adjusted relevance scores for each of them
	
	
	// getWt
	var wtList = calcWt(platform[KEY_TOTAL_VOTES_LIST]);
	
	// keep faith on pass by value (call by sharing)
	calculateAdjustedRelevance(platform[KEY_RELEVANCE_LIST], platform[KEY_UPVOTES_LIST], 
								platform[KEY_TOTAL_VOTES_LIST], wtList,avgUniverseRelevance);
	
	console.log("before scaling");
	console.log(platform[KEY_RELEVANCE_LIST][0],platform[KEY_RELEVANCE_LIST][1]);
	if(IS_SCALING) performScaling(platform[KEY_RELEVANCE_LIST]);
	console.log("atfer scaling");
	console.log(platform[KEY_RELEVANCE_LIST][0],platform[KEY_RELEVANCE_LIST][1]);
	
	console.log("In calc relevance, logging dates");
	console.log(platform[KEY_REVIEW_DATES_LIST]);
	if(IS_ZHR_TIME_ADJUSTMENT) doTimeAdjustment(platform[KEY_RELEVANCE_LIST], platform[KEY_UPVOTES_LIST], platform[KEY_TOTAL_VOTES_LIST], platform[KEY_REVIEW_DATES_LIST] ,-1);

	
	var sumRelevance=0;
	var sumRating=0;
	for( var i=0 ; i<numReviews; i++){
		sumRelevance += platform[KEY_RELEVANCE_LIST][i];
		sumRating += platform[KEY_RATING_LIST][i];
	}
	var avgRating = sumRating/numReviews;
	var avgRelevance= sumRelevance/ numReviews;
	console.log(" here is the average of all relevance scores \n ", avgRelevance);
	console.log(" here is the average of all rating scores \n ", avgRating);
	
	cb(null, platform[KEY_RELEVANCE_LIST]);
}

//var sumRep=0;
//var numRep =0;

function readDataExceptReviewerRanking(version, platform, cb){

	var ct = 0;

	var platformIdx;

	for(var i=0; i<platforms.length; i++){
		if(platform == platforms[i]){
			platformIdx = i;
			break;
		}
	}

	var inputFileName = inpFileBaseName + version + "_" + platform + "_all.txt";

	var lineReader = require('readline').createInterface({
		terminal:false , input: require('fs').createReadStream(inputFileName)
	});

	lineReader.on('line', function(line){
		//console.log(line)
		var num = 0;
		for(var k =0; k<line.length; k++){
			var dig = line[k]-'0';
			num = num*10 + dig;
		}

		if(ct%6 != 0) data[version][platformIdx][propertyNames[ct%6 - 1]].push(num);
		ct++;

	});

	lineReader.on('close', function(){
		console.log("for game " + version + " and platform  "+ platform + "the rest data is ");
		//console.log(data[version][platformIdx][propertyNames[4]]);
		console.log("done readDataExceptReviewerRanking");
		readReviewerRanking(version, platform, function(err, result){
			if(err) console.log(err);
			else{
				console.log(result);
				cb(null, "done bitch readDataFromFiles " + version + " " + platform);
			}
		});
		
	});

}

function readReviewerRanking(version, platform, cb){


	var platformIdx;

	for(var i=0; i<platforms.length; i++){
		if(platform == platforms[i]){
			platformIdx = i;
			break;
		}
	}

	var inputFileName = reviewerRatingFileBaseName + version + "_" + platform + ".txt";

	var lineReader = require('readline').createInterface({
		terminal:false , input: require('fs').createReadStream(inputFileName)
	});

	lineReader.on('line', function(line){
		//console.log(line)
		var num = 0;
		for(var k =0; k<line.length; k++){
			var dig = line[k]-'0';
			num = num*10 + dig;
		}
		
		data[version][platformIdx][propertyNames[5]].push(num);

	});

	lineReader.on('close', function(){
		console.log("for game " + version + " and platform  "+ platform + "the reviewerRanking is ");
		//console.log(data[version][platformIdx][propertyNames[5]]);
		
		cb(null, "done readReviewerRanking");
	});

}





function readDataFromFiles(cb){
	var scraped = 0;
	for(var i=0; i<NUM_VERSIONS; i++){
		(function(idx_i){
			
			for(var j=0; j<NUM_PLATFORMS; j++){
				(function(idx_j){
					var version = versions[idx_i];
					var platform = platforms[idx_j]
					readDataExceptReviewerRanking(version, platform, function(err, result){
						if(err){
							console.log(err);
						}
						else{
							console.log(result);
							scraped ++;
							if(scraped == NUM_PLATFORMS*NUM_VERSIONS){
								cb(null, "done readDataFromFiles all");
							}
						}
					});
				}(j));
			}
		}(i));
	}
}

function removeElement(arrayName, arrayElement){
    for(var i=0; i<arrayName.length;i++ ){ 
        if(arrayName[i]==arrayElement)
            arrayName.splice(i,1); 
    } 
}


function asyncTraversal1(ct, game,idx, traversalStep, cb) {
  console.log(" ct is "+ ct);
  if(ct>0) {
    traversalStep( ct, game, idx, function(err, result) {
      if(err)cb(err);
      else {
		  ct--;
		  console.log(result)
		  return asyncTraversal1(ct, game, idx, traversalStep, cb);
	  }
    });

  } else {

    return filterFinalStep(cb, game, idx);
  }
}

function filterFinalStep(game, idx, isVerified, cb){
	var obj = data[game][idx];
	var newObj ={};

	newObj[KEY_VERIFIED_LIST]=[];
	newObj[KEY_RATING_LIST]=[];
	newObj[KEY_REVIEW_DATES_LIST]=[];
	newObj[KEY_UPVOTES_LIST]=[];
	newObj[KEY_TOTAL_VOTES_LIST]=[];
	newObj[KEY_REVIEWER_RANKING_LIST]=[];
	
	var ct =0;
	var len = obj[KEY_VERIFIED_LIST].length;
	for(var i=0; i<len; i++){
		if(isVerified == ONLY_VERIFIED){
			if(obj[KEY_VERIFIED_LIST][i]==1){

				newObj[KEY_VERIFIED_LIST].push(obj[KEY_VERIFIED_LIST][i]);
				newObj[KEY_RATING_LIST].push(obj[KEY_RATING_LIST][i]);
				newObj[KEY_REVIEW_DATES_LIST].push(obj[KEY_REVIEW_DATES_LIST][i]);
				newObj[KEY_UPVOTES_LIST].push(obj[KEY_UPVOTES_LIST][i]);
				newObj[KEY_TOTAL_VOTES_LIST].push(obj[KEY_TOTAL_VOTES_LIST][i]);
				newObj[KEY_REVIEWER_RANKING_LIST].push(obj[KEY_REVIEWER_RANKING_LIST][i]);
				ct++;
			}
		}
		else if (isVerified == ONLY_NONVERIFIED){
			if(obj[KEY_VERIFIED_LIST][i]==0){

				newObj[KEY_VERIFIED_LIST].push(obj[KEY_VERIFIED_LIST][i]);
				newObj[KEY_RATING_LIST].push(obj[KEY_RATING_LIST][i]);
				newObj[KEY_REVIEW_DATES_LIST].push(obj[KEY_REVIEW_DATES_LIST][i]);
				newObj[KEY_UPVOTES_LIST].push(obj[KEY_UPVOTES_LIST][i]);
				newObj[KEY_TOTAL_VOTES_LIST].push(obj[KEY_TOTAL_VOTES_LIST][i]);
				newObj[KEY_REVIEWER_RANKING_LIST].push(obj[KEY_REVIEWER_RANKING_LIST][i]);
				ct++;
			}
		}

		if(i==(obj[KEY_VERIFIED_LIST].length-1)){
			console.log("game is "+ game + " and platform idx is " + idx);
			obj[KEY_VERIFIED_LIST] = newObj[KEY_VERIFIED_LIST];
			obj[KEY_UPVOTES_LIST]= newObj[KEY_UPVOTES_LIST];
			obj[KEY_TOTAL_VOTES_LIST] = newObj[KEY_TOTAL_VOTES_LIST];
			obj[KEY_RATING_LIST] = newObj[KEY_RATING_LIST];
			obj[KEY_REVIEWER_RANKING_LIST] = newObj[KEY_REVIEWER_RANKING_LIST];
			obj[KEY_REVIEW_DATES_LIST] = newObj[KEY_REVIEW_DATES_LIST];

			console.log("isVerified " + isVerified);
			console.log("ct of require is " + ct);
			console.log("num of reviews is "+ len);
			cb(null, newObj);
		}
	}
	// reassign
	// cb at last idx
}
function filterPlatformReviews(idx_i, isVerified, cb){
	var ct = 0;
	for(var j=0; j<NUM_PLATFORMS; j++){
		(function(){
			var idx=j;
			filterFinalStep(versions[idx_i], idx, isVerified, function(err, result){
				if(err)cb(err);
				else{
					ct ++;
					console.log(result);
 					if(ct == NUM_PLATFORMS){ 
 						cb(null, "yo done filtering platform Reviews");
 					}
				}
			});
		})();
	}
}
function filterReviews(isVerified,  cb){
	var ct =0; 
	for(var i=0; i<NUM_VERSIONS; i++){
		(function(idx_i){
			filterPlatformReviews(idx_i, isVerified, function(err, result){
				if(err) cb (err);
				else{
					ct++;
					console.log(result);
					if(ct==NUM_VERSIONS){
						cb(null, "done filtering all reviews");
					}
				}
			});
		}(i));
	}
}


function sumPlatform ( arr, cb){
	var res = {};
	console.log("In sumPlatform");
	var sum =0;
	var num =0;
	var added = 0;
	for(var i=0; i<arr.length; i++){
		
		if(arr[i]!=0){
			console.log("sum is " + sum);
			console.log("arr ele is "+ arr[i]);
			sum+=arr[i];
			added++;
			num++;
		}
		if(added==(arr.length)){
			res.sum = sum;
			res.num = num;
			console.log("the sum platform obj");
			console.log(res);
			cb(null, res);
		}
	}
}
function calcMean(cb){

	var res ={};
	var sumRep=0;
	var numRep =0;

	for(var i=0; i<NUM_VERSIONS; i++){
		(function(idx_i){
			for(var j=0; j<NUM_PLATFORMS; j++){
				(function(idx_j){
					
					var arr = data[versions[idx_i]][idx_j][KEY_REVIEWER_RANKING_LIST];
					sumPlatform(arr, function(err, result){
						sumRep += result.sum;
						numRep += result.num;
						console.log("sm is " + sumRep);
						console.log("nm is " + numRep);

						if(idx_i==(NUM_VERSIONS-1) && idx_j == (NUM_PLATFORMS-1)){
							res.sum = sumRep;
							res.num = numRep;
							console.log(res);
							cb(null, res);
						}
					});

				}(j));
			}
		}(i));
	}
	
}

// the one that we are using now
function calcMean1(cb){
	var sumRep=0;
	var numRep =0;
	var lenRep =0;
	var rep=[];
	for(var i=0; i<NUM_VERSIONS; i++){
		
		for(var j=0; j<NUM_PLATFORMS; j++){
			
			var arr = data[versions[i]][j][KEY_REVIEWER_RANKING_LIST];
			var s =0;
			var n =0;
			//console.log(arr[0] + arr[1]);
			console.log(typeof data[versions[i]][j][KEY_REVIEWER_RANKING_LIST][0]);
			for(var k=0; k<data[versions[i]][j][KEY_REVIEWER_RANKING_LIST].length; k++){
				if(arr[k]!=0){
					s = s + data[versions[i]][j][KEY_REVIEWER_RANKING_LIST][k];
					n ++;
				}
			}
			sumRep +=s;
			numRep +=n;
			lenRep += arr.length;
			console.log("version is " + i + " platform is " + j);

			console.log("s is " + s);
			console.log("n is " + n);
			console.log("sum is "+ sumRep);
			console.log("num is "+ numRep);
			console.log("len is "+ lenRep);						

				
			
		}
	
	}
	
	// have an input variable that chooses between these methods
	var meanRep = sumRep/numRep;
	console.log(meanRep);

	var mean_len = sumRep/lenRep;
	console.log(mean_len);

	calcDeviation(cb);

}

function calcDeviation(cb){
	
	var sumSquare = 0;
	var minRank = 999999999999999, maxRank = -1;
	
	var num = 0;

	for(var i=0; i<NUM_VERSIONS; i++){
	
		for(var j=0; j<NUM_PLATFORMS; j++){
			
			var arr = data[versions[i]][j][KEY_REVIEWER_RANKING_LIST];
			
			for(var k=0; k<arr.length; k++){
				if(arr[k]!=0){
					sumSquare += ((arr[k] - MEAN_UNIVERSAL_REVIEWER_RANK)*(arr[k] - MEAN_UNIVERSAL_REVIEWER_RANK));
						
					num ++;
				
					if( arr[k]> maxRank){
						maxRank = arr[k];
					}
					if(arr[k]<minRank){
						minRank = arr[k];
					}		
				}
			}

			console.log("version is " + i + " platform is " + j);

			console.log("sumSquare is " + sumSquare);
			console.log("num is " + num);
			
		}
		
	}

	console.log("sumSquare is " + sumSquare);
	console.log("num is " + num);
			
	var deviation = Math.sqrt(sumSquare/num);
	console.log("deviation is ");
	console.log(deviation);

	console.log("Min rank is " + minRank);
	console.log("Max rank is " + maxRank);
	
	cb(null, "yow");

}


function concatAll(cb){
	var rep =[];
	for(var i=0; i<NUM_VERSIONS; i++){
		
			for(var j=0; j<NUM_PLATFORMS; j++){
				
					rep= rep.concat(data[versions[i]][j][KEY_REVIEWER_RANKING_LIST]);
					if(i==(NUM_VERSIONS-1) && j == (NUM_PLATFORMS-1)){
						cb(null, rep );
					}
			}

		
	}
}
function calcMean2(cb){
	//var sumRep=0;
	//var numRep =0;
	var rep=[];
	concatAll(function(err, result){
		if(err)cb(err);
		else{
			rep = result;
			var sum =0, n=0;
			for(var i=0; i<rep; i++){
				if(rep[i]!=0){
					sum+= rep[i];
					n++;
				}
			}
			console.log(sum);
			console.log(n);
			console.log(sum/n);
			console.log(rep);
		}
	});
	
	

}
function calcRelevanceForAll(isReviewerRating, filterVerified, cb){
	if(isReviewerRating){
		calcMean1(function(err, result){
			if(err)console.log(err);
			else cb(null, result);
		});

	}
	else{
		console.log("in calc relevance");

		if(filterVerified==  ONLY_VERIFIED || filterVerified== ONLY_NONVERIFIED){

			filterReviews(filterVerified, function(err, result){
				if(err) cb(err);
				else{
					console.log(result);
					calcGameRelevance(function(err, result){
						if(err)cb(err);
						else{
							cb(null, "done calcRelevanceForAll");
						}
					});
				}
			});
		}
		else{
			console.log("in calc relevance");
			calcGameRelevance(function(err, result){
				if(err)cb(err);
				else{
					cb(null, "done calcRelevanceForAll");
				}
			});
		}

	}
}

function sortByProperty(prop){
   return function(a,b){
      if( a[prop] > b[prop]){
          return 1;
      }else if( a[prop] < b[prop] ){
          return -1;
      }
      return 0;
   }
}

function writeDataToFile(cb){
	outputData.sort(sortByProperty(KEY_NAME));
	console.log(outputData);

	fs.writeFile(outputFileName, JSON.stringify(outputData, null, '\t') , function (err) {
		if (err) cb(err);
		else {
			console.log('Written to file');
			cb(null, "done writeFile");
		}
	});
}

readDataFromFiles(function(err, result){
	if(err){
		console.log(err);
	}
	else{
		outputData=[];
		
		calcRelevanceForAll(false, BOTH_VERIFIED_NONVERIFIED, function(err, result){
			if(err){
				console.log(err);
			}
			else{
				writeDataToFile(function(err, result){
					if(err){
						console.log(err);
					}
					else{
						console.log("Done everything");
					}
				});
			}
		});
	}
});