import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div>
      <Link to="/dashboard">
        Dashboard
      </Link>

      <br />

      <Link to="/campaigns">
        Campaigns
      </Link>

      <br />

      <Link to="/events">
        Events
      </Link>

      <br />

      <Link to="/users">
        Users
      </Link>

      <br />

      <Link to="/audit-logs">
        Audit Logs
      </Link>
    </div>
  );
}