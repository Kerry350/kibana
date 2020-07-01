/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import * as rt from 'io-ts';
import { commonSearchSuccessResponseFieldsRT } from '../../../utils/elasticsearch_runtime_types';
import {
  createJobIdFilters,
  createTimeRangeFilters,
  createResultTypeFilters,
  defaultRequestParameters,
} from './common';

const ANOMALIES_RESULTS_COUNT = 500;

export const createLogEntryAnomaliesQuery = (
  jobIds: string[],
  startTime: number,
  endTime: number
) => ({
  ...defaultRequestParameters,
  body: {
    query: {
      bool: {
        filter: [
          ...createJobIdFilters(jobIds),
          ...createTimeRangeFilters(startTime, endTime),
          ...createResultTypeFilters(['record']),
        ],
      },
    },
  },
  _source: ['job_id', 'record_score', 'typical', 'actual', 'partition_field_value'],
  size: ANOMALIES_RESULTS_COUNT,
});

export const logEntryAnomalyHitRT = rt.type({
  _id: rt.string,
  _source: rt.type({
    job_id: rt.string,
    record_score: rt.number,
    typical: rt.array(rt.number),
    actual: rt.array(rt.number),
    partition_field_value: rt.string,
  }),
});

export type LogEntryAnomalyHit = rt.TypeOf<typeof logEntryAnomalyHitRT>;

export const logEntryAnomaliesResponseRT = rt.intersection([
  commonSearchSuccessResponseFieldsRT,
  rt.type({
    hits: rt.type({
      hits: rt.array(logEntryAnomalyHitRT),
    }),
  }),
]);

export type LogEntryAnomaliesResponseRT = rt.TypeOf<typeof logEntryAnomaliesResponseRT>;
