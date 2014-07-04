/**
 * s3.js - Version 0.1
 * Designed and developed by Anthony Calandra - 2014.
 **/
(function(settings) {
    if (typeof String.prototype.trim !== "function") {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, "");
        };
    }
    
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
    
    var s3 = {
            "UNIT_NONE": 0, "UNIT_PX": 1, "UNIT_MM": 2, "UNIT_CM": 3,
            "UNIT_IN": 4, "UNIT_EM": 5, "UNIT_PERCENTAGE": 6, "UNIT_PT": 7,
            "UNIT_PC": 8, "UNIT_EX": 9, "UNIT_CH": 10, "UNIT_REM": 11,
            "UNIT_SEC": 12, "UNIT_MS": 13
        },
        styleSheets = document.head.getElementsByTagName("script"),
        newStyleSheet = "",
        blockContent = "",
        blockName = "",
        currentRuleset = "",
        inVarBlock = false,
        inCommentBlock = false,
        inCSSBlock = false,
        scope = new LinkedList(),
        unitType = {
            "px": s3.UNIT_PX,
            "mm": s3.UNIT_MM,
            "cm": s3.UNIT_CM,
            "in": s3.UNIT_IN,
            "em": s3.UNIT_EM,
            "%": s3.UNIT_PERCENTAGE,
            "pt": s3.UNIT_PT,
            "pc": s3.UNIT_PC,
            "ex": s3.UNIT_EX,
            "ch": s3.UNIT_CH,
            "rem": s3.UNIT_REM,
            "s": s3.UNIT_SEC,
            "ms": s3.UNIT_MS
        },
        cssFunctions = [
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
        ],
        definedFunctions = (function() {
            // Start by defining built-in functions.
            var functions = {
                "percentage": function(val) {
                    return (val.value * 100) + "%";
                }
            };
            for (var fn in settings.functions) {
                functions[fn] = settings.functions[fn];
            }
            
            return functions;
        })();
    
    function applyStyle(styleSheet) {
        var styleElement = document.createElement("style");
        styleElement.innerHTML = styleSheet;
        document.head.appendChild(styleElement);
    }
    
    function throwError(errorId) {
        var msg = "";
        switch (errorId) {
            case 1:
                msg = "Variable blocks within blocks currently not supported.";
                break;
            case 2:
                var varName = arguments[1];
                msg = "Invalid variable name: " + varName + ". Cannot start with numbers or include special characters.";
                break;
            case 3:
                var varName = arguments[1];
                msg = "Undefined variable: " + varName + ".";
                break;
            case 4:
                var funcName = arguments[1];
                msg = "Function undefined: " + funcName + ".";
        }
        
        throw "s3.js Parser - " + msg;
    }

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
    
    function evaluateExpression(expr) {
        // Is it a function?
        if (/^([a-zA-Z][\w\-]*)(?=\(.*\)$)/.test(expr)) {
            var functionData = /^([a-zA-Z][\w\-]*)\(\s*(.*)\s*\)/.exec(expr),
                functionName = functionData[1],
                functionArgs = functionData[2];
        
            // No arguments.
            if (functionArgs === "") {
                expr = applyFunction(functionName, []);
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
                            unit = unitType[unit] ? unitType[unit] : s3.UNIT_NONE;
                        } else {
                            unit = s3.UNIT_NONE;
                        }

                        return {
                            "value": evaluatedExpr,
                            "cssRule": currentRuleset,
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
                expr = applyFunction(functionName, argValues);
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
            
            expr = calc(evalExpr);
        } else if (expr[0] === "@") { // Evaluate the variable.
            // Check to see if one exists in local/global scope.
            var variable = findKey(scope, expr.substr(1));
            // If so, the evaluated variable is the value already evaluated.
            if (variable !== null) {
                expr = variable.val;
            } else {
                throwError(3, expr);
            }
        }

        return expr;
    }
    
    function evaluateCSS(property, value) {
        console.log("Evaluating CSS tokens: " + property + ":" + value + ";");
        var evaluatedVariable = evaluateExpression(value);
        // Add to stylesheet if we aren't in a variable block.
        if (!inVarBlock) {
            newStyleSheet += property + ":" + evaluatedVariable + ";";
        } else {
            blockContent += property + ":" + evaluatedVariable + ";";
        }
    }
    
    function applyFunction(name, arguments) {
        var func = definedFunctions[name];
        // Has the function not been defined with the given name?
        if (!func) {
            // Is it a CSS function?
            if (cssFunctions.indexOf(name) !== -1) {
                // Re-build the expression.
                return name + "(" + arguments.toString() + ")";
            } else {
                // Undefined function - throw error.
                throwError(4, name);
            }
        }
        
        // Otherwise, apply the function with given args.
        return func.apply(null, arguments);
    }

    function parseLine(tokens) {
        function parseVariable(name, expr) {
            console.log("Parse var: " + name + " with expression: " + expr);
            // Store the evaluated result.
            addKey(scope, name, evaluateExpression(expr));
        }
            
        function parseBlock(blockTokens) {
            var token = blockTokens.dequeue();
            console.log("Tokens for block: " + token);
            // Is it a CSS property?
            if (!inVarBlock) {
                newStyleSheet += token + "{";
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
            if (inCommentBlock) {
                if (token === "*/") {
                    inCommentBlock = false;
                }
                
                continue;
            } else if (token.substring(0, 2) === "//") {
                // Skip the entire line.
                break;
            } else if (token.substring(0, 2) === "/*") {
                inCommentBlock = true;
            } else if (/^\@\w+/.test(token)) { // Has a valid var or block name been defined?
                var varName = token.substr(1);
                if (!/^[a-zA-Z_]\w*$/.test(varName)) {
                    throwError(2, token);
                }
                
                if (currentLength >= 4 && nextToken === ":") {
                    // Dequeue the ':'.
                    tokens.dequeue();
                    // Dequeue and pass variable value as arg.
                    parseVariable(varName, tokens.dequeue());
                    // Dequeue the ';'.
                    tokens.dequeue();
                } else if (currentLength >= 2 && nextToken === ";") {
                    var variable = findKey(scope, varName);
                    if (variable !== null) {
                        newStyleSheet += variable.val;
                    } else {
                        throwError(3, token);
                    }                    

                    // Dequeue the ';'.
                    tokens.dequeue();
                } else {
                    if (inVarBlock || inCSSBlock) {
                        throwError(1);
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

                    blockName = varName;
                    inVarBlock = true;
                    // Add new block scope.
                    scope.addToHead({});
                    parseBlock(blockTokens);
                }
            } else if (/^((?:\#|\.)*[A-Za-z]+)+/.test(token)) { // Probably a vanilla CSS declaration.
                // The first token is the ruleset name.
                if (currentRuleset === "") {
                    currentRuleset = token;
                }
                
                if (currentLength >= 4 && nextToken === ":") {
                    // Dequeue the ':'.
                    tokens.dequeue();
                    // Dequeue the CSS value and pass it as an arg.
                    evaluateCSS(token, tokens.dequeue());
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
                    
                    inCSSBlock = true;
                    parseBlock(cssTokens);
                }
            } else { // Other stuff... comments, ending blocks, grandma's pie.
                if (token === "}") {
                    if (!inVarBlock) {
                        if (inCSSBlock) {
                            inCSSBlock = false;
                            currentRuleset = "";
                        }
                        
                        newStyleSheet += "}";
                    } else {
                        inVarBlock = false;
                        // Remove local scope object and add contents of variable
                        // block to current scope.
                        scope.removeHead();                       
                        addKey(scope, blockName, blockContent);
                        blockName = "";
                        blockContent = "";
                    }
                }
            }
        }
    }
    
    function apply(styleSheet) {
        // TODO: new name..? ugh.
        var doParse = function(str) {
            var lineTokens = tokenize(str);
            if (!lineTokens.isEmpty()) {
                parseLine(lineTokens);
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
    scope.addToHead({});
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
    
    applyStyle(newStyleSheet);
    console.log(newStyleSheet);
    window.s3 = s3;
})(window.s3 || {});