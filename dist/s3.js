(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function applyStyle(styleSheet) {
  var styleElement = document.createElement("style");
  styleElement.innerHTML = styleSheet;
  document.head.appendChild(styleElement);
}

// TODO: store elem globally to prevent re-creating element for every calculation?
function calc(expr) {
  var elem = document.createElement("div"),
      val = "";

  elem.style.display = "none";
  elem.style.top = "calc(" + expr + ")";
  document.body.appendChild(elem);
  val = window.getComputedStyle(elem, null).getPropertyValue("top");
  document.body.removeChild(elem);
  return val;
}

module.exports.applyStyle = applyStyle;
module.exports.calc = calc;

},{}],2:[function(require,module,exports){
function evaluateExpression(expr) {
  // Is it a function?
  if (/^([a-zA-Z][\w\-]*)(?=\(.*\)$)/.test(expr)) {
    var Functions = require("./function.js");
        functionData = /^([a-zA-Z][\w\-]*)\(\s*(.*)\s*\)/.exec(expr),
        functionName = functionData[1],
        functionArgs = functionData[2];

    // No arguments.
    if (functionArgs === "") {
      expr = Functions.applyFunction(functionName, []);
    } else {
      var argValues = [],
          inBrackets = false,
          // Beginning refers to beginning index of each argument.
          beginningIdx = 0,
          // The evaluated argument.
          argExpr = "",
          createArgObject = function(expr) {
            // Eval and add to array of evaluated args.
            var evaluatedExpr = evaluateExpression(expr),
                unit = /(px|mm|cm|in|em|%|pt|pc|ex|ch|rem|s|ms)/.exec(evaluatedExpr);

            // Convert "stringified" units to numeric values.
            evaluatedExpr = parseFloat(evaluatedExpr);
            if (unit !== null) {
              unit = unit[1];
              unit = s3.unitType[unit] ? s3.unitType[unit] : s3.units.UNIT_NONE;
            } else {
              unit = s3.units.UNIT_NONE;
            }

            return {
              "value": evaluatedExpr,
              "cssRule": Parser.currentRuleset,
              "unit": unit
            };
          };

      // Iterate through each argument to obtain each individual argument
      // in order to evaluate them.
      for (var currCharIdx = 0; currCharIdx < functionArgs.length; currCharIdx++) {
        var char = functionArgs[currCharIdx];
        if (char === ")") {
          inBrackets = false;
        } else if (!inBrackets) {
          if (char === "(") {
            inBrackets = true;
          } else if (char === ",") {
            // Get the argument and trim it.
            argExpr = functionArgs.substring(beginningIdx, currCharIdx).trim();
            argValues.push(createArgObject(argExpr));
            // Start after the comma for the beginning of the next arg.
            beginningIdx = currCharIdx + 1;
          }
        }
      }

      argExpr = functionArgs.substring(beginningIdx).trim();
      argValues.push(createArgObject(argExpr));
      // Call the function with all the evaluated arguments.
      expr = Functions.applyFunction(functionName, argValues);
    }
  } else if (expr.indexOf("+") !== -1 || expr.indexOf("-") !== -1 ||
    expr.indexOf("*") !== -1 || expr.indexOf("/") !== -1) { // TODO: improve?
    var inBrackets = false,
        // Beginning refers to beginning index of each subexpression.
        beginningIdx = 0,
        // The evaluated expression.
        evalExpr = "",
        // Subexpressions.
        subExpr = "";

    // Remove all whitespace since it's unnecessary.
    expr = expr.replace(/ /g, "");
    // Iterate through each subexpression in order to evaluate them.
    for (var currCharIdx = 0; currCharIdx < expr.length; currCharIdx++) {
      var char = expr[currCharIdx];
      if (char === ")") {
        inBrackets = false;
      } else if (!inBrackets) {
        if (char === "(") {
          inBrackets = true;
        } else if (char === "+" || char === "-" || char === "*" || char === "/") {
          // Get the subexpression and eval.
          if (expr[beginningIdx] === "(") {
            // Remove parenthesis.
            subExpr = expr.substring(beginningIdx + 1, currCharIdx - 1);
            evalExpr += "(" + evaluateExpression(subExpr) + ")";
          } else {
            subExpr = expr.substring(beginningIdx, currCharIdx);
            evalExpr += evaluateExpression(subExpr);
          }

          // Start after the operator for the beginning of the next expression.
          beginningIdx = currCharIdx + 1;
          evalExpr += " " + char + " ";
        }
      }
    }

    // Get the subexpression and eval.
    if (expr[beginningIdx] === "(") {
      subExpr = expr.substring(beginningIdx + 1, expr.lastIndexOf(")"));
      evalExpr += "(" + evaluateExpression(subExpr) + ")";
    } else {
      subExpr = expr.substring(beginningIdx);
      evalExpr += evaluateExpression(subExpr);
    }

    expr = Browser.calc(evalExpr);
  } else if (expr[0] === "@") { // Evaluate the variable.
    // Check to see if one exists in local/global scope.
    var variable = LinkedList.findKey(Parser.scope, expr.substr(1));
    // If so, the evaluated variable is the value already evaluated.
    if (variable !== null) {
      expr = variable.val;
    } else {
      s3.throwError(3, expr);
    }
  }

  return expr;
}

function evaluateCSS(property, value) {
  console.log("Evaluating CSS tokens: " + property + ":" + value + ";");
  var evaluatedVariable = evaluateExpression(value);
  // Add to stylesheet if we aren't in a variable block.
  if (!Parser.inVarBlock) {
    s3.newStyleSheet += property + ":" + evaluatedVariable + ";";
  } else {
    Parser.blockContent += property + ":" + evaluatedVariable + ";";
  }
}

var s3 = require("./s3.js"),
    Parser = require("./parser.js"),
    LinkedList = require("./linkedlist.js"),
    Browser = require("./browser.js");
module.exports.evaluateExpression = evaluateExpression;
module.exports.evaluateCSS = evaluateCSS;

},{"./browser.js":1,"./function.js":3,"./linkedlist.js":4,"./parser.js":5,"./s3.js":6}],3:[function(require,module,exports){
function definedFunctions() {
  console.log(s3);
  if (module.exports.definedFunctions.funcs) {
    return module.exports.definedFunctions.funcs;
  }

  // Start by defining built-in functions.
  var functions = {
    "percentage": function(val) {
      return (val.value * 100) + "%";
    }
  };
  if (s3.settings.functions !== "undefined") {
    for (var fn in s3.settings.functions) {
      functions[fn] = s3.settings.functions[fn];
    }
  }

  module.exports.definedFunctions.funcs = functions;
  return functions;
}

function applyFunction(name, arguments) {
  var func = definedFunctions()[name];
  // Has the function not been defined with the given name?
  if (!func) {
    // Is it a CSS function?
    if (module.exports.cssFunctions.indexOf(name) !== -1) {
      // Re-build the expression.
      return name + "(" + arguments.toString() + ")";
    } else {
      // Undefined function - throw error.
      s3.throwError(4, name);
    }
  }

  // Otherwise, apply the function with given args.
  // TODO: perhaps a more friendly object for 'this'?
  return func.apply(s3, arguments);
}

var s3 = require("./s3.js");
module.exports.cssFunctions = [
  "attr", "blur", "brightness", "calc", "circle", "contrast",
  "cubic-bezier", "cycle", "drop-shadow", "element", "ellipse",
  "grayscale", "hsl", "hsla", "hue-rotate", "image", "inset",
  "invert", "linear-gradient", "matrix", "matrix3d", "minmax",
  "opacity", "perspective", "polygon", "radial-gradient", "rect",
  "repeat", "repeating-linear-gradient", "repeating-radial-gradient",
  "rgb", "rgba", "rotate", "rotatex", "rotatey", "rotatez", "rotate3d",
  "saturate", "scale", "scalex", "scaley", "scalez", "scale3d", "sepia",
  "skew", "skewx", "skewy", "steps", "translate", "translatex",
  "translatey", "translatez", "translate3d", "url", "var"
];
module.exports.applyFunction = applyFunction;
module.exports.definedFunctions = definedFunctions;

},{"./s3.js":6}],4:[function(require,module,exports){
function LinkedList() {
  this.length = 0;
  this.head = null;
  this.tail = null;
}

LinkedList.prototype.addToHead = function(e) {
  var newNode = {
    "element": e,
    "next": null,
    "prev": null
  };
  if (this.length === 0) {
    this.head = newNode;
    this.tail = this.head;
  } else {
    this.head.prev = newNode;
    newNode.next = this.head;
    this.head = newNode;
  }

  this.length++;
};

LinkedList.prototype.removeHead = function() {
  if (this.length > 0) {
    var head = this.head.element;
    this.head = this.head.next;
    this.length--;
    return head;
  } else {
    return null;
  }
};

LinkedList.prototype.addToTail = function(e) {
  if (this.length === 0) {
    this.addToHead(e);
    return;
  }

  var newNode = {
    "element": e,
    "next": null,
    "prev": this.tail
  };
  this.tail.next = newNode;
  this.tail = newNode;
  this.length++;
};

LinkedList.prototype.removeTail = function() {
  if (this.length > 0) {
    var tail = this.tail.element;
    this.tail = this.tail.prev;
    this.length--;
    return tail;
  } else {
    return null;
  }
};

LinkedList.prototype.get = function(index) {
  if (index >= this.length || index < 0) {
    return null;
  }

  var e = this.head;
  for (var i = 0; i < index; i++) {
    e = e.next;
  }

  return e.element;
};

LinkedList.prototype.getLength = function() {
  return this.length;
};

function findKey(list, key) {
  var currentNode = list.get(0),
      index = 0;
      
  while (index < list.getLength()) {
    if (currentNode[key] !== undefined) {
      return {
        "val": currentNode[key],
        "index": index
      };
    }

    currentNode = list.get(++index);
  }

  return null;
}

function addKey(list, key, val, index) {
  if (index < 0 || index >= list.getLength()) {
    return false;
  }

  var node = list.get(index);
  if (node !== null) {
    node[key] = val;
    return true;
  }

  return false;
}

module.exports = LinkedList;
module.exports.findKey = findKey;
module.exports.addKey = addKey;

},{}],5:[function(require,module,exports){
function parseLine(tokens) {
  function parseVariable(name, expr) {
    console.log("Parse var: " + name + " with expression: " + expr);
    // Store the evaluated result.
    LinkedList.addKey(module.exports.scope, name, Evaluator.evaluateExpression(expr));
  }

  function parseBlock(blockTokens) {
    var token = blockTokens.dequeue();
    console.log("Tokens for block: " + token);
    // Is it a CSS property?
    if (!module.exports.inVarBlock) {
      s3.newStyleSheet += token + "{";
    }

    if (blockTokens.size() > 0) {
      // Remove the opening brace.
      blockTokens.dequeue();
      if (blockTokens.size() > 0) {
        parseLine(blockTokens);
      }
    }
  }

  while (!tokens.isEmpty()) {
    var currentLength = tokens.size(),
      token = tokens.dequeue(),
      nextToken = tokens.peek();

    // Skip until we find the ending comment.
    if (module.exports.inCommentBlock) {
      if (token === "*/") {
        module.exports.inCommentBlock = false;
      }

      continue;
    } else if (token.substring(0, 2) === "//") {
      // Skip the entire line.
      break;
    } else if (token.substring(0, 2) === "/*") {
      module.exports.inCommentBlock = true;
    } else if (/^\@\w+/.test(token)) { // Has a valid var or block name been defined?
      var varName = token.substr(1);
      if (!/^[a-zA-Z_]\w*$/.test(varName)) {
        s3.throwError(2, token);
      }

      if (currentLength >= 4 && nextToken === ":") {
        // Dequeue the ':'.
        tokens.dequeue();
        // Dequeue and pass variable value as arg.
        parseVariable(varName, tokens.dequeue());
        // Dequeue the ';'.
        tokens.dequeue();
      } else if (currentLength >= 2 && nextToken === ";") {
        var variable = LinkedList.findKey(module.exports.scope, varName);
        if (variable !== null) {
          s3.newStyleSheet += variable.val;
        } else {
          s3.throwError(3, token);
        }

        // Dequeue the ';'.
        tokens.dequeue();
      } else {
        if (module.exports.inVarBlock || module.exports.inCSSBlock) {
          s3.throwError(1);
        }

        var blockTokens = new TokenQueue();
        blockTokens.enqueue(token);
        // Add tokens until end of line or until ending brace of
        // block is found.
        while (!tokens.isEmpty()) {
          var currentBlockToken = tokens.dequeue();
          blockTokens.enqueue(currentBlockToken);
          if (currentBlockToken === "}") {
            break;
          }
        }

        module.exports.blockName = varName;
        module.exports.inVarBlock = true;
        // Add new block scope.
        module.exports.scope.addToHead({});
        parseBlock(blockTokens);
      }
    } else if (/^((?:\#|\.)*[A-Za-z]+)+/.test(token)) { // Probably a vanilla CSS declaration.
      // The first token is the ruleset name.
      if (module.exports.currentRuleset === "") {
        module.exports.currentRuleset = token;
      }

      if (currentLength >= 4 && nextToken === ":") {
        // Dequeue the ':'.
        tokens.dequeue();
        // Dequeue the CSS value and pass it as an arg.
        Evaluator.evaluateCSS(token, tokens.dequeue());
        // Dequeue the ';'.
        tokens.dequeue();
      } else {
        var cssTokens = new TokenQueue();
        cssTokens.enqueue(token);
        // Add tokens until end of line or until ending brace of
        // CSS rule is found.
        while (!tokens.isEmpty()) {
          var currentCSSToken = tokens.dequeue();
          cssTokens.enqueue(currentCSSToken);
          if (currentCSSToken === "}") {
            break;
          }
        }

        module.exports.inCSSBlock = true;
        parseBlock(cssTokens);
      }
    } else { // Other stuff... comments, ending blocks, grandma's pie.
      if (token === "}") {
        if (!module.exports.inVarBlock) {
          if (module.exports.inCSSBlock) {
            module.exports.inCSSBlock = false;
            module.exports.currentRuleset = "";
          }

          s3.newStyleSheet += "}";
        } else {
          module.exports.inVarBlock = false;
          // Remove local scope object and add contents of variable
          // block to current scope.
          module.exports.scope.removeHead();
          LinkedList.addKey(module.exports.scope, module.exports.blockName, module.exports.blockContent);
          module.exports.blockName = "";
          module.exports.blockContent = "";
        }
      }
    }
  }
}

var LinkedList = require("./linkedlist.js"),
    s3 = require("./s3.js"),
    Evaluator = require("./evaluate.js"),
    TokenQueue = require("./tokenqueue.js");
module.exports.inVarBlock = false;
module.exports.blockContent = "";
module.exports.blockName = "";
module.exports.currentRuleset = "";
module.exports.inCommentBlock = false;
module.exports.inCSSBlock = false;
module.exports.scope = new LinkedList();
module.exports.parseLine = parseLine;

},{"./evaluate.js":2,"./linkedlist.js":4,"./s3.js":6,"./tokenqueue.js":7}],6:[function(require,module,exports){
/**
 * s3.js - Version 0.1
 * Designed and developed by Anthony Calandra - 2014.
 **/
(function(settings) {
  var inNode = typeof window === "undefined",
      LinkedList = require("./linkedlist.js"),
      Functions = require("./function.js"),
      TokenQueue = require("./tokenqueue.js"),
      Parser = require("./parser.js"),
      Browser = require("./browser.js");

  if (!inNode && typeof String.prototype.trim !== "function") {
    String.prototype.trim = function() {
      return this.replace(/^\s+|\s+$/g, "");
    };
  }

  var styleSheets = !inNode ? document.head.getElementsByTagName("script") : [];
  module.exports.settings = settings;
  module.exports.units = {
    "UNIT_NONE": 0,
    "UNIT_PX": 1,
    "UNIT_MM": 2,
    "UNIT_CM": 3,
    "UNIT_IN": 4,
    "UNIT_EM": 5,
    "UNIT_PERCENTAGE": 6,
    "UNIT_PT": 7,
    "UNIT_PC": 8,
    "UNIT_EX": 9,
    "UNIT_CH": 10,
    "UNIT_REM": 11,
    "UNIT_SEC": 12,
    "UNIT_MS": 13
  };
  module.exports.newStyleSheet = "";
  module.exports.unitType = {
    "px": module.exports.units.UNIT_PX,
    "mm": module.exports.units.UNIT_MM,
    "cm": module.exports.units.UNIT_CM,
    "in": module.exports.units.UNIT_IN,
    "em": module.exports.units.UNIT_EM,
    "%": module.exports.units.UNIT_PERCENTAGE,
    "pt": module.exports.units.UNIT_PT,
    "pc": module.exports.units.UNIT_PC,
    "ex": module.exports.units.UNIT_EX,
    "ch": module.exports.units.UNIT_CH,
    "rem": module.exports.units.UNIT_REM,
    "s": module.exports.units.UNIT_SEC,
    "ms": module.exports.units.UNIT_MS
  };

  module.exports.throwError = function(errorId) {
    var msg = "";
    switch (errorId) {
      case 1:
        msg = "Variable blocks within blocks currently not supported.";
        break;
      case 2:
        var varName = arguments[1];
        msg = "Invalid variable name: " + varName +
          ". Cannot start with numbers or include special characters.";
        break;
      case 3:
        var varName = arguments[1];
        msg = "Undefined variable: " + varName + ".";
        break;
      case 4:
        var funcName = arguments[1];
        msg = "Function undefined: " + funcName + ".";
        break;
    }

    throw "s3.js Parser - " + msg;
  };

  function tokenize(line) {
    var // Split line by delimiters for each token.
        tokens = line.split(/\s*(\:|\;|\{|\}){1}\s*/g),
        tokenQueue = new TokenQueue();

    for (var tokenIdx = 0; tokenIdx < tokens.length; tokenIdx++) {
      var token = tokens[tokenIdx];
      if (token !== "") {
        tokenQueue.enqueue(token);
      }
    }

    return tokenQueue;
  }

  function apply(styleSheet) {
    // TODO: new name..? ugh.
    var doParse = function(str) {
      var lineTokens = tokenize(str);
      if (!lineTokens.isEmpty()) {
        Parser.parseLine(lineTokens);
      }
    };
    if (typeof styleSheet === "string") {
      doParse(styleSheet);
    } else {
      for (var lineNum = 1; lineNum <= styleSheet.length; lineNum++) {
        doParse(styleSheet[lineNum - 1]);
      }
    }
  };

  // Add global scope.
  // TODO: add default vars.
  Parser.scope.addToHead({});
  console.log(typeof module !== "undefined" && typeof module.exports !== "undefined");
  if (inNode) {
    // TODO
  } else {
    console.log("Applying...");
    // Iterate through each line for every s3 script element.
    for (var i = 0; i < styleSheets.length; i++) {
      if (styleSheets[i].getAttribute("type") === "text/s3") {
        var styleSheetCode = styleSheets[i].innerHTML.split("\n");
        for (var line = 0; line < styleSheetCode.length; line++) {
          var trimmedStyleSheet = styleSheetCode[line].trim();
          if (trimmedStyleSheet !== "") {
            apply(trimmedStyleSheet);
          }
        }
      }
    }
  }

  console.log(module.exports.newStyleSheet);
  if (inNode) {
    // TODO: applyStyle for Node environments.
  } else {
    Browser.applyStyle(module.exports.newStyleSheet);
    //window.s3 = ?
  }
})(
  typeof window === "undefined" ? {} :
  (typeof window.s3 !== "undefined" ? window.s3 : {})
);

},{"./browser.js":1,"./function.js":3,"./linkedlist.js":4,"./parser.js":5,"./tokenqueue.js":7}],7:[function(require,module,exports){
function TokenQueue() {
  this.list = new LinkedList();
  this.length = 0;
}

TokenQueue.prototype.enqueue = function(e) {
  this.list.addToTail(e);
  this.length++;
};

TokenQueue.prototype.peek = function() {
  if (this.length > 0) {
    return this.list.get(0);
  } else {
    return null;
  }
};

TokenQueue.prototype.dequeue = function() {
  if (this.length > 0) {
    this.length--;
    return this.list.removeHead();
  } else {
    return null;
  }
};

TokenQueue.prototype.isEmpty = function() {
  return this.length === 0;
};

TokenQueue.prototype.size = function() {
  return this.length;
};

var LinkedList = require("./linkedlist.js");
module.exports = TokenQueue;

},{"./linkedlist.js":4}]},{},[6]);
