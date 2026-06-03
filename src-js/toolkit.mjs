  function isPrismCodeElement(element) {
    var classes;
    if (!element || element.tagName !== "CODE") {
      return false;
    }
    classes = " " + element.className + " " + (element.parentElement ? element.parentElement.className : "") + " ";
    return (
      classes.indexOf(" language-") !== -1 ||
      classes.indexOf(" line-numbers ") !== -1 ||
      classes.indexOf(" match-braces ") !== -1 ||
      classes.indexOf(" highlight ") !== -1
    );
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

export {
  isPrismCodeElement,
  clamp,
}