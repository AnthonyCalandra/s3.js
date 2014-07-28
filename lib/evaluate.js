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
