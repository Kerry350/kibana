/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { PluginInitializerContext } from 'src/core/server';
import { InfraServerPlugin, config, InfraConfig } from './new_platform_plugin';

// NP_TODO: kibana NP needs "config" to be exported from here, I think?
export { config, InfraConfig };

export function plugin(context: PluginInitializerContext) {
  return new InfraServerPlugin(context);
}
