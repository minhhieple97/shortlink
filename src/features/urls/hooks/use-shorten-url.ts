'use client';

import { useAction } from 'next-safe-action/hooks';
import { shortenUrl } from '../actions/shorten-url';
import { useState } from 'react';
import { IUrlFormData } from '../types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { UrlFormSchema } from '../schemas';
import { toast } from 'sonner';
import { UI_CONSTANTS } from '@/constants';

export const useShortenUrl = () => {
  const form = useForm<IUrlFormData>({
    resolver: zodResolver(UrlFormSchema),
    defaultValues: {
      url: '',
      customCode: '',
    },
  });

  const {
    execute,
    result,
    isPending,
    reset: resetAction,
  } = useAction(shortenUrl, {
    onSuccess: (result) => {
      if (result.data?.flagged && result.data?.flagReason) {
        toast.warning(`URL flagged: ${result.data.flagReason}`);
        return;
      }
      if (result.data?.shortUrl) {
        toast.success(
          `${UI_CONSTANTS.TOAST_MESSAGES.SHORT_URL_SUCCESS_PREFIX}${result.data.shortUrl}`,
        );
      }
    },
    onError: (error) => {
      if (error.error.validationErrors) {
        const fieldErrors = error.error.validationErrors.fieldErrors;
        const formErrors = error.error.validationErrors.formErrors;

        if (fieldErrors?.url) {
          toast.error(`${UI_CONSTANTS.TOAST_MESSAGES.URL_ERROR_PREFIX}${fieldErrors.url[0]}`);
        }
        if (fieldErrors?.customCode) {
          toast.error(
            `${UI_CONSTANTS.TOAST_MESSAGES.CUSTOM_CODE_ERROR_PREFIX}${fieldErrors.customCode[0]}`,
          );
        }

        if (formErrors && formErrors.length > 0) {
          toast.error(formErrors[0]);
        }
      }

      if (error.error.serverError) {
        toast.error(error.error.serverError);
      }
    },
  });

  const onSubmit = async (data: IUrlFormData) => {
    const isValid = await form.trigger();
    if (!isValid) {
      const errors = form.formState.errors;
      if (errors.url?.message) {
        toast.error(errors.url.message);
        return;
      }
      if (errors.customCode?.message) {
        toast.error(errors.customCode.message);
        return;
      }
      toast.error(UI_CONSTANTS.TOAST_MESSAGES.VALIDATION_FALLBACK);
      return;
    }
    execute(data);
  };

  const resetForm = () => {
    form.reset();
    resetAction();
  };
  const handleCopy = () => {
    if (result?.data?.shortUrl) {
      navigator.clipboard.writeText(result.data.shortUrl);
      toast.success(UI_CONSTANTS.TOAST_MESSAGES.COPY_SUCCESS);
      toast.success(`${UI_CONSTANTS.TOAST_MESSAGES.COPY_SUCCESS}`);
    }
  };

  return {
    onSubmit,
    isPending,
    form,
    shortUrl: result?.data?.shortUrl,
    flagged: result?.data?.flagged,
    flagReason: result?.data?.flagReason,
    resetForm,
    handleCopy,
  };
};
