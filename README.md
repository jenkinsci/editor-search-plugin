# Editor Search

Modern find-in-editor controls for Jenkins code editors.

Editor Search adds a compact search widget to Jenkins editor surfaces that otherwise have weak or missing search UI, including Pipeline Replay and the Script Console. It is designed to feel native in Jenkins, work from the keyboard, and stay out of the way of editor controls such as the Pipeline sample selector.

![Pipeline Replay search](docs/images/replay-light-final.png)

## Features

- Opens from `Ctrl+F` or `Command+F` when the cursor is in a supported editor.
- Adds an editor-local search button that hides while the search widget is open.
- Supports next and previous match navigation.
- Supports match case, whole word, and regular expression modes.
- Highlights all matches and the current match.
- Works with Jenkins light mode, dark themes, and Prism syntax highlighting themes.
- Avoids the Pipeline Replay sample selector when the script is empty.
- Supports Jenkins dynamic loading for no-restart plugin-manager and CLI installs.

## Supported Editors

Editor Search currently detects Jenkins CodeMirror and Ace editor instances, plus read-only Prism syntax highlighting code viewers. This covers the Jenkins Script Console, Pipeline Replay, source viewers powered by the Prism API plugin, and other Jenkins pages that use those editor widgets.

![Prism source viewer search in dark mode](docs/images/prism-dark-puppeteer.png)

## Installation

Install Editor Search from **Manage Jenkins > Plugins** by searching for `Editor Search` or `editor-search`.

For automated installs, use the Jenkins CLI:

```bash
java -jar jenkins-cli.jar -s http://localhost:8080/ install-plugin editor-search -deploy
```

Editor Search supports dynamic loading, so installs through the plugin manager or Jenkins CLI can be deployed without restarting Jenkins. Jenkins may still require a restart when another plugin in the same operation requires one, or when a plugin file is copied manually into `JENKINS_HOME/plugins`.

For developing the plugin see: [DEV.md](DEV.md).

## Usage

Focus a supported Jenkins code editor and press `Ctrl+F` or `Command+F`. The search widget opens inside the editor. Press `Enter` for the next match, `Shift+Enter` for the previous match, or `Escape` to close the widget. You can also use `Ctrl+G` or `Command+G` for the next match.

![Script Console dark mode search](docs/images/console-dark-final.png)

## Compatibility

The plugin requires Jenkins `2.528.3` or newer and Java 17. It has been tested on Jenkins `2.541.2` and current LTS images.

## Reporting Issues

Report issues and enhancement requests in [GitHub Issues](https://github.com/jenkinsci/editor-search-plugin/issues).

## Contributing

Contributions are welcome. Follow the Jenkins project [contribution guidelines](https://github.com/jenkinsci/.github/blob/master/CONTRIBUTING.md).

## License

Licensed under MIT, see [LICENSE.md](LICENSE.md).
