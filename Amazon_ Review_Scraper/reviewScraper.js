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
					var upvotesList=[], totalVotesList=[], ratingList=[];

					//console.log(errors);
					//console.log("hello");
					//console.log("yhuj");
					
					$("div#cm_cr-review_list.a-section.a-spacing-none.reviews.celwidget")
						.children('div.a-section.review')
						.each(function() {
							//console.log("fuck");
							var upvotes=0;
							var totalVotes=0;
							var helpfulness = $(this).find("div.a-row.helpful-votes-count").find("span.a-size-small.a-color-secondary.review-votes").text();
							if(helpfulness==""){
								helpfulness=0;
							}
							else{
								upvotes=helpfulness.split(" ")[0];
								totalVotes= helpfulness.split(" ")[2];
							}
							var rating = $(this).find("div.a-row.helpful-votes-count").next()
										.find("a.a-link-normal").find("i")
										.find("span.a-icon-alt").text();
							
							upvotesList.push(upvotes);
							totalVotesList.push(totalVotes);
							ratingList.push(rating);
							
							console.log("IN reveiewScraper.js Helpfulness: " + upvotes+"/"+totalVotes  +"\nRating: " + rating +"\n\n");
						});
					window.close();
					var result=[];
					result.push(upvotesList, totalVotesList, ratingList);
					cb(null,result);
				}
    });

};

// USAGE : node amazonScraper.js FIFA-15-PlayStation-4 B00KPY1GJA cm_cr_pr_btm_link_3 3  >page3.txt 
