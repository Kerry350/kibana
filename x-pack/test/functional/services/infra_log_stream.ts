/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { KibanaFunctionalTestDefaultProviders } from '../../types/providers';
import { WebElementWrapper } from '../../../../test/functional/services/lib/web_element_wrapper';

export function InfraLogStreamProvider({ getService }: KibanaFunctionalTestDefaultProviders) {
  const testSubjects = getService('testSubjects');

  return {
    async getColumnHeaderLabels(): Promise<string[]> {
      const columnHeaderElements: WebElementWrapper[] = await testSubjects.findAll(
        'logColumnHeader'
      );
      return await Promise.all(columnHeaderElements.map(element => element.getVisibleText()));
    },

    async getStream(): Promise<WebElementWrapper[]> {
      return await testSubjects.find('logStream');
    },

    async getStreamEntries(): Promise<WebElementWrapper[]> {
      return await testSubjects.findAll('streamEntry');
    },

    async getLogColumnsOfStreamEntry(
      entryElement: WebElementWrapper
    ): Promise<WebElementWrapper[]> {
      return await testSubjects.findAllDescendant('logColumn', entryElement);
    },
  };
}
