/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ScopedHistory } from '@kbn/core-application-browser';
import { IUiSettingsClient } from '@kbn/core-ui-settings-browser';
import { CoreStart } from '@kbn/core/public';
import { DataPublicPluginStart } from '@kbn/data-plugin/public';
import { DiscoverAppState } from '@kbn/discover-plugin/public';
import { HIDE_ANNOUNCEMENTS } from '@kbn/discover-utils';
import { createKbnUrlStateStorage } from '@kbn/kibana-utils-plugin/public';
import { createMemoryHistory } from 'history';
import React, { useMemo, useState } from 'react';
import type { BehaviorSubject } from 'rxjs';
import { LogExplorerController } from '../../controller/create_controller';
import { createLogExplorerProfileCustomizations } from '../../customizations/log_explorer_profile';
import { LogExplorerControllerContext } from '../../state_machines/log_explorer_controller';
import { LogExplorerStartDeps } from '../../types';
import { createPropertyGetProxy } from '../../utils/proxies';

export interface CreateLogExplorerArgs {
  core: CoreStart;
  plugins: LogExplorerStartDeps;
}

export interface LogExplorerStateContainer {
  appState?: DiscoverAppState;
  logExplorerState?: Partial<LogExplorerControllerContext>;
}

export interface LogExplorerProps {
  scopedHistory: ScopedHistory;
  state$?: BehaviorSubject<LogExplorerStateContainer>;
  controller: LogExplorerController;
}

export const createLogExplorer = ({ core, plugins }: CreateLogExplorerArgs) => {
  const {
    data,
    discover: { DiscoverContainer },
  } = plugins;

  const overrideServices = {
    data: createDataServiceProxy(data),
    uiSettings: createUiSettingsServiceProxy(core.uiSettings),
  };

  return ({ scopedHistory, state$, controller }: LogExplorerProps) => {
    const logExplorerCustomizations = useMemo(
      () => [createLogExplorerProfileCustomizations({ core, plugins, state$, controller })],
      [state$, controller]
    );

    // this is not used anywhere outside of the `DiscoverContainer`, but it
    // prevents Discover from manipulating the URL
    const [memoryUrlStateStorage] = useState(createMemoryUrlStateStorage);

    return (
      <DiscoverContainer
        customizationCallbacks={logExplorerCustomizations}
        overrideServices={overrideServices}
        scopedHistory={scopedHistory}
        stateStorageContainer={memoryUrlStateStorage}
      />
    );
  };
};

/**
 * Create proxy for the data service, in which session service enablement calls
 * are no-ops.
 */
const createDataServiceProxy = (data: DataPublicPluginStart) => {
  const noOpEnableStorage = () => {};

  const sessionServiceProxy = createPropertyGetProxy(data.search.session, {
    enableStorage: () => noOpEnableStorage,
  });

  const searchServiceProxy = createPropertyGetProxy(data.search, {
    session: () => sessionServiceProxy,
  });

  return createPropertyGetProxy(data, {
    search: () => searchServiceProxy,
  });
};

/**
 * Create proxy for the uiSettings service, in which settings preferences are overwritten
 * with custom values
 */
const createUiSettingsServiceProxy = (uiSettings: IUiSettingsClient) => {
  const overrides: Record<string, any> = {
    [HIDE_ANNOUNCEMENTS]: true,
  };

  return createPropertyGetProxy(uiSettings, {
    get:
      () =>
      (key, ...args) => {
        if (key in overrides) {
          return overrides[key];
        }

        return uiSettings.get(key, ...args);
      },
  });
};

/**
 * Create a url state storage that's not connected to the real browser location
 * to isolate the Discover component from these side-effects.
 */
const createMemoryUrlStateStorage = () =>
  createKbnUrlStateStorage({
    history: createMemoryHistory(),
    useHash: false,
  });
