// use jsdom 3.x with nodejs
var jsdom = require('jsdom');

// Item Data for which to scrape

// Take input from command line in the form:
// name, id, ref and page

// Remember that the first argument is node and 
// the second argument is the filename of the source

var name = process.argv[2],
	id = process.argv[3],
    ref = process.argv[4],
    page = process.argv[5],
    filter="all_stars";

var scrape = function() {
    // The url, scripts, done keywords are optional 
    // but if you use them enclose them in curly braces 
    jsdom.env({
        url: "http://www.amazon.com/"+name+"/product-reviews/" + id +
				"/ref=" +ref+ "?ie=UTF8&sortBy=helpful&reviewerType=all_reviews&" +
				"formatType=all_formats&filterByStar="+filter+"&pageNumber=" + page,
        scripts: ["http://code.jquery.com/jquery.js"],
        done: function (errors, window) {
					var $ = window.jQuery;
					//console.log(errors);
					console.log("hello");
					console.log("yhuj");
					$("div#cm_cr-review_list.a-section.a-spacing-none.reviews.celwidget")
						.children('div.a-section.review')
						.each(function() {
							//console.log("fuck");
							var helpfulness = $(this).find("div.a-row.helpful-votes-count").find("span.a-size-small.a-color-secondary.review-votes").text();
							if(helpfulness==""){
								helpfulness=0;
							}
							var rating = $(this).find("div.a-row.helpful-votes-count").next()
										.find("a.a-link-normal").find("i")
										.find("span.a-icon-alt").text();

							console.log("Helpfulness: " + helpfulness  +"\nRating: " + rating +"\n\n");
						});
					window.close();
				}
    });
};

scrape();


// USAGE : node amazonScraper.js FIFA-15-PlayStation-4 B00KPY1GJA cm_cr_pr_btm_link_3 3  >page3.txt 
