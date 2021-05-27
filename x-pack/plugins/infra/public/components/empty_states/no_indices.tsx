/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiEmptyPrompt } from '@elastic/eui';
import React from 'react';
import { useKibanaContextForPlugin } from '../../hooks/use_kibana';

interface NoIndicesProps {
  message: string;
  title: string;
  actions: React.ReactNode;
  'data-test-subj'?: string;
}

export const NoIndices: React.FC<NoIndicesProps> = ({ actions, message, title, ...rest }) => {
  const {
    services: {
      observability: {
        navigation: { PageTemplate },
      },
    },
  } = useKibanaContextForPlugin();

  return (
    <PageTemplate isEmptyState={true}>
      <EuiEmptyPrompt
        title={<h2>{title}</h2>}
        body={<p>{message}</p>}
        actions={actions}
        {...rest}
      />
    </PageTemplate>
  );
};
