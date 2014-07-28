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
