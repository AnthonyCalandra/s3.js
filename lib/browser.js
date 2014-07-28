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
