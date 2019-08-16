/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useCallback, useMemo, useState } from 'react';

import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import {
  EuiSuperDatePicker,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPanel,
  EuiBadge,
} from '@elastic/eui';
import dateMath from '@elastic/datemath';
import moment from 'moment';
import { useTrackPageview } from '../../../hooks/use_track_metric';
import { useInterval } from '../../../hooks/use_interval';
import { useLogAnalysisResults } from '../../../containers/logs/log_analysis';
import { useLogAnalysisResultsUrlState } from '../../../containers/logs/log_analysis';
import { LoadingPage } from '../../../components/loading_page';
import { LogRateResults } from './sections/log_rate';

const DATE_PICKER_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

const getLoadingState = () => {
  return (
    <LoadingPage
      message={i18n.translate('xpack.infra.logs.logsAnalysisResults.loadingMessage', {
        defaultMessage: 'Loading results...',
      })}
    />
  );
};

export const AnalysisResultsContent = ({ sourceId }: { sourceId: string }) => {
  useTrackPageview({ app: 'infra_logs', path: 'analysis_results' });
  useTrackPageview({ app: 'infra_logs', path: 'analysis_results', delay: 15000 });

  const {
    timeRange,
    setTimeRange,
    autoRefreshEnabled,
    setAutoRefresh,
  } = useLogAnalysisResultsUrlState();

  const [refreshInterval, setRefreshInterval] = useState(300000);

  const setTimeRangeToNow = useCallback(() => {
    const range = timeRange.endTime - timeRange.startTime;
    const nowInMs = moment()
      .utc()
      .valueOf();
    setTimeRange({
      startTime: nowInMs - range,
      endTime: nowInMs,
    });
  }, [timeRange.startTime, timeRange.endTime, setTimeRange]);

  useInterval(setTimeRangeToNow, autoRefreshEnabled ? refreshInterval : null);

  const bucketDuration = useMemo(() => {
    // This function takes the current time range in ms,
    // works out the bucket interval we'd need to always
    // display 200 data points, and then takes that new
    // value and works out the nearest multiple of
    // 900000 (15 minutes) to it, so that we don't end up with
    // jaggy bucket boundaries between the ML buckets and our
    // aggregation buckets.
    const msRange = timeRange.endTime - timeRange.startTime;
    const bucketIntervalInMs = msRange / 200;
    const bucketSpan = 900000; // TODO: Pull this from 'common' when setup hook PR is merged
    const result = bucketSpan * Math.round(bucketIntervalInMs / bucketSpan);
    const roundedResult = parseInt(Number(result).toFixed(0), 10);
    return roundedResult < bucketSpan ? bucketSpan : roundedResult;
  }, [timeRange]);
  const { isLoading, logEntryRate } = useLogAnalysisResults({
    sourceId,
    startTime: timeRange.startTime,
    endTime: timeRange.endTime,
    bucketDuration,
  });
  const handleTimeRangeChange = useCallback(
    ({ start, end }: { start: string; end: string }) => {
      const parsedStart = dateMath.parse(start);
      const parsedEnd = dateMath.parse(end);
      setTimeRange({
        startTime:
          !parsedStart || !parsedStart.isValid() ? timeRange.startTime : parsedStart.valueOf(),
        endTime: !parsedEnd || !parsedEnd.isValid() ? timeRange.endTime : parsedEnd.valueOf(),
      });
    },
    [setTimeRange, timeRange]
  );

  const anomaliesDetected = useMemo(() => {
    if (!logEntryRate) {
      return null;
    } else {
      if (logEntryRate.histogramBuckets && logEntryRate.histogramBuckets.length) {
        return logEntryRate.histogramBuckets.reduce((acc: any, bucket) => {
          if (bucket.anomalies.length > 0) {
            return (
              acc +
              bucket.anomalies.reduce((anomalyAcc: any, anomaly) => {
                return anomalyAcc + 1;
              }, 0)
            );
          } else {
            return acc;
          }
        }, 0);
      } else {
        return null;
      }
    }
  }, [logEntryRate]);

  return (
    <>
      {isLoading && !logEntryRate ? (
        <>{getLoadingState()}</>
      ) : (
        <>
          <EuiPanel paddingSize="l" grow={false}>
            <EuiFlexGroup justifyContent="spaceBetween">
              <EuiFlexItem grow={7}>
                <EuiFlexGroup alignItems="center">
                  <EuiFlexItem grow={false}>
                    {anomaliesDetected !== null ? (
                      <>
                        <span>
                          {anomaliesDetected === 0 ? (
                            <FormattedMessage
                              id="xpack.infra.logs.analysis.anomaliesDetectedZero"
                              defaultMessage="Detected {formattedNumber} anomalies"
                              values={{
                                formattedNumber: <EuiBadge color="default">0</EuiBadge>,
                              }}
                            />
                          ) : (
                            <FormattedMessage
                              id="xpack.infra.logs.analysis.anomaliesDetectedNumber"
                              defaultMessage="Detected {formattedNumber} anomalies"
                              values={{
                                formattedNumber: (
                                  <EuiBadge color="warning">{anomaliesDetected}</EuiBadge>
                                ),
                              }}
                            />
                          )}
                        </span>
                      </>
                    ) : null}
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiSuperDatePicker
                  start={moment.utc(timeRange.startTime).format(DATE_PICKER_FORMAT)}
                  end={moment.utc(timeRange.endTime).format(DATE_PICKER_FORMAT)}
                  onTimeChange={handleTimeRangeChange}
                  isPaused={!autoRefreshEnabled}
                  refreshInterval={refreshInterval}
                  onRefreshChange={({ isPaused, refreshInterval: interval }) => {
                    if (isPaused) {
                      setAutoRefresh(false);
                    } else {
                      setRefreshInterval(interval);
                      setAutoRefresh(true);
                    }
                  }}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
          <EuiPage style={{ minHeight: '100vh' }}>
            <EuiPageBody>
              <EuiPageContent>
                <EuiPageContentBody>
                  <LogRateResults isLoading={isLoading} results={logEntryRate} />
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      )}
    </>
  );
};
