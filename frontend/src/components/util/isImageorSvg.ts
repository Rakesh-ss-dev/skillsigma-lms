const isImageOrSvg = (f: File) => {
    // Most browsers set "image/*" types; some edge cases leave SVG type empty.
    const isImageMime = f.type.startsWith("image/");
    const isSvgMime = f.type === "image/svg+xml";
    const isSvgExt = /\.svg$/i.test(f.name);
    return isImageMime || isSvgMime || isSvgExt;
  };

  export default isImageOrSvg;