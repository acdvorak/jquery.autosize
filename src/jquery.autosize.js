/*!
 * jQuery autoSize Plugin
 * https://github.com/acdvorak/jquery.autosize
 *
 * Copyright 2014 Andrew C. Dvorak <andy@andydvorak.net>
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 */
(function(root) {

    (function(_, $) {

        var _toString = function(obj) {
            return Object.prototype.toString.call(obj);
        };

        var _hasOwnProperty = function(obj, propName) {
            return Object.prototype.hasOwnProperty.call(obj, propName);
        };

        var _isFunction = function(val) {
            return !!val && (typeof val === 'function' || _toString(val) === '[object Function]');
        };

        var _createOffscreenElem = function() {
            var elem = $('<div/>');
            _positionOffscreen(elem);
            return elem;
        };

        var _positionOffscreen = function(elem) {
            elem.css({
                // Remove from normal flow to avoid causing any page flicker
                position: 'absolute',
                top:      '-999em',
                left:     '-999em',
                right:    'auto',
                bottom:   'auto'
            });
        };

        var _SUPPORT = {
                inputEvent:         (document.createElement('input').oninput === null),
                getComputedStyle: !!(document.defaultView && document.defaultView.getComputedStyle)
            },
            _EVENT_SPACE = '.autosize',
            _EVENT_TYPES = _SUPPORT.inputEvent ? 'input' : 'keydown keyup change',
            _EVENT_NAMES = _EVENT_TYPES.split(' ').join(_EVENT_SPACE + ' ') + _EVENT_SPACE,
            _DEFAULTS = {
                numPaddingChars: 1,
                numPaddingLines: 0
            },
            _BUGS = {
                /** @type {boolean} */
                textareaWidth: (function() {
                    var testElem = _createOffscreenElem();

                    testElem.css({
                        'width':       '235px',
                        'font-size':   '24px',
                        'font-family': 'Arial',
                        'overflow-y':  'scroll'
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
         * Converts a CSSStyleDeclaration host object to a plain JavaScript object.
         * @param {CSSStyleDeclaration} computed Computed styles from getComputedStyle().
         * @returns {Object} Plain JavaScript object containing the styles from `computed`.
         * @private
         */
        var _cssStyleDeclToObject = function(computed) {
            var styles    = {},
                propNames = Array.prototype.slice.call(computed),
                propName,
                idx       = propNames.length;

            while (idx--) {
                propName         = propNames[idx];
                styles[propName] = computed[propName];
            }

            return styles;
        };

        // DispHTMLCurrentStyle IE8 Unspecified error on outline and outlineWidth
        /**
         * IE8 throws an "Unspecified error" when you try to access the
         * 'outline' or 'outlineWidth' properties of a DispHTMLCurrentStyle
         * object.  Moving the try/catch to a separate function allows
         * sane browsers to better optimize the calling function.
         * @param  {DispHTMLCurrentStyle|Object} obj      A DOM element's currentStyle
         * @param  {String}                      propName Name of the property to access on the object.
         * @return {String|null}
         * @private
         */
        var _tryGetPropValue = function(obj, propName) {
            try {
                return obj[propName];
            } catch (e) {
                return null;
            }
        };

        /**
         * Returns a POJO containing all properties from `obj` *EXCEPT*
         * prototype and function properties.
         * @param  {*} obj Any JSON-serializable object.
         * @return {*} A clone of the input object with all function and
         *             prototype properties removed.
         * @private
         */
        var _sanitizeObject = function(obj) {
            var json = JSON.stringify(obj);

            // Modern browsers, IE9+
            if (json) {
                return JSON.parse(json);
            }

            // IE8
            var sanitized = {},
                val;
            for (var prop in obj) {
                val = _tryGetPropValue(obj, prop);

                // Exclude prototype and function properties
                if (val !== null && _hasOwnProperty(obj, prop) && !_isFunction(val)) {
                    sanitized[prop] = val;
                }
            }
            return sanitized;
        };

        /**
         * Modern browsers, IE9+.
         * @param  {HTMLElement} el DOM element
         * @return {Object|null}
         * @private
         */
        var _getComputedStylesModern = function(el) {
            if (!_SUPPORT.getComputedStyle) {
                return null;
            }

            // This notation, though verbose, is necessary to support Firefox 3.6 / 4
            // See https://developer.mozilla.org/en-US/docs/Web/API/Window.getComputedStyle
            var computed = document.defaultView.getComputedStyle(el, null);

            return computed ? _cssStyleDeclToObject(computed) : null;
        };

        /**
         * Gets the computed CSS styles for the given element.
         * @param {HTMLElement|jQuery} el DOM element or jQuery object to retrieve computed styles for.
         * @returns {Object} Hash object containing key-value pairs, where the key is a CSS property name
         *                   and the value is the computed value of that property.
         * @private
         */
        var _getComputedStyles = function(el) {
            if (!el) {
                return {};
            }

            if (el.jquery) {
                el = el[0];
            }

            var styles = _getComputedStylesModern(el) // Modern browsers, IE9+
                      || el.currentStyle              // IE8
                      || el.style                     // Fall back to inline styles
                      || {}                           // Not a DOM element
            ;

            return _sanitizeObject(styles);
        };

        /**
         * Copies the computed style properties and their values from srcEl and sets them on destEl.
         * @param {jQuery} destEl
         * @param {jQuery} srcEl
         * @private
         */
        var _setComputedStylesFrom = function(destEl, srcEl) {
            destEl.css(_getComputedStyles(srcEl));
        };

        /**
         * Automatically resizes the given input so that it is wide enough to fit its input value plus the given padding string.
         * @param {jQuery} input
         * @param {string} paddingStr
         * @private
         */
        var _autoResizeWidth = function(input, paddingStr) {
            var offscreen = _createOffscreenElem();

            _setComputedStylesFrom(offscreen, input);

            _positionOffscreen(offscreen);

            offscreen.css({
                'width':       'auto',
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

        /**
         * Automatically resizes the given input so that it is tall enough to fit its input value.
         * @param {jQuery} input
         * @param {string} paddingStr
         * @private
         */
        var _autoResizeHeight = function(input, paddingStr) {
            var offscreen = _createOffscreenElem();

            _setComputedStylesFrom(offscreen, input);

            _positionOffscreen(offscreen);

            // If the last line of input ends with a newline, browsers will ignore it and our calculation will be off
            // (one line too short).
            var normVal = (input.val() + paddingStr).replace(/\n$/g, '\n.');

            offscreen.css({
                // Allow height to expand as needed
                'height':      'auto',

                // Force <div> to behave like a <textarea>
                'white-space': 'pre-wrap',
                'word-wrap':   'break-word'
            });

            offscreen.text(normVal);
            offscreen.appendTo(document.body);

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

                input.off(_EVENT_NAMES).on(_EVENT_NAMES, function(e) {
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
