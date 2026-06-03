  function CodeMirrorAdapter(codeMirror) {
    this.type = "codemirror";
    this.editor = codeMirror;
    this.host = codeMirror.getWrapperElement();
    this.marks = [];
  }

  CodeMirrorAdapter.prototype.getHost = function () {
    return this.host;
  };

  CodeMirrorAdapter.prototype.getValue = function () {
    return this.editor.getValue();
  };

  CodeMirrorAdapter.prototype.getCursorIndex = function () {
    return this.editor.indexFromPos(this.editor.getCursor());
  };

  CodeMirrorAdapter.prototype.getSelectedText = function () {
    return this.editor.getSelection ? this.editor.getSelection() : "";
  };

  CodeMirrorAdapter.prototype.focus = function () {
    this.editor.focus();
  };

  CodeMirrorAdapter.prototype.onSearchOpen = function () {};

  CodeMirrorAdapter.prototype.onSearchClose = function () {};

  CodeMirrorAdapter.prototype.clearExternalSearchState = function () {
    var codeMirror = this.editor;
    var state = codeMirror.state && codeMirror.state.search;

    if (!state) {
      return;
    }

    codeMirror.operation(function () {
      if (state.overlay) {
        try {
          codeMirror.removeOverlay(state.overlay);
        } catch {
          // Search add-on state differs across Jenkins baselines; stale overlays are harmless if already gone.
        }
        state.overlay = null;
      }
      if (state.annotate) {
        state.annotate.clear();
        state.annotate = null;
      }
      state.query = null;
      state.lastQuery = null;
      state.posFrom = null;
      state.posTo = null;
    });
  };

  CodeMirrorAdapter.prototype.collapseSelection = function (index) {
    this.editor.setCursor(this.editor.posFromIndex(Math.max(0, index || 0)));
  };

  CodeMirrorAdapter.prototype.selectRange = function (start, end) {
    var from = this.editor.posFromIndex(start);
    this.editor.setCursor(from);
    this.editor.scrollIntoView(from, 80);
    this.editor.focus();
  };

  CodeMirrorAdapter.prototype.clearHighlights = function () {
    while (this.marks.length) {
      this.marks.pop().clear();
    }
  };

  CodeMirrorAdapter.prototype.highlight = function (matches, selected) {
    var self = this;
    this.clearHighlights();
    this.editor.operation(function () {
      matches.forEach(function (match, index) {
        var className =
          index === selected
            ? "jenkins-editor-search-match jenkins-editor-search-match-current"
            : "jenkins-editor-search-match";
        self.marks.push(
          self.markText(self.editor.posFromIndex(match.start), self.editor.posFromIndex(match.end), className)
        );
      });
    });
  };

  CodeMirrorAdapter.prototype.markText = function (from, to, className) {
    var version = window.CodeMirror && window.CodeMirror.version;
    if (!this.editor.getDoc || this.editor.markText.length >= 4 || (version && version.indexOf("2.") === 0)) {
      return this.editor.markText(from, to, className);
    }
    return this.editor.markText(from, to, {
      className: className,
    });
  };

  CodeMirrorAdapter.prototype.isSameEditor = function (adapter) {
    return adapter && adapter.type === this.type && adapter.editor === this.editor;
  };

export { CodeMirrorAdapter };