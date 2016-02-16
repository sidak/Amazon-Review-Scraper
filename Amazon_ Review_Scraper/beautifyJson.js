var inputFileName = process.argv[2],
	outputFileName = process.argv[3];

var data = require('./' +inputFileName);


var fs = require('fs');
var KEY_NAME="name";

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
data.sort(sortByProperty(KEY_NAME));

fs.writeFile(outputFileName, JSON.stringify(data, null, '\t') , function (err) {
	if (err) console.log(err);
	else console.log('Written to file');
});