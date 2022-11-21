/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { catchError, from, map, of, throwError } from 'rxjs';
import { createMachine, actions, assign } from 'xstate';
import { ILogViewsClient } from '../../../services/log_views';
import { createTypestateHelpers } from '../../xstate_helpers';
import { LogViewContext, LogViewContextWithId, LogViewEvent, LogViewTypestate } from './types';

export const createPureLogViewStateMachine = (initialContext: LogViewContextWithId) =>
  createMachine<LogViewContext, LogViewEvent, LogViewTypestate>(
    {
      id: 'LogView',
      initial: 'uninitialized',
      states: {
        uninitialized: {
          always: {
            target: 'loading',
          },
        },
        loading: {
          invoke: {
            src: 'loadLogView',
          },
          entry: 'notifyLoadingStarted',
          on: {
            loadingSucceeded: {
              target: 'resolving',
              actions: 'storeLogView',
            },
            loadingFailed: {
              target: 'loadingFailed',
              actions: 'storeError',
            },
          },
        },
        resolving: {
          invoke: {
            src: 'resolveLogView',
          },
          on: {
            resolutionSucceeded: {
              target: 'checkingStatus',
              actions: 'storeResolvedLogView',
            },
            resolutionFailed: {
              target: 'resolutionFailed',
              actions: 'storeError',
            },
          },
        },
        checkingStatus: {
          invoke: {
            src: 'loadLogViewStatus',
          },
          on: {
            checkingStatusSucceeded: {
              target: 'resolved',
              actions: 'storeStatus',
            },
            checkingStatusFailed: {
              target: 'checkingStatusFailed',
              actions: 'storeError',
            },
          },
        },
        resolved: {
          entry: 'notifyLoadingSucceeded',
          on: {
            reloadLogView: {
              target: 'loading',
            },
          },
        },
        loadingFailed: {
          entry: 'notifyLoadingFailed',
          on: {
            retry: {
              target: 'loading',
            },
          },
        },
        resolutionFailed: {
          on: {
            retry: {
              target: 'resolving',
            },
          },
        },
        checkingStatusFailed: {
          on: {
            retry: {
              target: 'checkingStatus',
            },
          },
        },
      },
      on: {
        logViewIdChanged: {
          target: '.loading',
          actions: 'storeLogViewId',
        },
      },
      context: initialContext,
      predictableActionArguments: true,
      preserveActionOrder: true,
    },
    {
      actions: {
        notifyLoadingStarted: actions.pure(() => undefined),
        notifyLoadingSucceeded: actions.pure(() => undefined),
        notifyLoadingFailed: actions.pure(() => undefined),
        storeLogViewId: logViewStateMachineHelpers.assignOnTransition(
          null,
          'loading',
          'logViewIdChanged',
          (_context, event) => ({
            logViewId: event.logViewId,
          })
        ),
        storeLogView: logViewStateMachineHelpers.assignOnTransition(
          'loading',
          'resolving',
          'loadingSucceeded',
          (context, event) => ({
            ...context,
            logView: event.logView,
          })
        ),
        storeResolvedLogView: logViewStateMachineHelpers.assignOnTransition(
          'resolving',
          'checkingStatus',
          'resolutionSucceeded',
          (context, event) => ({
            ...context,
            resolvedLogView: event.resolvedLogView,
          })
        ),
        storeStatus: logViewStateMachineHelpers.assignOnTransition(
          'checkingStatus',
          'resolved',
          'checkingStatusSucceeded',
          (context, event) => ({
            ...context,
            status: event.status,
          })
        ),
        storeError: assign((context, event) =>
          'error' in event ? { ...context, error: event.error } : context
        ),
      },
    }
  );

export const createLogViewStateMachine = ({
  initialContext,
  logViews,
}: {
  initialContext: LogViewContextWithId;
  logViews: ILogViewsClient;
}) =>
  createPureLogViewStateMachine(initialContext).withConfig({
    services: {
      loadLogView: (context) =>
        from(
          'logViewId' in context
            ? logViews.getLogView(context.logViewId)
            : throwError(() => new Error('Failed to load log view: No id found in context.'))
        ).pipe(
          map(
            (logView): LogViewEvent => ({
              type: 'loadingSucceeded',
              logView,
            })
          ),
          catchError((error) =>
            of<LogViewEvent>({
              type: 'loadingFailed',
              error,
            })
          )
        ),
      resolveLogView: (context) =>
        from(
          'logView' in context
            ? logViews.resolveLogView(context.logView.id, context.logView.attributes)
            : throwError(
                () => new Error('Failed to resolve log view: No log view found in context.')
              )
        ).pipe(
          map(
            (resolvedLogView): LogViewEvent => ({
              type: 'resolutionSucceeded',
              resolvedLogView,
            })
          ),
          catchError((error) =>
            of<LogViewEvent>({
              type: 'resolutionFailed',
              error,
            })
          )
        ),
      loadLogViewStatus: (context) =>
        from(
          'resolvedLogView' in context
            ? logViews.getResolvedLogViewStatus(context.resolvedLogView)
            : throwError(
                () => new Error('Failed to resolve log view: No log view found in context.')
              )
        ).pipe(
          map(
            (status): LogViewEvent => ({
              type: 'checkingStatusSucceeded',
              status,
            })
          ),
          catchError((error) =>
            of<LogViewEvent>({
              type: 'checkingStatusFailed',
              error,
            })
          )
        ),
    },
  });

const logViewStateMachineHelpers = createTypestateHelpers<LogViewTypestate, LogViewEvent>();
