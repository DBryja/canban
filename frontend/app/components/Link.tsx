import NextLink, { type LinkProps as NextLinkProps } from "next/link";

type LinkProps = NextLinkProps & {
  children: React.ReactNode;
  target?: "_blank" | "_self" | "_parent" | "_top";
};

export default function Link({ href, children, target = "_self" }: LinkProps) {
  let url = href.toString();

  if (url.includes("{{s}}")) {
    url = url.replace(
      "{{s}}",
      process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"
    );
  }

  if (url.includes("{{api}}")) {
    url = url.replace(
      "{{api}}",
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
    );
    if (url.includes("?")) {
      url.replace("?", "?secret=SECRET&");
    } else {
      url += "?secret=SECRET";
    }
  }

  return (
    <NextLink href={url} target={target}>
      {children}
    </NextLink>
  );
}
