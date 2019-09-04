/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { EuiButton } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';

export const CreateMLJobsButton: React.FunctionComponent<{
  isDisabled: boolean;
  onClick: () => void;
}> = ({ isDisabled, onClick }) => {
  return (
    <EuiButton fill isDisabled={isDisabled} onClick={onClick}>
      <FormattedMessage
        id="xpack.infra.analysisSetup.createMlJobButton"
        defaultMessage="Create ML jobs"
      />
    </EuiButton>
  );
};
