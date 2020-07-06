/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiBasicTable, EuiBasicTableColumn } from '@elastic/eui';
import { RIGHT_ALIGNMENT } from '@elastic/eui/lib/services';
import moment from 'moment';
import { i18n } from '@kbn/i18n';
import React, { useCallback, useMemo } from 'react';
import { useSet } from 'react-use';
import { TimeRange } from '../../../../../../common/http_api/shared/time_range';
import {
  formatAnomalyScore,
  getFriendlyNameForPartitionId,
} from '../../../../../../common/log_analysis';
import { RowExpansionButton } from '../../../../../components/basic_table';
import { AnomaliesTableExpandedRow } from './expanded_row';
import { AnomalySeverityIndicator } from '../../../../../components/logging/log_analysis_results/anomaly_severity_indicator';
import { useKibanaUiSetting } from '../../../../../utils/use_kibana_ui_setting';
import {
  Page,
  FetchNextPage,
  FetchPreviousPage,
  ChangeSortOptions,
  ChangePaginationOptions,
  SortOptions,
  PaginationOptions,
  LogEntryAnomalies,
} from '../../use_log_entry_anomalies_results';

interface TableItem {
  id: string;
  dataset: string;
  datasetName: string;
  anomalyScore: number;
  anomalyMessage: string;
  startTime: number;
}

const anomalyScoreColumnName = i18n.translate(
  'xpack.infra.logs.analysis.anomaliesTableAnomalyScoreColumnName',
  {
    defaultMessage: 'Anomaly score',
  }
);

const anomalyMessageColumnName = i18n.translate(
  'xpack.infra.logs.analysis.anomaliesTableAnomalyMessageName',
  {
    defaultMessage: 'Anomaly',
  }
);

const anomalyStartTimeColumnName = i18n.translate(
  'xpack.infra.logs.analysis.anomaliesTableAnomalyStartTime',
  {
    defaultMessage: 'Start time',
  }
);

const datasetColumnName = i18n.translate(
  'xpack.infra.logs.analysis.anomaliesTableAnomalyDatasetName',
  {
    defaultMessage: 'Dataset',
  }
);

const moreThanExpectedAnomalyMessage = i18n.translate(
  'xpack.infra.logs.analysis.anomaliesTableMoreThanExpectedAnomalyMessage',
  {
    defaultMessage: 'More log messages in this dataset than expected',
  }
);

const fewerThanExpectedAnomalyMessage = i18n.translate(
  'xpack.infra.logs.analysis.anomaliesTableFewerThanExpectedAnomalyMessage',
  {
    defaultMessage: 'Fewer log messages in this dataset than expected',
  }
);

const getAnomalyMessage = (actualRate: number, typicalRate: number): string => {
  return actualRate < typicalRate
    ? fewerThanExpectedAnomalyMessage
    : moreThanExpectedAnomalyMessage;
};

export const AnomaliesTable: React.FunctionComponent<{
  results: LogEntryAnomalies;
  setTimeRange: (timeRange: TimeRange) => void;
  timeRange: TimeRange;
  jobId: string;
  changeSortOptions: ChangeSortOptions;
  changePaginationOptions: ChangePaginationOptions;
  sortOptions: SortOptions;
  paginationOptions: PaginationOptions;
  page: Page;
  fetchNextPage?: FetchNextPage;
  fetchPreviousPage?: FetchPreviousPage;
}> = ({
  results,
  timeRange,
  setTimeRange,
  jobId,
  changeSortOptions,
  sortOptions,
  changePaginationOptions,
  paginationOptions,
  fetchNextPage,
  fetchPreviousPage,
  page,
}) => {
  const [dateFormat] = useKibanaUiSetting('dateFormat', 'Y-MM-DD HH:mm:ss');

  const tableSortOptions = useMemo(() => {
    return {
      sort: sortOptions,
    };
  }, [sortOptions]);

  const tableItems: TableItem[] = useMemo(() => {
    return results.map((anomaly) => {
      return {
        id: anomaly.id,
        dataset: anomaly.dataset,
        datasetName: getFriendlyNameForPartitionId(anomaly.dataset),
        anomalyScore: formatAnomalyScore(anomaly.anomalyScore),
        anomalyMessage: getAnomalyMessage(anomaly.actual, anomaly.typical),
        startTime: anomaly.startTime,
      };
    });
  }, [results]);

  const [expandedIds, { add: expandId, remove: collapseId }] = useSet<string>(new Set());

  const expandedDatasetRowContents = useMemo(
    () =>
      [...expandedIds].reduce<Record<string, React.ReactNode>>((aggregatedDatasetRows, id) => {
        const anomaly = results.find((_anomaly) => _anomaly.id === id);

        return {
          ...aggregatedDatasetRows,
          [id]: anomaly ? (
            <AnomaliesTableExpandedRow anomaly={anomaly} timeRange={timeRange} jobId={jobId} />
          ) : null,
        };
      }, {}),
    [expandedIds, results, timeRange, jobId]
  );

  const handleTableChange = useCallback(
    ({ sort = {} }) => {
      changeSortOptions(sort);
    },
    [changeSortOptions]
  );

  const columns: Array<EuiBasicTableColumn<TableItem>> = useMemo(
    () => [
      {
        field: 'anomalyScore',
        name: anomalyScoreColumnName,
        sortable: true,
        truncateText: true,
        dataType: 'number' as const,
        width: '130px',
        render: (anomalyScore: number) => <AnomalySeverityIndicator anomalyScore={anomalyScore} />,
      },
      {
        field: 'anomalyMessage',
        name: anomalyMessageColumnName,
        sortable: false,
        truncateText: true,
      },
      {
        field: 'startTime',
        name: anomalyStartTimeColumnName,
        sortable: true,
        truncateText: true,
        width: '230px',
        render: (startTime: number) => moment(startTime).format(dateFormat),
      },
      {
        field: 'datasetName',
        name: datasetColumnName,
        sortable: true,
        truncateText: true,
        width: '200px',
      },
      {
        align: RIGHT_ALIGNMENT,
        width: '40px',
        isExpander: true,
        render: (item: TableItem) => (
          <RowExpansionButton
            isExpanded={expandedIds.has(item.id)}
            item={item.id}
            onExpand={expandId}
            onCollapse={collapseId}
          />
        ),
      },
    ],
    [collapseId, expandId, expandedIds, dateFormat]
  );
  return (
    <>
      <EuiBasicTable
        items={tableItems}
        itemId="id"
        itemIdToExpandedRowMap={expandedDatasetRowContents}
        isExpandable={true}
        hasActions={true}
        columns={columns}
        sorting={tableSortOptions}
        onChange={handleTableChange}
      />
      <div>
        {fetchPreviousPage ? (
          <button onClick={() => fetchPreviousPage()}>Previous page</button>
        ) : null}
        <span>Page: {page}</span>
        {fetchNextPage ? <button onClick={() => fetchNextPage()}>Next page</button> : null}
      </div>
    </>
  );
};
