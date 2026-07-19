export default function Overlay() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",

        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        background: "transparent",
      }}
    >
      <div
        style={{
          width: 60,
          height: 8,

          borderRadius: 20,

          background: "white",

          boxShadow: "0 0 12px rgba(0,0,0,.2)",
        }}
      />
    </div>
  );
}
