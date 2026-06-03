  function TextareaAdapter(textarea) {
    this.type = "textarea";
    this.editor = textarea;
    this.host = document.body;
    this.fixed = true;
  }

  TextareaAdapter.prototype.getHost = function () {
    return this.host;
  };

  TextareaAdapter.prototype.getValue = function () {
    return this.editor.value;
  };

  TextareaAdapter.prototype.getCursorIndex = function () {
    return this.editor.selectionStart || 0;
  };

  TextareaAdapter.prototype.getSelectedText = function () {
    return this.editor.value.substring(this.editor.selectionStart || 0, this.editor.selectionEnd || 0);
  };

  TextareaAdapter.prototype.focus = function () {
    this.editor.focus();
  };

  TextareaAdapter.prototype.selectRange = function (start, end) {
    this.editor.focus();
    this.editor.setSelectionRange(start, end);
  };

  TextareaAdapter.prototype.clearHighlights = function () {};

  TextareaAdapter.prototype.highlight = function () {};

  TextareaAdapter.prototype.onSearchOpen = function () {};

  TextareaAdapter.prototype.onSearchClose = function () {};

  TextareaAdapter.prototype.clearExternalSearchState = function () {};

  TextareaAdapter.prototype.collapseSelection = function (index) {
    this.editor.setSelectionRange(index, index);
  };

  TextareaAdapter.prototype.isSameEditor = function (adapter) {
    return adapter && adapter.type === this.type && adapter.editor === this.editor;
  };

  TextareaAdapter.prototype.getAnchorRect = function () {
    return this.editor.getBoundingClientRect();
  };

export { TextareaAdapter };