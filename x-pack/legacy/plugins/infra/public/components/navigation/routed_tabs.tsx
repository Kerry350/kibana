/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiTab, EuiTabs, EuiLink } from '@elastic/eui';
import React from 'react';
import { Route } from 'react-router-dom';
import euiStyled from '../../../../../common/eui_styled_components';

interface TabConfiguration {
  title: string;
  path: string;
}

interface RoutedTabsProps {
  tabs: TabConfiguration[];
}

export class RoutedTabs extends React.Component<RoutedTabsProps> {
  public render() {
    return <EuiTabs display="condensed">{this.renderTabs()}</EuiTabs>;
  }

  private renderTabs() {
    return this.props.tabs.map(tab => {
      return (
        <Route
          key={`${tab.path}-${tab.title}`}
          path={tab.path}
          children={({ match, history }) => (
            <EuiTab
              onClick={() => {
                history.push(tab.path);
              }}
              isSelected={match !== null}
            >
              {tab.title}
            </EuiTab>
          )}
        />
      );
    });
  }
}
