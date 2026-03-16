import fs from "fs/promises";
import path from "path";

// Configuration file paths - go up from backend/dist/src/services to project root
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..");
const AXEREY_CONFIG_PATH = path.join(PROJECT_ROOT, ".axerey.scientific");
const VAGOGON_CONFIG_PATH = path.join(PROJECT_ROOT, ".vagogon");

console.log("[ConfigManager] Loading from:", PROJECT_ROOT);

// In-memory config cache
let configCache: any = null;
let lastModified: number = 0;

// Default config structure
const DEFAULT_CONFIG = {
  version: "1.0.0",
  environment: "production",
  personas: {},
  memory: {
    vssEnabled: true,
    vectorDimension: 1536,
    hybridVSS: {
      useHNSWForSearch: true,
      useVectorliteForPersistence: true,
      autoSwitchThreshold: 1000,
      maxElements: 50000,
      M: 16,
      efConstruction: 200,
      ef: 100,
      space: "cosine",
    },
  },
  reasoning: {},
  performance: {},
  metadata: {
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: "1.0.0",
  },
};

/**
 * Load personas from .vagogon file (fallback source)
 */
async function loadPersonasFromVagogon(): Promise<any> {
  try {
    const vagogonData = await fs.readFile(VAGOGON_CONFIG_PATH, "utf-8");
    const vagogonConfig = JSON.parse(vagogonData);
    return vagogonConfig.personas || {};
  } catch (error) {
    // If .vagogon doesn't exist, return empty
    return {};
  }
}

/**
 * Load Axerey scientific configuration (with caching)
 * Merges personas from .vagogon if not present in .axerey.scientific
 */
export async function loadConfig(forceReload: boolean = false): Promise<any> {
  console.log("[ConfigManager] Loading config from:", AXEREY_CONFIG_PATH);
  try {
    // Check file modification time
    const stats = await fs.stat(AXEREY_CONFIG_PATH).catch(() => null);
    console.log("[ConfigManager] File stats:", stats);
    const fileModified = stats?.mtimeMs || 0;

    // Return cached config if it's still valid and not forcing reload
    if (!forceReload && configCache && fileModified <= lastModified) {
      return configCache;
    }

    // Load from file
    const configData = await fs.readFile(AXEREY_CONFIG_PATH, "utf-8");
    const config = JSON.parse(configData);

    // If no personas in axerey config, try to load from .vagogon
    let personas = config.personas || {};
    if (!personas || Object.keys(personas).length === 0) {
      const vagogonPersonas = await loadPersonasFromVagogon();
      if (Object.keys(vagogonPersonas).length > 0) {
        personas = vagogonPersonas;
        // Merge personas into config (will be saved on next write)
        config.personas = personas;
      }
    }

    // Merge with defaults to ensure all required fields exist
    configCache = {
      ...DEFAULT_CONFIG,
      ...config,
      personas: personas,
      memory: {
        ...DEFAULT_CONFIG.memory,
        ...(config.memory || {}),
      },
    };

    console.log("[ConfigManager] Loaded personas:", Object.keys(personas));
    lastModified = fileModified || Date.now();
    return configCache;
  } catch (error) {
    // If file doesn't exist, try loading personas from .vagogon
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const vagogonPersonas = await loadPersonasFromVagogon();
      configCache = {
        ...DEFAULT_CONFIG,
        personas: vagogonPersonas,
      };
      lastModified = Date.now();
      return configCache;
    }
    throw error;
  }
}

/**
 * Save Axerey scientific configuration
 */
export async function saveConfig(config: any): Promise<void> {
  config.metadata = {
    ...config.metadata,
    lastModified: new Date().toISOString(),
  };

  await fs.writeFile(
    AXEREY_CONFIG_PATH,
    JSON.stringify(config, null, 2),
    "utf-8",
  );

  // Update cache immediately
  configCache = {
    ...DEFAULT_CONFIG,
    ...config,
    personas: config.personas || {},
    memory: {
      ...DEFAULT_CONFIG.memory,
      ...(config.memory || {}),
    },
  };
  lastModified = Date.now();
}

/**
 * Get current config (from cache if available, otherwise load)
 */
export async function getConfig(): Promise<any> {
  if (configCache) {
    return configCache;
  }
  return await loadConfig();
}

/**
 * Reload config from file (clears cache and reloads)
 */
export async function reloadConfig(): Promise<any> {
  configCache = null;
  lastModified = 0;
  return await loadConfig(true);
}

/**
 * Get current persona ID (in-memory, can be updated without file changes)
 */
let currentPersonaId: string = "default";

export function getCurrentPersonaId(): string {
  return currentPersonaId;
}

export function setCurrentPersonaId(personaId: string): void {
  currentPersonaId = personaId;
}
