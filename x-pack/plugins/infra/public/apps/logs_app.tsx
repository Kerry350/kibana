/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { History } from 'history';
import { CoreStart } from '@kbn/core/public';
import { useRouterMachine } from 'xstate-router';
import { spawn } from 'xstate';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Route, Router, Switch } from 'react-router-dom';
import { AppMountParameters } from '@kbn/core/public';
import { Storage } from '@kbn/kibana-utils-plugin/public';
import '../index.scss';
import { assign } from 'lodash';
import { NotFoundPage } from '../pages/404';
import { LinkToLogsPage } from '../pages/link_to/link_to_logs';
import { LogsPage } from '../pages/logs';
import { InfraClientStartDeps, InfraClientStartExports } from '../types';
import { CommonInfraProviders, CoreProviders } from './common_providers';
import { prepareMountElement } from './common_styles';
import { KbnUrlStateStorageFromRouterProvider } from '../utils/kbn_url_state_context';
import { createConfig } from '../observability_logs/log_router_state';
import { createLogViewNotificationChannel } from '../observability_logs/log_view_state';
import { useKibanaContextForPlugin } from '../hooks/use_kibana';
import { useSourceId } from '../containers/source_id';
import { createLogViewStateMachine } from '../observability_logs/log_view_state';
import { createLogStreamPageStateMachine } from '../observability_logs/log_stream_page/state';

export const renderApp = (
  core: CoreStart,
  plugins: InfraClientStartDeps,
  pluginStart: InfraClientStartExports,
  { element, history, setHeaderActionMenu, theme$ }: AppMountParameters
) => {
  const storage = new Storage(window.localStorage);

  prepareMountElement(element, 'infraLogsPage');

  ReactDOM.render(
    <LogsApp
      core={core}
      storage={storage}
      history={history}
      plugins={plugins}
      pluginStart={pluginStart}
      setHeaderActionMenu={setHeaderActionMenu}
      theme$={theme$}
    />,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};

const LogsApp: React.FC<{
  core: CoreStart;
  history: History<unknown>;
  pluginStart: InfraClientStartExports;
  plugins: InfraClientStartDeps;
  setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  storage: Storage;
  theme$: AppMountParameters['theme$'];
}> = ({ core, history, pluginStart, plugins, setHeaderActionMenu, storage, theme$ }) => {
  const [logViewId] = useSourceId();
  const [logViewStateNotifications] = useState(() => createLogViewNotificationChannel());
  const [logViewMachine] = useState(() =>
    createLogViewStateMachine({
      initialContext: {
        logViewId,
      },
      logViews: pluginStart.logViews.client,
      notificationChannel: logViewStateNotifications,
    })
  );

  const uiCapabilities = core.application.capabilities;
  const routingMachineConfig = createConfig();
  const { service, state } = useRouterMachine({
    config: routingMachineConfig,
    options: {
      actions: {
        spawnLogStreamStateMachine: assign((context, event) => {
          debugger;
          return {
            ...context,
            pageStateMachine: spawn(createLogStreamPageStateMachine({ logViewStateNotifications })),
          };
        }),
      },
    },
    initialContext: { pageStateMachine: null, logViewMachine },
    history,
  });

  return (
    <CoreProviders core={core} pluginStart={pluginStart} plugins={plugins} theme$={theme$}>
      <CommonInfraProviders
        appName="Logs UI"
        setHeaderActionMenu={setHeaderActionMenu}
        storage={storage}
        theme$={theme$}
        triggersActionsUI={plugins.triggersActionsUi}
      >
        <Router history={history}>
          <KbnUrlStateStorageFromRouterProvider
            history={history}
            toastsService={core.notifications.toasts}
          >
            {uiCapabilities?.logs?.show && (
              <LogsPage routingService={service} routingState={state} />
            )}
          </KbnUrlStateStorageFromRouterProvider>
        </Router>
      </CommonInfraProviders>
    </CoreProviders>
  );
};
