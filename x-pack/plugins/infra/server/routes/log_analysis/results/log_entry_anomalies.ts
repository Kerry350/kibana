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
  GetLogEntryAnomaliesSuccessResponsePayload,
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
        data: { sourceId, timeRange },
      } = request.body;

      try {
        assertHasInfraMlPlugins(requestContext);

        const logEntryAnomalies = await getLogEntryAnomalies(
          requestContext,
          sourceId,
          timeRange.startTime,
          timeRange.endTime
        );

        return response.ok({
          body: getLogEntryAnomaliesSuccessReponsePayloadRT.encode({
            data: {
              anomalies: logEntryAnomalies,
            },
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
