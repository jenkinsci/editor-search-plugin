import { isPrismCodeElement, clamp } from "./toolkit.mjs";

  function ReadonlyCodeAdapter(host) {
    this.type = "readonly";
    this.host = host;
    this.overlay = null;
    this.index = [];
    this.value = "";
  }

  ReadonlyCodeAdapter.prototype.getHost = function () {
    return this.host;
  };

  ReadonlyCodeAdapter.prototype.getCodeElements = function () {
    return Array.prototype.filter.call(this.host.querySelectorAll("code"), function (element) {
      return isPrismCodeElement(element);
    });
  };

  ReadonlyCodeAdapter.prototype.rebuildIndex = function () {
    var self = this;
    var offset = 0;
    this.index = [];
    this.getCodeElements().forEach(function (code) {
      var walker = document.createTreeWalker(
        code,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            var parent = node.parentElement;
            if (
              !parent ||
              parent.closest(".jenkins-editor-search") ||
              parent.closest(".jenkins-editor-search-trigger") ||
              parent.closest(".line-numbers-rows") ||
              parent.closest("[aria-hidden='true']")
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        },
        false
      );
      var node = walker.nextNode();
      while (node) {
        self.index.push({
          node: node,
          start: offset,
          end: offset + node.nodeValue.length,
        });
        offset += node.nodeValue.length;
        node = walker.nextNode();
      }
    });
    this.value = this.index
      .map(function (entry) {
        return entry.node.nodeValue;
      })
      .join("");
  };

  ReadonlyCodeAdapter.prototype.getValue = function () {
    this.rebuildIndex();
    return this.value;
  };

  ReadonlyCodeAdapter.prototype.getCursorIndex = function () {
    return 0;
  };

  ReadonlyCodeAdapter.prototype.getSelectedText = function () {
    var selection = window.getSelection ? window.getSelection() : null;
    var text;
    if (!selection || selection.rangeCount === 0) {
      return "";
    }
    if (!this.host.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      return "";
    }
    text = selection.toString();
    return text && text.indexOf("\n") === -1 && text.length <= 200 ? text : "";
  };

  ReadonlyCodeAdapter.prototype.focus = function () {
    this.host.focus();
  };

  ReadonlyCodeAdapter.prototype.onSearchOpen = function () {
    this.host.classList.add("jenkins-editor-search-host--readonly-active");
  };

  ReadonlyCodeAdapter.prototype.onSearchClose = function () {
    this.host.classList.remove("jenkins-editor-search-host--readonly-active");
    this.clearHighlights();
  };

  ReadonlyCodeAdapter.prototype.clearExternalSearchState = function () {};

  ReadonlyCodeAdapter.prototype.collapseSelection = function () {
    var selection = window.getSelection ? window.getSelection() : null;
    if (selection && this.host.contains(selection.anchorNode)) {
      selection.removeAllRanges();
    }
  };

  ReadonlyCodeAdapter.prototype.ensureOverlay = function () {
    if (!this.overlay) {
      this.overlay = document.createElement("span");
      this.overlay.className = "jenkins-editor-search-readonly-overlay";
      this.overlay.setAttribute("aria-hidden", "true");
      this.host.insertBefore(this.overlay, this.host.firstChild);
    }
    this.overlay.style.width = Math.max(this.host.scrollWidth, this.host.clientWidth) + "px";
    this.overlay.style.height = Math.max(this.host.scrollHeight, this.host.clientHeight) + "px";
    return this.overlay;
  };

  ReadonlyCodeAdapter.prototype.clearHighlights = function () {
    if (this.overlay) {
      this.overlay.textContent = "";
    }
  };

  ReadonlyCodeAdapter.prototype.positionForIndex = function (index) {
    var entry;
    var i;
    if (!this.index.length) {
      return null;
    }
    for (i = 0; i < this.index.length; i += 1) {
      entry = this.index[i];
      if (index <= entry.end) {
        return {
          node: entry.node,
          offset: clamp(index - entry.start, 0, entry.node.nodeValue.length),
        };
      }
    }
    entry = this.index[this.index.length - 1];
    return {
      node: entry.node,
      offset: entry.node.nodeValue.length,
    };
  };

  ReadonlyCodeAdapter.prototype.rangeForMatch = function (match) {
    var start = this.positionForIndex(match.start);
    var end = this.positionForIndex(match.end);
    var range;
    if (!start || !end) {
      return null;
    }
    range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    return range;
  };

  ReadonlyCodeAdapter.prototype.highlight = function (matches, selected) {
    var self = this;
    var overlay = this.ensureOverlay();
    var hostRect = this.host.getBoundingClientRect();
    var hostScrollLeft = this.host.scrollLeft;
    var hostScrollTop = this.host.scrollTop;
    this.clearHighlights();
    matches.forEach(function (match, index) {
      var range = self.rangeForMatch(match);
      if (!range) {
        return;
      }
      Array.prototype.forEach.call(range.getClientRects(), function (rect) {
        var marker;
        if (rect.width <= 0 || rect.height <= 0) {
          return;
        }
        marker = document.createElement("span");
        marker.className =
          index === selected
            ? "jenkins-editor-search-readonly-match jenkins-editor-search-match-current"
            : "jenkins-editor-search-readonly-match jenkins-editor-search-match";
        marker.style.left = rect.left - hostRect.left + hostScrollLeft + "px";
        marker.style.top = rect.top - hostRect.top + hostScrollTop + "px";
        marker.style.width = rect.width + "px";
        marker.style.height = rect.height + "px";
        overlay.appendChild(marker);
      });
      range.detach();
    });
  };

  ReadonlyCodeAdapter.prototype.selectRange = function (start, end) {
    var range = this.rangeForMatch({ start: start, end: end });
    var rect;
    var hostRect;
    if (!range) {
      return;
    }
    rect = range.getBoundingClientRect();
    hostRect = this.host.getBoundingClientRect();
    if (rect.top < hostRect.top || rect.bottom > hostRect.bottom) {
      this.host.scrollTop += rect.top - hostRect.top - this.host.clientHeight / 2 + rect.height / 2;
    }
    if (rect.left < hostRect.left || rect.right > hostRect.right) {
      this.host.scrollLeft += rect.left - hostRect.left - 40;
    }
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      this.host.scrollIntoView({ block: "center", inline: "nearest" });
    }
    range.detach();
  };

  ReadonlyCodeAdapter.prototype.isSameEditor = function (adapter) {
    return adapter && adapter.type === this.type && adapter.host === this.host;
  };

export { ReadonlyCodeAdapter };