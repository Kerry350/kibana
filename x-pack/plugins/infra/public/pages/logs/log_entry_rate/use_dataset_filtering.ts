/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { useEffect, useReducer, useCallback } from 'react';
import { useKibanaContextForPlugin } from '../../../hooks/use_kibana';
import { Filter } from '../../../../../../../src/plugins/data/common';
import { CONTROLLED_BY_SWIM_LANE_FILTER } from '../../../../../ml/public';

interface ReducerState {
  selectedDatasets: string[];
  selectedDatasetsFilters: Filter[];
}

type ReducerAction =
  | { type: 'changeSelectedDatasets'; payload: { datasets: string[] } }
  | { type: 'updateDatasetsFilters'; payload: { filters: Filter[] } };

const initialState: ReducerState = {
  selectedDatasets: [],
  selectedDatasetsFilters: [],
};

function reducer(state: ReducerState, action: ReducerAction) {
  switch (action.type) {
    case 'changeSelectedDatasets':
      return {
        ...state,
        selectedDatasets: action.payload.datasets,
      };
    case 'updateDatasetsFilters':
      const datasetsToAdd = action.payload.filters
        .filter((filter) => !state.selectedDatasets.includes(filter.meta.params.query))
        .map((filter) => filter.meta.params.query);
      return {
        ...state,
        selectedDatasets: [...state.selectedDatasets, ...datasetsToAdd],
        selectedDatasetsFilters: action.payload.filters,
      };
    default:
      throw new Error('Unknown action');
  }
}

export const useDatasetFiltering = () => {
  const { services } = useKibanaContextForPlugin();
  const [reducerState, dispatch] = useReducer(reducer, initialState);

  const handleSetSelectedDatasets = useCallback(
    (datasets: string[]) => {
      dispatch({ type: 'changeSelectedDatasets', payload: { datasets } });
    },
    [dispatch]
  );

  // NOTE: The anomaly swimlane embeddable will communicate it's filter action
  // changes via the filterManager service.
  useEffect(() => {
    const filterUpdated$ = services.data.query.filterManager.getUpdates$();
    const sub = filterUpdated$.subscribe(() => {
      const filters = services.data.query.filterManager
        .getFilters()
        .filter(
          (filter) =>
            filter.meta.controlledBy && filter.meta.controlledBy === CONTROLLED_BY_SWIM_LANE_FILTER
        );
      dispatch({ type: 'updateDatasetsFilters', payload: { filters } });
    });

    return () => {
      sub.unsubscribe();
    };
  }, [services.data.query.filterManager, dispatch]);

  useEffect(() => {
    const filtersToRemove = reducerState.selectedDatasetsFilters.filter(
      (filter) => !reducerState.selectedDatasets.includes(filter.meta.params.query)
    );
    if (filtersToRemove.length > 0) {
      filtersToRemove.forEach((filter) => {
        services.data.query.filterManager.removeFilter(filter);
      });
    }
  }, [
    reducerState.selectedDatasets,
    reducerState.selectedDatasetsFilters,
    services.data.query.filterManager,
  ]);

  return {
    selectedDatasets: reducerState.selectedDatasets,
    setSelectedDatasets: handleSetSelectedDatasets,
    selectedDatasetsFilters: reducerState.selectedDatasetsFilters,
  };
};
