jQuery autoWidth Plugin
=======================

Automatically resizes `<input>` and `<textarea>` elements as the user types to fit the entire value.

Respects `min/max-width` and every other CSS property you can imagine because the element's computed
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
