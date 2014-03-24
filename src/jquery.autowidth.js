(function(root) {

	(function(_, $) {

		var _EVENT_NAMES = document.createElement('input').oninput === null ? 'input' : 'keydown keyup change',
			_DEFAULTS = {
				numPaddingChars: 1,
				numPaddingLines: 0
			};

		var _rNumeric = /^\d+$/;

		/**
		 * Determines if the given string contains an integer value (i.e., only numeric digits).
		 * @param {string} str
		 * @returns {boolean}
		 * @private
		 */
		var _isInteger = function(str) {
			return _rNumeric.test(str);
		};

		// TODO: This can probably be removed
		/**
		 * Determines if the given object contains a valid CSS property with the specified name.
		 * @param {CSSStyleDeclaration|Object} obj CSS property map.
		 * @param {string} propName CSS property name.
		 * @returns {boolean}
		 * @private
		 */
		var _isValidCssProp = function(obj, propName) {
			if (obj.hasOwnProperty && !obj.hasOwnProperty(propName)) {
				return false;
			}
			if (_isInteger(propName)) {
				return false;
			}
			if (!_.isString(obj[propName])) {
				return false;
			}
			return true;
		};

		/**
		 * Generates a padding string with the specified number of characters.  The returned string can be used to
		 * pad an input's value to ensure it is wide enough to fix all of the user's input.
		 * @param {Number} numPaddingChars Number of characters to pad.
		 * @param {String} [ch='W'] Character to use for padding.
		 * @returns {string}
		 * @private
		 */
		var _createPaddingString = function(numPaddingChars, ch) {
			return new Array(numPaddingChars + 1).join(ch || 'W');
		};

		/**
		 * Merges the given user-specified configuration object with the default values and returns the combined result.
		 * @param {Object} [config] User-specified config object that overrides the default settings.
		 * @returns {Object} A new object containing the merged config values.
		 * @private
		 */
		var _mergeConfig = function(config) {
			return _.extend({}, _DEFAULTS, config);
		};

		/**
		 * Gets the computed CSS styles for the given element.
		 * @param {Element|jQuery} el DOM element or jQuery object to retrieve computed styles for.
		 * @returns {Object} Hash object containing key-value pairs, where the key is a CSS property name
		 * 					 and the value is the computed value of that property.
		 * @private
		 */
		var _getComputedStyles = function(el) {
			if (el instanceof jQuery)
				el = el[0];

			// IE
			if (el.currentStyle) {
				return el.currentStyle;
			}

			// Firefox
			if (document.defaultView && document.defaultView.getComputedStyle) {
				var computed = document.defaultView.getComputedStyle(el, null);

				if (!computed.hasOwnProperty('length')) {
					return computed;
				}

				var retStyles = {},
					idx = computed.length,
					propName;

				while (idx--) {
					propName = computed[idx];
					retStyles[propName] = computed[propName];
				}

				return retStyles;
			}

			// Get inline style
			return el.style;
		};

		/**
		 * Copies the computed style properties and their values from srcEl and sets them on destEl.
		 * @param {jQuery} destEl
		 * @param {jQuery} srcEl
		 * @private
		 */
		var _setComputedStylesFrom = function(destEl, srcEl) {
			var computedStyles = _getComputedStyles(srcEl);
			var styles = {};
			for (var prop in computedStyles) {
				if (_isValidCssProp(computedStyles, prop)) {
					styles[prop] = computedStyles[prop];
				}
			}
			destEl.css(styles);
		};

		/**
		 * Automatically resizes the given input so that it is wide enough to fit its input value plus the given padding string.
		 * @param {jQuery} input
		 * @param {string} paddingStr
		 * @private
		 */
		var _autoResizeWidth = function(input, paddingStr) {
			var offscreen = $('<div/>');

			_setComputedStylesFrom(offscreen, input);

			offscreen.css({
				display: 'block',
				position: 'absolute',
				top: '-999em',
				left: '-999em',
				width: 'auto',
				'white-space': 'pre'
			});

			offscreen.text(input.val() + paddingStr);
			offscreen.appendTo(document.body);

			input.width(offscreen.width());

			offscreen.remove();
		};

		$.fn.autoWidth = function(config) {
			config = _mergeConfig(config);

			var paddingStr = _createPaddingString(config.numPaddingChars);

			this.each(function() {
				var input = $(this),
					resize = function() {
						_autoResizeWidth(input, paddingStr);
					};

				input.on(_EVENT_NAMES, function(e) {
					// Modern browsers
					if (e.type === 'input') {
						resize();
					}
					// Legacy browsers
					else {
						// IE needs a small delay to resize properly
						_.defer(resize);
					}
				});

				resize();
			});
		};

		var _BUGS = {
			/** @type {boolean} */
			textareaWidth: (function() {
				var testElem = $('<div/>');

				testElem.css({
					display: 'block',
					position: 'absolute',
					top: '-999em',
					left: '-999em',

					width: '235px',
					'font-size': '24px',
					'font-family': 'Arial',
					'overflow-y': 'scroll'
				});

				testElem.appendTo(document.body);

				// Dummy text that is known to trigger the bug in IE8 w/ Arial @ 24px
				var testText = 'asd asdlkjasd asdlk';

				testElem.text(testText);
				var preHeight = testElem.height();

				testElem.text(testText + '.');
				var postHeight = testElem.height();

				testElem.remove();

				return (postHeight > preHeight);
			}())
		};

		/**
		 * Automatically resizes the given input so that it is tall enough to fit its input value.
		 * @param {jQuery} input
		 * @param {string} paddingStr
		 * @private
		 */
		var _autoResizeHeight = function(input, paddingStr) {
			$('.offscreen').remove();

			var offscreen = $('<div/>');

			offscreen.addClass('offscreen');

			_setComputedStylesFrom(offscreen, input);

			// If the last line of input ends with a newline, browsers will ignore it and our calculation will be off
			// (one line too short).
			var normVal = (input.val() + paddingStr).replace(/\n$/g, '\n.');

			offscreen.css({
				display: 'block',

				// Remove from normal flow to avoid causing any page flicker
				position: 'absolute',
				top: '-999em',
				left: '-999em',

				// Allow height to expand as needed
				height: 'auto',

				// Force <div> to behave like a <textarea>
				'white-space': 'pre-wrap',
				'word-wrap': 'break-word'
			});

			offscreen.appendTo(document.body);
			offscreen.text(normVal);

			// Prevents vertical scrollbars from goofing shit up.
			// IE8 (naturally) treats textareas and divs differently when calculating width and scrollbar allowance,
			// so we have to subtract 2px from the offscreen element's width in IE8 to make up for Microsoft's incompetence.
			offscreen.width(input.width() - (_BUGS.textareaWidth ? 2 : 0));

			// Force browsers to hide scrollbars by resizing the textarea much taller than it needs to be
			// and _then_ resizing it to its actual ideal height.
			// NOTE: DO NOT VARIABLE-IZE offscreen.height()!!  It needs to be queried twice to force the browser to
			// recalculate sizes and positions (at least in Chrome 33).
			input.height(offscreen.height() * 2);
			input.height(offscreen.height());

			offscreen.remove();
		};

		$.fn.autoHeight = function(config) {
			config = _mergeConfig(config);

			var paddingStr = _createPaddingString(config.numPaddingLines, '\n');

			this.each(function() {
				var input = $(this),
					resize = function() {
						_autoResizeHeight(input, paddingStr);
					};

				input.on(_EVENT_NAMES, function(e) {
					// Modern browsers
					if (e.type === 'input') {
						resize();
					}
					// Legacy browsers
					else {
						// IE needs a small delay to resize properly
						_.defer(resize);
					}
				});

				resize();
			});
		};

	}(root._, root.jQuery || root.Zepto));

}(window));
