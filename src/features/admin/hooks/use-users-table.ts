import { PAGINATION, ROLE_TYPE, UserRole } from '@/constants';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateUserRole } from '../actions/update-user-role';
import { routes } from '@/routes';

export const useUsersTable = (
  total: number,
  currentPage: number,
  currentSearch: string,
  currentSortBy: string,
  currentSortOrder: string,
) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const limit = PAGINATION.DEFAULT_LIMIT;
  const totalPages = Math.ceil(total / limit);

  const { execute, reset } = useAction(updateUserRole, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success('User role updated successfully', {
          description: `User role has been updated to ${data.role}`,
        });
        router.refresh();
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Failed to update user role');
    },
    onSettled: () => {
      setIsLoading(null);
      reset();
    },
  });

  const preserveParams = () => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    return '';
  };

  const handleSort = (column: string) => {
    const params = new URLSearchParams();

    if (currentSearch) {
      params.set('search', currentSearch);
    }

    params.set('sortBy', column);

    if (currentSortBy === column) {
      params.set('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortOrder', 'asc');
    }

    params.set('page', '1');

    router.push(`${routes.admin.users}?${params.toString()}`);
  };

  const createPaginationUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set('page', targetPage.toString());

    if (currentSearch) params.set('search', currentSearch);
    if (currentSortBy) params.set('sortBy', currentSortBy);
    if (currentSortOrder) params.set('sortOrder', currentSortOrder);

    return `${routes.admin.users}?${params.toString()}`;
  };

  const handleRoleToggle = (userId: string, currentRole: UserRole) => {
    setIsLoading(userId);
    const newRole: UserRole = currentRole === ROLE_TYPE.ADMIN ? ROLE_TYPE.USER : ROLE_TYPE.ADMIN;

    execute({
      userId,
      role: newRole,
    });
  };

  const getUserInitials = (name: string | null) => {
    if (!name) return 'U';

    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
  };

  return {
    // State
    isLoading,
    totalPages,

    // Actions
    handleSort,
    handleRoleToggle,
    createPaginationUrl,
    getUserInitials,
  };
};
