export interface IQueryOptions {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | string;
  searchTerm?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string | number;
  maxAmount?: string | number;
  [key: string]: unknown;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
  totalPages: number;
}

export class QueryBuilder<
  TWhere extends Record<string, any> = Record<string, any>,
  TOrderBy extends Record<string, any> = Record<string, any>,
> {
  public query: IQueryOptions;
  private whereClause: Record<string, any> = {};
  private orderByClause: Record<string, any> = {};
  private pageNum: number = 1;
  private limitNum: number = 10;
  private skipNum: number = 0;
  private takeNum: number = 10;

  constructor(query: Record<string, unknown> = {}) {
    this.query = query as IQueryOptions;
  }

  /**
   * Configures full-text or substring search across specified fields using `{ mode: 'insensitive' }`.
   * Supports flat fields (e.g. 'customerName') and nested dot-notation fields (e.g. 'trader.displayName').
   */
  public search(searchableFields: string[]): this {
    const searchTerm = (this.query.searchTerm || this.query.search)
      ?.toString()
      .trim();

    if (searchTerm && searchableFields.length > 0) {
      const searchConditions = searchableFields.map((field) =>
        this.buildNestedSearchObject(field, searchTerm),
      );

      if (!this.whereClause.AND) {
        this.whereClause.AND = [];
      } else if (!Array.isArray(this.whereClause.AND)) {
        this.whereClause.AND = [this.whereClause.AND];
      }

      this.whereClause.AND.push({
        OR: searchConditions,
      });
    }

    return this;
  }

  /**
   * Helper to construct nested Prisma search object for relation fields.
   */
  private buildNestedSearchObject(
    fieldPath: string,
    term: string,
  ): Record<string, any> {
    const parts = fieldPath.split('.');
    if (parts.length === 1) {
      return { [fieldPath]: { contains: term, mode: 'insensitive' } };
    }

    const lastPart = parts.pop()!;
    const nestedObj: Record<string, any> = {
      [lastPart]: { contains: term, mode: 'insensitive' },
    };

    return parts.reduceRight((acc, key) => ({ [key]: acc }), nestedObj);
  }

  /**
   * Dynamically filters fields matching exact values or lists.
   * Excludes reserved pagination, sorting, and search parameter keys.
   */
  public filter(allowedFields?: string[]): this {
    const reservedParams = [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
      'searchTerm',
      'search',
      'startDate',
      'endDate',
      'minAmount',
      'maxAmount',
      'fields',
    ];

    const queryCopy = { ...this.query };
    reservedParams.forEach((param) => delete queryCopy[param]);

    Object.keys(queryCopy).forEach((key) => {
      const val = queryCopy[key];

      if (val === undefined || val === null || val === '') {
        return;
      }

      if (allowedFields && !allowedFields.includes(key)) {
        return;
      }

      const parsedVal = this.parseFilterValue(val);
      this.whereClause[key] = parsedVal;
    });

    return this;
  }

  /**
   * Parses single values or comma-separated lists for Prisma `in` queries.
   */
  private parseFilterValue(val: unknown): any {
    if (typeof val === 'string') {
      const trimmed = val.trim();

      if (trimmed.includes(',')) {
        const items = trimmed
          .split(',')
          .map((item) => this.parseSingleValue(item.trim()));
        return { in: items };
      }

      return this.parseSingleValue(trimmed);
    }

    return val;
  }

  private parseSingleValue(val: string): any {
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
    return val;
  }

  /**
   * Filters records by Date Range (`startDate`, `endDate`).
   */
  public dateRange(
    dateFieldName: string = 'createdAt',
    customStartParam: string = 'startDate',
    customEndParam: string = 'endDate',
  ): this {
    const startDateRaw = this.query[customStartParam]?.toString();
    const endDateRaw = this.query[customEndParam]?.toString();

    const dateFilter: Record<string, Date> = {};

    if (startDateRaw) {
      const startDate = new Date(startDateRaw);
      if (!isNaN(startDate.getTime())) {
        dateFilter.gte = startDate;
      }
    }

    if (endDateRaw) {
      const endDate = new Date(endDateRaw);
      if (!isNaN(endDate.getTime())) {
        if (endDateRaw.length === 10 && !endDateRaw.includes('T')) {
          endDate.setUTCHours(23, 59, 59, 999);
        }
        dateFilter.lte = endDate;
      }
    }

    if (Object.keys(dateFilter).length > 0) {
      this.whereClause[dateFieldName] = {
        ...(this.whereClause[dateFieldName] || {}),
        ...dateFilter,
      };
    }

    return this;
  }

  /**
   * Filters records by Numeric Range (`minAmount`, `maxAmount`).
   */
  public numericRange(
    fieldName: string = 'totalAmount',
    customMinParam: string = 'minAmount',
    customMaxParam: string = 'maxAmount',
  ): this {
    const minRaw = this.query[customMinParam];
    const maxRaw = this.query[customMaxParam];

    const rangeFilter: Record<string, number> = {};

    if (minRaw !== undefined && minRaw !== '') {
      const minNum = Number(minRaw);
      if (!isNaN(minNum)) {
        rangeFilter.gte = minNum;
      }
    }

    if (maxRaw !== undefined && maxRaw !== '') {
      const maxNum = Number(maxRaw);
      if (!isNaN(maxNum)) {
        rangeFilter.lte = maxNum;
      }
    }

    if (Object.keys(rangeFilter).length > 0) {
      this.whereClause[fieldName] = {
        ...(this.whereClause[fieldName] || {}),
        ...rangeFilter,
      };
    }

    return this;
  }

  /**
   * Configures sorting (`sortBy`, `sortOrder`).
   */
  public sort(
    defaultSortBy: string = 'createdAt',
    defaultSortOrder: 'asc' | 'desc' = 'desc',
  ): this {
    const sortBy = this.query.sortBy?.toString() || defaultSortBy;
    const sortOrderRaw = this.query.sortOrder?.toString().toLowerCase();
    const sortOrder: 'asc' | 'desc' =
      sortOrderRaw === 'asc' || sortOrderRaw === 'desc'
        ? sortOrderRaw
        : defaultSortOrder;

    const parts = sortBy.split('.');
    if (parts.length === 1) {
      this.orderByClause = { [sortBy]: sortOrder };
    } else {
      const lastPart = parts.pop()!;
      const nestedObj: Record<string, any> = { [lastPart]: sortOrder };
      this.orderByClause = parts.reduceRight(
        (acc, key) => ({ [key]: acc }),
        nestedObj,
      );
    }

    return this;
  }

  /**
   * Configures pagination parameters (`page`, `limit`, `skip`, `take`).
   */
  public paginate(defaultLimit: number = 10, maxLimit: number = 100): this {
    const rawPage = parseInt(this.query.page?.toString() || '1', 10);
    const rawLimit = parseInt(
      this.query.limit?.toString() || defaultLimit.toString(),
      10,
    );

    this.pageNum = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const safeLimit =
      isNaN(rawLimit) || rawLimit < 1 ? defaultLimit : rawLimit;
    this.limitNum = Math.min(safeLimit, maxLimit);

    this.skipNum = (this.pageNum - 1) * this.limitNum;
    this.takeNum = this.limitNum;

    return this;
  }

  /**
   * Explicitly add custom Prisma condition object to the where clause.
   */
  public addWhereCondition(condition: Record<string, any>): this {
    this.whereClause = {
      ...this.whereClause,
      ...condition,
    };
    return this;
  }

  /**
   * Returns generated `where` clause for Prisma operations.
   */
  public getWhere(): TWhere {
    return this.whereClause as TWhere;
  }

  /**
   * Returns generated `orderBy` clause for Prisma queries.
   */
  public getOrderBy(): TOrderBy {
    return this.orderByClause as TOrderBy;
  }

  /**
   * Returns `{ skip, take }` parameters for Prisma findMany queries.
   */
  public getPaginationParams(): { skip: number; take: number } {
    return {
      skip: this.skipNum,
      take: this.takeNum,
    };
  }

  /**
   * Computes pagination metadata given total record count.
   */
  public getMeta(total: number): IPaginationMeta {
    const totalPage = Math.ceil(total / this.limitNum) || 1;
    return {
      page: this.pageNum,
      limit: this.limitNum,
      total,
      totalPage,
      totalPages: totalPage,
    };
  }
}

export default QueryBuilder;
