/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useMemo, useCallback, useState } from 'react';
import moment from 'moment';
import { encode } from 'rison-node';
import { i18n } from '@kbn/i18n';
import { getFriendlyNameForPartitionId } from '../../../../../../common/log_analysis';
import {
  LogEntryColumn,
  LogEntryFieldColumn,
  LogEntryMessageColumn,
  LogEntryRowWrapper,
  LogEntryTimestampColumn,
  LogEntryContextMenu,
} from '../../../../../components/logging/log_text_stream';
import { LogColumnConfiguration } from '../../../../../utils/source_configuration';
import { useLinkProps } from '../../../../../hooks/use_link_props';
import { TimeRange } from '../../../../../../common/http_api/shared/time_range';
import { partitionField } from '../../../../../../common/log_analysis/job_parameters';
import { getEntitySpecificSingleMetricViewerLink } from '../../../../../components/logging/log_analysis_results/analyze_in_ml_button';
import { LogEntryRateExample } from '../../../../../../common/http_api/log_analysis/results';

export const exampleMessageScale = 'medium' as const;
export const exampleTimestampFormat = 'dateTime' as const;

const MENU_LABEL = i18n.translate('xpack.infra.logAnomalies.logEntryExamplesMenuLabel', {
  defaultMessage: 'View actions for log entry',
});

const VIEW_IN_STREAM_LABEL = i18n.translate(
  'xpack.infra.logAnomalies.logEntryExamplesViewInStreamLabel',
  {
    defaultMessage: 'View in stream',
  }
);

const VIEW_ANOMALY_IN_ML_LABEL = i18n.translate(
  'xpack.infra.logAnomalies.logEntryExamplesViewAnomalyInMlLabel',
  {
    defaultMessage: 'View anomaly in machine learning',
  }
);

type Props = LogEntryRateExample & {
  timeRange: TimeRange;
  jobId: string;
};

export const LogEntryRateExampleMessage: React.FunctionComponent<Props> = ({
  id,
  dataset,
  message,
  timestamp,
  tiebreaker,
  timeRange,
  jobId,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const openMenu = useCallback(() => setIsMenuOpen(true), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const setItemIsHovered = useCallback(() => setIsHovered(true), []);
  const setItemIsNotHovered = useCallback(() => setIsHovered(false), []);

  // the dataset must be encoded for the field column and the empty value must
  // be turned into a user-friendly value
  const encodedDatasetFieldValue = useMemo(
    () => JSON.stringify(getFriendlyNameForPartitionId(dataset)),
    [dataset]
  );

  const viewInStreamLinkProps = useLinkProps({
    app: 'logs',
    pathname: 'stream',
    search: {
      logPosition: encode({
        end: moment(timeRange.endTime).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
        position: { tiebreaker, time: timestamp },
        start: moment(timeRange.startTime).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
        streamLive: false,
      }),
      flyoutOptions: encode({
        surroundingLogsId: id,
      }),
      logFilter: encode({
        expression: `${partitionField}: ${dataset}`,
        kind: 'kuery',
      }),
    },
  });

  const viewAnomalyInMachineLearningLinkProps = useLinkProps(
    getEntitySpecificSingleMetricViewerLink(jobId, timeRange, {
      [partitionField]: dataset,
    })
  );

  const menuItems = useMemo(() => {
    return [
      {
        label: VIEW_IN_STREAM_LABEL,
        onClick: viewInStreamLinkProps.onClick,
      },
      {
        label: VIEW_ANOMALY_IN_ML_LABEL,
        onClick: viewAnomalyInMachineLearningLinkProps.onClick,
      },
    ];
  }, [viewInStreamLinkProps.onClick, viewAnomalyInMachineLearningLinkProps.onClick]);

  return (
    <LogEntryRowWrapper
      scale={exampleMessageScale}
      onMouseEnter={setItemIsHovered}
      onMouseLeave={setItemIsNotHovered}
    >
      <LogEntryColumn {...columnWidths[timestampColumnId]}>
        <LogEntryTimestampColumn format={exampleTimestampFormat} time={timestamp} />
      </LogEntryColumn>
      <LogEntryColumn {...columnWidths[messageColumnId]}>
        <LogEntryMessageColumn
          columnValue={{
            columnId: messageColumnId,
            message: [{ field: 'message', value: message, highlights: [] }],
          }}
          highlights={noHighlights}
          isActiveHighlight={false}
          wrapMode="none"
        />
      </LogEntryColumn>
      <LogEntryColumn {...columnWidths[datasetColumnId]}>
        <LogEntryFieldColumn
          columnValue={{
            columnId: datasetColumnId,
            field: 'event.dataset',
            value: encodedDatasetFieldValue,
            highlights: [],
          }}
          highlights={noHighlights}
          isActiveHighlight={false}
          wrapMode="none"
        />
      </LogEntryColumn>
      <LogEntryColumn
        key="logColumn iconLogColumn iconLogColumn:details"
        {...columnWidths[contextMenuColumnId]}
      >
        {isHovered || isMenuOpen ? (
          <LogEntryContextMenu
            aria-label={MENU_LABEL}
            isOpen={isMenuOpen}
            onOpen={openMenu}
            onClose={closeMenu}
            items={menuItems}
          />
        ) : null}
      </LogEntryColumn>
    </LogEntryRowWrapper>
  );
};

const noHighlights: never[] = [];
const timestampColumnId = 'log-entry-example-timestamp-column' as const;
const messageColumnId = 'log-entry-examples-message-column' as const;
const datasetColumnId = 'log-entry-examples-dataset-column' as const;
const contextMenuColumnId = 'log-entry-examples-context-menu-column' as const;

const DETAIL_FLYOUT_ICON_MIN_WIDTH = 32;
const COLUMN_PADDING = 8;

// TODO: Tweak these widths for log entry rate instead of categories
const columnWidths = {
  [timestampColumnId]: {
    growWeight: 0,
    shrinkWeight: 0,
    // w_count + w_trend - w_padding = 120 px + 220 px - 8 px
    baseWidth: '332px',
  },
  [messageColumnId]: {
    growWeight: 1,
    shrinkWeight: 0,
    baseWidth: '0%',
  },
  [datasetColumnId]: {
    growWeight: 0,
    shrinkWeight: 0,
    // w_dataset + w_max_anomaly + w_expand - w_padding = 200 px + 160 px + 40 px + 40 px - 8 px
    baseWidth: '432px',
  },
  [contextMenuColumnId]: {
    growWeight: 0,
    shrinkWeight: 0,
    baseWidth: `${DETAIL_FLYOUT_ICON_MIN_WIDTH + 2 * COLUMN_PADDING}px`,
  },
};

export const exampleMessageColumnConfigurations: LogColumnConfiguration[] = [
  {
    timestampColumn: {
      id: timestampColumnId,
    },
  },
  {
    messageColumn: {
      id: messageColumnId,
    },
  },
  {
    fieldColumn: {
      field: 'event.dataset',
      id: datasetColumnId,
    },
  },
];
