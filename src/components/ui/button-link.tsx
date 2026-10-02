import Link from 'next/link';
import { Button } from './button';

type ButtonProps = React.ComponentProps<typeof Button>;

/**
 * A Button that navigates.
 *
 * Base UI's Button assumes a native <button> and warns when composed onto an
 * anchor, so `nativeButton={false}` has to travel with every link-shaped
 * button. Wrapping it once keeps that detail out of every call site.
 */
export function ButtonLink({
  href,
  children,
  ...props
}: Omit<ButtonProps, 'render' | 'nativeButton'> & {
  href: string;
}) {
  return (
    <Button nativeButton={false} render={<Link href={href} />} {...props}>
      {children}
    </Button>
  );
}
