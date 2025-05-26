import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UrlShortenerForm, UserUrlsTable } from '@/features/urls/components';
import { getUserUrls } from '@/features/urls/queries';
import { isAdmin } from '@/lib/utils';
import { currentUser } from '@clerk/nextjs/server';
import { Metadata } from 'next';
import Link from 'next/link';
import { env } from '@/env';
import { routes } from '@/routes';
import { PAGINATION } from '@/constants';
import { PaginationUrls } from '@/components/shared/pagination-urls';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard | ShortLink',
  description: 'Dashboard page',
};

type DashboardPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await currentUser();
  const params = await searchParams;
  const page = parseInt(params.page || PAGINATION.DEFAULT_PAGE.toString(), 10);

  const { urls, pagination } = await getUserUrls({
    userId: user!.id,
    page,
    limit: PAGINATION.DEFAULT_LIMIT,
  });
  return (
    <div className="w-full max-w-none space-y-6 lg:space-y-8">
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
              <PaginationUrls pagination={pagination} className="hidden sm:block" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0 lg:px-6">
            <div className="px-4 lg:px-0">
              <UserUrlsTable
                key={`page-${page}`}
                urls={urls}
                pagination={pagination}
                currentPage={page}
              />
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
