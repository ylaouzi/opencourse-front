import type { CourseStatus } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const STATUS_CLASS: Record<CourseStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PUBLISHED:
    'bg-success-subtle text-success',
  ARCHIVED: 'bg-warning-subtle text-warning',
};

const STATUS_LABEL: Record<CourseStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

export function StatusBadge({ status }: { status: CourseStatus }) {
  return (
    <Badge variant="secondary" className={cn('border-0', STATUS_CLASS[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
