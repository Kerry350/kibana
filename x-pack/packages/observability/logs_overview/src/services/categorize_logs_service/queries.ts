/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';
import { calculateAuto } from '@kbn/calculate-auto';
import { RandomSamplerWrapper } from '@kbn/ml-random-sampler-utils';
import moment from 'moment';

const isoTimestampFormat = "YYYY-MM-DD'T'HH:mm:ss.SSS'Z'";

export const createCategorizationQuery = (
  messageField: string,
  timeField: string,
  startTimestamp: string,
  endTimestamp: string,
  ignoredQueries: string[] = []
): QueryDslQueryContainer => {
  return {
    bool: {
      filter: [
        {
          exists: {
            field: messageField,
          },
        },
        {
          range: {
            [timeField]: {
              gte: startTimestamp,
              lte: endTimestamp,
              format: 'strict_date_time',
            },
          },
        },
      ],
      must_not: ignoredQueries.map((ignoredQuery) => ({
        match: {
          [messageField]: {
            query: ignoredQuery,
            operator: 'AND' as const,
            fuzziness: 0,
            auto_generate_synonyms_phrase_query: false,
          },
        },
      })),
    },
  };
};

export const createCategorizationRequestParams = ({
  index,
  timeField,
  messageField,
  startTimestamp,
  endTimestamp,
  randomSampler,
  minDocsPerCategory = 0,
  ignoredQueries = [],
}: {
  startTimestamp: string;
  endTimestamp: string;
  index: string;
  timeField: string;
  messageField: string;
  randomSampler: RandomSamplerWrapper;
  minDocsPerCategory?: number;
  ignoredQueries?: string[];
}) => {
  const startMoment = moment(startTimestamp, isoTimestampFormat);
  const endMoment = moment(endTimestamp, isoTimestampFormat);
  const fixedIntervalDuration = calculateAuto.atLeast(
    24,
    moment.duration(endMoment.diff(startMoment))
  );
  const fixedIntervalSize = `${Math.ceil(fixedIntervalDuration?.asMinutes() ?? 1)}m`;

  return {
    index,
    size: 0,
    track_total_hits: false,
    query: createCategorizationQuery(
      messageField,
      timeField,
      startTimestamp,
      endTimestamp,
      ignoredQueries
    ),
    aggs: randomSampler.wrap({
      histogram: {
        date_histogram: {
          field: '@timestamp',
          fixed_interval: fixedIntervalSize,
          extended_bounds: {
            min: startTimestamp,
            max: endTimestamp,
          },
        },
      },
      categories: {
        categorize_text: {
          field: messageField,
          size: 10000,
          categorization_analyzer: {
            tokenizer: 'standard',
          },
          ...(minDocsPerCategory > 0 ? { min_doc_count: minDocsPerCategory } : {}),
        },
        aggs: {
          histogram: {
            date_histogram: {
              field: timeField,
              fixed_interval: fixedIntervalSize,
              extended_bounds: {
                min: startTimestamp,
                max: endTimestamp,
              },
            },
          },
          change: {
            // @ts-expect-error the official types don't support the change_point aggregation
            change_point: {
              buckets_path: 'histogram>_count',
            },
          },
        },
      },
    }),
  };
};
