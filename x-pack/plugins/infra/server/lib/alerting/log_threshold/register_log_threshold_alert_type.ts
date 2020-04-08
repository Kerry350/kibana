/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import uuid from 'uuid';
import { i18n } from '@kbn/i18n';
import { schema } from '@kbn/config-schema';
import { PluginSetupContract } from '../../../../../alerting/server';
import { createLogThresholdExecutor, FIRED_ACTIONS } from './log_threshold_executor';
import { LOG_DOCUMENT_COUNT_ALERT_TYPE_ID, Comparator } from './types';

// const sampleActionVariableDescription = i18n.translate(
//   'xpack.infra.logs.alerting.threshold.sampleActionVariableDescription',
//   {
//     defaultMessage:
//       'Action variables are whatever values you want to make available to messages that this alert sends. This one would replace in an action message.',
//   }
// );

const countSchema = schema.object({
  value: schema.number(),
  comparator: schema.oneOf([
    schema.literal(Comparator.GT),
    schema.literal(Comparator.LT),
    schema.literal(Comparator.GT_OR_EQ),
    schema.literal(Comparator.LT_OR_EQ),
    schema.literal(Comparator.EQ),
  ]),
});

const criteriaSchema = schema.object({
  field: schema.string(),
  comparator: schema.oneOf([
    schema.literal(Comparator.GT),
    schema.literal(Comparator.LT),
    schema.literal(Comparator.GT_OR_EQ),
    schema.literal(Comparator.LT_OR_EQ),
    schema.literal(Comparator.EQ),
    schema.literal(Comparator.NOT_EQ),
    schema.literal(Comparator.MATCH),
    schema.literal(Comparator.NOT_MATCH),
  ]),
  value: schema.oneOf([schema.number(), schema.string()]),
});

export async function registerLogThresholdAlertType(alertingPlugin: PluginSetupContract) {
  if (!alertingPlugin) {
    throw new Error(
      'Cannot register log threshold alert type.  Both the actions and alerting plugins need to be enabled.'
    );
  }

  const alertUUID = uuid.v4();

  alertingPlugin.registerType({
    id: LOG_DOCUMENT_COUNT_ALERT_TYPE_ID,
    name: 'Log threshold',
    validate: {
      params: schema.object({
        count: countSchema,
        criteria: schema.arrayOf(criteriaSchema),
        timeUnit: schema.string(),
        timeSize: schema.number(),
      }),
    },
    defaultActionGroupId: FIRED_ACTIONS.id,
    actionGroups: [FIRED_ACTIONS],
    executor: createLogThresholdExecutor(alertUUID),
    // actionVariables: {
    //   context: [{ name: 'sample', description: sampleActionVariableDescription }],
    // },
  });
}
