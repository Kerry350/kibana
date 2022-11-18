/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useInterpret } from '@xstate/react';
import { i18n } from '@kbn/i18n';
import React, { useMemo } from 'react';
import { APP_WRAPPER_CLASS } from '@kbn/core/public';
import { useSourceId } from '../../../containers/source_id';
import { useKibanaContextForPlugin } from '../../../hooks/use_kibana';
import { LogSourceErrorPage } from '../../../components/logging/log_source_error_page';
import { SourceLoadingPage } from '../../../components/source_loading_page';
import { useLogViewContext } from '../../../hooks/use_log_view';
import { LogsPageTemplate } from '../page_template';
import { LogsPageLogsContent } from './page_logs_content';
import { fullHeightContentStyles } from '../../../page_template.styles';
import { createLogStreamPageStateMachine } from '../../../observability_logs/log_stream_page/state';

const streamTitle = i18n.translate('xpack.infra.logs.streamPageTitle', {
  defaultMessage: 'Stream',
});

export const StreamPageContent: React.FunctionComponent = () => {
  const {
    hasFailedLoading,
    isLoading,
    isUninitialized,
    latestLoadLogViewFailures,
    load,
    logViewStatus,
  } = useLogViewContext();

  const [sourceId] = useSourceId();

  const {
    services: {
      logViews: { client },
    },
  } = useKibanaContextForPlugin();

  // TODO: Remove and move to a proper provider
  const machine = useMemo(() => {
    return createLogStreamPageStateMachine({ logViews: client, logViewId: sourceId });
  }, [client, sourceId]);

  const LogStreamPageStateService = useInterpret(machine, undefined, (state) => {
    console.log(state);
  });

  if (isLoading || isUninitialized) {
    return <SourceLoadingPage />;
  } else if (hasFailedLoading) {
    return <LogSourceErrorPage errors={latestLoadLogViewFailures} onRetry={load} />;
  } else {
    return (
      <div className={APP_WRAPPER_CLASS}>
        <LogsPageTemplate
          hasData={logViewStatus?.index !== 'missing'}
          isDataLoading={isLoading}
          pageHeader={{
            pageTitle: streamTitle,
          }}
          pageSectionProps={{
            contentProps: {
              css: fullHeightContentStyles,
            },
          }}
        >
          <LogsPageLogsContent />
        </LogsPageTemplate>
      </div>
    );
  }
};
