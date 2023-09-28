/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IToasts } from '@kbn/core-notifications-browser';
import { mountReactNode } from '@kbn/core-mount-utils-browser-internal';
import { EuiButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { LOGS_ONBOARDING_FEEDBACK_LINK } from '@kbn/observability-shared-plugin/common';
import React from 'react';

export const createRequestFeedbackNotifier = (toasts: IToasts) => () => {
  toasts.addInfo({
    title: i18n.translate('xpack.observabilityLogExplorer.feedbackToast.title', {
      defaultMessage: 'Tell us what you think!',
    }),
    text: mountReactNode(
      <>
        <p>
          {i18n.translate('xpack.observabilityLogExplorer.feedbackToast.text', {
            defaultMessage: 'Share your onboarding experience to help us improve it.',
          })}
        </p>

        <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButton
              data-test-subj="observabilityLogExplorerFeedbackToastButton"
              href={LOGS_ONBOARDING_FEEDBACK_LINK}
              size="s"
              target="_blank"
              color="warning"
            >
              {i18n.translate('xpack.observabilityLogExplorer.feedbackToast.buttonText', {
                defaultMessage: 'Take a quick survey',
              })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    ),
  });
};
