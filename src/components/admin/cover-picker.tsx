'use client';

import { useId, useState } from 'react';
import { ImageUp, Loader2, Trash2, TriangleAlert } from 'lucide-react';
import { uploadsApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CourseCover } from '@/components/course/course-cover';

/**
 * Mirrors multer.config.ts on the API. Validating here too is not redundant:
 * a 6 MB file otherwise uploads in full before the server rejects it, and the
 * error comes back as a bare 400 long after the user moved on.
 *
 * SVG is absent on both sides on purpose — it can carry script and these files
 * are served from the app's own origin.
 */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

function validate(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) {
    return 'Use a JPG, PNG, WebP, AVIF or GIF image.';
  }
  if (file.size > MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `That image is ${mb} MB. The limit is 5 MB.`;
  }
  return null;
}

/**
 * Cover picker.
 *
 * This replaced a plain "cover image URL" text field, which failed in the way
 * URL fields always fail: it accepts any well-formed URL, so an article link
 * pasted in place of an image link validates happily and then renders nothing.
 * Uploading removes the whole class of mistake — whatever lands here is an
 * image, because the browser and the API both checked.
 */
export function CoverPicker({
  value,
  onChange,
  seed,
  title,
}: {
  value: string;
  onChange: (url: string) => void;
  /** Course id where one exists, so the empty-state preview matches the card. */
  seed: string;
  title?: string;
}) {
  const inputId = useId();
  const hintId = useId();
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * A cover stored before this field became an upload can be a link to
   * anything — the URL box accepted any well-formed URL, so article links got
   * saved as covers and then silently rendered nothing. Surface that here
   * instead of letting the editor believe a dead cover is live.
   */
  const [srcBroken, setSrcBroken] = useState(false);

  async function accept(file: File | undefined) {
    if (!file) return;

    const problem = validate(file);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadsApi.image(file);
      setSrcBroken(false);
      onChange(url);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-sm font-medium">
          Cover image
        </label>
        {value && !uploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive h-7 px-2"
            onClick={() => {
              onChange('');
              setError(null);
              setSrcBroken(false);
            }}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Remove
          </Button>
        )}
      </div>

      {/* group wraps input + label: the scrim is nested inside the label, so
          the sibling-only peer-* variants cannot reach it, but focus-within on
          a shared ancestor can. */}
      <div className="group relative">
        {/* sr-only rather than hidden so the input stays keyboard reachable —
            the label below is the visible drop zone. */}
        <input
          id={inputId}
          type="file"
          accept={ACCEPTED.join(',')}
          className="peer sr-only"
          aria-describedby={hintId}
          onChange={(event) => {
            void accept(event.target.files?.[0]);
            // Reset so picking the same file twice still fires a change.
            event.target.value = '';
          }}
        />

        <label
          htmlFor={inputId}
          aria-hidden
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void accept(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            // No `group` of its own: that would shadow the wrapper above and
            // group-focus-within would then track the label, which never holds
            // focus — the input it labels sits outside it.
            'relative block aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-lg border-2 border-dashed',
            'transition-[border-color,box-shadow] duration-[--dur-base] ease-[--ease-out-soft]',
            'peer-focus-visible:ring-ring peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
            dragging
              ? 'border-primary shadow-lifted'
              : 'border-border hover:border-primary/50',
          )}
        >
          <CourseCover
            src={value || null}
            seed={seed}
            title={title}
            className="absolute inset-0 size-full"
            showGlyph={false}
            onSrcError={() => setSrcBroken(true)}
          />

          {/* Scrim carries the instructions over whatever the cover is. It stays
            visible while empty and fades in on hover once an image is set, so
            a chosen cover can actually be seen. */}
          <span
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center',
              'transition-opacity duration-[--dur-base] ease-[--ease-out-soft]',
              // A dead cover keeps the scrim up: there is nothing worth
              // revealing underneath it.
              value && !srcBroken
                ? 'bg-black/55 text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                : 'bg-black/25 text-white opacity-100',
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="size-6 animate-spin" />
                <span className="text-sm font-medium">Uploading…</span>
              </>
            ) : (
              <>
                <ImageUp className="size-6" />
                <span className="text-sm font-medium">
                  {srcBroken && value
                    ? 'Upload a replacement'
                    : value
                      ? 'Replace cover'
                      : 'Upload a cover image'}
                </span>
                <span className="text-xs opacity-90">
                  Drag an image here or click to browse · JPG, PNG, WebP · max 5
                  MB
                </span>
              </>
            )}
          </span>
        </label>
      </div>

      {!error && srcBroken && value && (
        <p className="text-warning flex items-start gap-1.5 text-xs">
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          The saved cover could not be loaded, so learners see a generated one.
          It may be a link to a page rather than to an image file.
        </p>
      )}

      {error ? (
        <p
          id={hintId}
          role="alert"
          className="text-destructive flex items-start gap-1.5 text-xs"
        >
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        <p id={hintId} className="text-muted-foreground text-xs">
          {value && !srcBroken
            ? 'Shown on the course card and the course page.'
            : 'Optional — without one, a cover is generated from the course theme.'}
        </p>
      )}
    </div>
  );
}
