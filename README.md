# after-effects-versions

A Node.js library to detect installed Adobe After Effects versions on **macOS** and **Windows**.

## Installation

```bash
npm install after-effects-versions
```

## Usage

### Get All Installed Versions

```typescript
import { findAfterEffectsVersions } from 'after-effects-versions';

(async () => {
  const installs = await findAfterEffectsVersions();
  console.log(installs);
})();
```

### Get Latest Version Only

```typescript
import { findLatestAfterEffects } from 'after-effects-versions';

(async () => {
  const latest = await findLatestAfterEffects();
  
  if (latest) {
    console.log(`Latest: ${latest.name} v${latest.version}`);
    console.log(`Path: ${latest.path}`);
  } else {
    console.log('No After Effects installation found');
  }
})();
```

### Example Output

#### macOS

```json
[
  {
    "platform": "mac",
    "name": "Adobe After Effects 2025",
    "version": "24.5.0",
    "path": "/Applications/Adobe After Effects 2025.app"
  },
  {
    "platform": "mac",
    "name": "Adobe After Effects 2024",
    "version": "24.2.1",
    "path": "/Applications/Adobe After Effects 2024.app"
  }
]
```

#### Windows

```json
[
  {
    "platform": "win",
    "name": "Adobe After Effects 2024",**all** `AfterEffectsInstall` objects.

```typescript
interface AfterEffectsInstall {
  platform: 'mac' | 'win';
  name: string;        // Human-readable app name
  version: string | null; // Semantic version if available, otherwise null
  path: string;        // Install root path (.app folder on macOS, install dir on Windows)
  exe?: string;        // Path to AfterFX.exe on Windows only
}
```

### `findLatestAfterEffects()`

Returns a promise that resolves to the **latest** `AfterEffectsInstall` object (determined by semantic version comparison), or `null` if no installations are found.

**Use this when you only need the latest version** (e.g., for launching After Effects, checking compatibility, etc.). "exe": "C:\\Program Files\\Adobe\\Adobe After Effects CC 2019\\Support Files\\AfterFX.exe"
  }
]
```

## API

### `findAfterEffectsVersions()`

Returns a promise that resolves to an array of `AfterEffectsInstall` objects.

```typescript
interface AfterEffectsInstall {
  platform: 'mac' | 'win';
  name: string;        // Human-readable app name
  version: string | null; // Semantic version if available, otherwise null
  path: string;        // Install root path (.app folder on macOS, install dir on Windows)
  exe?: string;        // Path to AfterFX.exe on Windows only
}
```

## Platform Support

- **macOS (darwin)**: Searches `/Applications/` for After Effects `.app` bundles and reads version information from `Info.plist`
- **Windows (win32)**: Searches `Program Files` and `Program Files (x86)` for After Effects installations and validates by checking for `AfterFX.exe`
- **Other platforms**: Returns an empty array

## How It Works

### macOS Detection

1. Scans `/Applications/` directory for folders matching "After Effects" and ending with `.app`
2. Reads `Info.plist` from each app bundle to extract version information (`CFBundleShortVersionString` or `CFBundleVersion`)
3. Returns the full path to each `.app` bundle

### Windows Detection

1. Searches common Adobe installation directories:
   - `C:\Program Files\Adobe`
   - `C:\Program Files (x86)\Adobe`
2. Looks for folders containing "After Effects" in the name
3. Validates each installation by checking for `AfterFX.exe` in the `Support Files` subdirectory
4. Attempts to extract version from directory name (e.g., "2024", "2025")

## Error Handling

The library is designed to be robust:

- Returns an empty array on unsupported platforms
- Continues searching even if individual installations fail to read
- Handles permission errors gracefully
- Does not throw exceptions during normal operation

## Requirements

- Node.js 16 or higher
- No runtime dependencies

## Notes

- **Version accuracy**: On macOS, versions are read from the app bundle's `Info.plist`. On Windows, versions are extracted from directory names and may not always reflect the exact build number.
- **Permissions**: The library needs read access to `/Applications` on macOS and `Program Files` on Windows.
- **Custom installations**: Only detects installations in standard locations. Custom installation paths are not currently supported.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
