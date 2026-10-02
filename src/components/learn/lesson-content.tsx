import { Download, ExternalLink, FileText } from 'lucide-react';
import type { Lesson } from '@/lib/types/api';
import { ButtonLink } from '@/components/ui/button-link';

/**
 * Renders a lesson body by content type.
 *
 * `TEXT` bodies are rich text from the TipTap editor and ARE rendered as HTML.
 * That is only safe because the API sanitises every body against a fixed
 * allowlist at write time (`sanitizeLessonHtml`), so the string arriving here
 * cannot contain a script, an event handler, or a `javascript:` URL. The JWT
 * sits in localStorage on this origin, so that guarantee is load-bearing:
 * never render lesson HTML fetched from anywhere that does not sanitise.
 *
 * Bodies authored before the editor existed are plain text, and are rendered
 * as such rather than being fed through an HTML parser.
 */
export function LessonContent({ lesson }: { lesson: Lesson }) {
  if (lesson.contentType === 'VIDEO') {
    return <VideoContent url={lesson.content} />;
  }

  if (lesson.contentType === 'FILE') {
    return <FileContent url={lesson.content} title={lesson.title} />;
  }

  if (looksLikePlainText(lesson.content)) {
    return (
      <div className="max-w-2xl text-[15px] leading-7 whitespace-pre-wrap">
        {lesson.content}
      </div>
    );
  }

  return (
    <div
      className="lesson-prose max-w-2xl"
      // Server-sanitised; see the note above.
      dangerouslySetInnerHTML={{ __html: lesson.content }}
    />
  );
}

/** Mirrors the backend helper of the same name. */
function looksLikePlainText(content: string): boolean {
  return !/<[a-z][\s\S]*>/i.test(content);
}

/** Hosts we are willing to put inside an iframe. */
const EMBEDDABLE = new Map<string, (url: URL) => string | null>([
  [
    'www.youtube.com',
    (url) => {
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    },
  ],
  ['youtu.be', (url) => `https://www.youtube-nocookie.com/embed${url.pathname}`],
  [
    'vimeo.com',
    (url) => `https://player.vimeo.com/video${url.pathname}`,
  ],
]);

function toEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

    // Direct video files play natively, no iframe needed.
    if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) return null;

    return EMBEDDABLE.get(url.hostname)?.(url) ?? null;
  } catch {
    return null;
  }
}

function isDirectVideo(raw: string): boolean {
  try {
    return /\.(mp4|webm|ogg)$/i.test(new URL(raw).pathname);
  } catch {
    return false;
  }
}

function VideoContent({ url }: { url: string }) {
  const embed = toEmbedUrl(url);

  if (embed) {
    return (
      <div className="bg-muted aspect-video max-w-3xl overflow-hidden rounded-lg">
        <iframe
          src={embed}
          title="Lesson video"
          allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="size-full"
        />
      </div>
    );
  }

  if (isDirectVideo(url)) {
    // No <track> yet: captions are not part of the lesson model.
    return <video controls src={url} className="max-w-3xl rounded-lg" />;
  }

  // Unknown host: link out rather than embedding something arbitrary.
  return (
    <div className="max-w-2xl rounded-lg border p-6">
      <p className="text-muted-foreground text-sm">
        This video is hosted somewhere we do not embed directly.
      </p>
      <ButtonLink className="mt-4" variant="outline" href={url}>
        Open the video <ExternalLink className="ml-1.5 size-3.5" />
      </ButtonLink>
    </div>
  );
}

function FileContent({ url, title }: { url: string; title: string }) {
  return (
    <div className="flex max-w-2xl items-center gap-4 rounded-lg border p-5">
      <FileText className="text-muted-foreground size-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">{url}</p>
      </div>
      <ButtonLink variant="outline" href={url}>
        <Download className="mr-1.5 size-4" /> Open
      </ButtonLink>
    </div>
  );
}
