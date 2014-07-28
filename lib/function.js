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
