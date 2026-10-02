import { ArrowRight, BookOpen, ListChecks, Trophy } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button-link';
import { FeaturedCourses } from '@/components/course/featured-courses';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Structured curricula',
    body: 'Courses are split into modules and lessons that unlock as you go, so you always know what comes next.',
  },
  {
    icon: ListChecks,
    title: 'Quizzes that check understanding',
    body: 'Each module ends with a quiz. Pass it to move on, and review exactly which answers you missed.',
  },
  {
    icon: Trophy,
    title: 'Progress you can see',
    body: 'Every lesson and quiz counts towards one percentage, and a final exam completes the course.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="bg-surface-base relative overflow-hidden border-b">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-primary mb-4 text-sm font-medium">
              Free, structured, self-paced
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Learn a new skill, one module at a time
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl text-lg text-pretty">
              Follow a curriculum built by instructors, complete lessons in
              order, and prove what you have learned with a quiz at the end of
              every module.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink size="lg" href="/courses">
                Browse courses <ArrowRight className="ml-2 size-4" />
              </ButtonLink>
              <ButtonLink size="lg" variant="outline" href="/register">
                Create an account
              </ButtonLink>
            </div>
          </div>

          <dl className="grid gap-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-surface-raised shadow-raised rounded-xl border p-5"
              >
                <dt className="flex items-center gap-2 font-medium">
                  <Icon className="text-primary size-5" />
                  {title}
                </dt>
                <dd className="text-muted-foreground mt-2 text-sm">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-surface-sunken border-b">
        <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Recently published
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Fresh courses from our instructors
            </p>
          </div>
          <ButtonLink variant="ghost" href="/courses">
            See all <ArrowRight className="ml-1 size-4" />
          </ButtonLink>
        </div>

          <FeaturedCourses />
        </div>
      </section>
    </>
  );
}
