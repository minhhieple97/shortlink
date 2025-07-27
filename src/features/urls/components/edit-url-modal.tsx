import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Button,
} from '@/components/ui';
import { Loader2 } from 'lucide-react';
import { useUpdateUrl } from '../hooks/use-update-url';
import { env } from '@/env';

type EditUrlModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  urlId: number;
  currentShortCode: string;
  onSuccess: (newShortCode: string) => void;
};

export const EditUrlModal = ({
  isOpen,
  onOpenChange,
  urlId,
  currentShortCode,
  onSuccess,
}: EditUrlModalProps) => {
  const { onSubmit, isPending, form, handleCancel } = useUpdateUrl({
    urlId,
    currentShortCode,
    onSuccess: (newShortCode) => {
      onSuccess(newShortCode);
      onOpenChange(false);
    },
    isOpen,
    onOpenChange,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Short URL</DialogTitle>
          <DialogDescription>
            Customize the short code for this URL. The short code must be unique and can only
            contain letters, numbers, hyphens, and underscores.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(form.getValues());
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="customCode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">
                        {env.NEXT_PUBLIC_APP_URL}/r/
                      </span>
                      <Input
                        placeholder="Custom code"
                        {...field}
                        disabled={isPending}
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="sm:justify-end">
              <Button type="button" variant={'outline'} onClick={handleCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin size-4 mr-2" />
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
