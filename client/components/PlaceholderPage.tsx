import { Link } from "react-router-dom";

export default function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-xl border bg-card p-6 md:p-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
        {description ? (
          <p className="text-foreground/70 mb-6">{description}</p>
        ) : null}
        <p className="text-sm text-foreground/70">
          This page is scaffolded. Continue prompting to fill in detailed content.
          Go back to the <Link className="text-primary underline" to="/">Dashboard</Link> or try the Community Reporting page.
        </p>
      </div>
    </section>
  );
}
