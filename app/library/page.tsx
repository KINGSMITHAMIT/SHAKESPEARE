import type { Metadata } from "next";
import LibraryReader from "./reader";
export const metadata: Metadata = {
  title: "The Dialogue Library — The Bard’s Quill",
  description:
    "Explore source-checked dramatic passages with attribution, reading context, and links to the complete works.",
};
export default function LibraryPage() {
  return <LibraryReader />;
}
