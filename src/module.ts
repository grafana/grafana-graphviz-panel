import { PanelPlugin } from '@grafana/data';
import { SimpleOptions, RankDirection } from './types';
import { SimplePanel } from './components/SimplePanel';
import { DotDiagramEditor } from './components/DotDiagramEditor';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder
    .addSelect({
      path: 'rankDirection',
      name: 'Layout direction',
      description: 'Controls the direction of the diagram layout',
      defaultValue: RankDirection.LEFT_TO_RIGHT,
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
      id: 'dotDiagram',
      path: 'dotDiagram',
      name: 'DOT Diagram',
      description: 'Enter DOT syntax diagram definition. Supports multi-line input for copy-pasting DOT diagrams.',
      defaultValue: 'digraph Network {\n  Start [shape=ellipse, color=green];\n  Gateway [shape=box];\n  End [shape=doublecircle, color=red];\n  \n  Start -> Gateway;\n  Gateway -> End;\n  End -> Gateway;\n  Start -> Backup [dir=none];\n  \n  subgraph cluster_services {\n    label="Microservices";\n    style=rounded;\n    bgcolor=lightblue;\n    \n    API [shape=hexagon];\n    DB [shape=cylinder];\n    Cache;\n    \n    API -> DB;\n    API -> Cache;\n    Cache -> DB [style=dashed];\n  }\n  \n  Gateway -> API;\n  \n  Monitor [shape=triangle, style=filled];\n}',
      editor: DotDiagramEditor,
    })
});
