import { DataFrame, FieldType } from '@grafana/data';
import { findWideFormatFieldValue, findTimeseriesFieldValue, validateDotSize, extractDotFromQuery } from './data';

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

  describe('findTimeseriesFieldValue', () => {
    it('should find string field in timeseries format data', () => {
      const frames: DataFrame[] = [
        {
          fields: [
            {
              name: 'time',
              type: FieldType.time,
              values: [1609459200000, 1609462800000],
              config: {},
            },
            {
              name: 'topology',
              type: FieldType.string,
              values: ['digraph G { A -> B; }', 'digraph G { X -> Y; }'],
              config: {},
            },
          ],
          length: 2,
        } as DataFrame,
      ];

      const result = findTimeseriesFieldValue(frames, 'topology');
      expect(result).toBe('digraph G { X -> Y; }');
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
});
