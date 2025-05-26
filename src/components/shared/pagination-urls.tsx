'use client';

import { useRouter } from 'next/navigation';
import { TablePagination } from './table-pagination';
import { PaginationInfo } from '@/features/urls/types';
import { routes } from '@/routes';

type PaginationUrlsProps = {
  pagination: PaginationInfo;
  className?: string;
};

export const PaginationUrls = ({ pagination, className }: PaginationUrlsProps) => {
  const router = useRouter();

  const handlePageChange = (newPage: number) => {
    router.push(`${routes.dashboard.root}?page=${newPage}`);
  };

  return (
    <TablePagination
      pagination={pagination}
      onPageChange={handlePageChange}
      className={className}
    />
  );
};
