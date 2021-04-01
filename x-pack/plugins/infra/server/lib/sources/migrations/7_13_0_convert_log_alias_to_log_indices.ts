/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { SavedObjectMigrationFn } from 'src/core/server';
import { InfraSourceConfiguration } from '../../../../common/source_configuration/source_configuration';

export const convertLogAliasToLogIndices: SavedObjectMigrationFn<
  InfraSourceConfiguration,
  InfraSourceConfiguration
> = (sourceConfigurationDocument) => {
  // if (sourceConfigurationDocument.attributes.logAlias) {
  // } else {
  //   return;
  // }
};
