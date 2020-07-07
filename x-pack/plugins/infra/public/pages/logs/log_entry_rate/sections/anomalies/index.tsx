/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTitle,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React, { useMemo } from 'react';
import { euiStyled } from '../../../../../../../observability/public';
import { LogEntryRateResults } from '../../use_log_entry_rate_results';
import { TimeRange } from '../../../../../../common/http_api/shared/time_range';
import { getAnnotationsForAll, getLogEntryRateCombinedSeries } from '../helpers/data_formatters';
import { AnomaliesChart } from './chart';
import { AnomaliesTable } from './table';
import { RecreateJobButton } from '../../../../../components/logging/log_analysis_job_status';
import { LoadingOverlayWrapper } from '../../../../../components/loading_overlay_wrapper';
import {
  Page,
  FetchNextPage,
  FetchPreviousPage,
  ChangeSortOptions,
  ChangePaginationOptions,
  SortOptions,
  PaginationOptions,
  LogEntryAnomalies,
} from '../../use_log_entry_anomalies_results';

export const AnomaliesResults: React.FunctionComponent<{
  isLoading: boolean;
  results: LogEntryRateResults | null;
  anomalies: LogEntryAnomalies;
  setTimeRange: (timeRange: TimeRange) => void;
  timeRange: TimeRange;
  viewSetupForReconfiguration: () => void;
  jobId: string;
  page: Page;
  fetchNextPage?: FetchNextPage;
  fetchPreviousPage?: FetchPreviousPage;
  changeSortOptions: ChangeSortOptions;
  changePaginationOptions: ChangePaginationOptions;
  sortOptions: SortOptions;
  paginationOptions: PaginationOptions;
}> = ({
  isLoading,
  results,
  setTimeRange,
  timeRange,
  viewSetupForReconfiguration,
  jobId,
  anomalies,
  changeSortOptions,
  sortOptions,
  changePaginationOptions,
  paginationOptions,
  fetchNextPage,
  fetchPreviousPage,
  page,
}) => {
  const hasAnomalies = useMemo(() => {
    return results && results.histogramBuckets
      ? results.histogramBuckets.some((bucket) => {
          return bucket.partitions.some((partition) => {
            return partition.anomalies.length > 0;
          });
        })
      : false;
  }, [results]);

  const logEntryRateSeries = useMemo(
    () => (results && results.histogramBuckets ? getLogEntryRateCombinedSeries(results) : []),
    [results]
  );
  const anomalyAnnotations = useMemo(
    () =>
      results && results.histogramBuckets
        ? getAnnotationsForAll(results)
        : {
            warning: [],
            minor: [],
            major: [],
            critical: [],
          },
    [results]
  );

  return (
    <>
      <EuiFlexGroup alignItems="center" gutterSize="s">
        <EuiFlexItem>
          <EuiTitle size="m" aria-label={title}>
            <h1>{title}</h1>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <RecreateJobButton onClick={viewSetupForReconfiguration} size="s" />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <LoadingOverlayWrapper isLoading={isLoading} loadingChildren={<LoadingOverlayContent />}>
        {!results ||
        (results && results.histogramBuckets && !results.histogramBuckets.length) ||
        !anomalies ||
        anomalies.length === 0 ? (
          <EuiEmptyPrompt
            title={
              <h2>
                {i18n.translate('xpack.infra.logs.analysis.anomalySectionNoDataTitle', {
                  defaultMessage: 'There is no data to display.',
                })}
              </h2>
            }
            titleSize="m"
            body={
              <p>
                {i18n.translate('xpack.infra.logs.analysis.anomalySectionNoDataBody', {
                  defaultMessage: 'You may want to adjust your time range.',
                })}
              </p>
            }
          />
        ) : !hasAnomalies ? (
          <EuiEmptyPrompt
            title={
              <h2>
                {i18n.translate('xpack.infra.logs.analysis.anomalySectionNoAnomaliesTitle', {
                  defaultMessage: 'No anomalies were detected.',
                })}
              </h2>
            }
            titleSize="m"
          />
        ) : (
          <>
            <EuiFlexGroup>
              <EuiFlexItem>
                <AnomaliesChart
                  chartId="overall"
                  setTimeRange={setTimeRange}
                  timeRange={timeRange}
                  series={logEntryRateSeries}
                  annotations={anomalyAnnotations}
                  renderAnnotationTooltip={renderAnnotationTooltip}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="l" />
            <AnomaliesTable
              results={anomalies}
              setTimeRange={setTimeRange}
              timeRange={timeRange}
              jobId={jobId}
              changeSortOptions={changeSortOptions}
              changePaginationOptions={changePaginationOptions}
              sortOptions={sortOptions}
              paginationOptions={paginationOptions}
              fetchNextPage={fetchNextPage}
              fetchPreviousPage={fetchPreviousPage}
              page={page}
              isLoading={isLoading}
            />
          </>
        )}
      </LoadingOverlayWrapper>
    </>
  );
};

const title = i18n.translate('xpack.infra.logs.analysis.anomaliesSectionTitle', {
  defaultMessage: 'Anomalies',
});

const loadingAriaLabel = i18n.translate(
  'xpack.infra.logs.analysis.anomaliesSectionLoadingAriaLabel',
  { defaultMessage: 'Loading anomalies' }
);

const LoadingOverlayContent = () => <EuiLoadingSpinner size="xl" aria-label={loadingAriaLabel} />;

interface ParsedAnnotationDetails {
  anomalyScoresByPartition: Array<{ partitionName: string; maximumAnomalyScore: number }>;
}

const overallAnomalyScoreLabel = i18n.translate(
  'xpack.infra.logs.analysis.overallAnomalyChartMaxScoresLabel',
  {
    defaultMessage: 'Max anomaly scores:',
  }
);

const AnnotationTooltip: React.FunctionComponent<{ details: string }> = ({ details }) => {
  const parsedDetails: ParsedAnnotationDetails = JSON.parse(details);
  return (
    <TooltipWrapper>
      <span>
        <b>{overallAnomalyScoreLabel}</b>
      </span>
      <ul>
        {parsedDetails.anomalyScoresByPartition.map(({ partitionName, maximumAnomalyScore }) => {
          return (
            <li key={`overall-anomaly-chart-${partitionName}`}>
              <span>
                {`${partitionName}: `}
                <b>{maximumAnomalyScore}</b>
              </span>
            </li>
          );
        })}
      </ul>
    </TooltipWrapper>
  );
};

const renderAnnotationTooltip = (details?: string) => {
  // Note: Seems to be necessary to get things typed correctly all the way through to elastic-charts components
  if (!details) {
    return <div />;
  }
  return <AnnotationTooltip details={details} />;
};

const TooltipWrapper = euiStyled('div')`
  white-space: nowrap;
`;
