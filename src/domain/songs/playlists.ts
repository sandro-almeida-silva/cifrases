export type Playlist = { id: string; name: string; songIds: string[] };

function update(playlists: Playlist[], id: string, change: (playlist: Playlist) => Playlist): Playlist[] {
  return playlists.map((playlist) => (playlist.id === id ? change(playlist) : playlist));
}

export function createPlaylist(playlists: Playlist[], name: string, id: string): Playlist[] {
  const trimmed = name.trim();
  if (!trimmed) return playlists;
  return [...playlists, { id, name: trimmed, songIds: [] }];
}

export function renamePlaylist(playlists: Playlist[], id: string, name: string): Playlist[] {
  const trimmed = name.trim();
  if (!trimmed) return playlists;
  return update(playlists, id, (playlist) => ({ ...playlist, name: trimmed }));
}

export function deletePlaylist(playlists: Playlist[], id: string): Playlist[] {
  return playlists.filter((playlist) => playlist.id !== id);
}

export function addSongToPlaylist(playlists: Playlist[], id: string, songId: string): Playlist[] {
  const target = playlists.find((playlist) => playlist.id === id);
  if (!target || target.songIds.includes(songId)) return playlists;
  return update(playlists, id, (playlist) => ({ ...playlist, songIds: [...playlist.songIds, songId] }));
}

export function removeSongFromPlaylist(playlists: Playlist[], id: string, songId: string): Playlist[] {
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
  const songIds = [...target.songIds];
  const [moved] = songIds.splice(from, 1);
  if (moved === undefined) return playlists;
  songIds.splice(to, 0, moved);
  return update(playlists, id, (playlist) => ({ ...playlist, songIds }));
}
