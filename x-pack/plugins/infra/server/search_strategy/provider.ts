/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { ISearchStrategy, PluginStart } from '../../../../../src/plugins/data/server';
import { IEsSearchResponse, ISearchRequestParams } from '../../../../../src/plugins/data/common';

// NOTE: Types are shown as super rough examples here. We usually stay away from enums, so they'd likely be
// keyof via io-ts. And 'any' is used in some places as it just sped up putting the example together.
interface ExampleRequestOptions {
  queryType: FactoryQueryTypes,
  params?: {
    size: 10,
    body: {
      query: {}
    }
  }
}

type LogEntriesEntriesReqestOptions = ExampleRequestOptions;
type LogEntriesItemReqestOptions = ExampleRequestOptions;

interface ExampleResponse extends IEsSearchResponse {
  results: {
    name: string
  }[]
};

type LogEntriesEntriesStrategyResponse = ExampleResponse;
type LogEntriesItemStrategyResponse = ExampleResponse;

export enum LogEntriesQueries {
  entries = 'entries',
  highlights = 'highlights',
  summaryBuckets = 'summaryBuckets',
  item = 'item',
}

type FactoryQueryTypes = LogEntriesQueries;

type StrategyRequestType<T extends FactoryQueryTypes> = T extends LogEntriesQueries.entries
  ? LogEntriesEntriesReqestOptions
  : T extends LogEntriesQueries.item
  ? LogEntriesItemReqestOptions
  : never;

  export type StrategyResponseType<T extends FactoryQueryTypes> = T extends LogEntriesQueries.entries
  ? LogEntriesEntriesStrategyResponse
  : T extends LogEntriesQueries.item
  ? LogEntriesItemStrategyResponse
  : never;



export interface InfraQueryTypeFactory<T extends FactoryQueryTypes> {
  buildDsl: (options: StrategyRequestType<T>) => ISearchRequestParams;
  parse: (
    options: StrategyRequestType<T>,
    response: IEsSearchResponse
  ) => Promise<StrategyResponseType<T>>;
}


// NOTE: Switch harcoded ID to something you know exists to try this out
const queryTypeFactories = {
  [LogEntriesQueries.item]: {
    buildDsl: (options: any) => {
      return {
        "index":"logs-*,filebeat-*,kibana_sample_data_logs*",
        "terminate_after":1,
        "body":{
            "size":1,
            "sort":[
              {
                  "@timestamp":"desc"
              },
              {
                  "_doc":"desc"
              }
            ],
            "query":{
              "ids":{
                  "values":[
                    "ww5WbXQBHyE_1lJ-g4vn"
                  ]
              }
            }
        }
      }
    },
    parse: async (
      options: any,
      response: any,
    ): Promise<any> => {
      return { ...response }
    },
    }
}
export const infraSearchStrategyProvider = <T extends FactoryQueryTypes>(
  data: PluginStart
): ISearchStrategy<StrategyRequestType<T>, StrategyResponseType<T>> => {
  const es = data.search.getSearchStrategy('es');

  return {
    search: async (context, request, options) => {
      if (request.queryType == null) {
        throw new Error('queryType is required');
      }
      const queryFactory: InfraQueryTypeFactory<T> = queryTypeFactories[request.queryType];
      const dsl = queryFactory.buildDsl(request);
      const esSearchRes = await es.search(context, { ...request, params: dsl }, options);
      return queryFactory.parse(request, esSearchRes);
    },
    cancel: async (context, id) => {
      if (es.cancel) {
        es.cancel(context, id);
      }
    },
  };
};