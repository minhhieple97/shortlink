import { UserButton, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { currentUser } from '@clerk/nextjs/server';

export const Header = async () => {
  const user = await currentUser();
  return (
    <header className="fixed z-20 top-0 right-0 left-0 bg-background/90 backdrop-blur-md border-b shadow-sm">
      <div className="container px-4 sm:px-6 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">ShortLink</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <Button size="sm" variant="default">
                Sign In
              </Button>
            </SignInButton>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
