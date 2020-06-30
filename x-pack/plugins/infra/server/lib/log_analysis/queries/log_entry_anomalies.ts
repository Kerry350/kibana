/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import * as rt from 'io-ts';
import { commonSearchSuccessResponseFieldsRT } from '../../../utils/elasticsearch_runtime_types';
import { createJobIdFilters, defaultRequestParameters } from './common';

const ANOMALIES_RESULTS_COUNT = 1000;

export const createLogEntryAnomaliesQuery = (
  mlSystem: string,
  jobIds: string[],
  startTime: number,
  endTime: number
) => ({
  ...defaultRequestParameters,
  body: {
    query: {
      bool: {
        filter: [...createJobIdFilters(jobIds)],
      },
    },
  },
  size: ANOMALIES_RESULTS_COUNT,
});
