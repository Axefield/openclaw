import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Row,
  Col,
  Button,
  Alert,
  Badge,
  Table,
} from "reactstrap";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    const storedKey = localStorage.getItem("axerey_api_key");
    if (storedKey) {
      setApiKey(storedKey);
      fetchUserProfile(storedKey);
    } else {
      setLoading(false);
      setError(
        "No API key found. Please set up your API key in the Setup page.",
      );
    }
  }, []);

  const fetchUserProfile = async (key: string) => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3122/api";
      const response = await fetch(`${apiUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to fetch user profile");
      }
    } catch (err) {
      setError("Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem("axerey_api_key", newKey);
  };

  const handleRefresh = () => {
    if (apiKey) {
      setLoading(true);
      setError(null);
      fetchUserProfile(apiKey);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <Row>
        <Col md={8} lg={6}>
          <Card className="mb-4">
            <CardHeader className="bg-primary text-white">
              <h4 className="mb-0">👤 User Profile</h4>
            </CardHeader>
            <CardBody>
              {error && (
                <Alert color="warning" className="mb-3">
                  {error}
                </Alert>
              )}

              {user && (
                <Table responsive>
                  <tbody>
                    <tr>
                      <th style={{ width: "40%" }}>Username</th>
                      <td>{user.username}</td>
                    </tr>
                    <tr>
                      <th>Email</th>
                      <td>{user.email}</td>
                    </tr>
                    <tr>
                      <th>Role</th>
                      <td>
                        <Badge
                          color={user.role === "admin" ? "danger" : "primary"}
                        >
                          {user.role}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <th>Status</th>
                      <td>
                        <Badge color={user.isActive ? "success" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <th>User ID</th>
                      <td>
                        <code className="small">{user.id}</code>
                      </td>
                    </tr>
                    <tr>
                      <th>Created</th>
                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                    <tr>
                      <th>Last Updated</th>
                      <td>{formatDate(user.updatedAt)}</td>
                    </tr>
                  </tbody>
                </Table>
              )}

              <div className="mt-3">
                <h6>API Key</h6>
                <div className="d-flex gap-2">
                  <input
                    type="password"
                    className="form-control"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    placeholder="Enter your API key"
                  />
                  <Button color="primary" onClick={handleRefresh}>
                    Refresh
                  </Button>
                </div>
                <small className="text-muted">
                  API key is stored in localStorage
                </small>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
