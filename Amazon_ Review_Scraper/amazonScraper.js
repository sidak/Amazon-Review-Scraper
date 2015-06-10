var jsdom = require('jsdom');

//example ASIN
var name = "FIFA-15-PlayStation-4",
	id = "B00KPY1GJA",
    page = 1,
    ref = "cm_cr_pr_show_all";

var scrape = function() {
    jsdom.env(
        "http://www.amazon.com/"+name+"/product-reviews/" + id +
        "/ref=" +ref+ "?ie=UTF8&sortBy=helpful&reviewerType=all_reviews&" +
        "formatType=all_formats&filterByStar=all_stars&pageNumber=" + page,
        ["http://code.jquery.com/jquery.js"],
        function (errors, window) {
            var $ = window.jQuery;
            //console.log(errors);
			console.log("hello");
            $("div#cm_cr-review_list.a-section.a-spacing-none.reviews.celwidget").children('div.a-section.review').each(function() {
                var helpfulness = $(this).find("div.a-row.helpful-votes-count").find("span.a-size-small.a-color-secondary.review-votes").text();
                var rating = $(this).find("div.a-row.helpful-votes-count").next()
							.find("a.a-link-normal").find("i")
							.find("span.a-icon-alt").text();

                console.log("Helpfulness: " + helpfulness  +"\nRating: " + rating +"\n\n");
            });
            window.close();
        }
    );
};

scrape();
