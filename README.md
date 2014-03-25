jQuery autoSize Plugin
======================

Automatically resizes `<input>` and `<textarea>` elements as the user types to fit the entire value.

Respects `min/max-width/height` and every other CSS property you can imagine because the element's computed
CSS properties are copied verbatim to a dummy offscreen `<div>` for measuring.

Dependencies
============

*   jQuery
*   Underscore

Browser Support
===============

*   IE 8+
*   Chrome, Safari, Firefox

Usage
=====

Inputs:

```javascript
$('input').autoWidth();
```

TextAreas:

```javascript
$('textarea').autoHeight();
```

Config
------

| Name              | Type       | Default Value | Element      |
|:----------------- |:---------- |:------------- |:------------ |
| `numPaddingChars` | `{Number}` | `1`           | `<input>`    |
| `numPaddingLines` | `{Number}` | `0`           | `<textarea>` |

Example:

```javascript
$('input').autoWidth({
    numPaddingChars: 2
});

$('textarea').autoHeight({
    numPaddingLines: 1
});
```

Caveats
=======

*   Breaks undo/redo in IE 8.  See [jQuery UI bug #7873](http://bugs.jqueryui.com/ticket/7873).

    > IE won't allow [you] to perform <kbd>CTRL</kbd> + <kbd>Z</kbd> (undo) immediately after a DOM append or `innerHTML` operation.

License
=======

Released under the [MIT license](LICENSE-MIT.txt).
