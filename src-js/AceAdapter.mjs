  function AceAdapter(editor, host) {
    this.type = "ace";
    this.editor = editor;
    this.host = host || editor.container;
    this.markerIds = [];
    this.Range = getAceRange();
    this.highlightSelectedWordCaptured = false;
    this.previousHighlightSelectedWord = null;
  }

  AceAdapter.prototype.getHost = function () {
    return this.host;
  };

  AceAdapter.prototype.getValue = function () {
    return this.editor.getValue();
  };

  AceAdapter.prototype.getCursorIndex = function () {
    return getAceDocument(this.editor).positionToIndex(this.editor.getCursorPosition(), 0);
  };

  AceAdapter.prototype.getSelectedText = function () {
    return this.editor.getSelectedText ? this.editor.getSelectedText() : "";
  };

  AceAdapter.prototype.focus = function () {
    this.editor.focus();
  };

  AceAdapter.prototype.onSearchOpen = function () {
    if (this.editor.getOption && this.editor.setOption && !this.highlightSelectedWordCaptured) {
      this.previousHighlightSelectedWord = this.editor.getOption("highlightSelectedWord");
      this.highlightSelectedWordCaptured = true;
      this.editor.setOption("highlightSelectedWord", false);
    }
    this.clearSelectedWordMarkers();
  };

  AceAdapter.prototype.onSearchClose = function () {
    this.clearSelectedWordMarkers();
    if (this.editor.setOption && this.highlightSelectedWordCaptured) {
      this.editor.setOption("highlightSelectedWord", this.previousHighlightSelectedWord);
    }
    this.highlightSelectedWordCaptured = false;
  };

  AceAdapter.prototype.clearExternalSearchState = function () {
    if (this.editor.$search) {
      this.editor.$search.set({ needle: "" });
    }
    this.clearSelectedWordMarkers();
  };

  AceAdapter.prototype.flushMarkerLayer = function () {
    var renderer = this.editor.renderer;
    if (!renderer) {
      return;
    }
    if (renderer.updateBackMarkers) {
      renderer.updateBackMarkers();
    } else if (renderer.updateFull) {
      renderer.updateFull();
    }
  };

  AceAdapter.prototype.clearSelectedWordMarkers = function () {
    var markers = this.editor.session.getMarkers(false);
    var session = this.editor.session;
    Object.keys(markers).forEach(function (id) {
      if (markers[id].clazz && markers[id].clazz.indexOf("ace_selected-word") !== -1) {
        session.removeMarker(Number(id));
      }
    });
    this.flushMarkerLayer();
  };

  AceAdapter.prototype.collapseSelection = function (index) {
    var position = this.toPosition(Math.max(0, index || 0));
    this.editor.selection.moveToPosition(position);
    this.editor.clearSelection();
  };

  AceAdapter.prototype.toPosition = function (index) {
    return getAceDocument(this.editor).indexToPosition(index, 0);
  };

  AceAdapter.prototype.toRange = function (start, end) {
    var from = this.toPosition(start);
    var to = this.toPosition(end);
    return new this.Range(from.row, from.column, to.row, to.column);
  };

  AceAdapter.prototype.selectRange = function (start, end) {
    if (!this.Range) {
      return;
    }
    var from = this.toPosition(start);
    this.editor.selection.moveToPosition(from);
    this.editor.clearSelection();
    this.editor.scrollToLine(from.row, true, true, function () {});
    this.editor.focus();
  };

  AceAdapter.prototype.clearHighlights = function () {
    var session = this.editor.session;
    while (this.markerIds.length) {
      session.removeMarker(this.markerIds.pop());
    }
    this.flushMarkerLayer();
  };

  AceAdapter.prototype.highlight = function (matches, selected) {
    var self = this;
    var session = this.editor.session;
    if (!this.Range) {
      return;
    }
    this.clearHighlights();
    matches.forEach(function (match, index) {
      var className =
        index === selected
          ? "jenkins-editor-search-match jenkins-editor-search-match-current"
          : "jenkins-editor-search-match";
      self.markerIds.push(session.addMarker(self.toRange(match.start, match.end), className, "text", false));
    });
    this.flushMarkerLayer();
  };

  AceAdapter.prototype.isSameEditor = function (adapter) {
    return adapter && adapter.type === this.type && adapter.editor === this.editor;
  };

export { AceAdapter };