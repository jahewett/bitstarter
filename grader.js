#!/usr/bin/env node
// Homework 3 Part 3 - James Hewett
// Modified grader.js, now inspects urls for tags given in checks file
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(html) {
    return cheerio.load(html);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
	var $ = cheerioHtmlFile(fs.readFileSync(htmlfile));
	var htmlJsonData = checkHtmlTags($, checksfile);
	return htmlJsonData;
};

var checkHtmlTags = function(selector, checksfile)
{
	var checks = loadChecks(checksfile).sort();
	var out = {};

	for(var ii in checks) {
		var present = selector(checks[ii]).length > 0;
		out[checks[ii]] = present;
	}

	return out;
};
var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var checkUrl = function(url, checksfile) {
	rest.get(url.toString()).on('complete', function(result) {
		if (result instanceof Error) {
    			console.log('Error: ' + result.message);
   	 		this.retry(5000); // try again after 5 sec
  		} else {
			var $ = cheerioHtmlFile(result);
			var urlJsonData = checkHtmlTags($, checksfile); 
			console.log(JSON.stringify(urlJsonData, null, 4));
  		}
	});
};
 
if(require.main == module) {
	program
        	.option('-f, --file <html_file>', 'Path to index.html')
        	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        	.option('-u, --url <url>', 'Path to url to check')
		.parse(process.argv);
	
	if(program.url)
	{	
		checkUrl(program.url, program.checks);	
	}
	
	if(program.file)
	{
    		var checkJson = checkHtmlFile(program.file, program.checks);
    		var outputJsonData = JSON.stringify(checkJson, null, 4);
    		console.log(outputJsonData);		
	}
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
