import { AceAdapter } from "./AceAdapter.mjs";
import { CodeMirrorAdapter } from "./CodeMirrorAdapter.mjs";
import { ReadonlyCodeAdapter } from "./ReadonlyCodeAdapter.mjs";
import { TextareaAdapter } from "./TextareaAdapter.mjs";

(function () {
  "use strict";

  var ENHANCED_ATTRIBUTE = "data-editor-search-enhanced";
  var OPEN_ATTRIBUTE = "data-editor-search-open";
  var MATCH_LIMIT = 10000;
  var DEFAULT_CONTROL_TOP = 8;
  var DEFAULT_CONTROL_RIGHT = 10;
  var CONTROL_GAP = 8;
  var SCROLLBAR_GAP = 6;
  var activeController = null;
  var discoverQueued = false;

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function isVisible(element) {
    if (!element || !element.getBoundingClientRect) {
      return false;
    }
    var rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function keyName(event) {
    return String(event.key || "").toLowerCase();
  }

  function isFindShortcut(event) {
    return (event.metaKey || event.ctrlKey) && !event.altKey && keyName(event) === "f";
  }

  function isFindNextShortcut(event) {
    return (event.metaKey || event.ctrlKey) && !event.altKey && keyName(event) === "g";
  }

  function normalizeIndex(index, length) {
    if (!length) {
      return -1;
    }
    return ((index % length) + length) % length;
  }

  function collectMatches(value, query, options) {
    var source = options.regex ? query : escapeRegExp(query);
    var flags = options.caseSensitive ? "g" : "gi";
    var regex;
    var matches = [];
    var capped = false;
    var match;

    if (options.wholeWord) {
      source = "\\b(?:" + source + ")\\b";
    }

    try {
      regex = new RegExp(source, flags);
    } catch (error) {
      return {
        error: error,
        matches: matches,
        capped: false,
      };
    }

    while ((match = regex.exec(value)) !== null) {
      if (!match[0]) {
        if (regex.lastIndex >= value.length) {
          break;
        }
        regex.lastIndex += 1;
        continue;
      }

      matches.push({
        start: match.index,
        end: match.index + match[0].length,
      });

      if (matches.length >= MATCH_LIMIT) {
        capped = true;
        break;
      }
    }

    return {
      error: null,
      matches: matches,
      capped: capped,
    };
  }

  function createIcon() {
    var icon = document.createElement("span");
    icon.className = "jenkins-editor-search-icon";
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function reveal(element) {
    var show = function () {
      element.classList.add("jenkins-editor-search--visible");
    };
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(show);
    } else {
      show();
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function updateHostLayout(host) {
    var hasSampleControl = false;
    var hostRect;
    var maxTop;
    var nextTop;
    var nextRight;
    var parent = host && host.parentElement;
    var right = DEFAULT_CONTROL_RIGHT;
    var sampleScope;
    var top = DEFAULT_CONTROL_TOP;

    if (!host || !host.style || !parent || !host.getBoundingClientRect) {
      return;
    }

    hostRect = host.getBoundingClientRect();
    Array.prototype.forEach.call(
      host.querySelectorAll(".ace_scrollbar-v, .CodeMirror-vscrollbar"),
      function (candidate) {
        var rect;
        if (!isVisible(candidate)) {
          return;
        }
        rect = candidate.getBoundingClientRect();
        if (
          rect.right > hostRect.right - 12 &&
          rect.left < hostRect.right &&
          rect.bottom > hostRect.top &&
          rect.top < hostRect.bottom
        ) {
          right = Math.max(right, Math.ceil(hostRect.right - rect.left + SCROLLBAR_GAP));
        }
      }
    );
    maxTop = Math.max(DEFAULT_CONTROL_TOP, Math.min(96, hostRect.height - 40));
    sampleScope =
      (host.closest && host.closest(".workflow-editor-wrapper, .setting-main, .jenkins-form-item")) || parent;

    Array.prototype.forEach.call(sampleScope.querySelectorAll(".samples, select"), function (candidate) {
      var rect;
      if (host.contains(candidate) || !isVisible(candidate)) {
        return;
      }

      rect = candidate.getBoundingClientRect();
      if (
        rect.bottom > hostRect.top &&
        rect.top < hostRect.top + 96 &&
        rect.right > hostRect.left &&
        rect.left < hostRect.right &&
        rect.right > hostRect.left + hostRect.width * 0.5
      ) {
        hasSampleControl = true;
        top = Math.max(top, Math.ceil(rect.bottom - hostRect.top + CONTROL_GAP));
      }
    });

    if (hasSampleControl) {
      host.setAttribute("data-editor-search-sample-control", "true");
    } else {
      host.removeAttribute("data-editor-search-sample-control");
    }

    nextTop = clamp(top, DEFAULT_CONTROL_TOP, maxTop) + "px";
    if (host.style.getPropertyValue("--editor-search-control-top") !== nextTop) {
      host.style.setProperty("--editor-search-control-top", nextTop);
    }

    nextRight = right + "px";
    if (host.style.getPropertyValue("--editor-search-control-right") !== nextRight) {
      host.style.setProperty("--editor-search-control-right", nextRight);
    }
  }

  function refreshHostLayoutSoon(host) {
    updateHostLayout(host);
    window.setTimeout(function () {
      updateHostLayout(host);
    }, 120);
  }

  function bindHostLayoutUpdates(host) {
    var parent = host && host.parentElement;
    var refresh = function () {
      refreshHostLayoutSoon(host);
    };
    var aceEditor = host && host.env && host.env.editor;

    host.addEventListener("mouseenter", refresh);
    host.addEventListener("focusin", refresh);

    if (host.CodeMirror && host.CodeMirror.on) {
      host.CodeMirror.on("change", refresh);
    }
    if (aceEditor && aceEditor.on) {
      aceEditor.on("change", refresh);
    }
    if (parent && window.MutationObserver) {
      new MutationObserver(refresh).observe(parent, {
        attributes: true,
        attributeFilter: ["class", "hidden", "style"],
        childList: true,
        subtree: true,
      });
    }
  }

  function removePanel(panel) {
    var removed = false;
    var remove = function () {
      if (removed) {
        return;
      }
      removed = true;
      if (panel.parentNode) {
        panel.parentNode.removeChild(panel);
      }
    };
    var onTransitionEnd = function (event) {
      if (event.target === panel) {
        panel.removeEventListener("transitionend", onTransitionEnd);
        remove();
      }
    };

    panel.classList.remove("jenkins-editor-search--visible");
    panel.addEventListener("transitionend", onTransitionEnd);
    window.setTimeout(remove, 260);
  }

  function getAceRange() {
    if (!window.ace || !window.ace.require) {
      return null;
    }
    try {
      return window.ace.require("ace/range").Range;
    } catch (error) {
      return null;
    }
  }

  function getAceDocument(editor) {
    if (editor.session.getDocument) {
      return editor.session.getDocument();
    }
    return editor.session.doc;
  }
  
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

  function readonlyHostFromElement(element) {
    var host;
    if (!element || !element.closest) {
      return null;
    }
    host = element.closest("pre");
    if (
      !host ||
      !isVisible(host) ||
      host.closest(".CodeMirror, .ace_editor, .jenkins-editor-search") ||
      !Array.prototype.some.call(host.querySelectorAll("code"), isPrismCodeElement)
    ) {
      return null;
    }
    return host;
  }

  function adapterFromCodeMirrorElement(element) {
    var codeMirror = element && element.CodeMirror;
    if (!codeMirror) {
      return null;
    }
    return new CodeMirrorAdapter(codeMirror);
  }

  function adapterFromAceElement(element) {
    var editor = element && element.env && element.env.editor;
    if (!editor && window.ace && window.ace.edit) {
      try {
        editor = window.ace.edit(element);
      } catch (error) {
        editor = null;
      }
    }
    if (!editor) {
      return null;
    }
    return new AceAdapter(editor, element);
  }

  function adapterFromNode(node) {
    var element = node && node.nodeType === Node.ELEMENT_NODE ? node : node && node.parentElement;
    var codeMirrorElement = element && element.closest ? element.closest(".CodeMirror") : null;
    var aceElement = element && element.closest ? element.closest(".ace_editor") : null;
    var readonlyHost = element && element.closest ? readonlyHostFromElement(element) : null;
    if (codeMirrorElement) {
      return adapterFromCodeMirrorElement(codeMirrorElement);
    }
    if (aceElement) {
      return adapterFromAceElement(aceElement);
    }
    if (readonlyHost) {
      return new ReadonlyCodeAdapter(readonlyHost);
    }
    while (element && element !== document.documentElement) {
      if (element.classList && element.classList.contains("CodeMirror")) {
        return adapterFromCodeMirrorElement(element);
      }
      if (element.classList && element.classList.contains("ace_editor")) {
        return adapterFromAceElement(element);
      }
      readonlyHost = readonlyHostFromElement(element);
      if (readonlyHost) {
        return new ReadonlyCodeAdapter(readonlyHost);
      }
      if (element.tagName === "TEXTAREA" && isVisible(element)) {
        return new TextareaAdapter(element);
      }
      element = element.parentElement;
    }
    return null;
  }

  function SearchController(adapter) {
    this.adapter = adapter;
    this.caseSensitive = false;
    this.regex = false;
    this.wholeWord = false;
    this.matches = [];
    this.selected = -1;
    this.capped = false;
    this.originIndex = adapter.getCursorIndex();
    this.panel = null;
    this.input = null;
    this.count = null;
    this.previousButton = null;
    this.nextButton = null;
    this.boundPlaceFixedPanel = this.placeFixedPanel.bind(this);
  }

  SearchController.prototype.open = function () {
    if (this.panel) {
      this.input.focus();
      this.input.select();
      return;
    }

    updateHostLayout(this.adapter.getHost());
    this.setHostOpen(true);
    this.adapter.onSearchOpen();
    this.adapter.clearExternalSearchState();
    this.panel = this.createPanel();
    this.adapter.getHost().appendChild(this.panel);
    if (this.adapter.fixed) {
      this.panel.classList.add("jenkins-editor-search--fixed");
      this.placeFixedPanel();
      window.addEventListener("resize", this.boundPlaceFixedPanel);
      window.addEventListener("scroll", this.boundPlaceFixedPanel, true);
    }
    reveal(this.panel);
    this.seedInput();
    this.input.focus();
    this.input.select();
    this.refresh();
  };

  SearchController.prototype.setHostOpen = function (open) {
    var host = this.adapter.getHost();
    if (!host || !host.setAttribute) {
      return;
    }
    if (open) {
      host.setAttribute(OPEN_ATTRIBUTE, "true");
    } else {
      host.removeAttribute(OPEN_ATTRIBUTE);
    }
  };

  SearchController.prototype.createPanel = function () {
    var panel = document.createElement("div");
    panel.className = "jenkins-editor-search";
    panel.setAttribute("role", "search");
    panel.innerHTML =
      '<div class="jenkins-editor-search__field">' +
      '<input class="jenkins-editor-search__input" type="text" autocomplete="off" spellcheck="false" placeholder="Find" aria-label="Find in editor">' +
      "</div>" +
      '<div class="jenkins-editor-search__actions">' +
      '<button type="button" class="jenkins-editor-search__button jenkins-editor-search__button--case" title="Match case" aria-label="Match case" aria-pressed="false">Aa</button>' +
      '<button type="button" class="jenkins-editor-search__button jenkins-editor-search__button--word" title="Match whole word" aria-label="Match whole word" aria-pressed="false">ab</button>' +
      '<button type="button" class="jenkins-editor-search__button jenkins-editor-search__button--regex" title="Use regular expression" aria-label="Use regular expression" aria-pressed="false">.*</button>' +
      '<span class="jenkins-editor-search__count" aria-live="polite">0 of 0</span>' +
      '<button type="button" class="jenkins-editor-search__button jenkins-editor-search__button--previous" title="Previous match" aria-label="Previous match"></button>' +
      '<button type="button" class="jenkins-editor-search__button jenkins-editor-search__button--next" title="Next match" aria-label="Next match"></button>' +
      '<button type="button" class="jenkins-editor-search__button jenkins-editor-search__button--close" title="Close" aria-label="Close"></button>' +
      "</div>";

    this.input = panel.querySelector(".jenkins-editor-search__input");
    this.count = panel.querySelector(".jenkins-editor-search__count");
    this.previousButton = panel.querySelector(".jenkins-editor-search__button--previous");
    this.nextButton = panel.querySelector(".jenkins-editor-search__button--next");
    this.bindPanel(panel);
    return panel;
  };

  SearchController.prototype.bindPanel = function (panel) {
    var self = this;
    var caseButton = panel.querySelector(".jenkins-editor-search__button--case");
    var wordButton = panel.querySelector(".jenkins-editor-search__button--word");
    var regexButton = panel.querySelector(".jenkins-editor-search__button--regex");
    var closeButton = panel.querySelector(".jenkins-editor-search__button--close");

    panel.addEventListener("mousedown", function (event) {
      event.stopPropagation();
    });

    this.input.addEventListener("input", function () {
      self.refresh();
    });

    panel.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        stopEvent(event);
        self.navigate(event.shiftKey);
      } else if (event.key === "Escape") {
        stopEvent(event);
        self.close(true);
      } else if (isFindShortcut(event)) {
        stopEvent(event);
        self.input.focus();
        self.input.select();
      }
    });

    caseButton.addEventListener("click", function (event) {
      stopEvent(event);
      self.caseSensitive = !self.caseSensitive;
      caseButton.setAttribute("aria-pressed", self.caseSensitive ? "true" : "false");
      self.refresh();
      self.input.focus();
    });

    wordButton.addEventListener("click", function (event) {
      stopEvent(event);
      self.wholeWord = !self.wholeWord;
      wordButton.setAttribute("aria-pressed", self.wholeWord ? "true" : "false");
      self.refresh();
      self.input.focus();
    });

    regexButton.addEventListener("click", function (event) {
      stopEvent(event);
      self.regex = !self.regex;
      regexButton.setAttribute("aria-pressed", self.regex ? "true" : "false");
      self.refresh();
      self.input.focus();
    });

    this.previousButton.addEventListener("click", function (event) {
      stopEvent(event);
      self.navigate(true);
    });

    this.nextButton.addEventListener("click", function (event) {
      stopEvent(event);
      self.navigate(false);
    });

    closeButton.addEventListener("click", function (event) {
      stopEvent(event);
      self.close(true);
    });
  };

  SearchController.prototype.seedInput = function () {
    var selected = this.adapter.getSelectedText();
    if (selected && selected.indexOf("\n") === -1 && selected.length <= 200) {
      this.input.value = selected;
    }
  };

  SearchController.prototype.refresh = function () {
    var query = this.input.value;
    var previousStart =
      this.selected >= 0 && this.matches[this.selected] ? this.matches[this.selected].start : this.originIndex;
    var result;

    this.adapter.clearHighlights();
    this.adapter.clearExternalSearchState();
    this.matches = [];
    this.selected = -1;
    this.capped = false;

    if (!query) {
      this.adapter.collapseSelection(previousStart);
      this.updateCount(false);
      return;
    }

    result = collectMatches(this.adapter.getValue(), query, {
      caseSensitive: this.caseSensitive,
      regex: this.regex,
      wholeWord: this.wholeWord,
    });

    if (result.error) {
      this.adapter.collapseSelection(previousStart);
      this.updateCount(true);
      return;
    }

    this.matches = result.matches;
    this.capped = result.capped;

    if (this.matches.length) {
      this.selectIndex(this.firstMatchAtOrAfter(previousStart), true);
    } else {
      this.adapter.collapseSelection(previousStart);
      this.updateCount(false);
    }
  };

  SearchController.prototype.firstMatchAtOrAfter = function (cursorIndex) {
    for (var i = 0; i < this.matches.length; i += 1) {
      if (this.matches[i].start >= cursorIndex) {
        return i;
      }
    }
    return 0;
  };

  SearchController.prototype.selectIndex = function (index, keepInputFocused) {
    var match;
    if (!this.matches.length) {
      this.updateCount(false);
      return;
    }
    this.selected = normalizeIndex(index, this.matches.length);
    match = this.matches[this.selected];
    this.adapter.highlight(this.matches, this.selected);
    this.adapter.selectRange(match.start, match.end);
    this.updateCount(false);
    if (keepInputFocused) {
      this.input.focus();
    }
  };

  SearchController.prototype.navigate = function (reverse) {
    if (!this.matches.length && this.input.value) {
      this.refresh();
    }
    if (!this.matches.length) {
      this.input.focus();
      return;
    }
    this.selectIndex(this.selected + (reverse ? -1 : 1), true);
  };

  SearchController.prototype.updateCount = function (invalid) {
    var total = this.matches.length;
    var hasQuery = Boolean(this.input && this.input.value);
    if (invalid) {
      this.count.textContent = "Invalid";
    } else if (!hasQuery) {
      this.count.textContent = "0 of 0";
    } else if (!total) {
      this.count.textContent = "No results";
    } else {
      this.count.textContent = this.selected + 1 + " of " + total + (this.capped ? "+" : "");
    }
    this.previousButton.disabled = !total;
    this.nextButton.disabled = !total;
  };

  SearchController.prototype.placeFixedPanel = function () {
    if (!this.panel || !this.adapter.getAnchorRect) {
      return;
    }
    var rect = this.adapter.getAnchorRect();
    var panelWidth = this.panel.offsetWidth || 360;
    var left = Math.max(
      8,
      Math.min(rect.right - panelWidth - DEFAULT_CONTROL_RIGHT, window.innerWidth - panelWidth - 8)
    );
    var top = Math.max(8, rect.top + 8);
    this.panel.style.left = left + "px";
    this.panel.style.top = top + "px";
  };

  SearchController.prototype.close = function (restoreFocus) {
    var panel = this.panel;
    this.adapter.clearHighlights();
    this.adapter.onSearchClose();
    this.setHostOpen(false);
    this.panel = null;

    if (this.adapter.fixed) {
      window.removeEventListener("resize", this.boundPlaceFixedPanel);
      window.removeEventListener("scroll", this.boundPlaceFixedPanel, true);
    }

    if (panel) {
      removePanel(panel);
    }

    if (activeController === this) {
      activeController = null;
    }

    if (restoreFocus) {
      this.adapter.focus();
    }
  };

  SearchController.prototype.isSameEditor = function (adapter) {
    return this.adapter.isSameEditor(adapter);
  };

  function openSearch(adapter) {
    if (!adapter) {
      return false;
    }

    if (activeController && activeController.isSameEditor(adapter)) {
      activeController.open();
      return true;
    }

    if (activeController) {
      activeController.close(false);
    }

    activeController = new SearchController(adapter);
    activeController.open();
    return true;
  }

  function enhanceHost(host, adapterFactory) {
    var trigger;
    if (!host || host.getAttribute(ENHANCED_ATTRIBUTE) === "true") {
      updateHostLayout(host);
      return;
    }
    host.setAttribute(ENHANCED_ATTRIBUTE, "true");
    host.classList.add("jenkins-editor-search-host");
    updateHostLayout(host);
    bindHostLayoutUpdates(host);

    trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "jenkins-editor-search-trigger";
    trigger.title = "Find in editor";
    trigger.setAttribute("aria-label", "Find in editor");
    trigger.appendChild(createIcon());
    trigger.addEventListener("click", function (event) {
      stopEvent(event);
      openSearch(adapterFactory());
    });
    host.appendChild(trigger);
    updateHostLayout(host);
  }

  function discoverEditors() {
    var codeMirrors = document.querySelectorAll(".CodeMirror");
    var aceEditors = document.querySelectorAll(".ace_editor");
    var readonlyHosts = [];

    Array.prototype.forEach.call(codeMirrors, function (element) {
      if (element.CodeMirror && isVisible(element)) {
        enhanceHost(element, function () {
          return adapterFromCodeMirrorElement(element);
        });
      }
    });

    Array.prototype.forEach.call(aceEditors, function (element) {
      if (isVisible(element)) {
        enhanceHost(element, function () {
          return adapterFromAceElement(element);
        });
      }
    });

    Array.prototype.forEach.call(
      document.querySelectorAll(
        "pre > code[class*='language-'], pre > code.line-numbers, pre > code.match-braces, pre > code.highlight, pre[class*='language-'] > code, pre.line-numbers > code"
      ),
      function (element) {
        var host = readonlyHostFromElement(element);
        if (host && readonlyHosts.indexOf(host) === -1) {
          readonlyHosts.push(host);
        }
      }
    );

    readonlyHosts.forEach(function (host) {
      if (!host.hasAttribute("tabindex")) {
        host.setAttribute("tabindex", "0");
      }
      host.classList.add("jenkins-editor-search-host--readonly");
      enhanceHost(host, function () {
        return new ReadonlyCodeAdapter(host);
      });
    });
  }

  function scheduleDiscover() {
    if (discoverQueued) {
      return;
    }
    discoverQueued = true;
    window.setTimeout(function () {
      discoverQueued = false;
      patchCodeMirrorCommands();
      discoverEditors();
    }, 80);
  }

  function controllerForCodeMirror(codeMirror) {
    var adapter = new CodeMirrorAdapter(codeMirror);
    if (!activeController || !activeController.isSameEditor(adapter)) {
      openSearch(adapter);
    }
    return activeController;
  }

  function patchCodeMirrorCommands() {
    var commands;
    if (!window.CodeMirror || window.CodeMirror.__jenkinsEditorSearchPatched) {
      return;
    }

    commands = window.CodeMirror.commands || {};
    commands.find = function (codeMirror) {
      openSearch(new CodeMirrorAdapter(codeMirror));
    };
    commands.findNext = function (codeMirror) {
      controllerForCodeMirror(codeMirror).navigate(false);
    };
    commands.findPrev = function (codeMirror) {
      controllerForCodeMirror(codeMirror).navigate(true);
    };
    commands.clearSearch = function (codeMirror) {
      var adapter = new CodeMirrorAdapter(codeMirror);
      if (activeController && activeController.isSameEditor(adapter)) {
        activeController.close(true);
      }
    };
    window.CodeMirror.commands = commands;
    window.CodeMirror.__jenkinsEditorSearchPatched = true;
  }

  function bindGlobalShortcuts() {
    document.addEventListener(
      "keydown",
      function (event) {
        var adapter;
        if (isFindShortcut(event)) {
          adapter = adapterFromNode(event.target);
          if (adapter) {
            stopEvent(event);
            openSearch(adapter);
          }
        } else if (isFindNextShortcut(event) && activeController) {
          stopEvent(event);
          activeController.navigate(event.shiftKey);
        }
      },
      true
    );
  }

  function startObserver() {
    if (!window.MutationObserver || !document.body) {
      return;
    }
    new MutationObserver(scheduleDiscover).observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden"],
      childList: true,
      subtree: true,
    });
  }

  onReady(function () {
    patchCodeMirrorCommands();
    discoverEditors();
    bindGlobalShortcuts();
    startObserver();
    window.setTimeout(scheduleDiscover, 500);
    window.setTimeout(scheduleDiscover, 1800);
  });

  window.JenkinsEditorSearch = {
    discover: scheduleDiscover,
    openForElement: function (element) {
      return openSearch(adapterFromNode(element));
    },
  };
})();
