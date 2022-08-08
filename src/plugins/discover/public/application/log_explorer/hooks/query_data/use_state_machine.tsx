/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { ISearchSource, QueryStart } from '@kbn/data-plugin/public';
import { DataView } from '@kbn/data-views-plugin/public';
import { TimeRange } from '@kbn/es-query';
import { useInterpret } from '@xstate/react';
import createContainer from 'constate';
import moment from 'moment';
import { useMemo } from 'react';
import {
  dataAccessStateMachine,
  loadAfter,
  loadAround,
  loadBefore,
} from '../../state_machines/data_access_state_machine';
import { loadTail } from '../../state_machines/data_access_state_machine/load_tail_service';
import { useSubscription } from '../use_observable';

export const useStateMachineService = ({
  virtualRowCount,
  dataView,
  query,
  searchSource,
}: {
  virtualRowCount: number;
  dataView: DataView;
  query: QueryStart;
  searchSource: ISearchSource;
}) => {
  const centerRowIndex = useMemo(() => Math.floor(virtualRowCount / 2), [virtualRowCount]);

  const dataAccessService = useInterpret(
    () => {
      const initialTimeRange = query.timefilter.timefilter.getAbsoluteTime();

      return dataAccessStateMachine.withContext({
        configuration: {
          chunkSize: 200,
          minimumChunkOverscan: 50,
        },
        dataView,
        timeRange: initialTimeRange,
        position: {
          timestamp: getMiddleOfTimeRange(initialTimeRange),
          tiebreaker: 0,
        },
        topChunk: {
          status: 'uninitialized',
        },
        bottomChunk: {
          status: 'uninitialized',
        },
      });
    },
    {
      services: {
        loadAround: loadAround({
          centerRowIndex,
          dataView,
          query,
          searchSource,
        }),
        loadBefore: loadBefore({
          dataView,
          query,
          searchSource,
        }),
        loadAfter: loadAfter({
          dataView,
          query,
          searchSource,
        }),
        loadTail: loadTail({
          dataView,
          query,
          searchSource,
        }),
      },
      delays: {
        loadTailDelay: () => query.timefilter.timefilter.getRefreshInterval().value,
      },
      devTools: true,
    }
  );

  // react to time filter changes
  useSubscription(
    useMemo(() => query.timefilter.timefilter.getFetch$(), [query.timefilter.timefilter]),
    {
      next: () => {
        dataAccessService.send({
          type: 'timeRangeChanged',
          timeRange: query.timefilter.timefilter.getAbsoluteTime(),
        });
      },
    }
  );

  // react to auto-refresh changes
  useSubscription(
    useMemo(
      () => query.timefilter.timefilter.getRefreshIntervalUpdate$(),
      [query.timefilter.timefilter]
    ),
    {
      next: () => {
        const refreshInterval = query.timefilter.timefilter.getRefreshInterval();

        if (refreshInterval.pause) {
          dataAccessService.send({
            type: 'stopTailing',
          });
        } else {
          dataAccessService.send({
            type: 'startTailing',
          });
        }
      },
    }
  );

  return dataAccessService;
};

export const [StateMachineProvider, useStateMachineContext] =
  createContainer(useStateMachineService);

// export const useStateMachineContextSelector = <T, TEmitted = DataAccessService['state']>(
//   selector: (emitted: TEmitted) => T,
//   compare?: (a: T, b: T) => boolean,
//   getSnapshot?: (a: DataAccessService) => TEmitted
// ) => {
//   const dataAccessMachine = useStateMachineContext();

//   return useSelector(dataAccessMachine, selector, compare, getSnapshot);
// };

// export const useStateMachineContextActor = () => {
//   const dataAccessService = useStateMachineContext();
//   return useActor(dataAccessService);
// };

const getMiddleOfTimeRange = ({ from, to }: TimeRange): string => {
  const fromMoment = moment.utc(from);
  const toMoment = moment.utc(to);

  return fromMoment.add(toMoment.diff(fromMoment) / 2, 'ms').toISOString();
};
