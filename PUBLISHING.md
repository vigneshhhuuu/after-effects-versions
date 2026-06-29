# Publishing Guide

This guide explains how to publish the `after-effects-versions` package to npm.

## Pre-Publishing Checklist

1. **Update package.json metadata** (if needed):
   - Set your author name
   - Update repository URL to your actual GitHub repository
   - Verify version number (current: 1.0.0)

2. **Test the package locally**:
   ```bash
   npm run build
   npm test
   ```

3. **Test in another project** (optional):
   ```bash
   npm pack
   # This creates after-effects-versions-1.0.0.tgz
   # Then in another project:
   npm install /path/to/after-effects-versions-1.0.0.tgz
   ```

## Publishing Steps

### First Time Setup

1. **Create an npm account** (if you don't have one):
   - Visit https://www.npmjs.com/signup
   - Or run: `npm adduser`

2. **Login to npm**:
   ```bash
   npm login
   ```

### Publishing

1. **Ensure you're logged in**:
   ```bash
   npm whoami
   ```

2. **Check what will be published**:
   ```bash
   npm publish --dry-run
   ```
   This shows which files will be included (should only be dist/, README.md, LICENSE, package.json).

3. **Publish the package**:
   ```bash
   npm publish
   ```

4. **Verify publication**:
   Visit: https://www.npmjs.com/package/after-effects-versions

## Post-Publishing

### Install and test:
```bash
npm install after-effects-versions
```

### Version Updates

For future updates:

1. Make your changes
2. Update version in package.json (following semver):
   - Patch: 1.0.1 (bug fixes)
   - Minor: 1.1.0 (new features, backward compatible)
   - Major: 2.0.0 (breaking changes)
3. Or use npm version:
   ```bash
   npm version patch   # 1.0.0 -> 1.0.1
   npm version minor   # 1.0.0 -> 1.1.0
   npm version major   # 1.0.0 -> 2.0.0
   ```
4. Publish again:
   ```bash
   npm publish
   ```

## Files Included in Package

The following files will be included in the published package (as specified in package.json "files" field):

- `dist/` - Compiled JavaScript and TypeScript definitions
- `README.md` - Documentation
- `LICENSE` - MIT License
- `package.json` - Package metadata

Files excluded (via .npmignore):
- `src/` - TypeScript source (users get compiled JS)
- `node_modules/`
- Test files
- Configuration files

## Troubleshooting

### Package name taken
If "after-effects-versions" is already taken on npm, you can either:
1. Use a scoped package: `@yourusername/after-effects-versions`
   - Update package.json name to: `"@yourusername/after-effects-versions"`
2. Choose a different name

### Permission denied
Make sure you're logged in with `npm login` and have permissions to publish under that package name.

### Build fails
Ensure TypeScript compiles without errors:
```bash
npm run build
```
Check for any TypeScript errors and fix them.
