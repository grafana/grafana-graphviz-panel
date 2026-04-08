import { resolveNodeTooltipData, resolveEdgeTooltipData } from './grafanaTooltips';
import { NodeOverride, EdgeOverride, RuleKind } from '../types';
import { PanelData, FieldType, toDataFrame } from '@grafana/data';

describe('grafanaTooltips', () => {
  const mockReplaceVariables = (str: string) => str.replace('${var-region}', 'us-east');

  describe('resolveNodeTooltipData', () => {
    it('should return null if no overrides match', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'override-1',
          targetNodeIds: ['Server2'],
          rules: [],
        },
      ];
      const data: PanelData = { series: [], state: 'Done' } as any;

      const result = resolveNodeTooltipData('Server1', overrides, data, mockReplaceVariables);

      expect(result).toBeNull();
    });

    it('should return null if tooltip not enabled and no links', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'override-1',
          targetNodeIds: ['Server1'],
          rules: [],
        },
      ];
      const data: PanelData = { series: [], state: 'Done' } as any;

      const result = resolveNodeTooltipData('Server1', overrides, data, mockReplaceVariables);

      expect(result).toBeNull();
    });

    it('should resolve tooltip content with matched row data', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'override-1',
          targetNodeIds: ['Server1'],
          matchFieldName: 'server',
          matchValue: 'Server1',
          rules: [
            {
              kind: RuleKind.TOOLTIP,
              content: { templates: ['CPU: ${cpu}%\nMemory: ${memory}%'] },
            },
          ],
        },
      ];

      const data: PanelData = {
        series: [
          toDataFrame({
            fields: [
              { name: 'server', type: FieldType.string, values: ['Server1', 'Server2'] },
              { name: 'cpu', type: FieldType.number, values: [45, 80] },
              { name: 'memory', type: FieldType.number, values: [78, 92] },
            ],
          }),
        ],
        state: 'Done',
      } as any;

      const result = resolveNodeTooltipData('Server1', overrides, data, mockReplaceVariables);

      expect(result).toEqual({
        title: 'Node: Server1',
        content: 'CPU: 45%\nMemory: 78%',
        links: [],
      });
    });

    it('should resolve datalinks with node context', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'override-1',
          targetNodeIds: ['Server1'],
          matchFieldName: 'server',
          matchValue: 'Server1',
          rules: [
            {
              kind: RuleKind.TOOLTIP,
              footer: {
                links: [
                  {
                    title: 'Dashboard',
                    url: 'https://example.com?node=${__nodeId}&cpu=${cpu}',
                    openInNewTab: true,
                  },
                ],
              },
            },
          ],
        },
      ];

      const data: PanelData = {
        series: [
          toDataFrame({
            fields: [
              { name: 'server', type: FieldType.string, values: ['Server1'] },
              { name: 'cpu', type: FieldType.number, values: [45] },
            ],
          }),
        ],
        state: 'Done',
      } as any;

      const result = resolveNodeTooltipData('Server1', overrides, data, mockReplaceVariables);

      expect(result?.links).toEqual([
        {
          title: 'Dashboard',
          url: 'https://example.com?node=Server1&cpu=45',
          openInNewTab: true,
        },
      ]);
    });

    it('should use last matching override (last-one-wins)', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'override-1',
          targetNodeIds: ['Server1'],
          matchFieldName: 'server',
          matchValue: 'Server1',
          rules: [
            {
              kind: RuleKind.TOOLTIP,
              content: { templates: ['CPU: ${cpu}%'] },
            },
          ],
        },
        {
          id: 'override-2',
          targetNodeIds: ['Server1'],
          matchFieldName: 'server',
          matchValue: 'Server1',
          rules: [
            {
              kind: RuleKind.TOOLTIP,
              content: { templates: ['Status: ${status}'] },
            },
          ],
        },
      ];

      const data: PanelData = {
        series: [
          toDataFrame({
            fields: [
              { name: 'server', type: FieldType.string, values: ['Server1'] },
              { name: 'cpu', type: FieldType.number, values: [45] },
              { name: 'status', type: FieldType.string, values: ['healthy'] },
            ],
          }),
        ],
        state: 'Done',
      } as any;

      const result = resolveNodeTooltipData('Server1', overrides, data, mockReplaceVariables);

      expect(result?.content).toBe('Status: healthy');
    });

    it('should replace dashboard variables', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'override-1',
          targetNodeIds: ['Server1'],
          matchFieldName: 'server',
          matchValue: 'Server1',
          rules: [
            {
              kind: RuleKind.TOOLTIP,
              content: { templates: ['Region: ${var-region}\nCPU: ${cpu}%'] },
            },
          ],
        },
      ];

      const data: PanelData = {
        series: [
          toDataFrame({
            fields: [
              { name: 'server', type: FieldType.string, values: ['Server1'] },
              { name: 'cpu', type: FieldType.number, values: [45] },
            ],
          }),
        ],
        state: 'Done',
      } as any;

      const result = resolveNodeTooltipData('Server1', overrides, data, mockReplaceVariables);

      expect(result?.content).toBe('Region: us-east\nCPU: 45%');
    });
  });

  describe('resolveEdgeTooltipData', () => {
    it('should return null if no overrides match', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'override-1',
          targetEdgeIds: ['B__to__C'],
          rules: [],
        },
      ];
      const data: PanelData = { series: [], state: 'Done' } as any;

      const result = resolveEdgeTooltipData('A__to__B', overrides, data, mockReplaceVariables);

      expect(result).toBeNull();
    });

    it('should resolve tooltip content with edge context', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'override-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchFieldName: 'edge',
          matchValue: 'Server1__to__Server2',
          rules: [
            {
              kind: RuleKind.TOOLTIP,
              content: { templates: ['Edge: ${__source} → ${__target}\nTraffic: ${traffic}'] },
            },
          ],
        },
      ];

      const data: PanelData = {
        series: [
          toDataFrame({
            fields: [
              { name: 'edge', type: FieldType.string, values: ['Server1__to__Server2'] },
              { name: 'traffic', type: FieldType.number, values: [100] },
            ],
          }),
        ],
        state: 'Done',
      } as any;

      const result = resolveEdgeTooltipData('Server1__to__Server2', overrides, data, mockReplaceVariables);

      expect(result).toEqual({
        title: 'Edge: Server1 → Server2',
        content: 'Edge: Server1 → Server2\nTraffic: 100',
        links: [],
      });
    });

    it('should resolve datalinks with edge context variables', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'override-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchFieldName: 'edge',
          matchValue: 'Server1__to__Server2',
          rules: [
            {
              kind: RuleKind.TOOLTIP,
              footer: {
                links: [
                  {
                    title: 'Traffic Dashboard',
                    url: 'https://example.com?edge=${__edgeId}&from=${__source}&to=${__target}',
                    openInNewTab: false,
                  },
                ],
              },
            },
          ],
        },
      ];

      const data: PanelData = {
        series: [
          toDataFrame({
            fields: [{ name: 'edge', type: FieldType.string, values: ['Server1__to__Server2'] }],
          }),
        ],
        state: 'Done',
      } as any;

      const result = resolveEdgeTooltipData('Server1__to__Server2', overrides, data, mockReplaceVariables);

      expect(result?.links).toEqual([
        {
          title: 'Traffic Dashboard',
          url: 'https://example.com?edge=Server1__to__Server2&from=Server1&to=Server2',
          openInNewTab: false,
        },
      ]);
    });
  });
});
