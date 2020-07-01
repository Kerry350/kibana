/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import * as rt from 'io-ts';

import { timeRangeRT, routeTimingMetadataRT } from '../../shared';

export const LOG_ANALYSIS_GET_LOG_ENTRY_ANOMALIES_PATH =
  '/api/infra/log_analysis/results/log_entry_anomalies';

const logRateAnomalyTypeRT = rt.literal('logRate');
const logCategorisationAnomalyTypeRT = rt.literal('logCategory');
export const anomalyTypeRT = rt.union([logRateAnomalyTypeRT, logCategorisationAnomalyTypeRT]);

const logEntryAnomalyRT = rt.type({
  id: rt.string,
  anomalyScore: rt.number,
  dataset: rt.string,
  typical: rt.number,
  actual: rt.number,
  type: anomalyTypeRT,
});

export type LogEntryAnomaly = rt.TypeOf<typeof logEntryAnomalyRT>;

export const getLogEntryAnomaliesSuccessReponsePayloadRT = rt.intersection([
  rt.type({
    data: rt.type({
      anomalies: rt.array(logEntryAnomalyRT),
    }),
  }),
  rt.partial({
    timing: routeTimingMetadataRT,
  }),
]);

export type GetLogEntryAnomaliesSuccessResponsePayload = rt.TypeOf<
  typeof getLogEntryAnomaliesSuccessReponsePayloadRT
>;

export const getLogEntryAnomaliesRequestPayloadRT = rt.type({
  data: rt.type({
    // the id of the source configuration
    sourceId: rt.string,
    // the time range to fetch the log rate examples from
    timeRange: timeRangeRT,
  }),
});
