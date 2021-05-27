/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect } from 'react';
import { i18n } from '@kbn/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTitle,
  EuiText,
  EuiButton,
  EuiButtonEmpty,
  EuiImage,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';

import { useKibana } from '../../../../../src/plugins/kibana_react/public';
import { euiStyled, EuiThemeProvider } from '../../../../../src/plugins/kibana_react/common';
import { HttpStart } from '../../../../../src/core/public';
import { useTrialStatus } from '../hooks/use_trial_status';
import { LoadingPage } from '../components/loading_page';

export const SubscriptionSplashContent: React.FC = () => {
  const { services } = useKibana<{ http: HttpStart }>();
  const { loadState, isTrialAvailable, checkTrialAvailability } = useTrialStatus();

  useEffect(() => {
    checkTrialAvailability();
  }, [checkTrialAvailability]);

  if (loadState === 'pending') {
    return (
      <LoadingPage
        message={i18n.translate('xpack.infra.ml.splash.loadingMessage', {
          defaultMessage: 'Checking license...',
        })}
      />
    );
  }

  const canStartTrial = isTrialAvailable && loadState === 'resolved';

  let title;
  let description;
  let cta;

  if (canStartTrial) {
    title = (
      <FormattedMessage
        id="xpack.infra.ml.splash.startTrialTitle"
        defaultMessage="To access anomaly detection, start a free trial"
      />
    );

    description = (
      <FormattedMessage
        id="xpack.infra.ml.splash.startTrialDescription"
        defaultMessage="Our free trial includes machine learning features, which enable you to detect anomalies in your logs."
      />
    );

    cta = (
      <EuiButton
        fullWidth={false}
        fill
        href={services.http.basePath.prepend('/app/management/stack/license_management')}
      >
        <FormattedMessage id="xpack.infra.ml.splash.startTrialCta" defaultMessage="Start trial" />
      </EuiButton>
    );
  } else {
    title = (
      <FormattedMessage
        id="xpack.infra.ml.splash.updateSubscriptionTitle"
        defaultMessage="To access anomaly detection, upgrade to a Platinum Subscription"
      />
    );

    description = (
      <FormattedMessage
        id="xpack.infra.ml.splash.updateSubscriptionDescription"
        defaultMessage="You must have a Platinum Subscription to use machine learning features."
      />
    );

    cta = (
      <EuiButton fullWidth={false} fill href="https://www.elastic.co/subscriptions">
        <FormattedMessage
          id="xpack.infra.ml.splash.updateSubscriptionCta"
          defaultMessage="Upgrade subscription"
        />
      </EuiButton>
    );
  }

  return (
    <EuiThemeProvider>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiTitle size="m">
            <h2>{title}</h2>
          </EuiTitle>
          <EuiSpacer size="xl" />
          <EuiText>
            <p>{description}</p>
          </EuiText>
          <EuiSpacer />
          <div>{cta}</div>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiImage
            alt={i18n.translate('xpack.infra.ml.splash.splashImageAlt', {
              defaultMessage: 'Placeholder image',
            })}
            url={services.http.basePath.prepend('/plugins/infra/assets/anomaly_chart_minified.svg')}
            size="fullWidth"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <SubscriptionPageFooter>
        <EuiTitle size="xs">
          <h3>
            <FormattedMessage
              id="xpack.infra.ml.splash.learnMoreTitle"
              defaultMessage="Want to learn more?"
            />
          </h3>
        </EuiTitle>
        <EuiButtonEmpty
          flush="left"
          iconType="training"
          target="_blank"
          color="text"
          href="https://www.elastic.co/guide/en/kibana/master/xpack-logs-analysis.html"
        >
          <FormattedMessage
            id="xpack.infra.ml.splash.learnMoreLink"
            defaultMessage="Read documentation"
          />
        </EuiButtonEmpty>
      </SubscriptionPageFooter>
    </EuiThemeProvider>
  );
};

const SubscriptionPageFooter = euiStyled.div`
  background: ${(props) => props.theme.eui.euiColorLightestShade};
  margin: 0 -${(props) => props.theme.eui.paddingSizes.l} -${(props) =>
  props.theme.eui.paddingSizes.l};
  padding: ${(props) => props.theme.eui.paddingSizes.l};
`;
