'use client';

import { Copy, Edit, ExternalLink, QrCode, Trash2Icon, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';
import { IUrl } from '../types';
import { QRCodeModal } from './qr-code-modal';
import { EditUrlModal } from './edit-url-modal';
import { useUserUrlsTable } from '../hooks/use-user-urls-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { truncateUrl } from '@/lib/utils';

type IUserUrlsTableProps = {
  urls: IUrl[];
};

export const UserUrlsTable = ({ urls }: IUserUrlsTableProps) => {
  const {
    localUrls,
    isDeleting,
    qrCodeUrl,
    qrCodeShortCode,
    isQrCodeModalOpen,
    isEditModalOpen,
    urlToEdit,
    copyToClipboard,
    handleDelete,
    showQrCode,
    handleEdit,
    handleEditSuccess,
    setIsQrCodeModalOpen,
    setIsEditModalOpen,
    getShortUrl,
  } = useUserUrlsTable({ initialUrls: urls });

  if (localUrls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <p className="text-muted-foreground mb-4">You haven&apos;t created any short URLs yet.</p>
          <p className="text-sm text-muted-foreground">
            Create your first short URL using the form above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%] sm:w-[40%]">Original URL</TableHead>
              <TableHead className="w-[30%] sm:w-[30%]">Short URL</TableHead>
              <TableHead className="w-[10%]">Clicks</TableHead>
              <TableHead className="w-[15%] sm:w-[20%]">Created</TableHead>
              <TableHead className="w-[10%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localUrls.map((url) => {
              const shortUrl = getShortUrl(url.shortCode);

              return (
                <TableRow key={url.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="truncate text-sm flex-1 min-w-0" title={url.originalUrl}>
                        {truncateUrl(url.originalUrl, 50)}
                      </div>
                      <a
                        href={url.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="truncate text-sm font-mono flex-1 min-w-0" title={shortUrl}>
                        {truncateUrl(shortUrl, 35)}
                      </div>
                      <Button
                        variant={'ghost'}
                        size={'icon'}
                        onClick={() => copyToClipboard(url.shortCode)}
                        className="size-8 flex-shrink-0"
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{url.clicks}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <div
                      className="truncate text-sm"
                      title={formatDistanceToNow(new Date(url.createdAt), { addSuffix: true })}
                    >
                      {formatDistanceToNow(new Date(url.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      {/* Desktop Actions */}
                      <div className="hidden sm:flex gap-1">
                        <Button
                          variant={'ghost'}
                          size={'icon'}
                          onClick={() => showQrCode(url.shortCode)}
                          className="size-8"
                          title="Generate QR Code"
                        >
                          <QrCode className="size-4" />
                        </Button>
                        <Button
                          variant={'ghost'}
                          size={'icon'}
                          onClick={() => handleEdit(url.id, url.shortCode)}
                          className="size-8"
                          title="Edit URL"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant={'ghost'}
                          size={'icon'}
                          onClick={() => handleDelete(url.id)}
                          disabled={isDeleting === url.id}
                          className="size-8 text-destructive hover:text-destructive"
                          title="Delete URL"
                        >
                          {isDeleting === url.id ? (
                            <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Trash2Icon className="size-4" />
                          )}
                        </Button>
                      </div>

                      {/* Mobile Actions - Dropdown */}
                      <div className="sm:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant={'ghost'} size={'icon'} className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => showQrCode(url.shortCode)}>
                              <QrCode className="size-4 mr-2" />
                              QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(url.id, url.shortCode)}>
                              <Edit className="size-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(url.id)}
                              disabled={isDeleting === url.id}
                              className="text-destructive focus:text-destructive"
                            >
                              {isDeleting === url.id ? (
                                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                              ) : (
                                <Trash2Icon className="size-4 mr-2" />
                              )}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <QRCodeModal
        isOpen={isQrCodeModalOpen}
        onOpenChange={setIsQrCodeModalOpen}
        url={qrCodeUrl}
        shortCode={qrCodeShortCode}
      />

      {urlToEdit && (
        <EditUrlModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          urlId={urlToEdit.id}
          currentShortCode={urlToEdit.shortCode}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};
