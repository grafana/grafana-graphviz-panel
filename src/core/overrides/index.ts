import { addStyleToCommaList } from './color';
import { calculateEdgeWidthAndArrowSize, applyEdgeStyleOverrides, applyDataDrivenWidths } from './edge';
import { applyNodeStyleOverrides, applyDataDrivenColors } from './node';
import {
  applyDataDrivenNodeLabels,
  applyDataDrivenEdgeLabels,
  interpolateAllNodeLabels,
  interpolateAllEdgeLabels,
  type DataWithSeries,
} from './label';

export {
  addStyleToCommaList,
  calculateEdgeWidthAndArrowSize,
  applyEdgeStyleOverrides,
  applyDataDrivenWidths,
  applyNodeStyleOverrides,
  applyDataDrivenColors,
  applyDataDrivenNodeLabels,
  applyDataDrivenEdgeLabels,
  interpolateAllNodeLabels,
  interpolateAllEdgeLabels,
  type DataWithSeries,
};
