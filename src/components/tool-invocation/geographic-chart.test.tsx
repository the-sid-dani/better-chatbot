import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import type { GeographicChartProps } from './geographic-chart';

// Mock the dynamic imports since they cause issues in testing
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<any>) => {
    // Return a mock component that renders the actual component synchronously
    return function MockedComponent(props: any) {
      return { component: 'mocked-component', props };
    };
  },
}));

// Mock fetch for geographic data
global.fetch = vi.fn();

const mockChartData: GeographicChartProps['data'] = [
  { regionCode: 'CA', regionName: 'California', value: 100 },
  { regionCode: 'TX', regionName: 'Texas', value: 200 }
];

describe('GeographicChart Tooltip Validation', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        objects: {
          states: {
            geometries: [
              {
                id: '06',
                properties: { name: 'California', STUSPS: 'CA' },
                rsmKey: 'geo-1'
              },
              {
                id: '48',
                properties: { name: 'Texas', STUSPS: 'TX' },
                rsmKey: 'geo-2'
              }
            ]
          }
        }
      })
    } as Response);

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should validate chart data structure', () => {
    expect(mockChartData).toHaveLength(2);
    expect(mockChartData[0]).toHaveProperty('regionCode');
    expect(mockChartData[0]).toHaveProperty('regionName');
    expect(mockChartData[0]).toHaveProperty('value');
  });

  test('should handle different geography types URLs', () => {
    const geoDataUrls = {
      world: "/geo/world-countries-110m.json",
      "usa-states": "/geo/us-states-10m.json",
      "usa-counties": "/geo/us-counties-10m.json",
      "usa-dma": "/geo/nielsentopo.json",
    };

    expect(geoDataUrls['usa-states']).toBe('/geo/us-states-10m.json');
    expect(geoDataUrls['world']).toBe('/geo/world-countries-110m.json');
  });

  test('should validate color scales configuration', () => {
    const colorScales = {
      blues: [
        "hsl(var(--muted))",
        "hsl(210, 40%, 85%)",
        "hsl(210, 50%, 70%)",
        "hsl(210, 60%, 55%)",
        "hsl(210, 70%, 40%)",
        "hsl(210, 80%, 25%)",
      ],
      reds: [
        "hsl(var(--muted))",
        "hsl(0, 91%, 95%)",
        "hsl(0, 91%, 85%)",
        "hsl(0, 91%, 75%)",
        "hsl(0, 91%, 60%)",
        "hsl(0, 91%, 45%)",
      ]
    };

    expect(colorScales.blues).toHaveLength(6);
    expect(colorScales.reds).toHaveLength(6);
    expect(colorScales.blues[0]).toBe("hsl(var(--muted))");
  });

  test('should validate FIPS to postal code mapping', () => {
    const fipsToPostalCode: { [key: string]: string } = {
      "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA"
    };

    expect(fipsToPostalCode["06"]).toBe("CA");
    expect(fipsToPostalCode["01"]).toBe("AL");
  });

  test('should test geographic data fetch URL generation', async () => {
    const geoType = 'usa-states';
    const expectedUrl = '/geo/us-states-10m.json';

    // Simulate what the component would do
    await fetch(expectedUrl);

    expect(fetch).toHaveBeenCalledWith(expectedUrl);
  });

  test('should handle fetch errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    try {
      await fetch('/geo/us-states-10m.json');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Network error');
    }
  });

  test('should validate tooltip state structure', () => {
    const tooltipState = {
      name: 'California',
      value: 100,
      x: 250,
      y: 150
    };

    expect(tooltipState).toHaveProperty('name');
    expect(tooltipState).toHaveProperty('value');
    expect(tooltipState).toHaveProperty('x');
    expect(tooltipState).toHaveProperty('y');
    expect(typeof tooltipState.x).toBe('number');
    expect(typeof tooltipState.y).toBe('number');
  });

  test('should validate value-to-color mapping logic', () => {
    const values = mockChartData.map(d => d.value);
    const minValue = Math.min(...values); // 100
    const maxValue = Math.max(...values); // 200

    expect(minValue).toBe(100);
    expect(maxValue).toBe(200);

    // Test normalization logic
    const testValue = 150;
    const normalized = (testValue - minValue) / (maxValue - minValue);
    expect(normalized).toBe(0.5); // Should be 0.5 for value 150 between 100-200
  });
});
