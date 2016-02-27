Install Node and NPM

	sudo apt-get install nodejs
	sudo apt-get install npm

Install jsdom 3.x

	sudo npm install jsdom@3

Running calcRelevance.js

	node calcRelevance.js outputFileName

	In order to run it for a different example, change the fifaAmazonDataFormat_Feb2016.txt for the required example. Accordingly change the value of few variables in the calcRelevance.js file, that correspond to NUM_VERSIONS, NUM_PLATFORMS and games (basically the key values of product families used in fifaData array in this data format class) variables.


Running multiPageReviewScraper.js

	The bash commands for using this module for different fifa games and platforms is specified in 'bash_commands_scraping_reviews.txt' in Other_Files/

	The general format is as follows:

		node multiPageReviewScraper.js productName ASIN numberOfPages  > outputFileName

		where, 
			productName and ASIN (basically id) are taken from Amazon product url,
			
		Example, in the url http://www.amazon.com/productName/dp/ASIN/.............
			Product Name occurs before /dp and ASIN occurs after dp/

