/**
 * Memory Management Utilities
 *
 * Provides memory management functions for chart rendering, garbage collection
 * optimization, and memory pressure detection. Works with modern memory APIs
 * and provides fallbacks for cross-browser compatibility.
 */

// Memory thresholds and limits
export const MEMORY_LIMITS = {
  // Memory pressure levels (as percentage of total available memory)
  WARNING_THRESHOLD: 75,
  CRITICAL_THRESHOLD: 90,

  // Chart-specific limits
  MAX_CHARTS_DEFAULT: 25,
  MAX_CHARTS_LOW_MEMORY: 10,
  MAX_DATA_POINTS_PER_CHART: 1000,

  // Memory estimation constants
  BASE_APP_MEMORY_MB: 50,
  MEMORY_PER_CHART_MB: 5,
  MEMORY_PER_DATA_POINT_KB: 0.5,

  // Garbage collection hints
  GC_INTERVAL_MS: 30000, // 30 seconds
  CLEANUP_DELAY_MS: 1000, // 1 second
} as const;

// Memory information interface
export interface MemorySnapshot {
  used: number;
  total: number;
  limit: number;
  timestamp: number;
  source: "modern" | "legacy" | "estimated";
  pressure: "normal" | "warning" | "critical";
}

// Memory manager configuration
export interface MemoryManagerConfig {
  enableAutoGC: boolean;
  enableLogging: boolean;
  logPrefix: string;
  gcInterval: number;
  pressureThresholds: {
    warning: number;
    critical: number;
  };
}

// Chart memory profile for estimation
export interface ChartMemoryProfile {
  type: string;
  dataPoints: number;
  estimatedBytes: number;
  actualMeasurement?: number;
  measurementAccuracy?: number; // 0-1 confidence level
}

// Memory manager class for centralized memory management
export class MemoryManager {
  private config: MemoryManagerConfig;
  private gcInterval?: NodeJS.Timeout;
  private memorySnapshots: MemorySnapshot[] = [];
  private chartProfiles: Map<string, ChartMemoryProfile> = new Map();
  private cleanupCallbacks: Set<() => void> = new Set();

  constructor(config: Partial<MemoryManagerConfig> = {}) {
    this.config = {
      enableAutoGC: true,
      enableLogging: process.env.NODE_ENV === "development",
      logPrefix: "[Memory Manager]",
      gcInterval: MEMORY_LIMITS.GC_INTERVAL_MS,
      pressureThresholds: {
        warning: MEMORY_LIMITS.WARNING_THRESHOLD,
        critical: MEMORY_LIMITS.CRITICAL_THRESHOLD,
      },
      ...config,
    };

    if (this.config.enableAutoGC) {
      this.startAutoGC();
    }
  }

  /**
   * Take a memory snapshot using the best available method
   */
  async takeMemorySnapshot(): Promise<MemorySnapshot> {
    let memoryInfo: {
      used: number;
      total: number;
      limit: number;
      source: "modern" | "legacy" | "estimated";
    };

    try {
      // Try modern API first
      memoryInfo = await this.measureMemoryModern();
    } catch {
      try {
        // Fall back to legacy API
        memoryInfo = this.measureMemoryLegacy();
      } catch {
        // Fall back to estimation
        memoryInfo = this.estimateMemoryUsage();
      }
    }

    const pressure = this.calculateMemoryPressure(
      memoryInfo.used,
      memoryInfo.limit,
    );

    const snapshot: MemorySnapshot = {
      ...memoryInfo,
      timestamp: Date.now(),
      pressure,
    };

    this.memorySnapshots.push(snapshot);

    // Keep only last 100 snapshots for analysis
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots.shift();
    }

    if (this.config.enableLogging) {
      this.logMemorySnapshot(snapshot);
    }

    return snapshot;
  }

  /**
   * Modern memory measurement using measureUserAgentSpecificMemory
   */
  private async measureMemoryModern(): Promise<{
    used: number;
    total: number;
    limit: number;
    source: "modern";
  }> {
    if (!("measureUserAgentSpecificMemory" in performance)) {
      throw new Error("Modern memory API not supported");
    }

    const measurement = await (
      performance as any
    ).measureUserAgentSpecificMemory();

    let totalUsed = 0;
    if (measurement.breakdown) {
      for (const breakdown of measurement.breakdown) {
        totalUsed += breakdown.bytes || 0;
      }
    } else {
      totalUsed = measurement.bytes || 0;
    }

    return {
      used: totalUsed,
      total: totalUsed,
      limit: totalUsed * 4, // Estimate: browsers typically allow 4x current
      source: "modern",
    };
  }

  /**
   * Legacy memory measurement using window.performance.memory
   */
  private measureMemoryLegacy(): {
    used: number;
    total: number;
    limit: number;
    source: "legacy";
  } {
    if (
      typeof window === "undefined" ||
      !window.performance ||
      !(window.performance as any).memory
    ) {
      throw new Error("Legacy memory API not supported");
    }

    const memory = (window.performance as any).memory;

    return {
      used: memory.usedJSHeapSize || 0,
      total: memory.totalJSHeapSize || 0,
      limit: memory.jsHeapSizeLimit || 0,
      source: "legacy",
    };
  }

  /**
   * Estimate memory usage based on chart count and app state
   */
  private estimateMemoryUsage(): {
    used: number;
    total: number;
    limit: number;
    source: "estimated";
  } {
    const totalChartMemory = Array.from(this.chartProfiles.values()).reduce(
      (total, profile) => total + profile.estimatedBytes,
      0,
    );

    const baseMemoryBytes = MEMORY_LIMITS.BASE_APP_MEMORY_MB * 1024 * 1024;
    const estimatedUsed = baseMemoryBytes + totalChartMemory;

    // Typical browser limits
    const estimatedLimit = 2 * 1024 * 1024 * 1024; // 2GB
    const estimatedTotal = Math.min(estimatedUsed * 1.5, estimatedLimit * 0.8);

    return {
      used: estimatedUsed,
      total: estimatedTotal,
      limit: estimatedLimit,
      source: "estimated",
    };
  }

  /**
   * Calculate memory pressure level
   */
  private calculateMemoryPressure(
    used: number,
    limit: number,
  ): "normal" | "warning" | "critical" {
    if (limit === 0) return "normal";

    const usagePercent = (used / limit) * 100;

    if (usagePercent >= this.config.pressureThresholds.critical) {
      return "critical";
    } else if (usagePercent >= this.config.pressureThresholds.warning) {
      return "warning";
    }

    return "normal";
  }

  /**
   * Estimate memory usage for a chart
   */
  estimateChartMemory(type: string, dataPoints: number): number {
    // Base memory per chart type (in bytes)
    const typeMultipliers: Record<string, number> = {
      table: 2.0, // Tables can have many cells
      scatter: 3.0, // Many individual data points
      geographic: 4.0, // TopoJSON data + rendering
      sankey: 3.5, // Complex node-link calculations
      "calendar-heatmap": 2.5, // 365+ data points
      dashboard: 5.0, // Multiple chart types
      composed: 2.0, // Multiple series
      radar: 1.5, // Relatively simple
      funnel: 1.2, // Simple sequential data
      gauge: 1.0, // Single value display
      default: 1.0,
    };

    const baseBytes = MEMORY_LIMITS.MEMORY_PER_CHART_MB * 1024 * 1024;
    const typeMultiplier = typeMultipliers[type] || typeMultipliers.default;
    const dataMultiplier = Math.max(1, Math.sqrt(dataPoints / 100));

    return Math.round(baseBytes * typeMultiplier * dataMultiplier);
  }

  /**
   * Register a chart's memory profile
   */
  registerChart(
    id: string,
    type: string,
    dataPoints: number,
    actualBytes?: number,
  ): ChartMemoryProfile {
    const estimatedBytes = this.estimateChartMemory(type, dataPoints);

    const profile: ChartMemoryProfile = {
      type,
      dataPoints,
      estimatedBytes,
      actualMeasurement: actualBytes,
      measurementAccuracy: actualBytes
        ? this.calculateAccuracy(estimatedBytes, actualBytes)
        : undefined,
    };

    this.chartProfiles.set(id, profile);
    return profile;
  }

  /**
   * Unregister a chart's memory profile
   */
  unregisterChart(id: string): boolean {
    return this.chartProfiles.delete(id);
  }

  /**
   * Calculate accuracy of memory estimation
   */
  private calculateAccuracy(estimated: number, actual: number): number {
    if (actual === 0) return 0;
    const difference = Math.abs(estimated - actual);
    const accuracy = Math.max(0, 1 - difference / actual);
    return Math.round(accuracy * 100) / 100;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    if (this.memorySnapshots.length === 0) {
      return null;
    }

    const latest = this.memorySnapshots[this.memorySnapshots.length - 1];
    const chartCount = this.chartProfiles.size;
    const totalEstimatedChartMemory = Array.from(
      this.chartProfiles.values(),
    ).reduce((total, profile) => total + profile.estimatedBytes, 0);

    return {
      current: {
        usedMB: Math.round(latest.used / 1024 / 1024),
        totalMB: Math.round(latest.total / 1024 / 1024),
        limitMB: Math.round(latest.limit / 1024 / 1024),
        usagePercent:
          latest.limit > 0 ? Math.round((latest.used / latest.limit) * 100) : 0,
        pressure: latest.pressure,
        source: latest.source,
      },
      charts: {
        count: chartCount,
        estimatedMemoryMB: Math.round(totalEstimatedChartMemory / 1024 / 1024),
        averageMemoryPerChartMB:
          chartCount > 0
            ? Math.round(totalEstimatedChartMemory / chartCount / 1024 / 1024)
            : 0,
      },
      history: {
        snapshotCount: this.memorySnapshots.length,
        oldestSnapshot: this.memorySnapshots[0]?.timestamp,
        newestSnapshot: latest.timestamp,
      },
    };
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): void {
    // Request garbage collection if available (Chrome DevTools or Node.js)
    if (typeof window !== "undefined" && (window as any).gc) {
      try {
        (window as any).gc();
        if (this.config.enableLogging) {
          console.log(`${this.config.logPrefix} Forced garbage collection`);
        }
      } catch (error) {
        if (this.config.enableLogging) {
          console.warn(`${this.config.logPrefix} Failed to force GC:`, error);
        }
      }
    }

    // Run cleanup callbacks
    this.runCleanupCallbacks();
  }

  /**
   * Add cleanup callback to run during GC
   */
  addCleanupCallback(callback: () => void): () => void {
    this.cleanupCallbacks.add(callback);
    return () => this.cleanupCallbacks.delete(callback);
  }

  /**
   * Run all cleanup callbacks
   */
  private runCleanupCallbacks(): void {
    for (const callback of this.cleanupCallbacks) {
      try {
        callback();
      } catch (error) {
        if (this.config.enableLogging) {
          console.warn(
            `${this.config.logPrefix} Cleanup callback failed:`,
            error,
          );
        }
      }
    }
  }

  /**
   * Start automatic garbage collection
   */
  private startAutoGC(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
    }

    this.gcInterval = setInterval(() => {
      this.forceGarbageCollection();
    }, this.config.gcInterval);
  }

  /**
   * Stop automatic garbage collection
   */
  stopAutoGC(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = undefined;
    }
  }

  /**
   * Log memory snapshot to console
   */
  private logMemorySnapshot(snapshot: MemorySnapshot): void {
    const usedMB = Math.round(snapshot.used / 1024 / 1024);
    const totalMB = Math.round(snapshot.total / 1024 / 1024);
    const limitMB = Math.round(snapshot.limit / 1024 / 1024);
    const usagePercent =
      snapshot.limit > 0
        ? Math.round((snapshot.used / snapshot.limit) * 100)
        : 0;

    console.log(
      `${this.config.logPrefix} Memory Snapshot (${snapshot.source}):`,
      {
        used: `${usedMB}MB`,
        total: `${totalMB}MB`,
        limit: `${limitMB}MB`,
        usage: `${usagePercent}%`,
        pressure: snapshot.pressure,
        charts: this.chartProfiles.size,
      },
    );

    // Log warning for high memory usage
    if (snapshot.pressure === "warning") {
      console.warn(
        `${this.config.logPrefix} High memory usage detected - consider removing charts`,
      );
    } else if (snapshot.pressure === "critical") {
      console.error(
        `${this.config.logPrefix} Critical memory usage - immediate action required`,
      );
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopAutoGC();
    this.cleanupCallbacks.clear();
    this.memorySnapshots.length = 0;
    this.chartProfiles.clear();
  }
}

// Global memory manager instance
let globalMemoryManager: MemoryManager | null = null;

/**
 * Get or create global memory manager instance
 */
export function getMemoryManager(
  config?: Partial<MemoryManagerConfig>,
): MemoryManager {
  if (!globalMemoryManager) {
    globalMemoryManager = new MemoryManager(config);
  }
  return globalMemoryManager;
}

/**
 * Utility functions for memory management
 */
export const MemoryUtils = {
  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  },

  /**
   * Check if memory pressure requires immediate action
   */
  requiresImmediateAction(
    pressure: "normal" | "warning" | "critical",
  ): boolean {
    return pressure === "critical";
  },

  /**
   * Get recommended chart limit based on available memory
   */
  getRecommendedChartLimit(availableMemoryMB: number): number {
    const avgChartMemoryMB = MEMORY_LIMITS.MEMORY_PER_CHART_MB;
    const safeChartCount = Math.floor(availableMemoryMB / avgChartMemoryMB);

    return Math.min(
      Math.max(safeChartCount, 5), // At least 5 charts
      MEMORY_LIMITS.MAX_CHARTS_DEFAULT, // But not more than default max
    );
  },

  /**
   * Estimate if chart creation is safe
   */
  isChartCreationSafe(
    currentMemoryUsageMB: number,
    memoryLimitMB: number,
    estimatedChartMemoryMB: number,
  ): { safe: boolean; reason?: string } {
    const availableMemoryMB = memoryLimitMB - currentMemoryUsageMB;
    const safetyMarginMB = memoryLimitMB * 0.1; // 10% safety margin

    if (availableMemoryMB - estimatedChartMemoryMB < safetyMarginMB) {
      return {
        safe: false,
        reason: "Insufficient memory available - would exceed safety margin",
      };
    }

    if (currentMemoryUsageMB / memoryLimitMB > 0.8) {
      return {
        safe: false,
        reason: "Already using more than 80% of available memory",
      };
    }

    return { safe: true };
  },
};
