import { PanelPlugin } from '@grafana/data';
import { SimpleOptions, RankDirection, LayoutEngine } from './types';
import { SimplePanel } from './components/SimplePanel';
import { DotDiagramEditor } from './components/DotDiagramEditor';
import { EdgeMappingsEditor } from './components/EdgeMappingsEditor';
import { NodeMappingsEditor } from './components/NodeMappingsEditor';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel)
  .useFieldConfig()
  .setPanelOptions((builder) => {
  return builder
    .addCustomEditor({
      id: 'dotDiagram',
      path: 'dotDiagram',
      name: 'DOT Diagram',
      description: 'Enter DOT syntax diagram definition. Supports multi-line input for copy-pasting DOT diagrams.',
      defaultValue: 'digraph Network {\n  Start [shape=ellipse, color=green];\n  Gateway [shape=box];\n  End [shape=doublecircle, color=red];\n  \n  Start -> Gateway;\n  Gateway -> End;\n  End -> Gateway;\n  Start -> Backup [dir=none];\n  \n  subgraph cluster_services {\n    label="Microservices";\n    style=rounded;\n    bgcolor=lightblue;\n    \n    API [shape=hexagon];\n    DB [shape=cylinder];\n    Cache;\n    \n    API -> DB;\n    API -> Cache;\n    Cache -> DB [style=dashed];\n  }\n  \n  Gateway -> API;\n  \n  Monitor [shape=triangle, style=filled];\n}',
      editor: DotDiagramEditor,
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
    })
    .addBooleanSwitch({
      path: 'enableNodeTooltips',
      name: 'Enable Node Tooltips',
      description: 'Show tooltips when hovering over nodes',
      defaultValue: false,
    })
});
