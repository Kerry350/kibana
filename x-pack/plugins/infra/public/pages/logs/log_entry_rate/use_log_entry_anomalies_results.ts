/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { useMemo, useState } from 'react';

import { LogEntryAnomaly } from '../../../../common/http_api';
import { useTrackedPromise } from '../../../utils/use_tracked_promise';
import { callGetLogEntryAnomaliesAPI } from './service_calls/get_log_entry_anomalies';

export const useLogEntryAnomaliesResults = ({
  endTime,
  startTime,
  sourceId,
}: {
  endTime: number;
  startTime: number;
  sourceId: string;
}) => {
  const [logEntryAnomalies, setLogEntryAnomalies] = useState<LogEntryAnomaly[]>([]);

  const [getLogEntryAnomaliesRequest, getLogEntryAnomalies] = useTrackedPromise(
    {
      cancelPreviousOn: 'creation',
      createPromise: async () => {
        return await callGetLogEntryAnomaliesAPI(sourceId, startTime, endTime);
      },
      onResolve: ({ data: { anomalies } }) => {
        setLogEntryAnomalies(anomalies);
      },
    },
    [endTime, sourceId, startTime]
  );

  const isLoadingLogEntryAnomalies = useMemo(
    () => getLogEntryAnomaliesRequest.state === 'pending',
    [getLogEntryAnomaliesRequest.state]
  );

  const hasFailedLoadingLogEntryAnomalies = useMemo(
    () => getLogEntryAnomaliesRequest.state === 'rejected',
    [getLogEntryAnomaliesRequest.state]
  );

  return {
    logEntryAnomalies,
    getLogEntryAnomalies,
    isLoadingLogEntryAnomalies,
    hasFailedLoadingLogEntryAnomalies,
  };
};
