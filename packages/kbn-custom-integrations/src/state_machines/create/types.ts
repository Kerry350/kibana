/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { CustomIntegrationOptions, IntegrationError } from '../../types';
import { IndexedValidationErrors, ValidationErrors } from '../services/validation';

export type CreateCustomIntegrationOptions = CustomIntegrationOptions;

export interface WithTouchedFields {
  touchedFields: Record<keyof CreateCustomIntegrationOptions, boolean>;
}

export type CreateInitialState = WithOptions & WithFields & WithPreviouslyCreatedIntegration;

export interface WithOptions {
  options: {
    deletePrevious?: boolean;
    resetOnCreation?: boolean;
  };
}

export interface WithIntegrationName {
  integrationName: CreateCustomIntegrationOptions['integrationName'];
}

export interface WithPreviouslyCreatedIntegration {
  previouslyCreatedIntegration?: CreateCustomIntegrationOptions;
}

export interface WithDatasets {
  datasets: CreateCustomIntegrationOptions['datasets'];
}

export interface WithFields {
  fields: WithIntegrationName & WithDatasets;
}

export interface WithErrors {
  errors: {
    fields: Partial<{
      integrationName: IntegrationError[];
      datasets: IndexedValidationErrors;
    }> | null;
    general: IntegrationError | null;
  };
}

export interface WithNullishErrors {
  errors: null;
}

export type WithOptionalErrors = WithErrors | WithNullishErrors;

export type DefaultCreateCustomIntegrationContext = WithOptions &
  WithFields &
  WithTouchedFields &
  WithPreviouslyCreatedIntegration &
  WithNullishErrors;

export type CreateCustomIntegrationTypestate =
  | {
      value: 'uninitialized';
      context: DefaultCreateCustomIntegrationContext;
    }
  | {
      value: 'validating';
      context: DefaultCreateCustomIntegrationContext & WithOptionalErrors;
    }
  | { value: 'valid'; context: DefaultCreateCustomIntegrationContext & WithNullishErrors }
  | {
      value: 'validationFailed';
      context: DefaultCreateCustomIntegrationContext & WithErrors;
    }
  | { value: 'submitting'; context: DefaultCreateCustomIntegrationContext & WithNullishErrors }
  | { value: 'success'; context: DefaultCreateCustomIntegrationContext & WithNullishErrors }
  | { value: 'failure'; context: DefaultCreateCustomIntegrationContext & WithErrors }
  | {
      value: 'deletingPrevious';
      context: DefaultCreateCustomIntegrationContext & WithNullishErrors;
    };

export type CreateCustomIntegrationContext = CreateCustomIntegrationTypestate['context'];

export type CreateCustomIntegrationEvent =
  | {
      type: 'UPDATE_FIELDS';
      fields: Partial<CreateCustomIntegrationOptions>;
    }
  | {
      type: 'INITIALIZE';
    }
  | {
      type: 'SAVE';
    }
  | {
      type: 'RETRY';
    }
  | {
      type: 'done.invoke.validateFields';
      data: { errors: ValidationErrors };
    }
  | {
      type: 'done.invoke.cleanup';
      data: { error: IntegrationError };
    }
  | {
      type: 'done.invoke.save';
      data: CreateCustomIntegrationOptions | { error: IntegrationError };
    };
