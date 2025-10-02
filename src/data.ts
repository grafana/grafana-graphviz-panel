import { PanelData, FieldConfigSource, GrafanaTheme2, DataFrame, FieldType } from '@grafana/data';
import { EdgeStyleMapping, NodeStyleMapping } from './types';

export interface DataDrivenColors {
  nodeColors: Map<string, string>;
  edgeColors: Map<string, string>;
}

/**
 * Processes data field bindings and applies thresholds to determine colors for nodes and edges.
 * Finds matching rows based on matchField/matchValue, then applies thresholds to colorField value.
 * 
 * @param data - Panel data from datasource
 * @param fieldConfig - Field configuration including thresholds
 * @param nodeMappings - Node mappings that may include data field bindings
 * @param edgeMappings - Edge mappings that may include data field bindings
 * @param theme - Grafana theme for color processing
 * @returns Maps of node/edge IDs to their data-driven colors
 */
export function processDataFieldBindings(
  data: PanelData,
  fieldConfig: FieldConfigSource,
  nodeMappings: NodeStyleMapping[],
  edgeMappings: EdgeStyleMapping[],
  theme: GrafanaTheme2
): DataDrivenColors {
  const nodeColors = new Map<string, string>();
  const edgeColors = new Map<string, string>();

  if (!data.series || data.series.length === 0) {
    return { nodeColors, edgeColors };
  }

  nodeMappings.forEach(mapping => {
    if (mapping.matchFieldName && mapping.matchValue && mapping.colorFieldName) {
      const color = findColorForMatchingRow(
        data.series,
        mapping.matchFieldName,
        mapping.matchValue,
        mapping.colorFieldName,
        fieldConfig,
        theme
      );
      
      if (color) {
        mapping.targetNodeIds.forEach(nodeId => {
          nodeColors.set(nodeId, color);
        });
      }
    }
  });

  edgeMappings.forEach(mapping => {
    if (mapping.matchFieldName && mapping.matchValue && mapping.colorFieldName) {
      const color = findColorForMatchingRow(
        data.series,
        mapping.matchFieldName,
        mapping.matchValue,
        mapping.colorFieldName,
        fieldConfig,
        theme
      );
      
      if (color) {
        mapping.targetEdgeIds.forEach(edgeId => {
          edgeColors.set(edgeId, color);
        });
      }
    }
  });

  return { nodeColors, edgeColors };
}

/**
 * Finds the row where matchField equals matchValue, gets the colorField value from that row,
 * and applies field config (thresholds) to determine the color.
 */
function findColorForMatchingRow(
  series: DataFrame[],
  matchFieldName: string,
  matchValue: string,
  colorFieldName: string,
  fieldConfig: FieldConfigSource,
  theme: GrafanaTheme2
): string | undefined {
  for (const frame of series) {
    const matchField = frame.fields.find(f => f.name === matchFieldName);
    const colorField = frame.fields.find(f => f.name === colorFieldName);

    if (!matchField || !colorField) {
      continue;
    }

    for (let i = 0; i < matchField.values.length; i++) {
      if (String(matchField.values[i]) === matchValue) {
        const numericValue = colorField.values[i];
        
        if (numericValue != null && colorField.type === FieldType.number) {
          const display = colorField.display ? colorField.display(numericValue) : { color: undefined };
          if (display.color) {
            return display.color;
          }
        }
      }
    }
  }

  return undefined;
}

