(function(root) {

	(function(_, $) {

		var _EVENT_NAMES = document.createElement('input').oninput === null ? 'input' : 'keydown keyup change',
			_DEFAULTS = {
				numPaddingChars: 1
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
		 * @returns {string}
		 * @private
		 */
		var _createPaddingString = function(numPaddingChars) {
			return new Array(numPaddingChars + 1).join('W');
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

			var input = this,
				paddingStr = _createPaddingString(config.numPaddingChars),
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
		};

	}(root._, root.jQuery || root.Zepto));

}(window));
