import { Link } from "react-router-dom";
import { ShieldX, LayoutDashboard, ArrowLeft } from "lucide-react";

function Unauthorized() {
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-card">

        <div className="unauthorized-icon">
          <ShieldX size={38} />
        </div>

        <span className="unauthorized-code">403</span>

        <h1>Access Denied</h1>

        <p className="unauthorized-subtitle">
          Unauthorized Access
        </p>

        <p className="unauthorized-message">
          You do not have permission to access this page.
          Please contact your administrator if you think this is a mistake.
        </p>

        <div className="unauthorized-actions">
          <Link to="/dashboard" className="unauthorized-dashboard-btn">
            <LayoutDashboard size={18} />
            Go to Dashboard
          </Link>

          <button
            className="unauthorized-back-btn"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={17} />
            Go Back
          </button>
        </div>

        <div className="unauthorized-footer">
          HR Admin Portal · Secure Access
        </div>

      </div>
    </div>
  );
}

export default Unauthorized;