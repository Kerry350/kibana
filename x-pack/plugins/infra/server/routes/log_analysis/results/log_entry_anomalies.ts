/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Boom from 'boom';
import { InfraBackendLibs } from '../../../lib/infra_types';
import {
  LOG_ANALYSIS_GET_LOG_ENTRY_ANOMALIES_PATH,
  getLogEntryAnomaliesSuccessReponsePayloadRT,
  getLogEntryAnomaliesRequestPayloadRT,
  GetLogEntryAnomaliesRequestPayload,
  Sort,
  Pagination,
} from '../../../../common/http_api/log_analysis';
import { createValidationFunction } from '../../../../common/runtime_types';
import { assertHasInfraMlPlugins } from '../../../utils/request_context';
import { getLogEntryAnomalies } from '../../../lib/log_analysis';

export const initGetLogEntryAnomaliesRoute = ({ framework }: InfraBackendLibs) => {
  framework.registerRoute(
    {
      method: 'post',
      path: LOG_ANALYSIS_GET_LOG_ENTRY_ANOMALIES_PATH,
      validate: {
        body: createValidationFunction(getLogEntryAnomaliesRequestPayloadRT),
      },
    },
    framework.router.handleLegacyErrors(async (requestContext, request, response) => {
      const {
        data: {
          sourceId,
          timeRange: { startTime, endTime },
          sort: sortParam,
          pagination: paginationParam,
        },
      } = request.body;

      const { sort, pagination } = getSortAndPagination(sortParam, paginationParam);

      try {
        assertHasInfraMlPlugins(requestContext);

        const { data: logEntryAnomalies, paginationCursors, timing } = await getLogEntryAnomalies(
          requestContext,
          sourceId,
          startTime,
          endTime,
          sort,
          pagination
        );

        return response.ok({
          body: getLogEntryAnomaliesSuccessReponsePayloadRT.encode({
            data: {
              anomalies: logEntryAnomalies,
              paginationCursors,
            },
            timing,
          }),
        });
      } catch (error) {
        if (Boom.isBoom(error)) {
          throw error;
        }

        return response.customError({
          statusCode: error.statusCode ?? 500,
          body: {
            message: error.message ?? 'An unexpected error occurred',
          },
        });
      }
    })
  );
};

const getSortAndPagination = (
  sortParam: GetLogEntryAnomaliesRequestPayload['data']['sort'],
  paginationParam: GetLogEntryAnomaliesRequestPayload['data']['pagination']
): {
  sort: Sort;
  pagination: Pagination;
} => {
  const sort = sortParam ?? {};
  const pagination = paginationParam ?? {};

  const sortDefaults = {
    field: 'anomalyScore' as const,
    direction: 'desc' as const,
  };

  const sortWithDefaults = {
    ...sortDefaults,
    ...sort,
  };

  const paginationDefaults = {
    pageSize: 50,
  };

  const paginationWithDefaults = {
    ...paginationDefaults,
    ...pagination,
  };

  return { sort: sortWithDefaults, pagination: paginationWithDefaults };
};
