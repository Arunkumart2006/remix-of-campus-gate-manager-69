import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome to Campus Gate 🚪</h1>
      <p>Smart Campus Management System</p>

      <button
        onClick={() => navigate("/login")}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer"
        }}
      >
        Go to Login
      </button>
    </div>
  );
}

export default Home;
