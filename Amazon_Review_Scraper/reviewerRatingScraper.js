// use jsdom 3.x with nodejs
var jsdom = require('jsdom');

var inpFileName = './' + process.argv[2];
var outFileName = './' + process.argv[3];
var numLines = process.argv[4];
var links=[];

function scrapeRanking(reviewerPageLink, cb){
	jsdom.env({
		url:reviewerPageLink,
		scripts:["http://code.jquery.com/jquery.js"],
		done: function(errors, window){
			if(errors!=null){
				console.log("Yo");
				console.log(reviewerPageLink);
				cb(errors);
			}
			else{
				var $ = window.jQuery;
				if($("div.bio-expander").length > 0){

					var rankingString = $("div.bio-expander").find("div.a-row.a-spacing-small.a-spacing-top-small").find("div.a-row.a-spacing-small").children("div.a-row").find("span.a-size-base").text();
					rankingString = rankingString.substring(1);
				}			
				else{
					rankingString="0";
				}
				var ranking = convertFromCommaNotationToInt(rankingString);						
				cb(null, ranking);
			}
		}

	});
}

function convertFromCommaNotationToInt(str){
	var ans = 0;
	for(var i= 0; i<str.length; i++){
		if(str.charAt(i)==','){
			continue;
		}
		else{
			var digit = str.charAt(i) - '0';
			ans = 10*ans + digit;
		}
	}
	return ans;
}

function scrapeSingleReviewerStep(ct, cb){
	var reviewIdx = numLines - ct;
	var reviewerPageLink = links[reviewIdx];

	if(reviewerPageLink == "http://www.amazon.comundefined"){
		cb(null, "-1");
	}
	else{
		scrapeRanking(reviewerPageLink, function(err, result){
			if(err){
				cb(err);
			}
			else{
				cb(null, result);
			}
		});
	}

}

function reviewerFinalStep(cb){
	cb(null, "done");
}

function syncTraversal(ct, traversalStep, cb) {
  if(ct>0) {
    traversalStep( ct, function(err, result) {
      if(err)cb(err);
      else {
		  ct--;
		  console.log(result)
		  return syncTraversal(ct, traversalStep, cb);
	  }
    });

  } else {

    return reviewerFinalStep(cb);
  }
}


var lineReader = require('readline').createInterface({
  terminal:false , input: require('fs').createReadStream(inpFileName)
});

var ct = 0;
lineReader.on('line', function (line) {
	ct++;
	links.push(line);
	if(ct == numLines){
		syncTraversal(numLines, scrapeSingleReviewerStep, function(err, result){
			if(err){
				console.log(err);
			}
			else{
				//console.log(result);
			}
		});
	}
});

