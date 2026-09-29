import { BeyondView } from "@/components/beyond/BeyondView";

/**
 * /beyond/ — Now, Next and Lab. Everything lives in src/components/beyond/
 * (BeyondView) and src/components/lab/ (LabView); the words come from
 * src/content/pages.ts (pages.beyond, beyondModes, beyondCopy), now.ts,
 * next.ts and lab.ts. The page's <title>/meta come from the route table
 * (App mounts <Meta/>).
 */
export default function BeyondPage() {
  return <BeyondView />;
}
