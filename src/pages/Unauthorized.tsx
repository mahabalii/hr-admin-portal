
import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1>403 - Access Denied</h1>

      <h2>Unauthorized Access</h2>

      <p>
        You do not have permission to access this page.
      </p>

      <Link to="/dashboard">
        Go to Dashboard
      </Link>
    </div>
  );
}

export default Unauthorized;
