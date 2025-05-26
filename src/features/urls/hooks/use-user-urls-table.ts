'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { IUrl } from '../types';

type UseUserUrlsTableProps = {
  initialUrls: IUrl[];
};

export const useUserUrlsTable = ({ initialUrls }: UseUserUrlsTableProps) => {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [localUrls, setLocalUrls] = useState<IUrl[]>(initialUrls);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrCodeShortCode, setQrCodeShortCode] = useState<string>('');
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [urlToEdit, setUrlToEdit] = useState<{
    id: number;
    shortCode: string;
  } | null>(null);

  const getBaseUrl = () => {
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  };

  const getShortUrl = (shortCode: string) => {
    return `${getBaseUrl()}/r/${shortCode}`;
  };

  const copyToClipboard = async (shortCode: string) => {
    const shortUrl = getShortUrl(shortCode);

    try {
      await navigator.clipboard.writeText(shortUrl);
      toast.success('Short URL copied to clipboard', {
        description: 'The short URL has been copied to your clipboard',
      });
    } catch (error) {
      console.error('Failed to copy short URL to clipboard', error);
      toast.error('Failed to copy to clipboard', {
        description: 'Please try again or copy manually',
      });
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);

    try {
      // TODO: Implement actual delete API call
      // const response = await deleteUrl(id);
      // if (response.success) {
      //   setLocalUrls((prev) => prev.filter((url) => url.id !== id));
      //   toast.success('URL deleted successfully', {
      //     description: 'The URL has been deleted successfully',
      //   });
      // } else {
      //   toast.error('Failed to delete URL', {
      //     description: response.error || 'An error occurred',
      //   });
      // }

      // Temporary simulation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLocalUrls((prev) => prev.filter((url) => url.id !== id));
      toast.success('URL deleted successfully', {
        description: 'The URL has been deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete URL', error);
      toast.error('Failed to delete URL', {
        description: 'An error occurred while deleting the URL',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const showQrCode = (shortCode: string) => {
    const shortUrl = getShortUrl(shortCode);
    setQrCodeUrl(shortUrl);
    setQrCodeShortCode(shortCode);
    setIsQrCodeModalOpen(true);
  };

  const handleEdit = (id: number, shortCode: string) => {
    setUrlToEdit({ id, shortCode });
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (newShortCode: string) => {
    if (!urlToEdit) return;

    setLocalUrls((prev) =>
      prev.map((url) => (url.id === urlToEdit.id ? { ...url, shortCode: newShortCode } : url)),
    );

    toast.success('URL updated successfully', {
      description: 'The short code has been updated',
    });
  };

  const closeQrCodeModal = () => {
    setIsQrCodeModalOpen(false);
    setQrCodeUrl('');
    setQrCodeShortCode('');
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setUrlToEdit(null);
  };

  return {
    // State
    localUrls,
    isDeleting,
    qrCodeUrl,
    qrCodeShortCode,
    isQrCodeModalOpen,
    isEditModalOpen,
    urlToEdit,

    // Actions
    copyToClipboard,
    handleDelete,
    showQrCode,
    handleEdit,
    handleEditSuccess,
    closeQrCodeModal,
    closeEditModal,

    // Modal setters
    setIsQrCodeModalOpen,
    setIsEditModalOpen,

    // Utilities
    getShortUrl,
  };
};
