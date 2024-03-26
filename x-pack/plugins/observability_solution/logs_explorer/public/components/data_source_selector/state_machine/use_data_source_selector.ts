/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback } from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import { isAllDatasetSelection } from '../../../../common/data_source_selection';
import {
  DatasetSelectionHandler,
  DataSourceSelectorScrollHandler,
  DataSourceSelectorSearchHandler,
  DataViewSelectionHandler,
} from '../types';
import { createDataSourceSelectorStateMachine } from './state_machine';
import { DataSourceSelectorStateMachineDependencies } from './types';

export const useDataSourceSelector = ({
  initialContext,
  onDataViewsSearch,
  onDataViewsSort,
  onIntegrationsLoadMore,
  onIntegrationsReload,
  onIntegrationsSearch,
  onIntegrationsSort,
  onSelectionChange,
  onUncategorizedLoad,
  onUncategorizedSearch,
  onUncategorizedReload,
}: DataSourceSelectorStateMachineDependencies) => {
  const dataSourceSelectorStateService = useInterpret(() =>
    createDataSourceSelectorStateMachine({
      initialContext,
      onDataViewsSearch,
      onDataViewsSort,
      onIntegrationsLoadMore,
      onIntegrationsReload,
      onIntegrationsSearch,
      onIntegrationsSort,
      onSelectionChange,
      onUncategorizedLoad,
      onUncategorizedSearch,
      onUncategorizedReload,
    })
  );

  const isOpen = useSelector(dataSourceSelectorStateService, (state) =>
    state.matches('popover.open')
  );

  const search = useSelector(dataSourceSelectorStateService, (state) => state.context.search);
  const selection = useSelector(dataSourceSelectorStateService, (state) => state.context.selection);
  const tabId = useSelector(dataSourceSelectorStateService, (state) => state.context.tabId);

  const switchToIntegrationsTab = useCallback(
    () => dataSourceSelectorStateService.send({ type: 'SWITCH_TO_INTEGRATIONS_TAB' }),
    [dataSourceSelectorStateService]
  );

  const switchToDataViewsTab = useCallback(
    () => dataSourceSelectorStateService.send({ type: 'SWITCH_TO_DATA_VIEWS_TAB' }),
    [dataSourceSelectorStateService]
  );

  const scrollToIntegrationsBottom = useCallback<DataSourceSelectorScrollHandler>(
    () => dataSourceSelectorStateService.send({ type: 'SCROLL_TO_INTEGRATIONS_BOTTOM' }),
    [dataSourceSelectorStateService]
  );

  const searchByName = useCallback<DataSourceSelectorSearchHandler>(
    (params) => dataSourceSelectorStateService.send({ type: 'SEARCH_BY_NAME', search: params }),
    [dataSourceSelectorStateService]
  );

  const selectAllLogs = useCallback(
    () => dataSourceSelectorStateService.send({ type: 'SELECT_ALL_LOGS' }),
    [dataSourceSelectorStateService]
  );

  const selectDataset = useCallback<DatasetSelectionHandler>(
    (dataset) =>
      dataSourceSelectorStateService.send({ type: 'SELECT_DATASET', selection: dataset }),
    [dataSourceSelectorStateService]
  );

  const selectDataView = useCallback<DataViewSelectionHandler>(
    (dataViewDescriptor) =>
      dataSourceSelectorStateService.send({
        type: 'SELECT_DATA_VIEW',
        selection: dataViewDescriptor,
      }),
    [dataSourceSelectorStateService]
  );

  const sortByOrder = useCallback<DataSourceSelectorSearchHandler>(
    (params) => dataSourceSelectorStateService.send({ type: 'SORT_BY_ORDER', search: params }),
    [dataSourceSelectorStateService]
  );

  const closePopover = useCallback(
    () => dataSourceSelectorStateService.send({ type: 'CLOSE' }),
    [dataSourceSelectorStateService]
  );

  const togglePopover = useCallback(
    () => dataSourceSelectorStateService.send({ type: 'TOGGLE' }),
    [dataSourceSelectorStateService]
  );

  return {
    // Data
    search,
    selection,
    tabId,
    // Flags
    isOpen,
    isAllMode: isAllDatasetSelection(selection),
    // Actions
    closePopover,
    scrollToIntegrationsBottom,
    searchByName,
    selectAllLogs,
    selectDataset,
    selectDataView,
    sortByOrder,
    switchToIntegrationsTab,
    switchToDataViewsTab,
    togglePopover,
  };
};
