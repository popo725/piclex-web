// Mirrors PracticeFocusGeometry in PracticeDeck.swift so the web question card
// frames the photo exactly like the native practice card: the whole photo is
// covered and zoomed so the labeled object keeps its surrounding context, and
// the target box is drawn where the phone draws it.
//
// `image` is the decoded photo size, `viewport` the photo area on screen and
// `focus.box` the label's normalized (0…1) source rectangle.
export function focusLayout(image, viewport, focus) {
  if (!(image?.width > 0 && image?.height > 0 && viewport?.width > 0 && viewport?.height > 0)) return null;
  if (!focus || !focus.visible) {
    // No positioned object: show the complete photo without zooming.
    const scale = Math.min(viewport.width / image.width, viewport.height / image.height);
    const width = image.width * scale, height = image.height * scale;
    return { image: { x: (viewport.width - width) / 2, y: (viewport.height - height) / 2, width, height }, box: null };
  }
  const [left, top, boxWidth, boxHeight] = focus.box;
  const source = { x: left * image.width, y: top * image.height,
    width: boxWidth * image.width, height: boxHeight * image.height };
  const baseScale = Math.max(viewport.width / image.width, viewport.height / image.height);
  // Keep 30% of the object (at least 3.5% of the photo) visible around it.
  const insetX = Math.max(source.width * 0.30, image.width * 0.035);
  const insetY = Math.max(source.height * 0.30, image.height * 0.035);
  const context = {
    x: Math.max(0, source.x - insetX),
    y: Math.max(0, source.y - insetY),
    right: Math.min(image.width, source.x + source.width + insetX),
    bottom: Math.min(image.height, source.y + source.height + insetY),
  };
  const desired = Math.min(
    viewport.width * 0.68 / Math.max(1, (context.right - context.x) * baseScale),
    viewport.height * 0.58 / Math.max(1, (context.bottom - context.y) * baseScale)
  );
  const scale = baseScale * Math.min(3.2, Math.max(1, desired));
  const size = { width: image.width * scale, height: image.height * scale };
  const center = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  const clamp = (value, scaledLength, viewportLength) => scaledLength > viewportLength
    ? Math.min(scaledLength / 2, Math.max(viewportLength - scaledLength / 2, value))
    : viewportLength / 2;
  const position = {
    x: clamp(viewport.width / 2 + (image.width / 2 - center.x) * scale, size.width, viewport.width),
    y: clamp(viewport.height / 2 + (image.height / 2 - center.y) * scale, size.height, viewport.height),
  };
  return {
    image: { x: position.x - size.width / 2, y: position.y - size.height / 2, ...size },
    box: { x: position.x + (source.x - image.width / 2) * scale,
           y: position.y + (source.y - image.height / 2) * scale,
           width: source.width * scale, height: source.height * scale },
  };
}
