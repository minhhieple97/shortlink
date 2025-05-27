import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export const useUrlSearch = (initialSearch: string) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState(initialSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearch('');

    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.set('page', '1');

    router.push(`${pathname}?${params.toString()}`);
  };

  return {
    search,
    setSearch,
    handleSearch,
    clearSearch,
  };
};
