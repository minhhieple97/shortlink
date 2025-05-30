'use client';

import { Form, FormControl, FormField, FormItem, Input, Button } from '@/components/ui';
import { env } from '@/env';
import { useShortenUrl } from '../hooks/use-shorten-url';
import { UI_CONSTANTS } from '@/constants';
import { SignIn, SignInButton, useAuth, useSignIn } from '@clerk/nextjs';
import { AnalyzingModal } from '@/components/shared';

export const UrlShortenerForm = () => {
  const { isSignedIn } = useAuth();
  const {
    onSubmit,
    shortUrl,
    isPending,
    form,
    resetForm,
    flagged,
    flagReason,
    handleCopy,
    isAnalyzing,
    setIsAnalyzing,
  } = useShortenUrl();

  return (
    <>
      <div className="w-full max-w-2xl mx-auto">
        {flagged && flagReason && (
          <div className="p-4 mb-4 border border-yellow-300 bg-yellow-50 rounded-md flex flex-col gap-2">
            <p className="font-medium text-yellow-800">⚠️ URL Flagged</p>
            <p className="text-yellow-700">{flagReason}</p>
            <div className="flex justify-center">
              <Button variant="outline" onClick={resetForm} className="w-fit">
                {UI_CONSTANTS.BUTTON_LABELS.CREATE_ANOTHER}
              </Button>
            </div>
          </div>
        )}

        {shortUrl && !flagged && (
          <div className="p-4 mb-4 border rounded-md flex flex-col gap-2">
            <p className="font-medium">Your shortened URL:</p>
            <div className="flex items-center gap-2 mt-2">
              <Input value={shortUrl} readOnly />
              <Button onClick={handleCopy} size="sm">
                {UI_CONSTANTS.BUTTON_LABELS.COPY}
              </Button>
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={resetForm} className="w-fit">
                {UI_CONSTANTS.BUTTON_LABELS.CREATE_ANOTHER}
              </Button>
            </div>
          </div>
        )}

        {!shortUrl && !flagged && (
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isSignedIn) {
                  onSubmit(form.getValues());
                }
              }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={UI_CONSTANTS.FORM_PLACEHOLDERS.URL_INPUT}
                          {...field}
                          disabled={isPending || !isSignedIn}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {isSignedIn ? (
                  <Button type="submit" disabled={isPending}>
                    {isPending
                      ? UI_CONSTANTS.BUTTON_LABELS.SHORTENING
                      : UI_CONSTANTS.BUTTON_LABELS.SHORTEN}
                  </Button>
                ) : (
                  <SignInButton>
                    <Button type="button" disabled={isPending}>
                      Login to shorten
                    </Button>
                  </SignInButton>
                )}
              </div>

              <FormField
                control={form.control}
                name="customCode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground mr-2">
                          {env.NEXT_PUBLIC_APP_URL || window.location.origin}
                          {UI_CONSTANTS.URL_PREFIX_SEPARATOR}
                        </span>
                        <Input
                          placeholder={UI_CONSTANTS.FORM_PLACEHOLDERS.CUSTOM_CODE}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || '')}
                          className="flex-1"
                          disabled={isPending || !isSignedIn}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}
      </div>

      <AnalyzingModal isOpen={isAnalyzing} onOpenChange={setIsAnalyzing} />
    </>
  );
};
