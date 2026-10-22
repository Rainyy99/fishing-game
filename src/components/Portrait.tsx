/** The fisherman's face in a round brass frame. */
export function Portrait({ size = 64 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="relative inline-block shrink-0 overflow-hidden rounded-full border-3 border-line bg-[#183a5c] shadow-[0_0_0_2px_var(--color-brass)]"
      style={{
        width: size,
        height: size,
        backgroundImage: "url(/art/angler/portrait.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
      }}
    />
  );
}
