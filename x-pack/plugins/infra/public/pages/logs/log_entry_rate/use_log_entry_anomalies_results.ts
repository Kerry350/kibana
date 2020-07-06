/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { useMemo, useState, useCallback, useEffect } from 'react';

import { LogEntryAnomaly } from '../../../../common/http_api';
import { useTrackedPromise } from '../../../utils/use_tracked_promise';
import { callGetLogEntryAnomaliesAPI } from './service_calls/get_log_entry_anomalies';
import { Sort, Pagination, PaginationCursor } from '../../../../common/http_api/log_analysis';

export type SortOptions = Sort;
export type PaginationOptions = Pick<Pagination, 'pageSize'>;
export type Page = number;
export type FetchNextPage = () => void;
export type FetchPreviousPage = () => void;
export type ChangeSortOptions = (sortOptions: Sort) => void;
export type ChangePaginationOptions = (paginationOptions: PaginationOptions) => void;
export type LogEntryAnomalies = LogEntryAnomaly[];
interface PaginationCursors {
  previousPageCursor: PaginationCursor;
  nextPageCursor: PaginationCursor;
}

export const useLogEntryAnomaliesResults = ({
  endTime,
  startTime,
  sourceId,
  lastChangedTime,
  defaultSortOptions,
  defaultPaginationOptions,
}: {
  endTime: number;
  startTime: number;
  sourceId: string;
  lastChangedTime: number;
  defaultSortOptions: Sort;
  defaultPaginationOptions: Pick<Pagination, 'pageSize'>;
}) => {
  // Pagination
  const [page, setPage] = useState(1);
  const [paginationOptions, setPaginationOptions] = useState<PaginationOptions>(
    defaultPaginationOptions
  );
  // Cursor from the last request
  const [lastReceivedCursors, setLastReceivedCursors] = useState<PaginationCursors | undefined>();
  // Cursor to use for the next request
  const [paginationCursor, setPaginationCursor] = useState<Pagination['cursor'] | undefined>(
    undefined
  );
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);

  // Sort
  const [sortOptions, setSortOptions] = useState<Sort>(defaultSortOptions);

  const resetPagination = useCallback(() => {
    setPage(1);
    setPaginationCursor(undefined);
  }, [setPage, setPaginationCursor]);

  const [logEntryAnomalies, setLogEntryAnomalies] = useState<LogEntryAnomalies>([]);

  const [getLogEntryAnomaliesRequest, getLogEntryAnomalies] = useTrackedPromise(
    {
      cancelPreviousOn: 'creation',
      createPromise: async () => {
        return await callGetLogEntryAnomaliesAPI(sourceId, startTime, endTime, sortOptions, {
          ...paginationOptions,
          cursor: paginationCursor,
        });
      },
      onResolve: ({ data: { anomalies, paginationCursors: requestCursors } }) => {
        if (requestCursors) {
          setLastReceivedCursors(requestCursors);
          if (anomalies.length < paginationOptions.pageSize) {
            setHasNextPage(false);
          } else {
            setHasNextPage(true);
          }
        } else {
          // No results
          setHasNextPage(false);
        }
        setLogEntryAnomalies(anomalies);
      },
    },
    [endTime, sourceId, startTime, sortOptions, paginationOptions, setHasNextPage, paginationCursor]
  );

  const changeSortOptions = useCallback(
    (nextSortOptions: Sort) => {
      resetPagination();
      setSortOptions(nextSortOptions);
    },
    [setSortOptions, resetPagination]
  );

  const changePaginationOptions = useCallback(
    (nextPaginationOptions: PaginationOptions) => {
      resetPagination();
      setPaginationOptions(nextPaginationOptions);
    },
    [resetPagination, setPaginationOptions]
  );

  useEffect(() => {
    // Time range has changed
    resetPagination();
  }, [lastChangedTime, resetPagination]);

  useEffect(() => {
    // Refetch entries when options change
    getLogEntryAnomalies();
  }, [sortOptions, paginationOptions, getLogEntryAnomalies, paginationCursor]);

  const handleFetchNextPage = useCallback(() => {
    if (lastReceivedCursors) {
      setPage(page + 1);
      setPaginationCursor({
        searchAfter: lastReceivedCursors.nextPageCursor,
      });
    }
  }, [setPage, lastReceivedCursors, page]);

  const handleFetchPreviousPage = useCallback(() => {
    if (lastReceivedCursors) {
      setPage(page - 1);
      setPaginationCursor({
        searchBefore: lastReceivedCursors.previousPageCursor,
      });
    }
  }, [setPage, lastReceivedCursors, page]);

  const isLoadingLogEntryAnomalies = useMemo(
    () => getLogEntryAnomaliesRequest.state === 'pending',
    [getLogEntryAnomaliesRequest.state]
  );

  const hasFailedLoadingLogEntryAnomalies = useMemo(
    () => getLogEntryAnomaliesRequest.state === 'rejected',
    [getLogEntryAnomaliesRequest.state]
  );

  return {
    logEntryAnomalies,
    getLogEntryAnomalies,
    isLoadingLogEntryAnomalies,
    hasFailedLoadingLogEntryAnomalies,
    changeSortOptions,
    sortOptions,
    changePaginationOptions,
    paginationOptions,
    fetchPreviousPage: page > 1 ? handleFetchPreviousPage : undefined,
    fetchNextPage: hasNextPage ? handleFetchNextPage : undefined,
    page,
  };
};
