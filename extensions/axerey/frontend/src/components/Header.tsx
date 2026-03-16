import React from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <nav className="navbar navbar-dark bg-dark mb-4">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand fw-bold">
          🧠 Ouranigon AI
        </Link>
        <div className="navbar-nav ms-auto d-flex flex-row">
          <Link to="/" className="nav-link text-light me-3">
            📋 Kanban
          </Link>
          <Link to="/reasoning" className="nav-link text-light me-3">
            🧠 Reasoning
          </Link>
          <Link to="/memories" className="nav-link text-light me-3">
            🧠 Memories
          </Link>
          <Link to="/system" className="nav-link text-light me-3">
            📊 System
          </Link>
          <Link to="/ollama" className="nav-link text-light me-3">
            🤖 Ollama
          </Link>
          <Link to="/personas" className="nav-link text-light me-3">
            👤 Personas
          </Link>
          <Link to="/setup" className="nav-link text-light me-3">
            🔐 Setup
          </Link>
          <a href="#" className="nav-link text-light me-3">
            🔍 Search
          </a>
          <Link to="/profile" className="nav-link text-light me-3">
            👤 Profile
          </Link>
          <a href="#" className="nav-link text-light">
            ⚙️ Settings
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Header;
