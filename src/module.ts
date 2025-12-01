import { PanelPlugin } from '@grafana/data';
import { SimpleOptions, RankDirection, LayoutEngine, DiagramSourceType, InputMode } from './types';
import { SimplePanel } from './components/SimplePanel';
import { DotDiagramEditor } from './components/DotDiagramEditor';
import { BuilderModeEditor } from './components/BuilderModeEditor';
import { NamedThresholdsEditor } from './components/NamedThresholdsEditor';
import { EdgeOverridesEditor } from './components/EdgeOverridesEditor';
import { NodeOverridesEditor } from './components/NodeOverridesEditor';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).useFieldConfig().setPanelOptions((builder) => {
  return builder
    .addRadio({
      path: 'diagramSourceType',
      name: 'Diagram source',
      description: 'Choose whether to enter the DOT diagram directly or load it from a URL',
      defaultValue: DiagramSourceType.INLINE,
      category: ['Diagram'],
      settings: {
        options: [
          {
            value: DiagramSourceType.INLINE,
            label: 'Inline',
          },
          {
            value: DiagramSourceType.URL,
            label: 'URL',
          },
        ],
      },
    })
    .addRadio({
      path: 'inputMode',
      name: 'Input mode',
      description: 'Choose how to create the diagram',
      defaultValue: InputMode.CODE,
      category: ['Diagram'],
      showIf: (options) => options.diagramSourceType === DiagramSourceType.INLINE,
      settings: {
        options: [
          {
            value: InputMode.CODE,
            label: 'Code',
          },
          {
            value: InputMode.BUILDER,
            label: 'Builder',
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
      category: ['Diagram'],
      showIf: (options) =>
        (options.diagramSourceType === DiagramSourceType.INLINE || !options.diagramSourceType) &&
        (options.inputMode === InputMode.CODE || !options.inputMode),
    })
    .addCustomEditor({
      id: 'builderModeActions',
      path: 'builderModeActions',
      name: 'Builder actions',
      description: 'Add nodes and edges to the diagram',
      defaultValue: {},
      editor: BuilderModeEditor,
      category: ['Diagram'],
      showIf: (options) =>
        (options.diagramSourceType === DiagramSourceType.INLINE || !options.diagramSourceType) &&
        options.inputMode === InputMode.BUILDER,
    })
    .addTextInput({
      path: 'dotDiagramUrl',
      name: 'DOT diagram URL',
      description:
        'Enter the URL to fetch the DOT diagram from. The URL should return a text file containing valid DOT syntax.',
      defaultValue: '',
      category: ['Diagram'],
      showIf: (options) => options.diagramSourceType === DiagramSourceType.URL,
    })
    .addSelect({
      path: 'layoutEngine',
      name: 'Layout engine',
      description: 'Graphviz layout algorithm to use for rendering',
      defaultValue: LayoutEngine.HIERARCHICAL,
      category: ['Diagram'],
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
      category: ['Diagram'],
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
      id: 'edgeOverrides',
      path: 'edgeOverrides',
      name: 'Edge override rules',
      description: 'Link edges to data rows to dynamically set their appearance and labels based on real-time metrics',
      defaultValue: [],
      editor: EdgeOverridesEditor,
      category: ['Edge overrides'],
    })
    .addCustomEditor({
      id: 'nodeOverrides',
      path: 'nodeOverrides',
      name: 'Node override rules',
      description: 'Link nodes to data rows to dynamically set their appearance and labels based on real-time metrics',
      defaultValue: [],
      editor: NodeOverridesEditor,
      category: ['Node overrides'],
    })
    .addCustomEditor({
      id: 'namedThresholds',
      path: 'namedThresholds',
      name: 'Threshold sets',
      description: 'Define named threshold sets that can be referenced in node and edge color overrides',
      defaultValue: [],
      editor: NamedThresholdsEditor,
      category: ['Thresholds'],
    });
});
