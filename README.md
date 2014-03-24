jQuery autoWidth Plugin
=======================

Automatically resizes an `<input>` element as the user types to fit its entire value.

Respects `min/max-width` and every other CSS property you can imagine because the `<input>`'s computed
CSS properties are copied verbatim to a dummy offscreen `<div>` which is then measured.

Dependencies
============

*   jQuery
*   Underscore

Usage
=====

```javascript
$('input').autoWidth();
```

Config
------

| Name              | Type       | Default Value |
|:----------------- |:---------- |:------------- |
| `numPaddingChars` | `{Number}` | `1`           |

Example:

```javascript
$('input').autoWidth({
	numPaddingChars: 2
});
```
