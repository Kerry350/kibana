/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useMemo } from 'react';
import { ChromeBreadcrumb } from '@kbn/core/public';
import { useBreadcrumbs, useLinkProps } from '@kbn/observability-shared-plugin/public';
import useObservable from 'react-use/lib/useObservable';
import { METRICS_APP } from '../../common/constants';
import { metricsTitle } from '../translations';
import { useKibanaContextForPlugin } from './use_kibana';

export const useMetricsBreadcrumbs = (
  extraCrumbs: ChromeBreadcrumb[],
  options?: { deeperContextServerless: boolean }
) => {
  const {
    services: {
      serverless,
      chrome: { getChromeStyle$ },
    },
  } = useKibanaContextForPlugin();
  const appLinkProps = useLinkProps({ app: METRICS_APP });
  const chromeStyle = useObservable(getChromeStyle$());
  const isProjectStyle = serverless || chromeStyle === 'project';

  const breadcrumbs = useMemo(() => {
    const baseBreadcrumbs = [
      {
        ...appLinkProps,
        text: metricsTitle,
      },
      ...extraCrumbs,
    ];

    if (isProjectStyle && options?.deeperContextServerless) {
      const [, ...projectStyleBreadcrumbs] = baseBreadcrumbs;
      return projectStyleBreadcrumbs;
    } else {
      return baseBreadcrumbs;
    }
  }, [appLinkProps, extraCrumbs, isProjectStyle, options?.deeperContextServerless]);

  useBreadcrumbs(breadcrumbs, { absoluteProjectStyleBreadcrumbs: true });
};
