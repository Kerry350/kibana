/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import gql from 'graphql-tag';

export const getFilterBarQueryString = `
query FilterBar($dateRangeStart: String!, $dateRangeEnd: String!) {
  filterBar: getFilterBar(dateRangeStart: $dateRangeStart, dateRangeEnd: $dateRangeEnd) {
    ports
      ids {
        key
        url
      }
      schemes
    }
  }
`;

export const getFilterBarQuery = gql`
  ${getFilterBarQueryString}
`;
