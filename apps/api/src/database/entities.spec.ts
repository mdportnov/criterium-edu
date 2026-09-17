import { describe, expect, it } from 'vitest';

/**
 * Every entity module is imported here for one reason: TypeORM's decorators
 * run at import time, and a @Column() without an explicit `type` throws
 * ColumnTypeUndefinedError unless the compiler emitted decorator metadata.
 * Webpack does emit it; Vitest's esbuild transform does not, and neither does
 * anything that loads these files outside the Nest build.
 *
 * So: declare column types explicitly. This test fails the moment someone
 * adds a bare @Column(), instead of that surfacing later in an unrelated
 * suite or at runtime.
 */
const entityModules = import.meta.glob('../modules/**/entities/*.entity.ts');

describe('entity definitions', () => {
  it('finds the entity files', () => {
    expect(Object.keys(entityModules).length).toBeGreaterThan(5);
  });

  it.each(Object.keys(entityModules))(
    'declares explicit column types in %s',
    async (path) => {
      await expect(entityModules[path]()).resolves.toBeDefined();
    },
  );
});
