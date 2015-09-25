/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */

"use strict";


/**
 * Creates a passive endpoint waiting to be called
 * @step The step which to add this endpoint
 */
const getInPassive =
	function* () {
		while (true) {
			const message = yield;
			console.log(message);
		}
	};


var iterator = getInPassive();

console.log(iterator.next("mesage 1"));
console.log(iterator.next("mesage 2"));

// const getOutPasive = function* () {
// 	for (let i = 1; i < 4; i++) {
// 		yield {
// 			info: {
// 				name: `send from output #${i}`
// 			},
// 			stream: `a stream ${i}`
// 		};
// 	}
// };
//
// var iterator = requestGenerator();
//
// console.log(iterator.next());
// console.log(iterator.next());
// console.log(iterator.next());
// console.log(iterator.next());
// console.log(iterator.next());
// console.log(iterator.next());
// console.log(iterator.next());
