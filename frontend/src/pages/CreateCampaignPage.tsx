import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";

import { createCampaign } from "../services/campaignService";

import "./CreateCampaignPage.css";

const CreateCampaignPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Campaign name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createCampaign({
        name: name.trim(),
        description: description.trim()
      });

      navigate("/campaigns");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Failed to create campaign"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="create-page">
        <div className="form-card">

          <div className="form-header">
            <h1>Create Campaign</h1>
            <p>
              Set up a new security campaign for your tenant
            </p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label htmlFor="campaign-name">
                Campaign Name
              </label>

              <input
                id="campaign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q1 Phishing Awareness"
                maxLength={120}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="campaign-description">
                Description
              </label>

              <textarea
                id="campaign-description"
                rows={5}
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Briefly describe the purpose of this campaign..."
                maxLength={1000}
              />

              <small className="form-hint">
                {description.length} / 1000 characters
              </small>
            </div>

            <div className="actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/campaigns")}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-btn"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Campaign"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateCampaignPage;