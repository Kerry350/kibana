/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

export const LOG_DOCUMENT_COUNT_ALERT_TYPE_ID = 'logs.alert.document.count';

export enum Comparator {
  GT = 'more than',
  GT_OR_EQ = 'more than or equals',
  LT = 'less than',
  LT_OR_EQ = 'less than or equals',
  EQ = 'equals',
  NOT_EQ = 'does not equal',
  MATCH = 'matches',
  NOT_MATCH = 'does not match',
}

export enum AlertStates {
  OK,
  ALERT,
  NO_DATA,
  ERROR,
}

export interface LogThresholdAlertParams {
  threshold: number;
  comparator: Comparator;
  timeUnit: 's' | 'm' | 'h' | 'd';
  timeSize: number;
}

export type TimeUnit = 's' | 'm' | 'h' | 'd';
