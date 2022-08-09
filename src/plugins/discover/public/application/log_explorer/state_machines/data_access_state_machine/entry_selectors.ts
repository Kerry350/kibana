/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import memoizeOne from 'memoize-one';
import { LogExplorerChunk, LogExplorerRow } from '../../types';
import { getEndRowIndex, getRowsFromChunk, getStartRowIndex } from '../../utils/row';
import { DataAccessService } from './state_machine';
import { selectIsReloading } from './status_selectors';

export const selectRows = (
  state: DataAccessService['state']
): {
  startRowIndex: number | undefined;
  chunkBoundaryRowIndex: number | undefined;
  endRowIndex: number | undefined;
  rows: Map<number, LogExplorerRow>;
} => {
  if (selectIsReloading(state)) {
    return {
      startRowIndex: undefined,
      chunkBoundaryRowIndex: undefined,
      endRowIndex: undefined,
      rows: new Map(),
    };
  }

  const { topChunk, bottomChunk } = state.context;

  const startRowIndex = getStartRowIndex(topChunk);
  const chunkBoundaryRowIndex = getStartRowIndex(bottomChunk);
  const endRowIndex = getEndRowIndex(bottomChunk);

  const rows = memoizedGetRowMapFromChunksForSelector(topChunk, bottomChunk);

  return {
    startRowIndex,
    chunkBoundaryRowIndex,
    endRowIndex,
    rows,
  };
};

export const memoizedSelectRows = memoizeOne(selectRows);

const getRowMapFromChunks = (topChunk: LogExplorerChunk, bottomChunk: LogExplorerChunk) =>
  new Map([...getRowsFromChunk(topChunk), ...getRowsFromChunk(bottomChunk)]);

const memoizedGetRowMapFromChunksForSelector = memoizeOne(getRowMapFromChunks);
