import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UrlShortenerForm, UserUrlsTable, UserUrlsTableSkeleton } from '@/features/urls/components';
import { getUserUrls } from '@/features/urls/queries';
import { isAdmin } from '@/lib/utils';
import { currentUser } from '@clerk/nextjs/server';
import { Metadata } from 'next';
import Link from 'next/link';
import { env } from '@/env';
import { routes } from '@/routes';
import { PAGINATION } from '@/constants';
import { PaginationUrls } from '@/components/shared/pagination-urls';
import { createSearchParamsCache, parseAsInteger } from 'nuqs/server';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard | ShortLink',
  description: 'Dashboard page',
};

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(PAGINATION.DEFAULT_PAGE),
});

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await currentUser();
  const { page } = searchParamsCache.parse(await searchParams);

  const urlsPromise = getUserUrls({
    userId: user!.id,
    page,
    limit: PAGINATION.DEFAULT_LIMIT,
  });

  return (
    <div className="w-full space-y-6 lg:space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm lg:text-base text-muted-foreground">
          Create and manage your shortened URLs
        </p>
      </div>

      <div className="grid gap-4 lg:gap-6">
        <Card className="shadow-sm border-border/50 w-full">
          <CardHeader className="pb-3 lg:pb-4">
            <CardTitle className="text-lg lg:text-xl">Create New Short URL</CardTitle>
            <CardDescription className="text-xs lg:text-sm">
              Enter a long URL to create a shortened link. You can also customize the short code.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <UrlShortenerForm />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-dashed border-border/50 w-full overflow-hidden">
          <CardHeader className="pb-3 lg:pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg lg:text-xl">Your URLs</CardTitle>
                <CardDescription className="text-xs lg:text-sm">
                  Manage and track your shortened URLs.
                </CardDescription>
              </div>
              <Suspense fallback={<div className="hidden sm:block" />}>
                <PaginationWrapper urlsPromise={urlsPromise} />
              </Suspense>
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0 lg:px-6">
            <div className="px-4 lg:px-0">
              <Suspense fallback={<UserUrlsTableSkeleton />}>
                <UserUrlsTable key={`page-${page}`} urlsPromise={urlsPromise} currentPage={page} />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        {env.NODE_ENV === 'development' && user && isAdmin(user) && (
          <div className="flex justify-center pt-2 lg:pt-4">
            <Link
              href={routes.admin.root}
              className="inline-flex items-center text-xs lg:text-sm text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors"
            >
              Admin Tools
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

async function PaginationWrapper({
  urlsPromise,
}: {
  urlsPromise: Promise<{ urls: any[]; pagination: any }>;
}) {
  const { pagination } = await urlsPromise;
  return <PaginationUrls pagination={pagination} className="hidden sm:block" />;
}
