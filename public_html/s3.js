(function() {
    if (!String.prototype.trim) {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, "");
        };
    }
    
    var s3 = window.s3 = {},
        styleSheets = document.head.getElementsByTagName("script"),
        newStyleSheet = "",
        currentLineNum = 0,
        blockContent = "",
        blockName = "",
        globalInBlock = false,
        scope = new LinkedList();
    
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
        if (this.linkedList.length == 0) {
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
        var index = index || 0;
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
            currentNode = this.linkedList.head;
        while (length > 0) {
            var msg = "";
            for (var e in currentNode.element) {
                if (currentNode.element.hasOwnProperty(e)) {
                    msg += "key=" + e + " val=" + currentNode.element[e] + " ";
                }
            }
            
            console.log(msg);
            currentNode = currentNode.next;
            length--;
        }
    };

    LinkedList.prototype.destroy = function() {
        delete this.linkedList;
        this.linkedList = null;
    };
    
    function applyStyle(styleSheet) {
        var styleElement = document.createElement("style");
        styleElement.innerHTML = styleSheet;
        document.head.appendChild(styleElement);
    }
    
    function throwError(errorId) {
        var msg = "";
        switch (errorId) {
            case 1:
                msg = "Variable blocks within variable blocks currently not supported.";
                break;
        }
        
        throw "s3.js Parser - at line " + currentLineNum + ": " + msg;
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
        var evaluatedVariable = value;
        if (value[0] === '@') {
            var variable = scope.findKey(value.substr(1));
            if (variable !== null) {
                evaluatedVariable = variable.val;
            }
        }

        if (!globalInBlock) {
            newStyleSheet += property + ":" + evaluatedVariable + ";";
        } else {
            blockContent += property + ":" + evaluatedVariable + ";";
        }
    }

    function parseLine(tokens, inBlock) {
        var nameDecl = /\@(\D\w*)/,
            cssDecl = /^((?:\#|\.)*[A-Za-z]+)+/;
    
            function parseVariable(name, expr) {
                console.log("Parse var: " + name + " with expression: " + expr);
                // TODO: mathematical/function operations.
                scope.addKey(name, expr);
            }
            
            function parseBlock(blockTokens, inVarBlock) {
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
                        parseLine(blockTokens, inVarBlock);
                    }
                }
            }
            
        for (var tokenIdx = 0; tokenIdx < tokens.length; tokenIdx++) {
            var token = tokens[tokenIdx],
                currentLength = tokens.length;
            // Has a valid var or block name been defined?
            if (nameDecl.test(token)) {
                var varName = token.substr(1);
                if (currentLength >= 4 && tokens[tokenIdx + 1] === ":") {
                    parseVariable(varName, tokens[tokenIdx + 2]);
                    tokens.splice(0, 4);
                } else if (currentLength >= 2 && tokens[tokenIdx + 1] === ";") {
                    newStyleSheet += scope.findKey(varName).val;
                } else {
                    if (globalInBlock) {
                        throwError(1);
                    }
                    
                    var endBlockIdx = tokens.indexOf("}");
                    blockName = varName;
                    globalInBlock = true;
                    scope.addKey(blockName, "");
                    scope.addToHead({});
                    if (endBlockIdx == -1) {
                        parseBlock(tokens.splice(0, tokens.length), true);
                    } else {
                        parseBlock(tokens.splice(0, endBlockIdx + 1), true);
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
                    if (endBlockIdx == -1) {
                        parseBlock(tokens.splice(0, tokens.length), false);
                    } else {
                        parseBlock(tokens.splice(0, endBlockIdx + 1), false);
                    }
                }
            } else { // Other stuff... comments, ending blocks, grandma's pie.
                if (token.substring(0, 2) === "//") {
                    continue;
                } else if (token.substring(0, 2) === "/*") {
                    console.log("TODO: Handle comment block.");
                } else if (token === "}") {
                    if (!globalInBlock) {
                        newStyleSheet += "}";
                    } else {
                        globalInBlock = false;
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
                parseLine(lineTokens, globalInBlock);
            }
        };
        if (typeof styleSheet === "string") {
            currentLineNum++;
            doParse(styleSheet);
        } else {
            currentLineNum  = 0;
            for (var lineNum = 1; lineNum <= styleSheet.length; lineNum++) {
                currentLineNum = lineNum;
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