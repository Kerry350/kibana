/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { SavedObjectsClientContract } from 'src/core/server';
import { InfraSources } from '../../lib/sources';

// NOTE: TEMPORARY: This will become a subset of the new resolved KIP compatible log source configuration.
interface LogRateFields {
  indexPattern: string;
  timestamp: string;
}

// NOTE: TEMPORARY: This will become a subset of the new resolved KIP compatible log source configuration.
export const createGetLogRateFields = (sources: InfraSources) => {
  return async (
    sourceId: string,
    savedObjectsClient: SavedObjectsClientContract
  ): Promise<LogRateFields> => {
    const source = await sources.getSourceConfiguration(savedObjectsClient, sourceId);

    return {
      indexPattern: source.configuration.logAlias,
      timestamp: source.configuration.fields.timestamp,
    };
  };
};

export type GetLogRateFields = ReturnType<typeof createGetLogRateFields>;
