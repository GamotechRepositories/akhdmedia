import Fuse from 'fuse.js';

const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'slug', weight: 0.2 },
    { name: 'searchKeywords', weight: 0.1 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export const filterActorsBySearch = (actors, query) => {
  const trimmed = query?.trim();
  if (!trimmed) return actors;

  const fuse = new Fuse(actors, FUSE_OPTIONS);
  return fuse.search(trimmed).map((result) => result.item);
};
