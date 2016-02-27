// use jsdom 3.x with nodejs
var jsdom = require('jsdom');

// Item Data for which to scrape

// Take input from command line in the form:
// name, id, ref and page

// Remember that the first argument is node and 
// the second argument is the filename of the source

var name = process.argv[2],
	id = process.argv[3],
    refBase= "cm_cr_pr_btm_link_",
    pages = process.argv[4];

// Store the vote and rating data in lists
var upvotesList=[];
var totalVotesList=[];
var ratingList=[];
var dateStringList = [];
var totalReviews=0;
var totalZeroHelpfulReviews=0;

var scrape = function(page,ref, cb) {
    // The url, scripts, done keywords are optional 
    // but if you use them enclose them in curly braces 
    jsdom.env({
        url: "http://www.amazon.com/"+name+"/product-reviews/" + id +
				"/ref=" +ref+ "?ie=UTF8&sortBy=helpful&reviewerType=all_reviews&" +
				"formatType=all_formats&filterByStar=all_stars&pageNumber=" + page,
        scripts: ["http://code.jquery.com/jquery.js"],
        done: function (errors, window) {
					var $ = window.jQuery;
					//console.log(errors);
					//console.log("hello");
					//console.log("yhuj");
					$("div#cm_cr-review_list")
						.children('div.a-section.review')
						.each(function() {
							//console.log("fuck");
							var upvotes =0;
							var totalVotes=0;

							var helpfulness = $(this).find("div.a-row.a-spacing-top-small.review-comments").find("span.a-size-small.a-color-secondary.review-votes").text();
							if(helpfulness==""){
								helpfulness=0;
								totalZeroHelpfulReviews++;
							}
							else{
								upvotes=helpfulness.split(" ")[0];
								totalVotes= helpfulness.split(" ")[2];
								
							}
							var rating = $(this).find("div.a-row").eq(0).find("a.a-link-normal").find("i").find("span.a-icon-alt").text().split(" ")[0];
							// remove the decimal place and zero after it	
							rating = rating.substring(0, rating.length - 2);
							
							var reviewDate = $(this).find("div.a-row").eq(1).find("span.a-size-base.a-color-secondary.review-date").text();

							// store the data for processing of relevance
							upvotesList.push(upvotes);
							totalVotesList.push(totalVotes);
							ratingList.push(rating);
							dateStringList.push(reviewDate);
							totalReviews++;
							console.log("Helpfulness: " + upvotes+"out of "+totalVotes  +"\nRating: " + rating +"\nDate is " + reviewDate + "\n\n");
						});
					window.close();
					cb(null, "Scraped the page "+page);
				}
    });
};

// Async task (same in all examples in this chapter)
function async(i, cb) {
	var page=i+1;
	var ref = refBase+page;
	scrape(page, ref, function(err, result){
		if(err)cb(err);
		else if (result!=null){
			cb(null, result);
		}	
	});
}
// Final task (same in all the examples)
function final() { 
	console.log("fraction of zero helpful reviews");
	console.log(totalZeroHelpfulReviews/totalReviews);
			
}

function series(i) {
  if(i<pages) {
    async( i, function(err,result) {
      if(err)console.log(err);
      else if (result!=null){
		  console.log(result)
		  return series(i+1);
	  }
    });
  } else {
    return final();
  }
}
series(0);

/*
function scrapeAllPages(){
	var done=0;
	for(var i=0; i<pages; i++){
		(function(){
			
			});
						
		})();
	}
	
}
scrapeAllPages();
*/
// USAGE : node amazonScraper.js FIFA-15-PlayStation-4 B00KPY1GJA cm_cr_pr_btm_link_3 3  >page3.txt 
