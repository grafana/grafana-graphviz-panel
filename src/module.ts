import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';
import { DotDiagramEditor } from './components/DotDiagramEditor';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder
    .addCustomEditor({
      id: 'dotDiagram',
      path: 'dotDiagram',
      name: 'DOT Diagram',
      description: 'Enter DOT syntax diagram definition. Supports multi-line input for copy-pasting DOT diagrams.',
      defaultValue: 'digraph Network {\n  rankdir=TB;\n  \n  Start [shape=ellipse, color=green];\n  Gateway [shape=box];\n  End [shape=doublecircle, color=red];\n  \n  Start -> Gateway;\n  Gateway -> End;\n  End -> Gateway;\n  Start -> Backup [dir=none];\n  \n  subgraph cluster_services {\n    label="Microservices";\n    style=rounded;\n    bgcolor=lightblue;\n    \n    API [shape=hexagon];\n    DB [shape=cylinder];\n    Cache;\n    \n    API -> DB;\n    API -> Cache;\n    Cache -> DB [style=dashed];\n  }\n  \n  Gateway -> API;\n  \n  Monitor [shape=triangle, style=filled];\n}',
      editor: DotDiagramEditor,
    })
    .addBooleanSwitch({
      path: 'showSeriesCount',
      name: 'Show series counter',
      defaultValue: false,
    })
    .addRadio({
      path: 'seriesCountSize',
      defaultValue: 'sm',
      name: 'Series counter size',
      settings: {
        options: [
          {
            value: 'sm',
            label: 'Small',
          },
          {
            value: 'md',
            label: 'Medium',
          },
          {
            value: 'lg',
            label: 'Large',
          },
        ],
      },
      showIf: (config) => config.showSeriesCount,
    });
});
