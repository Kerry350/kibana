/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import * as rt from 'io-ts';

import { timeRangeRT, routeTimingMetadataRT } from '../../shared';

export const LOG_ANALYSIS_GET_LOG_ENTRY_ANOMALIES_PATH =
  '/api/infra/log_analysis/results/log_entry_anomalies';

// [Sort field value, tiebreaker value]
const paginationCursorRT = rt.tuple([rt.union([rt.string, rt.number]), rt.string]);

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
    data: rt.intersection([
      rt.type({
        anomalies: rt.array(logEntryAnomalyRT),
      }),
      rt.partial({
        paginationCursor: paginationCursorRT,
      }),
    ]),
  }),
  rt.partial({
    timing: routeTimingMetadataRT,
  }),
]);

export type GetLogEntryAnomaliesSuccessResponsePayload = rt.TypeOf<
  typeof getLogEntryAnomaliesSuccessReponsePayloadRT
>;

const sortOptions = rt.union([
  rt.literal('anomalyScore'),
  rt.literal('dataset'),
  rt.literal('startTime'),
]);
const sortDirections = rt.union([rt.literal('asc'), rt.literal('desc')]);

const paginationRT = rt.intersection([
  rt.type({
    pageSize: rt.number,
  }),
  rt.partial({
    cursor: paginationCursorRT,
  }),
]);

export type Pagination = rt.TypeOf<typeof paginationRT>;

const sortRT = rt.type({
  field: sortOptions,
  direction: sortDirections,
});

export type Sort = rt.TypeOf<typeof sortRT>;

export const getLogEntryAnomaliesRequestPayloadRT = rt.type({
  data: rt.intersection([
    rt.type({
      // the ID of the source configuration
      sourceId: rt.string,
      // the time range to fetch the log entry anomalies from
      timeRange: timeRangeRT,
    }),
    rt.partial({
      // Pagination properties
      pagination: paginationRT,
      // Sort properties
      sort: sortRT,
    }),
  ]),
});

export type GetLogEntryAnomaliesRequestPayload = rt.TypeOf<
  typeof getLogEntryAnomaliesRequestPayloadRT
>;
