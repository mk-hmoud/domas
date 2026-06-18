import { Injectable, ForbiddenException } from '@nestjs/common';
import { LocationScope } from '../../common/interfaces/location-scope.interface';

export interface ScopeClause {
  // SQL boolean expression to AND into a WHERE clause. 'TRUE'/'FALSE' when no
  // parameter is needed.
  clause: string;
  // Array to push into the query's params array when not null - matches the
  // placeholder index passed to buildScopeClause.
  param: string[] | null;
}

@Injectable()
export class LocationScopeService {
  /**
   * Builds a SQL fragment that restricts rows to a staff member's assigned
   * location subtrees. `treePathExpr` must be an `ltree` SQL expression
   * (column or subquery) resolving to the row's location. `paramIndex` is the
   * 1-based placeholder position to use if a parameter is needed (typically
   * `params.length + 1` at the call site).
   */
  buildScopeClause(
    scope: LocationScope | undefined,
    treePathExpr: string,
    paramIndex: number,
  ): ScopeClause {
    if (scope?.unrestricted) {
      return { clause: 'TRUE', param: null };
    }
    if (!scope || scope.treePaths.length === 0) {
      return { clause: 'FALSE', param: null };
    }
    return {
      clause: `${treePathExpr} <@ ANY($${paramIndex}::ltree[])`,
      param: scope.treePaths,
    };
  }

  /** Throws ForbiddenException if treePath falls outside the given scope. */
  assertAccess(scope: LocationScope | undefined, treePath: string): void {
    if (scope?.unrestricted) return;

    const inScope = (scope?.treePaths ?? []).some(
      (anchor) => treePath === anchor || treePath.startsWith(`${anchor}.`),
    );

    if (!inScope) {
      throw new ForbiddenException('You do not have access to this location.');
    }
  }
}
