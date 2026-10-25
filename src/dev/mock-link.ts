import { ApolloLink, Observable } from '@apollo/client';

import { useNetwork } from '@/lib/network';

/**
 * Dev only (EXPO_PUBLIC_MOCKS=1): answers operations from src/dev/mocks/<OperationName>.ts
 * so screens can be checked on web without the API. A fixture exports `default (variables) => data`.
 * Offline (browser devtools or Playwright `setOffline`), it fails the way fetch does.
 */
const files = require.context('./mocks', false, /\.ts$/);
const fixtures = new Map(
  files.keys().map((key) => [key.replace(/^\.\/(.*)\.ts$/, '$1'), files(key).default as (v: Record<string, unknown>) => unknown]),
);

export const mockLink = new ApolloLink(
  (operation) =>
    new Observable((observer) => {
      const fixture = fixtures.get(operation.operationName ?? '');
      const timer = setTimeout(() => {
        if (!useNetwork.getState().online) return observer.error(new TypeError('Network request failed'));
        if (fixture) observer.next({ data: fixture(operation.variables) as Record<string, unknown> });
        else observer.next({ errors: [{ message: `No mock for ${operation.operationName}` }] as never });
        observer.complete();
      }, 150);
      return () => clearTimeout(timer);
    }),
);
