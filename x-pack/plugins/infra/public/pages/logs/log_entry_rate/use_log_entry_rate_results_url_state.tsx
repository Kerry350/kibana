/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { useCallback, useEffect, useMemo } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { fold } from 'fp-ts/lib/Either';
import { constant, identity } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import * as rt from 'io-ts';
import { TimeRange, TimefilterContract } from '../../../../../../../src/plugins/data/public';

import { useUrlState } from '../../../utils/use_url_state';
import {
  useKibanaTimefilterTime,
  useSyncKibanaTimeFilterTime,
} from '../../../hooks/use_kibana_timefilter_time';

const autoRefreshRT = rt.union([
  rt.type({
    interval: rt.number,
    isPaused: rt.boolean,
  }),
  rt.undefined,
]);

export const stringTimeRangeRT = rt.type({
  startTime: rt.string,
  endTime: rt.string,
});
export type StringTimeRange = rt.TypeOf<typeof stringTimeRangeRT>;

const urlTimeRangeRT = rt.union([stringTimeRangeRT, rt.undefined]);

const TIME_RANGE_URL_STATE_KEY = 'timeRange';
const AUTOREFRESH_URL_STATE_KEY = 'autoRefresh';
const TIME_DEFAULTS = { from: 'now-2w', to: 'now' };

export const useLogAnalysisResultsUrlState = () => {
  const [getTime] = useKibanaTimefilterTime(TIME_DEFAULTS);
  const { from: start, to: end } = getTime();

  const defaultTimeRangeState = useMemo(() => {
    return {
      startTime: start,
      endTime: end,
    };
  }, [start, end]);

  const decodeTimeRangeUrlState = useCallback(
    (value: unknown) => {
      return pipe(urlTimeRangeRT.decode(value), fold(constant(undefined), identity));
    },
    [urlTimeRangeRT.decode]
  );

  const [timeRange, setTimeRange] = useUrlState({
    defaultState: defaultTimeRangeState,
    decodeUrlState: decodeTimeRangeUrlState,
    encodeUrlState: urlTimeRangeRT.encode,
    urlStateKey: TIME_RANGE_URL_STATE_KEY,
    writeDefaultState: true,
  });

  const handleTimeFilterChange = useCallback(
    (timeRange: TimeRange) => {
      const { from, to } = timeRange;
      // TODO: Check if different so time filter doesn't need to
      setTimeRange({ startTime: from, endTime: to });
    },
    [setTimeRange]
  );

  useSyncKibanaTimeFilterTime(
    TIME_DEFAULTS,
    { from: timeRange.startTime, to: timeRange.endTime },
    handleTimeFilterChange
  );

  const [autoRefresh, setAutoRefresh] = useUrlState({
    defaultState: {
      isPaused: false,
      interval: 30000,
    },
    decodeUrlState: (value: unknown) =>
      pipe(autoRefreshRT.decode(value), fold(constant(undefined), identity)),
    encodeUrlState: autoRefreshRT.encode,
    urlStateKey: AUTOREFRESH_URL_STATE_KEY,
    writeDefaultState: true,
  });

  return {
    timeRange,
    setTimeRange,
    autoRefresh,
    setAutoRefresh,
  };
};
