declare module 'heic-convert' {
  interface ConvertOptions {
    buffer: Uint8Array | Buffer;
    format: 'JPEG' | 'PNG';
    quality?: number;
  }

  function convert(options: ConvertOptions): Promise<ArrayBuffer | Buffer>;
  export = convert;
}
