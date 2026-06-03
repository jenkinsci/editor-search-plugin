# Development

<!-- TOC -->

- [Development](#development)
	- [Requirements](#requirements)
		- [Frontend Build](#frontend-build)
		- [Jenkins Plugin Build](#jenkins-plugin-build)
	- [Frontend Build](#frontend-build)
		- [Watch Mode](#watch-mode)
		- [Linting JS](#linting-js)
	- [Building the Jenkins Plugin](#building-the-jenkins-plugin)
	- [Installing the Plugin in Jenkins](#installing-the-plugin-in-jenkins)
	- [Dependencies](#dependencies)
		- [Frontend](#frontend)

<!-- /TOC -->

## Requirements

### Frontend Build

* Node.js 20+

### Jenkins Plugin Build

* JDK 21
* Apache Maven 3.9+

Verify the requirements:
```bash
java -version
mvn -version
node -v
npm -v
```

## Frontend Build

Install frontend dependencies:
```bash
npm i
```

Create a production build:
```bash
npm run build
```

This runs `build.mjs` an [esbuild](https://esbuild.github.io/) script that creates `editor-search.js` for Jenkins.

### Watch Mode

Rebuild automatically when source files change:

```bash
npm run watch
```

### Linting JS

Run ESLint to check for syntax errors, invalid variable scope and similar problems:
```bash
npx eslint
```

## Testing the plugin

### Building the Jenkins Plugin

Build the plugin package:
```bash
mvn clean package
```

Note! The first build will take A LOT of time (Maven need to download deps). Sit back and relax for a few minutes :).

This should generate the Hudson Plug-In file (HPI). The generated plugin file will should be:
```text
target/editor-search.hpi
```

### Installing the Plugin via Jenkins GUI

1. Open Jenkins as an administrator.
2. Navigate to:

	```text
	Manage Jenkins
	→ Plugins
	→ Advanced Settings
	```

3. In the **Deploy Plugin** section, select the generated `.hpi` file.
4. Click **Deploy**; this should trigger an installation (similar to when installing from Jenkins repos).
5. Restart Jenkins when prompted.

### Installing the Plugin manually

Alternatively, copy the `.hpi` file into the Jenkins plugins directory:

```text
$JENKINS_HOME/plugins/
```

Restart service of Jenkins.

## Dependencies

### Frontend

* `esbuild` – here used as a JavaScript bundler that mostly removes comments and creates a single file for Jenkins.
* `eslint` – static code analysis, see: [Linting JS](#linting-js).
	* `@eslint/js` – rule sets for ESLint configuration.
	* `globals` – predefined browser and JavaScript globals for ESLint configuration.
