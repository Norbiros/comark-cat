# Development

## Setup

Install dependencies:

```bash
vp install
```

## Commands

```bash
vp check       # Lint, format, and type-check
vp test        # Run the test suite
vp pack        # Build the package
vp pack --watch
```

Install the current checkout globally for manual testing:

```bash
vp install --global .
```

After rebuilding, try it with a file or a pipe:

```bash
comark README.md
printf '# Hello\n\nMarkdown from stdin.' | comark
```
