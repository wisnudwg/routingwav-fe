export const PROFILE_KINDS = ["talent", "client"] as const
export type ProfileKind = (typeof PROFILE_KINDS)[number]

export const isProfileKind = (x: unknown): x is ProfileKind => x === "talent" || x === "client"

export const KIND_INFO: Record<ProfileKind, { title: string; desc: string }> = {
  talent: {
    title: "Talent",
    desc: "Saya menawarkan jasa atau produk musik: produksi, mixing, sesi rekaman, sample pack, dan lainnya.",
  },
  client: {
    title: "Client",
    desc: "Saya mencari talent untuk mengerjakan proyek musik saya.",
  },
}

export const ROLES_BY_KIND: Record<ProfileKind, readonly string[]> = {
  talent: [
    "Music Producer",
    "Music Arranger",
    "Songwriter / Composer",
    "Mixing Engineer",
    "Mastering Engineer",
    "Studio Owner / Recording Space",
    "Session Player",
    "Other",
  ],
  client: ["Musician / Soloist", "Group / Band", "Business / Agency / Brand", "Other"],
}

export const OTHER_ROLE = "Other"
export const SESSION_PLAYER_ROLE = "Session Player"