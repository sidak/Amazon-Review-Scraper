var scraper= require('./reviewScraper');
var serviceData= require('./Input_files/officeAmazonData');
var fs = require('fs');


var currentDate = Date.parse ("June 30, 2015");

var refBase= "cm_cr_pr_btm_link_";
		
var KEY_NAME="name";
var KEY_ID="id";

var KEY_SERVICE="office";
var KEY_SERVICE_VERSION1="office2013";
var KEY_SERVICE_VERSION2="office365";
var KEY_UVLIST="upvotesList";
var KEY_TVLIST="totalVotesList";
var KEY_RLIST="ratingList";
var KEY_ReLIST="relevanceList";
var KEY_DLIST="reviewDatesList";
var KEY_SERVICE_PLATFORM_NAME="name";
var KEY_PAGES="pages";

// Take care of these constants when plugging
// in some other example
// Further the naming of some of the variables
// has to be made independent of the kind of 
// example we are using - ex: iphone

var NUM_VERSIONS=2;
var NUM_PLATFORMS=
				{
					"office2013":3, 
					"office365":4
				};

//var NUM_PAGES_TO_SCRAPE=2;
var BASE_SCORE=2.5;

var upvotesList=[];
var totalVotesList=[];
var ratingList=[];
var reviewDatesList=[];

var sumTotalVotes=0;
var relevanceScores=[];

var serviceVersions=["office2013","office365"];

// Final data to be written in a file
var data=[];

// Async task for collecting the reviews on a page 
// numbered as (2-ct)+1 for service and idx as the platform

var collectPageRatingStep= function (ct,service, idx, cb) {
	var normCt= (serviceData[service][idx][KEY_PAGES]-ct)+1;
	var ref=refBase+normCt;
	var pageNumber=normCt;

	console.log("let's scrap the page num "+pageNumber+"in the service " +service+ "with platform idx "+idx+'\n');
	//console.log(serviceData[service]);
	scraper.scrape(serviceData[service][idx][KEY_NAME],serviceData[service][idx][KEY_ID], ref , pageNumber, function(err, result){
		if(err){
			console.log("there was an error ", err);
			cb(err);
		}
		else if (result!=null){
			//console.log("before adding the result\n");
			//console.log(serviceData[service][idx]);
			
			//Concatenate the initial votes list with the one scraped now
			serviceData[service][idx][KEY_UVLIST]=serviceData[service][idx][KEY_UVLIST].concat(result[0]);
			serviceData[service][idx][KEY_TVLIST]=serviceData[service][idx][KEY_TVLIST].concat(result[1]);
			serviceData[service][idx][KEY_RLIST]=serviceData[service][idx][KEY_RLIST].concat(result[2]);
			serviceData[service][idx][KEY_DLIST]=serviceData[service][idx][KEY_DLIST].concat(result[3]);

			console.log("after adding the result\n");
			//console.log(serviceData[service][idx]);
			//console.log('Now going to my cb \n\n');
			cb(null,  result);
		}
	});

}

// Final task 
function final(cb, service, idx) { 
	calculateRelevance(service, idx, function(err, result){
		if(err)cb(err);
		else if (result!=null){
			console.log('Done scraping the number of elements you said and also calculated the relevance scores for them ');
			// write the data to file
			writeDataForservicePlatform(service, idx, function(err, result){
				if(err)cb(err);
				else if(result!=null){
					cb(null, result);
				}
			});
		}
		
	});
	
}

// Async traversal of given "ct" of pages for "service" 
// with platform as "idx" and scrape the most helpful reviews
// on these pages
function asyncTraversal(ct, service,idx, traversalStep, cb) {
  if(ct>0) {
    traversalStep( ct, service, idx, function(err, result) {
      if(err)cb(err);
      else {
		  ct--;
		  console.log(result)
		  return asyncTraversal(ct, service, idx, traversalStep, cb);
	  }
    });
  } else {
    return final(cb,service, idx);
  }
}
// Collect ratings for all versions
// of the service and for the different platforms it runs on
function collectServiceRatings(cb){
	// write the metadata in the file
	data.push(
				{ 
						name:"meta",						
						root:KEY_SERVICE,
				}
			);
	
	// There are 2 versions that we are considering
	// office2013 and office365
	for(var i=0; i<NUM_VERSIONS; i++){
		(function(){
			var service=serviceVersions[i];
			collectPlatformRatings (service, function(err, result){
				if(err)cb(err);
				else if (result!=null){
					cb(null, result);
				}
			});
						
		})();
	}
}

// Collect ratings for the different platforms
// for the given service
function collectPlatformRatings(service, cb){
	for(var j=0; j<NUM_PLATFORMS[service]; j++){
		(function(){
			var idx=j;
			// Collect reviews on only the number of pages for 
			// given service and platform as idx specified in 
			// the iphoneAmazonData.js file 
			asyncTraversal(serviceData[service][idx][KEY_PAGES],service, idx, collectPageRatingStep,function(err, result){
				if(err)cb(err);
				else if (result!=null){
					cb(null,result);
				}
			});
		})();
	}
}
function writeDataForservicePlatform(service, idx, cb){
	var servicePlatform= serviceData[service][idx];
	console.log("In writing data for service platform");
	console.log(servicePlatform);
	var parent;
	var children=[];
	var ratings_char;
	var ratings_int=[];
	var relevance;
	var name;
	//var dates;
	if(service==KEY_SERVICE_VERSION1){
		parent=KEY_SERVICE_VERSION1;
	}
	else {
		parent=KEY_SERVICE_VERSION2;
	}
	
	name =servicePlatform[KEY_SERVICE_PLATFORM_NAME];
	ratings_char = servicePlatform[KEY_RLIST];
	for(var i=0; i<ratings_char.length; i++){
		ratings_int.push(ratings_char[i]-'0');
	}
	relevance= servicePlatform[KEY_ReLIST];
	
	//check if dates are not strings and rather numbers
	//dates= servicePlatform[KEY_DLIST];
	// There is actually no need to write the dates in the file 
	// They are only used for the calculation of relevance
	
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
					//"review_dates":dates,
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
	var avgVoteTime = sumVoteTime/(numReviews);
	console.log("avgVoteTime " , avgVoteTime);
	
	return avgVoteTime;
}
function calculateRelevance(service, idx,cb){
	console.log("in calc relevance");
	console.log(service);
	console.log(idx);
	var platform = serviceData[service][idx];
	var zeroHelpfulReviews=0;
	var numReviews= platform[KEY_RLIST].length;
	var sumUpvotes=0;
	var sumDownvotes=0;
	var sumTotalVotes=0;
	var maxTotalVotes=0;
	
	for(var i=0; i<numReviews; i++){
		platform[KEY_RLIST][i] = platform[KEY_RLIST][i]-'0';
		//platform[KEY_TVLIST][i]).replace(',', '');
		if(i===0)console.log("check");
		if(i===0)console.log(platform[KEY_TVLIST][i]);
		var x = "" + platform[KEY_TVLIST][i];
		x=x.replace(/\,/g, '');
		var y = parseFloat(x); 
		platform[KEY_TVLIST][i] = y;
		if(i===0)console.log(platform[KEY_TVLIST][i]);
		var x1 = "" + platform[KEY_UVLIST][i];
		x1=x1.replace(/\,/g, '');
		var y1 = parseFloat(x1); 
		platform[KEY_UVLIST][i] = y1;
	}
	// Calculate sum of upvotes, downvotes, totalvotes
	// , num of ZHR and also calculate the maxvotes
	console.log("check out the 0th element", platform[KEY_UVLIST][0]);
	
	for(var i=0; i<numReviews; i++){
		if(platform[KEY_UVLIST][i]==0 && platform[KEY_TVLIST][i]==0)zeroHelpfulReviews++;
		sumUpvotes += platform[KEY_UVLIST][i];
		sumDownvotes += platform[KEY_TVLIST][i]-platform[KEY_UVLIST][i];
		sumTotalVotes += platform[KEY_TVLIST][i];
		if(maxTotalVotes < platform[KEY_TVLIST][i]){
			maxTotalVotes = platform[KEY_TVLIST][i];
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
			platform[KEY_ReLIST].push(BASE_SCORE* ( 1 + 
					(2*platform[KEY_UVLIST][i]-platform[KEY_TVLIST][i])/platform[KEY_TVLIST][i]));
		}
	}
	
	var avgUniverseRelevance= calcAvgUniversalRelevance1(platform[KEY_ReLIST], platform[KEY_UVLIST], platform[KEY_TVLIST]);
	
	console.log("avgTotalVotes ", avgTotalVotes);
	console.log("avgUniverseRelevance ", avgUniverseRelevance);
	// calculate the adjusted relevance scores for each of them
	
	
	// getWt
	var wtList = calcWt(platform[KEY_TVLIST]);
	
	// keep faith on pass by value (call by sharing)
	calculateAdjustedRelevance(platform[KEY_ReLIST], platform[KEY_UVLIST], 
								platform[KEY_TVLIST], wtList,avgUniverseRelevance);
	
	console.log("before scaling");
	console.log(platform[KEY_ReLIST][0],platform[KEY_ReLIST][1]);
	performScaling(platform[KEY_ReLIST]);
	console.log("atfer scaling");
	console.log(platform[KEY_ReLIST][0],platform[KEY_ReLIST][1]);
	
	
	//doTimeAdjustment(platform[KEY_ReLIST], platform[KEY_UVLIST],
	//				platform[KEY_TVLIST], platform[KEY_DLIST] ,-1);
	
	var sumReviews=0;
	for( var i=0 ; i<numReviews; i++){
		sumReviews += platform[KEY_ReLIST][i];
	}
	var avgReviews= sumReviews/ numReviews;
	console.log(" here is the average \n ", avgReviews);
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
collectServiceRatings(function(err, result){
	if(err)console.log(err);
	else if (result!=null){
		//console.log(result);
		console.log('\n\n');
		//console.log(serviceData[KEY_SERVICE_VERSION1]);
		//console.log(serviceData[KEY_SERVICE_VERSION2]);
		
		console.log('abt to write');
		console.log(data);
		// It is important to convert the JSON Object into
		// string before writing to the file 
		// otherwise you will have only 'object' written in the output file
		fs.writeFile('officeReviewData_no_time.txt',JSON.stringify(data) , function (err) {
		  if (err) console.log(err);
		  else console.log('Written to file');
		});
	}
});
