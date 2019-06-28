/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { EuiIcon, EuiPopover, EuiButton, EuiButtonEmpty, EuiFieldText } from '@elastic/eui';
import euiStyled from '../../../../../common/eui_styled_components';

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
  // Popover state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const togglePopover = useCallback(
    () => {
      setIsPopoverOpen(!isPopoverOpen);
    },
    [isPopoverOpen, setIsPopoverOpen]
  );
  const closePopover = useCallback(
    () => {
      setIsPopoverOpen(false);
    },
    [setIsPopoverOpen]
  );
  // Input field state
  const [highlightTerm, setHighlightTerm] = useState('');
  const debouncedOnChange = useRef(
    debounce((value: string) => {
      onChange([value]);
    }, 275)
  );
  const changeHighlightTerm = useCallback(
    e => {
      const value = e.target.value;
      setHighlightTerm(value);
    },
    [setHighlightTerm]
  );
  useEffect(
    () => {
      debouncedOnChange.current(highlightTerm);
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
      <div style={{ width: '210px' }}>
        <EuiFieldText
          placeholder="Term to highlight"
          fullWidth={true}
          value={highlightTerm}
          onChange={changeHighlightTerm}
          isLoading={isLoading}
          aria-label="Term to highlight"
          inputRef={ref => {
            setInputRef(ref);
          }}
        />
        <ButtonWrapper>
          <EuiButton
            color="primary"
            isDisabled={!highlightTerm}
            onClick={() => {
              setHighlightTerm('');
            }}
            fullWidth={true}
            size="s"
          >
            Clear highlights
          </EuiButton>
        </ButtonWrapper>
      </div>
    </EuiPopover>
  );
};

const IconWrapper = euiStyled.span`
  padding-left: ${props => props.theme.eui.paddingSizes.xs};
`;

const ButtonWrapper = euiStyled.div`
  padding-top: ${props => props.theme.eui.paddingSizes.xs};
`;
