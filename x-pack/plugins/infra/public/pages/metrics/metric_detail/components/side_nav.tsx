/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiHideFor, EuiPageSideBar, EuiShowFor, EuiSideNav } from '@elastic/eui';
import React, { useState, useCallback } from 'react';
import { NavItem } from '../lib/side_nav_context';
import { euiStyled } from '../../../../../../../../src/plugins/kibana_react/common';
interface Props {
  loading: boolean;
  name: string;
  items: NavItem[];
}

export const MetricsSideNav = ({ loading, name, items }: Props) => {
  const [isOpenOnMobile, setMobileState] = useState(false);

  const toggle = useCallback(() => {
    setMobileState(!isOpenOnMobile);
  }, [isOpenOnMobile]);

  const content = loading ? null : <EuiSideNav items={items} />;
  const mobileContent = loading ? null : (
    <EuiSideNav
      items={items}
      mobileTitle={name}
      toggleOpenOnMobile={toggle}
      isOpenOnMobile={isOpenOnMobile}
    />
  );

  return (
    <>
      <EuiHideFor sizes={['xs', 's', 'm']}>
        <StickyPageSideBar>{content}</StickyPageSideBar>
      </EuiHideFor>
      <EuiShowFor sizes={['xs', 's', 'm']}>
        <EuiPageSideBar>{mobileContent}</EuiPageSideBar>
      </EuiShowFor>
    </>
  );
};

const StickyPageSideBar = euiStyled(EuiPageSideBar)`
  position: sticky;
  top: ${(props) =>
    parseFloat(props.theme.eui.euiHeaderHeightCompensation) * 2 +
    parseFloat(props.theme.eui.paddingSizes.s) +
    'px'};
`;
