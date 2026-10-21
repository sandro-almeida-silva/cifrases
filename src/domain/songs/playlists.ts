export type PlaylistBlock = { id: string; name: string };

/**
 * `songIds` é sempre a ordem completa de execução. Quando há blocos, as músicas
 * sem bloco vêm primeiro e as demais seguem a ordem dos blocos.
 */
export type Playlist = {
  id: string;
  name: string;
  songIds: string[];
  blocks?: PlaylistBlock[];
  blockBySong?: Record<string, string>;
};

export type PlaylistGroup = { block: PlaylistBlock | null; songIds: string[] };

/** Remove vínculos inválidos e reordena `songIds` conforme a ordem dos blocos. */
export function normalizePlaylist(playlist: Playlist): Playlist {
  if (!playlist.blocks && !playlist.blockBySong) return playlist;
  const blocks = playlist.blocks ?? [];
  const blockIndex = new Map(blocks.map((block, index) => [block.id, index]));
  const members = new Set(playlist.songIds);
  const blockBySong: Record<string, string> = {};
  for (const [songId, blockId] of Object.entries(playlist.blockBySong ?? {})) {
    if (members.has(songId) && blockIndex.has(blockId))
      blockBySong[songId] = blockId;
  }
  const rank = (songId: string) => {
    const blockId = blockBySong[songId];
    return blockId === undefined ? -1 : (blockIndex.get(blockId) ?? -1);
  };
  const songIds = playlist.songIds
    .map((songId, position) => ({ songId, position, rank: rank(songId) }))
    .sort(
      (left, right) => left.rank - right.rank || left.position - right.position,
    )
    .map((item) => item.songId);
  return { ...playlist, songIds, blocks, blockBySong };
}

export function groupPlaylist(playlist: Playlist): PlaylistGroup[] {
  const normalized = normalizePlaylist(playlist);
  const assignment = normalized.blockBySong ?? {};
  const groups: PlaylistGroup[] = [];
  const loose = normalized.songIds.filter((songId) => !assignment[songId]);
  if (loose.length || !normalized.blocks?.length)
    groups.push({ block: null, songIds: loose });
  for (const block of normalized.blocks ?? []) {
    groups.push({
      block,
      songIds: normalized.songIds.filter(
        (songId) => assignment[songId] === block.id,
      ),
    });
  }
  return groups;
}

function update(
  playlists: Playlist[],
  id: string,
  change: (playlist: Playlist) => Playlist,
): Playlist[] {
  return playlists.map((playlist) =>
    playlist.id === id ? normalizePlaylist(change(playlist)) : playlist,
  );
}

export function createPlaylist(
  playlists: Playlist[],
  name: string,
  id: string,
): Playlist[] {
  const trimmed = name.trim();
  if (!trimmed) return playlists;
  return [...playlists, { id, name: trimmed, songIds: [] }];
}

export function renamePlaylist(
  playlists: Playlist[],
  id: string,
  name: string,
): Playlist[] {
  const trimmed = name.trim();
  if (!trimmed) return playlists;
  return update(playlists, id, (playlist) => ({ ...playlist, name: trimmed }));
}

export function deletePlaylist(playlists: Playlist[], id: string): Playlist[] {
  return playlists.filter((playlist) => playlist.id !== id);
}

export function addSongToPlaylist(
  playlists: Playlist[],
  id: string,
  songId: string,
): Playlist[] {
  const target = playlists.find((playlist) => playlist.id === id);
  if (!target || target.songIds.includes(songId)) return playlists;
  return update(playlists, id, (playlist) => ({
    ...playlist,
    songIds: [...playlist.songIds, songId],
  }));
}

export function removeSongFromPlaylist(
  playlists: Playlist[],
  id: string,
  songId: string,
): Playlist[] {
  return update(playlists, id, (playlist) => ({
    ...playlist,
    songIds: playlist.songIds.filter((item) => item !== songId),
  }));
}

export function moveSongInPlaylist(
  playlists: Playlist[],
  id: string,
  songId: string,
  direction: -1 | 1,
): Playlist[] {
  const target = playlists.find((playlist) => playlist.id === id);
  if (!target) return playlists;
  const from = target.songIds.indexOf(songId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= target.songIds.length) return playlists;
  const neighbor = target.songIds[to];
  if (
    neighbor === undefined ||
    target.blockBySong?.[neighbor] !== target.blockBySong?.[songId]
  )
    return playlists;
  const songIds = [...target.songIds];
  const [moved] = songIds.splice(from, 1);
  if (moved === undefined) return playlists;
  songIds.splice(to, 0, moved);
  return update(playlists, id, (playlist) => ({ ...playlist, songIds }));
}

export function addBlockToPlaylist(
  playlists: Playlist[],
  id: string,
  name: string,
  blockId: string,
): Playlist[] {
  const trimmed = name.trim();
  if (!trimmed || !playlists.some((playlist) => playlist.id === id))
    return playlists;
  return update(playlists, id, (playlist) => ({
    ...playlist,
    blocks: [...(playlist.blocks ?? []), { id: blockId, name: trimmed }],
  }));
}

export function renameBlockInPlaylist(
  playlists: Playlist[],
  id: string,
  blockId: string,
  name: string,
): Playlist[] {
  const trimmed = name.trim();
  const target = playlists.find((playlist) => playlist.id === id);
  if (!trimmed || !target?.blocks?.some((block) => block.id === blockId))
    return playlists;
  return update(playlists, id, (playlist) => ({
    ...playlist,
    blocks: (playlist.blocks ?? []).map((block) =>
      block.id === blockId ? { ...block, name: trimmed } : block,
    ),
  }));
}

export function removeBlockFromPlaylist(
  playlists: Playlist[],
  id: string,
  blockId: string,
): Playlist[] {
  const target = playlists.find((playlist) => playlist.id === id);
  if (!target?.blocks?.some((block) => block.id === blockId)) return playlists;
  return update(playlists, id, (playlist) => ({
    ...playlist,
    blocks: (playlist.blocks ?? []).filter((block) => block.id !== blockId),
  }));
}

export function moveBlockInPlaylist(
  playlists: Playlist[],
  id: string,
  blockId: string,
  direction: -1 | 1,
): Playlist[] {
  const blocks = playlists.find((playlist) => playlist.id === id)?.blocks;
  const from = blocks?.findIndex((block) => block.id === blockId) ?? -1;
  const to = from + direction;
  if (!blocks || from < 0 || to < 0 || to >= blocks.length) return playlists;
  const next = [...blocks];
  const [moved] = next.splice(from, 1);
  if (!moved) return playlists;
  next.splice(to, 0, moved);
  return update(playlists, id, (playlist) => ({ ...playlist, blocks: next }));
}

/** Vincula a música ao fim do bloco; `null` a deixa sem bloco. */
export function assignSongToBlock(
  playlists: Playlist[],
  id: string,
  songId: string,
  blockId: string | null,
): Playlist[] {
  const target = playlists.find((playlist) => playlist.id === id);
  if (!target?.songIds.includes(songId)) return playlists;
  if (blockId !== null && !target.blocks?.some((block) => block.id === blockId))
    return playlists;
  return update(playlists, id, (playlist) => {
    const blockBySong = { ...(playlist.blockBySong ?? {}) };
    if (blockId === null) delete blockBySong[songId];
    else blockBySong[songId] = blockId;
    return {
      ...playlist,
      blockBySong,
      songIds: [...playlist.songIds.filter((item) => item !== songId), songId],
    };
  });
}
