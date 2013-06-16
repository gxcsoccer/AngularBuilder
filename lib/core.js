(function() {
	'use strict';

	////////////////////////////////////
	/**
	 * @ngdoc function
	 * @name angular.lowercase
	 * @function
	 *
	 * @description Converts the specified string to lowercase.
	 * @param {string} string String to be converted to lowercase.
	 * @returns {string} Lowercased string.
	 */
	var lowercase = function(string) {
			return isString(string) ? string.toLowerCase() : string;
		};


	/**
	 * @ngdoc function
	 * @name angular.uppercase
	 * @function
	 *
	 * @description Converts the specified string to uppercase.
	 * @param {string} string String to be converted to uppercase.
	 * @returns {string} Uppercased string.
	 */
	var uppercase = function(string) {
			return isString(string) ? string.toUpperCase() : string;
		};


	var manualLowercase = function(s) {
			return isString(s) ? s.replace(/[A-Z]/g, function(ch) {
				return String.fromCharCode(ch.charCodeAt(0) | 32);
			}) : s;
		};
	var manualUppercase = function(s) {
			return isString(s) ? s.replace(/[a-z]/g, function(ch) {
				return String.fromCharCode(ch.charCodeAt(0) & ~32);
			}) : s;
		};


	// String#toLowerCase and String#toUpperCase don't produce correct results in browsers with Turkish
	// locale, for this reason we need to detect this case and redefine lowercase/uppercase methods
	// with correct but slower alternatives.
	if ('i' !== 'I'.toLowerCase()) {
		lowercase = manualLowercase;
		uppercase = manualUppercase;
	}


	var /** holds major version number for IE or NaN for real browsers */
	msie = int((/msie (\d+)/.exec(lowercase(navigator.userAgent)) || [])[1]),
		jqLite, // delay binding since jQuery could be loaded after us.
		jQuery, // delay binding
		slice = [].slice,
		push = [].push,
		toString = Object.prototype.toString,


		_angular = window.angular,
		/** @name angular */
		angular = window.angular || (window.angular = {}),
		angularModule, nodeName_, uid = ['0', '0', '0'];

	/**
	 * @private
	 * @param {*} obj
	 * @return {boolean} Returns true if `obj` is an array or array-like object (NodeList, Arguments, ...)
	 */

	function isArrayLike(obj) {
		if (!obj || (typeof obj.length !== 'number')) return false;

		// We have on object which has length property. Should we treat it as array?
		if (typeof obj.hasOwnProperty != 'function' && typeof obj.constructor != 'function') {
			// This is here for IE8: it is a bogus object treat it as array;
			return true;
		} else {
			return //obj instanceof JQLite || // JQLite
			(jQuery && obj instanceof jQuery) || // jQuery
			toString.call(obj) !== '[object Object]' || // some browser native object
			typeof obj.callee === 'function'; // arguments (on IE8 looks like regular obj)
		}
	}

	/**
	 * @ngdoc function
	 * @name angular.forEach
	 * @function
	 *
	 * @description
	 * Invokes the `iterator` function once for each item in `obj` collection, which can be either an
	 * object or an array. The `iterator` function is invoked with `iterator(value, key)`, where `value`
	 * is the value of an object property or an array element and `key` is the object property key or
	 * array element index. Specifying a `context` for the function is optional.
	 *
	 * Note: this function was previously known as `angular.foreach`.
	 *
	   <pre>
	     var values = {name: 'misko', gender: 'male'};
	     var log = [];
	     angular.forEach(values, function(value, key){
	       this.push(key + ': ' + value);
	     }, log);
	     expect(log).toEqual(['name: misko', 'gender:male']);
	   </pre>
	 *
	 * @param {Object|Array} obj Object to iterate over.
	 * @param {Function} iterator Iterator function.
	 * @param {Object=} context Object to become context (`this`) for the iterator function.
	 * @returns {Object|Array} Reference to `obj`.
	 */
	function forEach(obj, iterator, context) {
		var key;
		if (obj) {
			if (isFunction(obj)) {
				for (key in obj) {
					if (key != 'prototype' && key != 'length' && key != 'name' && obj.hasOwnProperty(key)) {
						iterator.call(context, obj[key], key);
					}
				}
			} else if (obj.forEach && obj.forEach !== forEach) {
				obj.forEach(iterator, context);
			} else if (isArrayLike(obj)) {
				for (key = 0; key < obj.length; key++)
				iterator.call(context, obj[key], key);
			} else {
				for (key in obj) {
					if (obj.hasOwnProperty(key)) {
						iterator.call(context, obj[key], key);
					}
				}
			}
		}
		return obj;
	}

	function sortedKeys(obj) {
		var keys = [];
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				keys.push(key);
			}
		}
		return keys.sort();
	}

	function forEachSorted(obj, iterator, context) {
		var keys = sortedKeys(obj);
		for (var i = 0; i < keys.length; i++) {
			iterator.call(context, obj[keys[i]], keys[i]);
		}
		return keys;
	}


	/**
	 * when using forEach the params are value, key, but it is often useful to have key, value.
	 * @param {function(string, *)} iteratorFn
	 * @returns {function(*, string)}
	 */

	function reverseParams(iteratorFn) {
		return function(value, key) {
			iteratorFn(key, value)
		};
	}

	/**
	 * A consistent way of creating unique IDs in angular. The ID is a sequence of alpha numeric
	 * characters such as '012ABC'. The reason why we are not using simply a number counter is that
	 * the number string gets longer over time, and it can also overflow, where as the nextId
	 * will grow much slower, it is a string, and it will never overflow.
	 *
	 * @returns an unique alpha-numeric string
	 */

	function nextUid() {
		var index = uid.length;
		var digit;

		while (index) {
			index--;
			digit = uid[index].charCodeAt(0);
			if (digit == 57 /*'9'*/ ) {
				uid[index] = 'A';
				return uid.join('');
			}
			if (digit == 90 /*'Z'*/ ) {
				uid[index] = '0';
			} else {
				uid[index] = String.fromCharCode(digit + 1);
				return uid.join('');
			}
		}
		uid.unshift('0');
		return uid.join('');
	}


	/**
	 * Set or clear the hashkey for an object.
	 * @param obj object
	 * @param h the hashkey (!truthy to delete the hashkey)
	 */

	function setHashKey(obj, h) {
		if (h) {
			obj.$$hashKey = h;
		} else {
			delete obj.$$hashKey;
		}
	}

	/**
	 * @ngdoc function
	 * @name angular.extend
	 * @function
	 *
	 * @description
	 * Extends the destination object `dst` by copying all of the properties from the `src` object(s)
	 * to `dst`. You can specify multiple `src` objects.
	 *
	 * @param {Object} dst Destination object.
	 * @param {...Object} src Source object(s).
	 * @returns {Object} Reference to `dst`.
	 */

	function extend(dst) {
		var h = dst.$$hashKey;
		forEach(arguments, function(obj) {
			if (obj !== dst) {
				forEach(obj, function(value, key) {
					dst[key] = value;
				});
			}
		});

		setHashKey(dst, h);
		return dst;
	}

	function int(str) {
		return parseInt(str, 10);
	}


	function inherit(parent, extra) {
		return extend(new(extend(function() {}, {
			prototype: parent
		}))(), extra);
	}

	var START_SPACE = /^\s*/;
	var END_SPACE = /\s*$/;

	function stripWhitespace(str) {
		return isString(str) ? str.replace(START_SPACE, '').replace(END_SPACE, '') : str;
	}

	/**
	 * @ngdoc function
	 * @name angular.noop
	 * @function
	 *
	 * @description
	 * A function that performs no operations. This function can be useful when writing code in the
	 * functional style.
	   <pre>
	     function foo(callback) {
	       var result = calculateResult();
	       (callback || angular.noop)(result);
	     }
	   </pre>
	 */
	function noop() {}
	noop.$inject = [];


	/**
	 * @ngdoc function
	 * @name angular.identity
	 * @function
	 *
	 * @description
	 * A function that returns its first argument. This function is useful when writing code in the
	 * functional style.
	 *
	   <pre>
	     function transformer(transformationFn, value) {
	       return (transformationFn || identity)(value);
	     };
	   </pre>
	 */
	function identity($) {
		return $;
	}
	identity.$inject = [];


	function valueFn(value) {
		return function() {
			return value;
		};
	}

	/**
	 * @ngdoc function
	 * @name angular.isUndefined
	 * @function
	 *
	 * @description
	 * Determines if a reference is undefined.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is undefined.
	 */

	function isUndefined(value) {
		return typeof value == 'undefined';
	}


	/**
	 * @ngdoc function
	 * @name angular.isDefined
	 * @function
	 *
	 * @description
	 * Determines if a reference is defined.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is defined.
	 */

	function isDefined(value) {
		return typeof value != 'undefined';
	}


	/**
	 * @ngdoc function
	 * @name angular.isObject
	 * @function
	 *
	 * @description
	 * Determines if a reference is an `Object`. Unlike `typeof` in JavaScript, `null`s are not
	 * considered to be objects.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is an `Object` but not `null`.
	 */

	function isObject(value) {
		return value != null && typeof value == 'object';
	}


	/**
	 * @ngdoc function
	 * @name angular.isString
	 * @function
	 *
	 * @description
	 * Determines if a reference is a `String`.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is a `String`.
	 */

	function isString(value) {
		return typeof value == 'string';
	}


	/**
	 * @ngdoc function
	 * @name angular.isNumber
	 * @function
	 *
	 * @description
	 * Determines if a reference is a `Number`.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is a `Number`.
	 */

	function isNumber(value) {
		return typeof value == 'number';
	}


	/**
	 * @ngdoc function
	 * @name angular.isDate
	 * @function
	 *
	 * @description
	 * Determines if a value is a date.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is a `Date`.
	 */

	function isDate(value) {
		return toString.apply(value) == '[object Date]';
	}


	/**
	 * @ngdoc function
	 * @name angular.isArray
	 * @function
	 *
	 * @description
	 * Determines if a reference is an `Array`.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is an `Array`.
	 */

	function isArray(value) {
		return toString.apply(value) == '[object Array]';
	}


	/**
	 * @ngdoc function
	 * @name angular.isFunction
	 * @function
	 *
	 * @description
	 * Determines if a reference is a `Function`.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is a `Function`.
	 */

	function isFunction(value) {
		return typeof value == 'function';
	}


	/**
	 * Checks if `obj` is a window object.
	 *
	 * @private
	 * @param {*} obj Object to check
	 * @returns {boolean} True if `obj` is a window obj.
	 */

	function isWindow(obj) {
		return obj && obj.document && obj.location && obj.alert && obj.setInterval;
	}


	function isScope(obj) {
		return obj && obj.$evalAsync && obj.$watch;
	}


	function isFile(obj) {
		return toString.apply(obj) === '[object File]';
	}


	function isBoolean(value) {
		return typeof value == 'boolean';
	}


	function trim(value) {
		return isString(value) ? value.replace(/^\s*/, '').replace(/\s*$/, '') : value;
	}

	/**
	 * @ngdoc function
	 * @name angular.isElement
	 * @function
	 *
	 * @description
	 * Determines if a reference is a DOM element (or wrapped jQuery element).
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is a DOM element (or wrapped jQuery element).
	 */

	function isElement(node) {
		return node && (node.nodeName // we are a direct element
		||
		(node.bind && node.find)); // we have a bind and find method part of jQuery API
	}

	/**
	 * @param str 'key1,key2,...'
	 * @returns {object} in the form of {key1:true, key2:true, ...}
	 */

	function makeMap(str) {
		var obj = {},
			items = str.split(","),
			i;
		for (i = 0; i < items.length; i++)
		obj[items[i]] = true;
		return obj;
	}


	if (msie < 9) {
		nodeName_ = function(element) {
			element = element.nodeName ? element : element[0];
			return (element.scopeName && element.scopeName != 'HTML') ? uppercase(element.scopeName + ':' + element.nodeName) : element.nodeName;
		};
	} else {
		nodeName_ = function(element) {
			return element.nodeName ? element.nodeName : element[0].nodeName;
		};
	}


	function map(obj, iterator, context) {
		var results = [];
		forEach(obj, function(value, index, list) {
			results.push(iterator.call(context, value, index, list));
		});
		return results;
	}


	/**
	 * @description
	 * Determines the number of elements in an array, the number of properties an object has, or
	 * the length of a string.
	 *
	 * Note: This function is used to augment the Object type in Angular expressions. See
	 * {@link angular.Object} for more information about Angular arrays.
	 *
	 * @param {Object|Array|string} obj Object, array, or string to inspect.
	 * @param {boolean} [ownPropsOnly=false] Count only "own" properties in an object
	 * @returns {number} The size of `obj` or `0` if `obj` is neither an object nor an array.
	 */

	function size(obj, ownPropsOnly) {
		var size = 0,
			key;

		if (isArray(obj) || isString(obj)) {
			return obj.length;
		} else if (isObject(obj)) {
			for (key in obj)
			if (!ownPropsOnly || obj.hasOwnProperty(key)) size++;
		}

		return size;
	}


	function includes(array, obj) {
		return indexOf(array, obj) != -1;
	}

	function indexOf(array, obj) {
		if (array.indexOf) return array.indexOf(obj);

		for (var i = 0; i < array.length; i++) {
			if (obj === array[i]) return i;
		}
		return -1;
	}

	function arrayRemove(array, value) {
		var index = indexOf(array, value);
		if (index >= 0) array.splice(index, 1);
		return value;
	}

	function isLeafNode(node) {
		if (node) {
			switch (node.nodeName) {
			case "OPTION":
			case "PRE":
			case "TITLE":
				return true;
			}
		}
		return false;
	}

	/**
	 * @ngdoc function
	 * @name angular.copy
	 * @function
	 *
	 * @description
	 * Creates a deep copy of `source`, which should be an object or an array.
	 *
	 * * If no destination is supplied, a copy of the object or array is created.
	 * * If a destination is provided, all of its elements (for array) or properties (for objects)
	 *   are deleted and then all elements/properties from the source are copied to it.
	 * * If  `source` is not an object or array, `source` is returned.
	 *
	 * Note: this function is used to augment the Object type in Angular expressions. See
	 * {@link ng.$filter} for more information about Angular arrays.
	 *
	 * @param {*} source The source that will be used to make a copy.
	 *                   Can be any type, including primitives, `null`, and `undefined`.
	 * @param {(Object|Array)=} destination Destination into which the source is copied. If
	 *     provided, must be of the same type as `source`.
	 * @returns {*} The copy or updated `destination`, if `destination` was specified.
	 */

	function copy(source, destination) {
		if (isWindow(source) || isScope(source)) {
			throw ngError(43, "Can't copy! Making copies of Window or Scope instances is not supported.");
		}

		if (!destination) {
			destination = source;
			if (source) {
				if (isArray(source)) {
					destination = copy(source, []);
				} else if (isDate(source)) {
					destination = new Date(source.getTime());
				} else if (isObject(source)) {
					destination = copy(source, {});
				}
			}
		} else {
			if (source === destination) throw ngError(44, "Can't copy! Source and destination are identical.");
			if (isArray(source)) {
				destination.length = 0;
				for (var i = 0; i < source.length; i++) {
					destination.push(copy(source[i]));
				}
			} else {
				var h = destination.$$hashKey;
				forEach(destination, function(value, key) {
					delete destination[key];
				});
				for (var key in source) {
					destination[key] = copy(source[key]);
				}
				setHashKey(destination, h);
			}
		}
		return destination;
	}

	/**
	 * Create a shallow copy of an object
	 */

	function shallowCopy(src, dst) {
		dst = dst || {};

		for (var key in src) {
			if (src.hasOwnProperty(key) && key.substr(0, 2) !== '$$') {
				dst[key] = src[key];
			}
		}

		return dst;
	}


	/**
	 * @ngdoc function
	 * @name angular.equals
	 * @function
	 *
	 * @description
	 * Determines if two objects or two values are equivalent. Supports value types, arrays and
	 * objects.
	 *
	 * Two objects or values are considered equivalent if at least one of the following is true:
	 *
	 * * Both objects or values pass `===` comparison.
	 * * Both objects or values are of the same type and all of their properties pass `===` comparison.
	 * * Both values are NaN. (In JavasScript, NaN == NaN => false. But we consider two NaN as equal)
	 *
	 * During a property comparison, properties of `function` type and properties with names
	 * that begin with `$` are ignored.
	 *
	 * Scope and DOMWindow objects are being compared only by identify (`===`).
	 *
	 * @param {*} o1 Object or value to compare.
	 * @param {*} o2 Object or value to compare.
	 * @returns {boolean} True if arguments are equal.
	 */

	function equals(o1, o2) {
		if (o1 === o2) return true;
		if (o1 === null || o2 === null) return false;
		if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
		var t1 = typeof o1,
			t2 = typeof o2,
			length, key, keySet;
		if (t1 == t2) {
			if (t1 == 'object') {
				if (isArray(o1)) {
					if ((length = o1.length) == o2.length) {
						for (key = 0; key < length; key++) {
							if (!equals(o1[key], o2[key])) return false;
						}
						return true;
					}
				} else if (isDate(o1)) {
					return isDate(o2) && o1.getTime() == o2.getTime();
				} else {
					if (isScope(o1) || isScope(o2) || isWindow(o1) || isWindow(o2)) return false;
					keySet = {};
					for (key in o1) {
						if (key.charAt(0) === '$' || isFunction(o1[key])) continue;
						if (!equals(o1[key], o2[key])) return false;
						keySet[key] = true;
					}
					for (key in o2) {
						if (!keySet[key] && key.charAt(0) !== '$' && o2[key] !== undefined && !isFunction(o2[key])) return false;
					}
					return true;
				}
			}
		}
		return false;
	}


	function concat(array1, array2, index) {
		return array1.concat(slice.call(array2, index));
	}

	function sliceArgs(args, startIndex) {
		return slice.call(args, startIndex || 0);
	}


	/**
	 * @ngdoc function
	 * @name angular.bind
	 * @function
	 *
	 * @description
	 * Returns a function which calls function `fn` bound to `self` (`self` becomes the `this` for
	 * `fn`). You can supply optional `args` that are prebound to the function. This feature is also
	 * known as [function currying](http://en.wikipedia.org/wiki/Currying).
	 *
	 * @param {Object} self Context which `fn` should be evaluated in.
	 * @param {function()} fn Function to be bound.
	 * @param {...*} args Optional arguments to be prebound to the `fn` function call.
	 * @returns {function()} Function that wraps the `fn` with all the specified bindings.
	 */

	function bind(self, fn) {
		var curryArgs = arguments.length > 2 ? sliceArgs(arguments, 2) : [];
		if (isFunction(fn) && !(fn instanceof RegExp)) {
			return curryArgs.length ?
			function() {
				return arguments.length ? fn.apply(self, curryArgs.concat(slice.call(arguments, 0))) : fn.apply(self, curryArgs);
			} : function() {
				return arguments.length ? fn.apply(self, arguments) : fn.call(self);
			};
		} else {
			// in IE, native methods are not functions so they cannot be bound (note: they don't need to be)
			return fn;
		}
	}


	function toJsonReplacer(key, value) {
		var val = value;

		if (/^\$+/.test(key)) {
			val = undefined;
		} else if (isWindow(value)) {
			val = '$WINDOW';
		} else if (value && document === value) {
			val = '$DOCUMENT';
		} else if (isScope(value)) {
			val = '$SCOPE';
		}

		return val;
	}


	/**
	 * @ngdoc function
	 * @name angular.toJson
	 * @function
	 *
	 * @description
	 * Serializes input into a JSON-formatted string.
	 *
	 * @param {Object|Array|Date|string|number} obj Input to be serialized into JSON.
	 * @param {boolean=} pretty If set to true, the JSON output will contain newlines and whitespace.
	 * @returns {string} Jsonified string representing `obj`.
	 */

	function toJson(obj, pretty) {
		return JSON.stringify(obj, toJsonReplacer, pretty ? '  ' : null);
	}


	/**
	 * @ngdoc function
	 * @name angular.fromJson
	 * @function
	 *
	 * @description
	 * Deserializes a JSON string.
	 *
	 * @param {string} json JSON string to deserialize.
	 * @returns {Object|Array|Date|string|number} Deserialized thingy.
	 */

	function fromJson(json) {
		return isString(json) ? JSON.parse(json) : json;
	}


	function toBoolean(value) {
		if (value && value.length !== 0) {
			var v = lowercase("" + value);
			value = !(v == 'f' || v == '0' || v == 'false' || v == 'no' || v == 'n' || v == '[]');
		} else {
			value = false;
		}
		return value;
	}

	/**
	 * @returns {string} Returns the string representation of the element.
	 */

	function startingTag(element) {
		element = jqLite(element).clone();
		try {
			// turns out IE does not let you set .html() on elements which
			// are not allowed to have children. So we just ignore it.
			element.html('');
		} catch (e) {}
		// As Per DOM Standards
		var TEXT_NODE = 3;
		var elemHtml = jqLite('<div>').append(element).html();
		try {
			return element[0].nodeType === TEXT_NODE ? lowercase(elemHtml) : elemHtml.
			match(/^(<[^>]+>)/)[1].
			replace(/^<([\w\-]+)/, function(match, nodeName) {
				return '<' + lowercase(nodeName);
			});
		} catch (e) {
			return lowercase(elemHtml);
		}

	}


	/////////////////////////////////////////////////
	/**
	 * Parses an escaped url query string into key-value pairs.
	 * @returns Object.<(string|boolean)>
	 */

	function parseKeyValue( /**string*/ keyValue) {
		var obj = {},
			key_value, key;
		forEach((keyValue || "").split('&'), function(keyValue) {
			if (keyValue) {
				key_value = keyValue.split('=');
				key = decodeURIComponent(key_value[0]);
				obj[key] = isDefined(key_value[1]) ? decodeURIComponent(key_value[1]) : true;
			}
		});
		return obj;
	}

	function toKeyValue(obj) {
		var parts = [];
		forEach(obj, function(value, key) {
			parts.push(encodeUriQuery(key, true) + (value === true ? '' : '=' + encodeUriQuery(value, true)));
		});
		return parts.length ? parts.join('&') : '';
	}


	/**
	 * We need our custom method because encodeURIComponent is too aggressive and doesn't follow
	 * http://www.ietf.org/rfc/rfc3986.txt with regards to the character set (pchar) allowed in path
	 * segments:
	 *    segment       = *pchar
	 *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
	 *    pct-encoded   = "%" HEXDIG HEXDIG
	 *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
	 *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
	 *                     / "*" / "+" / "," / ";" / "="
	 */

	function encodeUriSegment(val) {
		return encodeUriQuery(val, true).
		replace(/%26/gi, '&').
		replace(/%3D/gi, '=').
		replace(/%2B/gi, '+');
	}


	/**
	 * This method is intended for encoding *key* or *value* parts of query component. We need a custom
	 * method because encodeURIComponent is too aggressive and encodes stuff that doesn't have to be
	 * encoded per http://tools.ietf.org/html/rfc3986:
	 *    query       = *( pchar / "/" / "?" )
	 *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
	 *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
	 *    pct-encoded   = "%" HEXDIG HEXDIG
	 *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
	 *                     / "*" / "+" / "," / ";" / "="
	 */

	function encodeUriQuery(val, pctEncodeSpaces) {
		return encodeURIComponent(val).
		replace(/%40/gi, '@').
		replace(/%3A/gi, ':').
		replace(/%24/g, '$').
		replace(/%2C/gi, ',').
		replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
	}


	/**
	 * @ngdoc directive
	 * @name ng.directive:ngApp
	 *
	 * @element ANY
	 * @param {angular.Module} ngApp an optional application
	 *   {@link angular.module module} name to load.
	 *
	 * @description
	 *
	 * Use this directive to auto-bootstrap an application. Only
	 * one ngApp directive can be used per HTML document. The directive
	 * designates the root of the application and is typically placed
	 * at the root of the page.
	 * 
	 * The first ngApp found in the document will be auto-bootstrapped. To use multiple applications in an 
	 * HTML document you must manually bootstrap them using {@link angular.bootstrap}. 
	 * Applications cannot be nested.
	 *
	 * In the example below if the `ngApp` directive would not be placed
	 * on the `html` element then the document would not be compiled
	 * and the `{{ 1+2 }}` would not be resolved to `3`.
	 *
	 * `ngApp` is the easiest way to bootstrap an application.
	 *
	 <doc:example>
	   <doc:source>
	    I can add: 1 + 2 =  {{ 1+2 }}
	   </doc:source>
	 </doc:example>
	 *
	 */
	function angularInit(element, bootstrap) {
		var elements = [element],
			appElement, module, names = ['ng:app', 'ng-app', 'x-ng-app', 'data-ng-app'],
			NG_APP_CLASS_REGEXP = /\sng[:\-]app(:\s*([\w\d_]+);?)?\s/;

		function append(element) {
			element && elements.push(element);
		}

		forEach(names, function(name) {
			names[name] = true;
			append(document.getElementById(name));
			name = name.replace(':', '\\:');
			if (element.querySelectorAll) {
				forEach(element.querySelectorAll('.' + name), append);
				forEach(element.querySelectorAll('.' + name + '\\:'), append);
				forEach(element.querySelectorAll('[' + name + ']'), append);
			}
		});

		forEach(elements, function(element) {
			if (!appElement) {
				var className = ' ' + element.className + ' ';
				var match = NG_APP_CLASS_REGEXP.exec(className);
				if (match) {
					appElement = element;
					module = (match[2] || '').replace(/\s+/g, ',');
				} else {
					forEach(element.attributes, function(attr) {
						if (!appElement && names[attr.name]) {
							appElement = element;
							module = attr.value;
						}
					});
				}
			}
		});
		if (appElement) {
			bootstrap(appElement, module ? [module] : []);
		}
	}

	/**
	 * @ngdoc function
	 * @name angular.bootstrap
	 * @description
	 * Use this function to manually start up angular application.
	 *
	 * See: {@link guide/bootstrap Bootstrap}
	 *
	 * @param {Element} element DOM element which is the root of angular application.
	 * @param {Array<String|Function>=} modules an array of module declarations. See: {@link angular.module modules}
	 * @returns {AUTO.$injector} Returns the newly created injector for this app.
	 */

	function bootstrap(element, modules) {
		var resumeBootstrapInternal = function() {
				element = jqLite(element);
				modules = modules || [];
				modules.unshift(['$provide', function($provide) {
					$provide.value('$rootElement', element);
				}]);
				modules.unshift('ng');
				var injector = createInjector(modules);
				injector.invoke(['$rootScope', '$rootElement', '$compile', '$injector', function(scope, element, compile, injector) {
					scope.$apply(function() {
						element.data('$injector', injector);
						compile(element)(scope);
					});
				}]);
				return injector;
			};

		var NG_DEFER_BOOTSTRAP = /^NG_DEFER_BOOTSTRAP!/;

		if (window && !NG_DEFER_BOOTSTRAP.test(window.name)) {
			return resumeBootstrapInternal();
		}

		window.name = window.name.replace(NG_DEFER_BOOTSTRAP, '');
		angular.resumeBootstrap = function(extraModules) {
			forEach(extraModules, function(module) {
				modules.push(module);
			});
			resumeBootstrapInternal();
		};
	}

	var SNAKE_CASE_REGEXP = /[A-Z]/g;

	function snake_case(name, separator) {
		separator = separator || '_';
		return name.replace(SNAKE_CASE_REGEXP, function(letter, pos) {
			return (pos ? separator : '') + letter.toLowerCase();
		});
	}

	function bindJQuery() {
		// bind to jQuery if present;
		jQuery = window.jQuery;
		// reset to jQuery or default to us.
		if (jQuery) {
			jqLite = jQuery;
			extend(jQuery.fn, {
				scope: function(element) {
					return JQLiteInheritedData(element, '$scope');
				},
				controller: JQLiteController,
				injector: function(element) {
					return JQLiteInheritedData(element, '$injector');
				},
				inheritedData: JQLiteInheritedData
			});
			// Method signature: JQLitePatchJQueryRemove(name, dispatchThis, filterElems, getterIfNoArguments)
			JQLitePatchJQueryRemove('remove', true, true, false);
			JQLitePatchJQueryRemove('empty', false, false, false);
			JQLitePatchJQueryRemove('html', false, false, true);
		} else {
			jqLite = JQLite;
		}
		angular.element = jqLite;

		function JQLiteInheritedData(element, name, value) {
			element = jqLite(element);

			// if element is the document object work with the html element instead
			// this makes $(document).scope() possible
			if (element[0].nodeType == 9) {
				element = element.find('html');
			}

			while (element.length) {
				if (value = element.data(name)) return value;
				element = element.parent();
			}
		}

		function JQLiteController(element, name) {
			return JQLiteInheritedData(element, '$' + (name || 'ngController') + 'Controller');
		}
	}

	/**
	 * throw error if the argument is falsy.
	 */

	function assertArg(arg, name, reason) {
		if (!arg) {
			throw ngError(45, "Argument '{0}' is {1}", (name || '?'), (reason || "required"));
		}
		return arg;
	}

	function assertArgFn(arg, name, acceptArrayAnnotation) {
		if (acceptArrayAnnotation && isArray(arg)) {
			arg = arg[arg.length - 1];
		}

		assertArg(isFunction(arg), name, 'not a function, got ' + (arg && typeof arg == 'object' ? arg.constructor.name || 'Object' : typeof arg));
		return arg;
	}

	//////////////////////////////////////////////////////////////////////
	//  added
	//////////////////////////////////////////////////////////////////////
	/**
	 * @ngdoc property
	 * @name angular.version
	 * @description
	 * An object that contains information about the current AngularJS version. This object has the
	 * following properties:
	 *
	 * - `full` – `{string}` – Full version string, such as "0.9.18".
	 * - `major` – `{number}` – Major version number, such as "0".
	 * - `minor` – `{number}` – Minor version number, such as "9".
	 * - `dot` – `{number}` – Dot version number, such as "18".
	 * - `codeName` – `{string}` – Code name of the release, such as "jiggling-armfat".
	 */
	var version = {
		full: '1.0.6',
		// all of these placeholder strings will be replaced by grunt's
		major: 1,
		// package task
		minor: 0,
		dot: 6,
		codeName: 'universal-irreversibility'
	};

	function JQLitePatchJQueryRemove(name, dispatchThis) {
		var originalJqFn = jQuery.fn[name];
		originalJqFn = originalJqFn.$original || originalJqFn;
		removePatch.$original = originalJqFn;
		jQuery.fn[name] = removePatch;

		function removePatch() {
			var list = [this],
				fireEvent = dispatchThis,
				set, setIndex, setLength, element, childIndex, childLength, children, fns, events;

			while (list.length) {
				set = list.shift();
				for (setIndex = 0, setLength = set.length; setIndex < setLength; setIndex++) {
					element = jqLite(set[setIndex]);
					if (fireEvent) {
						element.triggerHandler('$destroy');
					} else {
						fireEvent = !fireEvent;
					}
					for (childIndex = 0, childLength = (children = element.children()).length;
					childIndex < childLength;
					childIndex++) {
						list.push(jQuery(children[childIndex]));
					}
				}
			}
			return originalJqFn.apply(this, arguments);
		}
	}

	function createInjector(modulesToLoad) {
		var INSTANTIATING = {},
			providerSuffix = 'Provider',
			path = [],
			loadedModules = new HashMap(),
			providerCache = {
				$provide: {
					provider: supportObject(provider),
					factory: supportObject(factory),
					service: supportObject(service),
					value: supportObject(value),
					constant: supportObject(constant),
					decorator: decorator
				}
			},
			providerInjector = createInternalInjector(providerCache, function() {
				throw Error("Unknown provider: " + path.join(' <- '));
			}),
			instanceCache = {},
			instanceInjector = (instanceCache.$injector = createInternalInjector(instanceCache, function(servicename) {
				var provider = providerInjector.get(servicename + providerSuffix);
				return instanceInjector.invoke(provider.$get, provider);
			}));


		forEach(loadModules(modulesToLoad), function(fn) {
			instanceInjector.invoke(fn || noop);
		});

		return instanceInjector;

		////////////////////////////////////
		// $provider
		////////////////////////////////////

		function supportObject(delegate) {
			return function(key, value) {
				if (isObject(key)) {
					forEach(key, reverseParams(delegate));
				} else {
					return delegate(key, value);
				}
			}
		}

		function provider(name, provider_) {
			if (isFunction(provider_) || isArray(provider_)) {
				provider_ = providerInjector.instantiate(provider_);
			}
			if (!provider_.$get) {
				throw Error('Provider ' + name + ' must define $get factory method.');
			}
			return providerCache[name + providerSuffix] = provider_;
		}

		function factory(name, factoryFn) {
			return provider(name, {
				$get: factoryFn
			});
		}

		function service(name, constructor) {
			return factory(name, ['$injector', function($injector) {
				return $injector.instantiate(constructor);
			}]);
		}

		function value(name, value) {
			return factory(name, valueFn(value));
		}

		function constant(name, value) {
			providerCache[name] = value;
			instanceCache[name] = value;
		}

		function decorator(serviceName, decorFn) {
			var origProvider = providerInjector.get(serviceName + providerSuffix),
				orig$get = origProvider.$get;

			origProvider.$get = function() {
				var origInstance = instanceInjector.invoke(orig$get, origProvider);
				return instanceInjector.invoke(decorFn, null, {
					$delegate: origInstance
				});
			};
		}

		////////////////////////////////////
		// Module Loading
		////////////////////////////////////

		function loadModules(modulesToLoad) {
			var runBlocks = [];
			forEach(modulesToLoad, function(module) {
				if (loadedModules.get(module)) return;
				loadedModules.put(module, true);
				if (isString(module)) {
					var moduleFn = angularModule(module);
					runBlocks = runBlocks.concat(loadModules(moduleFn.requires)).concat(moduleFn._runBlocks);

					try {
						for (var invokeQueue = moduleFn._invokeQueue, i = 0, ii = invokeQueue.length; i < ii; i++) {
							var invokeArgs = invokeQueue[i],
								provider = invokeArgs[0] == '$injector' ? providerInjector : providerInjector.get(invokeArgs[0]);

							provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
						}
					} catch (e) {
						if (e.message) e.message += ' from ' + module;
						throw e;
					}
				} else if (isFunction(module)) {
					try {
						runBlocks.push(providerInjector.invoke(module));
					} catch (e) {
						if (e.message) e.message += ' from ' + module;
						throw e;
					}
				} else if (isArray(module)) {
					try {
						runBlocks.push(providerInjector.invoke(module));
					} catch (e) {
						if (e.message) e.message += ' from ' + String(module[module.length - 1]);
						throw e;
					}
				} else {
					assertArgFn(module, 'module');
				}
			});
			return runBlocks;
		}

		////////////////////////////////////
		// internal Injector
		////////////////////////////////////

		function createInternalInjector(cache, factory) {

			function getService(serviceName) {
				if (typeof serviceName !== 'string') {
					throw Error('Service name expected');
				}
				if (cache.hasOwnProperty(serviceName)) {
					if (cache[serviceName] === INSTANTIATING) {
						throw Error('Circular dependency: ' + path.join(' <- '));
					}
					return cache[serviceName];
				} else {
					try {
						path.unshift(serviceName);
						cache[serviceName] = INSTANTIATING;
						return cache[serviceName] = factory(serviceName);
					} finally {
						path.shift();
					}
				}
			}

			function invoke(fn, self, locals) {
				var args = [],
					$inject = annotate(fn),
					length, i, key;

				for (i = 0, length = $inject.length; i < length; i++) {
					key = $inject[i];
					args.push(
					locals && locals.hasOwnProperty(key) ? locals[key] : getService(key));
				}
				if (!fn.$inject) {
					// this means that we must be an array.
					fn = fn[length];
				}


				// Performance optimization: http://jsperf.com/apply-vs-call-vs-invoke
				switch (self ? -1 : args.length) {
				case 0:
					return fn();
				case 1:
					return fn(args[0]);
				case 2:
					return fn(args[0], args[1]);
				case 3:
					return fn(args[0], args[1], args[2]);
				case 4:
					return fn(args[0], args[1], args[2], args[3]);
				case 5:
					return fn(args[0], args[1], args[2], args[3], args[4]);
				case 6:
					return fn(args[0], args[1], args[2], args[3], args[4], args[5]);
				case 7:
					return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
				case 8:
					return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
				case 9:
					return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
				case 10:
					return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
				default:
					return fn.apply(self, args);
				}
			}

			function instantiate(Type, locals) {
				var Constructor = function() {},
					instance, returnedValue;

				Constructor.prototype = (isArray(Type) ? Type[Type.length - 1] : Type).prototype;
				instance = new Constructor();
				returnedValue = invoke(Type, instance, locals);

				return isObject(returnedValue) ? returnedValue : instance;
			}

			return {
				invoke: invoke,
				instantiate: instantiate,
				get: getService,
				annotate: annotate
			};
		}
	}

	/**
	 * @ngdoc interface
	 * @name angular.Module
	 * @description
	 *
	 * Interface for configuring angular {@link angular.module modules}.
	 */

	function setupModuleLoader(window) {

		function ensure(obj, name, factory) {
			return obj[name] || (obj[name] = factory());
		}

		return ensure(ensure(window, 'angular', Object), 'module', function() { /** @type {Object.<string, angular.Module>} */
			var modules = {};

			return function module(name, requires, configFn) {
				if (requires && modules.hasOwnProperty(name)) {
					modules[name] = null;
				}
				return ensure(modules, name, function() {
					if (!requires) {
						throw Error('No module: ' + name);
					}

					/** @type {!Array.<Array.<*>>} */
					var invokeQueue = [];

					/** @type {!Array.<Function>} */
					var runBlocks = [];

					var config = invokeLater('$injector', 'invoke');

					/** @type {angular.Module} */
					var moduleInstance = {
						// Private state
						_invokeQueue: invokeQueue,
						_runBlocks: runBlocks,
						requires: requires,
						name: name,
						provider: invokeLater('$provide', 'provider'),
						factory: invokeLater('$provide', 'factory'),
						service: invokeLater('$provide', 'service'),
						value: invokeLater('$provide', 'value'),
						constant: invokeLater('$provide', 'constant', 'unshift'),
						filter: invokeLater('$filterProvider', 'register'),
						controller: invokeLater('$controllerProvider', 'register'),
						directive: invokeLater('$compileProvider', 'directive'),
						config: config,
						run: function(block) {
							runBlocks.push(block);
							return this;
						}
					};

					if (configFn) {
						config(configFn);
					}

					return moduleInstance;

					/**
					 * @param {string} provider
					 * @param {string} method
					 * @param {String=} insertMethod
					 * @returns {angular.Module}
					 */

					function invokeLater(provider, method, insertMethod) {
						return function() {
							invokeQueue[insertMethod || 'push']([provider, method, arguments]);
							return moduleInstance;
						}
					}
				});
			};
		});

	}

	/**
	 * Computes a hash of an 'obj'.
	 * Hash of a:
	 *  string is string
	 *  number is number as string
	 *  object is either result of calling $$hashKey function on the object or uniquely generated id,
	 *         that is also assigned to the $$hashKey property of the object.
	 *
	 * @param obj
	 * @returns {string} hash string such that the same input will have the same hash string.
	 *         The resulting string key is in 'type:hashKey' format.
	 */

	function hashKey(obj) {
		var objType = typeof obj,
			key;

		if (objType == 'object' && obj !== null) {
			if (typeof(key = obj.$$hashKey) == 'function') {
				// must invoke on object to keep the right this
				key = obj.$$hashKey();
			} else if (key === undefined) {
				key = obj.$$hashKey = nextUid();
			}
		} else {
			key = obj;
		}

		return objType + ':' + key;
	}

	/**
	 * HashMap which can use objects as keys
	 */

	function HashMap(array) {
		forEach(array, this.put, this);
	}
	HashMap.prototype = {
		/**
		 * Store key value pair
		 * @param key key to store can be any type
		 * @param value value to store can be any type
		 */
		put: function(key, value) {
			this[hashKey(key)] = value;
		},

		/**
		 * @param key
		 * @returns the value for the key
		 */
		get: function(key) {
			return this[hashKey(key)];
		},

		/**
		 * Remove the key/value pair
		 * @param key
		 */
		remove: function(key) {
			var value = this[key = hashKey(key)];
			delete this[key];
			return value;
		}
	};

	/**
	 * A map where multiple values can be added to the same key such that they form a queue.
	 * @returns {HashQueueMap}
	 */

	function HashQueueMap() {}
	HashQueueMap.prototype = {
		/**
		 * Same as array push, but using an array as the value for the hash
		 */
		push: function(key, value) {
			var array = this[key = hashKey(key)];
			if (!array) {
				this[key] = [value];
			} else {
				array.push(value);
			}
		},

		/**
		 * Same as array shift, but using an array as the value for the hash
		 */
		shift: function(key) {
			var array = this[key = hashKey(key)];
			if (array) {
				if (array.length == 1) {
					delete this[key];
					return array[0];
				} else {
					return array.shift();
				}
			}
		},

		/**
		 * return the first item without deleting it
		 */
		peek: function(key) {
			var array = this[hashKey(key)];
			if (array) {
				return array[0];
			}
		}
	};

	var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
	var FN_ARG_SPLIT = /,/;
	var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
	var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

	function annotate(fn) {
		var $inject, fnText, argDecl, last;

		if (typeof fn == 'function') {
			if (!($inject = fn.$inject)) {
				$inject = [];
				fnText = fn.toString().replace(STRIP_COMMENTS, '');
				argDecl = fnText.match(FN_ARGS);
				forEach(argDecl[1].split(FN_ARG_SPLIT), function(arg) {
					arg.replace(FN_ARG, function(all, underscore, name) {
						$inject.push(name);
					});
				});
				fn.$inject = $inject;
			}
		} else if (isArray(fn)) {
			last = fn.length - 1;
			assertArgFn(fn[last], 'fn')
			$inject = fn.slice(0, last);
		} else {
			assertArgFn(fn, 'fn', true);
		}
		return $inject;
	}

	function $RootScopeProvider() {
		var TTL = 10;

		this.digestTtl = function(value) {
			if (arguments.length) {
				TTL = value;
			}
			return TTL;
		};

		this.$get = ['$injector', '$exceptionHandler', '$parse', function($injector, $exceptionHandler, $parse) {

			function Scope() {
				this.$id = nextUid();
				this.$$phase = this.$parent = this.$$watchers = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = null;
				this['this'] = this.$root = this;
				this.$$destroyed = false;
				this.$$asyncQueue = [];
				this.$$listeners = {};
				this.$$isolateBindings = {};
			}

			Scope.prototype = {

				$new: function(isolate) {
					var Child, child;

					if (isFunction(isolate)) {
						// TODO: remove at some point
						throw Error('API-CHANGE: Use $controller to instantiate controllers.');
					}
					if (isolate) {
						child = new Scope();
						child.$root = this.$root;
					} else {
						Child = function() {}; // should be anonymous; This is so that when the minifier munges
						// the name it does not become random set of chars. These will then show up as class
						// name in the debugger.
						Child.prototype = this;
						child = new Child();
						child.$id = nextUid();
					}
					child['this'] = child;
					child.$$listeners = {};
					child.$parent = this;
					child.$$asyncQueue = [];
					child.$$watchers = child.$$nextSibling = child.$$childHead = child.$$childTail = null;
					child.$$prevSibling = this.$$childTail;
					if (this.$$childHead) {
						this.$$childTail.$$nextSibling = child;
						this.$$childTail = child;
					} else {
						this.$$childHead = this.$$childTail = child;
					}
					return child;
				},

				$watch: function(watchExp, listener, objectEquality) {
					var scope = this,
						get = compileToFn(watchExp, 'watch'),
						array = scope.$$watchers,
						watcher = {
							fn: listener,
							last: initWatchVal,
							get: get,
							exp: watchExp,
							eq: !! objectEquality
						};

					// in the case user pass string, we need to compile it, do we really need this ?
					if (!isFunction(listener)) {
						var listenFn = compileToFn(listener || noop, 'listener');
						watcher.fn = function(newVal, oldVal, scope) {
							listenFn(scope);
						};
					}

					if (!array) {
						array = scope.$$watchers = [];
					}
					// we use unshift since we use a while loop in $digest for speed.
					// the while loop reads in reverse order.
					array.unshift(watcher);

					return function() {
						arrayRemove(array, watcher);
					};
				},
				$digest: function() {
					var watch, value, last, watchers, asyncQueue, length, dirty, ttl = TTL,
						next, current, target = this,
						watchLog = [],
						logIdx, logMsg;

					beginPhase('$digest');

					do {
						dirty = false;
						current = target;
						do {
							asyncQueue = current.$$asyncQueue;
							while (asyncQueue.length) {
								try {
									current.$eval(asyncQueue.shift());
								} catch (e) {
									$exceptionHandler(e);
								}
							}
							if ((watchers = current.$$watchers)) {
								// process our watches
								length = watchers.length;
								while (length--) {
									try {
										watch = watchers[length];
										// Most common watches are on primitives, in which case we can short
										// circuit it with === operator, only when === fails do we use .equals
										if ((value = watch.get(current)) !== (last = watch.last) && !(watch.eq ? equals(value, last) : (typeof value == 'number' && typeof last == 'number' && isNaN(value) && isNaN(last)))) {
											dirty = true;
											watch.last = watch.eq ? copy(value) : value;
											watch.fn(value, ((last === initWatchVal) ? value : last), current);
											if (ttl < 5) {
												logIdx = 4 - ttl;
												if (!watchLog[logIdx]) watchLog[logIdx] = [];
												logMsg = (isFunction(watch.exp)) ? 'fn: ' + (watch.exp.name || watch.exp.toString()) : watch.exp;
												logMsg += '; newVal: ' + toJson(value) + '; oldVal: ' + toJson(last);
												watchLog[logIdx].push(logMsg);
											}
										}
									} catch (e) {
										$exceptionHandler(e);
									}
								}
							}

							// Insanity Warning: scope depth-first traversal
							// yes, this code is a bit crazy, but it works and we have tests to prove it!
							// this piece should be kept in sync with the traversal in $broadcast
							if (!(next = (current.$$childHead || (current !== target && current.$$nextSibling)))) {
								while (current !== target && !(next = current.$$nextSibling)) {
									current = current.$parent;
								}
							}
						} while ((current = next));

						if (dirty && !(ttl--)) {
							clearPhase();
							throw Error(TTL + ' $digest() iterations reached. Aborting!\n' + 'Watchers fired in the last 5 iterations: ' + toJson(watchLog));
						}
					} while (dirty || asyncQueue.length);

					clearPhase();
				},
				$destroy: function() {
					// we can't destroy the root scope or a scope that has been already destroyed
					if ($rootScope == this || this.$$destroyed) return;
					var parent = this.$parent;

					this.$broadcast('$destroy');
					this.$$destroyed = true;

					if (parent.$$childHead == this) parent.$$childHead = this.$$nextSibling;
					if (parent.$$childTail == this) parent.$$childTail = this.$$prevSibling;
					if (this.$$prevSibling) this.$$prevSibling.$$nextSibling = this.$$nextSibling;
					if (this.$$nextSibling) this.$$nextSibling.$$prevSibling = this.$$prevSibling;

					// This is bogus code that works around Chrome's GC leak
					// see: https://github.com/angular/angular.js/issues/1313#issuecomment-10378451
					this.$parent = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = null;
				},
				$eval: function(expr, locals) {
					return $parse(expr)(this, locals);
				},
				$evalAsync: function(expr) {
					this.$$asyncQueue.push(expr);
				},
				$apply: function(expr) {
					try {
						beginPhase('$apply');
						return this.$eval(expr);
					} catch (e) {
						$exceptionHandler(e);
					} finally {
						clearPhase();
						try {
							$rootScope.$digest();
						} catch (e) {
							$exceptionHandler(e);
							throw e;
						}
					}
				},
				$on: function(name, listener) {
					var namedListeners = this.$$listeners[name];
					if (!namedListeners) {
						this.$$listeners[name] = namedListeners = [];
					}
					namedListeners.push(listener);

					return function() {
						namedListeners[indexOf(namedListeners, listener)] = null;
					};
				},
				$emit: function(name, args) {
					var empty = [],
						namedListeners, scope = this,
						stopPropagation = false,
						event = {
							name: name,
							targetScope: scope,
							stopPropagation: function() {
								stopPropagation = true;
							},
							preventDefault: function() {
								event.defaultPrevented = true;
							},
							defaultPrevented: false
						},
						listenerArgs = concat([event], arguments, 1),
						i, length;

					do {
						namedListeners = scope.$$listeners[name] || empty;
						event.currentScope = scope;
						for (i = 0, length = namedListeners.length; i < length; i++) {

							// if listeners were deregistered, defragment the array
							if (!namedListeners[i]) {
								namedListeners.splice(i, 1);
								i--;
								length--;
								continue;
							}
							try {
								namedListeners[i].apply(null, listenerArgs);
								if (stopPropagation) return event;
							} catch (e) {
								$exceptionHandler(e);
							}
						}
						//traverse upwards
						scope = scope.$parent;
					} while (scope);

					return event;
				},
				$broadcast: function(name, args) {
					var target = this,
						current = target,
						next = target,
						event = {
							name: name,
							targetScope: target,
							preventDefault: function() {
								event.defaultPrevented = true;
							},
							defaultPrevented: false
						},
						listenerArgs = concat([event], arguments, 1),
						listeners, i, length;

					//down while you can, then up and next sibling or up and next sibling until back at root
					do {
						current = next;
						event.currentScope = current;
						listeners = current.$$listeners[name] || [];
						for (i = 0, length = listeners.length; i < length; i++) {
							// if listeners were deregistered, defragment the array
							if (!listeners[i]) {
								listeners.splice(i, 1);
								i--;
								length--;
								continue;
							}

							try {
								listeners[i].apply(null, listenerArgs);
							} catch (e) {
								$exceptionHandler(e);
							}
						}

						// Insanity Warning: scope depth-first traversal
						// yes, this code is a bit crazy, but it works and we have tests to prove it!
						// this piece should be kept in sync with the traversal in $digest
						if (!(next = (current.$$childHead || (current !== target && current.$$nextSibling)))) {
							while (current !== target && !(next = current.$$nextSibling)) {
								current = current.$parent;
							}
						}
					} while ((current = next));

					return event;
				}
			};

			var $rootScope = new Scope();

			return $rootScope;


			function beginPhase(phase) {
				if ($rootScope.$$phase) {
					throw Error($rootScope.$$phase + ' already in progress');
				}

				$rootScope.$$phase = phase;
			}

			function clearPhase() {
				$rootScope.$$phase = null;
			}

			function compileToFn(exp, name) {
				var fn = $parse(exp);
				assertArgFn(fn, name);
				return fn;
			}

			/**
			 * function used as an initial value for watchers.
			 * because it's unique we can easily tell it apart from other values
			 */

			function initWatchVal() {}
		}];
	}

	function $ExceptionHandlerProvider() {
		this.$get = ['$log', function($log) {
			return function(exception, cause) {
				$log.error.apply($log, arguments);
			};
		}];
	}

	function $LogProvider() {
		this.$get = ['$window', function($window) {
			return {
				log: consoleLog('log'),
				warn: consoleLog('warn'),
				info: consoleLog('info'),
				error: consoleLog('error')
			};

			function formatError(arg) {
				if (arg instanceof Error) {
					if (arg.stack) {
						arg = (arg.message && arg.stack.indexOf(arg.message) === -1) ? 'Error: ' + arg.message + '\n' + arg.stack : arg.stack;
					} else if (arg.sourceURL) {
						arg = arg.message + '\n' + arg.sourceURL + ':' + arg.line;
					}
				}
				return arg;
			}

			function consoleLog(type) {
				var console = $window.console || {},
					logFn = console[type] || console.log || noop;

				if (logFn.apply) {
					return function() {
						var args = [];
						forEach(arguments, function(arg) {
							args.push(formatError(arg));
						});
						return logFn.apply(console, args);
					};
				}

				// we are IE which either doesn't have window.console => this is noop and we do nothing,
				// or we are IE where console.log doesn't have apply so we log at least first 2 args
				return function(arg1, arg2) {
					logFn(arg1, arg2);
				}
			}
		}];
	}

	function $WindowProvider() {
		this.$get = valueFn(window);
	}

	function $ParseProvider() {
		var cache = {};
		this.$get = ['$filter', '$sniffer', function($filter, $sniffer) {
			return function(exp) {
				switch (typeof exp) {
				case 'string':
					return cache.hasOwnProperty(exp) ? cache[exp] : cache[exp] = parser(exp, false, $filter, $sniffer.csp);
				case 'function':
					return exp;
				default:
					return noop;
				}
			};
		}];
	}

	$FilterProvider.$inject = ['$provide'];

	function $FilterProvider($provide) {
		var suffix = 'Filter';

		function register(name, factory) {
			return $provide.factory(name + suffix, factory);
		}
		this.register = register;

		this.$get = ['$injector', function($injector) {
			return function(name) {
				return $injector.get(name + suffix);
			}
		}];

		////////////////////////////////////////
		// register('currency', currencyFilter);
		// register('date', dateFilter);
		// register('filter', filterFilter);
		// register('json', jsonFilter);
		// register('limitTo', limitToFilter);
		// register('lowercase', lowercaseFilter);
		// register('number', numberFilter);
		// register('orderBy', orderByFilter);
		// register('uppercase', uppercaseFilter);
	}

	function $SnifferProvider() {
		this.$get = ['$window', function($window) {
			var eventSupport = {},
				android = int((/android (\d+)/.exec(lowercase($window.navigator.userAgent)) || [])[1]);

			return {
				// Android has history.pushState, but it does not update location correctly
				// so let's not use the history API at all.
				// http://code.google.com/p/android/issues/detail?id=17471
				// https://github.com/angular/angular.js/issues/904
				history: !! ($window.history && $window.history.pushState && !(android < 4)),
				hashchange: 'onhashchange' in $window &&
				// IE8 compatible mode lies
				(!$window.document.documentMode || $window.document.documentMode > 7),
				hasEvent: function(event) {
					// IE9 implements 'input' event it's so fubared that we rather pretend that it doesn't have
					// it. In particular the event is not fired when backspace or delete key are pressed or
					// when cut operation is performed.
					if (event == 'input' && msie == 9) return false;

					if (isUndefined(eventSupport[event])) {
						var divElm = $window.document.createElement('div');
						eventSupport[event] = 'on' + event in divElm;
					}

					return eventSupport[event];
				},
				// TODO(i): currently there is no way to feature detect CSP without triggering alerts
				csp: false
			};
		}];
	}

	$CompileProvider.$inject = ['$provide'];

	function $CompileProvider($provide) {
		var hasDirectives = {},
			Suffix = 'Directive',
			COMMENT_DIRECTIVE_REGEXP = /^\s*directive\:\s*([\d\w\-_]+)\s+(.*)$/,
			CLASS_DIRECTIVE_REGEXP = /(([\d\w\-_]+)(?:\:([^;]+))?;?)/,
			MULTI_ROOT_TEMPLATE_ERROR = 'Template must have exactly one root element. was: ',
			urlSanitizationWhitelist = /^\s*(https?|ftp|mailto|file):/;


		/**
		 * @ngdoc function
		 * @name ng.$compileProvider#directive
		 * @methodOf ng.$compileProvider
		 * @function
		 *
		 * @description
		 * Register a new directives with the compiler.
		 *
		 * @param {string} name Name of the directive in camel-case. (ie <code>ngBind</code> which will match as
		 *                <code>ng-bind</code>).
		 * @param {function} directiveFactory An injectable directive factroy function. See {@link guide/directive} for more
		 *                info.
		 * @returns {ng.$compileProvider} Self for chaining.
		 */
		this.directive = function registerDirective(name, directiveFactory) {
			if (isString(name)) {
				assertArg(directiveFactory, 'directive');
				if (!hasDirectives.hasOwnProperty(name)) {
					hasDirectives[name] = [];
					$provide.factory(name + Suffix, ['$injector', '$exceptionHandler', function($injector, $exceptionHandler) {
						var directives = [];
						forEach(hasDirectives[name], function(directiveFactory) {
							try {
								var directive = $injector.invoke(directiveFactory);
								if (isFunction(directive)) {
									directive = {
										compile: valueFn(directive)
									};
								} else if (!directive.compile && directive.link) {
									directive.compile = valueFn(directive.link);
								}
								directive.priority = directive.priority || 0;
								directive.name = directive.name || name;
								directive.require = directive.require || (directive.controller && directive.name);
								directive.restrict = directive.restrict || 'A';
								directives.push(directive);
							} catch (e) {
								$exceptionHandler(e);
							}
						});
						return directives;
					}]);
				}
				hasDirectives[name].push(directiveFactory);
			} else {
				forEach(name, reverseParams(registerDirective));
			}
			return this;
		};

		this.urlSanitizationWhitelist = function(regexp) {
			if (isDefined(regexp)) {
				urlSanitizationWhitelist = regexp;
				return this;
			}
			return urlSanitizationWhitelist;
		};


		this.$get = ['$injector', '$interpolate', '$exceptionHandler', '$http', '$templateCache', '$parse', '$controller', '$rootScope', '$document', function($injector, $interpolate, $exceptionHandler, $http, $templateCache, $parse, $controller, $rootScope, $document) {

			var Attributes = function(element, attr) {
					this.$$element = element;
					this.$attr = attr || {};
				};

			Attributes.prototype = {
				$normalize: directiveNormalize,


				/**
				 * Set a normalized attribute on the element in a way such that all directives
				 * can share the attribute. This function properly handles boolean attributes.
				 * @param {string} key Normalized key. (ie ngAttribute)
				 * @param {string|boolean} value The value to set. If `null` attribute will be deleted.
				 * @param {boolean=} writeAttr If false, does not write the value to DOM element attribute.
				 *     Defaults to true.
				 * @param {string=} attrName Optional none normalized name. Defaults to key.
				 */
				$set: function(key, value, writeAttr, attrName) {
					var booleanKey = getBooleanAttrName(this.$$element[0], key),
						$$observers = this.$$observers,
						normalizedVal;

					if (booleanKey) {
						this.$$element.prop(key, value);
						attrName = booleanKey;
					}

					this[key] = value;

					// translate normalized key to actual key
					if (attrName) {
						this.$attr[key] = attrName;
					} else {
						attrName = this.$attr[key];
						if (!attrName) {
							this.$attr[key] = attrName = snake_case(key, '-');
						}
					}


					// sanitize a[href] values
					if (nodeName_(this.$$element[0]) === 'A' && key === 'href') {
						urlSanitizationNode.setAttribute('href', value);

						// href property always returns normalized absolute url, so we can match against that
						normalizedVal = urlSanitizationNode.href;
						if (!normalizedVal.match(urlSanitizationWhitelist)) {
							this[key] = value = 'unsafe:' + normalizedVal;
						}
					}


					if (writeAttr !== false) {
						if (value === null || value === undefined) {
							this.$$element.removeAttr(attrName);
						} else {
							this.$$element.attr(attrName, value);
						}
					}

					// fire observers
					$$observers && forEach($$observers[key], function(fn) {
						try {
							fn(value);
						} catch (e) {
							$exceptionHandler(e);
						}
					});
				},


				/**
				 * Observe an interpolated attribute.
				 * The observer will never be called, if given attribute is not interpolated.
				 *
				 * @param {string} key Normalized key. (ie ngAttribute) .
				 * @param {function(*)} fn Function that will be called whenever the attribute value changes.
				 * @returns {function(*)} the `fn` Function passed in.
				 */
				$observe: function(key, fn) {
					var attrs = this,
						$$observers = (attrs.$$observers || (attrs.$$observers = {})),
						listeners = ($$observers[key] || ($$observers[key] = []));

					listeners.push(fn);
					$rootScope.$evalAsync(function() {
						if (!listeners.$$inter) {
							// no one registered attribute interpolation function, so lets call it manually
							fn(attrs[key]);
						}
					});
					return fn;
				}
			};

			var urlSanitizationNode = $document[0].createElement('a'),
				startSymbol = $interpolate.startSymbol(),
				endSymbol = $interpolate.endSymbol(),
				denormalizeTemplate = (startSymbol == '{{' || endSymbol == '}}') ? identity : function denormalizeTemplate(template) {
					return template.replace(/\{\{/g, startSymbol).replace(/}}/g, endSymbol);
				};


			return compile;

			//================================

			function compile($compileNodes, transcludeFn, maxPriority) {
				if (!($compileNodes instanceof jqLite)) {
					// jquery always rewraps, whereas we need to preserve the original selector so that we can modify it.
					$compileNodes = jqLite($compileNodes);
				}
				// We can not compile top level text elements since text nodes can be merged and we will
				// not be able to attach scope data to them, so we will wrap them in <span>
				forEach($compileNodes, function(node, index) {
					if (node.nodeType == 3 /* text node */ && node.nodeValue.match(/\S+/) /* non-empty */ ) {
						$compileNodes[index] = jqLite(node).wrap('<span></span>').parent()[0];
					}
				});
				var compositeLinkFn = compileNodes($compileNodes, transcludeFn, $compileNodes, maxPriority);
				return function publicLinkFn(scope, cloneConnectFn) {
					assertArg(scope, 'scope');
					// important!!: we must call our jqLite.clone() since the jQuery one is trying to be smart
					// and sometimes changes the structure of the DOM.
					var $linkNode = cloneConnectFn ? JQLitePrototype.clone.call($compileNodes) // IMPORTANT!!!
					:
					$compileNodes;

					// Attach scope only to non-text nodes.
					for (var i = 0, ii = $linkNode.length; i < ii; i++) {
						var node = $linkNode[i];
						if (node.nodeType == 1 /* element */ || node.nodeType == 9 /* document */ ) {
							$linkNode.eq(i).data('$scope', scope);
						}
					}
					safeAddClass($linkNode, 'ng-scope');
					if (cloneConnectFn) cloneConnectFn($linkNode, scope);
					if (compositeLinkFn) compositeLinkFn(scope, $linkNode, $linkNode);
					return $linkNode;
				};
			}

			function wrongMode(localName, mode) {
				throw Error("Unsupported '" + mode + "' for '" + localName + "'.");
			}

			function safeAddClass($element, className) {
				try {
					$element.addClass(className);
				} catch (e) {
					// ignore, since it means that we are trying to set class on
					// SVG element, where class name is read-only.
				}
			}

			/**
			 * Compile function matches each node in nodeList against the directives. Once all directives
			 * for a particular node are collected their compile functions are executed. The compile
			 * functions return values - the linking functions - are combined into a composite linking
			 * function, which is the a linking function for the node.
			 *
			 * @param {NodeList} nodeList an array of nodes or NodeList to compile
			 * @param {function(angular.Scope[, cloneAttachFn]} transcludeFn A linking function, where the
			 *        scope argument is auto-generated to the new child of the transcluded parent scope.
			 * @param {DOMElement=} $rootElement If the nodeList is the root of the compilation tree then the
			 *        rootElement must be set the jqLite collection of the compile root. This is
			 *        needed so that the jqLite collection items can be replaced with widgets.
			 * @param {number=} max directive priority
			 * @returns {?function} A composite linking function of all of the matched directives or null.
			 */

			function compileNodes(nodeList, transcludeFn, $rootElement, maxPriority) {
				var linkFns = [],
					nodeLinkFn, childLinkFn, directives, attrs, linkFnFound;

				for (var i = 0; i < nodeList.length; i++) {
					attrs = new Attributes();

					// we must always refer to nodeList[i] since the nodes can be replaced underneath us.
					directives = collectDirectives(nodeList[i], [], attrs, maxPriority);

					nodeLinkFn = (directives.length) ? applyDirectivesToNode(directives, nodeList[i], attrs, transcludeFn, $rootElement) : null;

					childLinkFn = (nodeLinkFn && nodeLinkFn.terminal || !nodeList[i].childNodes || !nodeList[i].childNodes.length) ? null : compileNodes(nodeList[i].childNodes, nodeLinkFn ? nodeLinkFn.transclude : transcludeFn);

					linkFns.push(nodeLinkFn);
					linkFns.push(childLinkFn);
					linkFnFound = (linkFnFound || nodeLinkFn || childLinkFn);
				}

				// return a linking function if we have found anything, null otherwise
				return linkFnFound ? compositeLinkFn : null;

				function compositeLinkFn(scope, nodeList, $rootElement, boundTranscludeFn) {
					var nodeLinkFn, childLinkFn, node, childScope, childTranscludeFn, i, ii, n;

					// copy nodeList so that linking doesn't break due to live list updates.
					var stableNodeList = [];
					for (i = 0, ii = nodeList.length; i < ii; i++) {
						stableNodeList.push(nodeList[i]);
					}

					for (i = 0, n = 0, ii = linkFns.length; i < ii; n++) {
						node = stableNodeList[n];
						nodeLinkFn = linkFns[i++];
						childLinkFn = linkFns[i++];

						if (nodeLinkFn) {
							if (nodeLinkFn.scope) {
								childScope = scope.$new(isObject(nodeLinkFn.scope));
								jqLite(node).data('$scope', childScope);
							} else {
								childScope = scope;
							}
							childTranscludeFn = nodeLinkFn.transclude;
							if (childTranscludeFn || (!boundTranscludeFn && transcludeFn)) {
								nodeLinkFn(childLinkFn, childScope, node, $rootElement, (function(transcludeFn) {
									return function(cloneFn) {
										var transcludeScope = scope.$new();
										transcludeScope.$$transcluded = true;

										return transcludeFn(transcludeScope, cloneFn).
										bind('$destroy', bind(transcludeScope, transcludeScope.$destroy));
									};
								})(childTranscludeFn || transcludeFn));
							} else {
								nodeLinkFn(childLinkFn, childScope, node, undefined, boundTranscludeFn);
							}
						} else if (childLinkFn) {
							childLinkFn(scope, node.childNodes, undefined, boundTranscludeFn);
						}
					}
				}
			}


			/**
			 * Looks for directives on the given node and adds them to the directive collection which is
			 * sorted.
			 *
			 * @param node Node to search.
			 * @param directives An array to which the directives are added to. This array is sorted before
			 *        the function returns.
			 * @param attrs The shared attrs object which is used to populate the normalized attributes.
			 * @param {number=} maxPriority Max directive priority.
			 */

			function collectDirectives(node, directives, attrs, maxPriority) {
				var nodeType = node.nodeType,
					attrsMap = attrs.$attr,
					match, className;

				switch (nodeType) {
				case 1:
					/* Element */
					// use the node name: <directive>
					addDirective(directives, directiveNormalize(nodeName_(node).toLowerCase()), 'E', maxPriority);

					// iterate over the attributes
					for (var attr, name, nName, value, nAttrs = node.attributes, j = 0, jj = nAttrs && nAttrs.length; j < jj; j++) {
						attr = nAttrs[j];
						if (attr.specified) {
							name = attr.name;
							nName = directiveNormalize(name.toLowerCase());
							attrsMap[nName] = name;
							attrs[nName] = value = trim((msie && name == 'href') ? decodeURIComponent(node.getAttribute(name, 2)) : attr.value);
							if (getBooleanAttrName(node, nName)) {
								attrs[nName] = true; // presence means true
							}
							addAttrInterpolateDirective(node, directives, value, nName);
							addDirective(directives, nName, 'A', maxPriority);
						}
					}

					// use class as directive
					className = node.className;
					if (isString(className) && className !== '') {
						while (match = CLASS_DIRECTIVE_REGEXP.exec(className)) {
							nName = directiveNormalize(match[2]);
							if (addDirective(directives, nName, 'C', maxPriority)) {
								attrs[nName] = trim(match[3]);
							}
							className = className.substr(match.index + match[0].length);
						}
					}
					break;
				case 3:
					/* Text Node */
					addTextInterpolateDirective(directives, node.nodeValue);
					break;
				case 8:
					/* Comment */
					try {
						match = COMMENT_DIRECTIVE_REGEXP.exec(node.nodeValue);
						if (match) {
							nName = directiveNormalize(match[1]);
							if (addDirective(directives, nName, 'M', maxPriority)) {
								attrs[nName] = trim(match[2]);
							}
						}
					} catch (e) {
						// turns out that under some circumstances IE9 throws errors when one attempts to read comment's node value.
						// Just ignore it and continue. (Can't seem to reproduce in test case.)
					}
					break;
				}

				directives.sort(byPriority);
				return directives;
			}


			/**
			 * Once the directives have been collected their compile functions is executed. This method
			 * is responsible for inlining directive templates as well as terminating the application
			 * of the directives if the terminal directive has been reached..
			 *
			 * @param {Array} directives Array of collected directives to execute their compile function.
			 *        this needs to be pre-sorted by priority order.
			 * @param {Node} compileNode The raw DOM node to apply the compile functions to
			 * @param {Object} templateAttrs The shared attribute function
			 * @param {function(angular.Scope[, cloneAttachFn]} transcludeFn A linking function, where the
			 *        scope argument is auto-generated to the new child of the transcluded parent scope.
			 * @param {DOMElement} $rootElement If we are working on the root of the compile tree then this
			 *        argument has the root jqLite array so that we can replace widgets on it.
			 * @returns linkFn
			 */

			function applyDirectivesToNode(directives, compileNode, templateAttrs, transcludeFn, $rootElement) {
				var terminalPriority = -Number.MAX_VALUE,
					preLinkFns = [],
					postLinkFns = [],
					newScopeDirective = null,
					newIsolateScopeDirective = null,
					templateDirective = null,
					$compileNode = templateAttrs.$$element = jqLite(compileNode),
					directive, directiveName, $template, transcludeDirective, childTranscludeFn = transcludeFn,
					controllerDirectives, linkFn, directiveValue;

				// executes all directives on the current element
				for (var i = 0, ii = directives.length; i < ii; i++) {
					directive = directives[i];
					$template = undefined;

					if (terminalPriority > directive.priority) {
						break; // prevent further processing of directives
					}

					if (directiveValue = directive.scope) {
						assertNoDuplicate('isolated scope', newIsolateScopeDirective, directive, $compileNode);
						if (isObject(directiveValue)) {
							safeAddClass($compileNode, 'ng-isolate-scope');
							newIsolateScopeDirective = directive;
						}
						safeAddClass($compileNode, 'ng-scope');
						newScopeDirective = newScopeDirective || directive;
					}

					directiveName = directive.name;

					if (directiveValue = directive.controller) {
						controllerDirectives = controllerDirectives || {};
						assertNoDuplicate("'" + directiveName + "' controller", controllerDirectives[directiveName], directive, $compileNode);
						controllerDirectives[directiveName] = directive;
					}

					if (directiveValue = directive.transclude) {
						assertNoDuplicate('transclusion', transcludeDirective, directive, $compileNode);
						transcludeDirective = directive;
						terminalPriority = directive.priority;
						if (directiveValue == 'element') {
							$template = jqLite(compileNode);
							$compileNode = templateAttrs.$$element = jqLite(document.createComment(' ' + directiveName + ': ' + templateAttrs[directiveName] + ' '));
							compileNode = $compileNode[0];
							replaceWith($rootElement, jqLite($template[0]), compileNode);
							childTranscludeFn = compile($template, transcludeFn, terminalPriority);
						} else {
							$template = jqLite(JQLiteClone(compileNode)).contents();
							$compileNode.html(''); // clear contents
							childTranscludeFn = compile($template, transcludeFn);
						}
					}

					if ((directiveValue = directive.template)) {
						assertNoDuplicate('template', templateDirective, directive, $compileNode);
						templateDirective = directive;
						directiveValue = denormalizeTemplate(directiveValue);

						if (directive.replace) {
							$template = jqLite('<div>' + trim(directiveValue) + '</div>').contents();
							compileNode = $template[0];

							if ($template.length != 1 || compileNode.nodeType !== 1) {
								throw new Error(MULTI_ROOT_TEMPLATE_ERROR + directiveValue);
							}

							replaceWith($rootElement, $compileNode, compileNode);

							var newTemplateAttrs = {
								$attr: {}
							};

							// combine directives from the original node and from the template:
							// - take the array of directives for this element
							// - split it into two parts, those that were already applied and those that weren't
							// - collect directives from the template, add them to the second group and sort them
							// - append the second group with new directives to the first group
							directives = directives.concat(
							collectDirectives(
							compileNode, directives.splice(i + 1, directives.length - (i + 1)), newTemplateAttrs));
							mergeTemplateAttributes(templateAttrs, newTemplateAttrs);

							ii = directives.length;
						} else {
							$compileNode.html(directiveValue);
						}
					}

					if (directive.templateUrl) {
						assertNoDuplicate('template', templateDirective, directive, $compileNode);
						templateDirective = directive;
						nodeLinkFn = compileTemplateUrl(directives.splice(i, directives.length - i), nodeLinkFn, $compileNode, templateAttrs, $rootElement, directive.replace, childTranscludeFn);
						ii = directives.length;
					} else if (directive.compile) {
						try {
							linkFn = directive.compile($compileNode, templateAttrs, childTranscludeFn);
							if (isFunction(linkFn)) {
								addLinkFns(null, linkFn);
							} else if (linkFn) {
								addLinkFns(linkFn.pre, linkFn.post);
							}
						} catch (e) {
							$exceptionHandler(e, startingTag($compileNode));
						}
					}

					if (directive.terminal) {
						nodeLinkFn.terminal = true;
						terminalPriority = Math.max(terminalPriority, directive.priority);
					}

				}

				nodeLinkFn.scope = newScopeDirective && newScopeDirective.scope;
				nodeLinkFn.transclude = transcludeDirective && childTranscludeFn;

				// might be normal or delayed nodeLinkFn depending on if templateUrl is present
				return nodeLinkFn;

				////////////////////

				function addLinkFns(pre, post) {
					if (pre) {
						pre.require = directive.require;
						preLinkFns.push(pre);
					}
					if (post) {
						post.require = directive.require;
						postLinkFns.push(post);
					}
				}


				function getControllers(require, $element) {
					var value, retrievalMethod = 'data',
						optional = false;
					if (isString(require)) {
						while ((value = require.charAt(0)) == '^' || value == '?') {
							require = require.substr(1);
							if (value == '^') {
								retrievalMethod = 'inheritedData';
							}
							optional = optional || value == '?';
						}
						value = $element[retrievalMethod]('$' + require + 'Controller');
						if (!value && !optional) {
							throw Error("No controller: " + require);
						}
						return value;
					} else if (isArray(require)) {
						value = [];
						forEach(require, function(require) {
							value.push(getControllers(require, $element));
						});
					}
					return value;
				}


				function nodeLinkFn(childLinkFn, scope, linkNode, $rootElement, boundTranscludeFn) {
					var attrs, $element, i, ii, linkFn, controller;

					if (compileNode === linkNode) {
						attrs = templateAttrs;
					} else {
						attrs = shallowCopy(templateAttrs, new Attributes(jqLite(linkNode), templateAttrs.$attr));
					}
					$element = attrs.$$element;

					if (newIsolateScopeDirective) {
						var LOCAL_REGEXP = /^\s*([@=&])\s*(\w*)\s*$/;

						var parentScope = scope.$parent || scope;

						forEach(newIsolateScopeDirective.scope, function(definiton, scopeName) {
							var match = definiton.match(LOCAL_REGEXP) || [],
								attrName = match[2] || scopeName,
								mode = match[1],
								// @, =, or &
								lastValue, parentGet, parentSet;

							scope.$$isolateBindings[scopeName] = mode + attrName;

							switch (mode) {

							case '@':
								{
									attrs.$observe(attrName, function(value) {
										scope[scopeName] = value;
									});
									attrs.$$observers[attrName].$$scope = parentScope;
									break;
								}

							case '=':
								{
									parentGet = $parse(attrs[attrName]);
									parentSet = parentGet.assign ||
									function() {
										// reset the change, or we will throw this exception on every $digest
										lastValue = scope[scopeName] = parentGet(parentScope);
										throw Error(NON_ASSIGNABLE_MODEL_EXPRESSION + attrs[attrName] + ' (directive: ' + newIsolateScopeDirective.name + ')');
									};
									lastValue = scope[scopeName] = parentGet(parentScope);
									scope.$watch(function parentValueWatch() {
										var parentValue = parentGet(parentScope);

										if (parentValue !== scope[scopeName]) {
											// we are out of sync and need to copy
											if (parentValue !== lastValue) {
												// parent changed and it has precedence
												lastValue = scope[scopeName] = parentValue;
											} else {
												// if the parent can be assigned then do so
												parentSet(parentScope, parentValue = lastValue = scope[scopeName]);
											}
										}
										return parentValue;
									});
									break;
								}

							case '&':
								{
									parentGet = $parse(attrs[attrName]);
									scope[scopeName] = function(locals) {
										return parentGet(parentScope, locals);
									}
									break;
								}

							default:
								{
									throw Error('Invalid isolate scope definition for directive ' + newIsolateScopeDirective.name + ': ' + definiton);
								}
							}
						});
					}

					if (controllerDirectives) {
						forEach(controllerDirectives, function(directive) {
							var locals = {
								$scope: scope,
								$element: $element,
								$attrs: attrs,
								$transclude: boundTranscludeFn
							};

							controller = directive.controller;
							if (controller == '@') {
								controller = attrs[directive.name];
							}

							$element.data('$' + directive.name + 'Controller', $controller(controller, locals));
						});
					}

					// PRELINKING
					for (i = 0, ii = preLinkFns.length; i < ii; i++) {
						try {
							linkFn = preLinkFns[i];
							linkFn(scope, $element, attrs, linkFn.require && getControllers(linkFn.require, $element));
						} catch (e) {
							$exceptionHandler(e, startingTag($element));
						}
					}

					// RECURSION
					childLinkFn && childLinkFn(scope, linkNode.childNodes, undefined, boundTranscludeFn);

					// POSTLINKING
					for (i = 0, ii = postLinkFns.length; i < ii; i++) {
						try {
							linkFn = postLinkFns[i];
							linkFn(scope, $element, attrs, linkFn.require && getControllers(linkFn.require, $element));
						} catch (e) {
							$exceptionHandler(e, startingTag($element));
						}
					}
				}
			}


			/**
			 * looks up the directive and decorates it with exception handling and proper parameters. We
			 * call this the boundDirective.
			 *
			 * @param {string} name name of the directive to look up.
			 * @param {string} location The directive must be found in specific format.
			 *   String containing any of theses characters:
			 *
			 *   * `E`: element name
			 *   * `A': attribute
			 *   * `C`: class
			 *   * `M`: comment
			 * @returns true if directive was added.
			 */

			function addDirective(tDirectives, name, location, maxPriority) {
				var match = false;
				if (hasDirectives.hasOwnProperty(name)) {
					for (var directive, directives = $injector.get(name + Suffix), i = 0, ii = directives.length; i < ii; i++) {
						try {
							directive = directives[i];
							if ((maxPriority === undefined || maxPriority > directive.priority) && directive.restrict.indexOf(location) != -1) {
								tDirectives.push(directive);
								match = true;
							}
						} catch (e) {
							$exceptionHandler(e);
						}
					}
				}
				return match;
			}


			/**
			 * When the element is replaced with HTML template then the new attributes
			 * on the template need to be merged with the existing attributes in the DOM.
			 * The desired effect is to have both of the attributes present.
			 *
			 * @param {object} dst destination attributes (original DOM)
			 * @param {object} src source attributes (from the directive template)
			 */

			function mergeTemplateAttributes(dst, src) {
				var srcAttr = src.$attr,
					dstAttr = dst.$attr,
					$element = dst.$$element;

				// reapply the old attributes to the new element
				forEach(dst, function(value, key) {
					if (key.charAt(0) != '$') {
						if (src[key]) {
							value += (key === 'style' ? ';' : ' ') + src[key];
						}
						dst.$set(key, value, true, srcAttr[key]);
					}
				});

				// copy the new attributes on the old attrs object
				forEach(src, function(value, key) {
					if (key == 'class') {
						safeAddClass($element, value);
						dst['class'] = (dst['class'] ? dst['class'] + ' ' : '') + value;
					} else if (key == 'style') {
						$element.attr('style', $element.attr('style') + ';' + value);
					} else if (key.charAt(0) != '$' && !dst.hasOwnProperty(key)) {
						dst[key] = value;
						dstAttr[key] = srcAttr[key];
					}
				});
			}


			function compileTemplateUrl(directives, beforeTemplateNodeLinkFn, $compileNode, tAttrs, $rootElement, replace, childTranscludeFn) {
				var linkQueue = [],
					afterTemplateNodeLinkFn, afterTemplateChildLinkFn, beforeTemplateCompileNode = $compileNode[0],
					origAsyncDirective = directives.shift(),
					// The fact that we have to copy and patch the directive seems wrong!
					derivedSyncDirective = extend({}, origAsyncDirective, {
						controller: null,
						templateUrl: null,
						transclude: null,
						scope: null
					});

				$compileNode.html('');

				$http.get(origAsyncDirective.templateUrl, {
					cache: $templateCache
				}).
				success(function(content) {
					var compileNode, tempTemplateAttrs, $template;

					content = denormalizeTemplate(content);

					if (replace) {
						$template = jqLite('<div>' + trim(content) + '</div>').contents();
						compileNode = $template[0];

						if ($template.length != 1 || compileNode.nodeType !== 1) {
							throw new Error(MULTI_ROOT_TEMPLATE_ERROR + content);
						}

						tempTemplateAttrs = {
							$attr: {}
						};
						replaceWith($rootElement, $compileNode, compileNode);
						collectDirectives(compileNode, directives, tempTemplateAttrs);
						mergeTemplateAttributes(tAttrs, tempTemplateAttrs);
					} else {
						compileNode = beforeTemplateCompileNode;
						$compileNode.html(content);
					}

					directives.unshift(derivedSyncDirective);
					afterTemplateNodeLinkFn = applyDirectivesToNode(directives, compileNode, tAttrs, childTranscludeFn);
					afterTemplateChildLinkFn = compileNodes($compileNode[0].childNodes, childTranscludeFn);


					while (linkQueue.length) {
						var controller = linkQueue.pop(),
							linkRootElement = linkQueue.pop(),
							beforeTemplateLinkNode = linkQueue.pop(),
							scope = linkQueue.pop(),
							linkNode = compileNode;

						if (beforeTemplateLinkNode !== beforeTemplateCompileNode) {
							// it was cloned therefore we have to clone as well.
							linkNode = JQLiteClone(compileNode);
							replaceWith(linkRootElement, jqLite(beforeTemplateLinkNode), linkNode);
						}

						afterTemplateNodeLinkFn(function() {
							beforeTemplateNodeLinkFn(afterTemplateChildLinkFn, scope, linkNode, $rootElement, controller);
						}, scope, linkNode, $rootElement, controller);
					}
					linkQueue = null;
				}).
				error(function(response, code, headers, config) {
					throw Error('Failed to load template: ' + config.url);
				});

				return function delayedNodeLinkFn(ignoreChildLinkFn, scope, node, rootElement, controller) {
					if (linkQueue) {
						linkQueue.push(scope);
						linkQueue.push(node);
						linkQueue.push(rootElement);
						linkQueue.push(controller);
					} else {
						afterTemplateNodeLinkFn(function() {
							beforeTemplateNodeLinkFn(afterTemplateChildLinkFn, scope, node, rootElement, controller);
						}, scope, node, rootElement, controller);
					}
				};
			}


			/**
			 * Sorting function for bound directives.
			 */

			function byPriority(a, b) {
				return b.priority - a.priority;
			}


			function assertNoDuplicate(what, previousDirective, directive, element) {
				if (previousDirective) {
					throw Error('Multiple directives [' + previousDirective.name + ', ' + directive.name + '] asking for ' + what + ' on: ' + startingTag(element));
				}
			}


			function addTextInterpolateDirective(directives, text) {
				var interpolateFn = $interpolate(text, true);
				if (interpolateFn) {
					directives.push({
						priority: 0,
						compile: valueFn(function textInterpolateLinkFn(scope, node) {
							var parent = node.parent(),
								bindings = parent.data('$binding') || [];
							bindings.push(interpolateFn);
							safeAddClass(parent.data('$binding', bindings), 'ng-binding');
							scope.$watch(interpolateFn, function interpolateFnWatchAction(value) {
								node[0].nodeValue = value;
							});
						})
					});
				}
			}


			function addAttrInterpolateDirective(node, directives, value, name) {
				var interpolateFn = $interpolate(value, true);

				// no interpolation found -> ignore
				if (!interpolateFn) return;


				directives.push({
					priority: 100,
					compile: valueFn(function attrInterpolateLinkFn(scope, element, attr) {
						var $$observers = (attr.$$observers || (attr.$$observers = {}));

						if (name === 'class') {
							// we need to interpolate classes again, in the case the element was replaced
							// and therefore the two class attrs got merged - we want to interpolate the result
							interpolateFn = $interpolate(attr[name], true);
						}

						attr[name] = undefined;
						($$observers[name] || ($$observers[name] = [])).$$inter = true;
						(attr.$$observers && attr.$$observers[name].$$scope || scope).
						$watch(interpolateFn, function interpolateFnWatchAction(value) {
							attr.$set(name, value);
						});
					})
				});
			}


			/**
			 * This is a special jqLite.replaceWith, which can replace items which
			 * have no parents, provided that the containing jqLite collection is provided.
			 *
			 * @param {JqLite=} $rootElement The root of the compile tree. Used so that we can replace nodes
			 *    in the root of the tree.
			 * @param {JqLite} $element The jqLite element which we are going to replace. We keep the shell,
			 *    but replace its DOM node reference.
			 * @param {Node} newNode The new DOM node.
			 */

			function replaceWith($rootElement, $element, newNode) {
				var oldNode = $element[0],
					parent = oldNode.parentNode,
					i, ii;

				if ($rootElement) {
					for (i = 0, ii = $rootElement.length; i < ii; i++) {
						if ($rootElement[i] == oldNode) {
							$rootElement[i] = newNode;
							break;
						}
					}
				}

				if (parent) {
					parent.replaceChild(newNode, oldNode);
				}

				newNode[jqLite.expando] = oldNode[jqLite.expando];
				$element[0] = newNode;
			}
		}];
	}

	function $InterpolateProvider() {
		var startSymbol = '{{';
		var endSymbol = '}}';

		this.startSymbol = function(value) {
			if (value) {
				startSymbol = value;
				return this;
			} else {
				return startSymbol;
			}
		};

		this.endSymbol = function(value) {
			if (value) {
				endSymbol = value;
				return this;
			} else {
				return endSymbol;
			}
		};


		this.$get = ['$parse', function($parse) {
			var startSymbolLength = startSymbol.length,
				endSymbolLength = endSymbol.length;

			function $interpolate(text, mustHaveExpression) {
				var startIndex, endIndex, index = 0,
					parts = [],
					length = text.length,
					hasInterpolation = false,
					fn, exp, concat = [];

				while (index < length) {
					if (((startIndex = text.indexOf(startSymbol, index)) != -1) && ((endIndex = text.indexOf(endSymbol, startIndex + startSymbolLength)) != -1)) {
						(index != startIndex) && parts.push(text.substring(index, startIndex));
						parts.push(fn = $parse(exp = text.substring(startIndex + startSymbolLength, endIndex)));
						fn.exp = exp;
						index = endIndex + endSymbolLength;
						hasInterpolation = true;
					} else {
						// we did not find anything, so we have to add the remainder to the parts array
						(index != length) && parts.push(text.substring(index));
						index = length;
					}
				}

				if (!(length = parts.length)) {
					// we added, nothing, must have been an empty string.
					parts.push('');
					length = 1;
				}

				if (!mustHaveExpression || hasInterpolation) {
					concat.length = length;
					fn = function(context) {
						for (var i = 0, ii = length, part; i < ii; i++) {
							if (typeof(part = parts[i]) == 'function') {
								part = part(context);
								if (part == null || part == undefined) {
									part = '';
								} else if (typeof part != 'string') {
									part = toJson(part);
								}
							}
							concat[i] = part;
						}
						return concat.join('');
					};
					fn.exp = text;
					fn.parts = parts;
					return fn;
				}
			}


			/**
			 * @ngdoc method
			 * @name ng.$interpolate#startSymbol
			 * @methodOf ng.$interpolate
			 * @description
			 * Symbol to denote the start of expression in the interpolated string. Defaults to `{{`.
			 *
			 * Use {@link ng.$interpolateProvider#startSymbol $interpolateProvider#startSymbol} to change
			 * the symbol.
			 *
			 * @returns {string} start symbol.
			 */
			$interpolate.startSymbol = function() {
				return startSymbol;
			}


			/**
			 * @ngdoc method
			 * @name ng.$interpolate#endSymbol
			 * @methodOf ng.$interpolate
			 * @description
			 * Symbol to denote the end of expression in the interpolated string. Defaults to `}}`.
			 *
			 * Use {@link ng.$interpolateProvider#endSymbol $interpolateProvider#endSymbol} to change
			 * the symbol.
			 *
			 * @returns {string} start symbol.
			 */
			$interpolate.endSymbol = function() {
				return endSymbol;
			}

			return $interpolate;
		}];
	}

	function $HttpProvider() {
		var JSON_START = /^\s*(\[|\{[^\{])/,
			JSON_END = /[\}\]]\s*$/,
			PROTECTION_PREFIX = /^\)\]\}',?\n/;

		var $config = this.defaults = {
			// transform incoming response data
			transformResponse: [function(data) {
				if (isString(data)) {
					// strip json vulnerability protection prefix
					data = data.replace(PROTECTION_PREFIX, '');
					if (JSON_START.test(data) && JSON_END.test(data)) data = fromJson(data, true);
				}
				return data;
			}],

			// transform outgoing request data
			transformRequest: [function(d) {
				return isObject(d) && !isFile(d) ? toJson(d) : d;
			}],

			// default headers
			headers: {
				common: {
					'Accept': 'application/json, text/plain, */*',
					'X-Requested-With': 'XMLHttpRequest'
				},
				post: {
					'Content-Type': 'application/json;charset=utf-8'
				},
				put: {
					'Content-Type': 'application/json;charset=utf-8'
				}
			}
		};

		var providerResponseInterceptors = this.responseInterceptors = [];

		this.$get = ['$httpBackend', '$browser', '$cacheFactory', '$rootScope', '$q', '$injector', function($httpBackend, $browser, $cacheFactory, $rootScope, $q, $injector) {

			var defaultCache = $cacheFactory('$http'),
				responseInterceptors = [];

			forEach(providerResponseInterceptors, function(interceptor) {
				responseInterceptors.push(
				isString(interceptor) ? $injector.get(interceptor) : $injector.invoke(interceptor));
			});

			function $http(config) {
				config.method = uppercase(config.method);

				var reqTransformFn = config.transformRequest || $config.transformRequest,
					respTransformFn = config.transformResponse || $config.transformResponse,
					defHeaders = $config.headers,
					reqHeaders = extend({
						'X-XSRF-TOKEN': $browser.cookies()['XSRF-TOKEN']
					}, defHeaders.common, defHeaders[lowercase(config.method)], config.headers),
					reqData = transformData(config.data, headersGetter(reqHeaders), reqTransformFn),
					promise;

				// strip content-type if data is undefined
				if (isUndefined(config.data)) {
					delete reqHeaders['Content-Type'];
				}

				// send request
				promise = sendReq(config, reqData, reqHeaders);


				// transform future response
				promise = promise.then(transformResponse, transformResponse);

				// apply interceptors
				forEach(responseInterceptors, function(interceptor) {
					promise = interceptor(promise);
				});

				promise.success = function(fn) {
					promise.then(function(response) {
						fn(response.data, response.status, response.headers, config);
					});
					return promise;
				};

				promise.error = function(fn) {
					promise.then(null, function(response) {
						fn(response.data, response.status, response.headers, config);
					});
					return promise;
				};

				return promise;

				function transformResponse(response) {
					// make a copy since the response must be cacheable
					var resp = extend({}, response, {
						data: transformData(response.data, response.headers, respTransformFn)
					});
					return (isSuccess(response.status)) ? resp : $q.reject(resp);
				}
			}

			$http.pendingRequests = [];

			/**
			 * @ngdoc method
			 * @name ng.$http#get
			 * @methodOf ng.$http
			 *
			 * @description
			 * Shortcut method to perform `GET` request
			 *
			 * @param {string} url Relative or absolute URL specifying the destination of the request
			 * @param {Object=} config Optional configuration object
			 * @returns {HttpPromise} Future object
			 */

			/**
			 * @ngdoc method
			 * @name ng.$http#delete
			 * @methodOf ng.$http
			 *
			 * @description
			 * Shortcut method to perform `DELETE` request
			 *
			 * @param {string} url Relative or absolute URL specifying the destination of the request
			 * @param {Object=} config Optional configuration object
			 * @returns {HttpPromise} Future object
			 */

			/**
			 * @ngdoc method
			 * @name ng.$http#head
			 * @methodOf ng.$http
			 *
			 * @description
			 * Shortcut method to perform `HEAD` request
			 *
			 * @param {string} url Relative or absolute URL specifying the destination of the request
			 * @param {Object=} config Optional configuration object
			 * @returns {HttpPromise} Future object
			 */

			/**
			 * @ngdoc method
			 * @name ng.$http#jsonp
			 * @methodOf ng.$http
			 *
			 * @description
			 * Shortcut method to perform `JSONP` request
			 *
			 * @param {string} url Relative or absolute URL specifying the destination of the request.
			 *                     Should contain `JSON_CALLBACK` string.
			 * @param {Object=} config Optional configuration object
			 * @returns {HttpPromise} Future object
			 */
			createShortMethods('get', 'delete', 'head', 'jsonp');

			/**
			 * @ngdoc method
			 * @name ng.$http#post
			 * @methodOf ng.$http
			 *
			 * @description
			 * Shortcut method to perform `POST` request
			 *
			 * @param {string} url Relative or absolute URL specifying the destination of the request
			 * @param {*} data Request content
			 * @param {Object=} config Optional configuration object
			 * @returns {HttpPromise} Future object
			 */

			/**
			 * @ngdoc method
			 * @name ng.$http#put
			 * @methodOf ng.$http
			 *
			 * @description
			 * Shortcut method to perform `PUT` request
			 *
			 * @param {string} url Relative or absolute URL specifying the destination of the request
			 * @param {*} data Request content
			 * @param {Object=} config Optional configuration object
			 * @returns {HttpPromise} Future object
			 */
			createShortMethodsWithData('post', 'put');

			/**
			 * @ngdoc property
			 * @name ng.$http#defaults
			 * @propertyOf ng.$http
			 *
			 * @description
			 * Runtime equivalent of the `$httpProvider.defaults` property. Allows configuration of
			 * default headers as well as request and response transformations.
			 *
			 * See "Setting HTTP Headers" and "Transforming Requests and Responses" sections above.
			 */
			$http.defaults = $config;


			return $http;


			function createShortMethods(names) {
				forEach(arguments, function(name) {
					$http[name] = function(url, config) {
						return $http(extend(config || {}, {
							method: name,
							url: url
						}));
					};
				});
			}


			function createShortMethodsWithData(name) {
				forEach(arguments, function(name) {
					$http[name] = function(url, data, config) {
						return $http(extend(config || {}, {
							method: name,
							url: url,
							data: data
						}));
					};
				});
			}


			/**
			 * Makes the request
			 *
			 * !!! ACCESSES CLOSURE VARS:
			 * $httpBackend, $config, $log, $rootScope, defaultCache, $http.pendingRequests
			 */

			function sendReq(config, reqData, reqHeaders) {
				var deferred = $q.defer(),
					promise = deferred.promise,
					cache, cachedResp, url = buildUrl(config.url, config.params);

				$http.pendingRequests.push(config);
				promise.then(removePendingReq, removePendingReq);


				if (config.cache && config.method == 'GET') {
					cache = isObject(config.cache) ? config.cache : defaultCache;
				}

				if (cache) {
					cachedResp = cache.get(url);
					if (cachedResp) {
						if (cachedResp.then) {
							// cached request has already been sent, but there is no response yet
							cachedResp.then(removePendingReq, removePendingReq);
							return cachedResp;
						} else {
							// serving from cache
							if (isArray(cachedResp)) {
								resolvePromise(cachedResp[1], cachedResp[0], copy(cachedResp[2]));
							} else {
								resolvePromise(cachedResp, 200, {});
							}
						}
					} else {
						// put the promise for the non-transformed response into cache as a placeholder
						cache.put(url, promise);
					}
				}

				// if we won't have the response in cache, send the request to the backend
				if (!cachedResp) {
					$httpBackend(config.method, url, reqData, done, reqHeaders, config.timeout, config.withCredentials);
				}

				return promise;


				/**
				 * Callback registered to $httpBackend():
				 *  - caches the response if desired
				 *  - resolves the raw $http promise
				 *  - calls $apply
				 */

				function done(status, response, headersString) {
					if (cache) {
						if (isSuccess(status)) {
							cache.put(url, [status, response, parseHeaders(headersString)]);
						} else {
							// remove promise from the cache
							cache.remove(url);
						}
					}

					resolvePromise(response, status, headersString);
					$rootScope.$apply();
				}


				/**
				 * Resolves the raw $http promise.
				 */

				function resolvePromise(response, status, headers) {
					// normalize internal statuses to 0
					status = Math.max(status, 0);

					(isSuccess(status) ? deferred.resolve : deferred.reject)({
						data: response,
						status: status,
						headers: headersGetter(headers),
						config: config
					});
				}


				function removePendingReq() {
					var idx = indexOf($http.pendingRequests, config);
					if (idx !== -1) $http.pendingRequests.splice(idx, 1);
				}
			}


			function buildUrl(url, params) {
				if (!params) return url;
				var parts = [];
				forEachSorted(params, function(value, key) {
					if (value == null || value == undefined) return;
					if (isObject(value)) {
						value = toJson(value);
					}
					parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
				});
				return url + ((url.indexOf('?') == -1) ? '?' : '&') + parts.join('&');
			}


		}];
	}

	var XHR = window.XMLHttpRequest ||
	function() {
		try {
			return new ActiveXObject("Msxml2.XMLHTTP.6.0");
		} catch (e1) {}
		try {
			return new ActiveXObject("Msxml2.XMLHTTP.3.0");
		} catch (e2) {}
		try {
			return new ActiveXObject("Msxml2.XMLHTTP");
		} catch (e3) {}
		throw new Error("This browser does not support XMLHttpRequest.");
	};

	function $HttpBackendProvider() {
		this.$get = ['$browser', '$window', '$document', function($browser, $window, $document) {
			return createHttpBackend($browser, XHR, $browser.defer, $window.angular.callbacks, $document[0], $window.location.protocol.replace(':', ''));
		}];
	}

	function createHttpBackend($browser, XHR, $browserDefer, callbacks, rawDocument, locationProtocol) {
		// TODO(vojta): fix the signature
		return function(method, url, post, callback, headers, timeout, withCredentials) {
			$browser.$$incOutstandingRequestCount();
			url = url || $browser.url();

			if (lowercase(method) == 'jsonp') {
				var callbackId = '_' + (callbacks.counter++).toString(36);
				callbacks[callbackId] = function(data) {
					callbacks[callbackId].data = data;
				};

				jsonpReq(url.replace('JSON_CALLBACK', 'angular.callbacks.' + callbackId), function() {
					if (callbacks[callbackId].data) {
						completeRequest(callback, 200, callbacks[callbackId].data);
					} else {
						completeRequest(callback, -2);
					}
					delete callbacks[callbackId];
				});
			} else {
				var xhr = new XHR();
				xhr.open(method, url, true);
				forEach(headers, function(value, key) {
					if (value) xhr.setRequestHeader(key, value);
				});

				var status;

				// In IE6 and 7, this might be called synchronously when xhr.send below is called and the
				// response is in the cache. the promise api will ensure that to the app code the api is
				// always async
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						var responseHeaders = xhr.getAllResponseHeaders();

						// TODO(vojta): remove once Firefox 21 gets released.
						// begin: workaround to overcome Firefox CORS http response headers bug
						// https://bugzilla.mozilla.org/show_bug.cgi?id=608735
						// Firefox already patched in nightly. Should land in Firefox 21.
						// CORS "simple response headers" http://www.w3.org/TR/cors/
						var value, simpleHeaders = ["Cache-Control", "Content-Language", "Content-Type", "Expires", "Last-Modified", "Pragma"];
						if (!responseHeaders) {
							responseHeaders = "";
							forEach(simpleHeaders, function(header) {
								var value = xhr.getResponseHeader(header);
								if (value) {
									responseHeaders += header + ": " + value + "\n";
								}
							});
						}
						// end of the workaround.
						completeRequest(callback, status || xhr.status, xhr.responseText, responseHeaders);
					}
				};

				if (withCredentials) {
					xhr.withCredentials = true;
				}

				xhr.send(post || '');

				if (timeout > 0) {
					$browserDefer(function() {
						status = -1;
						xhr.abort();
					}, timeout);
				}
			}


			function completeRequest(callback, status, response, headersString) {
				// URL_MATCH is defined in src/service/location.js
				var protocol = (url.match(URL_MATCH) || ['', locationProtocol])[1];

				// fix status code for file protocol (it's always 0)
				status = (protocol == 'file') ? (response ? 200 : 404) : status;

				// normalize IE bug (http://bugs.jquery.com/ticket/1450)
				status = status == 1223 ? 204 : status;

				callback(status, response, headersString);
				$browser.$$completeOutstandingRequest(noop);
			}
		};

		function jsonpReq(url, done) {
			// we can't use jQuery/jqLite here because jQuery does crazy shit with script elements, e.g.:
			// - fetches local scripts via XHR and evals them
			// - adds and immediately removes script elements from the document
			var script = rawDocument.createElement('script'),
				doneWrapper = function() {
					rawDocument.body.removeChild(script);
					if (done) done();
				};

			script.type = 'text/javascript';
			script.src = url;

			if (msie) {
				script.onreadystatechange = function() {
					if (/loaded|complete/.test(script.readyState)) doneWrapper();
				};
			} else {
				script.onload = script.onerror = doneWrapper;
			}

			rawDocument.body.appendChild(script);
		}
	}

	function $BrowserProvider() {
		this.$get = ['$window', '$log', '$sniffer', '$document', function($window, $log, $sniffer, $document) {
			return new Browser($window, $document, $log, $sniffer);
		}];
	}

	function $DocumentProvider() {
		this.$get = ['$window', function(window) {
			return jqLite(window.document);
		}];
	}

	function Browser(window, document, $log, $sniffer) {
		var self = this,
			rawDocument = document[0],
			location = window.location,
			history = window.history,
			setTimeout = window.setTimeout,
			clearTimeout = window.clearTimeout,
			pendingDeferIds = {};

		self.isMock = false;

		var outstandingRequestCount = 0;
		var outstandingRequestCallbacks = [];

		// TODO(vojta): remove this temporary api
		self.$$completeOutstandingRequest = completeOutstandingRequest;
		self.$$incOutstandingRequestCount = function() {
			outstandingRequestCount++;
		};

		/**
		 * Executes the `fn` function(supports currying) and decrements the `outstandingRequestCallbacks`
		 * counter. If the counter reaches 0, all the `outstandingRequestCallbacks` are executed.
		 */

		function completeOutstandingRequest(fn) {
			try {
				fn.apply(null, sliceArgs(arguments, 1));
			} finally {
				outstandingRequestCount--;
				if (outstandingRequestCount === 0) {
					while (outstandingRequestCallbacks.length) {
						try {
							outstandingRequestCallbacks.pop()();
						} catch (e) {
							$log.error(e);
						}
					}
				}
			}
		}

		/**
		 * @private
		 * Note: this method is used only by scenario runner
		 * TODO(vojta): prefix this method with $$ ?
		 * @param {function()} callback Function that will be called when no outstanding request
		 */
		self.notifyWhenNoOutstandingRequests = function(callback) {
			// force browser to execute all pollFns - this is needed so that cookies and other pollers fire
			// at some deterministic time in respect to the test runner's actions. Leaving things up to the
			// regular poller would result in flaky tests.
			forEach(pollFns, function(pollFn) {
				pollFn();
			});

			if (outstandingRequestCount === 0) {
				callback();
			} else {
				outstandingRequestCallbacks.push(callback);
			}
		};

		//////////////////////////////////////////////////////////////
		// Poll Watcher API
		//////////////////////////////////////////////////////////////
		var pollFns = [],
			pollTimeout;

		/**
		 * @name ng.$browser#addPollFn
		 * @methodOf ng.$browser
		 *
		 * @param {function()} fn Poll function to add
		 *
		 * @description
		 * Adds a function to the list of functions that poller periodically executes,
		 * and starts polling if not started yet.
		 *
		 * @returns {function()} the added function
		 */
		self.addPollFn = function(fn) {
			if (isUndefined(pollTimeout)) startPoller(100, setTimeout);
			pollFns.push(fn);
			return fn;
		};

		/**
		 * @param {number} interval How often should browser call poll functions (ms)
		 * @param {function()} setTimeout Reference to a real or fake `setTimeout` function.
		 *
		 * @description
		 * Configures the poller to run in the specified intervals, using the specified
		 * setTimeout fn and kicks it off.
		 */

		function startPoller(interval, setTimeout) {
			(function check() {
				forEach(pollFns, function(pollFn) {
					pollFn();
				});
				pollTimeout = setTimeout(check, interval);
			})();
		}

		//////////////////////////////////////////////////////////////
		// URL API
		//////////////////////////////////////////////////////////////
		var lastBrowserUrl = location.href,
			baseElement = document.find('base');

		self.url = function(url, replace) {
			// setter
			if (url) {
				if (lastBrowserUrl == url) return;
				lastBrowserUrl = url;
				if ($sniffer.history) {
					if (replace) history.replaceState(null, '', url);
					else {
						history.pushState(null, '', url);
						// Crazy Opera Bug: http://my.opera.com/community/forums/topic.dml?id=1185462
						baseElement.attr('href', baseElement.attr('href'));
					}
				} else {
					if (replace) location.replace(url);
					else location.href = url;
				}
				return self;
				// getter
			} else {
				// the replacement is a workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=407172
				return location.href.replace(/%27/g, "'");
			}
		};

		var urlChangeListeners = [],
			urlChangeInit = false;

		function fireUrlChange() {
			if (lastBrowserUrl == self.url()) return;

			lastBrowserUrl = self.url();
			forEach(urlChangeListeners, function(listener) {
				listener(self.url());
			});
		}

		self.onUrlChange = function(callback) {
			if (!urlChangeInit) {
				// We listen on both (hashchange/popstate) when available, as some browsers (e.g. Opera)
				// don't fire popstate when user change the address bar and don't fire hashchange when url
				// changed by push/replaceState
				// html5 history api - popstate event
				if ($sniffer.history) jqLite(window).bind('popstate', fireUrlChange);
				// hashchange event
				if ($sniffer.hashchange) jqLite(window).bind('hashchange', fireUrlChange);
				// polling
				else self.addPollFn(fireUrlChange);

				urlChangeInit = true;
			}

			urlChangeListeners.push(callback);
			return callback;
		};

		//////////////////////////////////////////////////////////////
		// Misc API
		//////////////////////////////////////////////////////////////
		/**
		 * Returns current <base href>
		 * (always relative - without domain)
		 *
		 * @returns {string=}
		 */
		self.baseHref = function() {
			var href = baseElement.attr('href');
			return href ? href.replace(/^https?\:\/\/[^\/]*/, '') : '';
		};

		//////////////////////////////////////////////////////////////
		// Cookies API
		//////////////////////////////////////////////////////////////
		var lastCookies = {};
		var lastCookieString = '';
		var cookiePath = self.baseHref();

		self.cookies = function(name, value) {
			var cookieLength, cookieArray, cookie, i, index;

			if (name) {
				if (value === undefined) {
					rawDocument.cookie = escape(name) + "=;path=" + cookiePath + ";expires=Thu, 01 Jan 1970 00:00:00 GMT";
				} else {
					if (isString(value)) {
						cookieLength = (rawDocument.cookie = escape(name) + '=' + escape(value) + ';path=' + cookiePath).length + 1;

						// per http://www.ietf.org/rfc/rfc2109.txt browser must allow at minimum:
						// - 300 cookies
						// - 20 cookies per unique domain
						// - 4096 bytes per cookie
						if (cookieLength > 4096) {
							$log.warn("Cookie '" + name + "' possibly not set or overflowed because it was too large (" + cookieLength + " > 4096 bytes)!");
						}
					}
				}
			} else {
				if (rawDocument.cookie !== lastCookieString) {
					lastCookieString = rawDocument.cookie;
					cookieArray = lastCookieString.split("; ");
					lastCookies = {};

					for (i = 0; i < cookieArray.length; i++) {
						cookie = cookieArray[i];
						index = cookie.indexOf('=');
						if (index > 0) { //ignore nameless cookies
							lastCookies[unescape(cookie.substring(0, index))] = unescape(cookie.substring(index + 1));
						}
					}
				}
				return lastCookies;
			}
		};

		self.defer = function(fn, delay) {
			var timeoutId;
			outstandingRequestCount++;
			timeoutId = setTimeout(function() {
				delete pendingDeferIds[timeoutId];
				completeOutstandingRequest(fn);
			}, delay || 0);
			pendingDeferIds[timeoutId] = true;
			return timeoutId;
		};

		self.defer.cancel = function(deferId) {
			if (pendingDeferIds[deferId]) {
				delete pendingDeferIds[deferId];
				clearTimeout(deferId);
				completeOutstandingRequest(noop);
				return true;
			}
			return false;
		};

	}

	function $CacheFactoryProvider() {

		this.$get = function() {
			var caches = {};

			function cacheFactory(cacheId, options) {
				if (cacheId in caches) {
					throw Error('cacheId ' + cacheId + ' taken');
				}

				var size = 0,
					stats = extend({}, options, {
						id: cacheId
					}),
					data = {},
					capacity = (options && options.capacity) || Number.MAX_VALUE,
					lruHash = {},
					freshEnd = null,
					staleEnd = null;

				return caches[cacheId] = {

					put: function(key, value) {
						var lruEntry = lruHash[key] || (lruHash[key] = {
							key: key
						});

						refresh(lruEntry);

						if (isUndefined(value)) return;
						if (!(key in data)) size++;
						data[key] = value;

						if (size > capacity) {
							this.remove(staleEnd.key);
						}
					},


					get: function(key) {
						var lruEntry = lruHash[key];

						if (!lruEntry) return;

						refresh(lruEntry);

						return data[key];
					},


					remove: function(key) {
						var lruEntry = lruHash[key];

						if (!lruEntry) return;

						if (lruEntry == freshEnd) freshEnd = lruEntry.p;
						if (lruEntry == staleEnd) staleEnd = lruEntry.n;
						link(lruEntry.n, lruEntry.p);

						delete lruHash[key];
						delete data[key];
						size--;
					},


					removeAll: function() {
						data = {};
						size = 0;
						lruHash = {};
						freshEnd = staleEnd = null;
					},


					destroy: function() {
						data = null;
						stats = null;
						lruHash = null;
						delete caches[cacheId];
					},


					info: function() {
						return extend({}, stats, {
							size: size
						});
					}
				};


				/**
				 * makes the `entry` the freshEnd of the LRU linked list
				 */

				function refresh(entry) {
					if (entry != freshEnd) {
						if (!staleEnd) {
							staleEnd = entry;
						} else if (staleEnd == entry) {
							staleEnd = entry.n;
						}

						link(entry.n, entry.p);
						link(entry, freshEnd);
						freshEnd = entry;
						freshEnd.n = null;
					}
				}


				/**
				 * bidirectionally links two entries of the LRU linked list
				 */

				function link(nextEntry, prevEntry) {
					if (nextEntry != prevEntry) {
						if (nextEntry) nextEntry.p = prevEntry; //p stands for previous, 'prev' didn't minify
						if (prevEntry) prevEntry.n = nextEntry; //n stands for next, 'next' didn't minify
					}
				}
			}


			cacheFactory.info = function() {
				var info = {};
				forEach(caches, function(cache, cacheId) {
					info[cacheId] = cache.info();
				});
				return info;
			};


			cacheFactory.get = function(cacheId) {
				return caches[cacheId];
			};


			return cacheFactory;
		};
	}

	function $QProvider() {

		this.$get = ['$rootScope', '$exceptionHandler', function($rootScope, $exceptionHandler) {
			return qFactory(function(callback) {
				$rootScope.$evalAsync(callback);
			}, $exceptionHandler);
		}];
	}

	function qFactory(nextTick, exceptionHandler) {
		var defer = function() {
				var pending = [],
					value, deferred;

				deferred = {

					resolve: function(val) {
						if (pending) {
							var callbacks = pending;
							pending = undefined;
							value = ref(val);

							if (callbacks.length) {
								nextTick(function() {
									var callback;
									for (var i = 0, ii = callbacks.length; i < ii; i++) {
										callback = callbacks[i];
										value.then(callback[0], callback[1]);
									}
								});
							}
						}
					},


					reject: function(reason) {
						deferred.resolve(reject(reason));
					},


					promise: {
						then: function(callback, errback) {
							var result = defer();

							var wrappedCallback = function(value) {
									try {
										result.resolve((callback || defaultCallback)(value));
									} catch (e) {
										exceptionHandler(e);
										result.reject(e);
									}
								};

							var wrappedErrback = function(reason) {
									try {
										result.resolve((errback || defaultErrback)(reason));
									} catch (e) {
										exceptionHandler(e);
										result.reject(e);
									}
								};

							if (pending) {
								pending.push([wrappedCallback, wrappedErrback]);
							} else {
								value.then(wrappedCallback, wrappedErrback);
							}

							return result.promise;
						}
					}
				};

				return deferred;
			};


		var ref = function(value) {
				if (value && value.then) return value;
				return {
					then: function(callback) {
						var result = defer();
						nextTick(function() {
							result.resolve(callback(value));
						});
						return result.promise;
					}
				};
			};

		var reject = function(reason) {
				return {
					then: function(callback, errback) {
						var result = defer();
						nextTick(function() {
							result.resolve((errback || defaultErrback)(reason));
						});
						return result.promise;
					}
				};
			};

		var when = function(value, callback, errback) {
				var result = defer(),
					done;

				var wrappedCallback = function(value) {
						try {
							return (callback || defaultCallback)(value);
						} catch (e) {
							exceptionHandler(e);
							return reject(e);
						}
					};

				var wrappedErrback = function(reason) {
						try {
							return (errback || defaultErrback)(reason);
						} catch (e) {
							exceptionHandler(e);
							return reject(e);
						}
					};

				nextTick(function() {
					ref(value).then(function(value) {
						if (done) return;
						done = true;
						result.resolve(ref(value).then(wrappedCallback, wrappedErrback));
					}, function(reason) {
						if (done) return;
						done = true;
						result.resolve(wrappedErrback(reason));
					});
				});

				return result.promise;
			};


		function defaultCallback(value) {
			return value;
		}


		function defaultErrback(reason) {
			return reject(reason);
		}


		/**
		 * @ngdoc
		 * @name ng.$q#all
		 * @methodOf ng.$q
		 * @description
		 * Combines multiple promises into a single promise that is resolved when all of the input
		 * promises are resolved.
		 *
		 * @param {Array.<Promise>} promises An array of promises.
		 * @returns {Promise} Returns a single promise that will be resolved with an array of values,
		 *   each value corresponding to the promise at the same index in the `promises` array. If any of
		 *   the promises is resolved with a rejection, this resulting promise will be resolved with the
		 *   same rejection.
		 */

		function all(promises) {
			var deferred = defer(),
				counter = promises.length,
				results = [];

			if (counter) {
				forEach(promises, function(promise, index) {
					ref(promise).then(function(value) {
						if (index in results) return;
						results[index] = value;
						if (!(--counter)) deferred.resolve(results);
					}, function(reason) {
						if (index in results) return;
						deferred.reject(reason);
					});
				});
			} else {
				deferred.resolve(results);
			}

			return deferred.promise;
		}

		return {
			defer: defer,
			reject: reject,
			when: when,
			all: all
		};
	}

	function $TemplateCacheProvider() {
		this.$get = ['$cacheFactory', function($cacheFactory) {
			return $cacheFactory('templates');
		}];
	}

	function $ControllerProvider() {
		var controllers = {};


		/**
		 * @ngdoc function
		 * @name ng.$controllerProvider#register
		 * @methodOf ng.$controllerProvider
		 * @param {string} name Controller name
		 * @param {Function|Array} constructor Controller constructor fn (optionally decorated with DI
		 *    annotations in the array notation).
		 */
		this.register = function(name, constructor) {
			if (isObject(name)) {
				extend(controllers, name)
			} else {
				controllers[name] = constructor;
			}
		};


		this.$get = ['$injector', '$window', function($injector, $window) {

			/**
			 * @ngdoc function
			 * @name ng.$controller
			 * @requires $injector
			 *
			 * @param {Function|string} constructor If called with a function then it's considered to be the
			 *    controller constructor function. Otherwise it's considered to be a string which is used
			 *    to retrieve the controller constructor using the following steps:
			 *
			 *    * check if a controller with given name is registered via `$controllerProvider`
			 *    * check if evaluating the string on the current scope returns a constructor
			 *    * check `window[constructor]` on the global `window` object
			 *
			 * @param {Object} locals Injection locals for Controller.
			 * @return {Object} Instance of given controller.
			 *
			 * @description
			 * `$controller` service is responsible for instantiating controllers.
			 *
			 * It's just a simple call to {@link AUTO.$injector $injector}, but extracted into
			 * a service, so that one can override this service with {@link https://gist.github.com/1649788
			 * BC version}.
			 */
			return function(constructor, locals) {
				if (isString(constructor)) {
					var name = constructor;
					constructor = controllers.hasOwnProperty(name) ? controllers[name] : getter(locals.$scope, name, true) || getter($window, name, true);

					assertArgFn(constructor, name, true);
				}

				return $injector.instantiate(constructor, locals);
			};
		}];
	}

	var PREFIX_REGEXP = /^(x[\:\-_]|data[\:\-_])/i;
	/**
	 * Converts all accepted directives format into proper directive name.
	 * All of these will become 'myDirective':
	 *   my:DiRective
	 *   my-directive
	 *   x-my-directive
	 *   data-my:directive
	 *
	 * Also there is special case for Moz prefix starting with upper case letter.
	 * @param name Name to normalize
	 */

	function directiveNormalize(name) {
		return camelCase(name.replace(PREFIX_REGEXP, ''));
	}

	var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
	var MOZ_HACK_REGEXP = /^moz([A-Z])/;

	/**
	 * Converts snake_case to camelCase.
	 * Also there is special case for Moz prefix starting with upper case letter.
	 * @param name Name to normalize
	 */

	function camelCase(name) {
		return name.
		replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
			return offset ? letter.toUpperCase() : letter;
		}).
		replace(MOZ_HACK_REGEXP, 'Moz$1');
	}

	var BOOLEAN_ATTR = {};
	forEach('multiple,selected,checked,disabled,readOnly,required'.split(','), function(value) {
		BOOLEAN_ATTR[lowercase(value)] = value;
	});
	var BOOLEAN_ELEMENTS = {};
	forEach('input,select,option,textarea,button,form'.split(','), function(value) {
		BOOLEAN_ELEMENTS[uppercase(value)] = true;
	});

	function getBooleanAttrName(element, name) {
		// check dom last since we will most likely fail on name
		var booleanAttr = BOOLEAN_ATTR[name.toLowerCase()];

		// booleanAttr is here twice to minimize DOM access
		return booleanAttr && BOOLEAN_ELEMENTS[element.nodeName] && booleanAttr;
	}

	function publishExternalAPI(angular) {
		extend(angular, {
			'bootstrap': bootstrap,
			'copy': copy,
			'extend': extend,
			'equals': equals,
			'element': jqLite,
			'forEach': forEach,
			'injector': createInjector,
			'noop': noop,
			'bind': bind,
			'toJson': toJson,
			'fromJson': fromJson,
			'identity': identity,
			'isUndefined': isUndefined,
			'isDefined': isDefined,
			'isString': isString,
			'isFunction': isFunction,
			'isObject': isObject,
			'isNumber': isNumber,
			'isElement': isElement,
			'isArray': isArray,
			'version': version,
			'isDate': isDate,
			'lowercase': lowercase,
			'uppercase': uppercase,
			'callbacks': {
				counter: 0
			}
		});

		angularModule = setupModuleLoader(window);
		// try {
		// 	angularModule('ngLocale');
		// } catch (e) {
		// 	angularModule('ngLocale', []).provider('$locale', $LocaleProvider);
		// }
		angularModule('ng', [], ['$provide', function ngModule($provide) {
			$provide.provider({
				$log: $LogProvider,
				$exceptionHandler: $ExceptionHandlerProvider,
				$rootScope: $RootScopeProvider,
				$window: $WindowProvider,
				$parse: $ParseProvider,
				$filter: $FilterProvider,
				$sniffer: $SnifferProvider,
				$compile: $CompileProvider,
				$interpolate: $InterpolateProvider,
				$http: $HttpProvider,
				$httpBackend: $HttpBackendProvider,
				$browser: $BrowserProvider,
				$document: $DocumentProvider,
				$cacheFactory: $CacheFactoryProvider,
				$q: $QProvider,
				$templateCache: $TemplateCacheProvider,
				$controller: $ControllerProvider
			})
		}]);
	}

	bindJQuery();
	publishExternalAPI(angular);

})()