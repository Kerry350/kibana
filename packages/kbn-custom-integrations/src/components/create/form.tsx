/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useCallback } from 'react';
import {
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiIconTip,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { useActor, useSelector } from '@xstate/react';
import { replaceSpecialChars } from './utils';
import { ErrorCallout } from './error_callout';
import { CreateCustomIntegrationActorRef } from '../../state_machines/create/state_machine';
import {
  CreateCustomIntegrationOptions,
  WithOptionalErrors,
  WithTouchedFields,
} from '../../state_machines/create/types';
import { Dataset, IntegrationError } from '../../types';
import { hasFailedSelector } from '../../state_machines/create/selectors';

// NOTE: Hardcoded for now. We will likely extend the functionality here to allow the selection of the type.
// And also to allow adding multiple datasets.
const DATASET_TYPE = 'logs' as const;

export const ConnectedCreateCustomIntegrationForm = ({
  machineRef,
}: {
  machineRef: CreateCustomIntegrationActorRef;
}) => {
  const [state, send] = useActor(machineRef);

  const updateIntegrationName = useCallback(
    (integrationName: string) => {
      send({ type: 'UPDATE_FIELDS', fields: { integrationName } });
    },
    [send]
  );

  const updateDatasetName = useCallback(
    (datasetName: string) => {
      send({
        type: 'UPDATE_FIELDS',
        fields: {
          datasets: [{ type: DATASET_TYPE, name: datasetName }],
        },
      });
    },
    [send]
  );

  const retry = useCallback(() => {
    send({ type: 'RETRY' });
  }, [send]);

  const hasFailed = useSelector(machineRef, hasFailedSelector);

  return (
    <CreateCustomIntegrationForm
      integrationName={state?.context.fields.integrationName}
      datasetName={state?.context.fields.datasets[0].name} // NOTE: Hardcoded for now until we support multiple datasets
      errors={state.context.errors}
      updateIntegrationName={updateIntegrationName}
      updateDatasetName={updateDatasetName}
      touchedFields={state?.context.touchedFields}
      hasFailed={hasFailed}
      onRetry={hasFailed ? retry : undefined}
    />
  );
};

interface FormProps {
  integrationName: CreateCustomIntegrationOptions['integrationName'];
  datasetName: Dataset['name'];
  errors: WithOptionalErrors['errors'];
  touchedFields: WithTouchedFields['touchedFields'];
  updateIntegrationName: (integrationName: string) => void;
  updateDatasetName: (integrationName: string) => void;
  hasFailed: boolean;
  onRetry?: () => void;
}

export const CreateCustomIntegrationForm = ({
  integrationName,
  datasetName,
  errors,
  touchedFields,
  updateIntegrationName,
  updateDatasetName,
  onRetry,
}: FormProps) => {
  return (
    <>
      <EuiText color="subdued">
        <p>
          {i18n.translate('customIntegrationsPackage.create.configureIntegrationDescription', {
            defaultMessage: 'Configure integration',
          })}
        </p>
      </EuiText>
      <EuiSpacer size="l" />
      <EuiForm fullWidth>
        <EuiFormRow
          label={
            <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
              <EuiFlexItem grow={false}>
                {i18n.translate('customIntegrationsPackage.create.integration.name', {
                  defaultMessage: 'Integration name',
                })}
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiIconTip
                  content={i18n.translate(
                    'customIntegrationsPackage.create.integration.name.tooltip',
                    {
                      defaultMessage:
                        'Provide a name for the integration that will be created to organise these custom logs.',
                    }
                  )}
                  position="right"
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          }
          helpText={i18n.translate('customIntegrationsPackage.create.integration.helper', {
            defaultMessage:
              "All lowercase, max 100 chars, special characters will be replaced with '_'.",
          })}
          isInvalid={hasErrors(errors?.fields?.integrationName) && touchedFields.integrationName}
          error={errorsList(errors?.fields?.integrationName)}
        >
          <EuiFieldText
            placeholder={i18n.translate(
              'customIntegrationsPackage.create.integration.placeholder',
              {
                defaultMessage: 'Give your integration a name',
              }
            )}
            value={integrationName}
            onChange={(event) => updateIntegrationName(replaceSpecialChars(event.target.value))}
            isInvalid={hasErrors(errors?.fields?.integrationName) && touchedFields.integrationName}
          />
        </EuiFormRow>
        <EuiFormRow
          label={
            <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
              <EuiFlexItem grow={false}>
                {i18n.translate('customIntegrationsPackage.create.dataset.name', {
                  defaultMessage: 'Dataset name',
                })}
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiIconTip
                  content={i18n.translate('customIntegrationsPackage.create.dataset.name.tooltip', {
                    defaultMessage:
                      'Provide a dataset name to help organise these custom logs. This dataset will be associated with the integration.',
                  })}
                  position="right"
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          }
          helpText={i18n.translate('customIntegrationsPackage.create.dataset.helper', {
            defaultMessage:
              "All lowercase, max 100 chars, special characters will be replaced with '_'.",
          })}
          isInvalid={hasErrors(errors?.fields?.datasets?.[0]?.name) && touchedFields.datasets}
          error={errorsList(errors?.fields?.datasets?.[0]?.name)}
        >
          <EuiFieldText
            placeholder={i18n.translate('customIntegrationsPackage.create.dataset.placeholder', {
              defaultMessage: "Give your integration's dataset a name",
            })}
            value={datasetName}
            onChange={(event) => updateDatasetName(replaceSpecialChars(event.target.value))}
            isInvalid={hasErrors(errors?.fields?.datasets?.[0].name) && touchedFields.datasets}
          />
        </EuiFormRow>
      </EuiForm>
      {errors?.general && (
        <>
          <EuiSpacer size="l" />
          <ErrorCallout error={errors?.general} onRetry={onRetry} />
        </>
      )}
    </>
  );
};

const hasErrors = (errors?: IntegrationError[]) => errors && errors.length > 0;

const errorsList = (errors?: IntegrationError[]) => {
  return hasErrors(errors) ? (
    <ul>
      {errors!.map((error, index) => (
        <li key={index}>{error.message}</li>
      ))}
    </ul>
  ) : null;
};
