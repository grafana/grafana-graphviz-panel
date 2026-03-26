import { interpolateAllNodeLabels, interpolateAllEdgeLabels } from './label';
import { FieldType } from '@grafana/data';
const { applyDataDrivenNodeLabels, applyDataDrivenEdgeLabels } = require('./label');
const { RuleKind } = require('../types');

describe('overrides/label', () => {
  describe('applyDataDrivenNodeLabels', () => {
    const mockData = {
      series: [
        {
          fields: [
            { name: 'node_id', type: 'string', values: ['A', 'B', 'C'], config: {} },
            { name: 'status', type: 'string', values: ['active', 'inactive', 'pending'], config: {} },
            { name: 'count', type: 'number', values: [10, 20, 30], config: {} },
          ],
          length: 3,
        },
      ],
    };

    it('should return unchanged DOT when no data series', () => {
      const dot = 'digraph G { A; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          matchValue: 'A',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Status: ${status}' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, { series: [] });

      expect(result).toBe(dot);
    });

    it('should apply label template to matched node', () => {
      const dot = 'digraph G { A; B; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          matchValue: 'A',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Status: ${status}' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('Status: active');
      expect(result).toContain('A');
    });

    it('should use matchPattern with ${id} placeholder', () => {
      const dot = 'digraph G { A; B; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A', 'B'],
          matchFieldName: 'node_id',
          matchPattern: '${id}',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Count: ${count}' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('Count: 10');
      expect(result).toContain('Count: 20');
    });

    it('should skip nodes when matchValue is missing', () => {
      const dot = 'digraph G { A; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Test' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('A');
    });

    it('should skip nodes when matchFieldName is missing', () => {
      const dot = 'digraph G { A; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchValue: 'A',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Test' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('A');
    });

    it('should skip nodes when data row not found', () => {
      const dot = 'digraph G { X; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['X'],
          matchFieldName: 'node_id',
          matchValue: 'NonExistent',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Test' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('X');
    });

    it('should interpolate existing label if it has ${} syntax', () => {
      const dot = 'digraph G { A [label="${status}"]; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          matchValue: 'A',
          rules: [],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('active');
    });

    it('should handle multiple nodes with different labels', () => {
      const dot = 'digraph G { A; B; C; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A', 'B', 'C'],
          matchFieldName: 'node_id',
          matchPattern: '${id}',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: '${node_id}: ${status}' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('A: active');
      expect(result).toContain('B: inactive');
      expect(result).toContain('C: pending');
    });

    it('should apply dashboard variables in label template', () => {
      const dot = 'digraph G { A; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          matchValue: 'A',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Env: $environment\\nStatus: ${status}' }],
        },
      ];
      const replaceVariables = (str: string) => str.replace('$environment', 'production');

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData, replaceVariables);

      expect(result).toContain('Env: production');
      expect(result).toContain('Status: active');
    });

    it('should work without replaceVariables function', () => {
      const dot = 'digraph G { A; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          matchValue: 'A',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Status: ${status}' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData, undefined);

      expect(result).toContain('Status: active');
    });

    it('should apply dashboard variables to existing label interpolation', () => {
      const dot = 'digraph G { A [label="$environment: ${status}"]; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          matchValue: 'A',
          rules: [],
        },
      ];
      const replaceVariables = (str: string) => str.replace('$environment', 'production');

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData, replaceVariables);

      expect(result).toContain('production');
      expect(result).toContain('active');
    });
  });

  describe('applyDataDrivenEdgeLabels', () => {
    const mockData = {
      series: [
        {
          fields: [
            { name: 'edge_id', type: 'string', values: ['A__to__B', 'B__to__C'], config: {} },
            { name: 'bandwidth', type: 'string', values: ['100Mbps', '200Mbps'], config: {} },
            { name: 'latency', type: 'string', values: ['5ms', '10ms'], config: {} },
          ],
          length: 2,
        },
      ],
    };

    it('should return unchanged DOT when no data series', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          matchValue: 'A__to__B',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: '${bandwidth}' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, { series: [] });

      expect(result).toBe(dot);
    });

    it('should apply label template to matched edge', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          matchValue: 'A__to__B',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: '${bandwidth}' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData);

      expect(result).toContain('100Mbps');
    });

    it('should use matchPattern with ${id} placeholder', () => {
      const dot = 'digraph G { A -> B; B -> C; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B', 'B__to__C'],
          matchFieldName: 'edge_id',
          matchPattern: '${id}',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: '${latency}' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData);

      expect(result).toContain('5ms');
      expect(result).toContain('10ms');
    });

    it('should skip edges when matchValue is missing', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Test' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData);

      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should skip edges when matchFieldName is missing', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchValue: 'A__to__B',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Test' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData);

      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should skip edges when data row not found', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          matchValue: 'NonExistent',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Test' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData);

      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should interpolate existing label if it has ${} syntax', () => {
      const dot = 'digraph G { A -> B [label="${bandwidth}"]; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          matchValue: 'A__to__B',
          rules: [],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData);

      expect(result).toContain('100Mbps');
    });

    it('should apply dashboard variables in edge label template', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          matchValue: 'A__to__B',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: '$environment\\n${bandwidth}\\n${latency}' }],
        },
      ];
      const replaceVariables = (str: string) => str.replace('$environment', 'production');

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData, replaceVariables);

      expect(result).toContain('production');
      expect(result).toContain('100Mbps');
      expect(result).toContain('5ms');
    });

    it('should work without replaceVariables function for edges', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          matchValue: 'A__to__B',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: '${bandwidth}' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData, undefined);

      expect(result).toContain('100Mbps');
    });

    it('should apply dashboard variables to existing edge label interpolation', () => {
      const dot = 'digraph G { A -> B [label="$region: ${bandwidth}"]; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          matchValue: 'A__to__B',
          rules: [],
        },
      ];
      const replaceVariables = (str: string) => str.replace('$region', 'us-east');

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData, replaceVariables);

      expect(result).toContain('us-east');
      expect(result).toContain('100Mbps');
    });
  });

  describe('interpolateAllNodeLabels', () => {
    const mockData = {
      series: [
        {
          fields: [
            { name: 'node_id', type: FieldType.string, values: ['WebServer', 'AppServer'], config: {} },
            { name: 'hostname', type: FieldType.string, values: ['web-01.prod', 'app-01.prod'], config: {} },
            { name: 'environment', type: FieldType.string, values: ['production', 'production'], config: {} },
          ],
          length: 2,
        },
      ],
    };

    it('should interpolate node labels with ${hostname} variable syntax', () => {
      const dotString =
        'digraph G {\n        WebServer [label="Web Server: ${hostname}"];\n        AppServer [label="App Server: ${hostname}"];\n      }';

      const result = interpolateAllNodeLabels(dotString, mockData);

      expect(result).toContain('Web Server: web-01.prod');
      expect(result).toContain('App Server: app-01.prod');
      expect(result).not.toContain('${hostname}');
    });

    it('should interpolate node labels with ${hostname} variable', () => {
      const dotString = 'digraph G {\n        WebServer [label="${hostname}"];\n      }';

      const result = interpolateAllNodeLabels(dotString, mockData);

      expect(result).toContain('web-01.prod');
      expect(result).not.toContain('${hostname}');
    });

    it('should not modify labels without variables', () => {
      const dotString = `digraph G {
        WebServer [label="Static Label"];
      }`;

      const result = interpolateAllNodeLabels(dotString, mockData);

      expect(result).toContain('Static Label');
    });

    it('should handle missing data gracefully', () => {
      const dotString = 'digraph G {\n        UnknownNode [label="${hostname}"];\n      }';

      const result = interpolateAllNodeLabels(dotString, mockData);

      expect(result).toContain('${hostname}');
    });

    it('should return original string when no data series', () => {
      const dotString = 'digraph G {\n        WebServer [label="${hostname}"];\n      }';

      const emptyData = { series: [] };
      const result = interpolateAllNodeLabels(dotString, emptyData);

      expect(result).toBe(dotString);
    });

    it('should call replaceVariables for dashboard variables and interpolate data fields', () => {
      const dotString = 'digraph G {\n        WebServer [label="Server: ${hostname} in $environment"];\n      }';

      const mockReplaceVariables = (value: string) => value.replace(/\$environment/g, 'production');

      const result = interpolateAllNodeLabels(dotString, mockData, mockReplaceVariables);

      expect(result).toContain('web-01.prod');
      expect(result).toContain('production');
    });

    it('should use first row when there is only one row of data and node ID does not match', () => {
      const singleRowData = {
        series: [
          {
            fields: [
              { name: 'environment', type: FieldType.string, values: ['production'], config: {} },
              { name: 'hostname', type: FieldType.string, values: ['web-01.prod'], config: {} },
            ],
            length: 1,
          },
        ],
      };

      const dotString = 'digraph G {\n        Server [label="${hostname}"];\n      }';

      const result = interpolateAllNodeLabels(dotString, singleRowData);

      expect(result).toContain('web-01.prod');
      expect(result).not.toContain('${hostname}');
    });

    it('should NOT use first row when there are multiple rows and node does not match', () => {
      const dotString = 'digraph G {\n        UnknownNode [label="${hostname}"];\n      }';

      const result = interpolateAllNodeLabels(dotString, mockData);

      expect(result).toContain('${hostname}');
      expect(result).not.toContain('web-01.prod');
    });

    it('should prefer matched node ID over single-row fallback', () => {
      const singleRowData = {
        series: [
          {
            fields: [
              { name: 'node_id', type: FieldType.string, values: ['WebServer'], config: {} },
              { name: 'hostname', type: FieldType.string, values: ['matched-host'], config: {} },
            ],
            length: 1,
          },
        ],
      };

      const dotString = 'digraph G {\n        WebServer [label="${hostname}"];\n      }';

      const result = interpolateAllNodeLabels(dotString, singleRowData);

      expect(result).toContain('matched-host');
    });

    it('should handle multiple nodes with single-row data', () => {
      const singleRowData = {
        series: [
          {
            fields: [{ name: 'hostname', type: FieldType.string, values: ['shared-host'], config: {} }],
            length: 1,
          },
        ],
      };

      const dotString =
        'digraph G {\n        NodeA [label="${hostname}"];\n        NodeB [label="${hostname}"];\n      }';

      const result = interpolateAllNodeLabels(dotString, singleRowData);

      const matches = (result.match(/shared-host/g) || []).length;
      expect(matches).toBe(2);
    });

    it('should try multiple field names to match node ID', () => {
      const dataWithServerField = {
        series: [
          {
            fields: [
              { name: 'server', type: FieldType.string, values: ['MyServer'], config: {} },
              { name: 'value', type: FieldType.string, values: ['server-value'], config: {} },
            ],
            length: 1,
          },
        ],
      };

      const dotString = 'digraph G {\n        MyServer [label="${value}"];\n      }';

      const result = interpolateAllNodeLabels(dotString, dataWithServerField);

      expect(result).toContain('server-value');
    });
  });

  describe('interpolateAllEdgeLabels', () => {
    const mockEdgeData = {
      series: [
        {
          fields: [
            { name: 'edge_id', type: FieldType.string, values: ['A__to__B', 'C__to__D'], config: {} },
            { name: 'bandwidth', type: FieldType.string, values: ['1000 Mbps', '500 Mbps'], config: {} },
          ],
          length: 2,
        },
      ],
    };

    it('should interpolate edge labels with variables', () => {
      const dotString = 'digraph G {\n        A -> B [label="Bandwidth: ${bandwidth}"];\n      }';

      const result = interpolateAllEdgeLabels(dotString, mockEdgeData);

      expect(result).toContain('Bandwidth: 1000 Mbps');
      expect(result).not.toContain('${bandwidth}');
    });

    it('should not modify edge labels without variables', () => {
      const dotString = `digraph G {
        A -> B [label="Static Edge"];
      }`;

      const result = interpolateAllEdgeLabels(dotString, mockEdgeData);

      expect(result).toContain('Static Edge');
    });

    it('should handle missing edge data gracefully', () => {
      const dotString = 'digraph G {\n        X -> Y [label="${bandwidth}"];\n      }';

      const result = interpolateAllEdgeLabels(dotString, mockEdgeData);

      expect(result).toContain('${bandwidth}');
    });

    it('should use first row for edges when there is only one row of data', () => {
      const singleRowEdgeData = {
        series: [
          {
            fields: [{ name: 'bandwidth', type: FieldType.string, values: ['1000 Mbps'], config: {} }],
            length: 1,
          },
        ],
      };

      const dotString = 'digraph G {\n        A -> B [label="${bandwidth}"];\n      }';

      const result = interpolateAllEdgeLabels(dotString, singleRowEdgeData);

      expect(result).toContain('1000 Mbps');
      expect(result).not.toContain('${bandwidth}');
    });

    it('should match edge by edge_id field', () => {
      const dotString = 'digraph G {\n        A -> B [label="${bandwidth}"];\n      }';

      const result = interpolateAllEdgeLabels(dotString, mockEdgeData);

      expect(result).toContain('1000 Mbps');
    });
  });
});
