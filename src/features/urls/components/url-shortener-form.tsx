'use client';

import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { UrlFormData, urlSchema } from '@/lib/types';
import { Input, Button } from '@/components/ui';
import { env } from '@/env';

export const UrlShortenerForm = () => {
  const form = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: '',
      customCode: '',
    },
  });

  return (
    <>
      <div className="w-full max-w-2xl mx-auto">
        <Form {...form}>
          <form className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Paste your long URL here" {...field} disabled={false} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Shorten</Button>
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
                        /r/
                      </span>
                      <Input
                        placeholder="Custom code (optional)"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || '')}
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </>
  );
};
