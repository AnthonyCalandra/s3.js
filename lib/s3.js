/**
 * s3.js - Version 0.2.0
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
