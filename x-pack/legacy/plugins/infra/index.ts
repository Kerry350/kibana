/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { i18n } from '@kbn/i18n';
import JoiNamespace from 'joi';
import { resolve } from 'path';
import { PluginInitializerContext } from 'src/core/server';
import KbnServer from 'src/legacy/server/kbn_server';
import { BehaviorSubject } from 'rxjs';
import { getConfigSchema } from './server/kibana.index';
import { savedObjectMappings } from './server/saved_objects';
import { plugin } from './server/new_platform_index';
import { UsageCollector } from './server/usage/usage_collector';

const APP_ID = 'infra';
const logsSampleDataLinkLabel = i18n.translate('xpack.infra.sampleDataLinkLabel', {
  defaultMessage: 'Logs',
});

export function infra(kibana: any) {
  return new kibana.Plugin({
    id: APP_ID,
    configPrefix: 'xpack.infra',
    publicDir: resolve(__dirname, 'public'),
    require: ['kibana', 'elasticsearch', 'metrics'],
    uiExports: {
      app: {
        description: i18n.translate('xpack.infra.infrastructureDescription', {
          defaultMessage: 'Explore your metrics',
        }),
        icon: 'plugins/infra/images/infra_mono_white.svg',
        main: 'plugins/infra/app',
        title: i18n.translate('xpack.infra.infrastructureTitle', {
          defaultMessage: 'Metrics',
        }),
        listed: false,
        url: `/app/${APP_ID}#/infrastructure`,
      },
      styleSheetPaths: resolve(__dirname, 'public/index.scss'),
      home: ['plugins/infra/register_feature'],
      links: [
        {
          description: i18n.translate('xpack.infra.linkInfrastructureDescription', {
            defaultMessage: 'Explore your metrics',
          }),
          icon: 'plugins/infra/images/infra_mono_white.svg',
          euiIconType: 'infraApp',
          id: 'infra:home',
          order: 8000,
          title: i18n.translate('xpack.infra.linkInfrastructureTitle', {
            defaultMessage: 'Metrics',
          }),
          url: `/app/${APP_ID}#/infrastructure`,
        },
        {
          description: i18n.translate('xpack.infra.linkLogsDescription', {
            defaultMessage: 'Explore your logs',
          }),
          icon: 'plugins/infra/images/logging_mono_white.svg',
          euiIconType: 'loggingApp',
          id: 'infra:logs',
          order: 8001,
          title: i18n.translate('xpack.infra.linkLogsTitle', {
            defaultMessage: 'Logs',
          }),
          url: `/app/${APP_ID}#/logs`,
        },
      ],
      mappings: savedObjectMappings,
    },
    config(Joi: typeof JoiNamespace) {
      return getConfigSchema(Joi);
    },
    init(legacyServer: any) {
      const { newPlatform } = legacyServer as KbnServer;
      const { core } = newPlatform.setup;

      const getConfig$ = <T>() =>
        new BehaviorSubject<T>(legacyServer.config().get('xpack.infra')).asObservable();

      const initContext = ({
        config: {
          create: getConfig$,
          createIfExists: getConfig$,
        },
        getUiSettingsService: legacyServer.getUiSettingsService, // NP_TODO: Replace this with route handler context instead when ready, see: https://github.com/elastic/kibana/issues/44994
      } as unknown) as PluginInitializerContext;

      const infraPluginInstance = plugin(initContext, legacyServer);
      infraPluginInstance.setup(core);

      // NP_TODO: EVERYTHING BELOW HERE IS LEGACY, MIGHT NEED TO MOVE SOME OF IT TO NP, NOT SURE HOW

      const libs = infraPluginInstance.getLibs();

      // NP_TODO how do we replace this?
      legacyServer.expose(
        'defineInternalSourceConfiguration',
        libs.sources.defineInternalSourceConfiguration.bind(libs.sources)
      );

      // Register a function with server to manage the collection of usage stats
      legacyServer.usage.collectorSet.register(UsageCollector.getUsageCollector(legacyServer));

      const xpackMainPlugin = legacyServer.plugins.xpack_main;
      xpackMainPlugin.registerFeature({
        id: 'infrastructure',
        name: i18n.translate('xpack.infra.featureRegistry.linkInfrastructureTitle', {
          defaultMessage: 'Infrastructure',
        }),
        icon: 'infraApp',
        navLinkId: 'infra:home',
        app: ['infra', 'kibana'],
        catalogue: ['infraops'],
        privileges: {
          all: {
            api: ['infra'],
            savedObject: {
              all: ['infrastructure-ui-source'],
              read: ['index-pattern'],
            },
            ui: ['show', 'configureSource', 'save'],
          },
          read: {
            api: ['infra'],
            savedObject: {
              all: [],
              read: ['infrastructure-ui-source', 'index-pattern'],
            },
            ui: ['show'],
          },
        },
      });

      xpackMainPlugin.registerFeature({
        id: 'logs',
        name: i18n.translate('xpack.infra.featureRegistry.linkLogsTitle', {
          defaultMessage: 'Logs',
        }),
        icon: 'loggingApp',
        navLinkId: 'infra:logs',
        app: ['infra', 'kibana'],
        catalogue: ['infralogging'],
        privileges: {
          all: {
            api: ['infra'],
            savedObject: {
              all: ['infrastructure-ui-source'],
              read: [],
            },
            ui: ['show', 'configureSource', 'save'],
          },
          read: {
            api: ['infra'],
            savedObject: {
              all: [],
              read: ['infrastructure-ui-source'],
            },
            ui: ['show'],
          },
        },
      });

      // NP_TODO: How do we move this to new platform?
      legacyServer.addAppLinksToSampleDataset('logs', [
        {
          path: `/app/${APP_ID}#/logs`,
          label: logsSampleDataLinkLabel,
          icon: 'loggingApp',
        },
      ]);
    },
  });
}
