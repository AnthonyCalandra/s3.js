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
        this.linkedList = {
            length: 0,
            head: null,
            tail: null
        };
    }

    LinkedList.prototype.addToHead = function(obj) {
        var newNode = {
            element: obj,
            next: null
        };
        if (this.linkedList.length === 0) {
            this.linkedList.head = newNode;
            this.linkedList.tail = this.linkedList.head;
        } else {
            newNode.next = this.linkedList.head;
            this.linkedList.head = newNode;
        }

        this.linkedList.length++;
    };

    LinkedList.prototype.removeHead = function() {
        var head = null;
        if (this.linkedList.length > 0) {
            head = this.linkedList.head.element;
            this.linkedList.head = this.linkedList.head.next;
            this.linkedList.length--;
        }

        return head;
    };

    LinkedList.prototype.findKey = function(key) {
        var currentNode = this.linkedList.head,
            index = 0;
        while (index < this.linkedList.length) {
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

    LinkedList.prototype.addKey = function(key, val, index) {
        if (index < 0 || index >= this.linkedList.length) {
            return false;
        }

        var currentNode = this.linkedList.head;
        while (index) {
            currentNode = currentNode.next;
            index--;
        }

        currentNode.element[key] = val;
        return true;
    };

    LinkedList.prototype.print = function() {
        var length = this.linkedList.length,
            currentNode = this.linkedList.head,
            msg = "",
            e = null;
        while (length > 0) {
            for (e in currentNode.element) {
                if (currentNode.element.hasOwnProperty(e)) {
                    msg += "key=" + e + " val=" + currentNode.element[e] + " ";
                }
            }
            
            console.log(msg);
            currentNode = currentNode.next;
            length--;
            msg = "";
        }
    };

    LinkedList.prototype.destroy = function() {
        delete this.linkedList;
        this.linkedList = null;
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
        definedFunctions = {};
    
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
        var tokenDelimiters = /\s*(\:|\;|\{|\}){1}\s*/g,
            tokens = line.split(tokenDelimiters);
        return tokens.filter(function(token) {
            return token !== "";
        });
    }
    
    function evaluateCSS(property, value) {
        console.log("Evaluating CSS tokens: " + property + ":" + value + ";");
        var evaluatedVariable = value,
            variable = null;
        // Have we found a variable?
        if (value[0] === "@") {
            // Check to see if one exists in local/global scope.
            variable = scope.findKey(value.substr(1));
            // If so, the evaluated variable is the value already evaluated.
            if (variable !== null) {
                evaluatedVariable = variable.val;
            } else {
                throwError(3, value);
            }
        }

        // Add to stylesheet if we aren't in a variable block.
        if (!inVarBlock) {
            newStyleSheet += property + ":" + evaluatedVariable + ";";
        } else {
            blockContent += property + ":" + evaluatedVariable + ";";
        }
    }
    
    function applyFunction(name, arguments) {
        var func = definedFunctions[name];
        if (func) {
            func.apply(null, arguments);
        } else {
            throwError(4, name);
        }
    }

    function parseLine(tokens) {
        var nameDecl = /\@\w+/,
            validNameDec = /^[a-zA-Z]\w*$/,
            cssDecl = /^((?:\#|\.)*[A-Za-z]+)+/;
    
            function parseVariable(name, expr) {
                console.log("Parse var: " + name + " with expression: " + expr);
                var operators = /\s*(\+|\-|\*|\\)\s*(?!.*\))/g,
                    isFunction = /^([a-zA-Z]\w*)(?=\(.*\))/,
                    operands = expr.split(operators);
            
                // TODO: function operations.

                // Are there mathematical operators present?
                if (operands.length > 1) {
                    ; // TODO
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
                    } else if (isFunction.test(expr)) {
                        var functionData = /^([a-zA-Z]\w*)\(\s*(.*)\s*\)/.exec(expr);
                        // No arguments.
                        if (functionData[2] === "") {
                            applyFunction(functionData[1], []);
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
                
                // Store the evaluated result.
                scope.addKey(name, expr);
            }
            
            function parseBlock(blockTokens) {
                console.log("Tokens for block: " + blockTokens);
                // Is it a CSS property?
                if (!inVarBlock) {
                    newStyleSheet += blockTokens[0] + "{";
                }
                
                // Remove the block identifier or opening brace.
                blockTokens.shift();
                if (blockTokens.length > 0) {
                    // Remove the opening brace.
                    blockTokens.shift();
                    if (blockTokens.length > 0) {
                        parseLine(blockTokens);
                    }
                }
            }
            
        for (var tokenIdx = 0; tokenIdx < tokens.length; tokenIdx++) {
            var token = tokens[tokenIdx],
                currentLength = tokens.length;
        
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
            } else if (nameDecl.test(token)) { // Has a valid var or block name been defined?
                var varName = token.substr(1);
                if (!validNameDec.test(varName)) {
                    throwError(2, token);
                }
                
                if (currentLength >= 4 && tokens[tokenIdx + 1] === ":") {
                    parseVariable(varName, tokens[tokenIdx + 2]);
                    tokens.splice(0, 4);
                    // Reset token index to start at beginning of tokens array.
                    tokenIdx = -1;
                } else if (currentLength >= 2 && tokens[tokenIdx + 1] === ";") {
                    newStyleSheet += scope.findKey(varName).val;
                    tokens.splice(0, 2);
                    // Reset token index to start at beginning of tokens array.
                    tokenIdx = -1;
                } else {
                    if (inVarBlock || inCSSBlock) {
                        throwError(1);
                    }
                    
                    var endBlockIdx = tokens.indexOf("}");
                    blockName = varName;
                    inVarBlock = true;
                    // Add new block scope.
                    scope.addToHead({});
                    if (endBlockIdx === -1) {
                        parseBlock(tokens.splice(0, tokens.length));
                    } else {
                        parseBlock(tokens.splice(0, endBlockIdx + 1));
                        // Reset token index to start at beginning of tokens array.
                        tokenIdx = -1;
                    }
                }
            } else if (cssDecl.test(token)) { // Probably a vanilla CSS declaration.
                if (currentLength >= 4 && tokens[tokenIdx + 1] === ":") {
                    var cssTokens = tokens.splice(0, 4);
                    evaluateCSS(cssTokens[0], cssTokens[2]);
                    // Reset token index to start at beginning of tokens array.
                    tokenIdx = -1;
                } else {
                    var endBlockIdx = tokens.indexOf("}");
                    inCSSBlock = true;
                    if (endBlockIdx === -1) {
                        parseBlock(tokens.splice(0, tokens.length));
                    } else {
                        parseBlock(tokens.splice(0, endBlockIdx + 1));
                        // Reset token index to start at beginning of tokens array.
                        tokenIdx = -1;
                    }
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
            if (lineTokens !== []) {
                console.log("Stylesheet tokens for a line: " + lineTokens);
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