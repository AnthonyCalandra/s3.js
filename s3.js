/**
 * s3.js - Version 0.1
 * Designed and developed by Anthony Calandra - 2014.
 **/
(function() {
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

    // TODO: implement as function, not as method of LinkedList.
    LinkedList.prototype.findKey = function(key) {
        var currentNode = this.head,
            index = 0;
        while (index < this.length) {
            if (currentNode.element[key] !== undefined) {
                return {
                    "val": currentNode.element[key],
                    "index": index
                };
            }

            currentNode = currentNode.next;
            index++;
        }

        return null;
    };

    // TODO: implement as function, not as method of LinkedList.
    LinkedList.prototype.addKey = function(key, val, index) {
        if (index < 0 || index >= this.length) {
            return false;
        }

        var currentNode = this.head;
        while (index) {
            currentNode = currentNode.next;
            index--;
        }

        currentNode.element[key] = val;
        return true;
    };

    // TODO: remove (for testing).
    LinkedList.prototype.print = function() {
        var length = this.length,
            currentNode = this.head,
            msg = "",
            e = null;
        while (length > 0) {
            /*currentNode.element.forEach(function(e) {
                if (currentNode.element.hasOwnProperty(e)) {
                    msg += "key=" + e + " val=" + currentNode.element[e] + " ";
                }
            });*/
            
            msg += currentNode.element + ", ";
            currentNode = currentNode.next;
            length--;
            //msg = "";
        }
        
        console.log(msg);
    };

    LinkedList.prototype.destroy = function() {
        delete this;
    };
    
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
    
    // TODO: remove (for testing).
    TokenQueue.prototype.print = function() {
        this.list.print();
    };
    
    var s3 = {},
        styleSheets = document.head.getElementsByTagName("script"),
        newStyleSheet = "",
        blockContent = "",
        blockName = "",
        inVarBlock = false,
        inCommentBlock = false,
        inCSSBlock = false,
        scope = new LinkedList(),
        cssFunctions = ["attr", "blur", "brightness", "calc", "circle", "contrast", "cubic-bezier", "cycle", "drop-shadow", "element", "ellipse", "grayscale", "hsl", "hsla", "hue-rotate", "image", "inset", "invert", "linear-gradient", "matrix", "matrix3d", "minmax", "opacity", "perspective", "polygon", "radial-gradient", "rect", "repeat", "repeating-linear-gradient", "repeating-radial-gradient", "rgb", "rgba", "rotate", "rotatex", "rotatey", "rotatez", "rotate3d", "saturate", "scale", "scalex", "scaley", "scalez", "scale3d", "sepia", "skew", "skewx", "skewy", "steps", "translate", "translatex", "translatey", "translatez", "translate3d", "url", "var"],
        definedFunctions = (function() {
            // TODO
            return {
                "url": function() {
                    return "url(\"wat.png\")";
                }
            };
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

        tokens.forEach(function(token) {
            if (token !== "") {
                tokenQueue.enqueue(token);
            }
        });
        return tokenQueue;
    }
    
    function evaluateExpression(expr) {
        var operands = expr.split(/\s*(\+|\-|\*|\/)\s*(?!.*\))/g),
            isFunction = /^([a-zA-Z][\w\-]*)(?=\(.*\))/;

        // TODO: function operations.

        // Are there mathematical operators present?
        if (operands.length > 1) {
            if (isFunction.test(expr)) { // Is it a function?
                ; // TODO
            } else { // Must be some math expressions then.
                // Cheating cause CSS has the calc "function" but support
                // in older browsers is limited.
                expr = "calc(" + expr + ")";
            }
        } else {
            // Evaluate the variable.
            if (expr[0] === "@") {
                // Check to see if one exists in local/global scope.
                var variable = scope.findKey(expr.substr(1));
                // If so, the evaluated variable is the value already evaluated.
                if (variable !== null) {
                    expr = variable.val;
                } else {
                    throwError(3, expr);
                }
            } else if (isFunction.test(expr)) { // Is it a function?
                var functionData = /^([a-zA-Z][\w\-]*)\(\s*(.*)\s*\)/.exec(expr),
                    functionName = functionData[1],
                    parameters = functionData[2];
                // No arguments.
                if (parameters === "") {
                    expr = applyFunction(functionName, []);
                } else {
                    // TODO
                    /*var args = [];
                     for (var index = 0; index < ; index++) {
                     if ()
                     }
                     
                     applyFunction(functionData[1], args);*/
                }
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
            scope.addKey(name, evaluateExpression(expr));
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
                if (!/^[a-zA-Z]\w*$/.test(varName)) {
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
                    newStyleSheet += scope.findKey(varName).val;
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
                        }
                        
                        newStyleSheet += "}";
                    } else {
                        inVarBlock = false;
                        // Remove local scope object and add contents of variable
                        // block to current scope.
                        scope.removeHead();
                        scope.addKey(blockName, blockContent);
                        scope.print();
                        
                        blockName = "";
                    }
                }
            }
        }
    }
    
    s3.apply = function(styleSheet) {
        // TODO: new name..? ugh.
        var doParse = function(str) {
            var lineTokens = tokenize(str);
            if (!lineTokens.isEmpty()) {
                //console.log("Stylesheet tokens for a line: ");
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
                    s3.apply(trimmedStyleSheet);
                }
            }
        }
    }
    
    applyStyle(newStyleSheet);
    console.log(newStyleSheet);
    return s3;
})();