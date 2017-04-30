# CG2

## Setup (in ./)

### Install NodeJS

[Download](https://nodejs.org/en/download/current/)

### Install Typescript globally

```bash
npm install -g typescript
```

### Fetch dependencies

```bash
npm install
```

## Dev (in ./)

Typescript builds are automatic (see `tsconfig.json`)
```bash
tsc
```

Express-server can be started by: (automatic reload on changes)
```bash
npm run server
```
this hosts a webserver accessible at localhost:3000
models will be fetched from localhost:3000/models/*fileName* where *fileName* is retrieved from [whereever this points](https://github.com/ltetzlaff/cg2/blob/master/server/server.js#L16)


Tests
```bash
npm test
```

## Contribution

- respect the gitignore (keep out university material and fetch that manually)
- use `git pull --rebase` in favor of regular pull, i recommend configuring it globally via: 
  ```bash
  git config --global pull.rebase true
  ```
