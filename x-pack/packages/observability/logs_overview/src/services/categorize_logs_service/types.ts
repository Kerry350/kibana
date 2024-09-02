/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { ISearchGeneric } from '@kbn/search-types';

export interface CategorizeLogsServiceDependencies {
  search: ISearchGeneric;
}

export interface LogsCategorizationParams {
  start: string;
  end: string;
  index: string;
  timeField: string;
  messageField: string;
}
