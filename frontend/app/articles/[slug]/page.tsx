import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/content/ArticleLayout";
import { articles, getArticle } from "@/content/articles";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getArticle(slug);
  if (!post) return {};
  return {
    title: `${post.title} | RehearseAI Articles`,
    description: post.excerpt,
    alternates: { canonical: `/articles/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt, type: "article", publishedTime: post.publishedAt },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getArticle(slug);
  if (!post) notFound();
  const related = articles.filter((item) => item.slug !== post.slug).slice(0, 3);
  return <ArticleLayout entry={post} related={related} />;
}
