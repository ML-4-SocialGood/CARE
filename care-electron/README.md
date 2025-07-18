# CARE User Interface via Electron

An Electron-Vite application with React and TypeScript.
The main user interface is in this Electron application,
and the AI/ML component is in a Python application,
bundled with Pyinstaller.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

You must first build the Python ML detect/re-id program to run the frontend. See the [Python README](../python/README.md) for details.

_Every time you change the Python code you must rebuild the pyinstaller bundle!_

Then you can run the development version of the user interface with:

```bash
$ npm run dev
```

To preview the packaged application:

```bash
npm run start
```

This bundles the application in the same fashion as the installer would.

### Build Installer

First re-build the Python pyinstaller package. See the [Python README](../python/README.md) for details.

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
