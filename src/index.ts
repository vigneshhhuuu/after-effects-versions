import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Represents a single Adobe After Effects installation found on the system.
 */
export interface AfterEffectsInstall {
  /** Platform where this installation was found */
  platform: 'mac' | 'win';
  /** Human-readable application name */
  name: string;
  /** Semantic version string if available, otherwise null */
  version: string | null;
  /** Full path to the installation root (.app on macOS, install directory on Windows) */
  path: string;
  /** Path to AfterFX.exe (Windows only) */
  exe?: string;
}

/**
 * Finds all installed Adobe After Effects versions on the current machine.
 * Supports macOS and Windows. Returns an empty array on unsupported platforms.
 * 
 * @returns Promise resolving to an array of After Effects installations
 * 
 * @example
 * ```typescript
 * import { findAfterEffectsVersions } from 'after-effects-versions';
 * 
 * const installs = await findAfterEffectsVersions();
 * console.log(installs);
 * ```
 */
export async function findAfterEffectsVersions(): Promise<AfterEffectsInstall[]> {
  const platform = process.platform;

  if (platform === 'darwin') {
    return findMacVersions();
  } else if (platform === 'win32') {
    return findWindowsVersions();
  }

  // Unsupported platform
  return [];
}

/**
 * Finds the latest installed Adobe After Effects version on the current machine.
 * Returns the installation with the highest semantic version number.
 * 
 * @returns Promise resolving to the latest After Effects installation, or null if none found
 * 
 * @example
 * ```typescript
 * import { findLatestAfterEffects } from 'after-effects-versions';
 * 
 * const latest = await findLatestAfterEffects();
 * if (latest) {
 *   console.log(`Latest: ${latest.name} v${latest.version}`);
 *   console.log(`Path: ${latest.path}`);
 * }
 * ```
 */
export async function findLatestAfterEffects(): Promise<AfterEffectsInstall | null> {
  const installs = await findAfterEffectsVersions();

  if (installs.length === 0) {
    return null;
  }

  // Sort by version (highest first) and return the first one
  const sorted = installs.sort((a, b) => compareVersions(b.version, a.version));
  return sorted[0];
}

/**
 * Compares two version strings for sorting.
 * Returns positive if v1 > v2, negative if v1 < v2, zero if equal.
 * Handles semantic versions (24.5.0), year versions (2024), and null values.
 */
function compareVersions(v1: string | null, v2: string | null): number {
  // Null versions go to the end
  if (v1 === null && v2 === null) return 0;
  if (v1 === null) return -1;
  if (v2 === null) return 1;

  // Split versions into parts
  const parts1 = v1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map(p => parseInt(p, 10) || 0);

  // Compare each part
  const maxLength = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

/**
 * Finds After Effects installations on macOS.
 * Searches /Applications/ for folders containing "After Effects",
 * then looks for .app bundles inside those folders.
 */
async function findMacVersions(): Promise<AfterEffectsInstall[]> {
  const installs: AfterEffectsInstall[] = [];
  const applicationsDir = '/Applications';

  try {
    const entries = await fs.readdir(applicationsDir, { withFileTypes: true });

    for (const entry of entries) {
      // Look for directories containing "After Effects" in the name
      if (entry.isDirectory() && entry.name.includes('After Effects')) {
        const parentPath = path.join(applicationsDir, entry.name);
        
        // Check if this is a direct .app bundle
        if (entry.name.endsWith('.app')) {
          const install = await createMacInstall(parentPath, entry.name);
          if (install) installs.push(install);
        } else {
          // Look for .app bundles inside this directory
          try {
            const subEntries = await fs.readdir(parentPath, { withFileTypes: true });
            
            for (const subEntry of subEntries) {
              if (subEntry.isDirectory() && 
                  subEntry.name.endsWith('.app') &&
                  subEntry.name.includes('After Effects') &&
                  !subEntry.name.includes('Render Engine')) {
                
                const appPath = path.join(parentPath, subEntry.name);
                const install = await createMacInstall(appPath, subEntry.name);
                if (install) installs.push(install);
              }
            }
          } catch (err) {
            // Can't read subdirectory, skip
            continue;
          }
        }
      }
    }
  } catch (err) {
    // If we can't read /Applications, return empty array
    console.error('Error reading /Applications directory:', err);
  }

  return installs;
}

/**
 * Creates an AfterEffectsInstall object from a macOS .app bundle path.
 */
async function createMacInstall(
  appPath: string,
  appName: string
): Promise<AfterEffectsInstall | null> {
  const plistPath = path.join(appPath, 'Contents', 'Info.plist');
  let version: string | null = null;

  try {
    // Try to read version from Info.plist
    const plistContent = await fs.readFile(plistPath, 'utf-8');
    version = extractVersionFromPlist(plistContent);
  } catch (err) {
    // If we can't read the plist, continue without version
    // Not logging error to avoid noise
  }

  // Extract display name (remove .app extension)
  const name = appName.replace(/\.app$/, '');

  return {
    platform: 'mac',
    name,
    version,
    path: appPath,
  };
}

/**
 * Extracts version string from macOS Info.plist XML content.
 * Looks for CFBundleShortVersionString or CFBundleVersion.
 */
function extractVersionFromPlist(plistContent: string): string | null {
  // Simple XML parsing for version strings
  // Look for CFBundleShortVersionString first, then CFBundleVersion
  const shortVersionMatch = plistContent.match(
    /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/
  );
  
  if (shortVersionMatch && shortVersionMatch[1]) {
    return shortVersionMatch[1].trim();
  }

  const versionMatch = plistContent.match(
    /<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/
  );

  if (versionMatch && versionMatch[1]) {
    return versionMatch[1].trim();
  }

  return null;
}

/**
 * Finds After Effects installations on Windows.
 * Searches common installation directories under Program Files.
 */
async function findWindowsVersions(): Promise<AfterEffectsInstall[]> {
  const installs: AfterEffectsInstall[] = [];

  // Common installation root directories
  const searchRoots = [
    'C:\\Program Files\\Adobe',
    'C:\\Program Files (x86)\\Adobe',
  ];

  for (const root of searchRoots) {
    try {
      await searchWindowsDirectory(root, installs);
    } catch (err) {
      // Directory might not exist or not accessible, continue
      continue;
    }
  }

  return installs;
}

/**
 * Recursively searches a Windows directory for After Effects installations.
 */
async function searchWindowsDirectory(
  dir: string,
  installs: AfterEffectsInstall[]
): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const fullPath = path.join(dir, entry.name);

      // Check if this directory name contains "After Effects"
      if (entry.name.includes('After Effects')) {
        // Look for the AfterFX.exe in Support Files subdirectory
        const supportFilesPath = path.join(fullPath, 'Support Files');
        const exePath = path.join(supportFilesPath, 'AfterFX.exe');

        try {
          // Check if the exe exists
          await fs.access(exePath);

          // Extract version from directory name if possible
          // Example: "Adobe After Effects 2024" -> version might be in name or we try to parse
          const version = extractVersionFromWindowsPath(entry.name);

          installs.push({
            platform: 'win',
            name: entry.name,
            version,
            path: fullPath,
            exe: exePath,
          });
        } catch (err) {
          // AfterFX.exe not found, might not be a valid installation
          continue;
        }
      }
    }
  } catch (err) {
    // Can't read directory, skip
    throw err;
  }
}

/**
 * Attempts to extract a version string from a Windows installation directory name.
 * Examples:
 *   "Adobe After Effects 2024" -> "2024"
 *   "Adobe After Effects CC 2019" -> "2019"
 *   "Adobe After Effects CC" -> null
 */
function extractVersionFromWindowsPath(dirName: string): string | null {
  // Try to match year-based versions (2019, 2020, 2024, etc.)
  const yearMatch = dirName.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    return yearMatch[1];
  }

  // Try to match semantic versions (e.g., "24.5", "23.0")
  const semverMatch = dirName.match(/\b(\d+\.\d+(?:\.\d+)?)\b/);
  if (semverMatch) {
    return semverMatch[1];
  }

  return null;
}
