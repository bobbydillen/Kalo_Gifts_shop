import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "gold" | "outline" | "cream";

type Common = { variant?: Variant; arrow?: boolean; children: ReactNode; className?: string };
type AsLink = Common & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">;

/** Pill button. Pass `href` to render it as a link. */
export function Button(props: AsLink | AsButton) {
  const { variant = "gold", arrow = false, children, className = "", ...rest } = props;
  const classes = `btn btn-${variant} ${className}`;
  const content = (
    <>
      {children}
      {arrow && (
        <span aria-hidden="true" className="arrow">
          →
        </span>
      )}
    </>
  );

  if (typeof rest.href === "string") {
    return (
      <Link className={classes} {...(rest as Omit<AsLink, keyof Common>)}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...(rest as Omit<AsButton, keyof Common>)}>
      {content}
    </button>
  );
}
