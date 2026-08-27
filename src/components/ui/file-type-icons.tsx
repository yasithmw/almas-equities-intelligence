/**
 * FILE-TYPE icons — PowerPoint, Excel, PDF and image — in each format's own colours.
 *
 * The export menu offered four rows drawn in the same two theme colours, so the only
 * thing telling PowerPoint from Excel was the word beside it. A file type is exactly the
 * kind of thing the eye should recognise before it reads: these are the colours a user
 * already knows from their desktop, so the right row is found by looking rather than by
 * scanning labels.
 *
 * ── What these are, and are not ───────────────────────────────────────────
 * Purpose-drawn, brand-COLOURED file-type glyphs — a folded document sheet with the
 * format's letter, in Microsoft's and Adobe's published product colours. They are NOT
 * the official logos: those are trademarked artwork, and reproducing them from memory
 * would ship something that is both legally murkier and visibly not quite right. If your
 * organisation has licensed the real marks, each component below is a single self-
 * contained SVG — swap the body and every call site follows.
 *
 * ── Inline SVG, not an asset ──────────────────────────────────────────────
 * `next.config.ts` builds a strict CSP with no external image host, and these render at
 * 14px inside a dropdown where an HTTP round-trip per row would be visible. Inline also
 * means they inherit nothing from the theme — a file type's colour must not change with
 * the dashboard's, because it is the one part of this UI that means something outside the
 * app.
 */

import type React from "react";

import { cn } from "@/lib/utils";

/**
 * Published product colours, as of writing.
 *
 * Stated as constants rather than inlined per path so a brand refresh is one line each,
 * and so it is obvious these are deliberate values and not theme tokens that drifted.
 */
const BRAND = {
  /** Microsoft PowerPoint. */
  powerpoint: { body: "#C43E1C", fold: "#E86A4C", ink: "#FFFFFF" },
  /** Microsoft Excel. */
  excel: { body: "#217346", fold: "#3FA46A", ink: "#FFFFFF" },
  /** Adobe Acrobat / PDF. */
  pdf: { body: "#B30B00", fold: "#E5342A", ink: "#FFFFFF" },
  /** No vendor owns "an image", so this one takes the app's own accent family. */
  image: { body: "#2563EB", fold: "#60A5FA", ink: "#FFFFFF" },
} as const;

/** Every glyph below has this signature, so a copy table can hold one as a value. */
export type FileTypeIcon = (props: FileTypeIconProps) => React.JSX.Element;

interface FileTypeIconProps {
  className?: string;
  /** Rendered size in px. 14 matches the menu rows; the dialogs use 18. */
  size?: number;
}

/**
 * The shared shape: a document with its top-right corner folded back.
 *
 * One geometry for all four so the row reads as a set — only the colour and the mark
 * change. The fold is what makes a 14px square read as a FILE rather than as a coloured
 * chip, which is the whole job at this size.
 *
 * ── Marks, not letters ────────────────────────────────────────────────────
 * The first version stamped "P" / "X" / "PDF" / "IMG" on the sheet. Two problems, both
 * real: at 14px three letters in 7px type are mush, and SVG `<text>` is DOM text — so a
 * row reading "PDF" contained the string twice, which a user copying the menu or using
 * find-in-page would see, and which made "find the PDF row" ambiguous in tests.
 *
 * Colour carries the recognition (these are the colours from the user's desktop) and the
 * mark reinforces it: a pie for PowerPoint, a grid for Excel, ruled lines for a PDF, a
 * picture for an image.
 */
function FileGlyph({
  palette,
  mark,
  className,
  size = 14,
}: FileTypeIconProps & {
  palette: { body: string; fold: string; ink: string };
  /** Drawn inside the sheet, in `palette.ink`, on a 24×24 grid. */
  mark: React.ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      // `aria-hidden`: every call site puts the format's name in text beside it, so the
      // icon is decoration and announcing it would just repeat the label.
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      {/* Sheet, with the corner cut away for the fold. */}
      <path
        d="M4 3.2a1.7 1.7 0 0 1 1.7-1.7h8.06L20.5 8.2V20.8a1.7 1.7 0 0 1-1.7 1.7H5.7A1.7 1.7 0 0 1 4 20.8Z"
        fill={palette.body}
      />
      {/* The fold itself — a lighter triangle, so the corner reads as turned back. */}
      <path d="M13.76 1.5 20.5 8.2h-6.74Z" fill={palette.fold} />
      <g fill={palette.ink}>{mark}</g>
    </svg>
  );
}

/** PowerPoint — a pie, the motif on its own icon. */
export function PowerPointIcon(props: FileTypeIconProps) {
  return (
    <FileGlyph
      {...props}
      palette={BRAND.powerpoint}
      mark={
        <>
          <circle cx="12" cy="15.2" r="4.1" fillOpacity="0.55" />
          {/* The lit quadrant, which is what makes the circle read as a chart. */}
          <path d="M12 11.1a4.1 4.1 0 0 1 4.1 4.1H12Z" />
        </>
      }
    />
  );
}

/** Excel — a grid of cells. */
export function ExcelIcon(props: FileTypeIconProps) {
  return (
    <FileGlyph
      {...props}
      palette={BRAND.excel}
      mark={
        <>
          <rect x="7.4" y="11.4" width="4" height="3.1" rx="0.5" />
          <rect x="12.6" y="11.4" width="4" height="3.1" rx="0.5" fillOpacity="0.55" />
          <rect x="7.4" y="15.6" width="4" height="3.1" rx="0.5" fillOpacity="0.55" />
          <rect x="12.6" y="15.6" width="4" height="3.1" rx="0.5" />
        </>
      }
    />
  );
}

/** PDF — ruled lines, the shape of a page of prose. */
export function PdfIcon(props: FileTypeIconProps) {
  return (
    <FileGlyph
      {...props}
      palette={BRAND.pdf}
      mark={
        <>
          <rect x="7.4" y="11.6" width="9.2" height="1.5" rx="0.75" />
          <rect x="7.4" y="14.6" width="9.2" height="1.5" rx="0.75" fillOpacity="0.7" />
          <rect x="7.4" y="17.6" width="5.6" height="1.5" rx="0.75" fillOpacity="0.7" />
        </>
      }
    />
  );
}

/** An image — a horizon and a sun, the universal picture mark. */
export function ImageFileIcon(props: FileTypeIconProps) {
  return (
    <FileGlyph
      {...props}
      palette={BRAND.image}
      mark={
        <>
          <circle cx="9.5" cy="13.2" r="1.35" />
          <path d="M7.2 18.9l3.1-3.5 2 2.2 2.2-2.8 2.3 4.1Z" />
        </>
      }
    />
  );
}
