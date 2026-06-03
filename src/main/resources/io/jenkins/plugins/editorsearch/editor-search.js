(() => {
  // src-js/AceAdapter.mjs
  function AceAdapter(editor, host) {
    this.type = "ace", this.editor = editor, this.host = host || editor.container, this.markerIds = [], this.Range = getAceRange(), this.highlightSelectedWordCaptured = !1, this.previousHighlightSelectedWord = null;
  }
  AceAdapter.prototype.getHost = function() {
    return this.host;
  };
  AceAdapter.prototype.getValue = function() {
    return this.editor.getValue();
  };
  AceAdapter.prototype.getCursorIndex = function() {
    return getAceDocument(this.editor).positionToIndex(this.editor.getCursorPosition(), 0);
  };
  AceAdapter.prototype.getSelectedText = function() {
    return this.editor.getSelectedText ? this.editor.getSelectedText() : "";
  };
  AceAdapter.prototype.focus = function() {
    this.editor.focus();
  };
  AceAdapter.prototype.onSearchOpen = function() {
    this.editor.getOption && this.editor.setOption && !this.highlightSelectedWordCaptured && (this.previousHighlightSelectedWord = this.editor.getOption("highlightSelectedWord"), this.highlightSelectedWordCaptured = !0, this.editor.setOption("highlightSelectedWord", !1)), this.clearSelectedWordMarkers();
  };
  AceAdapter.prototype.onSearchClose = function() {
    this.clearSelectedWordMarkers(), this.editor.setOption && this.highlightSelectedWordCaptured && this.editor.setOption("highlightSelectedWord", this.previousHighlightSelectedWord), this.highlightSelectedWordCaptured = !1;
  };
  AceAdapter.prototype.clearExternalSearchState = function() {
    this.editor.$search && this.editor.$search.set({ needle: "" }), this.clearSelectedWordMarkers();
  };
  AceAdapter.prototype.flushMarkerLayer = function() {
    var renderer = this.editor.renderer;
    renderer && (renderer.updateBackMarkers ? renderer.updateBackMarkers() : renderer.updateFull && renderer.updateFull());
  };
  AceAdapter.prototype.clearSelectedWordMarkers = function() {
    var markers = this.editor.session.getMarkers(!1), session = this.editor.session;
    Object.keys(markers).forEach(function(id) {
      markers[id].clazz && markers[id].clazz.indexOf("ace_selected-word") !== -1 && session.removeMarker(Number(id));
    }), this.flushMarkerLayer();
  };
  AceAdapter.prototype.collapseSelection = function(index) {
    var position = this.toPosition(Math.max(0, index || 0));
    this.editor.selection.moveToPosition(position), this.editor.clearSelection();
  };
  AceAdapter.prototype.toPosition = function(index) {
    return getAceDocument(this.editor).indexToPosition(index, 0);
  };
  AceAdapter.prototype.toRange = function(start, end) {
    var from = this.toPosition(start), to = this.toPosition(end);
    return new this.Range(from.row, from.column, to.row, to.column);
  };
  AceAdapter.prototype.selectRange = function(start, end) {
    if (this.Range) {
      var from = this.toPosition(start);
      this.editor.selection.moveToPosition(from), this.editor.clearSelection(), this.editor.scrollToLine(from.row, !0, !0, function() {
      }), this.editor.focus();
    }
  };
  AceAdapter.prototype.clearHighlights = function() {
    for (var session = this.editor.session; this.markerIds.length; )
      session.removeMarker(this.markerIds.pop());
    this.flushMarkerLayer();
  };
  AceAdapter.prototype.highlight = function(matches, selected) {
    var self = this, session = this.editor.session;
    this.Range && (this.clearHighlights(), matches.forEach(function(match, index) {
      var className = index === selected ? "jenkins-editor-search-match jenkins-editor-search-match-current" : "jenkins-editor-search-match";
      self.markerIds.push(session.addMarker(self.toRange(match.start, match.end), className, "text", !1));
    }), this.flushMarkerLayer());
  };
  AceAdapter.prototype.isSameEditor = function(adapter) {
    return adapter && adapter.type === this.type && adapter.editor === this.editor;
  };

  // src-js/CodeMirrorAdapter.mjs
  function CodeMirrorAdapter(codeMirror) {
    this.type = "codemirror", this.editor = codeMirror, this.host = codeMirror.getWrapperElement(), this.marks = [];
  }
  CodeMirrorAdapter.prototype.getHost = function() {
    return this.host;
  };
  CodeMirrorAdapter.prototype.getValue = function() {
    return this.editor.getValue();
  };
  CodeMirrorAdapter.prototype.getCursorIndex = function() {
    return this.editor.indexFromPos(this.editor.getCursor());
  };
  CodeMirrorAdapter.prototype.getSelectedText = function() {
    return this.editor.getSelection ? this.editor.getSelection() : "";
  };
  CodeMirrorAdapter.prototype.focus = function() {
    this.editor.focus();
  };
  CodeMirrorAdapter.prototype.onSearchOpen = function() {
  };
  CodeMirrorAdapter.prototype.onSearchClose = function() {
  };
  CodeMirrorAdapter.prototype.clearExternalSearchState = function() {
    var codeMirror = this.editor, state = codeMirror.state && codeMirror.state.search;
    state && codeMirror.operation(function() {
      if (state.overlay) {
        try {
          codeMirror.removeOverlay(state.overlay);
        } catch {
        }
        state.overlay = null;
      }
      state.annotate && (state.annotate.clear(), state.annotate = null), state.query = null, state.lastQuery = null, state.posFrom = null, state.posTo = null;
    });
  };
  CodeMirrorAdapter.prototype.collapseSelection = function(index) {
    this.editor.setCursor(this.editor.posFromIndex(Math.max(0, index || 0)));
  };
  CodeMirrorAdapter.prototype.selectRange = function(start, end) {
    var from = this.editor.posFromIndex(start);
    this.editor.setCursor(from), this.editor.scrollIntoView(from, 80), this.editor.focus();
  };
  CodeMirrorAdapter.prototype.clearHighlights = function() {
    for (; this.marks.length; )
      this.marks.pop().clear();
  };
  CodeMirrorAdapter.prototype.highlight = function(matches, selected) {
    var self = this;
    this.clearHighlights(), this.editor.operation(function() {
      matches.forEach(function(match, index) {
        var className = index === selected ? "jenkins-editor-search-match jenkins-editor-search-match-current" : "jenkins-editor-search-match";
        self.marks.push(
          self.markText(self.editor.posFromIndex(match.start), self.editor.posFromIndex(match.end), className)
        );
      });
    });
  };
  CodeMirrorAdapter.prototype.markText = function(from, to, className) {
    var version = window.CodeMirror && window.CodeMirror.version;
    return !this.editor.getDoc || this.editor.markText.length >= 4 || version && version.indexOf("2.") === 0 ? this.editor.markText(from, to, className) : this.editor.markText(from, to, {
      className
    });
  };
  CodeMirrorAdapter.prototype.isSameEditor = function(adapter) {
    return adapter && adapter.type === this.type && adapter.editor === this.editor;
  };

  // src-js/ReadonlyCodeAdapter.mjs
  function ReadonlyCodeAdapter(host) {
    this.type = "readonly", this.host = host, this.overlay = null, this.index = [], this.value = "";
  }
  ReadonlyCodeAdapter.prototype.getHost = function() {
    return this.host;
  };
  ReadonlyCodeAdapter.prototype.getCodeElements = function() {
    return Array.prototype.filter.call(this.host.querySelectorAll("code"), function(element) {
      return isPrismCodeElement(element);
    });
  };
  ReadonlyCodeAdapter.prototype.rebuildIndex = function() {
    var self = this, offset = 0;
    this.index = [], this.getCodeElements().forEach(function(code) {
      for (var walker = document.createTreeWalker(
        code,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node2) {
            var parent = node2.parentElement;
            return !parent || parent.closest(".jenkins-editor-search") || parent.closest(".jenkins-editor-search-trigger") || parent.closest(".line-numbers-rows") || parent.closest("[aria-hidden='true']") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
          }
        },
        !1
      ), node = walker.nextNode(); node; )
        self.index.push({
          node,
          start: offset,
          end: offset + node.nodeValue.length
        }), offset += node.nodeValue.length, node = walker.nextNode();
    }), this.value = this.index.map(function(entry) {
      return entry.node.nodeValue;
    }).join("");
  };
  ReadonlyCodeAdapter.prototype.getValue = function() {
    return this.rebuildIndex(), this.value;
  };
  ReadonlyCodeAdapter.prototype.getCursorIndex = function() {
    return 0;
  };
  ReadonlyCodeAdapter.prototype.getSelectedText = function() {
    var selection = window.getSelection ? window.getSelection() : null, text;
    return !selection || selection.rangeCount === 0 || !this.host.contains(selection.getRangeAt(0).commonAncestorContainer) ? "" : (text = selection.toString(), text && text.indexOf(`
`) === -1 && text.length <= 200 ? text : "");
  };
  ReadonlyCodeAdapter.prototype.focus = function() {
    this.host.focus();
  };
  ReadonlyCodeAdapter.prototype.onSearchOpen = function() {
    this.host.classList.add("jenkins-editor-search-host--readonly-active");
  };
  ReadonlyCodeAdapter.prototype.onSearchClose = function() {
    this.host.classList.remove("jenkins-editor-search-host--readonly-active"), this.clearHighlights();
  };
  ReadonlyCodeAdapter.prototype.clearExternalSearchState = function() {
  };
  ReadonlyCodeAdapter.prototype.collapseSelection = function() {
    var selection = window.getSelection ? window.getSelection() : null;
    selection && this.host.contains(selection.anchorNode) && selection.removeAllRanges();
  };
  ReadonlyCodeAdapter.prototype.ensureOverlay = function() {
    return this.overlay || (this.overlay = document.createElement("span"), this.overlay.className = "jenkins-editor-search-readonly-overlay", this.overlay.setAttribute("aria-hidden", "true"), this.host.insertBefore(this.overlay, this.host.firstChild)), this.overlay.style.width = Math.max(this.host.scrollWidth, this.host.clientWidth) + "px", this.overlay.style.height = Math.max(this.host.scrollHeight, this.host.clientHeight) + "px", this.overlay;
  };
  ReadonlyCodeAdapter.prototype.clearHighlights = function() {
    this.overlay && (this.overlay.textContent = "");
  };
  ReadonlyCodeAdapter.prototype.positionForIndex = function(index) {
    var entry, i;
    if (!this.index.length)
      return null;
    for (i = 0; i < this.index.length; i += 1)
      if (entry = this.index[i], index <= entry.end)
        return {
          node: entry.node,
          offset: clamp(index - entry.start, 0, entry.node.nodeValue.length)
        };
    return entry = this.index[this.index.length - 1], {
      node: entry.node,
      offset: entry.node.nodeValue.length
    };
  };
  ReadonlyCodeAdapter.prototype.rangeForMatch = function(match) {
    var start = this.positionForIndex(match.start), end = this.positionForIndex(match.end), range;
    return !start || !end ? null : (range = document.createRange(), range.setStart(start.node, start.offset), range.setEnd(end.node, end.offset), range);
  };
  ReadonlyCodeAdapter.prototype.highlight = function(matches, selected) {
    var self = this, overlay = this.ensureOverlay(), hostRect = this.host.getBoundingClientRect(), hostScrollLeft = this.host.scrollLeft, hostScrollTop = this.host.scrollTop;
    this.clearHighlights(), matches.forEach(function(match, index) {
      var range = self.rangeForMatch(match);
      range && (Array.prototype.forEach.call(range.getClientRects(), function(rect) {
        var marker;
        rect.width <= 0 || rect.height <= 0 || (marker = document.createElement("span"), marker.className = index === selected ? "jenkins-editor-search-readonly-match jenkins-editor-search-match-current" : "jenkins-editor-search-readonly-match jenkins-editor-search-match", marker.style.left = rect.left - hostRect.left + hostScrollLeft + "px", marker.style.top = rect.top - hostRect.top + hostScrollTop + "px", marker.style.width = rect.width + "px", marker.style.height = rect.height + "px", overlay.appendChild(marker));
      }), range.detach());
    });
  };
  ReadonlyCodeAdapter.prototype.selectRange = function(start, end) {
    var range = this.rangeForMatch({ start, end }), rect, hostRect;
    range && (rect = range.getBoundingClientRect(), hostRect = this.host.getBoundingClientRect(), (rect.top < hostRect.top || rect.bottom > hostRect.bottom) && (this.host.scrollTop += rect.top - hostRect.top - this.host.clientHeight / 2 + rect.height / 2), (rect.left < hostRect.left || rect.right > hostRect.right) && (this.host.scrollLeft += rect.left - hostRect.left - 40), (rect.top < 0 || rect.bottom > window.innerHeight) && this.host.scrollIntoView({ block: "center", inline: "nearest" }), range.detach());
  };
  ReadonlyCodeAdapter.prototype.isSameEditor = function(adapter) {
    return adapter && adapter.type === this.type && adapter.host === this.host;
  };

  // src-js/TextareaAdapter.mjs
  function TextareaAdapter(textarea) {
    this.type = "textarea", this.editor = textarea, this.host = document.body, this.fixed = !0;
  }
  TextareaAdapter.prototype.getHost = function() {
    return this.host;
  };
  TextareaAdapter.prototype.getValue = function() {
    return this.editor.value;
  };
  TextareaAdapter.prototype.getCursorIndex = function() {
    return this.editor.selectionStart || 0;
  };
  TextareaAdapter.prototype.getSelectedText = function() {
    return this.editor.value.substring(this.editor.selectionStart || 0, this.editor.selectionEnd || 0);
  };
  TextareaAdapter.prototype.focus = function() {
    this.editor.focus();
  };
  TextareaAdapter.prototype.selectRange = function(start, end) {
    this.editor.focus(), this.editor.setSelectionRange(start, end);
  };
  TextareaAdapter.prototype.clearHighlights = function() {
  };
  TextareaAdapter.prototype.highlight = function() {
  };
  TextareaAdapter.prototype.onSearchOpen = function() {
  };
  TextareaAdapter.prototype.onSearchClose = function() {
  };
  TextareaAdapter.prototype.clearExternalSearchState = function() {
  };
  TextareaAdapter.prototype.collapseSelection = function(index) {
    this.editor.setSelectionRange(index, index);
  };
  TextareaAdapter.prototype.isSameEditor = function(adapter) {
    return adapter && adapter.type === this.type && adapter.editor === this.editor;
  };
  TextareaAdapter.prototype.getAnchorRect = function() {
    return this.editor.getBoundingClientRect();
  };

  // src-js/main.mjs
  (function() {
    "use strict";
    var ENHANCED_ATTRIBUTE = "data-editor-search-enhanced", OPEN_ATTRIBUTE = "data-editor-search-open", MATCH_LIMIT = 1e4, DEFAULT_CONTROL_TOP = 8, DEFAULT_CONTROL_RIGHT = 10, CONTROL_GAP = 8, SCROLLBAR_GAP = 6, activeController = null, discoverQueued = !1;
    function onReady(callback) {
      document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", callback, { once: !0 }) : callback();
    }
    function stopEvent(event) {
      event.preventDefault(), event.stopPropagation(), event.stopImmediatePropagation && event.stopImmediatePropagation();
    }
    function escapeRegExp(value) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    function isVisible(element) {
      if (!element || !element.getBoundingClientRect)
        return !1;
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
      return length ? (index % length + length) % length : -1;
    }
    function collectMatches(value, query, options) {
      var source = options.regex ? query : escapeRegExp(query), flags = options.caseSensitive ? "g" : "gi", regex, matches = [], capped = !1, match;
      options.wholeWord && (source = "\\b(?:" + source + ")\\b");
      try {
        regex = new RegExp(source, flags);
      } catch (error) {
        return {
          error,
          matches,
          capped: !1
        };
      }
      for (; (match = regex.exec(value)) !== null; ) {
        if (!match[0]) {
          if (regex.lastIndex >= value.length)
            break;
          regex.lastIndex += 1;
          continue;
        }
        if (matches.push({
          start: match.index,
          end: match.index + match[0].length
        }), matches.length >= MATCH_LIMIT) {
          capped = !0;
          break;
        }
      }
      return {
        error: null,
        matches,
        capped
      };
    }
    function createIcon() {
      var icon = document.createElement("span");
      return icon.className = "jenkins-editor-search-icon", icon.setAttribute("aria-hidden", "true"), icon;
    }
    function reveal(element) {
      var show = function() {
        element.classList.add("jenkins-editor-search--visible");
      };
      window.requestAnimationFrame ? window.requestAnimationFrame(show) : show();
    }
    function clamp2(value, min, max) {
      return Math.max(min, Math.min(value, max));
    }
    function updateHostLayout(host) {
      var hasSampleControl = !1, hostRect, maxTop, nextTop, nextRight, parent = host && host.parentElement, right = DEFAULT_CONTROL_RIGHT, sampleScope, top = DEFAULT_CONTROL_TOP;
      !host || !host.style || !parent || !host.getBoundingClientRect || (hostRect = host.getBoundingClientRect(), Array.prototype.forEach.call(
        host.querySelectorAll(".ace_scrollbar-v, .CodeMirror-vscrollbar"),
        function(candidate) {
          var rect;
          isVisible(candidate) && (rect = candidate.getBoundingClientRect(), rect.right > hostRect.right - 12 && rect.left < hostRect.right && rect.bottom > hostRect.top && rect.top < hostRect.bottom && (right = Math.max(right, Math.ceil(hostRect.right - rect.left + SCROLLBAR_GAP))));
        }
      ), maxTop = Math.max(DEFAULT_CONTROL_TOP, Math.min(96, hostRect.height - 40)), sampleScope = host.closest && host.closest(".workflow-editor-wrapper, .setting-main, .jenkins-form-item") || parent, Array.prototype.forEach.call(sampleScope.querySelectorAll(".samples, select"), function(candidate) {
        var rect;
        host.contains(candidate) || !isVisible(candidate) || (rect = candidate.getBoundingClientRect(), rect.bottom > hostRect.top && rect.top < hostRect.top + 96 && rect.right > hostRect.left && rect.left < hostRect.right && rect.right > hostRect.left + hostRect.width * 0.5 && (hasSampleControl = !0, top = Math.max(top, Math.ceil(rect.bottom - hostRect.top + CONTROL_GAP))));
      }), hasSampleControl ? host.setAttribute("data-editor-search-sample-control", "true") : host.removeAttribute("data-editor-search-sample-control"), nextTop = clamp2(top, DEFAULT_CONTROL_TOP, maxTop) + "px", host.style.getPropertyValue("--editor-search-control-top") !== nextTop && host.style.setProperty("--editor-search-control-top", nextTop), nextRight = right + "px", host.style.getPropertyValue("--editor-search-control-right") !== nextRight && host.style.setProperty("--editor-search-control-right", nextRight));
    }
    function refreshHostLayoutSoon(host) {
      updateHostLayout(host), window.setTimeout(function() {
        updateHostLayout(host);
      }, 120);
    }
    function bindHostLayoutUpdates(host) {
      var parent = host && host.parentElement, refresh = function() {
        refreshHostLayoutSoon(host);
      }, aceEditor = host && host.env && host.env.editor;
      host.addEventListener("mouseenter", refresh), host.addEventListener("focusin", refresh), host.CodeMirror && host.CodeMirror.on && host.CodeMirror.on("change", refresh), aceEditor && aceEditor.on && aceEditor.on("change", refresh), parent && window.MutationObserver && new MutationObserver(refresh).observe(parent, {
        attributes: !0,
        attributeFilter: ["class", "hidden", "style"],
        childList: !0,
        subtree: !0
      });
    }
    function removePanel(panel) {
      var removed = !1, remove = function() {
        removed || (removed = !0, panel.parentNode && panel.parentNode.removeChild(panel));
      }, onTransitionEnd = function(event) {
        event.target === panel && (panel.removeEventListener("transitionend", onTransitionEnd), remove());
      };
      panel.classList.remove("jenkins-editor-search--visible"), panel.addEventListener("transitionend", onTransitionEnd), window.setTimeout(remove, 260);
    }
    function getAceRange2() {
      if (!window.ace || !window.ace.require)
        return null;
      try {
        return window.ace.require("ace/range").Range;
      } catch {
        return null;
      }
    }
    function getAceDocument2(editor) {
      return editor.session.getDocument ? editor.session.getDocument() : editor.session.doc;
    }
    function isPrismCodeElement2(element) {
      var classes;
      return !element || element.tagName !== "CODE" ? !1 : (classes = " " + element.className + " " + (element.parentElement ? element.parentElement.className : "") + " ", classes.indexOf(" language-") !== -1 || classes.indexOf(" line-numbers ") !== -1 || classes.indexOf(" match-braces ") !== -1 || classes.indexOf(" highlight ") !== -1);
    }
    function readonlyHostFromElement(element) {
      var host;
      return !element || !element.closest || (host = element.closest("pre"), !host || !isVisible(host) || host.closest(".CodeMirror, .ace_editor, .jenkins-editor-search") || !Array.prototype.some.call(host.querySelectorAll("code"), isPrismCodeElement2)) ? null : host;
    }
    function adapterFromCodeMirrorElement(element) {
      var codeMirror = element && element.CodeMirror;
      return codeMirror ? new CodeMirrorAdapter(codeMirror) : null;
    }
    function adapterFromAceElement(element) {
      var editor = element && element.env && element.env.editor;
      if (!editor && window.ace && window.ace.edit)
        try {
          editor = window.ace.edit(element);
        } catch {
          editor = null;
        }
      return editor ? new AceAdapter(editor, element) : null;
    }
    function adapterFromNode(node) {
      var element = node && node.nodeType === Node.ELEMENT_NODE ? node : node && node.parentElement, codeMirrorElement = element && element.closest ? element.closest(".CodeMirror") : null, aceElement = element && element.closest ? element.closest(".ace_editor") : null, readonlyHost = element && element.closest ? readonlyHostFromElement(element) : null;
      if (codeMirrorElement)
        return adapterFromCodeMirrorElement(codeMirrorElement);
      if (aceElement)
        return adapterFromAceElement(aceElement);
      if (readonlyHost)
        return new ReadonlyCodeAdapter(readonlyHost);
      for (; element && element !== document.documentElement; ) {
        if (element.classList && element.classList.contains("CodeMirror"))
          return adapterFromCodeMirrorElement(element);
        if (element.classList && element.classList.contains("ace_editor"))
          return adapterFromAceElement(element);
        if (readonlyHost = readonlyHostFromElement(element), readonlyHost)
          return new ReadonlyCodeAdapter(readonlyHost);
        if (element.tagName === "TEXTAREA" && isVisible(element))
          return new TextareaAdapter(element);
        element = element.parentElement;
      }
      return null;
    }
    function SearchController(adapter) {
      this.adapter = adapter, this.caseSensitive = !1, this.regex = !1, this.wholeWord = !1, this.matches = [], this.selected = -1, this.capped = !1, this.originIndex = adapter.getCursorIndex(), this.panel = null, this.input = null, this.count = null, this.previousButton = null, this.nextButton = null, this.boundPlaceFixedPanel = this.placeFixedPanel.bind(this);
    }
    SearchController.prototype.open = function() {
      if (this.panel) {
        this.input.focus(), this.input.select();
        return;
      }
      updateHostLayout(this.adapter.getHost()), this.setHostOpen(!0), this.adapter.onSearchOpen(), this.adapter.clearExternalSearchState(), this.panel = this.createPanel(), this.adapter.getHost().appendChild(this.panel), this.adapter.fixed && (this.panel.classList.add("jenkins-editor-search--fixed"), this.placeFixedPanel(), window.addEventListener("resize", this.boundPlaceFixedPanel), window.addEventListener("scroll", this.boundPlaceFixedPanel, !0)), reveal(this.panel), this.seedInput(), this.input.focus(), this.input.select(), this.refresh();
    }, SearchController.prototype.setHostOpen = function(open) {
      var host = this.adapter.getHost();
      !host || !host.setAttribute || (open ? host.setAttribute(OPEN_ATTRIBUTE, "true") : host.removeAttribute(OPEN_ATTRIBUTE));
    }, SearchController.prototype.createPanel = function() {
      var panel = document.createElement("div");
      return panel.className = "jenkins-editor-search", panel.setAttribute("role", "search"), panel.innerHTML = '<div class="jenkins-editor-search__field"><input class="jenkins-editor-search__input" type="text" autocomplete="off" spellcheck="false" placeholder="Find" aria-label="Find in editor"></div><div class="jenkins-editor-search__actions"><button type="button" class="jenkins-editor-search__button jenkins-editor-search__button--case" title="Match case" aria-label="Match case" aria-pressed="false">Aa</button><button type="button" class="jenkins-editor-search__button jenkins-editor-search__button--word" title="Match whole word" aria-label="Match whole word" aria-pressed="false">ab</button><button type="button" class="jenkins-editor-search__button jenkins-editor-search__button--regex" title="Use regular expression" aria-label="Use regular expression" aria-pressed="false">.*</button><span class="jenkins-editor-search__count" aria-live="polite">0 of 0</span><button type="button" class="jenkins-editor-search__button jenkins-editor-search__button--previous" title="Previous match" aria-label="Previous match"></button><button type="button" class="jenkins-editor-search__button jenkins-editor-search__button--next" title="Next match" aria-label="Next match"></button><button type="button" class="jenkins-editor-search__button jenkins-editor-search__button--close" title="Close" aria-label="Close"></button></div>', this.input = panel.querySelector(".jenkins-editor-search__input"), this.count = panel.querySelector(".jenkins-editor-search__count"), this.previousButton = panel.querySelector(".jenkins-editor-search__button--previous"), this.nextButton = panel.querySelector(".jenkins-editor-search__button--next"), this.bindPanel(panel), panel;
    }, SearchController.prototype.bindPanel = function(panel) {
      var self = this, caseButton = panel.querySelector(".jenkins-editor-search__button--case"), wordButton = panel.querySelector(".jenkins-editor-search__button--word"), regexButton = panel.querySelector(".jenkins-editor-search__button--regex"), closeButton = panel.querySelector(".jenkins-editor-search__button--close");
      panel.addEventListener("mousedown", function(event) {
        event.stopPropagation();
      }), this.input.addEventListener("input", function() {
        self.refresh();
      }), panel.addEventListener("keydown", function(event) {
        event.key === "Enter" ? (stopEvent(event), self.navigate(event.shiftKey)) : event.key === "Escape" ? (stopEvent(event), self.close(!0)) : isFindShortcut(event) && (stopEvent(event), self.input.focus(), self.input.select());
      }), caseButton.addEventListener("click", function(event) {
        stopEvent(event), self.caseSensitive = !self.caseSensitive, caseButton.setAttribute("aria-pressed", self.caseSensitive ? "true" : "false"), self.refresh(), self.input.focus();
      }), wordButton.addEventListener("click", function(event) {
        stopEvent(event), self.wholeWord = !self.wholeWord, wordButton.setAttribute("aria-pressed", self.wholeWord ? "true" : "false"), self.refresh(), self.input.focus();
      }), regexButton.addEventListener("click", function(event) {
        stopEvent(event), self.regex = !self.regex, regexButton.setAttribute("aria-pressed", self.regex ? "true" : "false"), self.refresh(), self.input.focus();
      }), this.previousButton.addEventListener("click", function(event) {
        stopEvent(event), self.navigate(!0);
      }), this.nextButton.addEventListener("click", function(event) {
        stopEvent(event), self.navigate(!1);
      }), closeButton.addEventListener("click", function(event) {
        stopEvent(event), self.close(!0);
      });
    }, SearchController.prototype.seedInput = function() {
      var selected = this.adapter.getSelectedText();
      selected && selected.indexOf(`
`) === -1 && selected.length <= 200 && (this.input.value = selected);
    }, SearchController.prototype.refresh = function() {
      var query = this.input.value, previousStart = this.selected >= 0 && this.matches[this.selected] ? this.matches[this.selected].start : this.originIndex, result;
      if (this.adapter.clearHighlights(), this.adapter.clearExternalSearchState(), this.matches = [], this.selected = -1, this.capped = !1, !query) {
        this.adapter.collapseSelection(previousStart), this.updateCount(!1);
        return;
      }
      if (result = collectMatches(this.adapter.getValue(), query, {
        caseSensitive: this.caseSensitive,
        regex: this.regex,
        wholeWord: this.wholeWord
      }), result.error) {
        this.adapter.collapseSelection(previousStart), this.updateCount(!0);
        return;
      }
      this.matches = result.matches, this.capped = result.capped, this.matches.length ? this.selectIndex(this.firstMatchAtOrAfter(previousStart), !0) : (this.adapter.collapseSelection(previousStart), this.updateCount(!1));
    }, SearchController.prototype.firstMatchAtOrAfter = function(cursorIndex) {
      for (var i = 0; i < this.matches.length; i += 1)
        if (this.matches[i].start >= cursorIndex)
          return i;
      return 0;
    }, SearchController.prototype.selectIndex = function(index, keepInputFocused) {
      var match;
      if (!this.matches.length) {
        this.updateCount(!1);
        return;
      }
      this.selected = normalizeIndex(index, this.matches.length), match = this.matches[this.selected], this.adapter.highlight(this.matches, this.selected), this.adapter.selectRange(match.start, match.end), this.updateCount(!1), keepInputFocused && this.input.focus();
    }, SearchController.prototype.navigate = function(reverse) {
      if (!this.matches.length && this.input.value && this.refresh(), !this.matches.length) {
        this.input.focus();
        return;
      }
      this.selectIndex(this.selected + (reverse ? -1 : 1), !0);
    }, SearchController.prototype.updateCount = function(invalid) {
      var total = this.matches.length, hasQuery = !!(this.input && this.input.value);
      invalid ? this.count.textContent = "Invalid" : hasQuery ? total ? this.count.textContent = this.selected + 1 + " of " + total + (this.capped ? "+" : "") : this.count.textContent = "No results" : this.count.textContent = "0 of 0", this.previousButton.disabled = !total, this.nextButton.disabled = !total;
    }, SearchController.prototype.placeFixedPanel = function() {
      if (!(!this.panel || !this.adapter.getAnchorRect)) {
        var rect = this.adapter.getAnchorRect(), panelWidth = this.panel.offsetWidth || 360, left = Math.max(
          8,
          Math.min(rect.right - panelWidth - DEFAULT_CONTROL_RIGHT, window.innerWidth - panelWidth - 8)
        ), top = Math.max(8, rect.top + 8);
        this.panel.style.left = left + "px", this.panel.style.top = top + "px";
      }
    }, SearchController.prototype.close = function(restoreFocus) {
      var panel = this.panel;
      this.adapter.clearHighlights(), this.adapter.onSearchClose(), this.setHostOpen(!1), this.panel = null, this.adapter.fixed && (window.removeEventListener("resize", this.boundPlaceFixedPanel), window.removeEventListener("scroll", this.boundPlaceFixedPanel, !0)), panel && removePanel(panel), activeController === this && (activeController = null), restoreFocus && this.adapter.focus();
    }, SearchController.prototype.isSameEditor = function(adapter) {
      return this.adapter.isSameEditor(adapter);
    };
    function openSearch(adapter) {
      return adapter ? activeController && activeController.isSameEditor(adapter) ? (activeController.open(), !0) : (activeController && activeController.close(!1), activeController = new SearchController(adapter), activeController.open(), !0) : !1;
    }
    function enhanceHost(host, adapterFactory) {
      var trigger;
      if (!host || host.getAttribute(ENHANCED_ATTRIBUTE) === "true") {
        updateHostLayout(host);
        return;
      }
      host.setAttribute(ENHANCED_ATTRIBUTE, "true"), host.classList.add("jenkins-editor-search-host"), updateHostLayout(host), bindHostLayoutUpdates(host), trigger = document.createElement("button"), trigger.type = "button", trigger.className = "jenkins-editor-search-trigger", trigger.title = "Find in editor", trigger.setAttribute("aria-label", "Find in editor"), trigger.appendChild(createIcon()), trigger.addEventListener("click", function(event) {
        stopEvent(event), openSearch(adapterFactory());
      }), host.appendChild(trigger), updateHostLayout(host);
    }
    function discoverEditors() {
      var codeMirrors = document.querySelectorAll(".CodeMirror"), aceEditors = document.querySelectorAll(".ace_editor"), readonlyHosts = [];
      Array.prototype.forEach.call(codeMirrors, function(element) {
        element.CodeMirror && isVisible(element) && enhanceHost(element, function() {
          return adapterFromCodeMirrorElement(element);
        });
      }), Array.prototype.forEach.call(aceEditors, function(element) {
        isVisible(element) && enhanceHost(element, function() {
          return adapterFromAceElement(element);
        });
      }), Array.prototype.forEach.call(
        document.querySelectorAll(
          "pre > code[class*='language-'], pre > code.line-numbers, pre > code.match-braces, pre > code.highlight, pre[class*='language-'] > code, pre.line-numbers > code"
        ),
        function(element) {
          var host = readonlyHostFromElement(element);
          host && readonlyHosts.indexOf(host) === -1 && readonlyHosts.push(host);
        }
      ), readonlyHosts.forEach(function(host) {
        host.hasAttribute("tabindex") || host.setAttribute("tabindex", "0"), host.classList.add("jenkins-editor-search-host--readonly"), enhanceHost(host, function() {
          return new ReadonlyCodeAdapter(host);
        });
      });
    }
    function scheduleDiscover() {
      discoverQueued || (discoverQueued = !0, window.setTimeout(function() {
        discoverQueued = !1, patchCodeMirrorCommands(), discoverEditors();
      }, 80));
    }
    function controllerForCodeMirror(codeMirror) {
      var adapter = new CodeMirrorAdapter(codeMirror);
      return (!activeController || !activeController.isSameEditor(adapter)) && openSearch(adapter), activeController;
    }
    function patchCodeMirrorCommands() {
      var commands;
      !window.CodeMirror || window.CodeMirror.__jenkinsEditorSearchPatched || (commands = window.CodeMirror.commands || {}, commands.find = function(codeMirror) {
        openSearch(new CodeMirrorAdapter(codeMirror));
      }, commands.findNext = function(codeMirror) {
        controllerForCodeMirror(codeMirror).navigate(!1);
      }, commands.findPrev = function(codeMirror) {
        controllerForCodeMirror(codeMirror).navigate(!0);
      }, commands.clearSearch = function(codeMirror) {
        var adapter = new CodeMirrorAdapter(codeMirror);
        activeController && activeController.isSameEditor(adapter) && activeController.close(!0);
      }, window.CodeMirror.commands = commands, window.CodeMirror.__jenkinsEditorSearchPatched = !0);
    }
    function bindGlobalShortcuts() {
      document.addEventListener(
        "keydown",
        function(event) {
          var adapter;
          isFindShortcut(event) ? (adapter = adapterFromNode(event.target), adapter && (stopEvent(event), openSearch(adapter))) : isFindNextShortcut(event) && activeController && (stopEvent(event), activeController.navigate(event.shiftKey));
        },
        !0
      );
    }
    function startObserver() {
      !window.MutationObserver || !document.body || new MutationObserver(scheduleDiscover).observe(document.body, {
        attributes: !0,
        attributeFilter: ["class", "style", "hidden", "aria-hidden"],
        childList: !0,
        subtree: !0
      });
    }
    onReady(function() {
      patchCodeMirrorCommands(), discoverEditors(), bindGlobalShortcuts(), startObserver(), window.setTimeout(scheduleDiscover, 500), window.setTimeout(scheduleDiscover, 1800);
    }), window.JenkinsEditorSearch = {
      discover: scheduleDiscover,
      openForElement: function(element) {
        return openSearch(adapterFromNode(element));
      }
    };
  })();
})();
