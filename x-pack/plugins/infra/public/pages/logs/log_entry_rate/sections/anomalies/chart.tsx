/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import React, { useMemo, useRef, useState } from 'react';

import { TimeRange } from '../../../../../../common/time/time_range';
import { useKibanaContextForPlugin } from '../../../../../hooks/use_kibana';
import {
  ANOMALY_SWIMLANE_EMBEDDABLE_TYPE,
  AnomalySwimlaneEmbeddableInput,
} from '../../../../../../../ml/public';
import {
  ErrorEmbeddable,
  EmbeddableRenderer,
} from '../../../../../../../../../src/plugins/embeddable/public';

export const AnomaliesChart: React.FunctionComponent<{
  timeRange: TimeRange;
  jobIds: string[];
  selectedDatasets: string[];
}> = ({
  timeRange,
  jobIds = [
    'kibana-logs-ui-default-default-log-entry-categories-count',
    'kibana-logs-ui-default-default-log-entry-rate',
  ], // TODO: Get these properly
  selectedDatasets,
}) => {
  console.log(selectedDatasets);
  const [embeddable, setEmbeddable] = useState<MlEmbeddable | ErrorEmbeddable | undefined>();
  const embeddableRoot: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const { embeddable: embeddablePlugin } = useKibanaContextForPlugin().services;
  const factory: any = embeddablePlugin.getEmbeddableFactory(ANOMALY_SWIMLANE_EMBEDDABLE_TYPE);

  const embeddableInput: AnomalySwimlaneEmbeddableInput = useMemo(() => {
    return {
      jobIds,
      swimlaneType: 'viewBy',
      timeRange: { from: timeRange.startTime, to: timeRange.endTime },
      viewBy: 'event.dataset', // TODO: Pull common constant in
      filters: [],
      query: {
        language: 'kuery',
        query: selectedDatasets.map((dataset) => `event.dataset : ${dataset}`).join(' or '),
      },
    };
  }, [jobIds, timeRange]);

  return <EmbeddableRenderer input={embeddableInput} factory={factory} />;
};
