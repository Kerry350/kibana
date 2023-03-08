/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButton } from '@elastic/eui';
import React, { useCallback } from 'react';
import { useLogViewContext } from '../../../hooks/use_log_view';

export const StateMachinePlayground = () => {
  const { changeLogViewReference, revertToDefaultLogView, update, isLoading } = useLogViewContext();

  const switchToInlineLogView = useCallback(() => {
    changeLogViewReference({
      type: 'log-view-inline',
      id: 'playground-log-view',
      attributes: {
        name: 'playground-log-view-name',
        description: 'from the state machine playground',
        logIndices: { type: 'index_name', indexName: 'logs-*' },
        logColumns: [
          {
            fieldColumn: {
              id: 'playground-field-column',
              field: 'event.dataset',
            },
          },
        ],
      },
    });
  }, [changeLogViewReference]);

  const updateLogView = useCallback(() => {
    update({
      name: 'Updated playground name',
    });
  }, [update]);

  return (
    <>
      {isLoading && 'Is loading'}
      <EuiButton fill onClick={() => switchToInlineLogView()}>
        {'Switch to inline Log View'}
      </EuiButton>
      <EuiButton fill onClick={() => revertToDefaultLogView()}>
        {'Revert to default Log View'}
      </EuiButton>
      <EuiButton fill onClick={() => updateLogView()}>
        {'Update log view'}
      </EuiButton>
    </>
  );
};
