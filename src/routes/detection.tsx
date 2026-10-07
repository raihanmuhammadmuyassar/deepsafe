import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DetectionWorkspace } from "@/components/Detection";

export const Route = createFileRoute("/detection")({
  head: () => ({
    meta: [
      { title: "Detection — DeepSafe" },
      { name: "description", content: "Upload images or videos and evaluate their authenticity with DeepSafe." },
      { property: "og:title", content: "Detection — DeepSafe" },
      { property: "og:description", content: "Upload images or videos and evaluate their authenticity with DeepSafe." },
    ],
  }),
  component: () => (
    <AppShell title="Detection" description="Run the DeepSafe ensemble on an image or video.">
      <DetectionWorkspace />
    </AppShell>
  ),
});
