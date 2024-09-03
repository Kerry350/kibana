/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Fleet wrapper schema
 *   version: 1
 */

import { z } from '@kbn/zod';

import { Id } from '../model/schema/common_attributes.gen';

export type GetAgentDetailsRequestParams = z.infer<typeof GetAgentDetailsRequestParams>;
export const GetAgentDetailsRequestParams = z.object({
  id: Id,
});
export type GetAgentDetailsRequestParamsInput = z.input<typeof GetAgentDetailsRequestParams>;

export type GetAgentDetailsResponse = z.infer<typeof GetAgentDetailsResponse>;
export const GetAgentDetailsResponse = z.object({});

export type GetAgentPackagePoliciesResponse = z.infer<typeof GetAgentPackagePoliciesResponse>;
export const GetAgentPackagePoliciesResponse = z.object({});

export type GetAgentPoliciesResponse = z.infer<typeof GetAgentPoliciesResponse>;
export const GetAgentPoliciesResponse = z.object({});

export type GetAgentPolicyRequestParams = z.infer<typeof GetAgentPolicyRequestParams>;
export const GetAgentPolicyRequestParams = z.object({
  id: Id,
});
export type GetAgentPolicyRequestParamsInput = z.input<typeof GetAgentPolicyRequestParams>;

export type GetAgentPolicyResponse = z.infer<typeof GetAgentPolicyResponse>;
export const GetAgentPolicyResponse = z.object({});
export type GetAgentsRequestQuery = z.infer<typeof GetAgentsRequestQuery>;
export const GetAgentsRequestQuery = z.object({
  query: z.object({}),
});
export type GetAgentsRequestQueryInput = z.input<typeof GetAgentsRequestQuery>;

export type GetAgentsResponse = z.infer<typeof GetAgentsResponse>;
export const GetAgentsResponse = z.object({});
