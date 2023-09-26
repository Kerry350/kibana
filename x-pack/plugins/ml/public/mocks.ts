/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { sharePluginMock } from '@kbn/share-plugin/public/mocks';
import { type ElasticModels } from './application/services/elastic_models_service';
import type { MlPluginSetup, MlPluginStart } from './plugin';

const createSetupContract = (): jest.Mocked<MlPluginSetup> => {
  return {
    locator: sharePluginMock.createLocator(),
  };
};

const createStartContract = (): jest.Mocked<MlPluginStart> => {
  return {
    locator: sharePluginMock.createLocator(),
    elasticModels: {
      getELSER: jest.fn(() =>
        Promise.resolve({
          version: 2,
          default: true,
          config: {
            input: {
              field_names: ['text_field'],
            },
          },
          description: 'Elastic Learned Sparse EncodeR v2 (Tech Preview)',
          name: '.elser_model_2',
        })
      ),
    } as unknown as jest.Mocked<ElasticModels>,
  };
};

export const mlPluginMock = {
  createSetupContract,
  createStartContract,
};
