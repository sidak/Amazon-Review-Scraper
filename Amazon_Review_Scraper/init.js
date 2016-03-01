var fs = require('fs');
var data = require('./Input_files/fifaAmazonDataFormat_Feb2016_Rep_Verified');

var outputFileName = './' + process.argv[2];
var currentDate = Date.parse ("March 1, 2016");

var inpFileBaseName = "./Input_files/Review_Scraping_More_Contents/Fifa/All_Data/"
var reviewerRatingFileBaseName = "Input_files/Review_Scraping_More_Contents/Fifa/Reviewer_Ratings/Complete/reviewerRating_"

var NUM_VERSIONS = 2;
var NUM_PLATFORMS = 4;

var KEY_FIFA14 = "fifa14";
var KEY_FIFA15 = "fifa15";

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


	
var versions = [KEY_FIFA14, KEY_FIFA15];
var platforms= [KEY_PS3, KEY_PS4, KEY_XBOX1, KEY_XBOX360];

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
						root:"fifa",
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

	if(game==KEY_FIFA14){
		parent=KEY_FIFA14;
	}
	else {
		parent=KEY_FIFA15;
	}
	
	name =gamePlatform[KEY_GAME_PLATFORM_NAME];
	ratings_int = gamePlatform[KEY_RATING_LIST];
	

	relevance= gamePlatform[KEY_RELEVANCE_LIST];
	
	dates= gamePlatform[KEY_REVIEW_DATES_LIST];
	
	var obj = createNewServiceObject(parent, name, ratings_int, relevance, dates, children);
	console.log(obj);
	//data.push(JSON.stringify(obj));
	outputData.push(obj);
	cb(null, 'data obj written to file');
	
}

function createNewServiceObject(parent, name, ratings, relevance, dates, children){
	var obj = {
					"name":name,
					"agg_rating_score":0,
					"own_rating_cont":0,
					"children_rating_cont":0,
					"own_wmean_rating":0,						
					"universe_wmean_rating":0,
					"consumer_ratings":ratings,
					"consumer_relevance":relevance,
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
	performScaling(platform[KEY_RELEVANCE_LIST]);
	console.log("atfer scaling");
	console.log(platform[KEY_RELEVANCE_LIST][0],platform[KEY_RELEVANCE_LIST][1]);
	
	console.log("In calc relevance, logging dates");
	console.log(platform[KEY_REVIEW_DATES_LIST]);
	doTimeAdjustment(platform[KEY_RELEVANCE_LIST], platform[KEY_UPVOTES_LIST],
					platform[KEY_TOTAL_VOTES_LIST], platform[KEY_REVIEW_DATES_LIST] ,-1);
	
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

function calcRelevanceForAll(isReviewerRating, filterVerified, cb){
	if(isReviewerRating){
		//calcRepStats();
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