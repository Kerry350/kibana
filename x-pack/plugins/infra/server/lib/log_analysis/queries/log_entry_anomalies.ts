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
import { Sort, Pagination } from '../../../../common/http_api/log_analysis';

// TODO: Reassess validity of this against ML docs
const TIEBREAKER_FIELD = '_doc';

const sortToMlFieldMap = {
  dataset: 'partition_field_value',
  anomalyScore: 'record_score',
  startTime: 'timestamp',
};

export const createLogEntryAnomaliesQuery = (
  jobIds: string[],
  startTime: number,
  endTime: number,
  sort: Sort,
  pagination: Pagination
) => {
  const { field, direction } = sort;
  const { pageSize, cursor } = pagination;

  const filters = [
    ...createJobIdFilters(jobIds),
    ...createTimeRangeFilters(startTime, endTime),
    ...createResultTypeFilters(['record']),
  ];
  const sourceFields = ['job_id', 'record_score', 'typical', 'actual', 'partition_field_value'];
  const sortOptions = [
    { [sortToMlFieldMap[field]]: direction },
    { [TIEBREAKER_FIELD]: direction }, // Tiebreaker
  ];

  const resultsQuery = {
    ...defaultRequestParameters,
    body: {
      query: {
        bool: {
          filter: filters,
        },
      },
      search_after: cursor,
      sort: sortOptions,
      size: pageSize,
      _source: sourceFields,
    },
  };

  return resultsQuery;
};

export const logEntryAnomalyHitRT = rt.type({
  _id: rt.string,
  _source: rt.type({
    job_id: rt.string,
    record_score: rt.number,
    typical: rt.array(rt.number),
    actual: rt.array(rt.number),
    partition_field_value: rt.string,
  }),
  sort: rt.tuple([rt.union([rt.string, rt.number]), rt.string]),
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
