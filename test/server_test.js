/* jslint node: true, esnext: true */
"use strict";


const step1Factory = require('./steps/stepHttpIn');
const step2Factory = require('./steps/stepPassThrough');
const step3Factory = require('./steps/stepConsoleLogger');
const endPointFactory = require('../lib/endpoint');

//----------------------------------------------
// Step 1
//----------------------------------------------
const step1 = step1Factory({
	"name": "Step 1"
});

//----------------------------------------------
// Step 2
//----------------------------------------------
const step2 = step2Factory({
	"name": "Step 2"
});

//----------------------------------------------
// Step 2
//----------------------------------------------
const step3 = step3Factory({
	"name": "Step 3"
});

//----------------------------------------------
// Connect and run
//----------------------------------------------


// connect step1 with step2
step1.getEndpoint('out').connectInPassive(step2.getEndpoint('in'));

// connect step2 with step3
step2.getEndpoint('out').connectInPassive(step3.getEndpoint('in'));

step1.initialize();
step2.initialize();
step3.initialize();

step1.start();
