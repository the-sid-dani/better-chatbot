/**
 * Chart Cleanup and Memory Optimization
 *
 * Provides utilities for proper chart component cleanup, memory leak prevention,
 * and optimization for large datasets. Integrates with React lifecycle and
 * modern browser APIs for efficient resource management.
 */

import { useEffect, useRef, useCallback } from "react";
import { getMemoryManager } from "./memory-manager";

// Chart cleanup configuration
export interface ChartCleanupConfig {
  enableAutoCleanup: boolean;
  cleanupDelay: number; // Delay before cleanup (ms)
  enableLogging: boolean;
  logPrefix: string;
  memoryThreshold: number; // Memory usage % to trigger cleanup
  maxDataPoints: number; // Max data points before optimization
}

// Chart cleanup state tracking
export interface ChartCleanupState {
  isCleaningUp: boolean;
  lastCleanup: number;
  cleanupCount: number;
  memoryFreed: number;
}

// Default cleanup configuration
const DEFAULT_CLEANUP_CONFIG: Required<ChartCleanupConfig> = {
  enableAutoCleanup: true,
  cleanupDelay: 1000,
  enableLogging: process.env.NODE_ENV === "development",
  logPrefix: "[Chart Cleanup]",
  memoryThreshold: 80,
  maxDataPoints: 1000,
};

/**
 * Chart cleanup hook for React components
 * Provides proper cleanup on unmount and memory optimization
 */
export function useChartCleanup(
  chartId: string,
  chartType: string,
  config: Partial<ChartCleanupConfig> = {},
) {
  const fullConfig = { ...DEFAULT_CLEANUP_CONFIG, ...config };
  const cleanupStateRef = useRef<ChartCleanupState>({
    isCleaningUp: false,
    lastCleanup: 0,
    cleanupCount: 0,
    memoryFreed: 0,
  });

  const isMountedRef = useRef(true);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const memoryManager = getMemoryManager();

  // Register cleanup callbacks
  const cleanupCallbacks = useRef<Set<() => void>>(new Set());

  /**
   * Add a cleanup callback to run when component unmounts or cleans up
   */
  const addCleanupCallback = useCallback(
    (callback: () => void): (() => void) => {
      cleanupCallbacks.current.add(callback);
      return () => cleanupCallbacks.current.delete(callback);
    },
    [],
  );

  /**
   * Execute all cleanup callbacks
   */
  const executeCleanupCallbacks = useCallback(() => {
    if (!isMountedRef.current) return;

    cleanupStateRef.current.isCleaningUp = true;

    try {
      for (const callback of cleanupCallbacks.current) {
        try {
          callback();
        } catch (error) {
          if (fullConfig.enableLogging) {
            console.warn(
              `${fullConfig.logPrefix} Cleanup callback failed:`,
              error,
            );
          }
        }
      }

      cleanupStateRef.current.lastCleanup = Date.now();
      cleanupStateRef.current.cleanupCount++;

      if (fullConfig.enableLogging) {
        console.log(
          `${fullConfig.logPrefix} Executed ${cleanupCallbacks.current.size} cleanup callbacks for chart ${chartId}`,
        );
      }
    } finally {
      cleanupStateRef.current.isCleaningUp = false;
    }
  }, [chartId, fullConfig.enableLogging, fullConfig.logPrefix]);

  /**
   * Schedule delayed cleanup
   */
  const scheduleCleanup = useCallback(
    (delay = fullConfig.cleanupDelay) => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }

      cleanupTimeoutRef.current = setTimeout(() => {
        executeCleanupCallbacks();
      }, delay);
    },
    [executeCleanupCallbacks, fullConfig.cleanupDelay],
  );

  /**
   * Immediate cleanup without delay
   */
  const immediateCleanup = useCallback(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
    executeCleanupCallbacks();
  }, [executeCleanupCallbacks]);

  /**
   * Check if cleanup is needed based on memory usage
   */
  const checkCleanupNeeded = useCallback(async (): Promise<boolean> => {
    try {
      const memorySnapshot = await memoryManager.takeMemorySnapshot();
      const usagePercent =
        memorySnapshot.limit > 0
          ? (memorySnapshot.used / memorySnapshot.limit) * 100
          : 0;

      return usagePercent >= fullConfig.memoryThreshold;
    } catch (error) {
      if (fullConfig.enableLogging) {
        console.warn(
          `${fullConfig.logPrefix} Failed to check memory for cleanup:`,
          error,
        );
      }
      return false;
    }
  }, [
    memoryManager,
    fullConfig.memoryThreshold,
    fullConfig.enableLogging,
    fullConfig.logPrefix,
  ]);

  /**
   * Optimize chart data for large datasets
   */
  const optimizeChartData = useCallback(
    <T extends any[]>(data: T, maxPoints = fullConfig.maxDataPoints): T => {
      if (!Array.isArray(data) || data.length <= maxPoints) {
        return data;
      }

      // Sample data points to reduce memory usage
      const step = Math.ceil(data.length / maxPoints);
      const optimized = data.filter((_, index) => index % step === 0);

      if (fullConfig.enableLogging) {
        console.log(
          `${fullConfig.logPrefix} Optimized chart data from ${data.length} to ${optimized.length} points for chart ${chartId}`,
        );
      }

      return optimized as T;
    },
    [
      chartId,
      fullConfig.maxDataPoints,
      fullConfig.enableLogging,
      fullConfig.logPrefix,
    ],
  );

  /**
   * Get cleanup state information
   */
  const getCleanupState = useCallback(
    () => ({
      ...cleanupStateRef.current,
    }),
    [],
  );

  // Register chart with memory manager
  useEffect(() => {
    memoryManager.registerChart(chartId, chartType, 0);

    return () => {
      memoryManager.unregisterChart(chartId);
    };
  }, [chartId, chartType, memoryManager]);

  // Handle component unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Clear any pending cleanup
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }

      // Immediate cleanup on unmount
      executeCleanupCallbacks();

      // Clear all callbacks
      cleanupCallbacks.current.clear();

      if (fullConfig.enableLogging) {
        console.log(
          `${fullConfig.logPrefix} Chart ${chartId} unmounted - cleanup completed`,
        );
      }
    };
  }, [
    chartId,
    executeCleanupCallbacks,
    fullConfig.enableLogging,
    fullConfig.logPrefix,
  ]);

  // Auto cleanup based on memory usage
  useEffect(() => {
    if (!fullConfig.enableAutoCleanup) return;

    const autoCleanupInterval = setInterval(async () => {
      if (!isMountedRef.current) return;

      const needsCleanup = await checkCleanupNeeded();
      if (needsCleanup && !cleanupStateRef.current.isCleaningUp) {
        if (fullConfig.enableLogging) {
          console.log(
            `${fullConfig.logPrefix} Auto cleanup triggered for chart ${chartId} due to memory pressure`,
          );
        }
        scheduleCleanup(0); // Immediate cleanup for memory pressure
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(autoCleanupInterval);
    };
  }, [
    chartId,
    fullConfig.enableAutoCleanup,
    fullConfig.enableLogging,
    fullConfig.logPrefix,
    checkCleanupNeeded,
    scheduleCleanup,
  ]);

  return {
    // Cleanup actions
    addCleanupCallback,
    scheduleCleanup,
    immediateCleanup,

    // Utilities
    optimizeChartData,
    checkCleanupNeeded,
    getCleanupState,

    // References
    isMountedRef,
    isCleaningUp: cleanupStateRef.current.isCleaningUp,
  };
}

/**
 * Chart data virtualization for large datasets
 */
export class ChartDataVirtualizer<T = any> {
  private data: T[];
  private visibleRange: { start: number; end: number };
  private chunkSize: number;
  private config: Required<ChartCleanupConfig>;

  constructor(
    data: T[],
    chunkSize = 100,
    config: Partial<ChartCleanupConfig> = {},
  ) {
    this.data = data;
    this.chunkSize = chunkSize;
    this.visibleRange = { start: 0, end: Math.min(chunkSize, data.length) };
    this.config = { ...DEFAULT_CLEANUP_CONFIG, ...config };
  }

  /**
   * Get currently visible data chunk
   */
  getVisibleData(): T[] {
    return this.data.slice(this.visibleRange.start, this.visibleRange.end);
  }

  /**
   * Update visible range for virtualization
   */
  updateVisibleRange(start: number, end: number): void {
    this.visibleRange = {
      start: Math.max(0, start),
      end: Math.min(this.data.length, end),
    };

    if (this.config.enableLogging) {
      console.log(
        `${this.config.logPrefix} Updated visible range: ${this.visibleRange.start}-${this.visibleRange.end} (${this.getVisibleData().length} items)`,
      );
    }
  }

  /**
   * Scroll to specific index
   */
  scrollToIndex(index: number): void {
    const start = Math.max(0, index - Math.floor(this.chunkSize / 2));
    const end = Math.min(this.data.length, start + this.chunkSize);
    this.updateVisibleRange(start, end);
  }

  /**
   * Get virtualization statistics
   */
  getStats() {
    return {
      totalItems: this.data.length,
      visibleItems: this.getVisibleData().length,
      visibleRange: this.visibleRange,
      chunkSize: this.chunkSize,
      memoryReduction: Math.round(
        (1 - this.getVisibleData().length / this.data.length) * 100,
      ),
    };
  }
}

/**
 * Memory-efficient chart data processor
 */
export class ChartDataProcessor {
  private config: Required<ChartCleanupConfig>;
  private processedDataCache: Map<string, any> = new Map();

  constructor(config: Partial<ChartCleanupConfig> = {}) {
    this.config = { ...DEFAULT_CLEANUP_CONFIG, ...config };
  }

  /**
   * Process and optimize chart data for memory efficiency
   */
  processChartData<T>(
    data: T[],
    chartType: string,
    cacheKey?: string,
  ): { processedData: T[]; optimized: boolean; memoryEstimate: number } {
    // Check cache first
    if (cacheKey && this.processedDataCache.has(cacheKey)) {
      const cached = this.processedDataCache.get(cacheKey);
      return {
        processedData: cached.data,
        optimized: cached.optimized,
        memoryEstimate: cached.memoryEstimate,
      };
    }

    let processedData = [...data];
    let optimized = false;

    // Apply optimizations based on chart type and data size
    if (data.length > this.config.maxDataPoints) {
      processedData = this.downsampleData(processedData, chartType);
      optimized = true;
    }

    // Estimate memory usage
    const memoryEstimate = this.estimateDataMemory(processedData);

    const result = {
      processedData,
      optimized,
      memoryEstimate,
    };

    // Cache the result
    if (cacheKey) {
      this.processedDataCache.set(cacheKey, {
        data: processedData,
        optimized,
        memoryEstimate,
      });

      // Limit cache size
      if (this.processedDataCache.size > 50) {
        const firstKey = this.processedDataCache.keys().next().value;
        if (firstKey !== undefined) {
          this.processedDataCache.delete(firstKey);
        }
      }
    }

    return result;
  }

  /**
   * Downsample data based on chart type
   */
  private downsampleData<T>(data: T[], chartType: string): T[] {
    const targetSize = this.config.maxDataPoints;

    if (data.length <= targetSize) {
      return data;
    }

    // Different downsampling strategies based on chart type
    switch (chartType) {
      case "line":
      case "area":
        // Use Largest-Triangle-Three-Buckets algorithm for time series
        return this.ltbDownsample(data, targetSize);

      case "scatter":
        // Random sampling for scatter plots
        return this.randomSample(data, targetSize);

      case "bar":
      case "pie":
        // Take top N items by value if possible
        return this.topNSample(data, targetSize);

      default:
        // Simple step sampling
        return this.stepSample(data, targetSize);
    }
  }

  /**
   * Largest-Triangle-Three-Buckets downsampling for time series
   */
  private ltbDownsample<T>(data: T[], targetSize: number): T[] {
    if (data.length <= targetSize || targetSize < 3) {
      return data;
    }

    const bucketSize = (data.length - 2) / (targetSize - 2);
    const buckets: T[] = [];

    // Always include first point
    buckets.push(data[0]);

    for (let i = 1; i < targetSize - 1; i++) {
      const bucketStart = Math.floor(i * bucketSize) + 1;
      const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;

      // Find point with largest area
      let maxArea = 0;
      let maxIndex = bucketStart;

      for (let j = bucketStart; j < Math.min(bucketEnd, data.length); j++) {
        // Simple area calculation (assumes numeric data)
        const area = Math.abs(j - bucketStart) + Math.abs(j - bucketEnd);
        if (area > maxArea) {
          maxArea = area;
          maxIndex = j;
        }
      }

      buckets.push(data[maxIndex]);
    }

    // Always include last point
    buckets.push(data[data.length - 1]);

    return buckets;
  }

  /**
   * Random sampling
   */
  private randomSample<T>(data: T[], targetSize: number): T[] {
    const indices = new Set<number>();

    while (indices.size < targetSize && indices.size < data.length) {
      indices.add(Math.floor(Math.random() * data.length));
    }

    return Array.from(indices)
      .sort((a, b) => a - b)
      .map((i) => data[i]);
  }

  /**
   * Top N sampling (assumes objects with a 'value' property)
   */
  private topNSample<T>(data: T[], targetSize: number): T[] {
    try {
      // Try to sort by value property
      const sortedData = [...data].sort((a: any, b: any) => {
        const valueA = a.value || a.y || a.count || 0;
        const valueB = b.value || b.y || b.count || 0;
        return valueB - valueA;
      });

      return sortedData.slice(0, targetSize);
    } catch {
      // Fall back to step sampling if sorting fails
      return this.stepSample(data, targetSize);
    }
  }

  /**
   * Simple step sampling
   */
  private stepSample<T>(data: T[], targetSize: number): T[] {
    const step = Math.ceil(data.length / targetSize);
    return data.filter((_, index) => index % step === 0);
  }

  /**
   * Estimate memory usage of data
   */
  private estimateDataMemory<T>(data: T[]): number {
    if (data.length === 0) return 0;

    // Rough estimation: 50 bytes per data point on average
    const avgBytesPerPoint = 50;
    return data.length * avgBytesPerPoint;
  }

  /**
   * Clear the data cache
   */
  clearCache(): void {
    this.processedDataCache.clear();

    if (this.config.enableLogging) {
      console.log(`${this.config.logPrefix} Chart data cache cleared`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.processedDataCache.size,
      cachedKeys: Array.from(this.processedDataCache.keys()),
    };
  }
}

/**
 * Global chart data processor instance
 */
let globalDataProcessor: ChartDataProcessor | null = null;

/**
 * Get or create global chart data processor
 */
export function getChartDataProcessor(
  config?: Partial<ChartCleanupConfig>,
): ChartDataProcessor {
  if (!globalDataProcessor) {
    globalDataProcessor = new ChartDataProcessor(config);
  }
  return globalDataProcessor;
}
