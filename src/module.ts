import { PanelPlugin } from '@grafana/data';
import { SimpleOptions, RankDirection, LayoutEngine, DiagramSourceType } from './types';
import { SimplePanel } from './components/SimplePanel';
import { DotDiagramEditor } from './components/DotDiagramEditor';
import { NamedThresholdsEditor } from './components/NamedThresholdsEditor';
import { EdgeMappingsEditor } from './components/EdgeMappingsEditor';
import { NodeMappingsEditor } from './components/NodeMappingsEditor';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).useFieldConfig().setPanelOptions((builder) => {
  return builder
    .addRadio({
      path: 'diagramSourceType',
      name: 'Diagram Source',
      description: 'Choose whether to enter the DOT diagram directly or load it from a URL',
      defaultValue: DiagramSourceType.CODE,
      settings: {
        options: [
          {
            value: DiagramSourceType.CODE,
            label: 'Code',
          },
          {
            value: DiagramSourceType.URL,
            label: 'URL',
          },
        ],
      },
    })
    .addCustomEditor({
      id: 'dotDiagram',
      path: 'dotDiagram',
      name: 'DOT Diagram',
      description: 'Enter DOT syntax diagram definition. Supports multi-line input for copy-pasting DOT diagrams.',
      defaultValue: 'digraph {\n  A -> B;\n  B -> A;\n  C -> A;\n}',
      editor: DotDiagramEditor,
      showIf: (options) => options.diagramSourceType === DiagramSourceType.CODE || !options.diagramSourceType,
    })
    .addTextInput({
      path: 'dotDiagramUrl',
      name: 'DOT Diagram URL',
      description:
        'Enter the URL to fetch the DOT diagram from. The URL should return a text file containing valid DOT syntax.',
      defaultValue: '',
      showIf: (options) => options.diagramSourceType === DiagramSourceType.URL,
    })
    .addSelect({
      path: 'layoutEngine',
      name: 'Layout engine',
      description: 'Graphviz layout algorithm to use for rendering',
      defaultValue: LayoutEngine.HIERARCHICAL,
      settings: {
        options: [
          {
            value: LayoutEngine.HIERARCHICAL,
            label: 'Hierarchical',
          },
          {
            value: LayoutEngine.NETWORK,
            label: 'Network',
          },
          {
            value: LayoutEngine.FORCE_DIRECTED,
            label: 'Force Directed',
          },
          {
            value: LayoutEngine.CIRCULAR,
            label: 'Circular',
          },
          {
            value: LayoutEngine.RADIAL,
            label: 'Radial',
          },
        ],
      },
    })
    .addSelect({
      path: 'rankDirection',
      name: 'Layout direction',
      description: 'Controls the direction of the diagram layout (hierarchical engine only)',
      defaultValue: RankDirection.LEFT_TO_RIGHT,
      showIf: (options) => options.layoutEngine === LayoutEngine.HIERARCHICAL,
      settings: {
        options: [
          {
            value: RankDirection.TOP_TO_BOTTOM,
            label: 'Top to Bottom',
          },
          {
            value: RankDirection.BOTTOM_TO_TOP,
            label: 'Bottom to Top',
          },
          {
            value: RankDirection.LEFT_TO_RIGHT,
            label: 'Left to Right',
          },
          {
            value: RankDirection.RIGHT_TO_LEFT,
            label: 'Right to Left',
          },
        ],
      },
    })
    .addCustomEditor({
      id: 'namedThresholds',
      path: 'namedThresholds',
      name: 'Threshold Sets',
      description: 'Define named threshold sets that can be referenced in node and edge color rules',
      defaultValue: [],
      editor: NamedThresholdsEditor,
      category: ['Data Mappings'],
    })
    .addCustomEditor({
      id: 'edgeMappings',
      path: 'edgeMappings',
      name: 'Edge Mappings',
      description: 'Configure rules for edges (color, width, etc.)',
      defaultValue: [],
      editor: EdgeMappingsEditor,
    })
    .addCustomEditor({
      id: 'nodeMappings',
      path: 'nodeMappings',
      name: 'Node Mappings',
      description: 'Configure rules for nodes (color, width, etc.)',
      defaultValue: [],
      editor: NodeMappingsEditor,
    });
});
