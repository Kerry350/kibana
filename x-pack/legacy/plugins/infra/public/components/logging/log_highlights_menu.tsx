/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPopover,
} from '@elastic/eui';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import euiStyled from '../../../../../common/eui_styled_components';
import { useVisibilityState } from '../../utils/use_visibility_state';

interface LogHighlightsMenuProps {
  onChange: (highlightTerms: string[]) => void;
  isLoading: boolean;
  activeHighlights: boolean;
}
export const LogHighlightsMenu: React.FC<LogHighlightsMenuProps> = ({
  onChange,
  isLoading,
  activeHighlights,
}) => {
  const {
    isVisible: isPopoverOpen,
    hide: closePopover,
    toggle: togglePopover,
  } = useVisibilityState(false);

  // Input field state
  const [highlightTerm, setHighlightTerm] = useState('');
  const debouncedOnChange = useMemo(() => debounce(onChange, 275), [onChange]);
  const changeHighlightTerm = useCallback(
    e => {
      const value = e.target.value;
      setHighlightTerm(value);
    },
    [setHighlightTerm]
  );
  const clearHighlightTerm = useCallback(() => setHighlightTerm(''), [setHighlightTerm]);
  useEffect(
    () => {
      debouncedOnChange([highlightTerm]);
    },
    [highlightTerm]
  );

  // Input ref state
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);
  useEffect(
    () => {
      if (inputRef) {
        inputRef.focus();
      }
    },
    [inputRef]
  );
  const button = (
    <EuiButtonEmpty color="text" size="xs" iconType="brush" onClick={togglePopover}>
      Highlights
      {activeHighlights ? (
        <IconWrapper>
          <EuiIcon type="checkInCircleFilled" size="s" color="secondary" />
        </IconWrapper>
      ) : null}
    </EuiButtonEmpty>
  );

  return (
    <EuiPopover
      id="popover"
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      ownFocus
    >
      <LogHighlightsMenuContent>
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem>
            <EuiFieldText
              placeholder="Terms to highlight"
              fullWidth={true}
              value={highlightTerm}
              onChange={changeHighlightTerm}
              isLoading={isLoading}
              aria-label="Terms to highlight"
              inputRef={ref => {
                setInputRef(ref);
              }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              aria-label="Clear terms to highlight"
              color="danger"
              iconType="trash"
              onClick={clearHighlightTerm}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </LogHighlightsMenuContent>
    </EuiPopover>
  );
};

const IconWrapper = euiStyled.span`
  padding-left: ${props => props.theme.eui.paddingSizes.xs};
`;

const LogHighlightsMenuContent = euiStyled.div`
  width: 300px;
`;
