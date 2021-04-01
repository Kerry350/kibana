/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import createContainer from 'constate';
import { useCallback, useMemo, useState, useEffect } from 'react';
import useMountedState from 'react-use/lib/useMountedState';
import type { HttpHandler } from 'src/core/public';
import {
  LogIndexField,
  LogSourceConfigurationPropertiesPatch,
  LogSourceStatus,
} from '../../../../common/http_api/log_sources';
import {
  LogSourceConfiguration,
  LogSourceConfigurationProperties,
  ResolvedLogSourceConfiguration,
} from '../../../../common/log_sources';
import { useTrackedPromise } from '../../../utils/use_tracked_promise';
import { callFetchLogSourceConfigurationAPI } from './api/fetch_log_source_configuration';
import { callFetchLogSourceStatusAPI } from './api/fetch_log_source_status';
import { callPatchLogSourceConfigurationAPI } from './api/patch_log_source_configuration';
import { resolveLogSourceConfiguration } from '../../../../common/log_sources';
import { IndexPatternsContract } from '../../../../../../../src/plugins/data/common';

export {
  LogIndexField,
  LogSourceConfiguration,
  LogSourceConfigurationProperties,
  LogSourceConfigurationPropertiesPatch,
  LogSourceStatus,
};

export const useLogSource = ({
  sourceId,
  fetch,
  indexPatternsService,
}: {
  sourceId: string;
  fetch: HttpHandler;
  indexPatternsService: IndexPatternsContract;
}) => {
  const getIsMounted = useMountedState();
  const [sourceConfiguration, setSourceConfiguration] = useState<
    LogSourceConfiguration | undefined
  >(undefined);

  const [resolvedSourceConfiguration, setResolvedSourceConfiguration] = useState<
    ResolvedLogSourceConfiguration | undefined
  >(undefined);

  const [sourceStatus, setSourceStatus] = useState<LogSourceStatus | undefined>(undefined);

  const [loadSourceConfigurationRequest, loadSourceConfiguration] = useTrackedPromise(
    {
      cancelPreviousOn: 'resolution',
      createPromise: async () => {
        return await callFetchLogSourceConfigurationAPI(sourceId, fetch);
      },
      onResolve: ({ data }) => {
        if (!getIsMounted()) {
          return;
        }

        setSourceConfiguration(data);
      },
    },
    [sourceId, fetch]
  );

  // When the source configuration changes, we should resolve (or re-resolve) it.
  useEffect(() => {
    if (sourceConfiguration && sourceConfiguration.configuration) {
      loadResolveLogSourceConfiguration();
    }
  }, [sourceConfiguration, loadResolveLogSourceConfiguration]);

  const [updateSourceConfigurationRequest, updateSourceConfiguration] = useTrackedPromise(
    {
      cancelPreviousOn: 'resolution',
      createPromise: async (patchedProperties: LogSourceConfigurationPropertiesPatch) => {
        return await callPatchLogSourceConfigurationAPI(sourceId, patchedProperties, fetch);
      },
      onResolve: ({ data }) => {
        if (!getIsMounted()) {
          return;
        }

        setSourceConfiguration(data);
        loadSourceStatus();
      },
    },
    [sourceId, fetch]
  );

  const [loadSourceStatusRequest, loadSourceStatus] = useTrackedPromise(
    {
      cancelPreviousOn: 'resolution',
      createPromise: async () => {
        return await callFetchLogSourceStatusAPI(sourceId, fetch);
      },
      onResolve: ({ data }) => {
        if (!getIsMounted()) {
          return;
        }

        setSourceStatus(data);
      },
    },
    [sourceId, fetch]
  );

  const [
    resolveLogSourceConfigurationRequest,
    loadResolveLogSourceConfiguration,
  ] = useTrackedPromise(
    {
      cancelPreviousOn: 'resolution',
      createPromise: async () => {
        if (!sourceConfiguration?.configuration) {
          return;
        }
        return await resolveLogSourceConfiguration(
          sourceConfiguration?.configuration,
          indexPatternsService
        );
      },
      onResolve: (response) => {
        if (!getIsMounted()) {
          return;
        }

        setResolvedSourceConfiguration(response);
      },
    },
    [sourceConfiguration, indexPatternsService, fetch]
  );

  const derivedIndexPattern = useMemo(
    () => ({
      fields: resolvedSourceConfiguration?.fields ?? [],
      title: resolvedSourceConfiguration?.indexPattern ?? 'unknown',
    }),
    [resolvedSourceConfiguration]
  );

  const isLoadingSourceConfiguration = useMemo(
    () => loadSourceConfigurationRequest.state === 'pending',
    [loadSourceConfigurationRequest.state]
  );

  const isResolvingSourceConfiguration = useMemo(
    () => resolveLogSourceConfigurationRequest.state === 'pending',
    [resolveLogSourceConfigurationRequest]
  );

  const isUpdatingSourceConfiguration = useMemo(
    () => updateSourceConfigurationRequest.state === 'pending',
    [updateSourceConfigurationRequest.state]
  );

  const isLoadingSourceStatus = useMemo(() => loadSourceStatusRequest.state === 'pending', [
    loadSourceStatusRequest.state,
  ]);

  const isLoading = useMemo(
    () =>
      isLoadingSourceConfiguration ||
      isLoadingSourceStatus ||
      isUpdatingSourceConfiguration ||
      isResolvingSourceConfiguration,
    [
      isLoadingSourceConfiguration,
      isLoadingSourceStatus,
      isUpdatingSourceConfiguration,
      isResolvingSourceConfiguration,
    ]
  );

  const isUninitialized = useMemo(
    () =>
      loadSourceConfigurationRequest.state === 'uninitialized' ||
      loadSourceStatusRequest.state === 'uninitialized',
    [loadSourceConfigurationRequest.state, loadSourceStatusRequest.state]
  );

  const hasFailedLoadingSource = useMemo(
    () => loadSourceConfigurationRequest.state === 'rejected',
    [loadSourceConfigurationRequest.state]
  );

  const hasFailedLoadingSourceStatus = useMemo(() => loadSourceStatusRequest.state === 'rejected', [
    loadSourceStatusRequest.state,
  ]);

  const hasFailedResolvingSourceConfiguration = useMemo(
    () => resolveLogSourceConfigurationRequest.state === 'rejected',
    [resolveLogSourceConfigurationRequest.state]
  );

  const loadSourceFailureMessage = useMemo(
    () =>
      loadSourceConfigurationRequest.state === 'rejected'
        ? `${loadSourceConfigurationRequest.value}`
        : undefined,
    [loadSourceConfigurationRequest]
  );

  const resolveSourceFailureMessage = useMemo(
    () =>
      resolveLogSourceConfigurationRequest.state === 'rejected'
        ? `${resolveLogSourceConfigurationRequest.value}`
        : undefined,
    [resolveLogSourceConfigurationRequest]
  );

  const loadSource = useCallback(() => {
    return Promise.all([loadSourceConfiguration(), loadSourceStatus()]);
  }, [loadSourceConfiguration, loadSourceStatus]);

  const initialize = useCallback(async () => {
    if (!isUninitialized) {
      return;
    }

    return await loadSource();
  }, [isUninitialized, loadSource]);

  return {
    sourceId,
    initialize,
    isUninitialized,
    derivedIndexPattern,
    // Failure states
    hasFailedLoadingSource,
    hasFailedLoadingSourceStatus,
    hasFailedResolvingSourceConfiguration,
    loadSourceFailureMessage,
    resolveSourceFailureMessage,
    // Loading states
    isLoading,
    isLoadingSourceConfiguration,
    isLoadingSourceStatus,
    isResolvingSourceConfiguration,
    // Source status (denotes the state of the indices, e.g. missing)
    sourceStatus,
    loadSourceStatus,
    // Source configuration (represents the raw attributes of the source configuration, you would use this to read / update the raw values)
    loadSource,
    loadSourceConfiguration,
    sourceConfiguration,
    updateSourceConfiguration,
    // Resolved source configuration (represents a fully resolved state, you would use this for reading values (unless, perhaps, reading values for editing))
    resolvedSourceConfiguration,
    loadResolveLogSourceConfiguration,
  };
};

export const [LogSourceProvider, useLogSourceContext] = createContainer(useLogSource);
