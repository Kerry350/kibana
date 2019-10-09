/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { RectAnnotationDatum } from '@elastic/charts';
import {
  Axis,
  BarSeries,
  Chart,
  getAxisId,
  getSpecId,
  niceTimeFormatter,
  Settings,
  TooltipValue,
  LIGHT_THEME,
  DARK_THEME,
  getAnnotationId,
  RectAnnotation,
} from '@elastic/charts';
import { i18n } from '@kbn/i18n';
import moment from 'moment';
import React, { useCallback, useMemo } from 'react';

import { TimeRange } from '../../../../../../common/http_api/shared/time_range';
import { useKibanaUiSetting } from '../../../../../utils/use_kibana_ui_setting';
import { MLSeverityScoreCategories } from '../helpers/data_formatters';

export const AnomaliesChart: React.FunctionComponent<{
  chartId: string;
  setTimeRange: (timeRange: TimeRange) => void;
  timeRange: TimeRange;
  series: Array<{ time: number; value: number }>;
  annotations: Record<MLSeverityScoreCategories, RectAnnotationDatum[]>;
}> = ({ chartId, series, annotations, setTimeRange, timeRange }) => {
  const [dateFormat] = useKibanaUiSetting('dateFormat');
  const [isDarkMode] = useKibanaUiSetting('theme:darkMode');

  const chartDateFormatter = useMemo(
    () => niceTimeFormatter([timeRange.startTime, timeRange.endTime]),
    [timeRange]
  );

  const logEntryRateSpecId = getSpecId('averageValues');

  const tooltipProps = useMemo(
    () => ({
      headerFormatter: (tooltipData: TooltipValue) =>
        moment(tooltipData.value).format(dateFormat || 'Y-MM-DD HH:mm:ss.SSS'),
    }),
    [dateFormat]
  );

  const handleBrushEnd = useCallback(
    (startTime: number, endTime: number) => {
      setTimeRange({
        endTime,
        startTime,
      });
    },
    [setTimeRange]
  );
  const warningAnnotationsId = getAnnotationId(`anomalies-${chartId}-warning`);
  const minorAnnotationsId = getAnnotationId(`anomalies-${chartId}-minor`);
  const majorAnnotationsId = getAnnotationId(`anomalies-${chartId}-major`);
  const criticalAnnotationsId = getAnnotationId(`anomalies-${chartId}-critical`);

  return (
    <div style={{ height: 160, width: '100%' }}>
      <Chart className="log-entry-rate-chart">
        <Axis
          id={getAxisId('timestamp')}
          position="bottom"
          showOverlappingTicks
          tickFormat={chartDateFormatter}
        />
        <Axis
          id={getAxisId('values')}
          position="left"
          tickFormat={value => Number(value).toFixed(0)}
        />
        <BarSeries
          id={logEntryRateSpecId}
          name={i18n.translate('xpack.infra.logs.analysis.anomaliesSectionLineSeriesName', {
            defaultMessage: 'Log entries per 15 minutes (avg)',
          })}
          xScaleType="time"
          yScaleType="linear"
          xAccessor={'time'}
          yAccessors={['value']}
          data={series}
          barSeriesStyle={{ rect: { fill: '#D3DAE6', opacity: 0.7 } }} // TODO: Acquire this from "theme" as euiColorLightShade
        />
        <RectAnnotation
          dataValues={annotations.warning}
          annotationId={warningAnnotationsId}
          style={{ fill: '#006BB4', opacity: 0.8 }}
        />
        <RectAnnotation
          dataValues={annotations.minor}
          annotationId={minorAnnotationsId}
          style={{ fill: '#017D73', opacity: 0.8 }}
        />
        <RectAnnotation
          dataValues={annotations.major}
          annotationId={majorAnnotationsId}
          style={{ fill: '#F5A700', opacity: 0.8 }}
        />
        <RectAnnotation
          dataValues={annotations.critical}
          annotationId={criticalAnnotationsId}
          style={{ fill: '#BD271E', opacity: 0.8 }}
        />
        <Settings
          onBrushEnd={handleBrushEnd}
          tooltip={tooltipProps}
          baseTheme={isDarkMode ? DARK_THEME : LIGHT_THEME}
          xDomain={{ min: timeRange.startTime, max: timeRange.endTime }}
        />
      </Chart>
    </div>
  );
};
