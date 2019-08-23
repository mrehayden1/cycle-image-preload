import { adapt } from '@cycle/run/lib/adapt';
import xs, { Stream } from 'xstream';

export interface ImagePreloadOptions {
  category: string;
  url: string;
}

export interface ImagePreloadSource {
  select: (category: string) => Stream<string>;
}

export default function imagePreloadDriver(
  sink: Stream<ImagePreloadOptions>
): ImagePreloadSource {
  const preloaded: { [i: string]: HTMLImageElement } = {};
  const source: Stream<ImagePreloadOptions> = xs.create();

  function preload(options: ImagePreloadOptions) {
    const { url } = options;
    if (preloaded[url]) {
      source.shamefullySendNext(options);
    } else {
      const image = new Image();
      preloaded[url] = image;

      image
        .addEventListener('load', () => {
          source.shamefullySendNext(options);
        });

      image.src = url;
    }
  }

  function select(category: string) {
    const stream = source
      .filter((opts) => opts.category === category)
      .map((opts) => opts.url);

    return adapt(stream);
  }

  sink
    .addListener({
      next: preload
    });

  return {
    select
  };
}
