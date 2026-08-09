<p align="center">
  <img src="./assets/banner.svg" width="900" alt="comark-cat rendering Markdown in a terminal">
</p>

Simply render Markdown in your terminal with [Comark](https://comark.dev).

## What is it?

`comark-cat` turns Markdown files and streams into polished terminal output.
It ships in a compressed package under 700 KB while supporting syntax highlighting, tables, alerts, footnotes, and terminal-rendered Mermaid diagrams.

```bash
# Read a file
cmk README.md

# Read multiple files
cmk README.md DEVELOPMENT.md

# Read from stdin
git show HEAD:README.md | cmk
```

The package installs both `cmk` and `comark-cat`; they are equivalent, so use whichever name you prefer.

## Features

- Syntax-highlighted fenced code blocks powered by [Rangi](https://npmx.dev/package/rangi)
- Tables, task lists, alerts, footnotes, and emoji
- Inline and block math powered by KaTeX
- Mermaid diagrams rendered as terminal-friendly text
- Terminal-aware colors, responsive width, and pager support

Huge thanks to [`@comark/ansi`](https://npmx.dev/package/@comark/ansi) for powering most of these features 😻

## Installation

<details open>
<summary><strong>npm</strong></summary>

```bash
npm install --global comark-cat
```

</details>

<details>
<summary><strong>pnpm</strong></summary>

```bash
pnpm add --global comark-cat
```

</details>

<details>
<summary><strong>Yarn</strong></summary>

```bash
yarn global add comark-cat
```

</details>

<details>
<summary><strong>Bun</strong></summary>

```bash
bun add --global comark-cat
```

</details>

<details>
<summary><strong>Vite Plus</strong></summary>

```bash
vp install --global comark-cat
```

</details>

Requires Node.js 22 or newer.

## The CLI

Set the output width, turn off colors, or open the result in your pager:

```bash
cmk README.md --width 100
cmk README.md --no-color
cmk README.md --pager
```

Optional renderers can be disabled individually:

```bash
cmk README.md --no-highlight --no-math --no-mermaid
```

An explicit `-` selects stdin:

```bash
git show HEAD:README.md | cmk -
```

Run `cmk --help` (or `comark-cat --help`) for all available options.

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md).

## License

[MIT](LICENSE)
