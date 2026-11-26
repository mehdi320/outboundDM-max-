import { IS_ARTIFACT } from "@/api/client";

interface Downloads {
  save(file: { filename: string; data: Blob | string }): Promise<unknown>;
}

// Sur claude.ai, un lien <a download> est inerte : on passe par la capability
// `downloads` (le navigateur peut demander confirmation). En local, lien blob classique.
export async function saveFile(filename: string, content: string, mime: string): Promise<void> {
  if (IS_ARTIFACT) {
    const downloads = (await window.claude?.use("downloads")) as Downloads | null | undefined;
    if (!downloads) throw new Error("Le téléchargement n'est pas disponible dans cette vue.");
    await downloads.save({ filename, data: new Blob([content], { type: mime }) });
    return;
  }
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
