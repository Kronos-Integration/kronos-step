/* jslint node: true, esnext: true */
"use strict";


a();

function getErrorObject() {
	try {
		throw Error('');
	} catch (err) {
		return err;
	}
}

function a() {
	log();

}

function log() {

	var err = getErrorObject();

	console.log(err.stack);


	var caller_line = err.stack.split("\n")[4];
	var index = caller_line.indexOf("at ");
	var clean = caller_line.slice(index + 2, caller_line.length);

	console.log(caller_line);
	console.log(index);
	console.log(clean);

}
