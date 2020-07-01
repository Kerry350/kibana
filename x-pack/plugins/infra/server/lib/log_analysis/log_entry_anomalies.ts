/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { RequestHandlerContext } from 'src/core/server';
import { InfraRequestHandlerContext } from '../../types';
import { startTracingSpan } from '../../../common/performance_tracing';
import { fetchMlJob } from './common';
import { getJobId, logEntryCategoriesJobTypes } from '../../../common/log_analysis';
import type { MlSystem } from '../../types';
import { createLogEntryAnomaliesQuery, logEntryAnomaliesResponseRT } from './queries';
import { decodeOrThrow } from '../../../common/runtime_types';

export async function getLogEntryAnomalies(
  context: RequestHandlerContext & { infra: Required<InfraRequestHandlerContext> },
  sourceId: string,
  startTime: number,
  endTime: number
) {
  const finalizeLogEntryAnomaliesSpan = startTracingSpan('get log entry anomalies');

  const logRateJobId = getJobId(context.infra.spaceId, sourceId, 'log-entry-rate');
  const logCategoriesJobId = getJobId(
    context.infra.spaceId,
    sourceId,
    logEntryCategoriesJobTypes[0]
  );

  const {
    mlJob: logRateJob,
    timing: { spans: fetchLogRateMlJobSpans },
  } = await fetchMlJob(context.infra.mlAnomalyDetectors, logRateJobId);

  const {
    mlJob: logCategoriesJob,
    timing: { spans: fetchLogCategoriesMlJobSpans },
  } = await fetchMlJob(context.infra.mlAnomalyDetectors, logCategoriesJobId);

  const jobIds: string[] = [
    ...(logRateJob ? [logRateJobId] : []),
    ...(logCategoriesJob ? [logCategoriesJobId] : []),
  ];
  const {
    anomalies,
    timing: { spans: fetchLogEntryAnomaliesSpans },
  } = await fetchLogEntryAnomalies(context.infra.mlSystem, jobIds, startTime, endTime);

  const data = anomalies.map((anomaly) => {
    const { id, anomalyScore, dataset, typical, actual, jobId } = anomaly;

    return {
      id,
      anomalyScore,
      dataset,
      typical,
      actual,
      type: jobId === logRateJobId ? ('logRate' as const) : ('logCategory' as const),
    };
  });

  const logEntryAnomaliesSpan = finalizeLogEntryAnomaliesSpan();

  return {
    data,
    timing: {
      spans: [
        logEntryAnomaliesSpan,
        ...fetchLogRateMlJobSpans,
        ...fetchLogCategoriesMlJobSpans,
        ...fetchLogEntryAnomaliesSpans,
      ],
    },
  };
}

async function fetchLogEntryAnomalies(
  mlSystem: MlSystem,
  jobIds: string[],
  startTime: number,
  endTime: number
) {
  if (jobIds.length === 0) {
    return {
      anomalies: [],
      timing: { spans: [] },
    };
  }

  const finalizeFetchLogEntryAnomaliesSpan = startTracingSpan('fetch log entry anomalies');

  const results = decodeOrThrow(logEntryAnomaliesResponseRT)(
    await mlSystem.mlAnomalySearch(createLogEntryAnomaliesQuery(jobIds, startTime, endTime))
  );

  const anomalies = results.hits.hits.map((result) => {
    const {
      job_id,
      record_score: anomalyScore,
      typical,
      actual,
      partition_field_value: dataset,
    } = result._source;

    return {
      id: result._id,
      anomalyScore,
      dataset,
      typical: typical[0],
      actual: actual[0],
      jobId: job_id,
    };
  });

  const fetchLogEntryAnomaliesSpan = finalizeFetchLogEntryAnomaliesSpan();

  return {
    anomalies,
    timing: {
      spans: [fetchLogEntryAnomaliesSpan],
    },
  };
}
