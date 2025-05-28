import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { useQueryState, parseAsString } from 'nuqs';

export const useUrlFilter = (initialFilter: string) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [filter, setFilter] = useQueryState('filter', parseAsString.withDefault(initialFilter));

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', '1');
      params.set(name, value);
      return params.toString();
    },
    [searchParams],
  );

  const handleFilterChange = (filter: string) => {
    router.push(`${pathname}?${createQueryString('filter', filter)}`);
  };

  return {
    currentFilter: filter,
    handleFilterChange: setFilter,
  };
};
