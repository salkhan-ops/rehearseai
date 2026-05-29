export type ContentKind = "blog" | "article";

export type ContentEntry = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  readTime: string;
  publishedAt: string;
  heroImage: string;
  tags: string[];
  kind: ContentKind;
  content: Array<
    | { type: "paragraph"; text: string }
    | { type: "heading"; text: string }
    | { type: "quote"; text: string }
    | { type: "insight"; title: string; text: string }
  >;
};
