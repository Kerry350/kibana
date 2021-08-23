/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import url from 'url';
import moment from 'moment';
import archives_metadata from '../../../fixtures/es_archiver/archives_metadata';

const { start, end } = archives_metadata['apm_8.0.0'];

const serviceOverviewPath = '/app/apm/services/opbeans-java/overview';
const serviceOverviewHref = url.format({
  pathname: serviceOverviewPath,
  query: { rangeFrom: start, rangeTo: end },
});

const apisToIntercept = [
  {
    endpoint: '/api/apm/services/opbeans-java/transactions/charts/latency',
    name: 'latencyChartRequest',
  },
  {
    endpoint: '/api/apm/services/opbeans-java/throughput',
    name: 'throughputChartRequest',
  },
  {
    endpoint: '/api/apm/services/opbeans-java/transactions/charts/error_rate',
    name: 'errorRateChartRequest',
  },
  {
    endpoint:
      '/api/apm/services/opbeans-java/transactions/groups/detailed_statistics',
    name: 'transactionGroupsDetailedRequest',
  },
  {
    endpoint: '/api/apm/services/opbeans-java/error_groups/detailed_statistics',
    name: 'errorGroupsDetailedRequest',
  },
  {
    endpoint:
      '/api/apm/services/opbeans-java/service_overview_instances/detailed_statistics',
    name: 'instancesDetailedRequest',
  },
];

describe('Service overview: Time Comparison', () => {
  beforeEach(() => {
    cy.loginAsReadOnlyUser();
  });

  it('enables by default the time comparison feature with Last 24 hours selected', () => {
    cy.visit(serviceOverviewPath);
    cy.url().should('include', 'comparisonEnabled=true&comparisonType=day');
  });

  describe('when comparison is toggled off', () => {
    it('disables select box', () => {
      cy.visit(serviceOverviewHref);
      cy.contains('opbeans-java');

      // Comparison is enabled by default
      cy.get('[data-test-subj="comparisonSelect"]').should('be.enabled');

      // toggles off comparison
      cy.contains('Comparison').click();
      cy.get('[data-test-subj="comparisonSelect"]').should('be.disabled');
    });

    it('calls APIs without comparison time range', () => {
      apisToIntercept.map(({ endpoint, name }) => {
        cy.intercept('GET', endpoint).as(name);
      });
      cy.visit(serviceOverviewHref);
      cy.contains('opbeans-java');

      cy.get('[data-test-subj="comparisonSelect"]').should('be.enabled');
      const comparisonStartEnd =
        'comparisonStart=2021-08-02T06%3A50%3A00.000Z&comparisonEnd=2021-08-02T07%3A20%3A15.910Z';
      // When the page loads it fetches all APIs with comparison time range
      cy.wait(apisToIntercept.map(({ name }) => `@${name}`)).then(
        (interceptions) => {
          interceptions.map((interception) => {
            expect(interception.request.url).include(comparisonStartEnd);
          });
        }
      );

      // toggles off comparison
      cy.contains('Comparison').click();
      cy.get('[data-test-subj="comparisonSelect"]').should('be.disabled');
      // When comparison is disabled APIs are called withou comparison time range
      cy.wait(apisToIntercept.map(({ name }) => `@${name}`)).then(
        (interceptions) => {
          interceptions.map((interception) => {
            expect(interception.request.url).not.include(comparisonStartEnd);
          });
        }
      );
    });
  });

  it('changes comparison type', () => {
    apisToIntercept.map(({ endpoint, name }) => {
      cy.intercept('GET', endpoint).as(name);
    });
    cy.visit(serviceOverviewPath);
    cy.contains('opbeans-java');
    // opens the page with "Day before" selected
    cy.get('[data-test-subj="comparisonSelect"]').should('have.value', 'day');

    // selects another comparison type
    cy.get('[data-test-subj="comparisonSelect"]').select('week');
    cy.get('[data-test-subj="comparisonSelect"]').should('have.value', 'week');
  });

  it('changes comparison type when a new time range is selected', () => {
    cy.visit(serviceOverviewPath);
    cy.contains('opbeans-java');
    // Time comparison default value
    cy.get('[data-test-subj="comparisonSelect"]').should('have.value', 'day');
    cy.contains('Day before');
    cy.contains('Week before');

    cy.changeTimeRange('Today');
    cy.contains('Day before');
    cy.contains('Week before');

    cy.changeTimeRange('Last 24 hours');
    cy.get('[data-test-subj="comparisonSelect"]').should('have.value', 'day');
    cy.contains('Day before');
    cy.contains('Week before');

    cy.changeTimeRange('Last 7 days');
    cy.get('[data-test-subj="comparisonSelect"]').should('have.value', 'week');
    cy.get('[data-test-subj="comparisonSelect"]').should(
      'contain.text',
      'Week before'
    );
    cy.get('[data-test-subj="comparisonSelect"]').should(
      'not.contain.text',
      'Day before'
    );
    cy.contains('Week before');

    cy.changeTimeRange('Last 30 days');
    cy.get('[data-test-subj="comparisonSelect"]').should(
      'have.value',
      'period'
    );
    cy.get('[data-test-subj="comparisonSelect"]').should(
      'not.contain.text',
      'Day before'
    );
    cy.get('[data-test-subj="comparisonSelect"]').should(
      'not.contain.text',
      'Week before'
    );
  });

  it('hovers over throughput chart shows previous and current period', () => {
    apisToIntercept.map(({ endpoint, name }) => {
      cy.intercept('GET', endpoint).as(name);
    });
    cy.visit(
      url.format({
        pathname: serviceOverviewPath,
        query: {
          rangeFrom: moment(end).subtract(15, 'minutes').toISOString(),
          rangeTo: end,
        },
      })
    );
    cy.contains('opbeans-java');
    cy.wait('@throughputChartRequest');
    cy.get('[data-test-subj="throughput"]')
      .get('#echHighlighterClipPath__throughput')
      .realHover({ position: 'center' });
    cy.contains('Previous period');
    cy.contains('0 tpm');

    cy.contains('Throughput');
    cy.contains('0 tpm');
  });
});
