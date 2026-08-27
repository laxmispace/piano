import Piano from "./Piano";

export default function App() {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: "#c5c4ca" }}
    >
      <div style={{ width: 580, height: 272 }}>
        <Piano />
      </div>
      {/* Keyboard hint */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 11,
          fontFamily: "Inter, sans-serif",
          color: "rgba(80,78,90,0.7)",
          letterSpacing: "0.04em",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        Click keys or use keyboard: Z S X D C · V G B H N J M
      </div>
    </div>
  );
}
