// use jsdom 3.x with nodejs
var jsdom = require('jsdom');
var exports = module.exports = {};

exports.scrape = function(name, id, ref, page, cb) {
    // The url, scripts, done keywords are optional 
    // but if you use them enclose them in curly braces 
    jsdom.env({
        url: "http://www.amazon.com/"+name+"/product-reviews/" + id +
				"/ref=" +ref+ "?ie=UTF8&sortBy=helpful&reviewerType=all_reviews&" +
				"formatType=all_formats&filterByStar=all_stars&pageNumber=" + page,
        scripts: ["http://code.jquery.com/jquery.js"],
        done: function (errors, window) {
			if(errors!=null){
				cb(errors);
			}
			var $ = window.jQuery;
			var upvotesList=[], totalVotesList=[], ratingList=[], reviewDatesList=[];

			//console.log(errors);
			//console.log("hello");
			//console.log("yhuj");
			
			$("div#cm_cr-review_list")
				.children('div.a-section.review')
				.each(function() {
					var upvotes=0;
					var totalVotes=0;
					var helpfulness = $(this).find("div.a-row.a-spacing-top-small.review-comments").find("span.a-size-small.a-color-secondary.review-votes").text();

					if(helpfulness==""){
						helpfulness=0;
					}
					else{
						upvotes=helpfulness.split(" ")[0];
						totalVotes= helpfulness.split(" ")[2];
					}
					
					var rating = $(this).find("div.a-row").eq(0).find("a.a-link-normal").find("i").find("span.a-icon-alt").text().split(" ")[0];
					// remove the decimal place and zero after it
					rating = rating.substring(0, rating.length - 2);

					var reviewDateString = $(this).find("div.a-row").eq(1).find("span.a-size-base.a-color-secondary.review-date").text();

					upvotesList.push(upvotes);
					totalVotesList.push(totalVotes);
					ratingList.push(rating);
					
					var reviewDate= Date.parse(reviewDateString);
					reviewDatesList.push(reviewDate);
					
					console.log("IN reveiewScraper.js Helpfulness: " + 
							upvotes+"/"+totalVotes  +"\nRating: " + rating +"\n\n");
					console.log("the date of review is ", reviewDate);
				});
			window.close();
			var result=[];
			result.push(upvotesList, totalVotesList, ratingList, reviewDatesList);
			cb(null,result);
		}
    });
}

function scrapeRanking(reviewerPageLink){
	console.log("dwjd");	
	jsdom.env({
		url:reviewerPageLink,
		scripts:["http://code.jquery.com/jquery.js"],
		done: function(errors, window){
			if(errors!=null){
				console.log("Yo");
				cb(errors);
			}
			var $ = window.jQuery;
			console.log("Yo bitch");

			if($("div.bio-expander").length > 0){

				var rankingString = $("div.bio-expander").find("div.a-row.a-spacing-small.a-spacing-top-small").find("div.a-row.a-spacing-small").children("div.a-row").find("span.a-size-base").text();
				console.log(rankingString);
				rankingString = rankingString.substring(1);
			}			
			else{
				rankingString="0";
			}

			console.log(rankingString);
			
			var ranking = convertFromCommaNotationToInt(rankingString);
			console.log(ranking);	
					
			return ranking;
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

exports.scrapeWithReviewerRanking = function(name, id, ref, page, cb) {
    
	jsdom.env({
        url: "http://www.amazon.com/"+name+"/product-reviews/" + id +
				"/ref=" +ref+ "?ie=UTF8&sortBy=helpful&reviewerType=all_reviews&" +
				"formatType=all_formats&filterByStar=all_stars&pageNumber=" + page,
        scripts: ["http://code.jquery.com/jquery.js"],
        done: function (errors, window) {
			if(errors!=null){
				cb(errors);
			}
			var $ = window.jQuery;
			var upvotesList=[], totalVotesList=[], ratingList=[], reviewDatesList=[], reviewerRankingList=[];

			$("div#cm_cr-review_list")
				.children('div.a-section.review')
				.each(function() {
					var upvotes=0;
					var totalVotes=0;
					var helpfulness = $(this).find("div.a-row.a-spacing-top-small.review-comments").find("span.a-size-small.a-color-secondary.review-votes").text();

					if(helpfulness==""){
						helpfulness=0;
					}
					else{
						upvotes=helpfulness.split(" ")[0];
						totalVotes= helpfulness.split(" ")[2];
					}
					
					var rating = $(this).find("div.a-row").eq(0).find("a.a-link-normal").find("i").find("span.a-icon-alt").text().split(" ")[0];
					
					var reviewerPageLink = "http://www.amazon.com";
					reviewerPageLink += $(this).find("div.a-row").eq(1).find("span.a-size-base.a-color-secondary.review-byline").find("a.a-size-base.a-link-normal.author").attr("href");
					console.log(reviewerPageLink);
					
					var ranking = scrapeRanking(reviewerPageLink);
					console.log(ranking);
					
					
					// remove the decimal place and zero after it
					rating = rating.substring(0, rating.length - 2);

					var reviewDateString = $(this).find("div.a-row").eq(1).find("span.a-size-base.a-color-secondary.review-date").text();

					upvotesList.push(upvotes);
					totalVotesList.push(totalVotes);
					ratingList.push(rating);
					reviewerRankingList.push(ranking);

					var reviewDate= Date.parse(reviewDateString);
					reviewDatesList.push(reviewDate);
					
					console.log("IN reveiewScraper.js Helpfulness: " + 
							upvotes+"/"+totalVotes  +"\nRating: " + rating +"\n\n");
					console.log("the date of review is ", reviewDate);
				});
			window.close();
			var result=[];
			result.push(upvotesList, totalVotesList, ratingList, reviewerRankingList, reviewDatesList);
			cb(null,result);
		}
    });

}

// USAGE : node amazonScraper.js FIFA-15-PlayStation-4 B00KPY1GJA cm_cr_pr_btm_link_3 3  >page3.txt 
