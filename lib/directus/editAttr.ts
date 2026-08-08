import { setAttr } from '@directus/visual-editing';

// setAttr() is a PURE STRING BUILDER — no DOM, no window access. It only
// serialises {collection,item,fields,mode} into the value of a `data-directus`
// attribute, so it is safe to call from React Server Components. The
// client-side <VisualEditing/> bootstrap mounted once in layout.tsx is what
// scans for that attribute and activates the overlay, and only inside
// Directus's editor iframe.
//
// WHY THIS RETURNS AN OBJECT rather than a bare string:
//
// The brief was "identical to the current version". Wrapping blocks in new
// <div>s to carry the attribute would risk exactly that — an extra block box
// inside `space-y`/flex containers changes spacing, and `display: contents`
// avoids the box but leaves the editor overlay with no rect to highlight. So
// every attribute here lands on an element that ALREADY EXISTS, either
// directly in JSX or spread onto a component's existing root via an `editAttr`
// prop. Rendered output for a normal visitor is byte-identical; the only
// difference is one extra HTML attribute.
export type EditAttr = { 'data-directus': string };

export function editAttr(
  collection: string,
  item: string | number | null | undefined,
  fields: string | string[],
  mode: 'popover' | 'drawer' | 'modal' = 'popover',
): EditAttr | undefined {
  // No item means nothing addressable to edit. Returning undefined lets callers
  // spread unconditionally — {...editAttr(...)} of undefined is a no-op — so a
  // missing id degrades to "not editable" rather than emitting a broken
  // attribute that the overlay would attach to and then fail to save.
  if (item === null || item === undefined || item === '') return undefined;
  return { 'data-directus': setAttr({ collection, item, fields, mode }) };
}
