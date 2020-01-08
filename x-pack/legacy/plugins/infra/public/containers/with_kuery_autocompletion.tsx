/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import {
  AutocompleteSuggestion,
  IIndexPattern,
  DataPublicPluginStart,
} from 'src/plugins/data/public';
import {
  withKibana,
  KibanaReactContextValue,
  KibanaServices,
} from '../../../../../../src/plugins/kibana_react/public';
import { RendererFunction } from '../utils/typed_react';

interface WithKueryAutocompletionLifecycleProps {
  kibana: KibanaReactContextValue<{ data: DataPublicPluginStart } & KibanaServices>;
  children: RendererFunction<{
    isLoadingSuggestions: boolean;
    loadSuggestions: (expression: string, cursorPosition: number, maxSuggestions?: number) => void;
    suggestions: AutocompleteSuggestion[];
  }>;
  indexPattern: IIndexPattern;
}

interface WithKueryAutocompletionLifecycleState {
  // lacking cancellation support in the autocompletion api,
  // this is used to keep older, slower requests from clobbering newer ones
  currentRequest: {
    expression: string;
    cursorPosition: number;
  } | null;
  suggestions: AutocompleteSuggestion[];
}

class WithKueryAutocompletionComponent extends React.Component<
  WithKueryAutocompletionLifecycleProps,
  WithKueryAutocompletionLifecycleState
> {
  public readonly state: WithKueryAutocompletionLifecycleState = {
    currentRequest: null,
    suggestions: [],
  };

  public render() {
    const { currentRequest, suggestions } = this.state;

    return this.props.children({
      isLoadingSuggestions: currentRequest !== null,
      loadSuggestions: this.loadSuggestions,
      suggestions,
    });
  }

  private getAutocompleteProvider = (language: string) => {
    return this.props.kibana.services.data.autocomplete.getProvider(language);
  };

  private loadSuggestions = async (
    expression: string,
    cursorPosition: number,
    maxSuggestions?: number
  ) => {
    const { indexPattern } = this.props;
    const autocompletionProvider = this.getAutocompleteProvider('kuery');
    const config = {
      get: () => true,
    };

    if (!autocompletionProvider) {
      return;
    }

    const getSuggestions = autocompletionProvider({
      config,
      indexPatterns: [indexPattern],
      boolFilter: [],
    });

    this.setState({
      currentRequest: {
        expression,
        cursorPosition,
      },
      suggestions: [],
    });

    const suggestions = await getSuggestions({
      query: expression,
      selectionStart: cursorPosition,
      selectionEnd: cursorPosition,
    });

    this.setState(state =>
      state.currentRequest &&
      state.currentRequest.expression !== expression &&
      state.currentRequest.cursorPosition !== cursorPosition
        ? state // ignore this result, since a newer request is in flight
        : {
            ...state,
            currentRequest: null,
            suggestions: maxSuggestions ? suggestions.slice(0, maxSuggestions) : suggestions,
          }
    );
  };
}

export const WithKueryAutocompletion = withKibana<WithKueryAutocompletionLifecycleProps>(
  WithKueryAutocompletionComponent
);
