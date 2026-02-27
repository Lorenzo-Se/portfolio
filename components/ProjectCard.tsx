import type { Project } from "@/content/portfolioData";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="glass-panel group rounded-2xl p-6 transition hover:-translate-y-1 hover:border-[#58d5ff]/45">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">{project.title}</h3>
        <span className="text-sm text-white/60">{project.year}</span>
      </div>
      <p className="mb-5 text-sm leading-6 text-white/75">{project.summary}</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="glass-chip rounded-full px-2.5 py-1 text-xs text-white/85"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="text-sm font-medium text-[#58d5ff]">{project.result}</p>
    </article>
  );
}
