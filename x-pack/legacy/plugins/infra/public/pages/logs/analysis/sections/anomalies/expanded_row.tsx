/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useMemo } from 'react';
import { i18n } from '@kbn/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiStat } from '@elastic/eui';
import { AnomaliesChart } from './chart';
import { GetLogEntryRateSuccessResponsePayload } from '../../../../../../common/http_api/log_analysis/results/log_entry_rate';
import { TimeRange } from '../../../../../../common/http_api/shared/time_range';
import {
  getLogEntryRateSeriesForPartition,
  getAnnotationsForPartition,
} from '../helpers/data_formatters';

export const AnomaliesTableExpandedRow: React.FunctionComponent<{
  partitionId: string;
  topAnomalyScore: number;
  results: GetLogEntryRateSuccessResponsePayload['data'];
  setTimeRange: (timeRange: TimeRange) => void;
  timeRange: TimeRange;
}> = ({ results, timeRange, setTimeRange, topAnomalyScore, partitionId }) => {
  const logEntryRateSeries = useMemo(
    () =>
      results && results.histogramBuckets
        ? getLogEntryRateSeriesForPartition(results, partitionId)
        : [],
    [results, partitionId]
  );
  // TODO: Split into various colours based on severity scoring
  const anomalyAnnotations = useMemo(
    () =>
      results && results.histogramBuckets ? getAnnotationsForPartition(results, partitionId) : [],
    [results, partitionId]
  );
  return (
    <EuiFlexGroup>
      <EuiFlexItem grow={8}>
        <AnomaliesChart
          chartId={`${partitionId}-anomalies`}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          series={logEntryRateSeries}
          annotations={anomalyAnnotations}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={2}>
        <EuiStat
          title={Number(topAnomalyScore).toFixed(1)}
          description={i18n.translate(
            'xpack.infra.logs.analysis.anomaliesExpandedRowTopAnomalyScoreDescription',
            {
              defaultMessage: 'Top anomaly score',
            }
          )}
          reverse
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
