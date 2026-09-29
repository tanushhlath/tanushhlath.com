import { WorkIndex } from "@/components/work";

/**
 * /work/ — Built, Did, Recognized, All. Everything lives in
 * src/components/work/ (see WorkIndex); the page's <title>/meta come from
 * the route table (App mounts <Meta/>), its copy from src/content/pages.ts.
 */
export default function WorkPage() {
  return <WorkIndex />;
}
