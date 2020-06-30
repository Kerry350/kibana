/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { RequestHandlerContext } from 'src/core/server';
import { InfraRequestHandlerContext } from '../../types';
import { startTracingSpan } from '../../../common/performance_tracing';
import { fetchMlJob } from './common';
import {
  getJobId,
  jobCustomSettingsRT,
  logEntryCategoriesJobTypes,
} from '../../../common/log_analysis';

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

  const logEntryAnomaliesSpan = finalizeLogEntryAnomaliesSpan();

  return {
    data: anomalies,
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
