import { PanelData, FieldConfigSource, GrafanaTheme2, DataFrame, FieldType } from '@grafana/data';
import { EdgeMapping, NodeMapping, RuleKind } from './types';

export interface DataDrivenColors {
  nodeColors: Map<string, string>;
  edgeColors: Map<string, string>;
}

export interface DataDrivenWidths {
  edgeWidths: Map<string, number>;
}

/**
 * Processes data field bindings from rules and applies thresholds to determine colors for nodes and edges.
 * Extracts stroke color rules from mappings and processes them.
 * 
 * @param data - Panel data from datasource
 * @param fieldConfig - Field configuration including thresholds
 * @param nodeMappings - Node mappings containing rules
 * @param edgeMappings - Edge mappings containing rules
 * @param theme - Grafana theme for color processing
 * @returns Maps of node/edge IDs to their data-driven colors
 */
export function processDataFieldBindings(
  data: PanelData,
  fieldConfig: FieldConfigSource,
  nodeMappings: NodeMapping[],
  edgeMappings: EdgeMapping[],
  theme: GrafanaTheme2
): DataDrivenColors {
  const nodeColors = new Map<string, string>();
  const edgeColors = new Map<string, string>();

  if (!data.series || data.series.length === 0) {
    return { nodeColors, edgeColors };
  }

  nodeMappings.forEach(mapping => {
    const colorRules = mapping.rules.filter(r => r.kind === RuleKind.STROKE_COLOR);
    
    colorRules.forEach(rule => {
      if (rule.matchFieldName && rule.colorFieldName) {
        mapping.targetNodeIds.forEach((nodeId: string) => {
          const matchValue = rule.matchPattern 
            ? rule.matchPattern.replace(/\$\{id\}/g, nodeId)
            : rule.matchValue;
          
          if (matchValue && rule.matchFieldName && rule.colorFieldName) {
            const color = findColorForMatchingRow(
              data.series,
              rule.matchFieldName,
              matchValue,
              rule.colorFieldName,
              fieldConfig,
              theme
            );
            
            if (color) {
              nodeColors.set(nodeId, color);
            }
          }
        });
      }
    });
  });

  edgeMappings.forEach(mapping => {
    const colorRules = mapping.rules.filter(r => r.kind === RuleKind.STROKE_COLOR);
    
    colorRules.forEach(rule => {
      if (rule.matchFieldName && rule.colorFieldName) {
        mapping.targetEdgeIds.forEach((edgeId: string) => {
          const matchValue = rule.matchPattern
            ? rule.matchPattern.replace(/\$\{id\}/g, edgeId)
            : rule.matchValue;
          
          if (matchValue && rule.matchFieldName && rule.colorFieldName) {
            const color = findColorForMatchingRow(
              data.series,
              rule.matchFieldName,
              matchValue,
              rule.colorFieldName,
              fieldConfig,
              theme
            );
            
            if (color) {
              edgeColors.set(edgeId, color);
            }
          }
        });
      }
    });
  });

  return { nodeColors, edgeColors };
}

/**
 * Processes width rules from edge mappings to determine stroke widths.
 * 
 * @param data - Panel data from datasource
 * @param edgeMappings - Edge mappings containing width rules
 * @returns Map of edge IDs to their widths
 */
export function processWidthRules(
  data: PanelData,
  edgeMappings: EdgeMapping[]
): DataDrivenWidths {
  const edgeWidths = new Map<string, number>();

  if (!data.series || data.series.length === 0) {
    return { edgeWidths };
  }

  edgeMappings.forEach(mapping => {
    const widthRules = mapping.rules.filter(r => r.kind === RuleKind.STROKE_WIDTH);
    
    widthRules.forEach(rule => {
      if (rule.matchFieldName && rule.widthFieldName) {
        mapping.targetEdgeIds.forEach((edgeId: string) => {
          const matchValue = rule.matchPattern
            ? rule.matchPattern.replace(/\$\{id\}/g, edgeId)
            : rule.matchValue;
          
          if (matchValue && rule.matchFieldName && rule.widthFieldName) {
            const width = findWidthForMatchingRow(
              data.series,
              rule.matchFieldName,
              matchValue,
              rule.widthFieldName
            );
            
            if (width !== undefined) {
              edgeWidths.set(edgeId, width);
            }
          }
        });
      } else if (rule.staticWidth !== undefined) {
        mapping.targetEdgeIds.forEach((edgeId: string) => {
          edgeWidths.set(edgeId, rule.staticWidth!);
        });
      }
    });
  });

  return { edgeWidths };
}

/**
 * Finds the row where matchField equals matchValue and gets the width value.
 */
function findWidthForMatchingRow(
  series: DataFrame[],
  matchFieldName: string,
  matchValue: string,
  widthFieldName: string
): number | undefined {
  for (const frame of series) {
    const matchField = frame.fields.find(f => f.name === matchFieldName);
    const widthField = frame.fields.find(f => f.name === widthFieldName);

    if (!matchField || !widthField) {
      continue;
    }

    for (let i = 0; i < matchField.values.length; i++) {
      if (String(matchField.values[i]) === matchValue) {
        const widthValue = widthField.values[i];
        
        if (widthValue != null && widthField.type === FieldType.number) {
          return Number(widthValue);
        }
      }
    }
  }

  return undefined;
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

