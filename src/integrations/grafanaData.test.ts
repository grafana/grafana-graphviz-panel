import { DataFrame, FieldType, createDataFrame, FieldConfigSource, PanelData, GrafanaTheme2 } from '@grafana/data';
import {
  findWideFormatFieldValue,
  findTimeseriesFieldValue,
  validateDotSize,
  extractDotFromQuery,
  applyThresholdToValue,
  findMatchingIdsInWide,
  findMatchingIdsInTimeSeries,
  extractAllStringFieldNames,
  evaluateFieldMatchQuality,
  processDataFieldBindings,
  processWidthRules,
  autodetectMatchField,
} from './grafanaData';
import { DataFormatStrategy, RuleKind, EdgeOverride, NodeOverride } from '../types';

describe('DOT diagram extraction from queries', () => {
  describe('findWideFormatFieldValue', () => {
    it('should find string field in wide format data', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'time',
              type: FieldType.time,
              values: [1609459200000],
              config: {},
            },
            {
              name: 'dot_diagram',
              type: FieldType.string,
              values: ['digraph G { A -> B; }'],
              config: {},
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = findWideFormatFieldValue(frames, 'dot_diagram');
      expect(result).toBe('digraph G { A -> B; }');
    });

    it('should return last value when multiple values exist', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'dot_diagram',
              type: FieldType.string,
              values: ['digraph G { A -> B; }', 'digraph G { X -> Y; }', 'digraph G { P -> Q; }'],
              config: {},
            },
          ],
          length: 3,
        } as DataFrame,
      ];

      const result = findWideFormatFieldValue(frames, 'dot_diagram');
      expect(result).toBe('digraph G { P -> Q; }');
    });

    it('should return null when field not found', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'other_field',
              type: FieldType.string,
              values: ['value'],
              config: {},
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = findWideFormatFieldValue(frames, 'dot_diagram');
      expect(result).toBeNull();
    });

    it('should return null when field has no values', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'dot_diagram',
              type: FieldType.string,
              values: [],
              config: {},
            },
          ],
          length: 0,
        } as DataFrame,
      ];

      const result = findWideFormatFieldValue(frames, 'dot_diagram');
      expect(result).toBeNull();
    });

    it('should return null when field is not string type', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'dot_diagram',
              type: FieldType.number,
              values: [123],
              config: {},
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = findWideFormatFieldValue(frames, 'dot_diagram');
      expect(result).toBeNull();
    });

    it('should search across multiple frames', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'other_field',
              type: FieldType.string,
              values: ['value'],
              config: {},
            },
          ],
          length: 1,
        } as DataFrame,
        {
          fields: [
            {
              name: 'dot_diagram',
              type: FieldType.string,
              values: ['digraph G { A -> B; }'],
              config: {},
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = findWideFormatFieldValue(frames, 'dot_diagram');
      expect(result).toBe('digraph G { A -> B; }');
    });
  });

  it('should return last value from timeseries', () => {
    const frames: DataFrame[] = [
      {
        fields: [
          {
            name: 'time',
            type: FieldType.time,
            values: [1, 2, 3, 4, 5],
            config: {},
          },
          {
            name: 'diagram',
            type: FieldType.string,
            values: ['v1', 'v2', 'v3', 'v4', 'v5'],
            config: {},
          },
        ],
        length: 5,
      } as DataFrame,
    ];

    const result = findTimeseriesFieldValue(frames, 'diagram');
    expect(result).toBe('v5');
  });

  it('should return null when field not found', () => {
    const frames: DataFrame[] = [
      {
        fields: [
          {
            name: 'time',
            type: FieldType.time,
            values: [1609459200000],
            config: {},
          },
          {
            name: 'value',
            type: FieldType.number,
            values: [42],
            config: {},
          },
        ],
        length: 1,
      } as DataFrame,
    ];

    const result = findTimeseriesFieldValue(frames, 'topology');
    expect(result).toBeNull();
  });

  it('should search across multiple frames and return first match', () => {
    const frames: DataFrame[] = [
      {
        fields: [
          {
            name: 'other',
            type: FieldType.string,
            values: ['not this'],
            config: {},
          },
        ],
        length: 1,
      } as DataFrame,
      {
        fields: [
          {
            name: 'diagram',
            type: FieldType.string,
            values: ['found it'],
            config: {},
          },
        ],
        length: 1,
      } as DataFrame,
      {
        fields: [
          {
            name: 'diagram',
            type: FieldType.string,
            values: ['not this one'],
            config: {},
          },
        ],
        length: 1,
      } as DataFrame,
    ];

    const result = findTimeseriesFieldValue(frames, 'diagram');
    expect(result).toBe('found it');
  });
});

describe('validateDotSize', () => {
  it('should not throw for DOT under size limit', () => {
    const dot = 'digraph G { A -> B; }';
    expect(() => validateDotSize(dot, 1024)).not.toThrow();
  });

  it('should not throw for DOT exactly at size limit', () => {
    const dot = 'A'.repeat(1024);
    expect(() => validateDotSize(dot, 1024)).not.toThrow();
  });

  it('should throw for DOT over size limit', () => {
    const dot = 'A'.repeat(1025);
    expect(() => validateDotSize(dot, 1024)).toThrow('DOT diagram too large');
  });

  it('should include size information in error message', () => {
    const dot = 'A'.repeat(2048);
    expect(() => validateDotSize(dot, 1024)).toThrow('2.0 KB exceeds limit of 1 KB');
  });

  it('should handle fractional KB sizes', () => {
    const dot = 'A'.repeat(1536);
    expect(() => validateDotSize(dot, 1024)).toThrow('1.5 KB exceeds limit of 1 KB');
  });
});

describe('extractDotFromQuery', () => {
  it('should return null for empty series array', () => {
    const result = extractDotFromQuery([], 'dot_diagram');
    expect(result).toBeNull();
  });

  it('should return null for empty field name', () => {
    const frames: DataFrame[] = [
      {
        fields: [
          {
            name: 'diagram',
            type: FieldType.string,
            values: ['digraph G {}'],
            config: {},
          },
        ],
        length: 1,
      } as DataFrame,
    ];

    const result = extractDotFromQuery(frames, '');
    expect(result).toBeNull();
  });

  it('should extract DOT from WIDE format', () => {
    const frames: DataFrame[] = [
      {
        fields: [
          {
            name: 'time',
            type: FieldType.time,
            values: [1609459200000],
            config: {},
          },
          {
            name: 'dot_diagram',
            type: FieldType.string,
            values: ['digraph Wide { A -> B; }'],
            config: {},
          },
        ],
        length: 1,
      } as DataFrame,
    ];

    const result = extractDotFromQuery(frames, 'dot_diagram');
    expect(result).toBe('digraph Wide { A -> B; }');
  });

  it('should extract DOT from TIMESERIES format', () => {
    const frames: DataFrame[] = [
      {
        name: 'topology',
        fields: [
          {
            name: 'time',
            type: FieldType.time,
            values: [1, 2, 3],
            config: {},
          },
          {
            name: 'diagram',
            type: FieldType.string,
            values: ['v1', 'v2', 'digraph Timeseries { X -> Y; }'],
            config: {},
          },
        ],
        length: 3,
      } as DataFrame,
    ];

    const result = extractDotFromQuery(frames, 'diagram');
    expect(result).toBe('digraph Timeseries { X -> Y; }');
  });

  it('should use custom maxSizeBytes parameter', () => {
    const frames: DataFrame[] = [
      {
        fields: [
          {
            name: 'dot',
            type: FieldType.string,
            values: ['A'.repeat(100)],
            config: {},
          },
        ],
        length: 1,
      } as DataFrame,
    ];

    expect(() => extractDotFromQuery(frames, 'dot', 50)).toThrow('DOT diagram too large');
  });

  it('should use default maxSizeBytes when not specified', () => {
    const frames: DataFrame[] = [
      {
        fields: [
          {
            name: 'dot',
            type: FieldType.string,
            values: ['digraph G { A -> B; }'],
            config: {},
          },
        ],
        length: 1,
      } as DataFrame,
    ];

    const result = extractDotFromQuery(frames, 'dot');
    expect(result).toBe('digraph G { A -> B; }');
  });

  it('should return null when field value is not a string', () => {
    const frames: DataFrame[] = [
      {
        fields: [
          {
            name: 'dot',
            type: FieldType.string,
            values: [null as any],
            config: {},
          },
        ],
        length: 1,
      } as DataFrame,
    ];

    const result = extractDotFromQuery(frames, 'dot');
    expect(result).toBeNull();
  });

  it('should return null when no matching field found', () => {
    const frames: DataFrame[] = [
      {
        fields: [
          {
            name: 'other_field',
            type: FieldType.string,
            values: ['value'],
            config: {},
          },
        ],
        length: 1,
      } as DataFrame,
    ];

    const result = extractDotFromQuery(frames, 'dot_diagram');
    expect(result).toBeNull();
  });

  it('should handle MIXED format by trying timeseries then wide', () => {
    const frames: DataFrame[] = [
      {
        name: 'timeseries',
        fields: [
          {
            name: 'time',
            type: FieldType.time,
            values: [1, 2],
            config: {},
          },
          {
            name: 'value',
            type: FieldType.number,
            values: [10, 20],
            config: {},
          },
        ],
        length: 2,
      } as DataFrame,
      {
        name: 'wide',
        fields: [
          {
            name: 'diagram',
            type: FieldType.string,
            values: ['digraph Mixed { A -> B; }'],
            config: {},
          },
        ],
        length: 1,
      } as DataFrame,
    ];

    const result = extractDotFromQuery(frames, 'diagram');
    expect(result).toBe('digraph Mixed { A -> B; }');
  });
});

describe('Data format detection and row matching', () => {
  const { detectDataFormatStrategy, findMatchedRow } = require('./grafanaData');
  const { DataFormatStrategy } = require('../types');

  describe('detectDataFormatStrategy', () => {
    it('should return WIDE for empty series', () => {
      const result = detectDataFormatStrategy([]);
      expect(result).toBe(DataFormatStrategy.WIDE);
    });

    it('should return WIDE for wide format data', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'id', type: FieldType.string, values: ['A', 'B'], config: {} },
            { name: 'value', type: FieldType.number, values: [1, 2], config: {} },
          ],
          length: 2,
        } as DataFrame,
      ];

      const result = detectDataFormatStrategy(frames);
      expect(result).toBe(DataFormatStrategy.WIDE);
    });
  });

  describe('findMatchedRow', () => {
    it('should find row by exact match', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'node_id', type: FieldType.string, values: ['A', 'B', 'C'], config: {} },
            { name: 'status', type: FieldType.string, values: ['active', 'inactive', 'pending'], config: {} },
          ],
          length: 3,
        } as DataFrame,
      ];

      const result = findMatchedRow(frames, 'node_id', 'B');
      expect(result).toEqual({ node_id: 'B', status: 'inactive' });
    });

    it('should return undefined when no match found', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'node_id', type: FieldType.string, values: ['A', 'B'], config: {} },
            { name: 'value', type: FieldType.number, values: [1, 2], config: {} },
          ],
          length: 2,
        } as DataFrame,
      ];

      const result = findMatchedRow(frames, 'node_id', 'Z');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty series', () => {
      const result = findMatchedRow([], 'field', 'value');
      expect(result).toBeUndefined();
    });

    it('should find first matching row when multiple matches exist', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'status', type: FieldType.string, values: ['active', 'active', 'inactive'], config: {} },
            { name: 'count', type: FieldType.number, values: [10, 20, 5], config: {} },
          ],
          length: 3,
        } as DataFrame,
      ];

      const result = findMatchedRow(frames, 'status', 'active');
      expect(result).toEqual({ status: 'active', count: 10 });
    });
  });
});

describe('Threshold application', () => {
  describe('applyThresholdToValue', () => {
    it('should return color for value matching exact threshold', () => {
      const threshold = {
        id: 'test',
        name: 'Test Threshold',
        steps: [
          { value: 0, color: 'green' },
          { value: 50, color: 'yellow' },
          { value: 100, color: 'red' },
        ],
      };

      expect(applyThresholdToValue(100, threshold)).toBe('red');
      expect(applyThresholdToValue(50, threshold)).toBe('yellow');
      expect(applyThresholdToValue(0, threshold)).toBe('green');
    });

    it('should return color for highest threshold when value exceeds all', () => {
      const threshold = {
        id: 'test',
        name: 'Test',
        steps: [
          { value: 0, color: 'green' },
          { value: 50, color: 'yellow' },
          { value: 100, color: 'red' },
        ],
      };

      expect(applyThresholdToValue(150, threshold)).toBe('red');
      expect(applyThresholdToValue(200, threshold)).toBe('red');
    });

    it('should return appropriate color for values between thresholds', () => {
      const threshold = {
        id: 'test',
        name: 'Test',
        steps: [
          { value: 0, color: 'green' },
          { value: 50, color: 'yellow' },
          { value: 100, color: 'red' },
        ],
      };

      expect(applyThresholdToValue(25, threshold)).toBe('green');
      expect(applyThresholdToValue(75, threshold)).toBe('yellow');
      expect(applyThresholdToValue(99, threshold)).toBe('yellow');
    });

    it('should handle single threshold step', () => {
      const threshold = {
        id: 'test',
        name: 'Test',
        steps: [{ value: 0, color: 'blue' }],
      };

      expect(applyThresholdToValue(0, threshold)).toBe('blue');
      expect(applyThresholdToValue(100, threshold)).toBe('blue');
    });

    it('should handle negative values', () => {
      const threshold = {
        id: 'test',
        name: 'Test',
        steps: [
          { value: -100, color: 'red' },
          { value: 0, color: 'yellow' },
          { value: 100, color: 'green' },
        ],
      };

      expect(applyThresholdToValue(-50, threshold)).toBe('red');
      expect(applyThresholdToValue(-100, threshold)).toBe('red');
      expect(applyThresholdToValue(-150, threshold)).toBe('red');
    });

    it('should sort threshold steps correctly', () => {
      const threshold = {
        id: 'test',
        name: 'Test',
        steps: [
          { value: 100, color: 'red' },
          { value: 0, color: 'green' },
          { value: 50, color: 'yellow' },
        ],
      };

      expect(applyThresholdToValue(25, threshold)).toBe('green');
      expect(applyThresholdToValue(75, threshold)).toBe('yellow');
      expect(applyThresholdToValue(150, threshold)).toBe('red');
    });

    it('should return lowest threshold color for value below all thresholds', () => {
      const threshold = {
        id: 'test',
        name: 'Test',
        steps: [
          { value: 10, color: 'green' },
          { value: 50, color: 'yellow' },
        ],
      };

      expect(applyThresholdToValue(5, threshold)).toBe('green');
    });

    it('should handle empty steps array', () => {
      const threshold = {
        id: 'test',
        name: 'Test',
        steps: [],
      };

      expect(applyThresholdToValue(50, threshold)).toBeUndefined();
    });
  });
});

describe('ID matching in data frames', () => {
  describe('findMatchingIdsInWide', () => {
    it('should find all matching IDs in wide format', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'node_id', type: FieldType.string, values: ['A', 'B', 'C'], config: {} },
            { name: 'value', type: FieldType.number, values: [1, 2, 3], config: {} },
          ],
          length: 3,
        } as DataFrame,
      ];

      const result = findMatchingIdsInWide(frames, 'node_id', ['A', 'B', 'D']);

      expect(result.matchedIds).toEqual(['A', 'B']);
      expect(result.unmatchedIds).toEqual(['D']);
    });

    it('should return empty arrays when no matches found', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'node_id', type: FieldType.string, values: ['A', 'B'], config: {} }],
          length: 2,
        } as DataFrame,
      ];

      const result = findMatchingIdsInWide(frames, 'node_id', ['X', 'Y', 'Z']);

      expect(result.matchedIds).toEqual([]);
      expect(result.unmatchedIds).toEqual(['X', 'Y', 'Z']);
    });

    it('should find all IDs when all match', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'id', type: FieldType.string, values: ['A', 'B', 'C'], config: {} }],
          length: 3,
        } as DataFrame,
      ];

      const result = findMatchingIdsInWide(frames, 'id', ['A', 'B', 'C']);

      expect(result.matchedIds).toEqual(['A', 'B', 'C']);
      expect(result.unmatchedIds).toEqual([]);
    });

    it('should handle empty target IDs', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'id', type: FieldType.string, values: ['A'], config: {} }],
          length: 1,
        } as DataFrame,
      ];

      const result = findMatchingIdsInWide(frames, 'id', []);

      expect(result.matchedIds).toEqual([]);
      expect(result.unmatchedIds).toEqual([]);
    });

    it('should handle field not present in frame', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'other_field', type: FieldType.string, values: ['A'], config: {} }],
          length: 1,
        } as DataFrame,
      ];

      const result = findMatchingIdsInWide(frames, 'node_id', ['A', 'B']);

      expect(result.matchedIds).toEqual([]);
      expect(result.unmatchedIds).toEqual(['A', 'B']);
    });

    it('should search across multiple frames', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'id', type: FieldType.string, values: ['A', 'B'], config: {} }],
          length: 2,
        } as DataFrame,
        {
          fields: [{ name: 'id', type: FieldType.string, values: ['C', 'D'], config: {} }],
          length: 2,
        } as DataFrame,
      ];

      const result = findMatchingIdsInWide(frames, 'id', ['A', 'C', 'E']);

      expect(result.matchedIds).toEqual(['A', 'C']);
      expect(result.unmatchedIds).toEqual(['E']);
    });

    it('should handle duplicate target IDs', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'id', type: FieldType.string, values: ['A', 'B'], config: {} }],
          length: 2,
        } as DataFrame,
      ];

      const result = findMatchingIdsInWide(frames, 'id', ['A', 'A', 'B']);

      expect(result.matchedIds).toEqual(['A', 'A', 'B']);
      expect(result.unmatchedIds).toEqual([]);
    });

    it('should convert field values to strings for comparison', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'id', type: FieldType.string, values: ['123', '456'], config: {} }],
          length: 2,
        } as DataFrame,
      ];

      const result = findMatchingIdsInWide(frames, 'id', ['123', '789']);

      expect(result.matchedIds).toEqual(['123']);
      expect(result.unmatchedIds).toEqual(['789']);
    });
  });

  describe('findMatchingIdsInTimeSeries', () => {
    it('should find matching IDs in timeseries labels', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'value',
              type: FieldType.number,
              values: [10],
              config: {},
              labels: { node: 'A', region: 'us-east' },
            },
            {
              name: 'value',
              type: FieldType.number,
              values: [20],
              config: {},
              labels: { node: 'B', region: 'us-west' },
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = findMatchingIdsInTimeSeries(frames, 'node', ['A', 'B', 'C']);

      expect(result.matchedIds).toEqual(['A', 'B']);
      expect(result.unmatchedIds).toEqual(['C']);
    });

    it('should return empty arrays when no matches found', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'value',
              type: FieldType.number,
              values: [10],
              config: {},
              labels: { node: 'A' },
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = findMatchingIdsInTimeSeries(frames, 'node', ['X', 'Y']);

      expect(result.matchedIds).toEqual([]);
      expect(result.unmatchedIds).toEqual(['X', 'Y']);
    });

    it('should handle fields without labels', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'value',
              type: FieldType.number,
              values: [10],
              config: {},
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = findMatchingIdsInTimeSeries(frames, 'node', ['A', 'B']);

      expect(result.matchedIds).toEqual([]);
      expect(result.unmatchedIds).toEqual(['A', 'B']);
    });

    it('should handle label not present on all fields', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'value',
              type: FieldType.number,
              values: [10],
              config: {},
              labels: { node: 'A', region: 'east' },
            },
            {
              name: 'value',
              type: FieldType.number,
              values: [20],
              config: {},
              labels: { region: 'west' },
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = findMatchingIdsInTimeSeries(frames, 'node', ['A', 'B']);

      expect(result.matchedIds).toEqual(['A']);
      expect(result.unmatchedIds).toEqual(['B']);
    });

    it('should search across multiple frames', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'value',
              type: FieldType.number,
              values: [10],
              config: {},
              labels: { node: 'A' },
            },
          ],
          length: 1,
        } as DataFrame,
        {
          fields: [
            {
              name: 'value',
              type: FieldType.number,
              values: [20],
              config: {},
              labels: { node: 'B' },
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = findMatchingIdsInTimeSeries(frames, 'node', ['A', 'B', 'C']);

      expect(result.matchedIds).toEqual(['A', 'B']);
      expect(result.unmatchedIds).toEqual(['C']);
    });

    it('should handle empty target IDs', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'value',
              type: FieldType.number,
              values: [10],
              config: {},
              labels: { node: 'A' },
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = findMatchingIdsInTimeSeries(frames, 'node', []);

      expect(result.matchedIds).toEqual([]);
      expect(result.unmatchedIds).toEqual([]);
    });
  });
});

describe('String field extraction', () => {
  describe('extractAllStringFieldNames', () => {
    it('should extract string field names from wide format', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'id', type: FieldType.string, values: [], config: {} },
            { name: 'count', type: FieldType.number, values: [], config: {} },
            { name: 'status', type: FieldType.string, values: [], config: {} },
          ],
          length: 0,
        } as DataFrame,
      ];

      const result = extractAllStringFieldNames(frames);

      expect(result).toEqual(['id', 'status']);
    });

    it('should extract label names from timeseries format', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'value',
              type: FieldType.number,
              values: [10],
              config: {},
              labels: { node: 'A', region: 'us-east' },
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = extractAllStringFieldNames(frames);

      expect(result).toEqual(['node', 'region']);
    });

    it('should combine string fields and labels', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'id', type: FieldType.string, values: [], config: {} },
            {
              name: 'value',
              type: FieldType.number,
              values: [10],
              config: {},
              labels: { region: 'us-east' },
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = extractAllStringFieldNames(frames);

      expect(result).toEqual(['id', 'region']);
    });

    it('should deduplicate field names', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'id', type: FieldType.string, values: [], config: {} }],
          length: 0,
        } as DataFrame,
        {
          fields: [{ name: 'id', type: FieldType.string, values: [], config: {} }],
          length: 0,
        } as DataFrame,
      ];

      const result = extractAllStringFieldNames(frames);

      expect(result).toEqual(['id']);
    });

    it('should return sorted field names', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'zebra', type: FieldType.string, values: [], config: {} },
            { name: 'alpha', type: FieldType.string, values: [], config: {} },
            { name: 'beta', type: FieldType.string, values: [], config: {} },
          ],
          length: 0,
        } as DataFrame,
      ];

      const result = extractAllStringFieldNames(frames);

      expect(result).toEqual(['alpha', 'beta', 'zebra']);
    });

    it('should return empty array for empty frames', () => {
      const result = extractAllStringFieldNames([]);

      expect(result).toEqual([]);
    });

    it('should ignore non-string fields', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'count', type: FieldType.number, values: [], config: {} },
            { name: 'time', type: FieldType.time, values: [], config: {} },
            { name: 'bool', type: FieldType.boolean, values: [], config: {} },
          ],
          length: 0,
        } as DataFrame,
      ];

      const result = extractAllStringFieldNames(frames);

      expect(result).toEqual([]);
    });

    it('should handle frames with no fields', () => {
      const frames: DataFrame[] = [
        {
          fields: [],
          length: 0,
        } as DataFrame,
      ];

      const result = extractAllStringFieldNames(frames);

      expect(result).toEqual([]);
    });
  });
});

describe('Field match quality evaluation', () => {
  describe('evaluateFieldMatchQuality', () => {
    it('should evaluate match quality for WIDE format', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'node_id', type: FieldType.string, values: ['A', 'B', 'C'], config: {} },
            { name: 'value', type: FieldType.number, values: [1, 2, 3], config: {} },
          ],
          length: 3,
        } as DataFrame,
      ];

      const result = evaluateFieldMatchQuality(frames, 'node_id', ['A', 'B', 'D'], DataFormatStrategy.WIDE);

      expect(result.fieldName).toBe('node_id');
      expect(result.matchedIds).toEqual(['A', 'B']);
      expect(result.unmatchedIds).toEqual(['D']);
      expect(result.matchPercentage).toBeCloseTo(66.67, 1);
    });

    it('should evaluate match quality for TIMESERIES format', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'value',
              type: FieldType.number,
              values: [10],
              config: {},
              labels: { node: 'A' },
            },
            {
              name: 'value',
              type: FieldType.number,
              values: [20],
              config: {},
              labels: { node: 'B' },
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = evaluateFieldMatchQuality(frames, 'node', ['A', 'B', 'C'], DataFormatStrategy.TIMESERIES);

      expect(result.matchedIds).toEqual(['A', 'B']);
      expect(result.unmatchedIds).toEqual(['C']);
      expect(result.matchPercentage).toBeCloseTo(66.67, 1);
    });

    it('should combine results for MIXED format', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'id', type: FieldType.string, values: ['A'], config: {} }],
          length: 1,
        } as DataFrame,
        {
          fields: [
            {
              name: 'value',
              type: FieldType.number,
              values: [10],
              config: {},
              labels: { id: 'B' },
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = evaluateFieldMatchQuality(frames, 'id', ['A', 'B', 'C'], DataFormatStrategy.MIXED);

      expect(result.matchedIds).toContain('A');
      expect(result.matchedIds).toContain('B');
      expect(result.matchedIds).toHaveLength(2);
      expect(result.unmatchedIds).toEqual(['C']);
      expect(result.matchPercentage).toBeCloseTo(66.67, 1);
    });

    it('should calculate 0% match when no IDs match', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'id', type: FieldType.string, values: ['X', 'Y'], config: {} }],
          length: 2,
        } as DataFrame,
      ];

      const result = evaluateFieldMatchQuality(frames, 'id', ['A', 'B'], DataFormatStrategy.WIDE);

      expect(result.matchPercentage).toBe(0);
    });

    it('should calculate 100% match when all IDs match', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'id', type: FieldType.string, values: ['A', 'B', 'C'], config: {} }],
          length: 3,
        } as DataFrame,
      ];

      const result = evaluateFieldMatchQuality(frames, 'id', ['A', 'B', 'C'], DataFormatStrategy.WIDE);

      expect(result.matchPercentage).toBe(100);
    });

    it('should handle empty target IDs', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'id', type: FieldType.string, values: ['A'], config: {} }],
          length: 1,
        } as DataFrame,
      ];

      const result = evaluateFieldMatchQuality(frames, 'id', [], DataFormatStrategy.WIDE);

      expect(result.matchPercentage).toBe(0);
      expect(result.matchedIds).toEqual([]);
      expect(result.unmatchedIds).toEqual([]);
    });

    it('should deduplicate matches in MIXED format', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'id', type: FieldType.string, values: ['A', 'B'], config: {} }],
          length: 2,
        } as DataFrame,
        {
          fields: [
            {
              name: 'value',
              type: FieldType.number,
              values: [10],
              config: {},
              labels: { id: 'A' },
            },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = evaluateFieldMatchQuality(frames, 'id', ['A', 'B'], DataFormatStrategy.MIXED);

      expect(result.matchedIds).toEqual(['A', 'B']);
      expect(result.matchPercentage).toBe(100);
    });
  });
});

describe('Integration functions - Phase 2', () => {
  describe('autodetectMatchField', () => {
    it('should return undefined for empty series', () => {
      const result = autodetectMatchField([], ['A', 'B']);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty target IDs', () => {
      const frames = [
        createDataFrame({
          fields: [{ name: 'id', type: FieldType.string, values: ['A', 'B'] }],
        }),
      ];

      const result = autodetectMatchField(frames, []);
      expect(result).toBeUndefined();
    });

    it('should detect best matching field in wide format', () => {
      const frames = [
        createDataFrame({
          fields: [
            { name: 'node_id', type: FieldType.string, values: ['A', 'B', 'C'] },
            { name: 'other_id', type: FieldType.string, values: ['X', 'Y', 'Z'] },
            { name: 'value', type: FieldType.number, values: [1, 2, 3] },
          ],
        }),
      ];

      const result = autodetectMatchField(frames, ['A', 'B', 'C']);

      expect(result).toBeDefined();
      expect(result?.matchFieldName).toBe('node_id');
      expect(result?.matchPercentage).toBe(100);
      expect(result?.matchedIds).toEqual(['A', 'B', 'C']);
      expect(result?.unmatchedIds).toEqual([]);
    });

    it('should detect partial matches and calculate percentage', () => {
      const frames = [
        createDataFrame({
          fields: [{ name: 'id', type: FieldType.string, values: ['A', 'B'] }],
        }),
      ];

      const result = autodetectMatchField(frames, ['A', 'B', 'C', 'D']);

      expect(result).toBeDefined();
      expect(result?.matchPercentage).toBe(50);
      expect(result?.matchedIds).toEqual(['A', 'B']);
      expect(result?.unmatchedIds).toEqual(['C', 'D']);
    });

    it('should prefer field with higher match percentage', () => {
      const frames = [
        createDataFrame({
          fields: [
            { name: 'partial_match', type: FieldType.string, values: ['A'] },
            { name: 'full_match', type: FieldType.string, values: ['A', 'B', 'C'] },
          ],
        }),
      ];

      const result = autodetectMatchField(frames, ['A', 'B', 'C']);

      expect(result?.matchFieldName).toBe('full_match');
      expect(result?.matchPercentage).toBe(100);
    });

    it('should detect matches in timeseries format', () => {
      const frames: DataFrame[] = [
        {
          name: 'timeseries',
          fields: [
            {
              name: 'time',
              type: FieldType.time,
              values: [1, 2],
              config: {},
            },
            {
              name: 'valueA',
              type: FieldType.number,
              values: [10],
              config: {},
              labels: { node: 'A' },
            },
            {
              name: 'valueB',
              type: FieldType.number,
              values: [20],
              config: {},
              labels: { node: 'B' },
            },
          ],
          length: 2,
        } as DataFrame,
      ];

      const result = autodetectMatchField(frames, ['A', 'B']);

      expect(result).toBeDefined();
      expect(result?.matchFieldName).toBe('node');
      expect(result?.matchPercentage).toBe(100);
    });

    it('should return undefined when no matches found', () => {
      const frames = [
        createDataFrame({
          fields: [{ name: 'id', type: FieldType.string, values: ['X', 'Y', 'Z'] }],
        }),
      ];

      const result = autodetectMatchField(frames, ['A', 'B', 'C']);

      expect(result).toBeUndefined();
    });

    it('should return undefined when no string fields available', () => {
      const frames = [
        createDataFrame({
          fields: [
            { name: 'count', type: FieldType.number, values: [1, 2, 3] },
            { name: 'time', type: FieldType.time, values: [1, 2, 3] },
          ],
        }),
      ];

      const result = autodetectMatchField(frames, ['A', 'B']);

      expect(result).toBeUndefined();
    });

    it('should sort by match percentage then alphabetically', () => {
      const frames = [
        createDataFrame({
          fields: [
            { name: 'zebra', type: FieldType.string, values: ['A', 'B'] },
            { name: 'alpha', type: FieldType.string, values: ['A', 'B'] },
          ],
        }),
      ];

      const result = autodetectMatchField(frames, ['A', 'B']);

      expect(result?.matchFieldName).toBe('alpha');
    });
  });

  describe('processDataFieldBindings', () => {
    const mockTheme = {} as GrafanaTheme2;
    const mockFieldConfig = {} as FieldConfigSource;

    it('should return empty maps for empty series', () => {
      const data = { series: [], state: 'Done', timeRange: {} as any } as PanelData;

      const result = processDataFieldBindings(data, mockFieldConfig, [], [], [], mockTheme);

      expect(result.nodeBorderColors.size).toBe(0);
      expect(result.nodeFillColors.size).toBe(0);
      expect(result.edgeColors.size).toBe(0);
    });

    it('should process node border color rules', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [
              { name: 'node_id', type: FieldType.string, values: ['A'] },
              {
                name: 'status',
                type: FieldType.number,
                values: [50],
                config: {
                  color: { mode: 'thresholds' },
                },
                display: (value: any) => ({ text: value.toString(), numeric: value, color: 'green' }),
              },
            ],
          }),
        ],
      } as PanelData;

      const nodeOverrides: NodeOverride[] = [
        {
          id: 'override1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          matchValue: 'A',
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              colorFieldName: 'status',
            },
          ],
        },
      ];

      const result = processDataFieldBindings(data, mockFieldConfig, nodeOverrides, [], [], mockTheme);

      expect(result.nodeBorderColors.has('A')).toBe(true);
    });

    it('should process node fill color rules', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [
              { name: 'node_id', type: FieldType.string, values: ['A'] },
              {
                name: 'health',
                type: FieldType.number,
                values: [80],
                display: (value: any) => ({ text: value.toString(), numeric: value, color: 'blue' }),
              },
            ],
          }),
        ],
      } as PanelData;

      const nodeOverrides: NodeOverride[] = [
        {
          id: 'override1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          matchValue: 'A',
          rules: [
            {
              kind: RuleKind.FILL_COLOR,
              colorFieldName: 'health',
            },
          ],
        },
      ];

      const result = processDataFieldBindings(data, mockFieldConfig, nodeOverrides, [], [], mockTheme);

      expect(result.nodeFillColors.has('A')).toBe(true);
    });

    it('should process edge color rules', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [
              { name: 'edge_id', type: FieldType.string, values: ['A->B'] },
              {
                name: 'bandwidth',
                type: FieldType.number,
                values: [100],
                display: (value: any) => ({ text: value.toString(), numeric: value, color: 'red' }),
              },
            ],
          }),
        ],
      } as PanelData;

      const edgeOverrides: EdgeOverride[] = [
        {
          id: 'override1',
          targetEdgeIds: ['A->B'],
          matchFieldName: 'edge_id',
          matchValue: 'A->B',
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              colorFieldName: 'bandwidth',
            },
          ],
        },
      ];

      const result = processDataFieldBindings(data, mockFieldConfig, [], edgeOverrides, [], mockTheme);

      expect(result.edgeColors.has('A->B')).toBe(true);
    });

    it('should use matchPattern with ${id} replacement', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [
              { name: 'node_id', type: FieldType.string, values: ['prefix_A_suffix', 'prefix_B_suffix'] },
              {
                name: 'value',
                type: FieldType.number,
                values: [10, 20],
                display: (value: any) => ({ text: value.toString(), numeric: value, color: 'yellow' }),
              },
            ],
          }),
        ],
      } as PanelData;

      const nodeOverrides: NodeOverride[] = [
        {
          id: 'override1',
          targetNodeIds: ['A', 'B'],
          matchFieldName: 'node_id',
          matchPattern: 'prefix_${id}_suffix',
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              colorFieldName: 'value',
            },
          ],
        },
      ];

      const result = processDataFieldBindings(data, mockFieldConfig, nodeOverrides, [], [], mockTheme);

      expect(result.nodeBorderColors.has('A')).toBe(true);
      expect(result.nodeBorderColors.has('B')).toBe(true);
    });

    it('should process multiple nodes with same override', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [
              { name: 'id', type: FieldType.string, values: ['A', 'B', 'C'] },
              {
                name: 'status',
                type: FieldType.number,
                values: [10, 20, 30],
                display: (value: any) => ({ text: value.toString(), numeric: value, color: 'orange' }),
              },
            ],
          }),
        ],
      } as PanelData;

      const nodeOverrides: NodeOverride[] = [
        {
          id: 'override1',
          targetNodeIds: ['A', 'B'],
          matchFieldName: 'id',
          matchPattern: '${id}',
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              colorFieldName: 'status',
            },
          ],
        },
      ];

      const result = processDataFieldBindings(data, mockFieldConfig, nodeOverrides, [], [], mockTheme);

      expect(result.nodeBorderColors.size).toBe(2);
      expect(result.nodeBorderColors.has('A')).toBe(true);
      expect(result.nodeBorderColors.has('B')).toBe(true);
    });

    it('should skip rules without matchFieldName', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [{ name: 'id', type: FieldType.string, values: ['A'] }],
          }),
        ],
      } as PanelData;

      const nodeOverrides: NodeOverride[] = [
        {
          id: 'override1',
          targetNodeIds: ['A'],
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              colorFieldName: 'status',
            },
          ],
        },
      ];

      const result = processDataFieldBindings(data, mockFieldConfig, nodeOverrides, [], [], mockTheme);

      expect(result.nodeBorderColors.size).toBe(0);
    });

    it('should skip rules without colorFieldName', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [{ name: 'id', type: FieldType.string, values: ['A'] }],
          }),
        ],
      } as PanelData;

      const nodeOverrides: NodeOverride[] = [
        {
          id: 'override1',
          targetNodeIds: ['A'],
          matchFieldName: 'id',
          matchValue: 'A',
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
            },
          ],
        },
      ];

      const result = processDataFieldBindings(data, mockFieldConfig, nodeOverrides, [], [], mockTheme);

      expect(result.nodeBorderColors.size).toBe(0);
    });

    it('should handle multiple rule types on same node', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [
              { name: 'id', type: FieldType.string, values: ['A'] },
              {
                name: 'border',
                type: FieldType.number,
                values: [50],
                display: (value: any) => ({ text: value.toString(), numeric: value, color: 'red' }),
              },
              {
                name: 'fill',
                type: FieldType.number,
                values: [80],
                display: (value: any) => ({ text: value.toString(), numeric: value, color: 'blue' }),
              },
            ],
          }),
        ],
      } as PanelData;

      const nodeOverrides: NodeOverride[] = [
        {
          id: 'override1',
          targetNodeIds: ['A'],
          matchFieldName: 'id',
          matchValue: 'A',
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              colorFieldName: 'border',
            },
            {
              kind: RuleKind.FILL_COLOR,
              colorFieldName: 'fill',
            },
          ],
        },
      ];

      const result = processDataFieldBindings(data, mockFieldConfig, nodeOverrides, [], [], mockTheme);

      expect(result.nodeBorderColors.has('A')).toBe(true);
      expect(result.nodeFillColors.has('A')).toBe(true);
    });
  });

  describe('processWidthRules', () => {
    it('should return empty map for empty series', () => {
      const data = { series: [], state: 'Done', timeRange: {} as any } as PanelData;

      const result = processWidthRules(data, []);

      expect(result.edgeWidths.size).toBe(0);
    });

    it('should process dynamic width rules from data', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [
              { name: 'edge_id', type: FieldType.string, values: ['A->B'] },
              { name: 'bandwidth', type: FieldType.number, values: [100] },
            ],
          }),
        ],
      } as PanelData;

      const edgeOverrides: EdgeOverride[] = [
        {
          id: 'override1',
          targetEdgeIds: ['A->B'],
          matchFieldName: 'edge_id',
          matchValue: 'A->B',
          rules: [
            {
              kind: RuleKind.STROKE_WIDTH,
              widthFieldName: 'bandwidth',
            },
          ],
        },
      ];

      const result = processWidthRules(data, edgeOverrides);

      expect(result.edgeWidths.has('A->B')).toBe(true);
      expect(result.edgeWidths.get('A->B')).toBe(100);
    });

    it('should process static width rules', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [{ name: 'id', type: FieldType.string, values: ['A->B'] }],
          }),
        ],
      } as PanelData;

      const edgeOverrides: EdgeOverride[] = [
        {
          id: 'override1',
          targetEdgeIds: ['A->B', 'B->C'],
          rules: [
            {
              kind: RuleKind.STROKE_WIDTH,
              staticWidth: 5,
            },
          ],
        },
      ];

      const result = processWidthRules(data, edgeOverrides);

      expect(result.edgeWidths.get('A->B')).toBe(5);
      expect(result.edgeWidths.get('B->C')).toBe(5);
    });

    it('should use matchPattern with ${id} replacement', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [
              { name: 'edge_id', type: FieldType.string, values: ['edge_A->B', 'edge_B->C'] },
              { name: 'width', type: FieldType.number, values: [2, 3] },
            ],
          }),
        ],
      } as PanelData;

      const edgeOverrides: EdgeOverride[] = [
        {
          id: 'override1',
          targetEdgeIds: ['A->B', 'B->C'],
          matchFieldName: 'edge_id',
          matchPattern: 'edge_${id}',
          rules: [
            {
              kind: RuleKind.STROKE_WIDTH,
              widthFieldName: 'width',
            },
          ],
        },
      ];

      const result = processWidthRules(data, edgeOverrides);

      expect(result.edgeWidths.has('A->B')).toBe(true);
      expect(result.edgeWidths.has('B->C')).toBe(true);
    });

    it('should process multiple edges from same override', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [
              { name: 'id', type: FieldType.string, values: ['A->B', 'B->C', 'C->D'] },
              { name: 'width', type: FieldType.number, values: [10, 20, 30] },
            ],
          }),
        ],
      } as PanelData;

      const edgeOverrides: EdgeOverride[] = [
        {
          id: 'override1',
          targetEdgeIds: ['A->B', 'B->C'],
          matchFieldName: 'id',
          matchPattern: '${id}',
          rules: [
            {
              kind: RuleKind.STROKE_WIDTH,
              widthFieldName: 'width',
            },
          ],
        },
      ];

      const result = processWidthRules(data, edgeOverrides);

      expect(result.edgeWidths.size).toBe(2);
      expect(result.edgeWidths.get('A->B')).toBe(10);
      expect(result.edgeWidths.get('B->C')).toBe(20);
    });

    it('should skip rules without matchFieldName and widthFieldName', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [{ name: 'id', type: FieldType.string, values: ['A->B'] }],
          }),
        ],
      } as PanelData;

      const edgeOverrides: EdgeOverride[] = [
        {
          id: 'override1',
          targetEdgeIds: ['A->B'],
          rules: [
            {
              kind: RuleKind.STROKE_WIDTH,
            },
          ],
        },
      ];

      const result = processWidthRules(data, edgeOverrides);

      expect(result.edgeWidths.size).toBe(0);
    });

    it('should apply static width even without matchFieldName', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [{ name: 'id', type: FieldType.string, values: ['A->B'] }],
          }),
        ],
      } as PanelData;

      const edgeOverrides: EdgeOverride[] = [
        {
          id: 'override1',
          targetEdgeIds: ['A->B', 'B->C'],
          rules: [
            {
              kind: RuleKind.STROKE_WIDTH,
              staticWidth: 10,
            },
          ],
        },
      ];

      const result = processWidthRules(data, edgeOverrides);

      expect(result.edgeWidths.size).toBe(2);
      expect(result.edgeWidths.get('A->B')).toBe(10);
      expect(result.edgeWidths.get('B->C')).toBe(10);
    });

    it('should skip non-width rules', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [
              { name: 'id', type: FieldType.string, values: ['A->B'] },
              { name: 'color', type: FieldType.number, values: [50] },
            ],
          }),
        ],
      } as PanelData;

      const edgeOverrides: EdgeOverride[] = [
        {
          id: 'override1',
          targetEdgeIds: ['A->B'],
          matchFieldName: 'id',
          matchValue: 'A->B',
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              colorFieldName: 'color',
            },
          ],
        },
      ];

      const result = processWidthRules(data, edgeOverrides);

      expect(result.edgeWidths.size).toBe(0);
    });

    it('should handle multiple width rules on same edge', () => {
      const data = {
        series: [
          createDataFrame({
            fields: [
              { name: 'id', type: FieldType.string, values: ['A->B'] },
              { name: 'width', type: FieldType.number, values: [100] },
            ],
          }),
        ],
      } as PanelData;

      const edgeOverrides: EdgeOverride[] = [
        {
          id: 'override1',
          targetEdgeIds: ['A->B'],
          matchFieldName: 'id',
          matchValue: 'A->B',
          rules: [
            {
              kind: RuleKind.STROKE_WIDTH,
              widthFieldName: 'width',
            },
          ],
        },
        {
          id: 'override2',
          targetEdgeIds: ['A->B'],
          rules: [
            {
              kind: RuleKind.STROKE_WIDTH,
              staticWidth: 5,
            },
          ],
        },
      ];

      const result = processWidthRules(data, edgeOverrides);

      expect(result.edgeWidths.has('A->B')).toBe(true);
    });
  });

  describe('Empty/null data handling', () => {
    it('should return WIDE for null series', () => {
      const { detectDataFormatStrategy } = require('./grafanaData');
      const { DataFormatStrategy } = require('../types');
      const result = detectDataFormatStrategy(null as any);
      expect(result).toBe(DataFormatStrategy.WIDE);
    });

    it('should return WIDE for empty array', () => {
      const { detectDataFormatStrategy } = require('./grafanaData');
      const { DataFormatStrategy } = require('../types');
      const result = detectDataFormatStrategy([]);
      expect(result).toBe(DataFormatStrategy.WIDE);
    });
  });

  describe('getFirstDataRow', () => {
    const { getFirstDataRow } = require('./grafanaData');

    it('should return undefined for empty series', () => {
      const result = getFirstDataRow([]);
      expect(result).toBeUndefined();
    });

    it('should return undefined for null series', () => {
      const result = getFirstDataRow(null as any);
      expect(result).toBeUndefined();
    });

    it('should return row object from single-row frame', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'hostname', type: FieldType.string, values: ['server1'], config: {} },
            { name: 'status', type: FieldType.string, values: ['active'], config: {} },
            { name: 'cpu', type: FieldType.number, values: [75], config: {} },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = getFirstDataRow(frames);

      expect(result).toEqual({
        hostname: 'server1',
        status: 'active',
        cpu: 75,
      });
    });

    it('should return undefined for multi-row frame', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'id', type: FieldType.string, values: ['A', 'B', 'C'], config: {} },
            { name: 'value', type: FieldType.number, values: [1, 2, 3], config: {} },
          ],
          length: 3,
        } as DataFrame,
      ];

      const result = getFirstDataRow(frames);
      expect(result).toBeUndefined();
    });

    it('should return undefined for zero-row frame', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'id', type: FieldType.string, values: [], config: {} },
            { name: 'value', type: FieldType.number, values: [], config: {} },
          ],
          length: 0,
        } as DataFrame,
      ];

      const result = getFirstDataRow(frames);
      expect(result).toBeUndefined();
    });

    it('should return first single-row frame when multiple frames exist', () => {
      const frames: DataFrame[] = [
        {
          fields: [{ name: 'id', type: FieldType.string, values: ['A', 'B'], config: {} }],
          length: 2,
        } as DataFrame,
        {
          fields: [
            { name: 'hostname', type: FieldType.string, values: ['server1'], config: {} },
            { name: 'region', type: FieldType.string, values: ['us-east'], config: {} },
          ],
          length: 1,
        } as DataFrame,
        {
          fields: [{ name: 'other', type: FieldType.string, values: ['value'], config: {} }],
          length: 1,
        } as DataFrame,
      ];

      const result = getFirstDataRow(frames);

      expect(result).toEqual({
        hostname: 'server1',
        region: 'us-east',
      });
    });

    it('should return undefined for frame with no fields', () => {
      const frames: DataFrame[] = [
        {
          fields: [],
          length: 0,
        } as DataFrame,
      ];

      const result = getFirstDataRow(frames);
      expect(result).toBeUndefined();
    });

    it('should skip fields with empty values array', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'valid', type: FieldType.string, values: ['value'], config: {} },
            { name: 'empty', type: FieldType.string, values: [], config: {} },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = getFirstDataRow(frames);

      expect(result).toEqual({
        valid: 'value',
      });
    });

    it('should return undefined when all fields have empty values', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'empty1', type: FieldType.string, values: [], config: {} },
            { name: 'empty2', type: FieldType.string, values: [], config: {} },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = getFirstDataRow(frames);
      expect(result).toBeUndefined();
    });

    it('should handle mixed field types', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'str', type: FieldType.string, values: ['text'], config: {} },
            { name: 'num', type: FieldType.number, values: [42], config: {} },
            { name: 'bool', type: FieldType.boolean, values: [true], config: {} },
            { name: 'time', type: FieldType.time, values: [1609459200000], config: {} },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = getFirstDataRow(frames);

      expect(result).toEqual({
        str: 'text',
        num: 42,
        bool: true,
        time: 1609459200000,
      });
    });

    it('should handle null and undefined field values', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            { name: 'valid', type: FieldType.string, values: ['value'], config: {} },
            { name: 'null_val', type: FieldType.string, values: [null], config: {} },
            { name: 'undef_val', type: FieldType.string, values: [undefined], config: {} },
          ],
          length: 1,
        } as DataFrame,
      ];

      const result = getFirstDataRow(frames);

      expect(result).toEqual({
        valid: 'value',
        null_val: null,
        undef_val: undefined,
      });
    });
  });
});
