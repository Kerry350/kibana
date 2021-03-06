/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { Plugin, CoreSetup, PluginInitializerContext } from 'src/core/server';
import { Observable } from 'rxjs';
import { APMOSSConfig } from './';
import { HomeServerPluginSetup, TutorialProvider } from '../../home/server';
import { tutorialProvider } from './tutorial';

export class APMOSSPlugin implements Plugin<APMOSSPluginSetup> {
  constructor(private readonly initContext: PluginInitializerContext) {
    this.initContext = initContext;
  }
  public setup(core: CoreSetup, plugins: { home: HomeServerPluginSetup }) {
    const config$ = this.initContext.config.create<APMOSSConfig>();

    const config = this.initContext.config.get<APMOSSConfig>();

    const apmTutorialProvider = tutorialProvider({
      indexPatternTitle: config.indexPattern,
      indices: {
        errorIndices: config.errorIndices,
        metricsIndices: config.metricsIndices,
        onboardingIndices: config.onboardingIndices,
        sourcemapIndices: config.sourcemapIndices,
        transactionIndices: config.transactionIndices,
      },
    });
    plugins.home.tutorials.registerTutorial(apmTutorialProvider);

    return {
      config,
      config$,
      getRegisteredTutorialProvider: () => apmTutorialProvider,
    };
  }

  start() {}
  stop() {}
}

export interface APMOSSPluginSetup {
  config: APMOSSConfig;
  config$: Observable<APMOSSConfig>;
  getRegisteredTutorialProvider(): TutorialProvider;
}
