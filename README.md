s3.js
=====

Scriptable Style Sheets - A light-weight CSS preprocessor designed for the browser which features variables, functions, blocks, etc.

## Current List of Features
- Variables
- Variable blocks
- Comment blocks
- Scope
- Error reporting
- Evaluate math expressions
- Functions

## Planned Features
- Built-in/default variables
- Blocks within blocks(?)

## Features
### Variables
s3 supports the concept of variables in its stylesheets. Simply prefix the variable name with @ and seperate name from value using the colon (:) like this:
```
@name: val;
```
Variables cannot start with a number and cannot contain special characters except an underscore (_). Some valid variable names are:
```
@myVar, @myVar123, @__wat, @_wa_123t
```
Variables can contain mathematical expressions, return values from functions, numbers, or even be placeholders for text. You can use variables to hold color values:
```css
@bg_color: blue;
body {
  background-color: @bg_color;
}
```
which evaluates to:
```css
body {
  background-color: blue;
}
```
Values with units:
```css
@myIdHeight: 125px;
#myId {
  height: @myIdHeight;
}
```
evaluates to:
```css
#myId {
  height: 125px;
}
```
The mathematical operations permitted are addition, subtraction, multiplication, and division:
```css
@myIdHeight: 100px + 25px;
@myIdPadding: 125px / 5;
@myIdWidth: 25% * 4;
@myIdMargin: 10em - 1em;
@myIdFontSize: (10px * 5 - 25px) / 5 + 5px;
#myId {
  height: @myIdHeight;
  padding: @myIdPadding;
  width: @myIdWidth;
  margin: @myIdMargin;
  font-size: @myIdFontSize;
}
```
evaluates to:
```css
#myId {
  height: 125px;
  padding: 25px;
  width: 100%;
  margin: 144px;
  font-size: 10px;
}
```
s3 uses CSS3's calc() "function" to evaluate mathematical expressions to keep evaluation consistent with the browser and to prevent re-inventing the wheel. Obviously this won't do if s3 gets packaged for Node but is fine for now.

Additionally, s3 allows you to define local variables which can shadow global variables:
```css
@box_bg: blue;
.box {
  background-color: @box_bg;
}

.alertBox {
  @box_bg: red;
  background-color: @box_bg;
}
```
evaluates to:
```css
.box {
  background-color: blue;
}

.alertBox {
  background-color: red;
}
```

You can also get the value of previously defined variables like so:
```css
@default_height: 10px;
.box {
  @this_height: @default_height + 15px;
  height: @this_height;
}
```
evaluates to:
```css
.box {
  height: 25px;
}
```

s3 copies the values of variables; there is no concept of references (yet?):
```css
@default_height: 10px;
@new_height: @default_height;
@new_height: @new_height + 1px;
@default_height; /* 10px */
@new_height; /* 11px */
```

### Comments
Single line and double line comments are supported:
```css
@defaultWidth: 25%;
.box {
  // @defaultWidth: 50%;
  width: @defaultWidth;
  /* height: 50px;
  margin: 10px; */
}
```
evaluates to:
```css
.box {
  width: 25%;
}
```
